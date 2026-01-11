---
title: Define the scoping model (“scope” vs “workspaceId”) and enumerate which entities must be scoped (nodes, edges, clusters, analysis runs, settings, provenance tables).
status: completed
bucket: To-Do
priority: 1
labels:
  - 'Phase:7D-Production'
  - 'Type:Discovery'
assignees:
  - CodingAgent
---

# Task 7D.1: Define the scoping model (“scope” vs “workspaceId”) and enumerate which entities must be scoped (nodes, edges, clusters, analysis runs, settings, provenance tables).

Plan item (Phase 1 – Discovery) from `plans/phase-7d-production-hardening-plan.md`: Define the scoping model (“scope” vs “workspaceId”) and enumerate which entities must be scoped (nodes, edges, clusters, analysis runs, settings, provenance tables).

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
- Decision: use `scope` (string) with default `"default"` (not `workspaceId`) for portability and auth-provider neutrality.
- Entities scoped in v1: nodes, edges, clusters, cluster memberships, analysis runs, provenance tables, and settings (settings scoped by `settings.id = scope`).
- Design doc: `docs/phase-7d/scoping-schema.md`.
