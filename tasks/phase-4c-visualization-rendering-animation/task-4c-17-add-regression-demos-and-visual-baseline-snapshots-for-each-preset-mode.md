---
title: Add regression demos and “visual baseline” snapshots for each preset/mode combination (normal/degraded/fallback).
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

# Task 4C.17: Add regression demos and “visual baseline” snapshots for each preset/mode combination (normal/degraded/fallback).

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Add regression demos and “visual baseline” snapshots for each preset/mode combination (normal/degraded/fallback).

## Objective
Add repeatable regression demos and baseline snapshots so rendering/animation changes don’t silently degrade the experience.

## Context / Touchpoints
- `docs/visualization/visual-baseline.md`
- `plans/phase-6-validation-plan.md`
- `tests/`

## Requirements
- [ ] Define how snapshots are captured (manual documented procedure or automated harness if consistent with existing validation strategy).
- [ ] Create a baseline set for each preset + performance mode combination (where applicable).
- [ ] Ensure demos cover core interactions (hover, click, focus, story playback).

## Deliverables
- Baseline checklist doc updates + any minimal harness notes/scripts needed.

## Acceptance Criteria
- [ ] Baseline procedure is documented and reproducible.
- [ ] At least one baseline is defined for each preset (minimal/subtle/cinematic).

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
