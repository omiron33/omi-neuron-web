import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { InMemoryGraphStore } from '../../src/core/store';
import { DEFAULT_VISUALIZATION_SETTINGS } from '../../src/core/types/settings';

describe('InMemoryGraphStore', () => {
  it('creates nodes with deterministic slug uniqueness', async () => {
    const store = new InMemoryGraphStore();
    const created = await store.createNodes([{ label: 'Alpha' }, { label: 'Alpha' }]);
    expect(created).toHaveLength(1);

    const node = created[0];
    expect(node.slug).toBe('alpha');

    const bySlug = await store.getNodeBySlug('alpha');
    expect(bySlug?.id).toBe(node.id);
  });

  it('supports edges CRUD and updates connection counts', async () => {
    const store = new InMemoryGraphStore();
    const [a, b] = await store.createNodes([{ label: 'A' }, { label: 'B' }]);

    const created = await store.createEdges([
      { fromNodeId: a.id, toNodeId: b.id, strength: 0.7 },
      { fromNodeId: a.id, toNodeId: crypto.randomUUID(), strength: 0.2 },
    ]);
    expect(created).toHaveLength(1);

    const updatedA = await store.getNodeById(a.id);
    const updatedB = await store.getNodeById(b.id);
    expect(updatedA?.outboundCount).toBe(1);
    expect(updatedB?.inboundCount).toBe(1);
    expect(updatedA?.connectionCount).toBe(1);
    expect(updatedB?.connectionCount).toBe(1);

    const deleted = await store.deleteNode(a.id);
    expect(deleted.deleted).toBe(true);
    expect(deleted.edgesRemoved).toBe(1);

    const edges = await store.listEdges();
    expect(edges).toHaveLength(0);
  });

  it('updates and resets settings sections', async () => {
    const store = new InMemoryGraphStore();
    const original = await store.getSettings();
    expect(original.visualization.maxVisibleLabels).toBe(DEFAULT_VISUALIZATION_SETTINGS.maxVisibleLabels);

    const updated = await store.updateSettings({ visualization: { maxVisibleLabels: 123 } });
    expect(updated.visualization.maxVisibleLabels).toBe(123);

    const reset = await store.resetSettings(['visualization']);
    expect(reset.visualization.maxVisibleLabels).toBe(DEFAULT_VISUALIZATION_SETTINGS.maxVisibleLabels);
  });

  it('returns a visualization graph with slugs on edges', async () => {
    const store = new InMemoryGraphStore();
    const [a, b] = await store.createNodes([{ label: 'Alpha' }, { label: 'Beta' }]);
    await store.createEdges([{ fromNodeId: a.id, toNodeId: b.id }]);

    const graph = await store.getGraph({});
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].from).toBe('alpha');
    expect(graph.edges[0].to).toBe('beta');
  });

  it('supports embedding similarity search', async () => {
    const store = new InMemoryGraphStore();
    const [a, b, c] = await store.createNodes([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);

    await store.setNodeEmbedding(a.id, [1, 0], 'test');
    await store.setNodeEmbedding(b.id, [0.9, 0.1], 'test');
    await store.setNodeEmbedding(c.id, [-1, 0], 'test');

    const similar = await store.findSimilarNodeIds(a.id, { limit: 10 });
    expect(similar.map((r) => r.nodeId)).toEqual([b.id]);
    expect(similar[0].similarity).toBeGreaterThan(0.9);
  });

  it('supports pathfinding (shortest vs all)', async () => {
    const store = new InMemoryGraphStore();
    const [a, b, c] = await store.createNodes([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);

    await store.createEdges([
      { fromNodeId: a.id, toNodeId: b.id, strength: 0.3 },
      { fromNodeId: b.id, toNodeId: c.id, strength: 0.5 },
      { fromNodeId: a.id, toNodeId: c.id, strength: 0.9 },
    ]);

    const all = await store.findPaths({ fromNodeId: a.id, toNodeId: c.id, maxDepth: 5, algorithm: 'all' });
    expect(all.paths.length).toBeGreaterThanOrEqual(2);
    expect(all.paths[0].nodes).toEqual([a.id, c.id]);

    const shortest = await store.findPaths({
      fromNodeId: a.id,
      toNodeId: c.id,
      maxDepth: 5,
      algorithm: 'shortest',
    });
    expect(shortest.paths).toHaveLength(1);
    expect(shortest.paths[0].nodes).toEqual([a.id, c.id]);
  });

  it('expands the graph with direction + depth', async () => {
    const store = new InMemoryGraphStore();
    const [a, b, c] = await store.createNodes([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
    await store.createEdges([
      { fromNodeId: a.id, toNodeId: b.id },
      { fromNodeId: b.id, toNodeId: c.id },
    ]);

    const outbound = await store.expandGraph({ fromNodeIds: [a.id], depth: 1, direction: 'outbound' });
    expect(outbound.nodes.map((n) => n.id).sort()).toEqual([a.id, b.id].sort());

    const inbound = await store.expandGraph({ fromNodeIds: [b.id], depth: 1, direction: 'inbound' });
    expect(inbound.nodes.map((n) => n.id).sort()).toEqual([a.id, b.id].sort());

    const both = await store.expandGraph({ fromNodeIds: [b.id], depth: 1, direction: 'both' });
    expect(both.nodes.map((n) => n.id).sort()).toEqual([a.id, b.id, c.id].sort());
  });
});

