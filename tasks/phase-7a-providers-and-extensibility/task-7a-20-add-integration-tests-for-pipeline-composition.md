---
title: Add integration tests for pipeline composition (step ordering, cancellation, progress events, provider injection).
status: completed
bucket: To-Do
priority: 3
labels:
  - 'Phase:7A-Extensibility'
  - 'Type:Validation'
assignees:
  - CodingAgent
depends_on:
  - task-7a-18-update-exports-to-expose-new-interfaces-in-a-stable-way
---

# Task 7A.20: Add integration tests for pipeline composition (step ordering, cancellation, progress events, provider injection).

Plan item (Phase 4 – Validation) from `plans/phase-7a-providers-and-extensibility-plan.md`: Add integration tests for pipeline composition (step ordering, cancellation, progress events, provider injection).

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/core/analysis/embeddings-service.ts`
- `src/core/analysis/relationship-engine.ts`
- `src/core/analysis/pipeline.ts`
- `src/core/types/settings.ts`
- `src/react/NeuronWebProvider.tsx`
- `src/storage/factory.ts`
- `src/api/routes/factory.ts`

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
- Added pipeline composition integration coverage in `tests/integration/pipeline-composition.test.ts`.
