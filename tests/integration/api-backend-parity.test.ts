import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNeuronRoutes } from '../../src/api';
import { MockEmbeddingProvider } from '../../src/core/providers/testing/mock-embedding-provider';
import { FileBackedGraphStore, InMemoryGraphStore } from '../../src/core/store';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS, type NeuronConfig } from '../../src/core/types/settings';

type BackendName = 'memory' | 'file';

const baseConfig = (storageMode: BackendName): NeuronConfig => ({
  instance: { name: 'test', version: '0.1.1', repoName: 'omi-neuron-web' },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: { ...DEFAULT_ANALYSIS_SETTINGS, embeddingDimensions: 6 },
  nodeTypes: [],
  domains: [],
  relationshipTypes: [],
  openai: { apiKey: '' },
  database: { mode: 'external', port: 5433 },
  api: { basePath: '/api/neuron', enableCors: false },
  logging: { level: 'info', prettyPrint: true },
  storage: { mode: storageMode === 'file' ? 'file' : 'memory' },
});

const createBackend = async (backend: BackendName) => {
  if (backend === 'memory') {
    const store = new InMemoryGraphStore();
    return { store, cleanup: async () => {} };
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'omi-neuron-parity-'));
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

describe.each<BackendName>(['memory', 'file'])('API parity (%s)', (backend) => {
  it('supports nodes/edges/graph/settings/search across backends', async () => {
    const { store, cleanup } = await createBackend(backend);
    try {
      const config = baseConfig(backend);
      const embeddingProvider = new MockEmbeddingProvider({ dimensions: config.analysis.embeddingDimensions });
      const routes = createNeuronRoutes(config, { store, embeddingProvider });

      const nodeCreateResponse = await routes.nodes.POST(
        new Request('http://test/api/neuron/nodes', {
          method: 'POST',
          body: JSON.stringify({ nodes: [{ label: 'Alpha' }, { label: 'Beta' }] }),
        })
      );
      expect(nodeCreateResponse.status).toBe(201);
      const nodeCreatePayload = (await nodeCreateResponse.json()) as { created: Array<{ id: string }> };
      expect(nodeCreatePayload.created.length).toBeGreaterThanOrEqual(1);
      const nodeId = nodeCreatePayload.created[0].id;

      const nodesResponse = await routes.nodes.GET(new Request('http://test/api/neuron/nodes?limit=50&page=1'));
      const nodesPayload = (await nodesResponse.json()) as { nodes: Array<{ id: string }> };
      expect(nodesPayload.nodes.length).toBeGreaterThanOrEqual(1);

      const edgeCreateResponse = await routes.edges.POST(
        new Request('http://test/api/neuron/edges', {
          method: 'POST',
          body: JSON.stringify({ edges: [{ fromNodeId: nodeId, toNodeId: nodeId }] }),
        })
      );
      expect(edgeCreateResponse.status).toBe(201);
      const edgeCreatePayload = (await edgeCreateResponse.json()) as { created: Array<{ id: string }> };
      expect(edgeCreatePayload.created).toHaveLength(1);

      const graphResponse = await routes.graph.GET(new Request('http://test/api/neuron/graph'));
      const graph = (await graphResponse.json()) as { nodes: Array<{ id: string }>; edges: Array<{ id: string }> };
      expect(graph.nodes.length).toBeGreaterThanOrEqual(1);
      expect(graph.edges).toHaveLength(1);

      const settingsResponse = await routes.settings.PATCH(
        new Request('http://test/api/neuron/settings', {
          method: 'PATCH',
          body: JSON.stringify({ visualization: { maxVisibleLabels: 123 } }),
        })
      );
      const settingsPayload = (await settingsResponse.json()) as { settings: { visualization: { maxVisibleLabels: number } } };
      expect(settingsPayload.settings.visualization.maxVisibleLabels).toBe(123);

      const [a, b] = await store.listNodes();
      const embeddedNodes = await embeddingProvider.embed({
        model: config.analysis.embeddingModel,
        input: [a.label, b.label],
        dimensions: config.analysis.embeddingDimensions,
      });
      await store.setNodeEmbedding(a.id, embeddedNodes.embeddings[0] ?? [], embeddedNodes.model);
      await store.setNodeEmbedding(b.id, embeddedNodes.embeddings[1] ?? [], embeddedNodes.model);

      const similarResponse = await routes.search.POST(
        new Request('http://test/api/neuron/search/similar', {
          method: 'POST',
          body: JSON.stringify({ nodeId: a.id, limit: 5, minSimilarity: -1 }),
        })
      );
      const similarPayload = (await similarResponse.json()) as { results: Array<{ node: { id: string }; similarity: number }> };
      expect(similarPayload.results[0]?.node.id).toBe(b.id);
      expect(similarPayload.results[0]?.similarity).toBeTypeOf('number');

      const searchResponse = await routes.search.POST(
        new Request('http://test/api/neuron/search', {
          method: 'POST',
          body: JSON.stringify({ query: a.label, limit: 5, minSimilarity: -1, includeExplanation: true }),
        })
      );
      const searchPayload = (await searchResponse.json()) as {
        results: Array<{ node: { id: string }; similarity: number }>;
        queryEmbedding?: number[];
      };
      expect(searchPayload.results[0]?.node.id).toBe(a.id);
      expect(searchPayload.results[0]?.similarity).toBeGreaterThan(0.999);
      expect(searchPayload.queryEmbedding).toHaveLength(config.analysis.embeddingDimensions);
    } finally {
      await cleanup();
    }
  });
});
