/**
 * Analysis Types for omi-neuron-web
 * Defines analysis jobs and pipeline operations
 */

import type { RelationshipType, EdgeEvidence } from './edge';

/**
 * Type of analysis run
 */
export type AnalysisRunType =
  | 'embedding'
  | 'clustering'
  | 'relationship_inference'
  | 'full_analysis';

/**
 * Status of an analysis job
 */
export type AnalysisJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Analysis run record - tracks analysis jobs
 */
export interface AnalysisRun {
  /** UUID v4 identifier */
  id: string;
  /** Type of analysis being performed */
  runType: AnalysisRunType;

  // Input parameters
  inputParams: {
    /** Specific node IDs or all if undefined */
    nodeIds?: string[];
    /** Force regenerate even if exists */
    forceRecompute?: boolean;
    /** Target cluster count for k-means */
    clusterCount?: number;
    /** Minimum confidence for relationships */
    relationshipThreshold?: number;
    /** Embedding model to use */
    embeddingModel?: string;
  };

  // Results summary
  results: {
    nodesProcessed: number;
    embeddingsGenerated: number;
    clustersCreated: number;
    relationshipsInferred: number;
    errors: Array<{ nodeId: string; error: string }>;
  };

  // Status
  /** Current job status */
  status: AnalysisJobStatus;
  /** Progress percentage (0-100) */
  progress: number;

  // Timing
  /** When the job started */
  startedAt?: Date | null;
  /** When the job completed */
  completedAt?: Date | null;
  /** Duration in milliseconds */
  durationMs?: number | null;

  // Error handling
  /** Error message if failed */
  errorMessage?: string | null;
  /** Error stack trace */
  errorStack?: string | null;
}

/**
 * Request to trigger analysis
 */
export interface AnalysisRequest {
  /** Type of analysis to perform */
  action: 'embeddings' | 'cluster' | 'infer_relationships' | 'full';

  /** Specific node IDs, or all if omitted */
  nodeIds?: string[];

  /** Options per action type */
  options?: {
    // Embeddings
    forceRecompute?: boolean;
    embeddingModel?: string;

    // Clustering
    clusterCount?: number;
    minClusterSize?: number;
    reassignAll?: boolean;

    // Relationship inference
    relationshipThreshold?: number;
    maxRelationshipsPerNode?: number;
    includeExisting?: boolean;
  };

  /** Run asynchronously (default: true for large jobs) */
  async?: boolean;
  /** Webhook URL to notify on completion */
  webhookUrl?: string;
}

/**
 * Response from triggering analysis
 */
export interface AnalysisResponse {
  /** Job ID for tracking */
  jobId: string;
  /** Current status */
  status: AnalysisJobStatus;
  /** Estimated duration in seconds */
  estimatedDuration?: number;
  /** Results if sync and completed */
  results?: AnalysisRun['results'];
}

/**
 * Relationship inference result
 */
export interface InferredRelationshipResult {
  fromNodeId: string;
  toNodeId: string;
  confidence: number;
  reasoning: string;
  suggestedType: RelationshipType;
  evidence: EdgeEvidence[];
}

/**
 * Embedding generation result
 */
export interface EmbeddingResult {
  nodeId: string;
  embedding: number[];
  model: string;
  tokenCount: number;
}

/**
 * Clustering result
 */
export interface ClusteringResult {
  clusterId: string;
  label: string;
  nodeIds: string[];
  centroid: number[];
  avgSimilarity: number;
}

/**
 * Analysis pipeline configuration
 */
export interface AnalysisPipelineConfig {
  // Embeddings
  embeddingModel: string;
  embeddingDimensions: number;
  embeddingBatchSize: number;
  embeddingCacheTTL: number;

  // Clustering
  clusteringAlgorithm: 'kmeans' | 'dbscan' | 'hierarchical';
  defaultClusterCount: number;
  minClusterSize: number;
  clusterSimilarityThreshold: number;

  // Relationship inference
  relationshipInferenceModel: string;
  relationshipMinConfidence: number;
  relationshipMaxPerNode: number;

  // Rate limiting
  openaiRateLimit: number;
  maxConcurrentAnalysis: number;
}


