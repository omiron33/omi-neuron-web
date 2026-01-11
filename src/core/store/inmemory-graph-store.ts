import crypto from 'node:crypto';
import slugify from 'slugify';
import type {
  ExpandGraphRequest,
  ExpandGraphResponse,
  FindPathRequest,
  FindPathResponse,
  GetGraphParams,
  GetGraphResponse,
} from '../types/api';
import type { NeuronEdge, NeuronEdgeCreate, NeuronEdgeUpdate, NeuronVisualEdge } from '../types/edge';
import type { NeuronNode, NeuronNodeCreate, NeuronNodeUpdate, NeuronVisualNode } from '../types/node';
import type { NeuronSettings, NeuronSettingsUpdate } from '../types/settings';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from '../types/settings';
import type {
  GraphStore,
  GraphStoreContext,
  GraphStoreDeleteNodeResult,
  GraphStoreEmbeddingInfo,
  GraphStoreListOptions,
  GraphStoreSimilarityResult,
} from './graph-store';
import { resolveScope } from './graph-store';
import { cosineSimilarity } from './utils/cosine';

const now = () => new Date();

const stableSlug = (label: string) =>
  slugify(label, { lower: true, strict: true, trim: true });

const defaultSettings = (): NeuronSettings => ({
  instance: { name: 'default', version: '0.1.0', repoName: 'omi-neuron-web' },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: DEFAULT_ANALYSIS_SETTINGS,
  nodeTypes: [],
  domains: [],
  relationshipTypes: [],
});

const applyNodeUpdate = (node: NeuronNode, update: NeuronNodeUpdate): NeuronNode => {
  const next: NeuronNode = { ...node };
  if (update.label !== undefined) next.label = update.label;
  if (update.summary !== undefined) next.summary = update.summary;
  if (update.description !== undefined) next.description = update.description;
  if (update.content !== undefined) next.content = update.content;
  if (update.metadata !== undefined) next.metadata = update.metadata;
  if (update.domain !== undefined) next.domain = update.domain;
  if (update.tier !== undefined) next.tier = update.tier;
  if (update.positionOverride !== undefined) next.positionOverride = update.positionOverride;
  next.updatedAt = now();
  return next;
};

const applySettingsUpdate = (current: NeuronSettings, update: NeuronSettingsUpdate): NeuronSettings => {
  const next: NeuronSettings = { ...current };
  if (update.visualization) next.visualization = { ...next.visualization, ...update.visualization };
  if (update.analysis) next.analysis = { ...next.analysis, ...update.analysis };
  if (update.nodeTypes) next.nodeTypes = update.nodeTypes;
  if (update.domains) next.domains = update.domains;
  if (update.relationshipTypes) next.relationshipTypes = update.relationshipTypes;
  return next;
};

type InMemoryGraphStoreSnapshot = {
  nodes?: NeuronNode[];
  edges?: NeuronEdge[];
  settings?: NeuronSettings;
  settingsByScope?: Record<string, NeuronSettings>;
};

export class InMemoryGraphStore implements GraphStore {
  readonly kind = 'memory';

  private nodesById = new Map<string, NeuronNode>();
  private nodesByScopeSlug = new Map<string, string>();
  private nodeScopeById = new Map<string, string>();
  private edgesById = new Map<string, NeuronEdge>();
  private edgeScopeById = new Map<string, string>();
  private settingsByScope = new Map<string, NeuronSettings>();

  constructor(snapshot?: InMemoryGraphStoreSnapshot) {
    if (snapshot?.settingsByScope) {
      Object.entries(snapshot.settingsByScope).forEach(([scope, settings]) => {
        this.settingsByScope.set(scope, settings);
      });
    } else if (snapshot?.settings) {
      this.settingsByScope.set('default', snapshot.settings);
    }

    if (!this.settingsByScope.has('default')) {
      this.settingsByScope.set('default', defaultSettings());
    }

    if (snapshot?.nodes?.length) {
      snapshot.nodes.forEach((node) => {
        const scope = (node as unknown as { scope?: string }).scope ?? 'default';
        this.nodesById.set(node.id, node);
        this.nodeScopeById.set(node.id, scope);
        this.nodesByScopeSlug.set(`${scope}:${node.slug}`, node.id);
      });
    }

    if (snapshot?.edges?.length) {
      snapshot.edges.forEach((edge) => {
        const scope = (edge as unknown as { scope?: string }).scope ?? 'default';
        this.edgesById.set(edge.id, edge);
        this.edgeScopeById.set(edge.id, scope);
      });
    }

    if (snapshot?.nodes?.length || snapshot?.edges?.length) {
      this.recomputeConnectionCounts();
    }
  }

