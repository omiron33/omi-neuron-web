import { describe, expect, it } from 'vitest';
import { createNeuronRoutes } from '../../src/api';
import { InMemoryGraphStore } from '../../src/core/store';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS, type NeuronConfig } from '../../src/core/types/settings';

describe('API routes store injection', () => {
  it('shares a single injected store across route handlers', async () => {
    const config: NeuronConfig = {
      instance: { name: 'test', version: '0.1.1', repoName: 'omi-neuron-web' },
      visualization: DEFAULT_VISUALIZATION_SETTINGS,
      analysis: DEFAULT_ANALYSIS_SETTINGS,
      nodeTypes: [],
      domains: [],
      relationshipTypes: [],
      openai: { apiKey: '' },
      database: { mode: 'external', port: 5433 },
      api: { basePath: '/api/neuron', enableCors: false },
      logging: { level: 'info', prettyPrint: true },
      storage: { mode: 'memory' },
    };

    const store = new InMemoryGraphStore();
    const routes = createNeuronRoutes(config, { store });

    const createNodeResponse = await routes.nodes.POST(
      new Request('http://test/api/neuron/nodes', {
        method: 'POST',
        body: JSON.stringify({ nodes: [{ label: 'Alpha' }] }),
      })
    );
    const createdNodePayload = (await createNodeResponse.json()) as { created: Array<{ id: string }> };
    expect(createdNodePayload.created).toHaveLength(1);
    const nodeId = createdNodePayload.created[0].id;

    const createEdgeResponse = await routes.edges.POST(
      new Request('http://test/api/neuron/edges', {
        method: 'POST',
        body: JSON.stringify({ edges: [{ fromNodeId: nodeId, toNodeId: nodeId }] }),
      })
    );
    expect(createEdgeResponse.status).toBe(201);

    const graphResponse = await routes.graph.GET(new Request('http://test/api/neuron/graph'));
    const graph = (await graphResponse.json()) as { nodes: Array<{ id: string }>; edges: Array<{ id: string }> };
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(1);
  });
});

