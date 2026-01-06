import { defineNeuronConfig, DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from '@omiron33/omi-neuron-web';

export default defineNeuronConfig({
  instance: {
    name: 'Narrative Analysis',
    version: '0.1.0',
    repoName: 'narrative-analysis',
  },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: DEFAULT_ANALYSIS_SETTINGS,
  nodeTypes: [
    { type: 'claim', label: 'Claim', defaultDomain: 'narrative', icon: '📢' },
    { type: 'entity', label: 'Entity', defaultDomain: 'actors', icon: '👤' },
    { type: 'source', label: 'Source', defaultDomain: 'evidence', icon: '📄' },
  ],
  domains: [
    { key: 'narrative', label: 'Narrative', color: '#ff73fa' },
    { key: 'actors', label: 'Actors', color: '#00f5d4' },
    { key: 'evidence', label: 'Evidence', color: '#ffa94d' },
  ],
  relationshipTypes: [
    { type: 'supports', label: 'Supports', bidirectional: false },
    { type: 'contradicts', label: 'Contradicts', bidirectional: true },
    { type: 'mentions', label: 'Mentions', bidirectional: false },
  ],
  openai: { apiKey: process.env.OPENAI_API_KEY ?? '' },
  database: { mode: 'docker', port: 5433 },
  api: { basePath: '/api/neuron', enableCors: false },
  logging: { level: 'info', prettyPrint: true },
});
