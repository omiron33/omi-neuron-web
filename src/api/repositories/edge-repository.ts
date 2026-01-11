import type { Database } from '../../storage/database';
import type { NeuronEdge, NeuronEdgeCreate, NeuronEdgeUpdate } from '../../core/types/edge';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';
import type { QueryOptions } from './base';
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

  override async findById(id: string, context?: GraphStoreContext): Promise<NeuronEdge | null> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>('SELECT * FROM edges WHERE id = $1 AND scope = $2', [id, scope]);
    return row ? mapEdgeRow(row) : null;
  }

  override async findAll(_options?: QueryOptions, context?: GraphStoreContext): Promise<NeuronEdge[]> {
    const scope = resolveScope(context);
    const rows = await this.db.query<Record<string, unknown>>('SELECT * FROM edges WHERE scope = $1', [scope]);
    return rows.map(mapEdgeRow);
  }

  async findByNodeId(nodeId: string, direction: 'inbound' | 'outbound' | 'both' = 'both', context?: GraphStoreContext) {
    const scope = resolveScope(context);
    let sql = 'SELECT * FROM edges WHERE scope = $2 AND (from_node_id = $1 OR to_node_id = $1)';
    if (direction === 'inbound') {
      sql = 'SELECT * FROM edges WHERE scope = $2 AND to_node_id = $1';
    }
    if (direction === 'outbound') {
      sql = 'SELECT * FROM edges WHERE scope = $2 AND from_node_id = $1';
    }
    const rows = await this.db.query<Record<string, unknown>>(sql, [nodeId, scope]);
    return rows.map(mapEdgeRow);
  }

  async findBetweenNodes(fromId: string, toId: string, context?: GraphStoreContext): Promise<NeuronEdge[]> {
    const scope = resolveScope(context);
    const rows = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM edges WHERE from_node_id = $1 AND to_node_id = $2 AND scope = $3',
      [fromId, toId, scope]
    );
    return rows.map(mapEdgeRow);
  }

  async deleteByNodeId(nodeId: string, context?: GraphStoreContext): Promise<number> {
    const scope = resolveScope(context);
    return this.db.execute('DELETE FROM edges WHERE scope = $2 AND (from_node_id = $1 OR to_node_id = $1)', [nodeId, scope]);
  }

  async batchCreate(edges: NeuronEdgeCreate[], context?: GraphStoreContext): Promise<NeuronEdge[]> {
    const scope = resolveScope(context);
    const created: NeuronEdge[] = [];
    for (const edge of edges) {
      const row = await this.db.queryOne<Record<string, unknown>>(
        `INSERT INTO edges (scope, from_node_id, to_node_id, relationship_type, strength, confidence, evidence, label, description, metadata, source, bidirectional)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'manual', $11)
         RETURNING *`,
        [
          scope,
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
