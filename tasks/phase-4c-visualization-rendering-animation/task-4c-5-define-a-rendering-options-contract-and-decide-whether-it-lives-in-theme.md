---
title: Define a rendering options contract (types + defaults) and decide whether it lives in `theme`, a new prop, or both.
status: pending
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
  - 'Initiative:4C-Rendering'
assignees:
  - CodingAgent
depends_on:
  - task-4c-4-confirm-required-compatibility-constraints
  - task-4p-2-performance-budgets
  - task-4p-3-animation-storyboard
---

# Task 4C.5: Define a rendering options contract (types + defaults) and decide whether it lives in `theme`, a new prop, or both.

Plan item (Phase 4C) from `plans/phase-4c-visualization-rendering-animation-plan.md`: Define a rendering options contract (types + defaults) and decide whether it lives in `theme`, a new prop, or both.

## Objective
Design the canonical rendering options contract (types + defaults) and decide its configuration home (theme vs prop vs both).

## Context / Touchpoints
- `src/visualization/types.ts`
- `src/visualization/themes/theme-engine.ts`
- `src/visualization/NeuronWeb.tsx`

## Requirements
- [ ] Decide the configuration shape and naming (recommended: `rendering?: RenderingOptions` on `NeuronWebProps`, plus theme defaults that it merges with).
- [ ] Define `RenderingOptions` sub-objects: `nodes`, `edges`, `labels`, `animations`, and `performance` (or similar).
- [ ] Define safe defaults (must be conservative; align with Phase 4B budgets).
- [ ] Define how `rendering` interacts with existing props: `theme`, `density`, `performanceMode`, `cameraFit`, and story beat playback.

## Deliverables
- Type additions in `src/visualization/types.ts` (exported).
- ThemeEngine/defaults updated to include rendering defaults (where appropriate).
- Documentation update plan (which docs files get the new API reference).

## Acceptance Criteria
- [ ] The contract includes explicit defaults and merging rules (theme defaults → prop overrides).
- [ ] No breaking changes: existing props still compile and behave the same when `rendering` is undefined.

## Validation Steps
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm test` (add/adjust tests as needed for new option contracts)

## Notes
- Updated by generator on 2026-01-10T16:19:29.529Z.
