---
title: Add visual demos for explorer UX flows (search, filter, selection) and validate accessibility.
status: completed
bucket: To-Do
priority: 3
labels:
  - 'Phase:7F-Visualization'
  - 'Type:Validation'
assignees:
  - CodingAgent
depends_on:
  - task-7f-13-update-docs-and-add-demos-illustrating-explorer-usage-and-scalability-be
  - task-4p-17-docs-examples
---

# Task 7F.14: Add visual demos for explorer UX flows (search, filter, selection) and validate accessibility.

Plan item (Phase 4 – Validation) from `plans/phase-7f-visualization-ux-and-scale-plan.md`: Add visual demos for explorer UX flows (search, filter, selection) and validate accessibility.

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/visualization/NeuronWeb.tsx`
- `src/visualization/types.ts`
- `src/visualization/scene/*`
- `src/react/hooks/useNeuronGraph.ts`
- `src/react/hooks/useNeuronSearch.ts`
- `docs/visualization/*`

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
- Explorer UX demo added in `examples/basic-usage/app/explorer/page.tsx` covering:
  - search (label/slug substring)
  - domain filter + relationship type filter
  - selection panel
- Basic accessibility notes: inputs/selects have `aria-label` and checkboxes are wrapped with visible labels.
