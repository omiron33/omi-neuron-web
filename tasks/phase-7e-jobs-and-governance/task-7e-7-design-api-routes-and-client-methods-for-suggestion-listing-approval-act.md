---
title: Design API routes and client methods for suggestion listing + approval actions.
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7E-Jobs'
  - 'Type:Design'
assignees:
  - CodingAgent
depends_on:
  - task-7e-3-define-governance-requirements-and-document-defaults
  - task-7a-13-refactor-relationshipengine-to-depend-on-llmprovider-preserving-existing
---

# Task 7E.7: Design API routes and client methods for suggestion listing + approval actions.

Plan item (Phase 2 – Design/Architecture) from `plans/phase-7e-jobs-and-governance-plan.md`: Design API routes and client methods for suggestion listing + approval actions.

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
- Defined v1 governance endpoints and client-facing semantics in `docs/phase-7e/governance-api.md`.
- Key decisions:
  - Use a top-level `/api/neuron/suggestions` resource (avoids overloading `/edges/*` and keeps dispatch simple).
  - Provide both single and bulk approve/reject routes, with idempotent semantics.
  - Endpoints must be scope-aware and compatible with Phase 7D auth hooks.
