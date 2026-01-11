# Phase 7E — React Hook APIs (Streaming + Governance)

This document defines v1 React hook contracts for consuming Phase 7E Jobs + Governance features.

Goals:
- Provide an ergonomic API for progress UX (`useNeuronJobStream`).
- Provide a minimal governance API for suggested edges (`useNeuronSuggestions`).
- Integrate with the existing client-side `EventBus` so consumers can opt into event-driven UI updates.

## `useNeuronJobStream`
Subscribes to analysis job progress via SSE when available, with a polling fallback.

Exports:
```ts
import { useNeuronJobStream, type UseNeuronJobStreamOptions } from '@omiron33/omi-neuron-web';
```

### Signature (v1)
```ts
type UseNeuronJobStreamOptions = {
  jobId: string;
  enabled?: boolean;
  scope?: string;
  transport?: 'auto' | 'sse' | 'poll';
  pollIntervalMs?: number;
};

type UseNeuronJobStreamResult = {
  status: AnalysisJobStatus | null;
  progress: number | null;
  stage?: string;
  snapshot: AnalysisProgressSnapshot | null;
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

### Usage example (SSE w/ polling fallback)
```tsx
'use client';

import { useMemo, useState } from 'react';
import { NeuronWebProvider, useNeuronAnalysis, useNeuronJobStream } from '@omiron33/omi-neuron-web';

function JobProgressInner() {
  const { startAnalysis } = useNeuronAnalysis();
  const [jobId, setJobId] = useState<string | null>(null);

  const stream = useNeuronJobStream({
    jobId: jobId ?? '',
    enabled: Boolean(jobId),
    transport: 'auto',
    scope: 'default',
  });

  return (
    <div>
      <button
        onClick={async () => {
          const { jobId } = await startAnalysis({ runType: 'full_analysis', async: true });
          setJobId(jobId);
        }}
      >
        Run analysis
      </button>

      {jobId ? (
        <pre>{JSON.stringify({ jobId, status: stream.status, progress: stream.progress, stage: stream.stage }, null, 2)}</pre>
      ) : null}
    </div>
  );
}

export function JobProgressExample() {
  const config = useMemo(() => ({ apiBasePath: '/api/neuron', scope: 'default' }), []);
  return (
    <NeuronWebProvider config={config}>
      <JobProgressInner />
    </NeuronWebProvider>
  );
}
```

## `useNeuronSuggestions`
Fetches and manages suggested edges for a governance UI.

Exports:
```ts
import { useNeuronSuggestions, type UseNeuronSuggestionsOptions } from '@omiron33/omi-neuron-web';
```

### Signature (v1)
```ts
type UseNeuronSuggestionsOptions = {
  status?: 'pending' | 'approved' | 'rejected';
  relationshipType?: string;
  minConfidence?: number;
  page?: number;
  limit?: number;
};

type UseNeuronSuggestionsResult = {
  suggestions: SuggestedEdge[];
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

### Usage example (approve/reject)
```tsx
'use client';

import { useMemo } from 'react';
import { NeuronWebProvider, useNeuronSuggestions } from '@omiron33/omi-neuron-web';

function SuggestionsInner() {
  const { suggestions, isLoading, error, approve, reject, refresh } = useNeuronSuggestions({
    status: 'pending',
    limit: 25,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={() => void refresh()}>Refresh</button>
      <ul>
        {suggestions.map((s) => (
          <li key={s.id}>
            {s.fromNodeId} → {s.toNodeId} ({s.relationshipType}, {Math.round(s.confidence * 100)}%)
            <button onClick={() => void approve(s.id)}>Approve</button>
            <button onClick={() => void reject(s.id, 'Not relevant')}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SuggestionsExample() {
  const config = useMemo(() => ({ apiBasePath: '/api/neuron', scope: 'default' }), []);
  return (
    <NeuronWebProvider config={config}>
      <SuggestionsInner />
    </NeuronWebProvider>
  );
}
```
