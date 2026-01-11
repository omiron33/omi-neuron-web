import path from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { createNeuronRoutes } from '../../src/api';
import { MockEmbeddingProvider } from '../../src/core/providers/testing/mock-embedding-provider';
import { InMemoryGraphStore } from '../../src/core/store';
import {
  IngestionEngine,
  MarkdownConnector,
  MemoryProvenanceStore,
} from '../../src/core/ingestion';
import type { GetGraphResponse } from '../../src/core/types/api';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS, type NeuronConfig } from '../../src/core/types/settings';
import { NeuronWeb } from '../../src/visualization/NeuronWeb';

const fixturePath = (...parts: string[]) =>
  path.join(process.cwd(), 'tests', 'fixtures', ...parts);

describe('end-to-end ingestion → analyze → visualize (memory)', () => {
  it('ingests markdown fixtures, supports semantic search, and produces visualization-ready graph data', async () => {
    const store = new InMemoryGraphStore();
    const provenance = new MemoryProvenanceStore();
    const engine = new IngestionEngine(store, provenance);

    const markdownPath = fixturePath('ingestion', 'markdown');
    const connector = new MarkdownConnector({ path: markdownPath });
    const records = await connector.listRecords();

    const ingestResult = await engine.ingest(records, {
      source: { type: 'markdown', name: 'fixtures', config: { path: markdownPath } },
    });

    expect(ingestResult.stats.created).toBe(3);
    expect(ingestResult.stats.errors).toBe(0);

    const nodes = await store.listNodes();
    expect(nodes).toHaveLength(3);
    expect((await store.listEdges()).length).toBeGreaterThanOrEqual(1);

    const config: NeuronConfig = {
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
      storage: { mode: 'memory' },
    };

    const embeddingProvider = new MockEmbeddingProvider({ dimensions: config.analysis.embeddingDimensions });
    const routes = createNeuronRoutes(config, { store, embeddingProvider });

    const embeddings = await embeddingProvider.embed({
      model: config.analysis.embeddingModel,
      input: nodes.map((n) => n.label),
      dimensions: config.analysis.embeddingDimensions,
    });

    for (const [idx, node] of nodes.entries()) {
      await store.setNodeEmbedding(node.id, embeddings.embeddings[idx] ?? [], embeddings.model);
    }

    const target = nodes[0];
    if (!target) throw new Error('Expected at least one node');

    const searchResponse = await routes.search.POST(
      new Request('http://test/api/neuron/search', {
        method: 'POST',
        body: JSON.stringify({ query: target.label, limit: 5, minSimilarity: -1, includeExplanation: true }),
      })
    );
    expect(searchResponse.status).toBe(200);
    const searchPayload = (await searchResponse.json()) as {
      results: Array<{ node: { id: string }; similarity: number }>;
      queryEmbedding?: number[];
    };
    expect(searchPayload.results[0]?.node.id).toBe(target.id);
    expect(searchPayload.results[0]?.similarity).toBeGreaterThan(0.999);
    expect(searchPayload.queryEmbedding).toHaveLength(config.analysis.embeddingDimensions);

    const similarResponse = await routes.search.POST(
      new Request('http://test/api/neuron/search/similar', {
        method: 'POST',
        body: JSON.stringify({ nodeId: target.id, limit: 10, minSimilarity: -1 }),
      })
    );
    expect(similarResponse.status).toBe(200);
    const similarPayload = (await similarResponse.json()) as {
      results: Array<{ node: { id: string }; similarity: number }>;
    };
    expect(similarPayload.results.length).toBeGreaterThanOrEqual(1);
    expect(similarPayload.results.some((r) => r.node.id === target.id)).toBe(false);

    const graphResponse = await routes.graph.GET(new Request('http://test/api/neuron/graph'));
    expect(graphResponse.status).toBe(200);
    const graphPayload = (await graphResponse.json()) as GetGraphResponse;
    expect(graphPayload.nodes).toHaveLength(3);
    expect(graphPayload.edges.length).toBeGreaterThanOrEqual(1);

    const element = React.createElement(NeuronWeb, {
      graphData: {
        nodes: graphPayload.nodes,
        edges: graphPayload.edges,
      },
    });
    expect(element).toBeTruthy();
  });
});
