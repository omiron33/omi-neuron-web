# Backward-Compatibility Constraints (Phase 7A.3)

Phase 7A introduces provider and store abstractions. This document enumerates the public APIs that must remain stable and defines compatibility rules so we can refactor internals without breaking consumers.

## Compatibility goals
- No breaking changes to existing exports from `@omiron33/omi-neuron-web` or `@omiron33/omi-neuron-web/api`.
- Existing “easy path” remains functional:
  - `createNeuronRoutes(config)` continues to work.
  - `omi-neuron init` scaffolds a working baseline.
  - Analysis pipeline continues to run using OpenAI by default.
- New abstractions are additive, not replacing existing APIs abruptly.
- Any “security hardening” changes are documented and default-safe, but do not break compilation/runtime.

## Current public exports (baseline)

### Root package export surface
`src/index.ts` currently exports (non-exhaustive):
- Types + schemas + events (`src/core/types`, `src/core/schemas`, `src/core/events`)
- Analysis:
  - `DataProcessor`
  - `EmbeddingsService`
  - `ClusteringEngine`
  - `RelationshipEngine`
  - `ScoringEngine`
  - `AnalysisPipeline`
- Storage exports (`src/storage/*`)
- Config export (`defineNeuronConfig`)
- Visualization export (`NeuronWeb` and related prop/types)
- React hooks export (`src/react/hooks/*`)
- React provider export (`NeuronWebProvider`)

### API subpath export surface
`src/api/index.ts` currently exports:
- `createNeuronRoutes`
- repositories: `NodeRepository`, `EdgeRepository`, `ClusterRepository`, `SettingsRepository`, `AnalysisRunRepository`
- `GraphQueryBuilder`
- middleware exports
- API types (`src/core/types/api`)

## Compatibility rules (Phase 7A decision)

### 1) Existing exports remain exported
We will not remove or rename existing exports in Phase 7A.

Additive exports are allowed:
- New provider interfaces + adapters
- New `GraphStore` contract
- New pipeline composition APIs
- New layered config helpers

### 2) Keep existing constructors callable
Where possible, keep existing constructor signatures working exactly as they do today.

Guideline:
- Prefer adding **optional trailing parameters** or **new factory helpers** rather than changing required parameters.

Examples (expected refactors):
- `EmbeddingsService(config, db)` remains valid.
  - Provider injection can be added via optional param or new config field without breaking call sites.
- `RelationshipEngine(db, config)` remains valid.
  - Provider injection can be added similarly.
- `AnalysisPipeline(db, embeddings, clustering, relationships, events)` remains valid.
  - Internals can be re-implemented in terms of steps/builder, but the constructor stays.

### 3) Preserve `NeuronConfig` as a supported config shape
`NeuronConfig` is currently the “single config object” used for:
- API route factories
- CLI templates
- React provider defaults

Phase 7A will introduce layered config types (server vs client), but:
- `NeuronConfig` remains supported to avoid breaking `defineNeuronConfig(...)` usage.
- New layered helpers should be able to produce/derive a `NeuronConfig` for legacy entry points.

### 4) Document deprecations rather than enforcing them
Security guidance will change (server-only secrets), but we avoid breaking changes by:
- keeping legacy fields/props accepted
- adding JSDoc `@deprecated` (where applicable) and updating docs/templates
- avoiding runtime warnings unless they are opt-in (no noisy logs by default)

Candidate deprecations (docs-only in Phase 7A):
- `NeuronWebProviderProps.config.openaiApiKey` (client-side secret footgun)
- any example that implies putting OpenAI keys in the browser

### 5) Route shapes remain stable
Existing endpoints and payloads are treated as stable:
- `/nodes`, `/edges`, `/graph`, `/analyze`, `/settings`, `/search`
- request/response schemas in `src/core/schemas/*`

Phase 7A refactors should not alter route shapes. New endpoints (Phase 7E/7C) are additive.

### 6) ESM/CJS + bundling expectations remain unchanged
Avoid large dependency changes and keep new modules tree-shakeable:
- providers should be small leaf modules
- keep OpenAI adapters behind optional imports where feasible

## Explicit non-goals (to avoid accidental breaking changes)
- No renaming of package subpaths.
- No mandatory DI container.
- No forced migration away from Postgres in existing deployments.
- No change to TypeScript strictness or build outputs.

## Migration guidance approach (when something changes)
If behavior changes are unavoidable (e.g., security guidance), we:
- keep old behavior supported
- add a “recommended setup” doc section
- add a dedicated migration doc in Phase 7A.10/7A.21

