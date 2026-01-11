import { describe, expect, it } from 'vitest';
import { createNeuronRoutes } from '../../src/api';
import { InMemoryGraphStore } from '../../src/core/store';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS, type NeuronConfig } from '../../src/core/types/settings';

describe('API routes scope isolation', () => {
  it('isolates nodes/edges/settings across x-neuron-scope', async () => {
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

    const createAlpha = await routes.nodes.POST(
      new Request('http://test/api/neuron/nodes', {
        method: 'POST',
        headers: { 'x-neuron-scope': 'scope-a' },
        body: JSON.stringify({ nodes: [{ label: 'Alpha' }] }),
      })
    );
    const alphaPayload = (await createAlpha.json()) as { created: Array<{ id: string; label: string }> };
    expect(alphaPayload.created).toHaveLength(1);
    const alphaId = alphaPayload.created[0]?.id;

    const createBravo = await routes.nodes.POST(
      new Request('http://test/api/neuron/nodes', {
        method: 'POST',
        headers: { 'x-neuron-scope': 'scope-b' },
        body: JSON.stringify({ nodes: [{ label: 'Bravo' }] }),
      })
    );
    const bravoPayload = (await createBravo.json()) as { created: Array<{ id: string; label: string }> };
    expect(bravoPayload.created).toHaveLength(1);
    const bravoId = bravoPayload.created[0]?.id;

    const listA = await routes.nodes.GET(new Request('http://test/api/neuron/nodes', { headers: { 'x-neuron-scope': 'scope-a' } }));
    const listAPayload = (await listA.json()) as { nodes: Array<{ id: string; label: string }> };
    expect(listAPayload.nodes.map((n) => n.id)).toEqual([alphaId]);

    const listB = await routes.nodes.GET(new Request('http://test/api/neuron/nodes', { headers: { 'x-neuron-scope': 'scope-b' } }));
    const listBPayload = (await listB.json()) as { nodes: Array<{ id: string; label: string }> };
    expect(listBPayload.nodes.map((n) => n.id)).toEqual([bravoId]);

    const createEdgeA = await routes.edges.POST(
      new Request('http://test/api/neuron/edges', {
        method: 'POST',
        headers: { 'x-neuron-scope': 'scope-a' },
        body: JSON.stringify({ edges: [{ fromNodeId: alphaId, toNodeId: alphaId }] }),
      })
    );
    expect(createEdgeA.status).toBe(201);

    const edgesA = await routes.edges.GET(new Request('http://test/api/neuron/edges', { headers: { 'x-neuron-scope': 'scope-a' } }));
    const edgesAPayload = (await edgesA.json()) as { edges: Array<{ id: string }> };
    expect(edgesAPayload.edges).toHaveLength(1);

    const edgesB = await routes.edges.GET(new Request('http://test/api/neuron/edges', { headers: { 'x-neuron-scope': 'scope-b' } }));
    const edgesBPayload = (await edgesB.json()) as { edges: Array<{ id: string }> };
    expect(edgesBPayload.edges).toHaveLength(0);

    const hacked = await routes.nodes.PATCH(
      new Request(`http://test/api/neuron/nodes/${alphaId}`, {
        method: 'PATCH',
        headers: { 'x-neuron-scope': 'scope-b' },
        body: JSON.stringify({ label: 'Hacked' }),
      })
    );
    expect(await hacked.json()).toBeNull();

    const settingsAUpdate = await routes.settings.PATCH(
      new Request('http://test/api/neuron/settings', {
        method: 'PATCH',
        headers: { 'x-neuron-scope': 'scope-a' },
        body: JSON.stringify({ visualization: { backgroundColor: '#ffffff' } }),
      })
    );
    expect(settingsAUpdate.status).toBe(200);

    const settingsA = await routes.settings.GET(new Request('http://test/api/neuron/settings', { headers: { 'x-neuron-scope': 'scope-a' } }));
    const settingsAPayload = (await settingsA.json()) as { settings: { visualization: { backgroundColor: string } } };
    expect(settingsAPayload.settings.visualization.backgroundColor).toBe('#ffffff');

    const settingsB = await routes.settings.GET(new Request('http://test/api/neuron/settings', { headers: { 'x-neuron-scope': 'scope-b' } }));
    const settingsBPayload = (await settingsB.json()) as { settings: { visualization: { backgroundColor: string } } };
    expect(settingsBPayload.settings.visualization.backgroundColor).not.toBe('#ffffff');
  });
});

