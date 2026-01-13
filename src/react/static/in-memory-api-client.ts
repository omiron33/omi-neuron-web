/**
 * InMemoryApiClient for Static Mode
 * Implements the same interface as NeuronApiClient but operates on in-memory data.
 * Used by StaticDataProvider for static/authored graphs without database.
 */

import type {
  NeuronNode,
  NeuronEdge,
  NeuronVisualNode,
  NeuronVisualEdge,
  NeuronVisualCluster,
  NeuronNodeCreate,
  NeuronNodeUpdate,
  NeuronEdgeCreate,
  NeuronEdgeUpdate,
  NeuronSettings,
  ListNodesParams,
  ListNodesResponse,
  GetNodeResponse,
  CreateNodesRequest,
  CreateNodesResponse,
  DeleteNodeResponse,
  ListEdgesParams,
  ListEdgesResponse,
  CreateEdgesRequest,
  CreateEdgesResponse,
  DeleteEdgeResponse,
  GetGraphParams,
  GetGraphResponse,
  ExpandGraphRequest,
  ExpandGraphResponse,
  FindPathRequest,
  FindPathResponse,
  AnalysisRequest,
  AnalysisResponse,
  GetAnalysisJobResponse,
  CancelAnalysisResponse,
  GetSettingsResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
  ResetSettingsResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  FindSimilarRequest,
  FindSimilarResponse,
  UpdateNodeRequest,
  UpdateEdgeRequest,
  PaginationMeta,
} from '../../core/types';

import {
  DEFAULT_VISUALIZATION_SETTINGS,
  DEFAULT_ANALYSIS_SETTINGS,
} from '../../core/types/settings';

/**
 * Error thrown when operations aren't supported in static mode
 */
export class StaticModeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StaticModeError';
  }
}

export interface InMemoryApiClientOptions {
  /** If true, mutations (create/update/delete) modify in-memory store */
  mutableMode?: boolean;
}

/**
 * Normalizes a visual node or full node into a full NeuronNode
 */
function normalizeNode(input: NeuronNode | NeuronVisualNode): NeuronNode {
  // If it's already a full node with createdAt, return it
  if ('createdAt' in input && input.createdAt) {
    return input as NeuronNode;
  }

  // Convert visual node to full node
  const visualNode = input as NeuronVisualNode;
  const now = new Date();
  return {
    id: visualNode.id,
    slug: visualNode.slug,
    label: visualNode.label,
    nodeType: 'concept',
    domain: visualNode.domain,
    createdAt: now,
    updatedAt: now,
    metadata: visualNode.metadata ?? {},
    tier: visualNode.tier,
    connectionCount: visualNode.connectionCount ?? 0,
    positionOverride: visualNode.position ?? null,
    status: visualNode.status,
  };
}

/**
 * Normalizes a visual edge or full edge into a full NeuronEdge
 */
function normalizeEdge(input: NeuronEdge | NeuronVisualEdge): NeuronEdge {
  // If it's already a full edge with createdAt, return it
  if ('createdAt' in input && input.createdAt) {
    return input as NeuronEdge;
  }

  // Convert visual edge to full edge
  const visualEdge = input as NeuronVisualEdge;
  const now = new Date();
  return {
    id: visualEdge.id,
    fromNodeId: visualEdge.from,
    toNodeId: visualEdge.to,
    relationshipType: visualEdge.relationshipType ?? 'related_to',
    strength: visualEdge.strength ?? 0.5,
    confidence: 1.0,
    evidence: [],
    label: visualEdge.label ?? null,
    description: null,
    metadata: {},
    source: 'manual',
    sourceModel: null,
    createdAt: now,
    updatedAt: now,
    bidirectional: false,
  };
}

/**
 * Converts a NeuronNode to NeuronVisualNode
 */
function toVisualNode(node: NeuronNode): NeuronVisualNode {
  return {
    id: node.id,
    slug: node.slug,
    label: node.label,
    domain: node.domain,
    tier: node.tier,
    metadata: node.metadata,
    ref: null,
    connectionCount: node.connectionCount ?? 0,
    position: node.positionOverride ?? undefined,
    status: node.status,
  };
}

/**
 * Converts a NeuronEdge to NeuronVisualEdge
 */
function toVisualEdge(edge: NeuronEdge): NeuronVisualEdge {
  return {
    id: edge.id,
    from: edge.fromNodeId,
    to: edge.toNodeId,
    relationshipType: edge.relationshipType,
    strength: edge.strength,
    label: edge.label,
  };
}

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a slug from a label
 */
function generateSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create pagination meta
 */
function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * In-memory API client for static mode.
 * Implements the same interface as NeuronApiClient.
 */
export class InMemoryApiClient {
  private nodesMap: Map<string, NeuronNode>;
  private edgesMap: Map<string, NeuronEdge>;
  private clusters: NeuronVisualCluster[];
  private settings: NeuronSettings;
  private initialSettings: NeuronSettings;
  private mutableMode: boolean;

  constructor(
    nodes: (NeuronNode | NeuronVisualNode)[],
    edges: (NeuronEdge | NeuronVisualEdge)[],
    clusters: NeuronVisualCluster[] = [],
    settingsOverrides: Partial<NeuronSettings> = {},
    options: InMemoryApiClientOptions = {}
  ) {
    this.nodesMap = new Map(nodes.map((n) => [n.id, normalizeNode(n)]));
    this.edgesMap = new Map(edges.map((e) => [e.id, normalizeEdge(e)]));
    this.clusters = clusters;
    this.mutableMode = options.mutableMode ?? false;

    // Build full settings with defaults (NeuronSettings only, not NeuronConfig)
    this.settings = {
      instance: {
        name: 'Static Graph',
        version: '1.0.0',
        repoName: 'omi-neuron-web',
      },
      visualization: { ...DEFAULT_VISUALIZATION_SETTINGS, ...settingsOverrides.visualization },
      analysis: { ...DEFAULT_ANALYSIS_SETTINGS, ...settingsOverrides.analysis },
      nodeTypes: settingsOverrides.nodeTypes ?? [],
      domains: settingsOverrides.domains ?? [],
      relationshipTypes: settingsOverrides.relationshipTypes ?? [],
    };
    this.initialSettings = JSON.parse(JSON.stringify(this.settings));

    // Update connection counts based on edges
    this.updateConnectionCounts();
  }

  private updateConnectionCounts(): void {
    // Reset all counts
    for (const node of this.nodesMap.values()) {
      node.connectionCount = 0;
      node.inboundCount = 0;
      node.outboundCount = 0;
    }

    // Count edges
    for (const edge of this.edgesMap.values()) {
      const fromNode = this.nodesMap.get(edge.fromNodeId);
      const toNode = this.nodesMap.get(edge.toNodeId);

      if (fromNode) {
        fromNode.connectionCount = (fromNode.connectionCount ?? 0) + 1;
        fromNode.outboundCount = (fromNode.outboundCount ?? 0) + 1;
      }
      if (toNode) {
        toNode.connectionCount = (toNode.connectionCount ?? 0) + 1;
        toNode.inboundCount = (toNode.inboundCount ?? 0) + 1;
      }
    }
  }

  /**
   * Update the in-memory data (useful for controlled mode)
   */
  updateData(
    nodes: (NeuronNode | NeuronVisualNode)[],
    edges: (NeuronEdge | NeuronVisualEdge)[],
    clusters?: NeuronVisualCluster[]
  ): void {
    this.nodesMap = new Map(nodes.map((n) => [n.id, normalizeNode(n)]));
    this.edgesMap = new Map(edges.map((e) => [e.id, normalizeEdge(e)]));
    if (clusters) {
      this.clusters = clusters;
    }
    this.updateConnectionCounts();
  }

  // ==================== NODES ====================

  nodes = {
    list: async (params?: ListNodesParams): Promise<ListNodesResponse> => {
      let nodes = Array.from(this.nodesMap.values());

      // Apply filters
      if (params?.domain) {
        const domains = Array.isArray(params.domain) ? params.domain : [params.domain];
        nodes = nodes.filter((n) => domains.includes(n.domain));
      }
      if (params?.nodeType) {
        const nodeTypes = Array.isArray(params.nodeType) ? params.nodeType : [params.nodeType];
        nodes = nodes.filter((n) => nodeTypes.includes(n.nodeType));
      }
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        nodes = nodes.filter(
          (n) =>
            n.label.toLowerCase().includes(searchLower) ||
            n.slug.toLowerCase().includes(searchLower)
        );
      }

      // Pagination
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      const total = nodes.length;
      const start = (page - 1) * limit;
      const paginatedNodes = nodes.slice(start, start + limit);

      return {
        nodes: paginatedNodes,
        pagination: createPaginationMeta(page, limit, total),
        meta: {
          queryTime: 0,
          filters: (params ?? {}) as Record<string, unknown>,
        },
      };
    },

