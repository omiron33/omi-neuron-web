import { useState } from 'react';
import type { FindSimilarOptions, SearchResult, SemanticSearchOptions } from '../../core/types';
import { useNeuronContext } from './useNeuronContext';

export function useNeuronSearch() {
  const { api } = useNeuronContext();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = async (query: string, options?: SemanticSearchOptions) => {
    setIsSearching(true);
    try {
      const response = await api.search.semantic({ query, ...options });
      setResults(response.results as SearchResult[]);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsSearching(false);
    }
  };

  const findSimilar = async (nodeId: string, options?: FindSimilarOptions) => {
    setIsSearching(true);
    try {
      const response = await api.search.similar({ nodeId, ...options });
      setResults(response.results as SearchResult[]);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    results,
    isSearching,
    error,
    search,
    findSimilar,
    clearResults: () => setResults([]),
  };
}
