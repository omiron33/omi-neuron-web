---
title: Define event taxonomy for jobs and governance (event names, payload shapes, error semantics).
status: completed
bucket: To-Do
priority: 1
labels:
  - 'Phase:7E-Jobs'
  - 'Type:Discovery'
assignees:
  - CodingAgent
---

# Task 7E.2: Define event taxonomy for jobs and governance (event names, payload shapes, error semantics).

Plan item (Phase 1 – Discovery) from `plans/phase-7e-jobs-and-governance-plan.md`: Define event taxonomy for jobs and governance (event names, payload shapes, error semantics).

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/core/analysis/pipeline.ts`
- `src/api/routes/analyze.ts`
- `src/core/types/events.ts`
- `src/core/events/event-bus.ts`
- `src/storage/migrations/004_analysis_runs.ts`
- `src/react/hooks/useNeuronAnalysis.ts`

### Requirements
- [ ] Identify the exact code touchpoints and public API surfaces impacted by this change.
- [ ] Produce the required artifact(s) (code, docs, schema, or tests) to complete the plan item without introducing breaking changes.
- [ ] Update exports/index files where needed so new APIs are available from intended entry points.
- [ ] Add or update tests appropriate for the phase (contracts for design, unit/integration for implementation).

### Acceptance Criteria
- [ ] The plan item intent is fully satisfied (no partial implementation).
- [ ] TypeScript typecheck passes (`pnpm typecheck`).
- [ ] Lint passes for touched areas (`pnpm lint`).
- [ ] Tests pass (`pnpm test`) or new tests are added where gaps exist.
- [ ] Docs/examples updated if developer-facing behavior changed.

## Notes
- Created by generator on 2026-01-10T15:59:28.230Z.
- Existing event system (`src/core/types/events.ts`) already supports analysis lifecycle (`analysis:*`) and edge lifecycle (`edge:*`) events.
- Phase 7E event taxonomy (v1) should add a stable “job” namespace for streaming/polling and a separate namespace for governance actions.

Recommended v1 job event topics (portable; suitable for SSE):
- `analysis.job.started`
- `analysis.job.progress`
- `analysis.job.completed`
- `analysis.job.failed`
- `analysis.job.canceled`

Recommended v1 job event payload shape:
- Always include: `jobId`, `scope` (when Phase 7D is enabled), and a timestamp (provided by `NeuronEvent.timestamp`).
- Progress payload should be compatible with `PipelineProgress` fields:
  - `stage` (`embeddings|clustering|relationships|complete`)
  - `progress` (0–100; overall or per-stage, but be consistent)
  - `currentItem`, `itemsProcessed`, `totalItems`
  - optional `estimatedTimeRemaining`
- Failed payload should include a safe error message (avoid leaking secrets/stack traces over SSE by default).

Recommended v1 governance event topics:
- `edges.suggestion.created`
- `edges.suggestion.approved`
- `edges.suggestion.rejected`

Governance payload guidance:
- Created should include the suggested edge record (or at minimum its id + key fields).
- Approved should include `suggestionId` and (if created) the resulting `edgeId`.
- Rejected should include `suggestionId` and an optional `reason`.
