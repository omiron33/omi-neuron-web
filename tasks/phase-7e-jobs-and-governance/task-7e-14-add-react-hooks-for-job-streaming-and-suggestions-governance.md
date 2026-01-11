---
title: Add React hooks for job streaming and suggestions governance.
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7E-Jobs'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7e-8-design-hook-apis-for-react-and-how-they-integrate-with-the-existing-even
  - task-7a-13-refactor-relationshipengine-to-depend-on-llmprovider-preserving-existing
---

# Task 7E.14: Add React hooks for job streaming and suggestions governance.

Plan item (Phase 3 – Implementation) from `plans/phase-7e-jobs-and-governance-plan.md`: Add React hooks for job streaming and suggestions governance.

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/core/analysis/pipeline.ts`
- `src/api/routes/analyze.ts`
- `src/core/types/events.ts`
- `src/core/events/event-bus.ts`
- `src/storage/migrations/004_analysis_runs.ts`
- `src/react/hooks/useNeuronAnalysis.ts`

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
- Implemented Phase 7E React hooks:
  - `useNeuronJobStream` (`src/react/hooks/useNeuronJobStream.ts`): subscribes to `analysis.job.*` via SSE with polling fallback.
    - Supports `transport: 'auto' | 'sse' | 'poll'`, `pollIntervalMs`, and `reconnect/stop` helpers.
    - Emits job events into the provider `EventBus` (`analysis.job.*`) for optional event-driven UI.
  - `useNeuronSuggestions` (`src/react/hooks/useNeuronSuggestions.ts`): list + approve/reject helpers for governance workflows.
    - Uses `api.suggestions.*` client methods and emits `edges.suggestion.approved/rejected` events.
  - Updated hook exports (`src/react/hooks/index.ts`).
- Improved SSE scope support:
  - `createAnalyzeRoutes` and `createSuggestionsRoutes` now default to resolving `scope` from `?scope=` when headers are unavailable (e.g. browser `EventSource`).
- Validation run on 2026-01-11:
  - `pnpm test` ✅
  - `pnpm typecheck` ✅
  - `pnpm lint` ✅ (warnings only: existing CLI console usage)
