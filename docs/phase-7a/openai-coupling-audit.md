# OpenAI Coupling Audit (Phase 7A.1)

This document audits where `omi-neuron-web` currently depends directly on OpenAI (SDK usage, prompt shapes, config flows) and lists the provider capabilities required to decouple those call sites behind stable interfaces.

Goal: enable pluggable `EmbeddingProvider` + `LLMProvider` without breaking existing public entry points.

## Summary

Today the library is “OpenAI-native” in three primary places:

1) **Embeddings generation** (core analysis + semantic search)
- Directly constructs an OpenAI client and calls `client.embeddings.create(...)`.
- Responsible for batching, retry/backoff, and basic RPM limiting.

2) **Relationship inference** (core analysis)
- Directly constructs an OpenAI client and calls `client.chat.completions.create(...)`.
- Uses a hard-coded prompt template and expects JSON output (`response_format: json_object`).
- Selects candidates via pgvector similarity queries.

3) **Configuration and wiring**
- `NeuronConfig.openai.apiKey` exists as a top-level config input.
- Some code uses `NeuronConfig.openai.apiKey`, other code uses `process.env.OPENAI_API_KEY`.
- `NeuronWebProvider` exposes an `openaiApiKey` option on the client, which can mislead consumers into putting secrets in the browser.

## Exact coupling points (code touchpoints)

### Embeddings
- `src/core/analysis/embeddings-service.ts`
  - Imports `openai` SDK and constructs `new OpenAI({ apiKey })`.
  - Calls:
    - `client.embeddings.create({ model, input, dimensions })` for single
    - `client.embeddings.create({ model, input: texts, dimensions })` for batch
  - Manages:
    - batch slicing (`config.batchSize`)
    - exponential retry (`config.maxRetries`)
    - naive RPM pacing (`60_000 / rateLimit`)
  - Persists embedding cache directly to Postgres:
    - reads/writes `nodes.embedding`, `nodes.embedding_model`, `nodes.embedding_generated_at`.

- `src/api/routes/search.ts`
  - Instantiates `EmbeddingsService` with `config.openai.apiKey` and uses it to embed the query string.

- `src/api/routes/analyze.ts`
  - Instantiates `EmbeddingsService` with `config.openai.apiKey` and uses it in the analysis pipeline.

- `src/cli/commands/analyze.ts`
  - Instantiates `EmbeddingsService` with `process.env.OPENAI_API_KEY`.

### Relationship inference (LLM)
- `src/core/analysis/relationship-engine.ts`
  - Imports `openai` SDK and constructs `new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })`.
  - Calls:
    - `client.chat.completions.create({ model, messages, response_format: { type: 'json_object' } })`
  - Uses a hard-coded prompt (`INFERENCE_PROMPT` string template).
  - Expects a JSON payload with fields:
    - `hasRelationship`, `relationshipType`, `confidence`, `reasoning`, `evidence[]`
  - Candidate selection is Postgres + pgvector specific:
    - SQL uses `embedding <=> (...)` cosine distance operator.

- `src/api/routes/analyze.ts`
  - Instantiates `RelationshipEngine` and provides inference settings.
  - Note: `RelationshipEngine` currently ignores `NeuronConfig.openai.apiKey` and reads env var instead.

- `src/cli/commands/analyze.ts`
  - Instantiates `RelationshipEngine` (which uses env var under the hood).

### Pipeline composition / wiring
- `src/core/analysis/pipeline.ts`
  - Pipeline is “hard-coded” to embeddings → clustering → relationships.
  - Constructor requires concrete implementations:
    - `EmbeddingsService`, `ClusteringEngine`, `RelationshipEngine`
  - Progress reporting exists but is simplistic:
    - emits only stage-level `100%` updates.
  - Job cancellation uses an `AbortController` map, but the abort signal is **not** propagated into embedding/LLM requests.

- `src/api/routes/analyze.ts`
  - Constructs pipeline per request; no DI boundary beyond this helper.

