import type { Database } from '../../storage/database';
import type { ConnectorType, IngestionSource } from '../../core/types/ingestion';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';

const mapSourceRow = (row: Record<string, unknown>): IngestionSource => ({
  id: row.id as string,
  type: row.type as ConnectorType,
  name: row.name as string,
  config: (row.config as Record<string, unknown>) ?? {},
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export class SourceRepository {
  constructor(private db: Database) {}

  async findByTypeAndName(type: ConnectorType, name: string, context?: GraphStoreContext): Promise<IngestionSource | null> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      'SELECT * FROM sources WHERE type = $1 AND name = $2 AND scope = $3',
      [type, name, scope]
    );
    return row ? mapSourceRow(row) : null;
  }

  async upsert(params: {
    type: ConnectorType;
    name: string;
    config: Record<string, unknown>;
  }, context?: GraphStoreContext): Promise<IngestionSource> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      `INSERT INTO sources (scope, type, name, config)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (scope, type, name)
       DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()
       RETURNING *`,
      [scope, params.type, params.name, params.config]
    );
    if (!row) throw new Error('SourceRepository.upsert: expected row');
    return mapSourceRow(row);
  }
}
