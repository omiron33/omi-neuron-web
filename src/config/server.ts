import type { NeuronConfig, NeuronServerConfig, NeuronSettings } from '../core/types/settings';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from '../core/types/settings';
import { VERSION } from '../version';

const buildDefaultNeuronConfig = (overrides?: Partial<NeuronSettings>): NeuronConfig => ({
  instance: {
    name: overrides?.instance?.name ?? 'default',
    version: overrides?.instance?.version ?? VERSION,
    repoName: overrides?.instance?.repoName ?? 'omi-neuron-web',
  },
  visualization: { ...DEFAULT_VISUALIZATION_SETTINGS, ...(overrides?.visualization ?? {}) },
  analysis: { ...DEFAULT_ANALYSIS_SETTINGS, ...(overrides?.analysis ?? {}) },
  nodeTypes: overrides?.nodeTypes ?? [],
  domains: overrides?.domains ?? [],
  relationshipTypes: overrides?.relationshipTypes ?? [],
  openai: {
    apiKey: '',
  },
  database: {
    mode: 'external',
    port: 5433,
    url: undefined,
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

export const defineNeuronServerConfig = (config: NeuronServerConfig): NeuronServerConfig => config;

/**
 * Resolve a full legacy `NeuronConfig` from a layered server config.
 * This is primarily a compatibility helper so existing factories can continue to accept `NeuronConfig`.
 */
export const resolveNeuronConfig = (server: NeuronServerConfig): NeuronConfig => {
  const base = buildDefaultNeuronConfig(server.settings);
  return {
    ...base,
    openai: server.openai,
    database: server.database,
    storage: server.storage,
    api: { ...base.api, ...(server.api ?? {}) },
    logging: { ...base.logging, ...(server.logging ?? {}) },
  };
};
