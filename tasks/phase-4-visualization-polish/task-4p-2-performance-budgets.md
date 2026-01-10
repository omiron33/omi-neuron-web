---
title: Define visual targets and performance budgets
status: completed
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4p-1-visual-baseline-audit
---

# Task 4P.2: Visual Targets + Performance Budgets

## Objective
Set measurable targets for motion quality and frame performance by mode.

## Requirements
- Define FPS targets for normal/degraded/fallback modes.
- Define which effects are allowed in each mode.
- Specify acceptable node counts for each mode after polish.
- Document gating rules and default fallbacks.

## Deliverables
- `docs/visualization/performance-budgets.md` with targets and gating rules.
- Mode matrix for effects (animation, postprocessing, labels).

## Acceptance Criteria
- [ ] Each mode has a clear FPS target and node count range.
- [ ] Effect tiers are explicitly listed per mode.
- [ ] Default gating rules are documented for use in code.
