---
title: Design animation profiles/presets:
status: pending
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
  - 'Initiative:4C-Rendering'
assignees:
  - CodingAgent
depends_on:
  - task-4c-4-confirm-required-compatibility-constraints
  - task-4p-2-performance-budgets
  - task-4p-3-animation-storyboard
---

# Task 4C.8: Design animation profiles/presets:

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Design animation profiles/presets:

## Objective
Design animation profiles/presets and define exactly what each enables/disables so the system remains predictable.

## Context / Touchpoints
- `src/visualization/animations/animation-controller.ts`
- `src/visualization/types.ts`
- `docs/visualization/animation-storyboard.md`

## Requirements
- [ ] Define profile names and semantics (recommended: `off`, `minimal`, `subtle`, `cinematic`).
- [ ] Define which animation features are controlled by the profile: hover scale, selection pulse/ripple, edge flow, camera tween, ambient motion, transition animations.
- [ ] Define a reduced-motion override policy: how `prefers-reduced-motion` affects each profile.
- [ ] Define duration/easing defaults per profile and per performance mode (normal/degraded).

## Deliverables
- `docs/visualization/animation-profiles.md` describing profiles, defaults, and reduced-motion behavior.
- Type additions in `src/visualization/types.ts` for `AnimationProfile` and `AnimationOptions`.

## Acceptance Criteria
- [ ] Profiles are documented with a clear “feature matrix” table.
- [ ] Reduced-motion behavior is explicitly defined (not left to interpretation).

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
