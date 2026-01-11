import type { Database } from '../../storage/database';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';
import type { SuggestedEdge, SuggestedEdgeCreate, SuggestedEdgeListParams, SuggestedEdgeStatus } from '../../core/types/suggested-edge';
import type { QueryOptions } from './base';
import { BaseRepository } from './base';

const mapSuggestedEdgeRow = (row: Record<string, unknown>): SuggestedEdge => ({
  id: row.id as string,
  scope: row.scope as string,
  fromNodeId: row.from_node_id as string,
  toNodeId: row.to_node_id as string,
  relationshipType: row.relationship_type as SuggestedEdge['relationshipType'],
  strength: (row.strength as number | null) ?? null,
  confidence: row.confidence as number,
  reasoning: (row.reasoning as string | null) ?? null,
  evidence: (row.evidence as SuggestedEdge['evidence']) ?? [],
  status: row.status as SuggestedEdgeStatus,
  sourceModel: (row.source_model as string | null) ?? null,
  analysisRunId: (row.analysis_run_id as string | null) ?? null,
  reviewedBy: (row.reviewed_by as string | null) ?? null,
  reviewedAt: (row.reviewed_at as Date | null) ?? null,
  reviewReason: (row.review_reason as string | null) ?? null,
  approvedEdgeId: (row.approved_edge_id as string | null) ?? null,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export class SuggestedEdgeRepository extends BaseRepository<SuggestedEdge, SuggestedEdgeCreate, Partial<SuggestedEdgeCreate>> {
  constructor(db: Database) {
    super(db, 'suggested_edges');
  }

  override async findById(id: string, context?: GraphStoreContext): Promise<SuggestedEdge | null> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      'SELECT * FROM suggested_edges WHERE id = $1 AND scope = $2',
      [id, scope]
    );
    return row ? mapSuggestedEdgeRow(row) : null;
  }

  override async findAll(options?: QueryOptions, context?: GraphStoreContext): Promise<SuggestedEdge[]> {
    const rows = await super.findAll(options, context);
    return (rows as unknown as Record<string, unknown>[]).map(mapSuggestedEdgeRow);
  }

  async list(params: SuggestedEdgeListParams = {}, context?: GraphStoreContext): Promise<SuggestedEdge[]> {
    const scope = resolveScope(context);
    const conditions: string[] = ['scope = $1'];
    const values: unknown[] = [scope];

    if (params.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(params.status);
    }
    if (params.relationshipType) {
      conditions.push(`relationship_type = $${values.length + 1}`);
      values.push(params.relationshipType);
    }
    if (typeof params.minConfidence === 'number') {
      conditions.push(`confidence >= $${values.length + 1}`);
      values.push(params.minConfidence);
    }

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    values.push(limit, offset);

    const sql = `SELECT * FROM suggested_edges WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;
    const rows = await this.db.query<Record<string, unknown>>(sql, values);
    return rows.map(mapSuggestedEdgeRow);
  }

  async upsertSuggestion(input: SuggestedEdgeCreate, context?: GraphStoreContext): Promise<SuggestedEdge> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      `INSERT INTO suggested_edges (
         scope,
         from_node_id,
         to_node_id,
         relationship_type,
         confidence,
         strength,
         reasoning,
         evidence,
         status,
         source_model,
         analysis_run_id,
         updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10,NOW())
       ON CONFLICT (scope, from_node_id, to_node_id, relationship_type) DO UPDATE SET
         confidence = EXCLUDED.confidence,
         strength = EXCLUDED.strength,
         reasoning = EXCLUDED.reasoning,
         evidence = EXCLUDED.evidence,
         status = 'pending',
         source_model = EXCLUDED.source_model,
         analysis_run_id = EXCLUDED.analysis_run_id,
         updated_at = NOW()
       RETURNING *`,
      [
        scope,
        input.fromNodeId,
        input.toNodeId,
        input.relationshipType,
        input.confidence,
        input.strength ?? null,
        input.reasoning ?? null,
        JSON.stringify(input.evidence ?? []),
        input.sourceModel ?? null,
        input.analysisRunId ?? null,
      ]
    );

    if (!row) {
      throw new Error('Failed to upsert suggested edge');
    }
    return mapSuggestedEdgeRow(row);
  }

  async markApproved(
    id: string,
    options?: { reviewedBy?: string; reviewReason?: string; approvedEdgeId?: string },
    context?: GraphStoreContext
  ): Promise<SuggestedEdge | null> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      `UPDATE suggested_edges
       SET status = 'approved',
           reviewed_by = $2,
           reviewed_at = NOW(),
           review_reason = $3,
           approved_edge_id = $4,
           updated_at = NOW()
       WHERE id = $1 AND scope = $5
       RETURNING *`,
      [id, options?.reviewedBy ?? null, options?.reviewReason ?? null, options?.approvedEdgeId ?? null, scope]
    );
    return row ? mapSuggestedEdgeRow(row) : null;
  }

  async markRejected(
    id: string,
    options?: { reviewedBy?: string; reviewReason?: string },
    context?: GraphStoreContext
  ): Promise<SuggestedEdge | null> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      `UPDATE suggested_edges
       SET status = 'rejected',
           reviewed_by = $2,
           reviewed_at = NOW(),
           review_reason = $3,
           updated_at = NOW()
       WHERE id = $1 AND scope = $4
       RETURNING *`,
      [id, options?.reviewedBy ?? null, options?.reviewReason ?? null, scope]
    );
    return row ? mapSuggestedEdgeRow(row) : null;
  }
}
