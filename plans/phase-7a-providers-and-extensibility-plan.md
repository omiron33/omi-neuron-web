# Phase 7A: Providers + Extensibility Plan

## Outcomes
- Consumers can swap embedding + LLM providers (OpenAI, Azure OpenAI, local, mock) without forking core code.
- Analysis pipeline supports pluggable steps (add/remove/replace) while keeping a safe default “full analysis” behavior.
- Storage + API layers can operate against a portable `GraphStore` contract (Postgres remains default).
- Configuration is explicitly layered into **server-only secrets** vs **client-safe settings**, reducing security confusion.
- Existing public entry points remain stable (no breaking changes), with a clear migration path where needed.

## Scope

### In scope
- Provider interfaces:
  - `EmbeddingProvider` (vector generation)
  - `LLMProvider` (relationship inference, labeling)
  - Optional `TokenCounter` / `CostEstimator` contracts (for batching + safety)
- Default provider adapters:
  - OpenAI embedding provider
  - OpenAI chat provider (for relationship inference)
  - Mock providers for testing
- `GraphStore` contract (portable interface) + Postgres-backed adapter (wrapping existing repositories)
- `AnalysisStep` contract + pipeline composition utilities (step registry / builder)
- Config layering types + helpers (server-only config vs client-safe settings)
- CLI template updates to generate correct, safe config wiring (server routes handle secrets)
- Docs: provider usage, security guidance, migration notes

#### Planned module layout (proposed, non-binding until Phase 2 design)
- `src/core/providers/`
  - `embedding-provider.ts` (interface + types)
  - `llm-provider.ts` (interface + types)
  - `openai/` (OpenAI adapters)
  - `testing/` (mock providers for tests)
  - `index.ts` (exports)
- `src/core/store/`
  - `graph-store.ts` (portable store contract)
  - `postgres-graph-store.ts` (adapter that composes existing repositories)
  - `index.ts` (exports)
- `src/core/analysis/steps/`
  - `analysis-step.ts` (step contract)
  - `default-steps.ts` (default composition)
  - `index.ts` (exports)
- `src/config/`
  - `server.ts` / `client.ts` (layered config helpers)

#### API surface targets (v1)
- Provider contracts should minimally support:
  - embedding single + batch inputs
  - request cancellation (AbortSignal-friendly)
  - consistent error surfaces (rate limit, auth, transient, fatal)
- `GraphStore` should minimally support:
  - nodes + edges CRUD
  - graph query (`getGraph`, `expandGraph`, `findPath`)
  - search (`semanticSearch`, `findSimilar`)
  - settings get/update/reset
  - analysis jobs (create/list/get/cancel) or a clean delegation to the existing pipeline runner

### Out of scope
- Shipping provider adapters for every vendor (Anthropic/OpenRouter/etc.) in-core (can be follow-up adapters once interfaces exist).
- Replacing the existing Postgres repository implementation (we wrap it; we don’t rewrite it).
- A full “workflow engine” (queue workers, cron orchestration). Phase 7E covers job orchestration.
- Breaking API changes to existing route shapes.

## Assumptions & Constraints
- The library remains Next.js-friendly and Fetch-native (`Request`/`Response` handlers).
- OpenAI stays the default provider to preserve current behavior.
- Avoid heavy new dependencies; keep adapters small and tree-shakeable.
- Secrets must never be required in the browser; examples must model server-only usage.
- Any new abstractions must preserve the current “easy path” (no forcing users to understand DI frameworks).

## Dependencies
- Existing analysis engine (`src/core/analysis/*`) for refactors.
- Existing config system (`src/config/*`) and schemas (`src/core/schemas/settings.ts`).
- Existing storage layer (`src/storage/*`) and repositories (`src/api/repositories/*`).
- Existing React provider (`src/react/NeuronWebProvider.tsx`) for config layering alignment.
- CLI scaffolding (`src/cli/*`) for updated templates.
  - Key touchpoints expected: `src/cli/commands/init.ts`, `src/cli/utils/templates.ts`

## Execution Phases

### Phase 1 – Discovery 🟥
- [ ] Audit current OpenAI coupling points (embeddings + relationship inference + config key flow) and document all required provider capabilities.
- [ ] Inventory current pipeline composition points (what is hard-coded vs configurable) and map desired extension seams.
- [ ] Define backward-compatibility constraints for public APIs (exports, constructors, config fields) and decide what gets deprecated vs preserved.
- [ ] Identify where configuration is currently ambiguous (server vs client) and define an explicit layered config model.

