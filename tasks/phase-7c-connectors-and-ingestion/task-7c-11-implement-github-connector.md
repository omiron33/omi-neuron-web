---
title: Implement GitHub connector (issues/PRs as nodes; cross-references and mentions as edges).
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7C-Ingestion'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7c-7-design-sync-safety-rails
  - task-7a-6-design-graphstore-interface-to-cover-the-minimal-crud-graph-query-needs
---

# Task 7C.11: Implement GitHub connector (issues/PRs as nodes; cross-references and mentions as edges).

Plan item (Phase 3 – Implementation) from `plans/phase-7c-connectors-and-ingestion-plan.md`: Implement GitHub connector (issues/PRs as nodes; cross-references and mentions as edges).

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/core/analysis/data-processor.ts`
- `src/cli/commands/*`
- `src/api/repositories/*`
- `src/storage/migrations/*`

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
- Implemented `GitHubConnector` with REST API listing + best-effort reference extraction for issues/PRs:
  - `src/core/ingestion/connectors/github-connector.ts`
