---
title: Implement request context middleware and update route factory to support context-aware handlers.
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

# Task 7D.11: Implement request context middleware and update route factory to support context-aware handlers.

Plan item (Phase 3 – Implementation) from `plans/phase-7d-production-hardening-plan.md`: Implement request context middleware and update route factory to support context-aware handlers.

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
- Implemented `RequestContext` + context derivation wrapper in `src/api/middleware/request-context.ts`:
  - header-first scope resolution via `x-neuron-scope`
  - request correlation via `x-request-id` (generated when missing)
  - adapter `toGraphStoreContext()` for storage calls
- Updated API route factory and handlers to accept optional `RequestContextOptions` and pass scoped context into `GraphStore` methods:
  - `src/api/routes/factory.ts`
  - `src/api/routes/nodes.ts`
  - `src/api/routes/edges.ts`
  - `src/api/routes/graph.ts`
  - `src/api/routes/analyze.ts`
  - `src/api/routes/settings.ts`
  - `src/api/routes/search.ts`
- Ensured scope is propagated through analysis pipeline execution paths so multi-tenant API requests remain isolated:
  - `src/core/analysis/pipeline.ts`
  - `src/core/analysis/embeddings-service.ts`
  - `src/core/analysis/clustering-engine.ts`
  - `src/core/analysis/relationship-engine.ts`
- Added a unit test covering header precedence and wrapper behavior: `tests/api/request-context.test.ts`.
- Updated README API/middleware docs to include `requestContext` options and request-context exports.
