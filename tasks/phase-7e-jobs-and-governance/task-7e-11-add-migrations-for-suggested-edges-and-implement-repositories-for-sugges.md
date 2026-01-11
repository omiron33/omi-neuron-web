---
title: Add migrations for suggested edges and implement repositories for suggestions.
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

# Task 7E.11: Add migrations for suggested edges and implement repositories for suggestions.

Plan item (Phase 3 – Implementation) from `plans/phase-7e-jobs-and-governance-plan.md`: Add migrations for suggested edges and implement repositories for suggestions.

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
- Implemented suggested-edge persistence + repository surface:
  - Added `suggested_edges` migration (`src/storage/migrations/008_suggested_edges.ts`) aligned with the Phase 7E schema doc.
  - Added core types for suggestions (`src/core/types/suggested-edge.ts`) and exported from `src/core/types/index.ts`.
  - Added `SuggestedEdgeRepository` (`src/api/repositories/suggested-edge-repository.ts`) with scope-aware `list`, `upsertSuggestion`, and status transitions (`markApproved`/`markRejected`).
  - Added repository unit tests (`tests/api/suggested-edge-repository.test.ts`) covering row mapping + scoping behavior.
- Validation run on 2026-01-11:
  - `pnpm test` ✅
  - `pnpm typecheck` ✅
  - `pnpm lint` ✅ (warnings only: existing CLI console usage)
