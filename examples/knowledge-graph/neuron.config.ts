import { defineNeuronConfig, DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from 'omi-neuron-web';

export default defineNeuronConfig({
  instance: {
    name: 'Knowledge Graph',
    version: '0.1.0',
    repoName: 'knowledge-graph',
  },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: DEFAULT_ANALYSIS_SETTINGS,
  nodeTypes: [
    { type: 'concept', label: 'Concept', defaultDomain: 'theology' },
    { type: 'doctrine', label: 'Doctrine', defaultDomain: 'theology' },
    { type: 'passage', label: 'Passage', defaultDomain: 'scripture' },
  ],
  domains: [
    { key: 'theology', label: 'Theology', color: '#9d7bff' },
    { key: 'scripture', label: 'Scripture', color: '#22d3ee' },
    { key: 'history', label: 'History', color: '#ff5f71' },
    { key: 'practice', label: 'Practice', color: '#00f5d4' },
  ],
  relationshipTypes: [],
  openai: { apiKey: process.env.OPENAI_API_KEY ?? '' },
  database: { mode: 'docker', port: 5433 },
  api: { basePath: '/api/neuron', enableCors: false },
  logging: { level: 'info', prettyPrint: true },
});
