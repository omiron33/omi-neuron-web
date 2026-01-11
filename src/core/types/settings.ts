/**
 * Settings Types for omi-neuron-web
 * Complete configuration schema for the library
 */

import type { ClusteringAlgorithm } from './cluster';

/**
 * Embedding model options
 */
export type EmbeddingModel =
  | 'text-embedding-ada-002'
  | 'text-embedding-3-small'
  | 'text-embedding-3-large';

/**
 * Performance mode for visualization
 */
export type PerformanceMode = 'auto' | 'normal' | 'degraded' | 'fallback';

/**
 * Node type configuration
 */
export interface NodeTypeConfig {
  /** Type identifier */
  type: string;
  /** Human-readable label */
  label: string;
  /** Optional description */
  description?: string;
  /** Default domain for this type */
  defaultDomain: string;
  /** Icon name or emoji */
  icon?: string;
  /** Color hex code */
  color?: string;
  /** Custom AI prompt for analyzing this type */
  analysisPrompt?: string;
}

/**
 * Domain configuration for visualization
 */
export interface DomainConfig {
  /** Domain key */
  key: string;
  /** Human-readable label */
  label: string;
  /** Color hex code */
  color: string;
  /** Optional description */
  description?: string;
}

/**
 * Relationship type configuration
 */
export interface RelationshipTypeConfig {
  /** Type identifier */
  type: string;
  /** Human-readable label */
  label: string;
  /** Optional description */
  description?: string;
  /** Whether this type is bidirectional */
  bidirectional: boolean;
  /** Optional color hex code */
  color?: string;
}

/**
 * Visualization settings - all API-modifiable
 */
export interface VisualizationSettings {
  // Colors
  /** Domain to color mapping */
  domainColors: Record<string, string>;
  /** Default color for unknown domains */
  defaultDomainColor: string;
  /** Default edge color */
  edgeColor: string;
  /** Active/highlighted edge color */
  edgeActiveColor: string;
  /** Scene background color */
  backgroundColor: string;

  // Camera
  /** Initial camera position [x, y, z] */
  defaultCameraPosition: [number, number, number];
  /** Initial camera target [x, y, z] */
  defaultCameraTarget: [number, number, number];
  /** Minimum zoom distance */
  minZoomDistance: number;
  /** Maximum zoom distance */
  maxZoomDistance: number;

  // Rendering
  /** Enable starfield background */
  enableStarfield: boolean;
  /** Number of stars in starfield */
  starfieldCount: number;
  /** Distance at which labels appear */
  labelDistance: number;
  /** Maximum number of visible labels */
  maxVisibleLabels: number;

  // Performance
  /** Performance mode selection */
  performanceMode: PerformanceMode;
  /** Node count threshold for degraded mode */
  nodeCountThreshold: number;
  /** Maximum device pixel ratio */
  pixelRatioCap: number;

  // Animations
  /** Enable animations */
  enableAnimations: boolean;
  /** Focus tween duration in ms */
  focusTweenDuration: number;
  /** Filter transition duration in ms */
  filterTransitionDuration: number;

  // Interaction
  /** Enable hover effects */
  enableHover: boolean;
  /** Enable click handling */
  enableClick: boolean;
  /** Enable double-click handling */
  enableDoubleClick: boolean;
  /** Enable panning */
  enablePan: boolean;
  /** Enable zooming */
  enableZoom: boolean;
  /** Enable rotation */
  enableRotate: boolean;
}

/**
 * Analysis settings
 */
export interface AnalysisSettings {
  // Embeddings
  /** OpenAI embedding model */
  embeddingModel: EmbeddingModel;
  /** Embedding dimensions (must match model) */
  embeddingDimensions: number;
  /** Batch size for API calls */
  embeddingBatchSize: number;
  /** Cache TTL in seconds */
  embeddingCacheTTL: number;

  // Clustering
  /** Clustering algorithm */
  clusteringAlgorithm: ClusteringAlgorithm;
  /** Default number of clusters */
  defaultClusterCount: number;
  /** Minimum cluster size */
  minClusterSize: number;
  /** Similarity threshold for cluster assignment */
  clusterSimilarityThreshold: number;

  // Relationship inference
  /** Model for relationship inference */
  relationshipInferenceModel: string;
  /** Minimum confidence to create relationship */
  relationshipMinConfidence: number;
  /** Maximum relationships per node */
  relationshipMaxPerNode: number;

  // Relationship governance (Phase 7E)
  /** Persist inferred relationships into `suggested_edges` for review/approval workflows. */
  relationshipGovernanceEnabled: boolean;
  /** Automatically approve suggestions into real edges when confidence is high enough. */
  relationshipAutoApproveEnabled: boolean;
  /** Confidence threshold (0–1) for auto-approving suggestions into edges. */
  relationshipAutoApproveMinConfidence: number;

  // Rate limiting
  /** OpenAI requests per minute */
  openaiRateLimit: number;
  /** Maximum concurrent analysis jobs */
  maxConcurrentAnalysis: number;
}

/**
 * Instance settings
 */
export interface InstanceSettings {
  /** Human-readable instance name */
  name: string;
  /** Library version */
  version: string;
  /** Used for pg-{repoName} database naming */
  repoName: string;
}

/**
 * Database settings
 */
