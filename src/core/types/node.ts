/**
 * Node Types for omi-neuron-web
 * Defines the core data structures for nodes in the neuron web graph
 */

/**
 * Node tier - affects visual prominence and analysis priority
 */
export type NodeTier = 'primary' | 'secondary' | 'tertiary' | 'insight';

/**
 * Analysis status for tracking node processing state
 */
export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed';

/**
 * Base node interface - all nodes in the system extend this
 * Kept minimal to allow maximum flexibility in consuming apps
 */
export interface NeuronNodeBase {
  /** UUID v4 identifier */
  id: string;
  /** URL-safe unique identifier */
  slug: string;
  /** Human-readable display name */
  label: string;
  /** Configurable node type per instance */
  nodeType: string;
  /** Category/grouping for visualization */
  domain: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Extended node with all optional analysis fields
 */
export interface NeuronNode extends NeuronNodeBase {
  // Content fields
  /** AI-generated or manual summary */
  summary?: string | null;
  /** Longer form description */
  description?: string | null;
  /** Full content for analysis source */
  content?: string | null;

  // Metadata (schema-free for flexibility)
  metadata: Record<string, unknown>;

  // Analysis fields (populated by engine)
  /** OpenAI embedding vector (1536 dimensions for ada-002) */
  embedding?: number[] | null;
  /** Model used for embedding generation */
  embeddingModel?: string | null;
  /** When embedding was generated */
  embeddingGeneratedAt?: Date | null;

  // Clustering fields
  /** ID of the cluster this node belongs to */
  clusterId?: string | null;
  /** Similarity score to cluster centroid (0-1) */
  clusterSimilarity?: number | null;

  // Relationship fields (cached counts)
  /** Total edge count */
  connectionCount?: number;
  /** Inbound edge count */
  inboundCount?: number;
  /** Outbound edge count */
  outboundCount?: number;

  // Status fields
  /** Current analysis processing status */
  analysisStatus?: AnalysisStatus;
  /** Error message if analysis failed */
  analysisError?: string | null;

  // Visualization hints
  /** Node importance tier */
  tier?: NodeTier;
  /** Visual priority (0-100), affects render order */
  visualPriority?: number;
  /** Manual position override [x, y, z] */
  positionOverride?: [number, number, number] | null;
}

/**
 * Input type for creating nodes - minimal required fields
 */
export interface NeuronNodeCreate {
  /** Auto-generated from label if not provided */
  slug?: string;
  /** Required: human-readable label */
  label: string;
  /** Defaults to config.defaultNodeType */
  nodeType?: string;
  /** Defaults to config.defaultDomain */
  domain?: string;
  /** Optional summary */
  summary?: string;
  /** Optional description */
  description?: string;
  /** Optional full content for analysis */
  content?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional tier */
  tier?: NodeTier;
}

/**
 * Input type for updating nodes
 */
export interface NeuronNodeUpdate {
  label?: string;
  summary?: string;
  description?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  domain?: string;
  tier?: NodeTier;
  positionOverride?: [number, number, number] | null;
}

/**
 * Batch input for ingesting multiple nodes
 */
export interface NeuronNodeBatchCreate {
  nodes: NeuronNodeCreate[];
  options?: {
    /** Skip if slug exists */
    skipDuplicates?: boolean;
    /** Update existing on slug conflict */
    updateOnConflict?: boolean;
    /** Trigger analysis after insert */
    autoAnalyze?: boolean;
    /** Depth of analysis to trigger */
    analysisDepth?: 'embeddings' | 'cluster' | 'full';
  };
}

/**
 * Visual node representation for Three.js rendering
 */
export interface NeuronVisualNode {
  id: string;
  slug: string;
  label: string;
  domain: string;
  tier?: NodeTier;
  metadata: Record<string, unknown>;
  /** Reference string (e.g., scripture reference, citation) */
  ref?: string | null;
  connectionCount: number;
  /** Optional position override */
  position?: [number, number, number];
}


