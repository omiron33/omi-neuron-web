import type {
  ExpandGraphRequest,
  ExpandGraphResponse,
  FindPathRequest,
  FindPathResponse,
  GetGraphParams,
  GetGraphResponse,
} from '../types/api';
import type { NeuronEdge, NeuronEdgeCreate, NeuronEdgeUpdate } from '../types/edge';
import type { NeuronNode, NeuronNodeCreate, NeuronNodeUpdate } from '../types/node';
import type { NeuronSettings, NeuronSettingsUpdate } from '../types/settings';

export type GraphStoreContext = {
  scope?: string;
};

export const DEFAULT_SCOPE = 'default';

export const resolveScope = (context?: GraphStoreContext): string => {
  const scope = context?.scope?.trim();
  return scope && scope.length > 0 ? scope : DEFAULT_SCOPE;
};

export type GraphStoreListOptions = {
  limit?: number;
  offset?: number;
  context?: GraphStoreContext;
};

export type GraphStoreDeleteNodeResult = {
  deleted: boolean;
  edgesRemoved: number;
};

export type GraphStoreEmbeddingInfo = {
  embedding: number[] | null;
  embeddingModel: string | null;
  embeddingGeneratedAt: Date | null;
};

export type GraphStoreSimilarityResult = {
  nodeId: string;
  similarity: number;
};

export interface GraphStore {
  readonly kind: string;

  // Nodes
  listNodes(options?: GraphStoreListOptions): Promise<NeuronNode[]>;
  getNodeById(id: string, context?: GraphStoreContext): Promise<NeuronNode | null>;
  getNodeBySlug(slug: string, context?: GraphStoreContext): Promise<NeuronNode | null>;
  createNodes(nodes: NeuronNodeCreate[], context?: GraphStoreContext): Promise<NeuronNode[]>;
  updateNode(id: string, patch: NeuronNodeUpdate, context?: GraphStoreContext): Promise<NeuronNode | null>;
  deleteNode(id: string, context?: GraphStoreContext): Promise<GraphStoreDeleteNodeResult>;

  // Edges
  listEdges(options?: GraphStoreListOptions): Promise<NeuronEdge[]>;
  createEdges(edges: NeuronEdgeCreate[], context?: GraphStoreContext): Promise<NeuronEdge[]>;
  updateEdge(id: string, patch: NeuronEdgeUpdate, context?: GraphStoreContext): Promise<NeuronEdge | null>;
  deleteEdge(id: string, context?: GraphStoreContext): Promise<boolean>;

  // Settings
  getSettings(context?: GraphStoreContext): Promise<NeuronSettings>;
  updateSettings(update: NeuronSettingsUpdate, context?: GraphStoreContext): Promise<NeuronSettings>;
  resetSettings(sections?: string[], context?: GraphStoreContext): Promise<NeuronSettings>;

  // Graph queries
  getGraph(params: GetGraphParams, context?: GraphStoreContext): Promise<GetGraphResponse>;
  expandGraph(params: ExpandGraphRequest, context?: GraphStoreContext): Promise<ExpandGraphResponse>;
  findPaths(params: FindPathRequest, context?: GraphStoreContext): Promise<FindPathResponse>;

  // Embeddings + similarity
  getNodeEmbeddingInfo(nodeId: string, context?: GraphStoreContext): Promise<GraphStoreEmbeddingInfo | null>;
  setNodeEmbedding(
    nodeId: string,
    embedding: number[],
    model: string,
    context?: GraphStoreContext
  ): Promise<void>;
  clearNodeEmbeddings(nodeIds?: string[], context?: GraphStoreContext): Promise<void>;
  findSimilarNodeIds(
    nodeId: string,
    options?: { limit?: number; minSimilarity?: number },
    context?: GraphStoreContext
  ): Promise<GraphStoreSimilarityResult[]>;
}
