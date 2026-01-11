import type { Database } from '../../storage/database';
import type { IngestionSourceItem } from '../../core/types/ingestion';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';

const mapSourceItemRow = (row: Record<string, unknown>): IngestionSourceItem => ({
  id: row.id as string,
  sourceId: row.source_id as string,
  externalId: row.external_id as string,
  contentHash: row.content_hash as string,
  lastSeenAt: row.last_seen_at as Date,
  deletedAt: (row.deleted_at as Date | null) ?? null,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export type SourceItemUpsertResult = {
  item: IngestionSourceItem;
  change: 'created' | 'updated' | 'unchanged';
};

export class SourceItemRepository {
  constructor(private db: Database) {}

  async findBySourceAndExternalId(sourceId: string, externalId: string, context?: GraphStoreContext): Promise<IngestionSourceItem | null> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<Record<string, unknown>>(
      'SELECT * FROM source_items WHERE source_id = $1 AND external_id = $2 AND scope = $3',
      [sourceId, externalId, scope]
    );
    return row ? mapSourceItemRow(row) : null;
  }

  async upsertWithChangeDetection(params: {
    sourceId: string;
    externalId: string;
    contentHash: string;
    seenAt: Date;
  }, context?: GraphStoreContext): Promise<SourceItemUpsertResult> {
    const scope = resolveScope(context);
    const existing = await this.findBySourceAndExternalId(params.sourceId, params.externalId, context);
    if (!existing) {
      const row = await this.db.queryOne<Record<string, unknown>>(
        `INSERT INTO source_items (scope, source_id, external_id, content_hash, last_seen_at, deleted_at)
         VALUES ($1, $2, $3, $4, $5, NULL)
         RETURNING *`,
        [scope, params.sourceId, params.externalId, params.contentHash, params.seenAt]
      );
      if (!row) throw new Error('SourceItemRepository.upsertWithChangeDetection: expected row');
      return { item: mapSourceItemRow(row), change: 'created' };
    }

    if (existing.contentHash === params.contentHash) {
      const row = await this.db.queryOne<Record<string, unknown>>(
        `UPDATE source_items
         SET last_seen_at = $1, deleted_at = NULL, updated_at = NOW()
         WHERE id = $2 AND scope = $3
         RETURNING *`,
        [params.seenAt, existing.id, scope]
      );
      if (!row) throw new Error('SourceItemRepository.upsertWithChangeDetection: expected row');
      return { item: mapSourceItemRow(row), change: 'unchanged' };
    }

    const row = await this.db.queryOne<Record<string, unknown>>(
      `UPDATE source_items
       SET content_hash = $1, last_seen_at = $2, deleted_at = NULL, updated_at = NOW()
       WHERE id = $3 AND scope = $4
       RETURNING *`,
      [params.contentHash, params.seenAt, existing.id, scope]
    );
    if (!row) throw new Error('SourceItemRepository.upsertWithChangeDetection: expected row');
    return { item: mapSourceItemRow(row), change: 'updated' };
  }

  async listMissing(sourceId: string, before: Date, context?: GraphStoreContext): Promise<IngestionSourceItem[]> {
    const scope = resolveScope(context);
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM source_items
       WHERE source_id = $1 AND deleted_at IS NULL AND last_seen_at < $2 AND scope = $3`,
      [sourceId, before, scope]
    );
    return rows.map(mapSourceItemRow);
  }

  async softDeleteByIds(sourceItemIds: string[], deletedAt: Date, context?: GraphStoreContext): Promise<number> {
    if (!sourceItemIds.length) return 0;
    const scope = resolveScope(context);
    return this.db.execute(
      `UPDATE source_items SET deleted_at = $2, updated_at = NOW()
       WHERE id = ANY($1) AND scope = $3`,
      [sourceItemIds, deletedAt, scope]
    );
  }

  async deleteByIds(sourceItemIds: string[], context?: GraphStoreContext): Promise<number> {
    if (!sourceItemIds.length) return 0;
    const scope = resolveScope(context);
    return this.db.execute('DELETE FROM source_items WHERE id = ANY($1) AND scope = $2', [sourceItemIds, scope]);
  }
}
