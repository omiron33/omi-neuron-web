/**
 * Event Types for omi-neuron-web
 * Defines the event system for extensibility and integration
 */

import type { NeuronNode } from './node';
import type { NeuronEdge } from './edge';
import type { NeuronCluster } from './cluster';
import type { AnalysisRun } from './analysis';
import type { NeuronSettings } from './settings';

/**
 * All event types in the system
 */
export type NeuronEventType =
  // Node events
  | 'node:created'
  | 'node:updated'
  | 'node:deleted'
  | 'node:batch_created'

  // Edge events
  | 'edge:created'
  | 'edge:updated'
  | 'edge:deleted'

  // Analysis events
  | 'analysis:started'
  | 'analysis:progress'
  | 'analysis:completed'
  | 'analysis:failed'
  | 'analysis:cancelled'

  // Clustering events
  | 'cluster:created'
  | 'cluster:updated'
  | 'cluster:membership_changed'

  // Relationship inference events
  | 'relationship:inferred'
  | 'relationship:rejected'

  // Visualization events
  | 'viz:node_focused'
  | 'viz:node_selected'
  | 'viz:node_hovered'
  | 'viz:path_started'
  | 'viz:path_completed'
  | 'viz:filter_applied'
  | 'viz:camera_changed'

  // Settings events
  | 'settings:updated';

/**
 * Event source - where the event originated
 */
export type EventSource = 'api' | 'ui' | 'analysis' | 'system';

/**
 * Base event interface
 */
export interface NeuronEvent<T = unknown> {
  type: NeuronEventType;
  timestamp: Date;
  payload: T;
  source: EventSource;
}

// Node event payloads
export interface NodeCreatedEventPayload {
  node: NeuronNode;
  source: 'manual' | 'import' | 'analysis';
}

export interface NodeUpdatedEventPayload {
  node: NeuronNode;
  previousNode: NeuronNode;
  changedFields: string[];
}

export interface NodeDeletedEventPayload {
  nodeId: string;
  slug: string;
  edgesRemoved: number;
}

export interface NodeBatchCreatedEventPayload {
  nodes: NeuronNode[];
  skipped: Array<{ slug: string; reason: string }>;
  source: 'manual' | 'import';
}

// Edge event payloads
export interface EdgeCreatedEventPayload {
  edge: NeuronEdge;
  source: 'manual' | 'ai_inferred' | 'imported';
}

export interface EdgeUpdatedEventPayload {
  edge: NeuronEdge;
  previousEdge: NeuronEdge;
  changedFields: string[];
}

export interface EdgeDeletedEventPayload {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
}

// Analysis event payloads
export interface AnalysisStartedEventPayload {
  jobId: string;
  runType: AnalysisRun['runType'];
  nodeCount: number;
}

export interface AnalysisProgressEventPayload {
  jobId: string;
  progress: number;
  currentStep: string;
  nodesProcessed: number;
  totalNodes: number;
}

export interface AnalysisCompletedEventPayload {
  job: AnalysisRun;
}

export interface AnalysisFailedEventPayload {
  jobId: string;
  error: string;
  partialResults?: AnalysisRun['results'];
}

export interface AnalysisCancelledEventPayload {
  jobId: string;
  reason: string;
}

// Cluster event payloads
export interface ClusterCreatedEventPayload {
  cluster: NeuronCluster;
  nodeIds: string[];
}

export interface ClusterUpdatedEventPayload {
  cluster: NeuronCluster;
  previousCluster: NeuronCluster;
}

export interface ClusterMembershipChangedEventPayload {
  clusterId: string;
  addedNodeIds: string[];
  removedNodeIds: string[];
}

// Relationship inference payloads
export interface RelationshipInferredEventPayload {
  edge: NeuronEdge;
  confidence: number;
  reasoning: string;
}

export interface RelationshipRejectedEventPayload {
  fromNodeId: string;
  toNodeId: string;
  confidence: number;
  reason: string;
}

// Visualization event payloads
export interface VizNodeFocusedEventPayload {
  node: NeuronNode;
  previousNode?: NeuronNode;
  source: 'click' | 'search' | 'path' | 'api';
}

export interface VizNodeSelectedEventPayload {
  node: NeuronNode | null;
  previousNode?: NeuronNode | null;
}

export interface VizNodeHoveredEventPayload {
  node: NeuronNode | null;
}

export interface VizPathStartedEventPayload {
  path: NeuronNode[];
  label?: string;
}

export interface VizPathCompletedEventPayload {
  path: NeuronNode[];
  completed: boolean;
}

export interface VizFilterAppliedEventPayload {
  filters: {
    domains?: string[];
    nodeTypes?: string[];
    search?: string;
  };
  visibleNodeCount: number;
}

export interface VizCameraChangedEventPayload {
  position: [number, number, number];
  target: [number, number, number];
}

// Settings event payloads
export interface SettingsUpdatedEventPayload {
  settings: NeuronSettings;
  previousSettings: NeuronSettings;
  changedSections: string[];
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: NeuronEvent<T>) => void | Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Event filter options
 */
export interface EventFilterOptions {
  types?: NeuronEventType[];
  sources?: EventSource[];
}

/**
 * Event emitter interface
 */
export interface NeuronEventEmitter {
  emit<T>(event: NeuronEvent<T>): void;
  subscribe<T>(type: NeuronEventType, handler: EventHandler<T>): EventSubscription;
  subscribeAll(handler: EventHandler<unknown>): EventSubscription;
  unsubscribeAll(): void;
}

