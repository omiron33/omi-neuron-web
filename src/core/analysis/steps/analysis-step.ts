import type { AnalysisRun } from '../../types/analysis';
import type { EventBus } from '../../events/event-bus';
import type { Database } from '../../../storage/database';
import type { PipelineOptions, PipelineProgress } from '../pipeline';
import type { EmbeddingsService } from '../embeddings-service';
import type { ClusteringEngine } from '../clustering-engine';
import type { RelationshipEngine } from '../relationship-engine';

export type AnalysisStepContext = {
  db: Database;
  embeddings: EmbeddingsService;
  clustering: ClusteringEngine;
  relationships: RelationshipEngine;
  events: EventBus;
  signal?: AbortSignal;
  updateJobResults: (jobId: string, updates: Partial<AnalysisRun['results']>) => Promise<void>;
  resolveNodeIds: (nodeIds?: string[], forceRecompute?: boolean) => Promise<string[]>;
  reportProgress: (progress: PipelineProgress) => void;
};

export type AnalysisStep = {
  /**
   * Stable identifier (used for overrides and debugging).
   * Prefer simple IDs like: "embeddings", "clustering", "relationships".
   */
  id: string;
  stage: Exclude<PipelineProgress['stage'], 'complete'>;
  isEnabled?: (options: PipelineOptions) => boolean;
  run: (job: AnalysisRun, options: PipelineOptions, context: AnalysisStepContext) => Promise<void>;
};

