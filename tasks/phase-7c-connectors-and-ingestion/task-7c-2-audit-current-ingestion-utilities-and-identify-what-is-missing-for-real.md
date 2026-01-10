---
title: Audit current ingestion utilities (`DataProcessor`) and identify what is missing for real connectors (provenance, mapping tables, incremental sync).
status: pending
bucket: To-Do
priority: 1
labels:
  - 'Phase:7C-Ingestion'
  - 'Type:Discovery'
assignees:
  - CodingAgent
---

# Task 7C.2: Audit current ingestion utilities (`DataProcessor`) and identify what is missing for real connectors (provenance, mapping tables, incremental sync).

Plan item (Phase 1 – Discovery) from `plans/phase-7c-connectors-and-ingestion-plan.md`: Audit current ingestion utilities (`DataProcessor`) and identify what is missing for real connectors (provenance, mapping tables, incremental sync).

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
