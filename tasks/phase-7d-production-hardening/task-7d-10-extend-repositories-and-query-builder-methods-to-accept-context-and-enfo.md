---
title: Extend repositories and query builder methods to accept `context` and enforce scope filters consistently.
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7D-Production'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7d-8-design-observability-and-logging-conventions
  - task-7a-6-design-graphstore-interface-to-cover-the-minimal-crud-graph-query-needs
---

# Task 7D.10: Extend repositories and query builder methods to accept `context` and enforce scope filters consistently.

Plan item (Phase 3 – Implementation) from `plans/phase-7d-production-hardening-plan.md`: Extend repositories and query builder methods to accept `context` and enforce scope filters consistently.

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/api/middleware/*`
- `src/api/routes/*`
- `src/api/repositories/*`
- `src/storage/migrations/*`
- `src/react/api-client.ts`

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
- Added `resolveScope()` + `DEFAULT_SCOPE` to `src/core/store/graph-store.ts` for consistent defaulting.
- Updated repository/query layers to accept an optional `context` and enforce `scope = resolveScope(context)` in Postgres queries:
  - `src/api/repositories/base.ts`
  - `src/api/repositories/node-repository.ts`
  - `src/api/repositories/edge-repository.ts`
  - `src/api/repositories/cluster-repository.ts`
  - `src/api/repositories/analysis-run-repository.ts`
  - `src/api/repositories/source-repository.ts`
  - `src/api/repositories/source-item-repository.ts`
  - `src/api/repositories/source-item-node-repository.ts`
  - `src/api/repositories/sync-run-repository.ts`
  - `src/api/query-builder.ts`
- Updated `src/core/store/postgres-graph-store.ts` to pass context through and apply scoped embedding/similarity queries.
