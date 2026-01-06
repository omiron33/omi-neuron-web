/**
 * Cluster Types for omi-neuron-web
 * Defines groupings of similar nodes based on embeddings
 */

/**
 * Cluster represents a grouping of similar nodes
 */
export interface NeuronCluster {
  /** UUID v4 identifier */
  id: string;
  /** AI-generated or manual label */
  label: string;
  /** Type of cluster (e.g., 'topic', 'narrative', 'entity') */
  clusterType: string;

  // Centroid for similarity calculations
  /** Average embedding of all members */
  centroid: number[];

  // Statistics
  /** Number of nodes in cluster */
  memberCount: number;
  /** Average similarity of members to centroid (0-1) */
  avgSimilarity: number;
  /** How tightly grouped the cluster is (0-1) */
  cohesion: number;

  // Metadata
  /** Optional description */
  description?: string | null;
  /** Extracted keywords */
  keywords: string[];
  /** Additional metadata */
  metadata: Record<string, unknown>;

  // Timestamps
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Last time centroid was recomputed */
  lastRecomputedAt?: Date | null;
}

/**
 * Node-to-cluster membership
 */
export interface ClusterMembership {
  /** Node ID */
  nodeId: string;
  /** Cluster ID */
  clusterId: string;
  /** Similarity to cluster centroid (0-1) */
  similarityScore: number;
  /** Whether this is the primary cluster for this node */
  isPrimary: boolean;
  /** When the node was assigned to this cluster */
  assignedAt: Date;
}

/**
 * Input for creating clusters manually
 */
export interface NeuronClusterCreate {
  label: string;
  clusterType?: string;
  description?: string;
  keywords?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating clusters
 */
export interface NeuronClusterUpdate {
  label?: string;
  description?: string;
  keywords?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Visual cluster representation
 */
export interface NeuronVisualCluster {
  id: string;
  label: string;
  nodeIds: string[];
  color?: string;
}

/**
 * Clustering algorithm options
 */
export type ClusteringAlgorithm = 'kmeans' | 'dbscan' | 'hierarchical';

/**
 * Clustering configuration
 */
export interface ClusteringConfig {
  /** Algorithm to use */
  algorithm: ClusteringAlgorithm;
  /** Target number of clusters (for k-means) */
  clusterCount?: number;
  /** Minimum cluster size */
  minClusterSize?: number;
  /** Similarity threshold for cluster assignment */
  similarityThreshold?: number;
  /** Epsilon for DBSCAN */
  epsilon?: number;
  /** Min samples for DBSCAN */
  minSamples?: number;
}


