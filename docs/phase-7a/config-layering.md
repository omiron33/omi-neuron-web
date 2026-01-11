# Config Layering (Phase 7A.4 + 7A.9)

This document explains where configuration is currently ambiguous (server vs client) and defines a layered configuration model that keeps secrets server-only while preserving the existing `NeuronConfig` “single object” path for backward compatibility.

## Current state (where config is ambiguous)

### Single config type mixes concerns
- `src/core/types/settings.ts` defines `NeuronConfig` which includes:
  - OpenAI API key (`openai.apiKey`) — **server-only secret**
  - Database config (`database.*`) — generally **server-only**
  - API base path (`api.basePath`) — client-safe
  - Logging config (`logging.*`) — server
  - Visualization + analysis defaults — mostly client-safe (but used on server too)

This is workable for server-only wiring, but confusing for React usage because the same object contains secrets and client settings.

### React provider suggests browser secrets
- `src/react/NeuronWebProvider.tsx` is a client component (`'use client'`).
- Its props include `config.openaiApiKey?: string` and `config.databaseUrl?: string`.
  - These props are not required for the API client to work.
  - Their presence can encourage consumers to put secrets into client bundles.

### Inconsistent OpenAI key flow
- `EmbeddingsService` expects a key via config (`openaiApiKey`).
- `RelationshipEngine` currently reads `process.env.OPENAI_API_KEY`.
- API routes pass `config.openai.apiKey` but the relationship engine ignores it.

## Layered config model (proposed)

### 1) Server-only config (`NeuronServerConfig`)
Holds secrets and deployment-specific wiring:
- OpenAI / provider secrets (API keys, org IDs)
- Database config (postgres URL or docker settings)
- Logging settings
- Optional server-only knobs:
  - rate limit overrides
  - auth hooks (Phase 7D)

This config must never be required in the browser.

### 2) Client-safe config (`NeuronClientConfig`)
Holds values safe to ship to the browser:
- API base path (`/api/neuron`)
- Optional scope header configuration (Phase 7D)
- Visualization defaults / UI preferences
- Any “public” feature flags that are safe to expose

### 3) Compatibility config (`NeuronConfig`)
For backward compatibility, we keep `NeuronConfig` as a supported config shape:
- Treat it as **server-side config** in docs and templates.
- Allow deriving client-safe config from it when needed:
  - e.g. `client.api.basePath = server.api.basePath`

Phase 7A should avoid breaking:
- `defineNeuronConfig(config: NeuronConfig)` usage
- `createNeuronRoutes(config: NeuronConfig)` usage

## Proposed v1 type shapes (design)

These are intentionally small and can evolve without breaking the legacy `NeuronConfig` path.

### `NeuronServerConfig` (server-only)
Holds secrets and server wiring. Suggested shape:
- `settings?: Partial<NeuronSettings>` (default settings overrides)
- `database: DatabaseSettings` (connection + docker settings)
- `providers?: { embedding?: EmbeddingProvider; llm?: LLMProvider }` (advanced DI)
- `openai?: { apiKey: string; organization?: string }` (legacy-friendly default provider config)
- `api?: { basePath?: string }` (server needs it to mount routes)
- `logging?: LoggingSettings`

### `NeuronClientConfig` (client-safe)
Holds values safe to ship to the browser:
- `api: { basePath: string }`
- `settings?: Partial<NeuronSettings>` (UI defaults; no secrets)
- `scope?: string` or `scopeHeaderName?: string` (Phase 7D)

### Merging rules
When both are provided:
- `client.api.basePath` should default to `server.api.basePath` if not specified.
- `settings` should merge as:
  1) library defaults (`DEFAULT_*_SETTINGS`)
  2) server `settings` overrides
  3) client `settings` overrides (client wins for UI-only preferences)

### Validation points
- Validate `NeuronSettingsUpdate` via existing Zod schemas (`src/core/schemas/settings.ts`).
- Validate server config at build time (CLI/init templates) and at runtime (server-only module), but never require Zod in client bundles for secrets.

## Recommended Next.js pattern

### Server (route handlers)
- Load server config in a server-only module:
  - `neuron.server.ts` or `neuron.config.ts` (server import only)
- Construct providers + store inside route factories / server builders.
- Do not export server config from a file imported by client components.

### Client (React)
- `NeuronWebProvider` should only need:
  - `api.basePath`
  - optional UI defaults
- OpenAI keys are never used by the browser; calls that require OpenAI happen in server routes.

## Helper functions (Phase 7A implementation target)

Add layered config helpers under `src/config/`:
- `defineNeuronServerConfig(serverConfig)`
- `defineNeuronClientConfig(clientConfig)`
- `mergeNeuronConfig({ server, client? })` (optional; used internally)

These helpers should:
- be Zod-validated where possible
- make it difficult to accidentally pass secrets to the client

## Migration guidance (to be linked from docs)

For existing consumers that pass `openaiApiKey` into `NeuronWebProvider`:
- Keep the prop accepted for now, but mark as deprecated in docs.
- Recommend moving keys into server route config and only exposing `basePath` to client code.
