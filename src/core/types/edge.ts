/**
 * Edge Types for omi-neuron-web
 * Defines relationships between nodes in the graph
 */

/**
 * Built-in relationship types - configurable but with sensible defaults
 */
export type BuiltInRelationshipType =
  | 'related_to' // Generic bidirectional
  | 'derives_from' // Source/derivative
  | 'contradicts' // Opposing viewpoints
  | 'supports' // Evidence/support
  | 'references' // Citation
  | 'part_of' // Hierarchical
  | 'leads_to' // Causal/sequential
  | 'similar_to'; // Similarity (often AI-inferred)

/**
 * Relationship type - built-in or custom string
 */
export type RelationshipType = BuiltInRelationshipType | string;

/**
 * Source of the edge - how it was created
 */
export type EdgeSource = 'manual' | 'ai_inferred' | 'imported';

/**
 * Edge evidence - supporting data for relationship
 */
export interface EdgeEvidence {
  /** Type of evidence */
  type: 'text' | 'url' | 'citation' | 'ai_inference';
  /** Evidence content */
  content: string;
  /** Confidence score for AI inferences (0-1) */
  confidence?: number;
  /** Reference to external source */
  sourceId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Complete edge definition
 */
export interface NeuronEdge {
  /** UUID v4 identifier */
  id: string;
  /** Source node ID */
  fromNodeId: string;
  /** Target node ID */
  toNodeId: string;
  /** Type of relationship */
  relationshipType: RelationshipType;

  // Strength and confidence
  /** Relationship strength (0-1), affects visual prominence */
  strength: number;
  /** Confidence level (0-1), how certain is this relationship */
  confidence: number;

  // Evidence supporting the relationship
  /** Array of evidence items */
  evidence: EdgeEvidence[];

  // Metadata
  /** Optional display label */
  label?: string | null;
  /** Optional description */
  description?: string | null;
  /** Additional metadata */
  metadata: Record<string, unknown>;

  // Source tracking
  /** How this edge was created */
  source: EdgeSource;
  /** AI model used if inferred */
  sourceModel?: string | null;

  // Timestamps
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;

  // Bidirectional flag
  /** If true, renders both directions */
  bidirectional: boolean;
}

/**
 * Input for creating edges
 */
export interface NeuronEdgeCreate {
  /** Source node ID */
  fromNodeId: string;
  /** Target node ID */
  toNodeId: string;
  /** Defaults to 'related_to' */
  relationshipType?: RelationshipType;
  /** Defaults to 0.5 */
  strength?: number;
  /** Defaults to 1.0 for manual edges */
  confidence?: number;
  /** Supporting evidence */
  evidence?: EdgeEvidence[];
  /** Display label */
  label?: string;
  /** Description */
  description?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Defaults to false */
  bidirectional?: boolean;
}

/**
 * Input for updating edges
 */
export interface NeuronEdgeUpdate {
  strength?: number;
  confidence?: number;
  relationshipType?: RelationshipType;
  label?: string;
  description?: string;
  evidence?: EdgeEvidence[];
  metadata?: Record<string, unknown>;
}

/**
 * Visual edge representation for Three.js rendering
 */
export interface NeuronVisualEdge {
  id: string;
  /** Source node slug */
  from: string;
  /** Target node slug */
  to: string;
  relationshipType: string;
  strength: number;
  label?: string | null;
}

/**
 * Inferred relationship result from AI analysis
 */
export interface InferredRelationship {
  fromNodeId: string;
  toNodeId: string;
  confidence: number;
  /** AI explanation for the inference */
  reasoning: string;
  suggestedType: RelationshipType;
  evidence: EdgeEvidence[];
}