### Phase 2 – Design/Architecture 🟥
Design artifacts to produce in this phase (recommended):
- `docs/phase-7a/providers-contract.md` (interfaces, error semantics, cancellation)
- `docs/phase-7a/graphstore-contract.md` (methods, paging, filters, scope hooks)
- `docs/phase-7a/pipeline-steps-contract.md` (step API, progress, cancellation)
- `docs/phase-7a/config-layering.md` (server/client config, Next.js patterns)

- [ ] Define provider contracts (`EmbeddingProvider`, `LLMProvider`, optional token/cost helpers) and decide method signatures + error semantics.
- [ ] Design `GraphStore` interface to cover the minimal CRUD + graph/query needs (nodes/edges/clusters/settings/search) used by API + analysis.
- [ ] Design `AnalysisStep` contract and pipeline composition API (step ordering, dependencies, progress callbacks, cancellation).
- [ ] Design a `NeuronServer` (or equivalent) builder that wires store + providers + pipeline + routes with minimal ceremony.
- [ ] Define config layering types:
  - `NeuronServerConfig` (secrets + DB)
  - `NeuronClientConfig` (API basePath + UI defaults)
  - merging rules and validation points
- [ ] Define “migration plan” docs: what existing consumers do today vs the recommended setup after Phase 7A.

### Phase 3 – Implementation 🟥
- [ ] Add provider interfaces + baseline implementations (OpenAI adapters + mock providers) under a new `src/core/providers/*` module.
- [ ] Refactor `EmbeddingsService` to depend on `EmbeddingProvider` (and optional token/cost helpers), preserving existing behavior and batching/rate-limits.
- [ ] Refactor `RelationshipEngine` to depend on `LLMProvider` (and optional safety constraints), preserving existing inference behavior.
- [ ] Introduce `GraphStore` and implement `PostgresGraphStore` by composing existing repositories/query builder.
- [ ] Introduce `AnalysisStep` + pipeline builder utilities and refactor `AnalysisPipeline` to use step composition.
- [ ] Add layered config helpers (server/client) and update `NeuronWebProvider` patterns to avoid implying browser secrets.
- [ ] Update CLI templates (`omi-neuron init`) to scaffold:
  - safe server-side OpenAI usage in Next.js routes
  - client-side provider config that only points to API routes
- [ ] Update exports (`src/index.ts`, `src/api/index.ts`) to expose new interfaces in a stable way.

### Phase 4 – Validation 🟥
- [ ] Add unit tests for provider adapters and contract conformance (mock provider, error mapping, retries).
- [ ] Add integration tests for pipeline composition (step ordering, cancellation, progress events, provider injection).
- [ ] Verify backward compatibility (typecheck + example builds) and document any intentional deprecations.
- [ ] Update docs: provider guide, config layering guide, and “secure Next.js setup” reference snippets.

## Risks & Mitigations
- Breaking changes to constructors/config → Preserve existing exports; add new APIs alongside; document migration path; add deprecation warnings only in docs.
- Over-abstracting makes onboarding harder → Keep the “default path” identical; abstractions are optional entry points.
- Provider interfaces too narrow/wide → Start with minimal set; add extension points via optional fields and capability checks.
- Confusion about server/client secrets → Provide explicit layered config types and examples; document “do not put API keys in the browser.”

## Open Questions
- Should provider interfaces be “capabilities-based” (feature detection) or strict minimal contracts?
- Should `GraphStore` include full “query builder” style methods, or only CRUD + a small set of graph/search primitives?
- Do we want to keep current constructors as-is and add new factory helpers, or introduce new constructors and mark old ones as legacy?

## Task Backlog
- Add official adapters: Azure OpenAI, OpenRouter, Anthropic (after interfaces stabilize).
- Add a “no-AI mode” provider that disables embeddings/inference but keeps CRUD + visualization.

## Parallel / Unblock Options
- Provider interface design can proceed in parallel with config layering design.
- `GraphStore` design can proceed in parallel with `AnalysisStep` design.
- CLI template updates can proceed once config layering decisions are made.