  async listNodes(options?: GraphStoreListOptions): Promise<NeuronNode[]> {
    const scope = resolveScope(options?.context);
    const limit = options?.limit;
    const offset = options?.offset ?? 0;
    const nodes = [...this.nodesById.values()]
      .filter((node) => this.nodeScopeById.get(node.id) === scope)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const sliced = nodes.slice(offset, limit ? offset + limit : undefined);
    return sliced;
  }

  async getNodeById(id: string, context?: GraphStoreContext): Promise<NeuronNode | null> {
    const scope = resolveScope(context);
    if (this.nodeScopeById.get(id) !== scope) return null;
    return this.nodesById.get(id) ?? null;
  }

  async getNodeBySlug(slug: string, context?: GraphStoreContext): Promise<NeuronNode | null> {
    const scope = resolveScope(context);
    const id = this.nodesByScopeSlug.get(`${scope}:${slug}`);
    if (!id) return null;
    return this.nodesById.get(id) ?? null;
  }

  async createNodes(nodes: NeuronNodeCreate[], context?: GraphStoreContext): Promise<NeuronNode[]> {
    const scope = resolveScope(context);
    const created: NeuronNode[] = [];
    for (const input of nodes) {
      const slug = input.slug ?? stableSlug(input.label);
      if (this.nodesByScopeSlug.has(`${scope}:${slug}`)) {
        // Skip duplicates deterministically for v1 parity.
        continue;
      }

      const node: NeuronNode = {
        id: crypto.randomUUID(),
        slug,
        label: input.label,
        nodeType: input.nodeType ?? 'concept',
        domain: input.domain ?? 'general',
        summary: input.summary ?? null,
        description: input.description ?? null,
        content: input.content ?? null,
        metadata: input.metadata ?? {},
        tier: input.tier ?? undefined,
        embedding: null,
        embeddingModel: null,
        embeddingGeneratedAt: null,
        clusterId: null,
        clusterSimilarity: null,
        connectionCount: 0,
        inboundCount: 0,
        outboundCount: 0,
        analysisStatus: 'pending',
        analysisError: null,
        createdAt: now(),
        updatedAt: now(),
        positionOverride: null,
      };

      this.nodesById.set(node.id, node);
      this.nodeScopeById.set(node.id, scope);
      this.nodesByScopeSlug.set(`${scope}:${node.slug}`, node.id);
      created.push(node);
    }

    this.recomputeConnectionCounts();
    return created;
  }

  async updateNode(id: string, patch: NeuronNodeUpdate, context?: GraphStoreContext): Promise<NeuronNode | null> {
    const scope = resolveScope(context);
    if (this.nodeScopeById.get(id) !== scope) return null;
    const node = this.nodesById.get(id);
    if (!node) return null;

    const updated = applyNodeUpdate(node, patch);
    // Slug is not updateable via API; keep maps consistent regardless.
    this.nodesById.set(id, updated);
    this.recomputeConnectionCounts();
    return updated;
  }

  async deleteNode(id: string, context?: GraphStoreContext): Promise<GraphStoreDeleteNodeResult> {
    const scope = resolveScope(context);
    if (this.nodeScopeById.get(id) !== scope) return { deleted: false, edgesRemoved: 0 };
    const node = this.nodesById.get(id);
    if (!node) return { deleted: false, edgesRemoved: 0 };

    let edgesRemoved = 0;
    for (const edge of this.edgesById.values()) {
      if (this.edgeScopeById.get(edge.id) !== scope) continue;
      if (edge.fromNodeId === id || edge.toNodeId === id) {
        this.edgesById.delete(edge.id);
        this.edgeScopeById.delete(edge.id);
        edgesRemoved += 1;
      }
    }

    this.nodesById.delete(id);
    this.nodeScopeById.delete(id);
    this.nodesByScopeSlug.delete(`${scope}:${node.slug}`);
    this.recomputeConnectionCounts();
    return { deleted: true, edgesRemoved };
  }

  async listEdges(options?: GraphStoreListOptions): Promise<NeuronEdge[]> {
    const scope = resolveScope(options?.context);
    const limit = options?.limit;
    const offset = options?.offset ?? 0;
    const edges = [...this.edgesById.values()]
      .filter((edge) => this.edgeScopeById.get(edge.id) === scope)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const sliced = edges.slice(offset, limit ? offset + limit : undefined);
    return sliced;
  }

