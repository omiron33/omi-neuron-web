---
title: Hover card data contract
status: completed
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4p-3-animation-storyboard
---

# Task 4P.4: Hover Card Data Contract

## Objective
Define the data required for hover cards and how it maps to existing node types.

## Requirements
- Identify minimum fields (title, subtitle, summary, tags, metrics).
- Define truncation and fallback rules for missing data.
- Specify slot-based rendering hooks for custom content.
- Align with existing `NeuronNode` and `NeuronVisualNode` types.

## Deliverables
- `docs/visualization/hover-card-contract.md` with field requirements and examples.
- Proposed type additions for hover-card props.

## Acceptance Criteria
- [ ] Minimum field set is documented with fallback behavior.
- [ ] Slot strategy for custom content is defined.
- [ ] Contract maps cleanly to existing node types.
