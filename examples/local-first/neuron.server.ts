import {
  defineNeuronServerConfig,
  resolveNeuronConfig,
  DEFAULT_ANALYSIS_SETTINGS,
  DEFAULT_VISUALIZATION_SETTINGS,
} from '@omiron33/omi-neuron-web';

export const neuronServerConfig = defineNeuronServerConfig({
  settings: {
    instance: {
      name: 'Local-first Example',
      version: '0.1.1',
      repoName: 'omi-neuron-web',
    },
    visualization: DEFAULT_VISUALIZATION_SETTINGS,
    analysis: DEFAULT_ANALYSIS_SETTINGS,
    nodeTypes: [],
    domains: [],
    relationshipTypes: [],
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
  storage: {
    mode: 'file',
    filePath: '.neuron/graph.json',
    persistIntervalMs: 500,
  },
  // Not used in local-first modes, but required for the legacy NeuronConfig shape.
  database: {
    mode: 'external',
    port: 5433,
    url: process.env.DATABASE_URL,
  },
  api: {
    basePath: '/api/neuron',
    enableCors: false,
  },
  logging: {
    level: 'info',
    prettyPrint: true,
  },
});

export const neuronConfig = resolveNeuronConfig(neuronServerConfig);

