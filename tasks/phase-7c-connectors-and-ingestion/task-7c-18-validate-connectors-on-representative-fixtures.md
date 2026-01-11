---
title: Validate connectors on representative fixtures (markdown vault fixture, GitHub fixture, RSS fixture, Notion export fixture).
status: completed
bucket: To-Do
priority: 3
labels:
  - 'Phase:7C-Ingestion'
  - 'Type:Validation'
assignees:
  - CodingAgent
depends_on:
  - task-7c-15-add-docs-examples-fixtures-for-each-connector
  - task-7a-6-design-graphstore-interface-to-cover-the-minimal-crud-graph-query-needs
---

# Task 7C.18: Validate connectors on representative fixtures (markdown vault fixture, GitHub fixture, RSS fixture, Notion export fixture).

Plan item (Phase 4 – Validation) from `plans/phase-7c-connectors-and-ingestion-plan.md`: Validate connectors on representative fixtures (markdown vault fixture, GitHub fixture, RSS fixture, Notion export fixture).

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
- Validated connectors against representative fixtures via unit coverage:
  - `tests/core/ingestion-connectors.test.ts`
  - Fixtures under `tests/fixtures/ingestion/*` cover Markdown, GitHub (issues/PRs), RSS, and Notion export parsing.
