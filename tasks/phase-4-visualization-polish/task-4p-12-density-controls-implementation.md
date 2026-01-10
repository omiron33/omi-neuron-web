---
title: Density controls and layout spacing
status: completed
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4p-7-density-strategy
  - task-4p-5-animation-config-schema
---

# Task 4P.12: Density Controls Implementation

## Objective
Reduce perceived node density and improve readability.

## Requirements
- Implement spacing/expansion options in layout utilities.
- Add declutter rules for labels and edges.
- Provide focus expansion when a node is selected.
- Expose new options in NeuronWeb props.

## Deliverables
- Updated layout helpers in `src/visualization/layouts`.
- New density config options in visualization types.

## Acceptance Criteria
- [ ] Spacing modes visibly reduce crowding on dense graphs.
- [ ] Labels/edges declutter when density is high.
- [ ] Focused nodes get extra breathing room.
