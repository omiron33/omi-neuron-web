# Migration Plan (Phase 7A.10)

This document describes what existing consumers do today and the recommended setup after Phase 7A introduces providers, `GraphStore`, and layered config.

Phase 7A is designed to be additive: existing code should continue to work, but the recommended pattern becomes more explicit and more secure.

## What consumers do today (baseline)

Common pattern (Next.js):
1) Run `omi-neuron init`
2) Edit `neuron.config.ts`:
   - set `openai.apiKey = process.env.OPENAI_API_KEY`
   - configure Postgres (docker or external)
3) Add a catch-all route:
   - `createNeuronRoutes(config)`
4) In client components:
   - wrap pages with `NeuronWebProvider`
   - sometimes pass `openaiApiKey` (risky) or `databaseUrl`

## Recommended pattern after Phase 7A

### 1) Keep secrets server-only
Move provider and database secrets into a server-only module:
- `neuron.server.ts` (server runtime only)

This module builds the server runtime:
- `store` (e.g. `PostgresGraphStore`)
- providers (e.g. OpenAI adapters)
- route handlers

### 2) Client only needs an API base path
Client components should only receive:
- `api.basePath` (and optionally UI defaults)

No OpenAI API keys in the browser.

### 3) Optional: swap providers/stores without forking
Advanced consumers can:
- inject a custom `EmbeddingProvider` (Azure OpenAI, local embeddings)
- inject a custom `LLMProvider` (different inference model/vendor)
- inject a different `GraphStore` backend (Phase 7B adds in-memory/file-backed)

## Compatibility notes (what remains supported)

The following remain supported for backward compatibility:
- `defineNeuronConfig(config: NeuronConfig)`
- `createNeuronRoutes(config: NeuronConfig)`
- `EmbeddingsService(config, db)` and `RelationshipEngine(db, config)` constructors
- existing route shapes and schemas

The following are **deprecated** (accepted for compatibility, but not recommended):
- `NeuronWebProviderProps.config.openaiApiKey` (client-side secret footgun)
- `NeuronWebProviderProps.config.databaseUrl` (server-only config)

## Step-by-step migration checklist

1) Update server-side config:
   - ensure OpenAI keys are only read from server env
2) Update route wiring:
   - use server builder or store/provider injection
3) Update client usage:
   - remove passing OpenAI keys to client components
4) Validate:
   - run `pnpm typecheck`, `pnpm test`
   - verify routes still respond as before
