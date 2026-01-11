import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { GraphStore } from '../../src/core/store/graph-store';
import { FileBackedGraphStore, InMemoryGraphStore } from '../../src/core/store';
import { DEFAULT_VISUALIZATION_SETTINGS } from '../../src/core/types/settings';

const makeFileStore = async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'omi-neuron-conformance-'));
  const filePath = path.join(dir, 'graph.json');
  const store = new FileBackedGraphStore({ filePath, persistIntervalMs: 0 });
  return {
    store,
    cleanup: async () => {
      await store.flush();
      await fs.rm(dir, { recursive: true, force: true });
    },
  };
};

const runConformanceSuite = (name: string, factory: () => Promise<{ store: GraphStore; cleanup: () => Promise<void> }>) => {
  describe(name, () => {
    it('supports CRUD + pagination for nodes/edges', async () => {
      const { store, cleanup } = await factory();
      try {
        const created = await store.createNodes([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
        expect(created).toHaveLength(3);

        const firstTwo = await store.listNodes({ limit: 2, offset: 0 });
        const lastOne = await store.listNodes({ limit: 2, offset: 2 });
        expect(firstTwo).toHaveLength(2);
        expect(lastOne).toHaveLength(1);

        const [a, b] = firstTwo;
        const edges = await store.createEdges([{ fromNodeId: a.id, toNodeId: b.id }]);
        expect(edges).toHaveLength(1);

        const deleted = await store.deleteNode(a.id);
        expect(deleted.deleted).toBe(true);
        expect(deleted.edgesRemoved).toBeGreaterThanOrEqual(1);
      } finally {
        await cleanup();
      }
    });

    it('supports settings get/update/reset', async () => {
      const { store, cleanup } = await factory();
      try {
        const initial = await store.getSettings();
        expect(initial.visualization.maxVisibleLabels).toBe(DEFAULT_VISUALIZATION_SETTINGS.maxVisibleLabels);

        const updated = await store.updateSettings({ visualization: { maxVisibleLabels: 99 } });
        expect(updated.visualization.maxVisibleLabels).toBe(99);

        const reset = await store.resetSettings(['visualization']);
        expect(reset.visualization.maxVisibleLabels).toBe(DEFAULT_VISUALIZATION_SETTINGS.maxVisibleLabels);
      } finally {
        await cleanup();
      }
    });

    it('supports getGraph and pathfinding', async () => {
      const { store, cleanup } = await factory();
      try {
        const [a, b, c] = await store.createNodes([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
        await store.createEdges([
          { fromNodeId: a.id, toNodeId: b.id, strength: 0.4 },
          { fromNodeId: b.id, toNodeId: c.id, strength: 0.4 },
          { fromNodeId: a.id, toNodeId: c.id, strength: 0.9 },
        ]);

        const graph = await store.getGraph({});
        expect(graph.nodes.length).toBeGreaterThanOrEqual(3);
        expect(graph.edges.length).toBeGreaterThanOrEqual(2);

        const shortest = await store.findPaths({ fromNodeId: a.id, toNodeId: c.id, algorithm: 'shortest' });
        expect(shortest.paths).toHaveLength(1);
        expect(shortest.paths[0].nodes).toEqual([a.id, c.id]);
      } finally {
        await cleanup();
      }
    });

    it('supports embeddings + similarity', async () => {
      const { store, cleanup } = await factory();
      try {
        const [a, b] = await store.createNodes([{ label: 'A' }, { label: 'B' }]);
        await store.setNodeEmbedding(a.id, [1, 0], 'test');
        await store.setNodeEmbedding(b.id, [0.9, 0.1], 'test');

        const similar = await store.findSimilarNodeIds(a.id, { limit: 10, minSimilarity: 0 });
        expect(similar[0]?.nodeId).toBe(b.id);
        expect(similar[0]?.similarity).toBeGreaterThan(0.9);
      } finally {
        await cleanup();
      }
    });
  });
};

runConformanceSuite('GraphStore conformance: memory', async () => ({
  store: new InMemoryGraphStore(),
  cleanup: async () => {},
}));

runConformanceSuite('GraphStore conformance: file', async () => makeFileStore());
