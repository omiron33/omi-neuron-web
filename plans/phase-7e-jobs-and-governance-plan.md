# Phase 7E: Jobs + Governance (Streaming Progress + Approvals) Plan

## Outcomes
- Analysis jobs provide a modern UX:
  - progress events
  - streaming updates (SSE) where possible
  - polling fallback
- Relationship inference supports a governance workflow:
  - suggested edges queue
  - approve/reject endpoints
  - optional auto-approve configuration for low-risk use cases
- The event model is coherent across server + client:
  - API emits events
  - React hooks subscribe and update UI

## Scope

### In scope
- Server-side job progress events (at least: started/progress/completed/failed/canceled).
- An SSE endpoint for live job progress (plus polling fallback for environments where SSE is unsuitable).
- A suggested-edges data model:
  - store inferred relationships as “suggestions” prior to becoming edges
  - track status and reviewer metadata
- API endpoints:
  - list suggestions (filter by status/scope)
  - approve/reject suggestions
  - bulk actions
- React hooks:
  - `useNeuronJobStream` (or equivalent) for progress subscription
  - `useNeuronSuggestions` for governance UI
- Docs: job UX patterns + governance workflow.

#### Proposed event types (v1)
- Job lifecycle:
  - `analysis.job.started`
  - `analysis.job.progress` (phase/step + optional percent)
  - `analysis.job.completed`
  - `analysis.job.failed`
  - `analysis.job.canceled`
- Governance:
  - `edges.suggestion.created`
  - `edges.suggestion.approved`
  - `edges.suggestion.rejected`

#### Suggested edges model (v1 target)
Suggested edges should be stored separately from “real” edges so consumers can:
- review before committing to the graph
- apply different retention rules
- keep “suggested” edges out of visualization unless explicitly requested

Proposed minimal fields (finalized in Phase 2 design):
- `id` (uuid), `scope` (optional if Phase 7D is used)
- `from_node_id`, `to_node_id`
- `relationship_type`, `confidence`, `strength`
- `reasoning` (text), `evidence` (jsonb)
- `status`: `pending | approved | rejected`
- `source_model` (string), `analysis_run_id` (uuid)
- `reviewed_by` (string|null), `reviewed_at` (timestamp|null)

### Out of scope
- Full workflow engines or distributed queues (BullMQ, Temporal, etc.).
- Real-time multi-user collaboration and presence.
- Complex approval UI components (we provide hooks + contracts, not a full app UI).

## Assumptions & Constraints
- Existing `analysis_runs` table exists and can be extended (Phase 2/Phase 4 already created it).
- Phase 7D scoping (optional) may be used; governance should be compatible with scoping.
- Streaming must degrade gracefully (SSE optional; polling always works).

## Dependencies
- Analysis pipeline (`src/core/analysis/pipeline.ts`) for emitting progress and job metadata.
- Event system (`src/core/events/*`) for unified event types.
- Storage migrations (`src/storage/migrations/*`) for suggested edges tables.
- API routes (`src/api/routes/analyze.ts`, `src/api/routes/*`) for adding endpoints.
- React API client and hooks for consuming endpoints.

## Execution Phases

### Phase 1 – Discovery 🟥
- [x] Audit current job tracking (`analysis_runs`) and identify what progress metadata is missing for a high-quality UX.
- [x] Define event taxonomy for jobs and governance (event names, payload shapes, error semantics).
- [x] Define governance requirements (statuses, reviewer identity shape, bulk actions, retention) and document defaults.

### Phase 2 – Design/Architecture 🟥
Design artifacts to produce in this phase (recommended):
- `docs/phase-7e/job-progress-contract.md` (event payloads, polling shapes, cancellation)
- `docs/phase-7e/sse-contract.md` (routes, reconnection, heartbeat, auth/scope)
- `docs/phase-7e/suggested-edges-schema.md` (tables, status transitions, indexes)
- `docs/phase-7e/governance-api.md` (endpoints, request/response shapes)

- [x] Design job progress reporting contract:
  - progress units (percent/phase/step)
  - partial results (optional)
  - cancellation semantics
- [x] Design SSE endpoint(s) and fallback strategy:
  - route path(s)
  - reconnection behavior
  - heartbeat and timeout behavior
- [x] Design suggested-edge schema:
  - `suggested_edges` table fields
  - relation to nodes/analysis runs
  - indexes + status transitions
- [x] Design API routes and client methods for suggestion listing + approval actions.
- [x] Design hook APIs for React (stream subscription and suggestions management) and how they integrate with the existing `EventBus`.

### Phase 3 – Implementation 🟥
- [x] Extend analysis pipeline to emit structured progress events and persist progress snapshots to DB for polling.
- [x] Implement SSE endpoint(s) for job progress streaming and add fallback polling endpoints if needed.
- [x] Add migrations for suggested edges and implement repositories for suggestions.
- [x] Update relationship inference flow to write suggestions and optionally auto-approve based on config thresholds.
- [x] Add API routes for suggestions CRUD (list/approve/reject/bulk) and update API client accordingly.
- [x] Add React hooks for job streaming and suggestions governance.
- [x] Add docs and examples showing:
  - streaming vs polling
  - approval workflow patterns

### Phase 4 – Validation 🟥
- [x] Add unit tests for progress event emission + persistence.
- [x] Add integration tests for SSE endpoint (basic connect/receive/close) and fallback polling behavior.
- [x] Add tests for suggestion state transitions and authorization/scope enforcement hooks.
- [x] Validate end-to-end flow: infer suggestions → approve → edges appear in graph queries.

## Risks & Mitigations
- SSE reliability across platforms → Keep polling as first-class; SSE optional enhancement.
- Governance schema complexity → Keep v1 minimal (pending/approved/rejected) with clear extension points.
- Event model drift between server/client → Centralize event types in `src/core/types/events.ts` and reuse in client hooks.

## Open Questions
- Should suggested edges be visible in graph queries as “ghost edges” before approval (opt-in)?
- Should approvals record reviewer identity, and if so, what is the minimal portable shape?

## Task Backlog
- Add “explain why this edge is suggested” UI helpers (beyond data contract).
- Add audit logging for approvals and destructive actions.

## Parallel / Unblock Options
- Suggested-edge schema + repositories can be built in parallel with SSE design.
- React hooks can be stubbed against polling endpoints first, then upgraded to SSE.