    get: async (id: string): Promise<GetNodeResponse> => {
      const node = this.nodesMap.get(id);
      if (!node) {
        throw new Error(`Node not found: ${id}`);
      }

      // Find related edges
      const outbound: NeuronEdge[] = [];
      const inbound: NeuronEdge[] = [];
      for (const edge of this.edgesMap.values()) {
        if (edge.fromNodeId === id) outbound.push(edge);
        if (edge.toNodeId === id) inbound.push(edge);
      }

      // Find related nodes
      const relatedIds = new Set<string>();
      for (const edge of [...outbound, ...inbound]) {
        if (edge.fromNodeId !== id) relatedIds.add(edge.fromNodeId);
        if (edge.toNodeId !== id) relatedIds.add(edge.toNodeId);
      }
      const relatedNodes = Array.from(relatedIds)
        .map((id) => this.nodesMap.get(id))
        .filter((n): n is NeuronNode => !!n);

      return {
        node,
        edges: { outbound, inbound },
        cluster: null,
        relatedNodes,
      };
    },

    create: async (data: CreateNodesRequest): Promise<CreateNodesResponse> => {
      if (!this.mutableMode) {
        throw new StaticModeError('Node creation not available in static read-only mode');
      }

      const created: NeuronNode[] = [];
      const skipped: Array<{ slug: string; reason: string }> = [];
      const inputNodes = data.nodes;

      for (const input of inputNodes) {
        const slug = input.slug ?? generateSlug(input.label);

        // Check for duplicates
        const existing = Array.from(this.nodesMap.values()).find((n) => n.slug === slug);
        if (existing) {
          if (data.options?.skipDuplicates) {
            skipped.push({ slug, reason: 'duplicate' });
            continue;
          }
        }

        const id = generateId();
        const now = new Date();

        const node: NeuronNode = {
          id,
          slug,
          label: input.label,
          nodeType: input.nodeType ?? 'concept',
          domain: input.domain ?? 'default',
          createdAt: now,
          updatedAt: now,
          summary: input.summary ?? null,
          description: input.description ?? null,
          content: input.content ?? null,
          metadata: input.metadata ?? {},
          tier: input.tier,
          connectionCount: 0,
          status: input.status,
        };

        this.nodesMap.set(id, node);
        created.push(node);
      }

      return { created, skipped };
    },

    update: async (id: string, data: UpdateNodeRequest): Promise<void> => {
      if (!this.mutableMode) {
        throw new StaticModeError('Node updates not available in static read-only mode');
      }

      const node = this.nodesMap.get(id);
      if (!node) {
        throw new Error(`Node not found: ${id}`);
      }

      const updates = data as NeuronNodeUpdate;
      if (updates.label !== undefined) node.label = updates.label;
      if (updates.summary !== undefined) node.summary = updates.summary;
      if (updates.description !== undefined) node.description = updates.description;
      if (updates.content !== undefined) node.content = updates.content;
      if (updates.metadata !== undefined) node.metadata = updates.metadata;
      if (updates.domain !== undefined) node.domain = updates.domain;
      if (updates.tier !== undefined) node.tier = updates.tier;
      if (updates.positionOverride !== undefined) node.positionOverride = updates.positionOverride;
      node.updatedAt = new Date();
    },

