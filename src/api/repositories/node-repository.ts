import type { Database } from '../../storage/database';
import type { NeuronNode, NeuronNodeCreate, NeuronNodeUpdate } from '../../core/types/node';
import type { QueryOptions } from './base';
import { BaseRepository } from './base';

const mapNodeRow = (row: Record<string, unknown>): NeuronNode => ({
  id: row.id as string,
  slug: row.slug as string,
  label: row.label as string,
  nodeType: row.node_type as string,
  domain: row.domain as string,
  summary: (row.summary as string | null) ?? null,
  description: (row.description as string | null) ?? null,
  content: (row.content as string | null) ?? null,
  metadata: (row.metadata as Record<string, unknown>) ?? {},
  tier: (row.tier as NeuronNode['tier']) ?? undefined,
  visualPriority: (row.visual_priority as number | undefined) ?? undefined,
  positionOverride: (row.position_override as [number, number, number] | null) ?? null,
  connectionCount: (row.connection_count as number | undefined) ?? 0,
  inboundCount: (row.inbound_count as number | undefined) ?? 0,
  outboundCount: (row.outbound_count as number | undefined) ?? 0,
  analysisStatus: (row.analysis_status as NeuronNode['analysisStatus']) ?? 'pending',
  analysisError: (row.analysis_error as string | null) ?? null,
  embedding: (row.embedding as number[] | null) ?? null,
  embeddingModel: (row.embedding_model as string | null) ?? null,
  embeddingGeneratedAt: (row.embedding_generated_at as Date | null) ?? null,
  clusterId: (row.cluster_id as string | null) ?? null,
  clusterSimilarity: (row.cluster_similarity as number | null) ?? null,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export class NodeRepository extends BaseRepository<NeuronNode, NeuronNodeCreate, NeuronNodeUpdate> {
  constructor(db: Database) {
    super(db, 'nodes');
  }

  override async findById(id: string): Promise<NeuronNode | null> {
    const row = await this.db.queryOne<Record<string, unknown>>('SELECT * FROM nodes WHERE id = $1', [id]);
    return row ? mapNodeRow(row) : null;
  }

  override async findAll(options?: QueryOptions): Promise<NeuronNode[]> {
    const rows = await super.findAll(options);
    return (rows as unknown as Record<string, unknown>[]).map(mapNodeRow);
  }

  async findBySlug(slug: string): Promise<NeuronNode | null> {
    const row = await this.db.queryOne<Record<string, unknown>>('SELECT * FROM nodes WHERE slug = $1', [slug]);
    return row ? mapNodeRow(row) : null;
  }

  async findByDomain(domain: string): Promise<NeuronNode[]> {
    const rows = await this.db.query<Record<string, unknown>>('SELECT * FROM nodes WHERE domain = $1', [domain]);
    return rows.map(mapNodeRow);
  }

  async findByCluster(clusterId: string): Promise<NeuronNode[]> {
    const rows = await this.db.query<Record<string, unknown>>('SELECT * FROM nodes WHERE cluster_id = $1', [clusterId]);
    return rows.map(mapNodeRow);
  }

  async search(query: string): Promise<NeuronNode[]> {
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM nodes WHERE label ILIKE $1 OR summary ILIKE $1 OR content ILIKE $1`,
      [`%${query}%`]
    );
    return rows.map(mapNodeRow);
  }

  async batchCreate(nodes: NeuronNodeCreate[]): Promise<NeuronNode[]> {
    const created: NeuronNode[] = [];
    for (const node of nodes) {
      const row = await this.db.queryOne<Record<string, unknown>>(
        `INSERT INTO nodes (slug, label, node_type, domain, summary, description, content, metadata, tier)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          node.slug,
          node.label,
          node.nodeType ?? 'concept',
          node.domain ?? 'general',
          node.summary ?? null,
          node.description ?? null,
          node.content ?? null,
          node.metadata ?? {},
          node.tier ?? null,
        ]
      );
      if (row) created.push(mapNodeRow(row));
    }
    return created;
  }

  async updateConnectionCounts(nodeId: string): Promise<void> {
    const inbound = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*)::int as count FROM edges WHERE to_node_id = $1',
      [nodeId]
    );
    const outbound = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*)::int as count FROM edges WHERE from_node_id = $1',
      [nodeId]
    );
    const inboundCount = Number(inbound?.count ?? 0);
    const outboundCount = Number(outbound?.count ?? 0);
    await this.db.execute(
      'UPDATE nodes SET inbound_count = $1, outbound_count = $2, connection_count = $3 WHERE id = $4',
      [inboundCount, outboundCount, inboundCount + outboundCount, nodeId]
    );
  }
}
