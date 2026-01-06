---
title: Visualization layout fallback + exports patch release
status: completed
priority: 2
labels:
  - 'Phase:6-Validation'
  - 'Type:Visualization'
assignees:
  - CodingAgent
depends_on:
  - task-6-3-publishing
  - task-6-6-documentation
---

# Task 6.8: Visualization Layout + Exports Patch Release

## Objective
Improve NeuronWeb usability by adding a fuzzy layout fallback, exposing NeuronWeb from the root export, updating documentation, and publishing a patch release.

## Requirements
- Add a deterministic fuzzy 3D layout for nodes without positions.
- Keep existing explicit node positions unchanged.
- Export `NeuronWeb` from the package root (in addition to `/visualization`).
- Document the new layout options and correct scoped package import paths.
- Bump patch version and publish to npm.

## Deliverables
- Updated NeuronWeb component with layout fallback
- Layout types/helpers exported in visualization index
- Root index export for NeuronWeb
- Docs updated for scoped install + new props
- CHANGELOG entry + version bump

## Acceptance Criteria
- [ ] Nodes without positions render in a stable, fuzzy 3D layout
- [ ] `import { NeuronWeb } from '@omiron33/omi-neuron-web'` works
- [ ] Docs show scoped install + layout usage
- [ ] Package publishes as a new patch version
