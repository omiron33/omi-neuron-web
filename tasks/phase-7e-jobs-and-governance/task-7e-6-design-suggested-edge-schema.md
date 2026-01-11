---
title: Design suggested-edge schema:
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

# Task 7E.6: Design suggested-edge schema:

Plan item (Phase 2 – Design/Architecture) from `plans/phase-7e-jobs-and-governance-plan.md`: Design suggested-edge schema:

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
- Defined the v1 suggested-edges schema (fields, indexes, transitions, dedupe strategy) in `docs/phase-7e/suggested-edges-schema.md`.
- Key decisions:
  - Separate `suggested_edges` table; suggestions do not appear in `edges` until approved.
  - Scope-aware (`scope` default `"default"`).
  - Prefer dedupe via `UNIQUE(scope, from_node_id, to_node_id, relationship_type)` for a low-noise governance queue.
