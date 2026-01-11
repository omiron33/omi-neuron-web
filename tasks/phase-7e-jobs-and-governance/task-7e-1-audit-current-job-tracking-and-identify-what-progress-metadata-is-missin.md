---
title: Audit current job tracking (`analysis_runs`) and identify what progress metadata is missing for a high-quality UX.
status: completed
bucket: To-Do
priority: 1
labels:
  - 'Phase:7E-Jobs'
  - 'Type:Discovery'
assignees:
  - CodingAgent
---

# Task 7E.1: Audit current job tracking (`analysis_runs`) and identify what progress metadata is missing for a high-quality UX.

Plan item (Phase 1 – Discovery) from `plans/phase-7e-jobs-and-governance-plan.md`: Audit current job tracking (`analysis_runs`) and identify what progress metadata is missing for a high-quality UX.

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
- Current job tracking is persisted only to `analysis_runs` with:
  - `status` (`queued|running|completed|failed|cancelled`)
  - `progress` (integer, mostly unused mid-run)
  - `input_params` / `results` JSONB
  - timestamps and error fields
- Missing for a high-quality progress UX:
  - Progress snapshots persisted during execution (currently only `0 → 100` updates are written; no intermediate progress writes).
  - A structured “stage/step/message” model (DB has no stage/step; `PipelineProgress` exists but is only callback-based and not persisted).
  - A “last updated” marker for polling clients and SSE heartbeat semantics.
  - Reliable cancellation semantics (current `cancelJob` sets DB status then aborts, but the running pipeline can still mark the job as failed).
  - A consistent API contract for “start job → get progress/history” (`GET /analyze/history` exists but has no client method; `useNeuronAnalysis` casts `AnalysisResponse` into `AnalysisRun`).
- Touchpoints / public surfaces impacted by Phase 7E:
  - `src/core/analysis/pipeline.ts` and `src/core/analysis/steps/*` (emit/persist progress, cancellation semantics)
  - `src/core/types/events.ts` + `src/core/events/event-bus.ts` (job + governance event taxonomy)
  - `src/api/routes/analyze.ts` (SSE + polling endpoints; history list; cancel semantics)
  - `src/react/api-client.ts` + `src/react/hooks/useNeuronAnalysis.ts` (job history/progress consumption and streaming hooks)
