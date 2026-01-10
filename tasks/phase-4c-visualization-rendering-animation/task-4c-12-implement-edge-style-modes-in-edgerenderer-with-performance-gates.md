---
title: Implement edge style modes (curves/width/arrowheads/flow) in EdgeRenderer with performance gates.
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

# Task 4C.12: Implement edge style modes (curves/width/arrowheads/flow) in EdgeRenderer with performance gates.

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Implement edge style modes (curves/width/arrowheads/flow) in EdgeRenderer with performance gates.

## Objective
Implement edge rendering depth: curves/width/arrowheads/flow options with strict performance gating and predictable defaults.

## Context / Touchpoints
- `src/visualization/scene/edge-renderer.ts`
- `src/visualization/types.ts`
- `src/visualization/themes/theme-engine.ts`
- `src/visualization/NeuronWeb.tsx`

## Requirements
- [ ] Add edge style options (static + resolver) and wire them through EdgeRenderer without changing default behavior when options are absent.
- [ ] Implement curved edge rendering option (bezier/arc) with configurable segmentation and gating rules.
- [ ] Implement arrowheads (or directional styling) for directed edges, and handle bidirectional edges explicitly.
- [ ] Implement a flow animation option (dash offset or highlight sweep) and ensure it is disabled in degraded/fallback by default.

## Deliverables
- Updated `src/visualization/scene/edge-renderer.ts` implementing edge style modes.
- Updated types exported from `src/visualization/types.ts`.
- Docs + demos for each edge mode (straight/curved/arrows/flow).

## Acceptance Criteria
- [ ] Default edge rendering remains unchanged when new options are undefined.
- [ ] Curved edges render correctly and remain selectable/pickable.
- [ ] Flow animation is gated and does not run in fallback mode.

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
