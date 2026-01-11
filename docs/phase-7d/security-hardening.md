# Phase 7D — Security Hardening Defaults

This document defines production-safe defaults and recommended configuration for `omi-neuron-web`.

## Principles
- Secrets are server-only (OpenAI API key, DB URLs).
- Default behavior should be safe (no accidental public exposure).
- Guardrails should be configurable and framework-agnostic.

## Checklist (production)
- [ ] Keep secrets server-only (`OPENAI_API_KEY`, `DATABASE_URL`, etc).
- [ ] Ensure API route handlers run in a Node.js runtime (needed for request id generation via `node:crypto`).
- [ ] Leave CORS disabled unless you explicitly need cross-origin browser access.
- [ ] If enabling CORS, use an allowlist of origins (never `*` for authenticated endpoints).
- [ ] Enable request body size limits for any JSON endpoints exposed to untrusted clients.
- [ ] Enable rate limiting for any endpoints exposed to untrusted clients.
- [ ] If using multi-tenant scopes, treat `x-neuron-scope` as untrusted input and enforce scope access in your auth hook.
- [ ] Echo and log request IDs (`x-request-id`) for correlation.
- [ ] Keep logging disabled by default in production unless you are intentionally emitting structured logs.

## Deployment notes
### Next.js
- If you use `createNeuronRoutes(...)` and the built-in request context middleware, ensure your route handler runs in Node.js:
  - `export const runtime = 'nodejs';`
- If you deploy behind a reverse proxy/load balancer, ensure `x-request-id` is forwarded (or let the server generate it).

### Multi-tenant scope safety
Multi-tenant scoping is an additive feature, but **it is not an authorization system**.

- If untrusted clients can call your API, you must validate scope access in `auth.authorize(request, context)`.
- A safe default is to derive the allowed scope from your session and reject any scope the user is not permitted to access.

## CORS
Default: **disabled**.

Recommendations:
- Enable CORS only when needed.
- Use an allowlist of origins (not `*`) for authenticated endpoints.
- Include only the headers you need (e.g. `Content-Type`, `x-neuron-scope`, `x-request-id`).

## Request body size limits
Default: conservative max body size for JSON endpoints (recommended: `1mb`).

Notes:
- Oversized payloads should return `413 Payload Too Large`.
- Apply early (before parsing JSON) where possible.

## Rate limiting
Default: no built-in hard limiter (portable hook points only).

Recommendations:
- Provide a middleware hook that can be backed by:
  - in-memory counters (dev)
  - Redis (prod)
  - edge KV (serverless)
- Default key strategy:
  - prefer `x-forwarded-for` / client IP when available
  - fallback to `requestId`

## Key handling
- Client code must never receive OpenAI API keys.
- Prefer server route handlers + environment variables.
- Keep `openai.apiKey` empty in client configs; enforce server-only use.

## Recommended configuration snippets
### Minimal single-tenant hardening (default scope)
This keeps existing single-tenant behavior while adding basic guardrails.

```ts
import { createNeuronRoutes } from '@omiron33/omi-neuron-web/api';

const routes = createNeuronRoutes(neuronConfig, {
  bodySizeLimit: { maxBytes: 1_000_000 },
});
```

### Multi-tenant with auth enforcement (recommended for untrusted clients)
Use `auth.authorize` to ensure the current user is allowed to access the resolved scope.

```ts
import { createNeuronRoutes } from '@omiron33/omi-neuron-web/api';

const routes = createNeuronRoutes(neuronConfig, {
  requestContext: {
    resolveUser: async (request) => {
      // derive user from cookies/session/JWT (consumer implementation)
      return null;
    },
  },
  auth: {
    authorize: async (request, context) => {
      // IMPORTANT: treat context.scope as untrusted unless you validate it against the user/session.
      return Boolean(context.user);
    },
  },
  bodySizeLimit: { maxBytes: 1_000_000 },
  rateLimit: {
    limiter: async (key, windowMs, max) => true,
  },
});
```
