import { useCallback, useEffect, useState } from 'react';
import type {
  GraphFilters,
  NeuronVisualCluster,
  NeuronVisualEdge,
  NeuronVisualNode,
} from '../../core/types';
import type { GetGraphParams, FindPathResponse } from '../../core/types/api';
import { useNeuronContext } from './useNeuronContext';

export interface UseNeuronGraphOptions {
  domains?: string[];
  nodeTypes?: string[];
  minEdgeStrength?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNeuronGraph(options?: UseNeuronGraphOptions) {
  const { api } = useNeuronContext();
  const [nodes, setNodes] = useState<NeuronVisualNode[]>([]);
  const [edges, setEdges] = useState<NeuronVisualEdge[]>([]);
  const [clusters, setClusters] = useState<NeuronVisualCluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<GraphFilters>({});
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: GetGraphParams = {
        domains: options?.domains,
        nodeTypes: options?.nodeTypes,
        minEdgeStrength: options?.minEdgeStrength,
      };
      const response = await api.graph.get(params);
      setNodes(response.nodes);
      setEdges(response.edges);
      setClusters(response.clusters ?? []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [api, options]);

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  const expandFromNode = async (nodeId: string, depth = 1) => {
    const response = await api.graph.expand({ fromNodeIds: [nodeId], depth, direction: 'both' });
    setNodes(response.nodes);
    setEdges(response.edges);
  };

  const findPath = async (fromId: string, toId: string): Promise<FindPathResponse['paths'][number]> => {
    const response = await api.graph.findPath({ fromNodeId: fromId, toNodeId: toId });
    return response.paths[0];
  };

  return {
    nodes,
    edges,
    clusters,
    isLoading,
    error,
    filters,
    setFilters: (next: Partial<GraphFilters>) => setFilters((prev) => ({ ...prev, ...next })),
    clearFilters: () => setFilters({}),
    selectedNode: selectedNode ? nodes.find((node) => node.id === selectedNode) ?? null : null,
    selectNode: (nodeId: string | null) => setSelectedNode(nodeId),
    clearSelection: () => setSelectedNode(null),
    refetch: fetchGraph,
    expandFromNode,
    findPath,
  };
}
