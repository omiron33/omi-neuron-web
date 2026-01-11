import { describe, expect, it } from 'vitest';
import { InMemoryGraphStore } from '../../src/core/store';
import { IngestionEngine, MemoryProvenanceStore, buildSourceAwareSlug } from '../../src/core/ingestion';

const source = {
  type: 'markdown' as const,
  name: 'docs',
  config: { path: './docs' },
};

const record = (externalId: string, title: string, content: string) => ({
  externalId,
  title,
  content,
});

describe('ingestion provenance integration (memory)', () => {
  it('is idempotent across repeated runs and detects updates via contentHash', async () => {
    const store = new InMemoryGraphStore();
    const provenance = new MemoryProvenanceStore();
    const engine = new IngestionEngine(store, provenance);

    const recordsV1 = [record('alpha', 'Alpha', 'A'), record('beta', 'Beta', 'B')];

    const run1 = await engine.ingest(recordsV1, { source });
    expect(run1.stats.created).toBe(2);
    expect(run1.stats.skipped).toBe(0);
    expect(run1.stats.updated).toBe(0);

    const run2 = await engine.ingest(recordsV1, { source });
    expect(run2.stats.created).toBe(0);
    expect(run2.stats.skipped).toBe(2);
    expect(run2.stats.updated).toBe(0);

    const recordsV2 = [record('alpha', 'Alpha', 'A2'), record('beta', 'Beta', 'B')];
    const run3 = await engine.ingest(recordsV2, { source });
    expect(run3.stats.created).toBe(0);
    expect(run3.stats.updated).toBe(1);
    expect(run3.stats.skipped).toBe(1);
  });

  it('supports soft delete of missing items via deleteMode=soft', async () => {
    const store = new InMemoryGraphStore();
    const provenance = new MemoryProvenanceStore();
    const engine = new IngestionEngine(store, provenance);

    await engine.ingest([record('alpha', 'Alpha', 'A'), record('beta', 'Beta', 'B')], { source });

    const run2 = await engine.ingest([record('alpha', 'Alpha', 'A')], { source, deleteMode: 'soft' });
    expect(run2.stats.deleted).toBe(1);

    expect(run2.sourceId).toBeTruthy();
    const betaItem = await provenance.findSourceItem(run2.sourceId!, 'beta');
    expect(betaItem?.deletedAt).not.toBeNull();
  });

  it('supports hard delete of missing items via deleteMode=hard', async () => {
    const store = new InMemoryGraphStore();
    const provenance = new MemoryProvenanceStore();
    const engine = new IngestionEngine(store, provenance);

    await engine.ingest([record('alpha', 'Alpha', 'A'), record('beta', 'Beta', 'B')], { source });

    const run2 = await engine.ingest([record('alpha', 'Alpha', 'A')], { source, deleteMode: 'hard' });
    expect(run2.stats.deleted).toBe(1);

    const betaSlug = buildSourceAwareSlug({
      title: 'Beta',
      sourceKey: `${source.type}:${source.name}`,
      externalId: 'beta',
    });
    expect(await store.getNodeBySlug(betaSlug)).toBeNull();

    expect(run2.sourceId).toBeTruthy();
    expect(await provenance.findSourceItem(run2.sourceId!, 'beta')).toBeNull();
  });
});

