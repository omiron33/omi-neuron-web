import type { NeuronEdgeCreate } from '../types/edge';
import type { NeuronNode, NeuronNodeCreate, NeuronNodeUpdate } from '../types/node';
import type { GraphStore } from '../store/graph-store';
import type { SyncRunStatus } from '../types/ingestion';
import type { IngestOptions, IngestResult, IngestStats, IngestionRecord } from './types';
import { buildSourceAwareSlug } from './utils/slug';
import { hashIngestionRecord } from './utils/hash';
import type { ProvenanceStore } from './provenance/provenance-store';

type NodeUpsertResult = {
  node: NeuronNode;
  change: 'created' | 'updated' | 'unchanged';
};

const emptyStats = (): IngestStats => ({
  total: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  deleted: 0,
  errors: 0,
});

export class IngestionEngine {
  private lastRunStartedAtMs: number | null = null;

  constructor(
    private store: GraphStore,
    private provenance?: ProvenanceStore
  ) {}

  async ingest(records: IngestionRecord[], options: IngestOptions): Promise<IngestResult> {
    let startedAtMs = Date.now();
    if (this.lastRunStartedAtMs !== null && startedAtMs <= this.lastRunStartedAtMs) {
      startedAtMs = this.lastRunStartedAtMs + 1;
    }
    this.lastRunStartedAtMs = startedAtMs;
    const startedAt = new Date(startedAtMs);
    const sourceKey = `${options.source.type}:${options.source.name}`;
    const dryRun = Boolean(options.dryRun);

    const stats = emptyStats();
    const errors: IngestResult['errors'] = [];

    let status: SyncRunStatus = 'success';

    const source = this.provenance
      ? dryRun
        ? await this.provenance.findSource(options.source.type, options.source.name)
        : await this.provenance.upsertSource(options.source)
      : undefined;

    const run = this.provenance && source && !dryRun
      ? await this.provenance.createSyncRun(source.id, startedAt)
      : undefined;

    const externalIdToNodeId = new Map<string, string>();

    for (const record of records) {
      stats.total += 1;
      try {
        const contentHash = hashIngestionRecord(record);

        const sourceItemExisting = this.provenance && source
          ? await this.provenance.findSourceItem(source.id, record.externalId)
          : null;
        const computedChange = !sourceItemExisting
          ? 'created'
          : sourceItemExisting.contentHash === contentHash
            ? 'unchanged'
            : 'updated';

        const sourceItemResult = !dryRun && this.provenance && source
          ? await this.provenance.upsertSourceItem({
              sourceId: source.id,
              externalId: record.externalId,
              contentHash,
              seenAt: startedAt,
            })
          : null;

        const slug = buildSourceAwareSlug({
          title: record.title,
          sourceKey,
          externalId: record.externalId,
        });

        if (dryRun) {
          const existing = await this.store.getNodeBySlug(slug);
          if (!existing) stats.created += 1;
          else if (computedChange === 'unchanged') stats.skipped += 1;
          else stats.updated += 1;

          if (existing) externalIdToNodeId.set(record.externalId, existing.id);
        } else {
          const nodeResult = await this.upsertNodeFromRecord(record, slug, sourceItemResult?.change ?? computedChange);

          if (nodeResult.change === 'created') stats.created += 1;
          if (nodeResult.change === 'updated') stats.updated += 1;
          if (nodeResult.change === 'unchanged') stats.skipped += 1;

          externalIdToNodeId.set(record.externalId, nodeResult.node.id);

          if (this.provenance && sourceItemResult) {
            await this.provenance.addSourceItemNodeMapping(sourceItemResult.item.id, nodeResult.node.id);
          }
        }
      } catch (error) {
        status = 'partial';
        stats.errors += 1;
        errors.push({
          externalId: record.externalId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (!dryRun) {
      // Best-effort edge pass: only create edges when targets are resolvable in this run.
      await this.applyEdges(records, externalIdToNodeId, sourceKey);
    }

    if (!dryRun && this.provenance && source) {
      const deleteMode = options.deleteMode ?? 'none';
      if (deleteMode !== 'none') {
        try {
          const missing = await this.provenance.listMissingSourceItems(source.id, startedAt);
          if (missing.length) {
            if (deleteMode === 'soft') {
              const deletedAt = new Date();
              const count = await this.provenance.softDeleteSourceItems(
                missing.map((m) => m.id),
                deletedAt
              );
              stats.deleted += count;
            } else if (deleteMode === 'hard') {
              for (const item of missing) {
                const nodeIds = await this.provenance.listNodeIdsForSourceItem(item.id);
                for (const nodeId of nodeIds) {
                  await this.store.deleteNode(nodeId);
                }
              }
              const count = await this.provenance.deleteSourceItems(missing.map((m) => m.id));
              stats.deleted += count;
            }
          }
        } catch (error) {
          status = 'partial';
          stats.errors += 1;
          errors.push({
            externalId: '(delete-missing)',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    if (this.provenance && run) {
      await this.provenance.completeSyncRun({
        id: run.id,
        completedAt: new Date(),
        status,
        stats,
        error: errors.length ? JSON.stringify(errors.slice(0, 50)) : null,
      });
    }

    return {
      sourceId: source?.id,
      syncRunId: run?.id,
      status,
      stats,
      errors,
    };
  }

  private async upsertNodeFromRecord(
    record: IngestionRecord,
    slug: string,
    sourceItemChange?: 'created' | 'updated' | 'unchanged'
  ): Promise<NodeUpsertResult> {
    const existing = await this.store.getNodeBySlug(slug);
    const create: NeuronNodeCreate = {
      slug,
      label: record.title,
      nodeType: record.nodeType,
      domain: record.domain,
      content: record.content,
      metadata: record.metadata ?? {},
    };

    if (!existing) {
      const created = await this.store.createNodes([create]);
      const node = created[0];
      if (!node) throw new Error('IngestionEngine: expected node create result');
      return { node, change: 'created' };
    }

    if (sourceItemChange === 'unchanged') {
      return { node: existing, change: 'unchanged' };
    }

    const patch: NeuronNodeUpdate = {
      label: record.title,
      content: record.content,
      metadata: record.metadata ?? {},
      domain: record.domain ?? existing.domain,
    };

    const updated = await this.store.updateNode(existing.id, patch);
    return { node: updated ?? existing, change: 'updated' };
  }

  private async applyEdges(records: IngestionRecord[], externalIdToNodeId: Map<string, string>, sourceKey: string) {
    const existingEdges = await this.store.listEdges();
    const edgeKey = (fromId: string, toId: string, relationshipType: string) =>
      `${fromId}:${toId}:${relationshipType}`;

    const seen = new Set(existingEdges.map((e) => edgeKey(e.fromNodeId, e.toNodeId, e.relationshipType)));

    const edgesToCreate: NeuronEdgeCreate[] = [];

    for (const record of records) {
      const fromId = externalIdToNodeId.get(record.externalId);
      if (!fromId) continue;

      const references = record.references ?? [];
      for (const refExternalId of references) {
        const toId = externalIdToNodeId.get(refExternalId);
        if (!toId) continue;
        const rel = 'references';
        const key = edgeKey(fromId, toId, rel);
        if (seen.has(key)) continue;
        seen.add(key);
        edgesToCreate.push({
          fromNodeId: fromId,
          toNodeId: toId,
          relationshipType: rel,
          metadata: { source: sourceKey },
        });
      }

      if (record.parentExternalId) {
        const parentId = externalIdToNodeId.get(record.parentExternalId);
        if (parentId) {
          const rel = 'part_of';
          const key = edgeKey(fromId, parentId, rel);
          if (!seen.has(key)) {
            seen.add(key);
            edgesToCreate.push({
              fromNodeId: fromId,
              toNodeId: parentId,
              relationshipType: rel,
              metadata: { source: sourceKey },
            });
          }
        }
      }
    }

    if (edgesToCreate.length) {
      await this.store.createEdges(edgesToCreate);
    }
  }
}
