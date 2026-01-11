---
title: Update CLI scaffolding to support local-first templates and add a “quickstart without Docker” path.
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7B-Storage'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7b-8-define-a-portability-strategy-for-analysis
  - task-7a-6-design-graphstore-interface-to-cover-the-minimal-crud-graph-query-needs
---

# Task 7B.14: Update CLI scaffolding to support local-first templates and add a “quickstart without Docker” path.

Plan item (Phase 3 – Implementation) from `plans/phase-7b-storage-backends-plan.md`: Update CLI scaffolding to support local-first templates and add a “quickstart without Docker” path.

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/storage/factory.ts`
- `src/storage/index.ts`
- `src/api/routes/*`
- `src/core/analysis/scoring-engine.ts`
- `src/core/types/settings.ts`

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
- Updated `omi-neuron init` to support `--storage postgres|memory|file` and file-mode options (`--file-path`, `--persist-interval`).
- Docker compose generation is now skipped automatically for non-Postgres storage modes.
