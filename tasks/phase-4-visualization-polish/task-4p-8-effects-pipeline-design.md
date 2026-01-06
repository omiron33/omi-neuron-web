---
title: Effects pipeline design and gating
status: not_started
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4p-2-performance-budgets
---

# Task 4P.8: Effects Pipeline Design

## Objective
Plan how postprocessing effects will be applied and gated.

## Requirements
- Identify minimal effects set (bloom, vignette, color grade).
- Define fallback and disabling logic per mode.
- Specify where EffectComposer lives in SceneManager.
- Document any new optional dependencies.

## Deliverables
- `docs/visualization/effects-pipeline.md` with pipeline diagram.
- Dependency list and gating rules.

## Acceptance Criteria
- [ ] Effects list is explicitly defined with defaults.
- [ ] Gating logic is mapped to performance modes.
- [ ] Integration points with SceneManager are clear.
