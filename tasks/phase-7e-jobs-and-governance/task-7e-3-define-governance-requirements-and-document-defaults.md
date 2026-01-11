---
title: Define governance requirements (statuses, reviewer identity shape, bulk actions, retention) and document defaults.
status: completed
bucket: To-Do
priority: 1
labels:
  - 'Phase:7E-Jobs'
  - 'Type:Discovery'
assignees:
  - CodingAgent
---

# Task 7E.3: Define governance requirements (statuses, reviewer identity shape, bulk actions, retention) and document defaults.

Plan item (Phase 1 – Discovery) from `plans/phase-7e-jobs-and-governance-plan.md`: Define governance requirements (statuses, reviewer identity shape, bulk actions, retention) and document defaults.

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
- Governance v1 requirements (suggested edges):
  - Suggested edges are stored separately from real `edges` to keep visualization/query results clean until approved.
  - Minimal status model: `pending | approved | rejected`.
  - Reviewer metadata (portable minimum):
    - `reviewedBy: string | null` (consumer-defined identifier; e.g. user id or email)
    - `reviewedAt: timestamp | null`
    - Optional: `reviewReason: string | null` (useful for rejection/audit, can be added as a nullable column or stored in JSONB).
- Bulk actions:
  - List suggestions with filters: `status`, `minConfidence`, `relationshipType`, `scope` (when enabled), pagination.
  - Bulk approve/reject by `ids[]` (idempotent: approving an already-approved suggestion is a no-op).
  - Optional convenience bulk action: approve all above a confidence threshold (server-side filter).
- Retention defaults:
  - Default retention: keep `approved` and `rejected` suggestions (so UI can show audit/history) unless consumer opts into cleanup.
  - Future extension: TTL cleanup job or “delete resolved after N days” config.
- Idempotency / dedupe considerations:
  - Prefer deduping within a scope by `(from_node_id, to_node_id, relationship_type)` to avoid noisy duplicates from repeated runs.
  - Alternatively, allow duplicates per analysis run for auditability (more complex UI). v1 should pick one strategy in schema design (Task 7E.6).
