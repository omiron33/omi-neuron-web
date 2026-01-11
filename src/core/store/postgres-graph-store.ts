import type { Database } from '../../storage/database';
import { GraphQueryBuilder } from '../../api/query-builder';
import { EdgeRepository } from '../../api/repositories/edge-repository';
import { NodeRepository } from '../../api/repositories/node-repository';
import { SettingsRepository } from '../../api/repositories/settings-repository';
import type { ExpandGraphRequest, ExpandGraphResponse, FindPathRequest, FindPathResponse, GetGraphParams, GetGraphResponse } from '../types/api';
import type { NeuronEdge, NeuronEdgeCreate, NeuronEdgeUpdate } from '../types/edge';
import type { NeuronNode, NeuronNodeCreate, NeuronNodeUpdate } from '../types/node';
import type { NeuronSettings, NeuronSettingsUpdate } from '../types/settings';
import type {
  GraphStore,
  GraphStoreDeleteNodeResult,
  GraphStoreEmbeddingInfo,
  GraphStoreContext,
  GraphStoreListOptions,
  GraphStoreSimilarityResult,
} from './graph-store';
import { resolveScope } from './graph-store';

export class PostgresGraphStore implements GraphStore {
  readonly kind = 'postgres';

  private nodes: NodeRepository;
  private edges: EdgeRepository;
  private settings: SettingsRepository;
  private graph: GraphQueryBuilder;

  constructor(private db: Database) {
    this.nodes = new NodeRepository(db);
    this.edges = new EdgeRepository(db);
    this.settings = new SettingsRepository(db);
    this.graph = new GraphQueryBuilder(db);
  }

  async listNodes(options?: GraphStoreListOptions): Promise<NeuronNode[]> {
    return this.nodes.findAll({
      where: {},
      limit: options?.limit,
      offset: options?.offset,
    }, options?.context);
  }

  async getNodeById(id: string, context?: GraphStoreContext): Promise<NeuronNode | null> {
    return this.nodes.findById(id, context);
  }

  async getNodeBySlug(slug: string, context?: GraphStoreContext): Promise<NeuronNode | null> {
    return this.nodes.findBySlug(slug, context);
  }

  async createNodes(nodes: NeuronNodeCreate[], context?: GraphStoreContext): Promise<NeuronNode[]> {
    return this.nodes.batchCreate(nodes, context);
  }

  async updateNode(id: string, patch: NeuronNodeUpdate, context?: GraphStoreContext): Promise<NeuronNode | null> {
    return this.nodes.update(id, patch, context);
  }

  async deleteNode(id: string, context?: GraphStoreContext): Promise<GraphStoreDeleteNodeResult> {
    const edgesRemoved = await this.edges.deleteByNodeId(id, context);
    const deleted = await this.nodes.delete(id, context);
    return { deleted, edgesRemoved };
  }

  async listEdges(options?: GraphStoreListOptions): Promise<NeuronEdge[]> {
    // TODO: add paging/filters when route handlers support them consistently
    if (options?.limit || options?.offset) {
      return this.edges.findAll(undefined, options?.context);
    }
    return this.edges.findAll(undefined, options?.context);
  }

  async createEdges(edges: NeuronEdgeCreate[], context?: GraphStoreContext): Promise<NeuronEdge[]> {
    return this.edges.batchCreate(edges, context);
  }

  async updateEdge(id: string, patch: NeuronEdgeUpdate, context?: GraphStoreContext): Promise<NeuronEdge | null> {
    return this.edges.update(id, patch, context);
  }

  async deleteEdge(id: string, context?: GraphStoreContext): Promise<boolean> {
    return this.edges.delete(id, context);
  }

  async getSettings(context?: GraphStoreContext): Promise<NeuronSettings> {
    return this.settings.get(context);
  }

  async updateSettings(update: NeuronSettingsUpdate, context?: GraphStoreContext): Promise<NeuronSettings> {
    return this.settings.update(update, context);
  }

  async resetSettings(sections?: string[], context?: GraphStoreContext): Promise<NeuronSettings> {
    return this.settings.reset(sections, context);
  }

  async getGraph(params: GetGraphParams, context?: GraphStoreContext): Promise<GetGraphResponse> {
    return this.graph.getGraph(params, context);
  }

  async expandGraph(params: ExpandGraphRequest, context?: GraphStoreContext): Promise<ExpandGraphResponse> {
    return this.graph.expandGraph(params, context);
  }

  async findPaths(params: FindPathRequest, context?: GraphStoreContext): Promise<FindPathResponse> {
    const result = await this.graph.findPaths(params, context);
    if (params.algorithm === 'all') return result;
    return { paths: result.paths.slice(0, 1) };
  }

  async getNodeEmbeddingInfo(nodeId: string, context?: GraphStoreContext): Promise<GraphStoreEmbeddingInfo | null> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<{
      embedding: number[] | null;
      embedding_model: string | null;
      embedding_generated_at: Date | null;
    }>('SELECT embedding, embedding_model, embedding_generated_at FROM nodes WHERE id = $1 AND scope = $2', [nodeId, scope]);

    if (!row) return null;
    return {
      embedding: row.embedding ?? null,
      embeddingModel: row.embedding_model ?? null,
      embeddingGeneratedAt: row.embedding_generated_at ?? null,
    };
  }

  async setNodeEmbedding(nodeId: string, embedding: number[], model: string, context?: GraphStoreContext): Promise<void> {
    const scope = resolveScope(context);
    await this.db.execute(
      'UPDATE nodes SET embedding = $1, embedding_model = $2, embedding_generated_at = NOW() WHERE id = $3 AND scope = $4',
      [embedding, model, nodeId, scope]
    );
  }

  async clearNodeEmbeddings(nodeIds?: string[], context?: GraphStoreContext): Promise<void> {
    const scope = resolveScope(context);
    if (nodeIds?.length) {
      await this.db.execute(
        'UPDATE nodes SET embedding = NULL, embedding_model = NULL, embedding_generated_at = NULL WHERE id = ANY($1) AND scope = $2',
        [nodeIds, scope]
      );
      return;
    }

    await this.db.execute('UPDATE nodes SET embedding = NULL, embedding_model = NULL, embedding_generated_at = NULL WHERE scope = $1', [scope]);
  }

  async findSimilarNodeIds(
    nodeId: string,
    options?: { limit?: number; minSimilarity?: number },
    context?: GraphStoreContext
  ): Promise<GraphStoreSimilarityResult[]> {
    const scope = resolveScope(context);
    const limit = Math.max(1, options?.limit ?? 50);
    const minSimilarity = options?.minSimilarity ?? 0;
    const rows = await this.db.query<{ id: string; similarity: number }>(
      `SELECT id, 1 - (embedding <=> (SELECT embedding FROM nodes WHERE id = $1 AND scope = $3)) as similarity
       FROM nodes
       WHERE scope = $3 AND embedding IS NOT NULL AND id != $1
       ORDER BY embedding <=> (SELECT embedding FROM nodes WHERE id = $1 AND scope = $3)
       LIMIT $2`,
      [nodeId, limit, scope]
    );

    return rows
      .filter((row) => Number(row.similarity ?? 0) >= minSimilarity)
      .map((row) => ({ nodeId: row.id, similarity: Number(row.similarity ?? 0) }));
  }
}
