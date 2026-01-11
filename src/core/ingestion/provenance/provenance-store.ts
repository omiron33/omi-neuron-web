import type { ConnectorType, IngestionSource, IngestionSourceItem, IngestionSyncRun, SyncRunStatus } from '../../types/ingestion';

export type ProvenanceSourceUpsert = {
  type: ConnectorType;
  name: string;
  config: Record<string, unknown>;
};

export type ProvenanceItemUpsert = {
  sourceId: string;
  externalId: string;
  contentHash: string;
  seenAt: Date;
};

export type ProvenanceItemUpsertResult = {
  item: IngestionSourceItem;
  change: 'created' | 'updated' | 'unchanged';
};

export interface ProvenanceStore {
  readonly kind: string;

  findSource(type: ConnectorType, name: string): Promise<IngestionSource | null>;
  upsertSource(params: ProvenanceSourceUpsert): Promise<IngestionSource>;

  findSourceItem(sourceId: string, externalId: string): Promise<IngestionSourceItem | null>;
  upsertSourceItem(params: ProvenanceItemUpsert): Promise<ProvenanceItemUpsertResult>;
  addSourceItemNodeMapping(sourceItemId: string, nodeId: string): Promise<void>;
  listNodeIdsForSourceItem(sourceItemId: string): Promise<string[]>;

  listMissingSourceItems(sourceId: string, before: Date): Promise<IngestionSourceItem[]>;
  softDeleteSourceItems(sourceItemIds: string[], deletedAt: Date): Promise<number>;
  deleteSourceItems(sourceItemIds: string[]): Promise<number>;

  createSyncRun(sourceId: string, startedAt: Date): Promise<IngestionSyncRun>;
  completeSyncRun(params: {
    id: string;
    completedAt: Date;
    status: SyncRunStatus;
    stats: Record<string, unknown>;
    error?: string | null;
  }): Promise<IngestionSyncRun>;
}
