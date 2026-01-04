import type { NeuronConfig } from '../../core/types/settings';
import { semanticSearchRequestSchema, findSimilarRequestSchema } from '../../core/schemas/api';
import { createDatabase } from '../../storage/factory';
import { EmbeddingsService } from '../../core/analysis/embeddings-service';
import { ScoringEngine } from '../../core/analysis/scoring-engine';

export const createSearchRoutes = (config: NeuronConfig) => {
  const db = createDatabase(config);
  const embeddings = new EmbeddingsService(
    {
      openaiApiKey: config.openai.apiKey,
      model: config.analysis.embeddingModel,
      batchSize: config.analysis.embeddingBatchSize,
      rateLimit: config.analysis.openaiRateLimit,
      cacheTTL: config.analysis.embeddingCacheTTL,
      maxRetries: config.openai.maxRetries ?? 3,
    },
    db
  );
  const scoring = new ScoringEngine(db);

  return {
    async POST(request: Request) {
      const url = new URL(request.url);
      if (url.pathname.endsWith('/similar')) {
        const body = await request.json();
        const input = findSimilarRequestSchema.parse(body);
        const results = await scoring.findSimilar(input.nodeId, input.limit ?? 10, input.excludeConnected ?? false);
        return Response.json({ results });
      }

      const body = await request.json();
      const input = semanticSearchRequestSchema.parse(body);
      const embedding = await embeddings.generateEmbedding(input.query);
      const results = await scoring.scoreForQuery(embedding);
      return Response.json({ results: results.slice(0, input.limit ?? 10) });
    },
  };
};
