import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SuggestedEdge } from '../../core/types';
import type { ListSuggestionsParams } from '../../core/types/api';
import { createEvent } from '../../core/events/event-bus';
import { useNeuronContext } from './useNeuronContext';

export type UseNeuronSuggestionsOptions = Omit<ListSuggestionsParams, 'page'> & {
  page?: number;
};

export type UseNeuronSuggestionsResult = {
  suggestions: SuggestedEdge[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  approve: (ids: string | string[]) => Promise<void>;
  reject: (ids: string | string[], reason?: string) => Promise<void>;
};

export function useNeuronSuggestions(options: UseNeuronSuggestionsOptions = {}): UseNeuronSuggestionsResult {
  const { api, events } = useNeuronContext();

  const [suggestions, setSuggestions] = useState<SuggestedEdge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => ({ ...options }), [options]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.suggestions.list(params);
      setSuggestions(response.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [api.suggestions, params]);

  const approve = useCallback(
    async (ids: string | string[]) => {
      const list = Array.isArray(ids) ? ids : [ids];
      if (list.length === 0) return;

      setError(null);

      try {
        let edgeIds: Array<string | null> = [];
        if (list.length === 1) {
          const result = await api.suggestions.approve(list[0]);
          edgeIds = [result.edgeId];
        } else {
          const result = await api.suggestions.bulkApprove({ ids: list });
          edgeIds = result.edgeIds ?? [];
        }

        setSuggestions((prev) =>
          prev.map((s) =>
            list.includes(s.id)
              ? { ...s, status: 'approved', approvedEdgeId: s.approvedEdgeId ?? edgeIds[list.indexOf(s.id)] ?? null }
              : s
          )
        );

        events.emit(createEvent('edges.suggestion.approved', { ids: list, edgeIds }, 'api'));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [api.suggestions, events]
  );

  const reject = useCallback(
    async (ids: string | string[], reason?: string) => {
      const list = Array.isArray(ids) ? ids : [ids];
      if (list.length === 0) return;

      setError(null);
      try {
        if (list.length === 1) {
          await api.suggestions.reject(list[0], { reason });
        } else {
          await api.suggestions.bulkReject({ ids: list, reason });
        }

        setSuggestions((prev) => prev.map((s) => (list.includes(s.id) ? { ...s, status: 'rejected' } : s)));
        events.emit(createEvent('edges.suggestion.rejected', { ids: list, reason }, 'api'));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [api.suggestions, events]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { suggestions, isLoading, error, refresh, approve, reject };
}
