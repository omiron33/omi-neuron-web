import type { Database } from '../../../storage/database';
import { SourceRepository } from '../../../api/repositories/source-repository';
import { SourceItemRepository } from '../../../api/repositories/source-item-repository';
import { SourceItemNodeRepository } from '../../../api/repositories/source-item-node-repository';
import { SyncRunRepository } from '../../../api/repositories/sync-run-repository';
import type { IngestionSource, IngestionSyncRun } from '../../types/ingestion';
import type { ProvenanceItemUpsert, ProvenanceItemUpsertResult, ProvenanceSourceUpsert, ProvenanceStore } from './provenance-store';

export class PostgresProvenanceStore implements ProvenanceStore {
  readonly kind = 'postgres';

  private sources: SourceRepository;
  private items: SourceItemRepository;
  private mappings: SourceItemNodeRepository;
  private runs: SyncRunRepository;

  constructor(db: Database) {
    this.sources = new SourceRepository(db);
    this.items = new SourceItemRepository(db);
    this.mappings = new SourceItemNodeRepository(db);
    this.runs = new SyncRunRepository(db);
  }

  findSource(type: ProvenanceSourceUpsert['type'], name: string) {
    return this.sources.findByTypeAndName(type, name);
  }

  upsertSource(params: ProvenanceSourceUpsert): Promise<IngestionSource> {
    return this.sources.upsert(params);
  }

  findSourceItem(sourceId: string, externalId: string) {
    return this.items.findBySourceAndExternalId(sourceId, externalId);
  }

  upsertSourceItem(params: ProvenanceItemUpsert): Promise<ProvenanceItemUpsertResult> {
    return this.items.upsertWithChangeDetection(params);
  }

  addSourceItemNodeMapping(sourceItemId: string, nodeId: string): Promise<void> {
    return this.mappings.addMapping(sourceItemId, nodeId);
  }

  listNodeIdsForSourceItem(sourceItemId: string): Promise<string[]> {
    return this.mappings.listNodeIds(sourceItemId);
  }

  listMissingSourceItems(sourceId: string, before: Date) {
    return this.items.listMissing(sourceId, before);
  }

  softDeleteSourceItems(sourceItemIds: string[], deletedAt: Date) {
    return this.items.softDeleteByIds(sourceItemIds, deletedAt);
  }

  deleteSourceItems(sourceItemIds: string[]) {
    return this.items.deleteByIds(sourceItemIds);
  }

  createSyncRun(sourceId: string, startedAt: Date): Promise<IngestionSyncRun> {
    return this.runs.createRun(sourceId, startedAt);
  }

  completeSyncRun(params: {
    id: string;
    completedAt: Date;
    status: 'success' | 'failed' | 'partial';
    stats: Record<string, unknown>;
    error?: string | null;
  }): Promise<IngestionSyncRun> {
    return this.runs.completeRun(params);
  }
}
