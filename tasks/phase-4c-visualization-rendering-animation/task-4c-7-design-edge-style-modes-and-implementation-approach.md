---
title: Design edge style modes and implementation approach:
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

# Task 4C.7: Design edge style modes and implementation approach:

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Design edge style modes and implementation approach:

## Objective
Design edge style modes and pick the concrete implementation approach in Three.js that balances visuals and performance.

## Context / Touchpoints
- `src/visualization/scene/edge-renderer.ts`
- `docs/visualization/density-strategy.md`
- `docs/visualization/effects-pipeline.md`

## Requirements
- [ ] Define supported edge geometries: straight lines (existing), curved arcs (bezier), and optional bundling behaviors (if already present).
- [ ] Define arrowhead strategy (mesh arrows vs light-weight geometry) and how bidirectional edges are drawn.
- [ ] Define dash/flow strategy: dash offset animation or edge highlight pulses; specify gating rules by performance mode.
- [ ] Define how edge width/opacity map from `strength` and `confidence` (including clamp/scale).

## Deliverables
- `docs/visualization/edge-rendering-modes.md` with diagrams/notes, defaults, and performance gates.
- Proposed type surface: `EdgeStyleOptions` + per-edge resolver return shape.

## Acceptance Criteria
- [ ] Doc includes explicit recommended defaults for each mode (including which one is default).
- [ ] Doc includes a “degraded/fallback” behavior table for each feature (curves, arrows, dash/flow).

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