  async createEdges(edges: NeuronEdgeCreate[], context?: GraphStoreContext): Promise<NeuronEdge[]> {
    const scope = resolveScope(context);
    const created: NeuronEdge[] = [];
    for (const input of edges) {
      if (
        this.nodeScopeById.get(input.fromNodeId) !== scope ||
        this.nodeScopeById.get(input.toNodeId) !== scope
      ) {
        continue;
      }
      const edge: NeuronEdge = {
        id: crypto.randomUUID(),
        fromNodeId: input.fromNodeId,
        toNodeId: input.toNodeId,
        relationshipType: input.relationshipType ?? 'related_to',
        strength: input.strength ?? 0.5,
        confidence: input.confidence ?? 1,
        evidence: input.evidence ?? [],
        label: input.label ?? null,
        description: input.description ?? null,
        metadata: input.metadata ?? {},
        source: 'manual',
        sourceModel: null,
        bidirectional: input.bidirectional ?? false,
        createdAt: now(),
        updatedAt: now(),
      };
      this.edgesById.set(edge.id, edge);
      this.edgeScopeById.set(edge.id, scope);
      created.push(edge);
    }

    this.recomputeConnectionCounts();
    return created;
  }

  async updateEdge(id: string, patch: NeuronEdgeUpdate, context?: GraphStoreContext): Promise<NeuronEdge | null> {
    const scope = resolveScope(context);
    if (this.edgeScopeById.get(id) !== scope) return null;
    const edge = this.edgesById.get(id);
    if (!edge) return null;

    const updated: NeuronEdge = { ...edge };
    if (patch.relationshipType !== undefined) updated.relationshipType = patch.relationshipType;
    if (patch.strength !== undefined) updated.strength = patch.strength;
    if (patch.confidence !== undefined) updated.confidence = patch.confidence;
    if (patch.evidence !== undefined) updated.evidence = patch.evidence;
    if (patch.label !== undefined) updated.label = patch.label;
    if (patch.description !== undefined) updated.description = patch.description;
    if (patch.metadata !== undefined) updated.metadata = patch.metadata;
    updated.updatedAt = now();

    this.edgesById.set(id, updated);
    this.recomputeConnectionCounts();
    return updated;
  }

  async deleteEdge(id: string, context?: GraphStoreContext): Promise<boolean> {
    const scope = resolveScope(context);
    if (this.edgeScopeById.get(id) !== scope) return false;
    const existed = this.edgesById.delete(id);
    this.edgeScopeById.delete(id);
    if (existed) this.recomputeConnectionCounts();
    return existed;
  }

  async getSettings(context?: GraphStoreContext): Promise<NeuronSettings> {
    const scope = resolveScope(context);
    return this.settingsByScope.get(scope) ?? defaultSettings();
  }

  async updateSettings(update: NeuronSettingsUpdate, context?: GraphStoreContext): Promise<NeuronSettings> {
    const scope = resolveScope(context);
    const current = await this.getSettings(context);
    const next = applySettingsUpdate(current, update);
    this.settingsByScope.set(scope, next);
    return next;
  }

  async resetSettings(sections?: string[], context?: GraphStoreContext): Promise<NeuronSettings> {
    const scope = resolveScope(context);
    const defaults = defaultSettings();
    if (!sections?.length) {
      this.settingsByScope.set(scope, defaults);
      return defaults;
    }

    const current = await this.getSettings(context);
    const next: NeuronSettings = { ...current };
    for (const section of sections) {
      if (section === 'visualization') next.visualization = defaults.visualization;
      if (section === 'analysis') next.analysis = defaults.analysis;
      if (section === 'nodeTypes') next.nodeTypes = defaults.nodeTypes;
      if (section === 'domains') next.domains = defaults.domains;
      if (section === 'relationshipTypes') next.relationshipTypes = defaults.relationshipTypes;
    }
    this.settingsByScope.set(scope, next);
    return next;
  }

