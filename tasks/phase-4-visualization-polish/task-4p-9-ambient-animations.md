---
title: Ambient node motion and edge flow animations
status: completed
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4p-5-animation-config-schema
---

# Task 4P.9: Ambient Animations

## Objective
Add subtle ambient motion so the graph feels alive.

## Requirements
- Implement node float/pulse animations with configurable amplitude.
- Add edge flow animation for active/hovered states.
- Ensure animations are gated by performance mode and global toggle.
- Integrate with AnimationController update loop.

## Deliverables
- New ambient animation utilities in `src/visualization/animations`.
- Node/edge renderer hooks for animated states.

## Acceptance Criteria
- [ ] Nodes exhibit subtle motion in normal mode.
- [ ] Edge flow activates on hover/selection.
- [ ] Animations disable cleanly in degraded/fallback modes.
