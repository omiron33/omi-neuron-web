---
title: Define the “must-have” option set for v1 depth:
status: completed
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
  - 'Initiative:4C-Rendering'
assignees:
  - CodingAgent
---

# Task 4C.2: Define the “must-have” option set for v1 depth:

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Define the “must-have” option set for v1 depth:

## Objective
Define the exact v1 option surface for “rendering depth” so later implementation is deterministic and does not sprawl into endless knobs.

## Context / Touchpoints
- `src/visualization/types.ts`
- `docs/visualization/performance-budgets.md`
- `docs/visualization/density-strategy.md`
- `docs/visualization/hover-card-contract.md`

## Requirements
- [ ] Write a v1 “options catalog” that names each option, its type, default, and which modes it applies to (normal/degraded/fallback).
- [ ] Explicitly define which options are simple toggles vs advanced resolvers/callbacks.
- [ ] Define at least 3 presets (“minimal”, “subtle”, “cinematic”) and list what each preset enables/disables.
- [ ] Clarify what remains controlled by existing `theme` vs new “rendering options” container.

## Deliverables
- `docs/visualization/rendering-options-v1.md` describing the option set, presets, and defaults.

## Acceptance Criteria
- [ ] The options doc includes: node style options, edge style options, label options, animation options, and a preset matrix.
- [ ] Defaults are explicitly aligned to performance budgets (no “maxed out” defaults).

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