  async getGraph(params: GetGraphParams, context?: GraphStoreContext): Promise<GetGraphResponse> {
    const scope = resolveScope(context);
    const maxNodes = params.maxNodes;
    let nodes = [...this.nodesById.values()].filter((node) => this.nodeScopeById.get(node.id) === scope);
    if (params.domains?.length) nodes = nodes.filter((n) => params.domains?.includes(n.domain));
    if (params.nodeTypes?.length) nodes = nodes.filter((n) => params.nodeTypes?.includes(n.nodeType));
    if (params.clusterIds?.length) nodes = nodes.filter((n) => n.clusterId && params.clusterIds?.includes(n.clusterId));
    if (params.nodeIds?.length) nodes = nodes.filter((n) => params.nodeIds?.includes(n.id));

    nodes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const truncated = Boolean(maxNodes && nodes.length > maxNodes);
    if (maxNodes) nodes = nodes.slice(0, maxNodes);

    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const visualNodes = nodes.map(this.toVisualNode.bind(this));
    const visualEdges = [...this.edgesById.values()]
      .filter((edge) => this.edgeScopeById.get(edge.id) === scope)
      .filter((e) => nodeIdSet.has(e.fromNodeId) && nodeIdSet.has(e.toNodeId))
      .map((e) => this.toVisualEdge(e))
      .filter(Boolean) as NeuronVisualEdge[];

    return {
      nodes: visualNodes,
      edges: visualEdges,
      clusters: [],
      meta: {
        totalNodes: visualNodes.length,
        totalEdges: visualEdges.length,
        truncated,
        queryTime: 0,
      },
    };
  }

  async expandGraph(params: ExpandGraphRequest, context?: GraphStoreContext): Promise<ExpandGraphResponse> {
    const scope = resolveScope(context);
    const depth = Math.max(1, params.depth ?? 1);
    const direction = params.direction ?? 'both';

    const visited = new Set<string>(params.fromNodeIds);
    let frontier = new Set<string>(params.fromNodeIds);

    for (let step = 0; step < depth; step += 1) {
      const next = new Set<string>();
      for (const edge of this.edgesById.values()) {
        if (this.edgeScopeById.get(edge.id) !== scope) continue;
        const fromIn = frontier.has(edge.fromNodeId);
        const toIn = frontier.has(edge.toNodeId);

        if (direction === 'outbound' && fromIn && !visited.has(edge.toNodeId)) next.add(edge.toNodeId);
        if (direction === 'inbound' && toIn && !visited.has(edge.fromNodeId)) next.add(edge.fromNodeId);
        if (direction === 'both') {
          if (fromIn && !visited.has(edge.toNodeId)) next.add(edge.toNodeId);
          if (toIn && !visited.has(edge.fromNodeId)) next.add(edge.fromNodeId);
        }
      }

      next.forEach((id) => visited.add(id));
      frontier = next;
    }

    const nodeIds = [...visited];
    const nodes = nodeIds
      .map((id) => this.nodesById.get(id))
      .filter((node): node is NeuronNode => Boolean(node && this.nodeScopeById.get(node.id) === scope));
    nodes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const edges = [...this.edgesById.values()]
      .filter((edge) => this.edgeScopeById.get(edge.id) === scope)
      .filter((e) => nodeIdSet.has(e.fromNodeId) && nodeIdSet.has(e.toNodeId));

    return {
      nodes: nodes.map(this.toVisualNode.bind(this)),
      edges: edges.map((e) => this.toVisualEdge(e)).filter(Boolean) as NeuronVisualEdge[],
    };
  }

