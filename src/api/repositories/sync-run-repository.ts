import type { Database } from '../../storage/database';
import type { IngestionSyncRun, SyncRunStatus } from '../../core/types/ingestion';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';

const mapSyncRunRow = (row: Record<string, unknown>): IngestionSyncRun => ({
  id: row.id as string,
  sourceId: row.source_id as string,
  startedAt: row.started_at as Date,
  completedAt: (row.completed_at as Date | null) ?? null,
  status: row.status as SyncRunStatus,
  stats: (row.stats as Record<string, unknown>) ?? {},
  error: (row.error as string | null) ?? null,
});

export class SyncRunRepository {
  constructor(private db: Database) {}

  async createRun(sourceId: string, startedAt: Date, context?: GraphStoreContext): Promise<IngestionSyncRun> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      `INSERT INTO sync_runs (scope, source_id, started_at, status, stats, error)
       VALUES ($1, $2, $3, 'success', '{}', NULL)
       RETURNING *`,
      [scope, sourceId, startedAt]
    );
    if (!row) throw new Error('SyncRunRepository.createRun: expected row');
    return mapSyncRunRow(row);
  }

  async completeRun(params: {
    id: string;
    completedAt: Date;
    status: SyncRunStatus;
    stats: Record<string, unknown>;
    error?: string | null;
  }, context?: GraphStoreContext): Promise<IngestionSyncRun> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      `UPDATE sync_runs
       SET completed_at = $2, status = $3, stats = $4, error = $5
       WHERE id = $1 AND scope = $6
       RETURNING *`,
      [params.id, params.completedAt, params.status, params.stats, params.error ?? null, scope]
    );
    if (!row) throw new Error('SyncRunRepository.completeRun: expected row');
    return mapSyncRunRow(row);
  }
}
