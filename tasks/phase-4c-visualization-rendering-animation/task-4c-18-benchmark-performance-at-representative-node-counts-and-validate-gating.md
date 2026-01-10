---
title: Benchmark performance at representative node counts and validate gating behavior matches budgets.
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

# Task 4C.18: Benchmark performance at representative node counts and validate gating behavior matches budgets.

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Benchmark performance at representative node counts and validate gating behavior matches budgets.

## Objective
Benchmark and tune performance so richer rendering remains within budgets and degrades correctly as graphs grow.

## Context / Touchpoints
- `docs/visualization/performance-budgets.md`
- `src/visualization/constants.ts`

## Requirements
- [ ] Benchmark representative node counts (as defined in budgets) and record results per mode.
- [ ] Tune thresholds and gating rules based on measured hotspots.
- [ ] Ensure the `auto` performance mode selects sane defaults based on node count and pixel ratio.

## Deliverables
- Updated budgets doc and any necessary gating constant updates (with rationale).

## Acceptance Criteria
- [ ] Gating behavior matches the documented budgets for normal/degraded/fallback.
- [ ] No new feature remains “always on” when it exceeds the node-count threshold.

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
