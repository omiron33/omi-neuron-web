# Configuration

Recommended configuration is **layered**:
- `neuron.server.ts` contains server-only secrets (OpenAI + DB).
- `neuron.client.ts` contains client-safe config (API base path only).

For backward compatibility, `neuron.config.ts` (single combined config) is still supported, but you should treat it as **server-only**.

## Server-only config example (`neuron.server.ts`)

```ts
import {
  defineNeuronServerConfig,
  resolveNeuronConfig,
  DEFAULT_ANALYSIS_SETTINGS,
  DEFAULT_VISUALIZATION_SETTINGS,
} from '@omiron33/omi-neuron-web';

export const neuronServerConfig = defineNeuronServerConfig({
  settings: {
    instance: {
      name: 'My Graph',
      version: '0.1.1',
      repoName: 'my-graph',
    },
    visualization: DEFAULT_VISUALIZATION_SETTINGS,
    analysis: DEFAULT_ANALYSIS_SETTINGS,
    nodeTypes: [],
    domains: [],
    relationshipTypes: [],
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
  database: {
    mode: 'docker',
    port: 5433,
  },
  api: {
    basePath: '/api/neuron',
    enableCors: false,
    // Optional: request rate limit parameters (used by API middleware/hook points when enabled).
    rateLimit: { windowMs: 60_000, max: 60 },
  },
  logging: {
    level: 'info',
    prettyPrint: true,
  },
});

// Compatibility helper: derive the legacy NeuronConfig shape for route factories.
export const neuronConfig = resolveNeuronConfig(neuronServerConfig);
```

## Storage backends (local-first vs Postgres)

By default, `omi-neuron-web` uses Postgres (`storage` omitted).

For prototyping without Docker/Postgres, you can opt into local-first storage:
- `storage.mode = 'memory'` (non-persistent; dev/tests)
- `storage.mode = 'file'` (JSON persistence; small prototypes)

Example:

```ts
export const neuronServerConfig = defineNeuronServerConfig({
  // ...
  storage: {
    mode: 'file',
    filePath: '.neuron/graph.json',
    persistIntervalMs: 500,
  },
  database: {
    mode: 'external',
    port: 5433,
    url: process.env.DATABASE_URL,
  },
});
```

See `docs/local-first.md` for quickstart + migration guidance.

## Client-safe config example (`neuron.client.ts`)

```ts
import { defineNeuronClientConfig } from '@omiron33/omi-neuron-web';

export const neuronClientConfig = defineNeuronClientConfig({
  api: { basePath: '/api/neuron' },
});
```

## Multi-tenant scope (optional)

When running multi-tenant, the API layer can isolate data per scope using the `x-neuron-scope` header.

- Server: configure `createNeuronRoutes(neuronConfig, { requestContext: { resolveScope } })` or rely on the `x-neuron-scope` header.
- Client: set `scope` on `NeuronWebProvider` to send the header on API client requests.

## Environment Variables

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
