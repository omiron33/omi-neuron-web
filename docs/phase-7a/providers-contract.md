# Providers Contract (Phase 7A)

This document defines the v1 provider contracts that decouple `omi-neuron-web` from OpenAI-specific SDK calls.

Goals:
- Support multiple embedding + LLM providers (OpenAI, Azure OpenAI, local, mock).
- Provide consistent cancellation semantics (`AbortSignal`).
- Provide consistent error taxonomy so retry/rate-limit logic can live in core services.
- Keep interfaces small and tree-shakeable.

## Design principles
- **Minimal required surface**: start with only what the library needs today.
- **Order-preserving batches**: callers rely on stable mapping between inputs and outputs.
- **Errors are typed**: core can decide retry/backoff without parsing provider-specific messages.
- **Providers are stateless** where possible: configuration is passed at construction time.

## Common types

### Provider metadata
Providers should identify themselves for logging/telemetry:
- `name` (e.g. `"openai"`, `"azure-openai"`, `"mock"`)
- optional `version` or `providerId`

### Error taxonomy
Providers must throw errors that can be categorized:

Recommended codes:
- `auth_error` — missing/invalid credentials (not retryable)
- `rate_limited` — provider refused due to rate limits (retryable; may include `retryAfterMs`)
- `invalid_request` — invalid inputs, model name, etc. (not retryable)
- `transient` — network/5xx/timeouts (retryable)
- `canceled` — request aborted via `AbortSignal` (not retryable)
- `unknown` — fallback category

Recommended error shape:
- `code` (one of the above)
- `status` (HTTP status code when available)
- `retryAfterMs` (optional; derived from headers where possible)
- `cause` (original error)

Note: The contracts below use “structural typing”. Implementations can extend `Error` with these fields.

## EmbeddingProvider (v1)

### Required capabilities
- Single and batch embedding generation
- Optional dimensions support
- Cancellation via `AbortSignal`

### Contract
Request:
- `input`: `string | string[]`
- `model`: string (required by caller; providers may enforce allowed values)
- `dimensions?`: number (optional; only supported by some providers/models)
- `signal?`: `AbortSignal`

Response:
- `embeddings`: `number[][]` (always an array; length matches input length)
- `model`: string (effective model used)
- `usage?`: token usage if available (provider-specific)

Behavior requirements:
- If `input` is a single string, `embeddings.length === 1`.
- Preserve input order.
- Throw a typed error on failure; for cancellation, throw `{ code: 'canceled' }`.

## LLMProvider (v1)

### Required capabilities
- Generate structured JSON output for relationship inference.
- Cancellation via `AbortSignal`.

### Contract
Request:
- `model`: string
- `prompt`: string
- `signal?`: `AbortSignal`
- `responseFormat`: `"json"` (v1 only; future variants may include `"text"`)

Response:
- `content`: string (raw response text, typically JSON)
- `model`: string (effective model used)
- `usage?`: token usage if available

Behavior requirements:
- When `responseFormat === 'json'`, providers should request structured JSON output when supported.
- Providers should not silently swallow invalid JSON; return raw content and let callers validate/parse.

## Optional helpers (v1)

These are optional contracts that improve UX but are not required for correctness.

### TokenCounter
Used for:
- cost estimation
- preflight checks and truncation heuristics

Contract:
- `countTokens(text: string, opts?: { model?: string }): number`

### CostEstimator
Used for:
- showing expected spend for batch jobs

Contract:
- `estimateEmbeddingCost(opts: { tokens: number; model: string }): { costUsd: number }`
- `estimateCompletionCost(opts: { inputTokens: number; outputTokens: number; model: string }): { costUsd: number }`

## Where these contracts plug in (Phase 7A implementation map)
- `EmbeddingsService` depends on `EmbeddingProvider` for embedding generation but retains retry/backoff and caching.
- `RelationshipEngine` depends on `LLMProvider` for inference, but retains candidate selection and edge/suggestion persistence.
- Tests can use mock providers that implement these contracts deterministically.

