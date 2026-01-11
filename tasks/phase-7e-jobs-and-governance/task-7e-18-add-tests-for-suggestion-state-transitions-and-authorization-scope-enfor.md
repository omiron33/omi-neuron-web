---
title: Add tests for suggestion state transitions and authorization/scope enforcement hooks.
status: completed
bucket: To-Do
priority: 3
labels:
  - 'Phase:7E-Jobs'
  - 'Type:Validation'
assignees:
  - CodingAgent
depends_on:
  - task-7e-15-add-docs-and-examples-showing
  - task-7a-13-refactor-relationshipengine-to-depend-on-llmprovider-preserving-existing
---

# Task 7E.18: Add tests for suggestion state transitions and authorization/scope enforcement hooks.

Plan item (Phase 4 – Validation) from `plans/phase-7e-jobs-and-governance-plan.md`: Add tests for suggestion state transitions and authorization/scope enforcement hooks.

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
- Added API-level tests for governance state transitions + auth guard ordering:
  - `tests/api/suggestions-routes.test.ts`:
    - single approve: creates (or reuses) `ai_inferred` edge and is idempotent
    - single reject: records reason and is idempotent
    - bulk approve: scope-aware, returns `notFoundIds`, preserves already-approved suggestions
    - bulk reject: scope-aware, returns `notFoundIds`, does not overwrite already-rejected reasons
    - auth guard: denies before hitting storage (no DB calls on forbidden scope)
- Validation run on 2026-01-11:
  - `pnpm typecheck` ✅
  - `pnpm lint` ✅ (warnings only; unchanged)
  - `pnpm test` ✅