### Config flow + public surface areas
- `src/core/types/settings.ts`
  - `NeuronConfig.openai.apiKey` is a top-level config field.
  - `AnalysisSettings.openaiRateLimit` controls pacing.

- `src/react/NeuronWebProvider.tsx`
  - `NeuronWebProviderProps.config` includes:
    - `openaiApiKey?: string` (**browser-facing**, risky)
    - `databaseUrl?: string` (also generally server-side)
  - Provider is `'use client'` and stores the resolved config in React context.
  - The API client does not currently use the OpenAI key, but the presence of this prop can encourage unsafe usage.

- `src/cli/commands/init.ts`
  - Scaffolds `neuron.config.ts` with `openai.apiKey: process.env.OPENAI_API_KEY ?? ''`.
  - Scaffolds `.env.neuron.local` with `OPENAI_API_KEY=` and `DATABASE_URL=`.

## Impacted public API surfaces (what will need a compatibility plan)

### Exported classes that are OpenAI-coupled today
- `EmbeddingsService` (`src/core/analysis/embeddings-service.ts`)
- `RelationshipEngine` (`src/core/analysis/relationship-engine.ts`)
- `AnalysisPipeline` (`src/core/analysis/pipeline.ts`) (composition boundary)

### Configuration types and entry points
- `NeuronConfig` and `NeuronSettings` (`src/core/types/settings.ts`)
- `defineNeuronConfig` (`src/config/index.ts`)
- React provider config surface (`NeuronWebProviderProps` in `src/react/NeuronWebProvider.tsx`)
- CLI templates and docs that suggest where secrets live

### API layer wiring
- `createAnalyzeRoutes` and `createSearchRoutes` instantiate OpenAI-dependent services internally, so they must accept providers (or accept a store/server builder that carries providers).

## Provider capability requirements (derived from current usage)

### Embedding provider: minimum capability set
Required to preserve existing behavior:
- Generate a single embedding for one input string.
- Generate embeddings for a batch of input strings (order preserved).
- Allow selecting model + optional dimensions.
- Support request cancellation via `AbortSignal`.
- Surface errors in a consistent way:
  - authentication / missing key
  - rate limiting (retryable vs not)
  - transient network failures
  - provider-side validation errors

Optional-but-useful capabilities (used today or implied by current logic):
- Token counting / estimation:
  - currently `countTokens` is an approximation; a provider may supply better estimates.
- Cost estimation (for “dry run” / budget UX):
  - currently `estimateCost` is hard-coded by model.
- Provider metadata:
  - return the effective model name and token usage when available.

### LLM provider (relationship inference): minimum capability set
Required to preserve existing behavior:
- Submit a “chat” request with:
  - `model`
  - user prompt text (string)
  - response schema expectations (JSON object)
- Support `AbortSignal` cancellation.
- Return:
  - raw text content for parsing OR already-parsed JSON (preferred interface choice decided in Phase 7A.5).
- Consistent error taxonomy:
  - invalid output / parse failure
  - rate limit and retry handling
  - auth errors

Optional capabilities:
- Structured output mode (schema-guided JSON) where supported.
- Token usage reporting for governance/cost tracking.
- Safety limits:
  - max output tokens
  - max input length / truncation strategy

## Configuration layering requirements (derived from current risk areas)

To meet the Phase 7A outcome “secrets never required in the browser”:
- OpenAI API keys must live in **server-only config** (`NeuronServerConfig`).
- Client config should only include:
  - API base path
  - visualization defaults / UI choices
  - optional scope header configuration (Phase 7D)
- React provider should not accept OpenAI keys; it should accept only client-safe config and optionally an API client instance.

## Known issues (current state)
- `RelationshipEngine` reads `process.env.OPENAI_API_KEY` and ignores `NeuronConfig.openai.apiKey`.
  - This creates surprising behavior in server routes and CLI.
- Pipeline cancellation does not propagate to OpenAI calls (no `AbortSignal` passed).
- `NeuronWebProvider` exposes `openaiApiKey` in a client component (security footgun in docs/examples).

