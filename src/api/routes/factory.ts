import type { NeuronConfig } from '../../core/types/settings';
import { createNodesRoutes } from './nodes';
import { createEdgesRoutes } from './edges';
import { createGraphRoutes } from './graph';
import { createAnalyzeRoutes } from './analyze';
import { createSettingsRoutes } from './settings';
import { createSearchRoutes } from './search';
import { createHealthRoutes } from './health';

export function createNeuronRoutes(config: NeuronConfig) {
  return {
    nodes: createNodesRoutes(config),
    edges: createEdgesRoutes(config),
    graph: createGraphRoutes(config),
    analyze: createAnalyzeRoutes(config),
    settings: createSettingsRoutes(config),
    search: createSearchRoutes(config),
    health: createHealthRoutes(config),
  };
}
