import crypto from 'node:crypto';
import type { ConnectorType, IngestionSource, IngestionSourceItem, IngestionSyncRun, SyncRunStatus } from '../../types/ingestion';
import type { ProvenanceItemUpsert, ProvenanceItemUpsertResult, ProvenanceSourceUpsert, ProvenanceStore } from './provenance-store';

const keyForSource = (type: ConnectorType, name: string) => `${type}:${name}`;
const keyForItem = (sourceId: string, externalId: string) => `${sourceId}:${externalId}`;

export class MemoryProvenanceStore implements ProvenanceStore {
  readonly kind = 'memory';

  private sourcesByKey = new Map<string, IngestionSource>();
  private itemsByKey = new Map<string, IngestionSourceItem>();
  private mappings = new Map<string, Set<string>>();
  private runsById = new Map<string, IngestionSyncRun>();

  async findSource(type: ConnectorType, name: string): Promise<IngestionSource | null> {
    return this.sourcesByKey.get(keyForSource(type, name)) ?? null;
  }

  async upsertSource(params: ProvenanceSourceUpsert): Promise<IngestionSource> {
    const key = keyForSource(params.type, params.name);
    const existing = this.sourcesByKey.get(key);
    if (existing) {
      const updated: IngestionSource = {
        ...existing,
        config: params.config,
        updatedAt: new Date(),
      };
      this.sourcesByKey.set(key, updated);
      return updated;
    }

    const created: IngestionSource = {
      id: crypto.randomUUID(),
      type: params.type,
      name: params.name,
      config: params.config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sourcesByKey.set(key, created);
    return created;
  }

  async findSourceItem(sourceId: string, externalId: string): Promise<IngestionSourceItem | null> {
    return this.itemsByKey.get(keyForItem(sourceId, externalId)) ?? null;
  }

  async upsertSourceItem(params: ProvenanceItemUpsert): Promise<ProvenanceItemUpsertResult> {
    const key = keyForItem(params.sourceId, params.externalId);
    const existing = this.itemsByKey.get(key);
    if (!existing) {
      const item: IngestionSourceItem = {
        id: crypto.randomUUID(),
        sourceId: params.sourceId,
        externalId: params.externalId,
        contentHash: params.contentHash,
        lastSeenAt: params.seenAt,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.itemsByKey.set(key, item);
      return { item, change: 'created' };
    }

    if (existing.contentHash === params.contentHash) {
      const item: IngestionSourceItem = {
        ...existing,
        lastSeenAt: params.seenAt,
        deletedAt: null,
        updatedAt: new Date(),
      };
      this.itemsByKey.set(key, item);
      return { item, change: 'unchanged' };
    }

    const item: IngestionSourceItem = {
      ...existing,
      contentHash: params.contentHash,
      lastSeenAt: params.seenAt,
      deletedAt: null,
      updatedAt: new Date(),
    };
    this.itemsByKey.set(key, item);
    return { item, change: 'updated' };
  }

  async addSourceItemNodeMapping(sourceItemId: string, nodeId: string): Promise<void> {
    const set = this.mappings.get(sourceItemId) ?? new Set<string>();
    set.add(nodeId);
    this.mappings.set(sourceItemId, set);
  }

  async listNodeIdsForSourceItem(sourceItemId: string): Promise<string[]> {
    return [...(this.mappings.get(sourceItemId) ?? new Set<string>())];
  }

  async listMissingSourceItems(sourceId: string, before: Date): Promise<IngestionSourceItem[]> {
    return [...this.itemsByKey.values()].filter(
      (item) => item.sourceId === sourceId && item.deletedAt === null && item.lastSeenAt < before
    );
  }

  async softDeleteSourceItems(sourceItemIds: string[], deletedAt: Date): Promise<number> {
    const ids = new Set(sourceItemIds);
    let count = 0;
    for (const [key, item] of this.itemsByKey.entries()) {
      if (!ids.has(item.id)) continue;
      this.itemsByKey.set(key, {
        ...item,
        deletedAt,
        updatedAt: new Date(),
      });
      count += 1;
    }
    return count;
  }

  async deleteSourceItems(sourceItemIds: string[]): Promise<number> {
    const ids = new Set(sourceItemIds);
    let count = 0;
    for (const [key, item] of this.itemsByKey.entries()) {
      if (!ids.has(item.id)) continue;
      this.itemsByKey.delete(key);
      this.mappings.delete(item.id);
      count += 1;
    }
    return count;
  }

  async createSyncRun(sourceId: string, startedAt: Date): Promise<IngestionSyncRun> {
    const run: IngestionSyncRun = {
      id: crypto.randomUUID(),
      sourceId,
      startedAt,
      completedAt: null,
      status: 'success',
      stats: {},
      error: null,
    };
    this.runsById.set(run.id, run);
    return run;
  }

  async completeSyncRun(params: {
    id: string;
    completedAt: Date;
    status: SyncRunStatus;
    stats: Record<string, unknown>;
    error?: string | null;
  }): Promise<IngestionSyncRun> {
    const existing = this.runsById.get(params.id);
    if (!existing) throw new Error(`MemoryProvenanceStore.completeSyncRun: missing run ${params.id}`);
    const run: IngestionSyncRun = {
      ...existing,
      completedAt: params.completedAt,
      status: params.status,
      stats: params.stats,
      error: params.error ?? null,
    };
    this.runsById.set(run.id, run);
    return run;
  }
}
