---
title: Design style mapping strategy:
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

# Task 4C.6: Design style mapping strategy:

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Design style mapping strategy:

## Objective
Design a style-mapping strategy that supports both simple static configuration and advanced per-node/per-edge logic without making the API unwieldy.

## Context / Touchpoints
- `src/visualization/scene/node-renderer.ts`
- `src/visualization/scene/edge-renderer.ts`
- `src/visualization/types.ts`

## Requirements
- [ ] Define “simple mode”: options like `nodeSize`, `edgeWidth`, and static color maps.
- [ ] Define “advanced mode”: resolver callbacks such as `getNodeStyle(node)` and `getEdgeStyle(edge)`.
- [ ] Define resolver return shapes (`NodeStyle`, `EdgeStyle`) with explicit allowed fields and clear precedence rules.
- [ ] Ensure deterministic behavior for tests and demos (resolvers should be pure and keyed on stable inputs).

## Deliverables
- `docs/visualization/style-mapping-contract.md` describing static options vs resolvers and precedence rules.
- Type definitions for `NodeStyle`, `EdgeStyle`, and resolver signatures in `src/visualization/types.ts`.

## Acceptance Criteria
- [ ] Resolver contracts are typed, exported, and documented with at least two examples (static and resolver-based).
- [ ] Precedence rules are explicit (preset defaults < theme < prop options < resolver override).

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
