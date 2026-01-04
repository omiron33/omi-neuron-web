import { useCallback, useEffect, useState } from 'react';
import type { ListNodesParams, NeuronNode, NeuronNodeCreate, NeuronNodeUpdate } from '../../core/types';
import { useNeuronContext } from './useNeuronContext';

export interface UseNeuronNodesOptions {
  initialFilters?: ListNodesParams;
  pageSize?: number;
}

export function useNeuronNodes(options?: UseNeuronNodesOptions) {
  const { api } = useNeuronContext();
  const [nodes, setNodes] = useState<NeuronNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.nodes.list({
        ...options?.initialFilters,
        page,
        limit: options?.pageSize ?? 50,
      });
      setNodes(response.nodes);
      setTotalPages(response.pagination.totalPages ?? 1);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [api, options, page]);

  useEffect(() => {
    void fetchNodes();
  }, [fetchNodes]);

  return {
    nodes,
    isLoading,
    error,
    createNode: async (data: NeuronNodeCreate) => {
      const response = await api.nodes.create({ nodes: [data] });
      await fetchNodes();
      return response.created[0];
    },
    updateNode: async (id: string, data: NeuronNodeUpdate) => {
      const updated = await api.nodes.update(id, data);
      await fetchNodes();
      return updated as NeuronNode;
    },
    deleteNode: async (id: string) => {
      await api.nodes.delete(id);
      await fetchNodes();
    },
    batchCreate: async (nodesInput: NeuronNodeCreate[]) => {
      const response = await api.nodes.create({ nodes: nodesInput });
      await fetchNodes();
      return response.created;
    },
    search: async (query: string) => {
      const response = await api.nodes.list({ search: query });
      setNodes(response.nodes);
    },
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    setPage,
    nextPage: () => setPage((prev) => Math.min(prev + 1, totalPages)),
    prevPage: () => setPage((prev) => Math.max(prev - 1, 1)),
  };
}
