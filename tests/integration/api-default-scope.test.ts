import { describe, expect, it } from 'vitest';
import { createNeuronRoutes } from '../../src/api';
import { InMemoryGraphStore } from '../../src/core/store';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS, type NeuronConfig } from '../../src/core/types/settings';

describe('API routes default scope behavior', () => {
  it('treats missing x-neuron-scope as the default scope and preserves isolation', async () => {
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

    const createDefaultNode = await routes.nodes.POST(
      new Request('http://test/api/neuron/nodes', {
        method: 'POST',
        body: JSON.stringify({ nodes: [{ label: 'Default Node' }] }),
      })
    );
    expect(createDefaultNode.status).toBe(201);
    const defaultPayload = (await createDefaultNode.json()) as { created: Array<{ id: string }> };
    expect(defaultPayload.created).toHaveLength(1);
    const defaultNodeId = defaultPayload.created[0]?.id;

    const createScopedNode = await routes.nodes.POST(
      new Request('http://test/api/neuron/nodes', {
        method: 'POST',
        headers: { 'x-neuron-scope': 'scope-a' },
        body: JSON.stringify({ nodes: [{ label: 'Scoped Node' }] }),
      })
    );
    expect(createScopedNode.status).toBe(201);
    const scopedPayload = (await createScopedNode.json()) as { created: Array<{ id: string }> };
    expect(scopedPayload.created).toHaveLength(1);
    const scopedNodeId = scopedPayload.created[0]?.id;

    const listDefault = await routes.nodes.GET(new Request('http://test/api/neuron/nodes'));
    const listDefaultPayload = (await listDefault.json()) as { nodes: Array<{ id: string }> };
    expect(listDefaultPayload.nodes.map((node) => node.id)).toEqual([defaultNodeId]);

    const listExplicitDefault = await routes.nodes.GET(
      new Request('http://test/api/neuron/nodes', { headers: { 'x-neuron-scope': 'default' } })
    );
    const listExplicitDefaultPayload = (await listExplicitDefault.json()) as { nodes: Array<{ id: string }> };
    expect(listExplicitDefaultPayload.nodes.map((node) => node.id)).toEqual([defaultNodeId]);

    const listScopeA = await routes.nodes.GET(new Request('http://test/api/neuron/nodes', { headers: { 'x-neuron-scope': 'scope-a' } }));
    const listScopeAPayload = (await listScopeA.json()) as { nodes: Array<{ id: string }> };
    expect(listScopeAPayload.nodes.map((node) => node.id)).toEqual([scopedNodeId]);

    const createDefaultEdge = await routes.edges.POST(
      new Request('http://test/api/neuron/edges', {
        method: 'POST',
        body: JSON.stringify({ edges: [{ fromNodeId: defaultNodeId, toNodeId: defaultNodeId }] }),
      })
    );
    expect(createDefaultEdge.status).toBe(201);

    const defaultEdges = await routes.edges.GET(new Request('http://test/api/neuron/edges'));
    const defaultEdgesPayload = (await defaultEdges.json()) as { edges: Array<{ id: string }> };
    expect(defaultEdgesPayload.edges).toHaveLength(1);

    const scopeAEdges = await routes.edges.GET(new Request('http://test/api/neuron/edges', { headers: { 'x-neuron-scope': 'scope-a' } }));
    const scopeAEdgesPayload = (await scopeAEdges.json()) as { edges: Array<{ id: string }> };
    expect(scopeAEdgesPayload.edges).toHaveLength(0);

    const hacked = await routes.nodes.PATCH(
      new Request(`http://test/api/neuron/nodes/${defaultNodeId}`, {
        method: 'PATCH',
        headers: { 'x-neuron-scope': 'scope-a' },
        body: JSON.stringify({ label: 'Hacked' }),
      })
    );
    expect(await hacked.json()).toBeNull();

    const settingsDefaultUpdate = await routes.settings.PATCH(
      new Request('http://test/api/neuron/settings', {
        method: 'PATCH',
        body: JSON.stringify({ visualization: { backgroundColor: '#123456' } }),
      })
    );
    expect(settingsDefaultUpdate.status).toBe(200);

    const settingsDefault = await routes.settings.GET(new Request('http://test/api/neuron/settings'));
    const settingsDefaultPayload = (await settingsDefault.json()) as { settings: { visualization: { backgroundColor: string } } };
    expect(settingsDefaultPayload.settings.visualization.backgroundColor).toBe('#123456');

    const settingsScopeA = await routes.settings.GET(new Request('http://test/api/neuron/settings', { headers: { 'x-neuron-scope': 'scope-a' } }));
    const settingsScopeAPayload = (await settingsScopeA.json()) as { settings: { visualization: { backgroundColor: string } } };
    expect(settingsScopeAPayload.settings.visualization.backgroundColor).not.toBe('#123456');
  });
});

