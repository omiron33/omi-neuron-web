# Phase 7E — React Hook APIs (Streaming + Governance)

This document defines v1 React hook contracts for consuming Phase 7E Jobs + Governance features.

Goals:
- Provide an ergonomic API for progress UX (`useNeuronJobStream`).
- Provide a minimal governance API for suggested edges (`useNeuronSuggestions`).
- Integrate with the existing client-side `EventBus` so consumers can opt into event-driven UI updates.

## `useNeuronJobStream`
Subscribes to job progress via SSE when available, with a polling fallback.

### Signature (conceptual)
```ts
type UseNeuronJobStreamOptions = {
  jobId: string;
  enabled?: boolean;
  scope?: string;
  transport?: 'auto' | 'sse' | 'poll';
  pollIntervalMs?: number;
};

type UseNeuronJobStreamResult = {
  status: string | null;
  progress: number | null;
  stage?: string;
  snapshot: unknown | null;
  error: string | null;
  isStreaming: boolean;
  reconnect: () => void;
  stop: () => void;
};
```

### Behavior
- When `transport = 'auto'` (default):
  - attempt SSE first
  - fall back to polling on connection errors or unsupported environments
- When polling:
  - call `api.analyze.getStatus(jobId)` until terminal state
- When SSE:
  - connect to `/api/neuron/analyze/:jobId/stream`
  - parse job events (`analysis.job.*`) and update local state

### Scope + auth notes
- Browser `EventSource` cannot attach custom headers.
- If multi-tenant scope is required, the hook should append `?scope=<scope>` to the stream URL and the server should derive scope via `requestContext.resolveScope`.
- Cookies/session auth works normally with same-origin EventSource.

### EventBus integration
On each received job event, emit into the provider `events` bus (optional but recommended) so other hooks/UI can react:
- `events.emit(createEvent('analysis.job.progress', payload, 'api'))`

For backward compatibility, it is acceptable to also emit existing `analysis:*` event types where they map cleanly.

## `useNeuronSuggestions`
Fetches and manages suggested edges for a governance UI.

### Signature (conceptual)
```ts
type UseNeuronSuggestionsOptions = {
  status?: 'pending' | 'approved' | 'rejected';
  relationshipType?: string;
  minConfidence?: number;
  page?: number;
  limit?: number;
};

type UseNeuronSuggestionsResult = {
  suggestions: unknown[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  approve: (ids: string | string[]) => Promise<void>;
  reject: (ids: string | string[], reason?: string) => Promise<void>;
};
```

### Behavior
- `refresh()` calls `api.suggestions.list(...)` with filters.
- `approve()` and `reject()` call the relevant API endpoints and update local cached state optimistically where possible.

### EventBus integration
After approve/reject:
- emit `edges.suggestion.approved` / `edges.suggestion.rejected` so consuming UI can update without refetching.