export interface DatabaseSettings {
  /** 'docker' for managed, 'external' for BYO */
  mode: 'docker' | 'external';
  /** Port to expose (Docker mode) */
  port: number;
  /** Container name override */
  containerName?: string;
  /** Docker image */
  image?: string;
  /** Database user */
  user?: string;
  /** Database password */
  password?: string;
  /** Database name */
  database?: string;
  /** Connection URL (external mode) */
  url?: string;
  /** Connection pool settings */
  pool?: {
    min: number;
    max: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
  };
  /** Resource limits (Docker mode) */
  resources?: {
    memoryLimit: string;
    cpuLimit?: string;
  };
}

/**
 * Storage backend selection (Phase 7B).
 * Defaults to Postgres when omitted for backwards compatibility.
 */
export interface StorageSettings {
  mode: 'postgres' | 'memory' | 'file';
  filePath?: string;
  persistIntervalMs?: number;
}

/**
 * API settings
 */
export interface ApiSettings {
  /** Base path for API routes */
  basePath: string;
  /** Enable CORS */
  enableCors: boolean;
  /** Rate limiting configuration */
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

/**
 * Logging settings
 */
export interface LoggingSettings {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Pretty print logs */
  prettyPrint: boolean;
}

/**
 * Complete settings schema - stored in database and repo config
 */
export interface NeuronSettings {
  /** Instance identification */
  instance: InstanceSettings;
  /** Visualization settings (API-modifiable) */
  visualization: VisualizationSettings;
  /** Analysis settings */
  analysis: AnalysisSettings;
  /** Node type configuration */
  nodeTypes: NodeTypeConfig[];
  /** Domain configuration */
  domains: DomainConfig[];
  /** Relationship type configuration */
  relationshipTypes: RelationshipTypeConfig[];
}

/**
 * Full configuration including non-runtime settings
 */
export interface NeuronConfig extends NeuronSettings {
  /** OpenAI configuration */
  openai: {
    apiKey: string;
    organization?: string;
    requestsPerMinute?: number;
    maxRetries?: number;
  };
  /** Database configuration */
  database: DatabaseSettings;
  /** Storage backend selection (optional, defaults to Postgres) */
  storage?: StorageSettings;
  /** API configuration */
  api: ApiSettings;
  /** Logging configuration */
  logging: LoggingSettings;
}

/**
 * Layered configuration: server-only secrets and wiring.
 * This is an additive type to help consumers avoid putting secrets in client bundles.
 */
export interface NeuronServerConfig {
  /** Optional settings overrides (merged on top of defaults) */
  settings?: Partial<NeuronSettings>;
  /** OpenAI configuration (server-only) */
  openai: NeuronConfig['openai'];
  /** Database configuration (server-only) */
  database: DatabaseSettings;
  /** Storage backend selection (optional, defaults to Postgres) */
  storage?: StorageSettings;
  /** API configuration */
  api?: Partial<ApiSettings>;
  /** Logging configuration */
  logging?: Partial<LoggingSettings>;
}

/**
 * Layered configuration: client-safe settings.
 * Should never include secrets.
 */
export interface NeuronClientConfig {
  api: Pick<ApiSettings, 'basePath'>;
  settings?: Partial<NeuronSettings>;
}

/**
 * Partial settings for updates
 */
export interface NeuronSettingsUpdate {
  visualization?: Partial<VisualizationSettings>;
  analysis?: Partial<AnalysisSettings>;
  nodeTypes?: NodeTypeConfig[];
  domains?: DomainConfig[];
  relationshipTypes?: RelationshipTypeConfig[];
}

/**
 * Default visualization settings
 */
export const DEFAULT_VISUALIZATION_SETTINGS: VisualizationSettings = {
  domainColors: {},
  defaultDomainColor: '#c0c5ff',
  edgeColor: '#4d4d55',
  edgeActiveColor: '#c6d4ff',
  backgroundColor: '#020314',
  defaultCameraPosition: [4, 8, 20],
  defaultCameraTarget: [0, 0, 0],
  minZoomDistance: 4,
  maxZoomDistance: 42,
  enableStarfield: true,
  starfieldCount: 1200,
  labelDistance: 26,
  maxVisibleLabels: 50,
  performanceMode: 'auto',
  nodeCountThreshold: 120,
  pixelRatioCap: 2,
  enableAnimations: true,
  focusTweenDuration: 800,
  filterTransitionDuration: 650,
  enableHover: true,
  enableClick: true,
  enableDoubleClick: true,
  enablePan: true,
  enableZoom: true,
  enableRotate: true,
};

/**
 * Default analysis settings
 */
export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  embeddingBatchSize: 20,
  embeddingCacheTTL: 86400,
  clusteringAlgorithm: 'kmeans',
  defaultClusterCount: 8,
  minClusterSize: 3,
  clusterSimilarityThreshold: 0.75,
  relationshipInferenceModel: 'gpt-4o-mini',
  relationshipMinConfidence: 0.7,
  relationshipMaxPerNode: 10,
  relationshipGovernanceEnabled: true,
  relationshipAutoApproveEnabled: true,
  relationshipAutoApproveMinConfidence: 0.7,
  openaiRateLimit: 60,
  maxConcurrentAnalysis: 5,
};
