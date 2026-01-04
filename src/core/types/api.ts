/**
 * API Types for omi-neuron-web
 * Request and response types for all API endpoints
 */

import type { NeuronNode, NeuronNodeCreate, NeuronNodeUpdate, NeuronVisualNode } from './node';
import type { NeuronEdge, NeuronEdgeCreate, NeuronEdgeUpdate, NeuronVisualEdge } from './edge';
import type { NeuronCluster, NeuronVisualCluster } from './cluster';
import type { AnalysisRun, AnalysisRequest, AnalysisResponse } from './analysis';
import type { NeuronSettings, NeuronSettingsUpdate } from './settings';

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// Graph filters
// ============================================================================

export interface GraphFilters {
  domains?: string[];
  nodeTypes?: string[];
  search?: string;
}

// ============================================================================
// Nodes API
// ============================================================================

export interface ListNodesParams extends PaginationParams {
  nodeType?: string | string[];
  domain?: string | string[];
  clusterId?: string;
  analysisStatus?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'label' | 'connectionCount';
  sortOrder?: 'asc' | 'desc';
  includeEmbeddings?: boolean;
  includeStats?: boolean;
}

export interface ListNodesResponse {
  nodes: NeuronNode[];
  pagination: PaginationMeta;
  meta: {
    queryTime: number;
    filters: Record<string, unknown>;
  };
}

export interface CreateNodesRequest {
  nodes: NeuronNodeCreate[];
  options?: {
    skipDuplicates?: boolean;
    updateOnConflict?: boolean;
    autoAnalyze?: boolean;
    analysisDepth?: 'embeddings' | 'cluster' | 'full';
  };
}

export interface CreateNodesResponse {
  created: NeuronNode[];
  skipped: Array<{ slug: string; reason: string }>;
  analysisJobId?: string;
}

export interface GetNodeResponse {
  node: NeuronNode;
  edges: {
    outbound: NeuronEdge[];
    inbound: NeuronEdge[];
  };
  cluster?: NeuronCluster | null;
  relatedNodes: NeuronNode[];
}

export interface UpdateNodeRequest extends NeuronNodeUpdate {}

export interface DeleteNodeResponse {
  deleted: boolean;
  edgesRemoved: number;
}

// ============================================================================
// Edges API
// ============================================================================

export interface ListEdgesParams extends PaginationParams {
  fromNodeId?: string;
  toNodeId?: string;
  nodeId?: string;
  relationshipType?: string | string[];
  source?: 'manual' | 'ai_inferred' | 'imported';
  minStrength?: number;
  minConfidence?: number;
}

export interface ListEdgesResponse {
  edges: NeuronEdge[];
  pagination: PaginationMeta;
}

export interface CreateEdgesRequest {
  edges: NeuronEdgeCreate[];
}

export interface CreateEdgesResponse {
  created: NeuronEdge[];
  errors: Array<{ index: number; error: string }>;
}

export interface UpdateEdgeRequest extends NeuronEdgeUpdate {}

export interface DeleteEdgeResponse {
  deleted: boolean;
}

// ============================================================================
// Graph API
// ============================================================================

export interface GetGraphParams {
  nodeTypes?: string[];
  domains?: string[];
  clusterIds?: string[];
  nodeIds?: string[];
  depth?: number;
  minEdgeStrength?: number;
  relationshipTypes?: string[];
  maxNodes?: number;
  includeOrphanNodes?: boolean;
}

export interface GetGraphResponse {
  nodes: NeuronVisualNode[];
  edges: NeuronVisualEdge[];
  clusters: NeuronVisualCluster[];
  meta: {
    totalNodes: number;
    totalEdges: number;
    truncated: boolean;
    queryTime: number;
  };
}

export interface ExpandGraphRequest {
  fromNodeIds: string[];
  depth: number;
  direction: 'outbound' | 'inbound' | 'both';
  maxNodes?: number;
}

export interface ExpandGraphResponse {
  nodes: NeuronVisualNode[];
  edges: NeuronVisualEdge[];
}

export interface FindPathRequest {
  fromNodeId: string;
  toNodeId: string;
  maxDepth?: number;
  algorithm?: 'shortest' | 'all';
}

export interface FindPathResponse {
  paths: Array<{
    nodes: string[];
    edges: string[];
    length: number;
    totalStrength: number;
  }>;
}

// ============================================================================
// Analysis API
// ============================================================================

export { AnalysisRequest, AnalysisResponse };

export interface GetAnalysisJobResponse {
  job: AnalysisRun;
}

export interface CancelAnalysisResponse {
  cancelled: boolean;
}

// ============================================================================
// Search API
// ============================================================================

export interface SemanticSearchRequest {
  query: string;
  nodeTypes?: string[];
  domains?: string[];
  limit?: number;
  minSimilarity?: number;
  includeExplanation?: boolean;
}

export interface SemanticSearchOptions {
  nodeTypes?: string[];
  domains?: string[];
  limit?: number;
  minSimilarity?: number;
  includeExplanation?: boolean;
}

export interface SemanticSearchResponse {
  results: Array<{
    node: NeuronNode;
    similarity: number;
    explanation?: string;
  }>;
  queryEmbedding?: number[];
  queryTime: number;
}

export interface SearchResult {
  node: NeuronNode;
  similarity: number;
  explanation?: string;
}

export interface FindSimilarRequest {
  nodeId: string;
  limit?: number;
  minSimilarity?: number;
  excludeConnected?: boolean;
}

export interface FindSimilarOptions {
  limit?: number;
  minSimilarity?: number;
  excludeConnected?: boolean;
}

export interface FindSimilarResponse {
  results: Array<{
    node: NeuronNode;
    similarity: number;
  }>;
}

// ============================================================================
// Settings API
// ============================================================================

export interface GetSettingsResponse {
  settings: NeuronSettings;
  source: 'database' | 'config_file' | 'defaults';
}

export interface UpdateSettingsRequest extends NeuronSettingsUpdate {}

export interface UpdateSettingsResponse {
  settings: NeuronSettings;
}

export interface ResetSettingsRequest {
  sections?: Array<'visualization' | 'analysis' | 'nodeTypes' | 'domains' | 'relationshipTypes'>;
}

export interface ResetSettingsResponse {
  settings: NeuronSettings;
}

// ============================================================================
// Error Response
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

// ============================================================================
// Health Check
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  database: {
    connected: boolean;
    latencyMs?: number;
  };
  services: {
    openai: boolean;
    docker: boolean;
  };
}
