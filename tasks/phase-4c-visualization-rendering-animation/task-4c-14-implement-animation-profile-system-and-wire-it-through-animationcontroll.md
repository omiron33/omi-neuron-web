---
title: Implement animation profile system and wire it through AnimationController/ThemeEngine.
status: pending
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
  - 'Initiative:4C-Rendering'
assignees:
  - CodingAgent
depends_on:
  - task-4c-10-plan-api-docs-and-examples-structure
  - task-4p-2-performance-budgets
  - task-4p-3-animation-storyboard
---

# Task 4C.14: Implement animation profile system and wire it through AnimationController/ThemeEngine.

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Implement animation profile system and wire it through AnimationController/ThemeEngine.

## Objective
Implement animation profile presets and wire them through the existing animation subsystems so behavior is consistent and configurable.

## Context / Touchpoints
- `src/visualization/animations/animation-controller.ts`
- `src/visualization/NeuronWeb.tsx`
- `src/visualization/types.ts`
- `src/visualization/constants.ts`

## Requirements
- [ ] Introduce `AnimationProfile` and `AnimationOptions` (or equivalent) with safe defaults.
- [ ] Wire profile selection to: hover scale, selection pulse/ripple, edge flow, camera tween, ambient motion, transition animations.
- [ ] Respect reduced-motion and add a single global override that disables animation where appropriate.
- [ ] Ensure animations remain time-bounded and cancelable (avoid runaway RAF work).

## Deliverables
- Updated animation controller logic implementing profile selection + docs updates.

## Acceptance Criteria
- [ ] Switching profiles produces predictable differences (validated in demos).
- [ ] Reduced-motion disables non-essential motion even when profile is cinematic.

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
