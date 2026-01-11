---
title: Implement edge declutter options (threshold/fade, and optional bundling strategy if feasible without heavy deps).
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7F-Visualization'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7f-7-design-story-tooling-improvements
  - task-4p-17-docs-examples
---

# Task 7F.10: Implement edge declutter options (threshold/fade, and optional bundling strategy if feasible without heavy deps).

Plan item (Phase 3 – Implementation) from `plans/phase-7f-visualization-ux-and-scale-plan.md`: Implement edge declutter options (threshold/fade, and optional bundling strategy if feasible without heavy deps).

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/visualization/NeuronWeb.tsx`
- `src/visualization/types.ts`
- `src/visualization/scene/*`
- `src/react/hooks/useNeuronGraph.ts`
- `src/react/hooks/useNeuronSearch.ts`
- `docs/visualization/*`

### Requirements
- [ ] Identify the exact code touchpoints and public API surfaces impacted by this change.
- [ ] Produce the required artifact(s) (code, docs, schema, or tests) to complete the plan item without introducing breaking changes.
- [ ] Update exports/index files where needed so new APIs are available from intended entry points.
- [ ] Add or update tests appropriate for the phase (contracts for design, unit/integration for implementation).

### Acceptance Criteria
- [ ] The plan item intent is fully satisfied (no partial implementation).
- [ ] TypeScript typecheck passes (`pnpm typecheck`).
- [ ] Lint passes for touched areas (`pnpm lint`).
- [ ] Tests pass (`pnpm test`) or new tests are added where gaps exist.
- [ ] Docs/examples updated if developer-facing behavior changed.

## Notes
- Created by generator on 2026-01-10T15:59:28.230Z.
- Edge declutter is implemented via existing density knobs:
  - `density.minEdgeStrength` (threshold) → `EdgeRenderer` minStrength
  - `density.edgeFade` (non-focus fade) → `EdgeRenderer` focusFadeOpacity
- Clamped `density.edgeFade` and `density.minEdgeStrength` into `[0..1]` in `src/visualization/NeuronWeb.tsx` for more predictable behavior.
- Edge bundling remains out-of-scope for v1; no heavy deps added.
