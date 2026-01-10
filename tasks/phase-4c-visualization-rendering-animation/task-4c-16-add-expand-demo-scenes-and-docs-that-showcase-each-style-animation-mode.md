---
title: Add/expand demo scenes and docs that showcase each style/animation mode and how to configure them.
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

# Task 4C.16: Add/expand demo scenes and docs that showcase each style/animation mode and how to configure them.

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Add/expand demo scenes and docs that showcase each style/animation mode and how to configure them.

## Objective
Provide demonstrations and docs that make rendering/animation options easy to adopt without reading source code.

## Context / Touchpoints
- `docs/visualization/`
- `docs/component-props.md`
- `examples/`

## Requirements
- [ ] Add at least 3 demo configurations: minimal, subtle, cinematic, each showing node/edge/label/animation differences.
- [ ] Document one advanced customization example using resolvers.
- [ ] Include performance guidance in demos (which modes disable which features).

## Deliverables
- Docs and/or example updates that provide copy/paste presets and one resolver example.

## Acceptance Criteria
- [ ] Each preset has a copy/paste-able snippet and a screenshot reference target.
- [ ] Advanced example is deterministic and safe (no random behavior without explicit seed).

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
