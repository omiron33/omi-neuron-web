---
title: Hover card system design
status: not_started
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4p-4-hover-card-data-contract
---

# Task 4P.6: Hover Card System Design

## Objective
Design the hover card overlay system, layout, and event flow.

## Requirements
- Define anchoring rules (screen-space clamp, offset, arrow/pin).
- Define hover hysteresis to prevent flicker.
- Specify z-ordering relative to NodeDetailPanel.
- Document interaction flow with InteractionManager.

## Deliverables
- `docs/visualization/hover-card-design.md` with interaction flow.
- Component structure proposal and event sequence diagram.

## Acceptance Criteria
- [ ] Hover card behavior is specified for hover-in/out.
- [ ] Pointer safety rules prevent jitter and overlap.
- [ ] Integration points with InteractionManager are defined.
