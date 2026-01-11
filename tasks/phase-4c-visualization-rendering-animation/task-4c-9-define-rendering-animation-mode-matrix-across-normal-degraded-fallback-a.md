---
title: Define rendering/animation “mode matrix” across `normal`/`degraded`/`fallback` and document it.
status: completed
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

# Task 4C.9: Define rendering/animation “mode matrix” across `normal`/`degraded`/`fallback` and document it.

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Define rendering/animation “mode matrix” across `normal`/`degraded`/`fallback` and document it.

## Objective
Define and document the renderer “mode matrix” across performance modes so behavior is consistent and testable.

## Context / Touchpoints
- `docs/visualization/performance-budgets.md`
- `src/visualization/types.ts`
- `src/visualization/constants.ts`

## Requirements
- [ ] Create a matrix mapping `normal | degraded | fallback` to feature toggles and thresholds (labels, curves, arrows, edge flow, postprocessing, instancing).
- [ ] Define node-count thresholds for automatic gating in `auto` performance mode.
- [ ] Define override behavior: how explicit options interact with automatic gating (explicit should not force unsafe features by default).

## Deliverables
- Update `docs/visualization/performance-budgets.md` with a “Renderer + Animation Mode Matrix” section.

## Acceptance Criteria
- [ ] Matrix covers at least: labels, edge curves, edge flow/dash, selection animations, ambient motion, postprocessing.
- [ ] Matrix includes both default behavior and override semantics.

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
