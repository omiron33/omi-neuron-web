import type { Database } from '../../storage/database';
import type { EmbeddingProvider } from '../providers/embedding-provider';
import { OpenAIEmbeddingProvider } from '../providers/openai/openai-embedding-provider';
import type { GraphStoreContext } from '../store/graph-store';
import { resolveScope } from '../store/graph-store';

export interface EmbeddingsConfig {
  openaiApiKey: string;
  model: 'text-embedding-ada-002' | 'text-embedding-3-small' | 'text-embedding-3-large';
  dimensions?: number;
  batchSize: number;
  rateLimit: number;
  cacheTTL: number;
  maxRetries: number;
}

export interface EmbeddingResult {
  nodeId: string;
  embedding: number[];
  model: string;
  tokenCount: number;
  cached: boolean;
}

export class EmbeddingsService {
  private provider: EmbeddingProvider;
  private scope: string;

  constructor(
    private config: EmbeddingsConfig,
    private db: Database,
    provider?: EmbeddingProvider,
    context?: GraphStoreContext
  ) {
    this.provider = provider ?? new OpenAIEmbeddingProvider({ apiKey: config.openaiApiKey });
    this.scope = resolveScope(context);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.provider.embed({
      model: this.config.model,
      input: text,
      dimensions: this.config.dimensions,
    });
    return response.embeddings[0] ?? [];
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.provider.embed({
      model: this.config.model,
      input: texts,
      dimensions: this.config.dimensions,
    });
    return response.embeddings;
  }

  async embedNode(nodeId: string): Promise<EmbeddingResult> {
    const node = await this.db.queryOne<{ id: string; content: string | null; embedding: number[] | null; embedding_generated_at: Date | null; }>(
      'SELECT id, content, embedding, embedding_generated_at FROM nodes WHERE id = $1 AND scope = $2',
      [nodeId, this.scope]
    );

    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const cached = await this.getCachedEmbedding(nodeId);
    if (cached) {
      return {
        nodeId,
        embedding: cached,
        model: this.config.model,
        tokenCount: this.countTokens(node.content ?? ''),
        cached: true,
      };
    }

    const text = node.content ?? '';
    const embedding = await this.withRetry(() => this.generateEmbedding(text));
    await this.cacheEmbedding(nodeId, embedding, this.config.model);

    return {
      nodeId,
      embedding,
      model: this.config.model,
      tokenCount: this.countTokens(text),
      cached: false,
    };
  }

  async embedNodes(nodeIds: string[]): Promise<{
    results: EmbeddingResult[];
    errors: Array<{ nodeId: string; error: string }>;
  }> {
    return this.embedNodesWithProgress(nodeIds);
  }

  async embedNodesWithProgress(
    nodeIds: string[],
    options?: {
      signal?: AbortSignal;
      onProgress?: (progress: { processed: number; total: number; currentItem?: string }) => void;
    }
  ): Promise<{
    results: EmbeddingResult[];
    errors: Array<{ nodeId: string; error: string }>;
  }> {
    const results: EmbeddingResult[] = [];
    const errors: Array<{ nodeId: string; error: string }> = [];

    const batches = [];
    for (let i = 0; i < nodeIds.length; i += this.config.batchSize) {
      batches.push(nodeIds.slice(i, i + this.config.batchSize));
    }

    const total = nodeIds.length;
    let processed = 0;
    options?.onProgress?.({ processed, total, currentItem: processed ? nodeIds[processed - 1] : undefined });

    for (const batch of batches) {
      if (options?.signal?.aborted) {
        const error = new Error('AbortError');
        error.name = 'AbortError';
        throw error;
      }
      try {
        const nodes = await this.db.query<{ id: string; content: string | null }>(
          'SELECT id, content FROM nodes WHERE id = ANY($1) AND scope = $2',
          [batch, this.scope]
        );

        const texts = nodes.map((node) => node.content ?? '');
        const embeddings = await this.withRetry(() => this.generateBatchEmbeddings(texts));

        for (let idx = 0; idx < nodes.length; idx += 1) {
          const node = nodes[idx];
          const embedding = embeddings[idx];
          await this.cacheEmbedding(node.id, embedding, this.config.model);
          results.push({
            nodeId: node.id,
            embedding,
            model: this.config.model,
            tokenCount: this.countTokens(node.content ?? ''),
            cached: false,
          });
        }

        await this.applyRateLimit();
      } catch (error) {
        batch.forEach((nodeId) => {
          errors.push({ nodeId, error: error instanceof Error ? error.message : String(error) });
        });
      } finally {
        processed += batch.length;
        options?.onProgress?.({ processed, total, currentItem: batch[batch.length - 1] });
      }
    }

    return { results, errors };
  }

  async getCachedEmbedding(nodeId: string): Promise<number[] | null> {
    const row = await this.db.queryOne<{ embedding: number[] | null; embedding_generated_at: Date | null; embedding_model: string | null }>(
      'SELECT embedding, embedding_generated_at, embedding_model FROM nodes WHERE id = $1 AND scope = $2',
      [nodeId, this.scope]
    );
    if (!row?.embedding) return null;

    if (row.embedding_model !== this.config.model) return null;
    if (!row.embedding_generated_at) return row.embedding;

    const ageSeconds = (Date.now() - row.embedding_generated_at.getTime()) / 1000;
    if (ageSeconds > this.config.cacheTTL) return null;

    return row.embedding;
  }

  async cacheEmbedding(nodeId: string, embedding: number[], model: string): Promise<void> {
    await this.db.execute(
      'UPDATE nodes SET embedding = $1, embedding_model = $2, embedding_generated_at = NOW() WHERE id = $3 AND scope = $4',
      [embedding, model, nodeId, this.scope]
    );
  }

  async invalidateCache(nodeIds?: string[]): Promise<void> {
    if (nodeIds?.length) {
      await this.db.execute(
        'UPDATE nodes SET embedding = NULL, embedding_model = NULL, embedding_generated_at = NULL WHERE id = ANY($1) AND scope = $2',
        [nodeIds, this.scope]
      );
      return;
    }
    await this.db.execute(
      'UPDATE nodes SET embedding = NULL, embedding_model = NULL, embedding_generated_at = NULL WHERE scope = $1',
      [this.scope]
    );
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  estimateCost(nodeCount: number): { tokens: number; cost: number } {
    const tokens = nodeCount * 512;
    const pricePerMillion = this.config.model === 'text-embedding-3-large'
      ? 0.13
      : this.config.model === 'text-embedding-3-small'
      ? 0.02
      : 0.1;
    const cost = (tokens / 1_000_000) * pricePerMillion;
    return { tokens, cost };
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (attempt <= this.config.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        attempt += 1;
        if (attempt > this.config.maxRetries) {
          throw error;
        }
        const delay = 500 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Exceeded retry attempts');
  }

  private async applyRateLimit(): Promise<void> {
    const delayMs = Math.ceil(60_000 / this.config.rateLimit);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
