---
title: Update relationship inference flow to write suggestions and optionally auto-approve based on config thresholds.
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7E-Jobs'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7e-8-design-hook-apis-for-react-and-how-they-integrate-with-the-existing-even
  - task-7a-13-refactor-relationshipengine-to-depend-on-llmprovider-preserving-existing
---

# Task 7E.12: Update relationship inference flow to write suggestions and optionally auto-approve based on config thresholds.

Plan item (Phase 3 – Implementation) from `plans/phase-7e-jobs-and-governance-plan.md`: Update relationship inference flow to write suggestions and optionally auto-approve based on config thresholds.

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
- Updated relationship inference persistence to support governance + auto-approval:
  - Default relationship step now calls `RelationshipEngine.persistInferences(...)` instead of directly inserting edges.
  - When `analysis.relationshipGovernanceEnabled` is enabled and `suggested_edges` exists, inference upserts `suggested_edges` rows (without overwriting terminal statuses).
  - When `analysis.relationshipAutoApproveEnabled` is enabled and confidence ≥ `analysis.relationshipAutoApproveMinConfidence`, inference ensures an edge exists and marks the suggestion approved.
  - If `suggested_edges` is missing (migrations not applied), inference falls back to edge-only writes.
- Added new analysis settings fields (Phase 7E) to control the above behavior:
  - `analysis.relationshipGovernanceEnabled`
  - `analysis.relationshipAutoApproveEnabled`
  - `analysis.relationshipAutoApproveMinConfidence`
- Added unit tests covering governance persistence + fallback behavior (`tests/core/relationship-engine-governance.test.ts`).
- Validation run on 2026-01-11:
  - `pnpm test` ✅
  - `pnpm typecheck` ✅
  - `pnpm lint` ✅ (warnings only: existing CLI console usage)
