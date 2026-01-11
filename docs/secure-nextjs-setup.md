# Secure Next.js Setup

Goal: use `omi-neuron-web` in a Next.js app **without putting secrets in the browser**.

## Key rule
- `OPENAI_API_KEY` and database connection strings are **server-only**.
- Client components should only know the API base path (e.g. `/api/neuron`).

## Recommended file layout

At the project root:
- `neuron.server.ts` (server-only config; reads env vars)
- `neuron.client.ts` (client-safe config; base path only)

In your Next.js app directory:
- `app/api/neuron/[...path]/route.ts` (dispatches to the library route handlers)

## Example: `neuron.server.ts`

```ts
import { defineNeuronServerConfig, resolveNeuronConfig } from '@omiron33/omi-neuron-web';

export const neuronServerConfig = defineNeuronServerConfig({
  openai: { apiKey: process.env.OPENAI_API_KEY ?? '' },
  database: { mode: 'external', port: 5433, url: process.env.DATABASE_URL },
  api: { basePath: '/api/neuron' },
});

export const neuronConfig = resolveNeuronConfig(neuronServerConfig);
```

## Example: `neuron.client.ts`

```ts
import { defineNeuronClientConfig } from '@omiron33/omi-neuron-web';

export const neuronClientConfig = defineNeuronClientConfig({
  api: { basePath: '/api/neuron' },
});
```

## Example: `app/api/neuron/[...path]/route.ts`

```ts
import { createNeuronRoutes, withNeuronMiddleware } from '@omiron33/omi-neuron-web/api';
import { neuronConfig } from '../../../../neuron.server';

// Required when using the built-in request-id generation (uses node:crypto).
export const runtime = 'nodejs';

const routes = createNeuronRoutes(neuronConfig, {
  requestContext: {
    // Optional: derive scope/user from cookies/session.
    // resolveScope: async (request) => null,
    // resolveUser: async (request) => null,
  },
  // Optional: protect routes with a portable auth hook.
  // Note: If clients are untrusted, validate `context.scope` here before allowing access.
  // auth: { authorize: async (request, context) => true },
  bodySizeLimit: { maxBytes: 1_000_000 },
  // Optional: provide a rate limiter (Redis/KV/in-memory).
  // rateLimit: { limiter: async (key, windowMs, max) => true },
});

type RouteContext = { params: { path?: string[] } };

const notFound = () => new Response('Not found', { status: 404 });
const methodNotAllowed = () => new Response('Method not allowed', { status: 405 });

async function dispatch(request: Request, context: RouteContext) {
  const segments = context.params.path ?? [];
  const resource = segments[0] ?? 'health';

  switch (resource) {
    case 'nodes':
      if (request.method === 'GET') return routes.nodes.GET(request);
      if (request.method === 'POST') return routes.nodes.POST(request);
      if (request.method === 'PATCH') return routes.nodes.PATCH(request);
      if (request.method === 'DELETE') return routes.nodes.DELETE(request);
      return methodNotAllowed();
    case 'edges':
      if (request.method === 'GET') return routes.edges.GET(request);
      if (request.method === 'POST') return routes.edges.POST(request);
      if (request.method === 'PATCH') return routes.edges.PATCH(request);
      if (request.method === 'DELETE') return routes.edges.DELETE(request);
      return methodNotAllowed();
    case 'graph':
      if (request.method === 'GET') return routes.graph.GET(request);
      if (request.method === 'POST') return routes.graph.POST(request);
      return methodNotAllowed();
    case 'analyze':
      if (request.method === 'GET') return routes.analyze.GET(request);
      if (request.method === 'POST') return routes.analyze.POST(request);
      return methodNotAllowed();
    case 'settings':
      if (request.method === 'GET') return routes.settings.GET(request);
      if (request.method === 'PATCH') return routes.settings.PATCH(request);
      if (request.method === 'POST') return routes.settings.POST(request);
      return methodNotAllowed();
    case 'search':
      if (request.method === 'POST') return routes.search.POST(request);
      return methodNotAllowed();
    case 'health':
      if (request.method === 'GET') return routes.health.GET();
      return methodNotAllowed();
    default:
      return notFound();
  }
}

export async function GET(request: Request, context: RouteContext) {
  return withNeuronMiddleware((req) => dispatch(req, context), {
    // CORS is disabled by default. If you enable it, pass an explicit allowlist.
    // cors: { origins: ['https://your-app.com'] },

    // Logging is disabled by default. Provide a logger to enable it.
    // logging: { enabled: process.env.NODE_ENV !== 'production', logger: console },
  })(request);
}
export async function POST(request: Request, context: RouteContext) {
  return withNeuronMiddleware((req) => dispatch(req, context), {})(request);
}
export async function PATCH(request: Request, context: RouteContext) {
  return withNeuronMiddleware((req) => dispatch(req, context), {})(request);
}
export async function DELETE(request: Request, context: RouteContext) {
  return withNeuronMiddleware((req) => dispatch(req, context), {})(request);
}
```

## Client usage

```tsx
import { NeuronWebProvider } from '@omiron33/omi-neuron-web';
import { neuronClientConfig } from '../neuron.client';

export function Providers({ children }: { children: React.ReactNode }) {
  return <NeuronWebProvider config={{ apiBasePath: neuronClientConfig.api.basePath }}>{children}</NeuronWebProvider>;
}
```
