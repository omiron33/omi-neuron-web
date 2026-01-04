import type { Database } from '../../storage/database';
import type { NeuronEdge, NeuronEdgeCreate, NeuronEdgeUpdate } from '../../core/types/edge';
import { BaseRepository } from './base';

const mapEdgeRow = (row: Record<string, unknown>): NeuronEdge => ({
  id: row.id as string,
  fromNodeId: row.from_node_id as string,
  toNodeId: row.to_node_id as string,
  relationshipType: row.relationship_type as string,
  strength: Number(row.strength ?? 0.5),
  confidence: Number(row.confidence ?? 1),
  evidence: (row.evidence as NeuronEdge['evidence']) ?? [],
  label: (row.label as string | null) ?? null,
  description: (row.description as string | null) ?? null,
  metadata: (row.metadata as Record<string, unknown>) ?? {},
  source: row.source as NeuronEdge['source'],
  sourceModel: (row.source_model as string | null) ?? null,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
  bidirectional: Boolean(row.bidirectional ?? false),
});

export class EdgeRepository extends BaseRepository<NeuronEdge, NeuronEdgeCreate, NeuronEdgeUpdate> {
  constructor(db: Database) {
    super(db, 'edges');
  }

  override async findById(id: string): Promise<NeuronEdge | null> {
    const row = await this.db.queryOne<Record<string, unknown>>('SELECT * FROM edges WHERE id = $1', [id]);
    return row ? mapEdgeRow(row) : null;
  }

  override async findAll(): Promise<NeuronEdge[]> {
    const rows = await this.db.query<Record<string, unknown>>('SELECT * FROM edges');
    return rows.map(mapEdgeRow);
  }

  async findByNodeId(nodeId: string, direction: 'inbound' | 'outbound' | 'both' = 'both') {
    let sql = 'SELECT * FROM edges WHERE from_node_id = $1 OR to_node_id = $1';
    if (direction === 'inbound') {
      sql = 'SELECT * FROM edges WHERE to_node_id = $1';
    }
    if (direction === 'outbound') {
      sql = 'SELECT * FROM edges WHERE from_node_id = $1';
    }
    const rows = await this.db.query<Record<string, unknown>>(sql, [nodeId]);
    return rows.map(mapEdgeRow);
  }

  async findBetweenNodes(fromId: string, toId: string): Promise<NeuronEdge[]> {
    const rows = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM edges WHERE from_node_id = $1 AND to_node_id = $2',
      [fromId, toId]
    );
    return rows.map(mapEdgeRow);
  }

  async deleteByNodeId(nodeId: string): Promise<number> {
    return this.db.execute('DELETE FROM edges WHERE from_node_id = $1 OR to_node_id = $1', [nodeId]);
  }

  async batchCreate(edges: NeuronEdgeCreate[]): Promise<NeuronEdge[]> {
    const created: NeuronEdge[] = [];
    for (const edge of edges) {
      const row = await this.db.queryOne<Record<string, unknown>>(
        `INSERT INTO edges (from_node_id, to_node_id, relationship_type, strength, confidence, evidence, label, description, metadata, source, bidirectional)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'manual', $10)
         RETURNING *`,
        [
          edge.fromNodeId,
          edge.toNodeId,
          edge.relationshipType ?? 'related_to',
          edge.strength ?? 0.5,
          edge.confidence ?? 1,
          edge.evidence ?? [],
          edge.label ?? null,
          edge.description ?? null,
          edge.metadata ?? {},
          edge.bidirectional ?? false,
        ]
      );
      if (row) created.push(mapEdgeRow(row));
    }
    return created;
  }
}
