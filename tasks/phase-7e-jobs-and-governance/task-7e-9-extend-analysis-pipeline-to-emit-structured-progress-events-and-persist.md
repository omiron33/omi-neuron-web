---
title: Extend analysis pipeline to emit structured progress events and persist progress snapshots to DB for polling.
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7E-Jobs'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7e-8-design-hook-apis-for-react-and-how-they-integrate-with-the-existing-even
  - task-7a-13-refactor-relationshipengine-to-depend-on-llmprovider-preserving-existing
---

# Task 7E.9: Extend analysis pipeline to emit structured progress events and persist progress snapshots to DB for polling.

Plan item (Phase 3 – Implementation) from `plans/phase-7e-jobs-and-governance-plan.md`: Extend analysis pipeline to emit structured progress events and persist progress snapshots to DB for polling.

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
- Implemented progress persistence + job event emission:
  - Added DB migration `src/storage/migrations/007_analysis_runs_progress.ts` (adds `progress_snapshot` + `updated_at`).
  - `AnalysisPipeline` now:
    - computes an overall progress value (0–100) across stages
    - persists `progress_snapshot` updates during execution for polling clients
    - emits `analysis.job.*` events via `EventBus`
    - treats aborts as `cancelled` (terminal) rather than `failed`
  - Default analysis steps now emit incremental progress during embeddings and relationship inference.

Validation run on 2026-01-11:
- `pnpm test` ✅
- `pnpm typecheck` ✅
- `pnpm lint` ✅ (warnings only: existing CLI console usage)
