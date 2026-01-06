---
title: Postprocessing effects and background polish
status: not_started
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4p-8-effects-pipeline-design
  - task-4p-5-animation-config-schema
---

# Task 4P.13: Postprocessing + Background Polish

## Objective
Add subtle postprocessing effects and atmospheric background details.

## Requirements
- Integrate EffectComposer with minimal effect chain.
- Add configurable bloom/vignette/grade settings.
- Improve background atmosphere (stars, gradients, subtle fog).
- Ensure effects can be disabled or gated per mode.

## Deliverables
- SceneManager updates for postprocessing pipeline.
- Theme defaults for effects and background.

## Acceptance Criteria
- [ ] Effects improve depth without overwhelming the scene.
- [ ] Effects toggle and gating work as documented.
- [ ] Background polish is visible and configurable.
