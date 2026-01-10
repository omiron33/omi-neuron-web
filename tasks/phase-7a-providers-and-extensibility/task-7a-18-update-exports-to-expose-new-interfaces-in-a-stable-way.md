---
title: Update exports (`src/index.ts`, `src/api/index.ts`) to expose new interfaces in a stable way.
status: pending
bucket: To-Do
priority: 2
labels:
  - 'Phase:7A-Extensibility'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7a-10-define-migration-plan-docs-what-existing-consumers-do-today-vs-the-recom
---

# Task 7A.18: Update exports (`src/index.ts`, `src/api/index.ts`) to expose new interfaces in a stable way.

Plan item (Phase 3 – Implementation) from `plans/phase-7a-providers-and-extensibility-plan.md`: Update exports (`src/index.ts`, `src/api/index.ts`) to expose new interfaces in a stable way.

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