  async findPaths(params: FindPathRequest, context?: GraphStoreContext): Promise<FindPathResponse> {
    const scope = resolveScope(context);
    const maxDepth = Math.max(1, params.maxDepth ?? 5);
    const algorithm = params.algorithm ?? 'shortest';

    const all = this.findAllPaths(scope, params.fromNodeId, params.toNodeId, maxDepth).sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return b.totalStrength - a.totalStrength;
    });

    if (algorithm === 'shortest') return { paths: all.slice(0, 1) };
    return { paths: all };
  }

  async getNodeEmbeddingInfo(nodeId: string, context?: GraphStoreContext): Promise<GraphStoreEmbeddingInfo | null> {
    const scope = resolveScope(context);
    if (this.nodeScopeById.get(nodeId) !== scope) return null;
    const node = this.nodesById.get(nodeId);
    if (!node) return null;
    return {
      embedding: node.embedding ?? null,
      embeddingModel: node.embeddingModel ?? null,
      embeddingGeneratedAt: node.embeddingGeneratedAt ?? null,
    };
  }

  async setNodeEmbedding(nodeId: string, embedding: number[], model: string, context?: GraphStoreContext): Promise<void> {
    const scope = resolveScope(context);
    if (this.nodeScopeById.get(nodeId) !== scope) return;
    const node = this.nodesById.get(nodeId);
    if (!node) return;
    const updated: NeuronNode = {
      ...node,
      embedding,
      embeddingModel: model,
      embeddingGeneratedAt: now(),
      updatedAt: now(),
    };
    this.nodesById.set(nodeId, updated);
  }

  async clearNodeEmbeddings(nodeIds?: string[], context?: GraphStoreContext): Promise<void> {
    const scope = resolveScope(context);
    const ids = nodeIds?.length ? nodeIds : [...this.nodesById.keys()];
    for (const id of ids) {
      if (this.nodeScopeById.get(id) !== scope) continue;
      const node = this.nodesById.get(id);
      if (!node) continue;
      this.nodesById.set(id, {
        ...node,
        embedding: null,
        embeddingModel: null,
        embeddingGeneratedAt: null,
        updatedAt: now(),
      });
    }
  }

  async findSimilarNodeIds(
    nodeId: string,
    options?: { limit?: number; minSimilarity?: number },
    context?: GraphStoreContext
  ): Promise<GraphStoreSimilarityResult[]> {
    const scope = resolveScope(context);
    if (this.nodeScopeById.get(nodeId) !== scope) return [];
    const base = this.nodesById.get(nodeId);
    const baseEmbedding = base?.embedding ?? null;
    if (!baseEmbedding) return [];

    const limit = Math.max(1, options?.limit ?? 50);
    const minSimilarity = options?.minSimilarity ?? 0;

    const scored = [...this.nodesById.values()]
      .filter((n) => this.nodeScopeById.get(n.id) === scope)
      .filter((n) => n.id !== nodeId && n.embedding && n.embedding.length === baseEmbedding.length)
      .map((n) => ({ nodeId: n.id, similarity: cosineSimilarity(baseEmbedding, n.embedding as number[]) }))
      .filter((r) => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return scored;
  }

  private recomputeConnectionCounts(): void {
    const inbound = new Map<string, number>();
    const outbound = new Map<string, number>();

    for (const edge of this.edgesById.values()) {
      const edgeScope = this.edgeScopeById.get(edge.id) ?? 'default';
      if (
        this.nodeScopeById.get(edge.fromNodeId) !== edgeScope ||
        this.nodeScopeById.get(edge.toNodeId) !== edgeScope
      ) {
        continue;
      }
      outbound.set(edge.fromNodeId, (outbound.get(edge.fromNodeId) ?? 0) + 1);
      inbound.set(edge.toNodeId, (inbound.get(edge.toNodeId) ?? 0) + 1);
      if (edge.bidirectional) {
        outbound.set(edge.toNodeId, (outbound.get(edge.toNodeId) ?? 0) + 1);
        inbound.set(edge.fromNodeId, (inbound.get(edge.fromNodeId) ?? 0) + 1);
      }
    }

    for (const node of this.nodesById.values()) {
      const inCount = inbound.get(node.id) ?? 0;
      const outCount = outbound.get(node.id) ?? 0;
      this.nodesById.set(node.id, {
        ...node,
        inboundCount: inCount,
        outboundCount: outCount,
        connectionCount: inCount + outCount,
      });
    }
  }

  private toVisualNode(node: NeuronNode): NeuronVisualNode {
    return {
      id: node.id,
      slug: node.slug,
      label: node.label,
      domain: node.domain,
      tier: node.tier,
      metadata: node.metadata ?? {},
      ref: (node.metadata?.ref as string | null | undefined) ?? null,
      connectionCount: node.connectionCount ?? 0,
      position: node.positionOverride ?? undefined,
    };
  }

  private toVisualEdge(edge: NeuronEdge): NeuronVisualEdge | null {
    const from = this.nodesById.get(edge.fromNodeId);
    const to = this.nodesById.get(edge.toNodeId);
    if (!from || !to) return null;
    return {
      id: edge.id,
      from: from.slug,
      to: to.slug,
      relationshipType: edge.relationshipType,
      strength: edge.strength,
      label: edge.label ?? null,
    };
  }

  private findAllPaths(scope: string, fromId: string, toId: string, maxDepth: number) {
    const results: Array<{ nodes: string[]; edges: string[]; length: number; totalStrength: number }> = [];
    const dfs = (nodeId: string, path: string[], edgeIds: string[], strength: number) => {
      if (nodeId === toId) {
        results.push({ nodes: [...path], edges: [...edgeIds], length: path.length, totalStrength: strength });
        return;
      }

      if (edgeIds.length >= maxDepth) return;

      for (const edge of this.edgesById.values()) {
        if (this.edgeScopeById.get(edge.id) !== scope) continue;
        if (edge.fromNodeId !== nodeId) continue;
        if (path.includes(edge.toNodeId)) continue;
        if (edgeIds.length + 1 > maxDepth) continue;
        dfs(
          edge.toNodeId,
          [...path, edge.toNodeId],
          [...edgeIds, edge.id],
          strength + edge.strength
        );
      }
    };

    dfs(fromId, [fromId], [], 0);
    return results;
  }
}