    delete: async (id: string): Promise<DeleteNodeResponse> => {
      if (!this.mutableMode) {
        throw new StaticModeError('Node deletion not available in static read-only mode');
      }

      const node = this.nodesMap.get(id);
      if (!node) {
        throw new Error(`Node not found: ${id}`);
      }

      this.nodesMap.delete(id);

      // Also delete related edges
      let edgesRemoved = 0;
      for (const [edgeId, edge] of this.edgesMap) {
        if (edge.fromNodeId === id || edge.toNodeId === id) {
          this.edgesMap.delete(edgeId);
          edgesRemoved++;
        }
      }

      this.updateConnectionCounts();
      return { deleted: true, edgesRemoved };
    },
  };

  // ==================== EDGES ====================

  edges = {
    list: async (params?: ListEdgesParams): Promise<ListEdgesResponse> => {
      let edges = Array.from(this.edgesMap.values());

      // Apply filters
      if (params?.fromNodeId) {
        edges = edges.filter((e) => e.fromNodeId === params.fromNodeId);
      }
      if (params?.toNodeId) {
        edges = edges.filter((e) => e.toNodeId === params.toNodeId);
      }
      if (params?.nodeId) {
        edges = edges.filter(
          (e) => e.fromNodeId === params.nodeId || e.toNodeId === params.nodeId
        );
      }
      if (params?.relationshipType) {
        const types = Array.isArray(params.relationshipType)
          ? params.relationshipType
          : [params.relationshipType];
        edges = edges.filter((e) => types.includes(e.relationshipType));
      }

      // Pagination
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      const total = edges.length;
      const start = (page - 1) * limit;
      const paginatedEdges = edges.slice(start, start + limit);

      return {
        edges: paginatedEdges,
        pagination: createPaginationMeta(page, limit, total),
      };
    },

    create: async (data: CreateEdgesRequest): Promise<CreateEdgesResponse> => {
      if (!this.mutableMode) {
        throw new StaticModeError('Edge creation not available in static read-only mode');
      }

      const created: NeuronEdge[] = [];
      const errors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < data.edges.length; i++) {
        const input = data.edges[i];
        const id = generateId();
        const now = new Date();

        const edge: NeuronEdge = {
          id,
          fromNodeId: input.fromNodeId,
          toNodeId: input.toNodeId,
          relationshipType: input.relationshipType ?? 'related_to',
          strength: input.strength ?? 0.5,
          confidence: input.confidence ?? 1.0,
          evidence: input.evidence ?? [],
          label: input.label ?? null,
          description: input.description ?? null,
          metadata: input.metadata ?? {},
          source: 'manual',
          sourceModel: null,
          createdAt: now,
          updatedAt: now,
          bidirectional: input.bidirectional ?? false,
        };

        this.edgesMap.set(id, edge);
        created.push(edge);
      }

      this.updateConnectionCounts();
      return { created, errors };
    },

    update: async (id: string, data: UpdateEdgeRequest): Promise<void> => {
      if (!this.mutableMode) {
        throw new StaticModeError('Edge updates not available in static read-only mode');
      }

      const edge = this.edgesMap.get(id);
      if (!edge) {
        throw new Error(`Edge not found: ${id}`);
      }

      const updates = data as NeuronEdgeUpdate;
      if (updates.strength !== undefined) edge.strength = updates.strength;
      if (updates.confidence !== undefined) edge.confidence = updates.confidence;
      if (updates.label !== undefined) edge.label = updates.label;
      if (updates.description !== undefined) edge.description = updates.description;
      if (updates.metadata !== undefined) edge.metadata = updates.metadata;
      edge.updatedAt = new Date();
    },

    delete: async (id: string): Promise<DeleteEdgeResponse> => {
      if (!this.mutableMode) {
        throw new StaticModeError('Edge deletion not available in static read-only mode');
      }

      const edge = this.edgesMap.get(id);
      if (!edge) {
        throw new Error(`Edge not found: ${id}`);
      }

      this.edgesMap.delete(id);
      this.updateConnectionCounts();
      return { deleted: true };
    },
  };

  // ==================== GRAPH ====================

  graph = {
    get: async (params?: GetGraphParams): Promise<GetGraphResponse> => {
      let nodes = Array.from(this.nodesMap.values());
      let edges = Array.from(this.edgesMap.values());

      // Apply filters
      if (params?.domains?.length) {
        nodes = nodes.filter((n) => params.domains!.includes(n.domain));
      }
      if (params?.nodeTypes?.length) {
        nodes = nodes.filter((n) => params.nodeTypes!.includes(n.nodeType));
      }
      if (params?.minEdgeStrength !== undefined) {
        edges = edges.filter((e) => e.strength >= params.minEdgeStrength!);
      }

      // Filter edges to only include those connecting visible nodes
      const nodeIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter((e) => nodeIds.has(e.fromNodeId) && nodeIds.has(e.toNodeId));

      return {
        nodes: nodes.map(toVisualNode),
        edges: edges.map(toVisualEdge),
        clusters: this.clusters,
        meta: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          truncated: false,
          queryTime: 0,
        },
      };
    },

    expand: async (data: ExpandGraphRequest): Promise<ExpandGraphResponse> => {
      const { fromNodeIds, depth = 1, direction = 'both' } = data;
      const visited = new Set<string>();
      const resultNodes: NeuronNode[] = [];
      const resultEdges: NeuronEdge[] = [];

      const expandFrom = (currentId: string, currentDepth: number) => {
        if (currentDepth > depth || visited.has(currentId)) return;
        visited.add(currentId);

        const node = this.nodesMap.get(currentId);
        if (node) resultNodes.push(node);

        for (const edge of this.edgesMap.values()) {
          const isOutbound = edge.fromNodeId === currentId;
          const isInbound = edge.toNodeId === currentId;

          if (
            (direction === 'both' && (isOutbound || isInbound)) ||
            (direction === 'outbound' && isOutbound) ||
            (direction === 'inbound' && isInbound)
          ) {
            if (!resultEdges.find((e) => e.id === edge.id)) {
              resultEdges.push(edge);
            }
            const nextId = isOutbound ? edge.toNodeId : edge.fromNodeId;
            expandFrom(nextId, currentDepth + 1);
          }
        }
      };

      for (const nodeId of fromNodeIds) {
        expandFrom(nodeId, 0);
      }

      return {
        nodes: resultNodes.map(toVisualNode),
        edges: resultEdges.map(toVisualEdge),
      };
    },

    findPath: async (data: FindPathRequest): Promise<FindPathResponse> => {
      const { fromNodeId, toNodeId } = data;

      // Simple BFS for shortest path
      const queue: { nodeId: string; path: string[]; edgePath: string[] }[] = [
        { nodeId: fromNodeId, path: [fromNodeId], edgePath: [] },
      ];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { nodeId, path, edgePath } = queue.shift()!;
        if (nodeId === toNodeId) {
          // Calculate total strength
          let totalStrength = 0;
          for (const edgeId of edgePath) {
            const edge = this.edgesMap.get(edgeId);
            if (edge) totalStrength += edge.strength;
          }

          return {
            paths: [
              {
                nodes: path,
                edges: edgePath,
                length: path.length,
                totalStrength,
              },
            ],
          };
        }

        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        for (const edge of this.edgesMap.values()) {
          let nextId: string | null = null;
          if (edge.fromNodeId === nodeId) nextId = edge.toNodeId;
          else if (edge.toNodeId === nodeId) nextId = edge.fromNodeId;

          if (nextId && !visited.has(nextId)) {
            queue.push({
              nodeId: nextId,
              path: [...path, nextId],
              edgePath: [...edgePath, edge.id],
            });
          }
        }
      }

      return { paths: [] };
    },
  };

  // ==================== ANALYZE ====================

  analyze = {
    start: async (_data: AnalysisRequest): Promise<AnalysisResponse> => {
      throw new StaticModeError(
        'Analysis not available in static mode. Use API-backed provider for AI features.'
      );
    },

    getStatus: async (_jobId: string): Promise<GetAnalysisJobResponse> => {
      throw new StaticModeError('Analysis not available in static mode.');
    },

    cancel: async (_jobId: string): Promise<CancelAnalysisResponse> => {
      throw new StaticModeError('Analysis not available in static mode.');
    },
  };

  // ==================== SUGGESTIONS ====================

  suggestions = {
    list: async () => ({
      suggestions: [],
      pagination: createPaginationMeta(1, 50, 0),
    }),
    approve: async (): Promise<never> => {
      throw new StaticModeError('Suggestions not available in static mode.');
    },
    bulkApprove: async (): Promise<never> => {
      throw new StaticModeError('Suggestions not available in static mode.');
    },
    reject: async (): Promise<never> => {
      throw new StaticModeError('Suggestions not available in static mode.');
    },
    bulkReject: async (): Promise<never> => {
      throw new StaticModeError('Suggestions not available in static mode.');
    },
  };

  // ==================== SETTINGS ====================

  settings_api = {
    get: async (): Promise<GetSettingsResponse> => {
      return { settings: this.settings, source: 'defaults' };
    },

    update: async (data: UpdateSettingsRequest): Promise<UpdateSettingsResponse> => {
      if (data.visualization) {
        this.settings.visualization = { ...this.settings.visualization, ...data.visualization };
      }
      if (data.analysis) {
        this.settings.analysis = { ...this.settings.analysis, ...data.analysis };
      }
      return { settings: this.settings };
    },

    reset: async (): Promise<ResetSettingsResponse> => {
      this.settings = JSON.parse(JSON.stringify(this.initialSettings));
      return { settings: this.settings };
    },
  };

  // ==================== SEARCH ====================

  search = {
    semantic: async (_data: SemanticSearchRequest): Promise<SemanticSearchResponse> => {
      // Semantic search requires embeddings which aren't available in static mode
      // Return empty results instead of throwing to allow graceful degradation
      return { results: [], queryTime: 0 };
    },

    similar: async (_data: FindSimilarRequest): Promise<FindSimilarResponse> => {
      // Similarity search requires embeddings which aren't available in static mode
      return { results: [] };
    },
  };
}
