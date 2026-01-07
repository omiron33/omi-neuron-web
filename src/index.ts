/**
 * omi-neuron-web
 * A drop-in Next.js library for data analysis and 3D visualization
 */

// Core types
export * from './core/types';
export * from './core/schemas';
export * from './core/events';
export { DataProcessor } from './core/analysis/data-processor';
export { EmbeddingsService } from './core/analysis/embeddings-service';
export { ClusteringEngine } from './core/analysis/clustering-engine';
export { RelationshipEngine } from './core/analysis/relationship-engine';
export { ScoringEngine } from './core/analysis/scoring-engine';
export { AnalysisPipeline } from './core/analysis/pipeline';
export * from './storage';
export * from './config';

// Visualization
export { NeuronWeb } from './visualization';
export type {
  NeuronWebProps,
  NeuronWebTheme,
  NeuronLayoutOptions,
  NeuronLayoutMode,
  ClickCardOptions,
  ClickZoomOptions,
  CardsMode,
} from './visualization';

// Re-export hooks (when implemented)
export * from './react/hooks';

// Re-export provider (when implemented)
export { NeuronWebProvider } from './react/NeuronWebProvider';

// Version
export const VERSION = '0.2.7';
