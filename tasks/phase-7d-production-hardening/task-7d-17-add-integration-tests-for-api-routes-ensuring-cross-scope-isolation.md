---
title: Add integration tests for API routes ensuring cross-scope isolation.
status: pending
bucket: To-Do
priority: 3
labels:
  - 'Phase:7D-Production'
  - 'Type:Validation'
assignees:
  - CodingAgent
depends_on:
  - task-7d-15-update-docs-and-cli-scaffolding-to-include-production-safe-patterns
  - task-7a-6-design-graphstore-interface-to-cover-the-minimal-crud-graph-query-needs
---

# Task 7D.17: Add integration tests for API routes ensuring cross-scope isolation.

Plan item (Phase 4 – Validation) from `plans/phase-7d-production-hardening-plan.md`: Add integration tests for API routes ensuring cross-scope isolation.

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
