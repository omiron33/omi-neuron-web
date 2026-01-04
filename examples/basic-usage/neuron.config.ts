import { defineNeuronConfig, DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from 'omi-neuron-web';

export default defineNeuronConfig({
  instance: {
    name: 'Basic Usage',
    version: '0.1.0',
    repoName: 'basic-usage',
  },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: DEFAULT_ANALYSIS_SETTINGS,
  nodeTypes: [],
  domains: [],
  relationshipTypes: [],
  openai: { apiKey: process.env.OPENAI_API_KEY ?? '' },
  database: { mode: 'docker', port: 5433 },
  api: { basePath: '/api/neuron', enableCors: false },
  logging: { level: 'info', prettyPrint: true },
});
