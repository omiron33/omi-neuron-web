---
title: Add API routes for suggestions CRUD (list/approve/reject/bulk) and update API client accordingly.
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

# Task 7E.13: Add API routes for suggestions CRUD (list/approve/reject/bulk) and update API client accordingly.

Plan item (Phase 3 – Implementation) from `plans/phase-7e-jobs-and-governance-plan.md`: Add API routes for suggestions CRUD (list/approve/reject/bulk) and update API client accordingly.

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
- Added suggested-edges governance endpoints and client surface:
  - Server routes (`src/api/routes/suggestions.ts`):
    - `GET /api/neuron/suggestions` (list with filters + pagination)
    - `POST /api/neuron/suggestions/:id/approve` + `POST /api/neuron/suggestions/approve`
    - `POST /api/neuron/suggestions/:id/reject` + `POST /api/neuron/suggestions/reject`
    - Approval creates (or reuses) an `ai_inferred` edge and records `approved_edge_id` on the suggestion.
  - Routes factory now exposes `routes.suggestions` (`src/api/routes/factory.ts`).
  - Added API request/response types (Phase 7E) in `src/core/types/api.ts` and schemas in `src/core/schemas/api.ts`.
  - Added `NeuronApiClient.suggestions.*` methods (`src/react/api-client.ts`) and client tests (`tests/react/api-client.test.ts`).
- Validation run on 2026-01-11:
  - `pnpm test` ✅
  - `pnpm typecheck` ✅
  - `pnpm lint` ✅ (warnings only: existing CLI console usage)
