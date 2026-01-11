import type {
  NeuronWebExplorerFilters,
  NeuronWebExplorerResolvedFilters,
  NeuronWebProps,
} from '../types';

export type ExplorerGraphData = NeuronWebProps['graphData'];

export function normalizeExplorerFilters(filters?: NeuronWebExplorerFilters): NeuronWebExplorerResolvedFilters {
  return {
    domains: filters?.domains ?? [],
    nodeTypes: filters?.nodeTypes ?? [],
    relationshipTypes: filters?.relationshipTypes ?? [],
    minEdgeStrength: typeof filters?.minEdgeStrength === 'number' ? filters.minEdgeStrength : undefined,
  };
}

export function applyExplorerFilters(
  graphData: ExplorerGraphData,
  filters: NeuronWebExplorerResolvedFilters,
  query: string
): ExplorerGraphData {
  const normalizedQuery = query.trim().toLowerCase();
  const domainSet = new Set(filters.domains);
  const relTypeSet = new Set(filters.relationshipTypes);

  let nodes = graphData.nodes;
  let edges = graphData.edges;
  let storyBeats = graphData.storyBeats;

  if (domainSet.size) {
    nodes = nodes.filter((node) => domainSet.has(node.domain));
  }

  if (relTypeSet.size) {
    edges = edges.filter((edge) => relTypeSet.has(edge.relationshipType));
  }

  const minEdgeStrength = filters.minEdgeStrength;
  if (typeof minEdgeStrength === 'number') {
    edges = edges.filter((edge) => edge.strength >= minEdgeStrength);
  }

  if (normalizedQuery.length) {
    nodes = nodes.filter((node) => {
      const label = node.label.toLowerCase();
      const slug = node.slug.toLowerCase();
      return label.includes(normalizedQuery) || slug.includes(normalizedQuery);
    });
  }

  const nodeSlugSet = new Set(nodes.map((node) => node.slug));
  edges = edges.filter((edge) => nodeSlugSet.has(edge.from) && nodeSlugSet.has(edge.to));

  if (storyBeats?.length) {
    const nodeIdSet = new Set(nodes.map((node) => node.id));
    storyBeats = storyBeats
      .map((beat) => ({ ...beat, nodeIds: beat.nodeIds.filter((id) => nodeIdSet.has(id)) }))
      .filter((beat) => beat.nodeIds.length >= 2);
  }

  return { ...graphData, nodes, edges, storyBeats };
}

