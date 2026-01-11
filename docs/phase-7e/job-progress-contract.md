# Phase 7E — Job Progress Contract (Polling + Events)

This document defines the v1 contract for reporting analysis job progress in `omi-neuron-web`.

Goals:
- A client can start an analysis job, then observe its progress via:
  - **polling** (always supported)
  - **SSE streaming** (optional enhancement; see `docs/phase-7e/sse-contract.md`)
- Progress updates are portable and framework-agnostic (Fetch-native).
- Cancellation is a first-class terminal outcome (not a “failed job”).

## Terminology
- **Job**: an `analysis_runs` row created by the analysis pipeline.
- **Progress snapshot**: the latest known progress state persisted for polling clients.
- **Event**: a transient progress update delivered via an event bus or SSE stream.

## Status model (v1)
Status values (existing + enforced):
- `queued`
- `running`
- `completed` (terminal)
- `failed` (terminal)
- `cancelled` (terminal)

## Progress snapshot (v1)
The server should persist a progress snapshot that is safe to return from API endpoints and safe to emit over SSE.

Recommended fields:
- `jobId: string`
- `status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'`
- `runType: 'embedding' | 'clustering' | 'relationship_inference' | 'full_analysis'`
- `scope: string` (when Phase 7D multi-tenancy is enabled; otherwise `"default"`)
- `progress: number` (0–100; consistent semantics required)
- `stage: 'embeddings' | 'clustering' | 'relationships' | 'complete'`
- `currentItem: string` (human-readable step/item marker; safe string)
- `itemsProcessed: number`
- `totalItems: number`
- `estimatedTimeRemaining?: number` (seconds or ms; pick one consistently)
- `startedAt?: string` (ISO8601)
- `updatedAt?: string` (ISO8601; used for polling + SSE heartbeat semantics)
- `completedAt?: string` (ISO8601 when terminal)

Notes:
- The progress snapshot should be compatible with `PipelineProgress` to minimize duplication.
- The snapshot MUST NOT include secrets (OpenAI keys, DB urls) or full stack traces.

## API (polling) shapes
Existing endpoints should remain valid; new fields may be added additively.

### Start a job
`POST /api/neuron/analyze`

Existing response:
- `AnalysisResponse = { jobId, status, estimatedDuration?, results? }`

Additive extension (recommended):
- optionally include `job` or a `progress` snapshot so clients can render immediately without a follow-up request.

### Get job status
`GET /api/neuron/analyze/:jobId`

Recommended response:
- `job: AnalysisRun` (or a normalized shape)
- optional `progress` snapshot if the persisted schema differs from the core `AnalysisRun` type

### List job history
`GET /api/neuron/analyze/history`

Recommended response:
- `jobs: AnalysisRun[]`
- support filters later (`status`, pagination), but v1 can start with “last N jobs”.

## Cancellation semantics
`POST /api/neuron/analyze/:jobId/cancel`

Rules:
- If the job is currently running, the server marks it `cancelled` and stops further work.
- If cancellation is requested after completion, the server returns `{ cancelled: false }`.
- If the pipeline stops due to an abort signal, the job must end in `cancelled` (not `failed`).

## Progress semantics
To avoid confusing UI:
- `progress` must be monotonic within a job (non-decreasing).
- `progress = 100` implies a terminal state (`completed`), except for stages where “100% of stage” is explicitly scoped.
- `stage` must reflect which part of the pipeline is currently running:
  - `embeddings` → embedding generation
  - `clustering` → cluster creation
  - `relationships` → relationship inference
  - `complete` → terminal

Minimum expectations:
- Emit/persist at least one progress update at the start of each stage.
- For long stages (embeddings/relationships), emit/persist periodic updates (batch-based is acceptable).

## Event topics (for SSE and internal event bus)
Job lifecycle events (v1 topics):
- `analysis.job.started`
- `analysis.job.progress`
- `analysis.job.completed`
- `analysis.job.failed`
- `analysis.job.canceled`

The SSE contract defines framing and reconnection behavior; this document defines payload expectations only.

