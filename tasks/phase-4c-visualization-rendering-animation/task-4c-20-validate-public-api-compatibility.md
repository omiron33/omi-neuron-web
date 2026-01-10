---
title: Validate public API compatibility:
status: pending
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
  - 'Initiative:4C-Rendering'
assignees:
  - CodingAgent
depends_on:
  - task-4c-16-add-expand-demo-scenes-and-docs-that-showcase-each-style-animation-mode
---

# Task 4C.20: Validate public API compatibility:

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Validate public API compatibility:

## Objective
Ensure public APIs remain stable and that new options are exported and documented cleanly.

## Context / Touchpoints
- `src/index.ts`
- `src/visualization/index.ts`
- `src/visualization/types.ts`
- `docs/component-props.md`

## Requirements
- [ ] Verify no breaking changes to existing `NeuronWebProps` usage and behavior when new options are not provided.
- [ ] Ensure any new types are exported from the correct entry points (`@omiron33/omi-neuron-web/visualization` and/or root exports as appropriate).
- [ ] Update docs to include the new options and provide a short migration note if anything is superseded.

## Deliverables
- Export updates + docs updates + compatibility notes.

## Acceptance Criteria
- [ ] Existing examples compile unchanged.
- [ ] New types are available from documented import paths.
- [ ] Docs include at least one “safe defaults” snippet and one “advanced override” snippet.

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
