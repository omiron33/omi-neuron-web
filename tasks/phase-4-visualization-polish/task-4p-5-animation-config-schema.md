---
title: Extend visualization config for animations and effects
status: completed
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4p-2-performance-budgets
  - task-4p-3-animation-storyboard
---

# Task 4P.5: Animation + Effects Config Schema

## Objective
Add structured configuration for animation, density, and effects options.

## Requirements
- Extend visualization config types with animation toggles and timing controls.
- Add density controls (spacing, declutter modes, focus expansion).
- Add effects controls (bloom, vignette, background intensity).
- Ensure defaults align with performance budgets.

## Deliverables
- Updated types in `src/visualization/types.ts`.
- Theme defaults in `src/visualization/themes`.
- Public prop additions documented in `NeuronWebProps`.

## Acceptance Criteria
- [ ] New config fields are typed and exported.
- [ ] Defaults are safe and performance-aware.
- [ ] No breaking changes to existing props.
