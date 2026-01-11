# Phase 7D — Request Context (Scope + Auth + Observability)

This document defines the **portable request context** model used by `omi-neuron-web` API handlers and storage backends.

## Goals
- Provide **multi-tenant scoping** without changing consumer DB setup.
- Support **pluggable auth** (no vendor lock-in).
- Provide **request correlation** (request IDs) for debugging and observability.

## `RequestContext` (v1)
The server-side API layer derives a context per request and uses it for all reads/writes.

Recommended minimal fields:
- `requestId: string`
- `scope: string` (default: `"default"`)
- `user?: { id: string; email?: string; roles?: string[] } | null`
- `claims?: Record<string, unknown> | null` (optional extension)

Notes:
- `scope` is intentionally a string (not `workspaceId`) to keep the API portable and avoid implying a specific auth provider.
- `scope` is **not user-provided via request body**; it is derived from headers and/or consumer callbacks.

## Scope resolution precedence
1) Explicit header: `x-neuron-scope` (trimmed; empty is ignored)
2) Consumer callback: `resolveScope(request)`
3) Fallback: `"default"`

## Request ID
- Default header: `x-request-id`
- If absent, the server generates a random id (`crypto.randomUUID()`).
- The request id should be echoed back in responses via header `x-request-id` where feasible.

Runtime note:
- The built-in request id generation uses `node:crypto`, so server route handlers must run in a Node.js runtime (not an edge runtime) unless you provide `x-request-id` upstream.

## Propagation to storage
The context is converted to a storage-level context:
- `GraphStoreContext = { scope?: string }`

Rules:
- All GraphStore operations should treat `scope` as `"default"` when not provided.
- Reads must filter to the current scope.
- Writes must stamp the current scope.

## Where this is applied
- API route handlers use a wrapper (`withRequestContext`) to derive context once per request.
- The derived `scope` is passed to:
  - GraphStore methods (memory/file/postgres backends)
  - Repository/query builder methods (postgres backend)
