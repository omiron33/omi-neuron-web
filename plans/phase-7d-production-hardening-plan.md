# Phase 7D: Production Hardening (Auth + Multi-tenancy + Security + Observability) Plan

## Outcomes
- Consumers can safely run `omi-neuron-web` in production environments with:
  - explicit tenant/workspace scoping
  - pluggable auth integration
  - predictable rate limiting and request validation
  - consistent structured logging and request correlation
- Multi-tenancy is supported as an additive feature (defaults to single-tenant “default” scope).
- Security guidance is explicit: server-only secrets, safe CORS, safe payload limits.

## Scope

### In scope
- Tenant/workspace scoping model (additive):
  - introduce a `scope` key (string) on stored entities via new columns and filtering
  - default scope = `"default"`
- Request context plumbing:
  - middleware to extract scope/auth context from headers/cookies/session
  - pass context into repositories/query builder
- Auth integration points (no vendor lock-in):
  - `authorize(request, context)` hook
  - optional `resolveScope(request)` hook
- API hardening:
  - request size limits
  - improved rate limiting hooks
  - secure defaults for CORS
- Observability:
  - request IDs / correlation IDs
  - structured logs around route handlers and DB queries
  - consistent error shapes
- Docs: security + production deployment guidance

#### Scoping model (v1 target)
- Introduce a single scoping key: `scope` (string).
- Default scope: `"default"`.
- Storage-level enforcement: repositories/query builder must filter by `scope` for all read/write operations where scoping applies.

Proposed scope sources (exact precedence finalized in Phase 2 design):
1) Explicit request header (e.g. `x-neuron-scope`)
2) Derived from auth/session (consumer-provided callback)
3) Fallback to `"default"`

#### Middleware building blocks (proposed)
- `withRequestContext(handler, { resolveScope?, resolveUser?, requestIdHeader? })`
- `withAuthGuard(handler, { authorize })`
- `withScopeGuard(handler, { allowScopes? | authorizeScope? })`
- `withBodySizeLimit(handler, { maxBytes })`
- `withRateLimit(handler, { windowMs, max, keyFn })`

### Out of scope
- Bundled authentication UI (NextAuth screens, etc.).
- Row Level Security (RLS) configuration (can be a follow-up for advanced setups).
- Real-time collaboration/presence (Phase 7E/7F territory if ever needed).

## Assumptions & Constraints
- Scope is additive and defaults to `"default"` so existing installs remain functional.
- The API layer should remain portable: Fetch-native handlers, minimal framework-specific assumptions.
- Hardening must not significantly degrade developer experience.

## Dependencies
- Storage migrations system (`src/storage/migrations/*`) for adding scope columns.
- Repositories and query builder (`src/api/repositories/*`, `src/api/query-builder.ts`) for scope filtering.
- Middleware system (`src/api/middleware/*`) for context extraction and guardrails.
- React API client should be able to pass scope headers optionally.

## Execution Phases

### Phase 1 – Discovery 🟥
- [x] Define the scoping model (“scope” vs “workspaceId”) and enumerate which entities must be scoped (nodes, edges, clusters, analysis runs, settings, provenance tables).
- [x] Audit current middleware and route factory patterns to identify where request context can be introduced cleanly.
- [x] Define security baseline requirements (CORS, payload sizes, rate limits, key handling) and document recommended defaults.

### Phase 2 – Design/Architecture 🟥
Design artifacts to produce in this phase (recommended):
- `docs/phase-7d/request-context.md` (context fields, propagation rules)
- `docs/phase-7d/scoping-schema.md` (tables/columns/indexes, migration/backfill plan)
- `docs/phase-7d/security-hardening.md` (CORS, size limits, rate limits, secrets guidance)
- `docs/phase-7d/observability.md` (request IDs, logging conventions, error metadata)

- [x] Design a `RequestContext` type and how it flows through routes → repositories → store:
  - scope identifier
  - optional user identity
  - optional permissions claims
- [x] Design DB schema changes for scoping:
  - new `scope` columns with defaults
  - indexes to keep scoped queries fast
  - migration strategy for existing data
- [x] Design middleware APIs:
  - `withRequestContext(handler, options)`
  - `withAuthGuard(handler, options)`
  - `withScopeGuard(handler, options)`
- [x] Design client behavior:
  - how scope is passed (header/query param)
  - how React hooks expose scope configuration
- [x] Design observability and logging conventions (request id propagation, structured logs, error metadata).

### Phase 3 – Implementation 🟥
- [x] Add migrations to introduce `scope` columns + indexes for all relevant tables.
- [x] Extend repositories and query builder methods to accept `context` and enforce scope filters consistently.
- [x] Implement request context middleware and update route factory to support context-aware handlers.
- [x] Add optional auth hooks and guard middleware with safe defaults (no-op when not configured).
- [x] Add request size limit middleware and improved rate limiting hook points.
- [x] Update React API client to optionally send scope headers and expose this via provider config.
- [x] Update docs and CLI scaffolding to include production-safe patterns.

### Phase 4 – Validation 🟥
- [x] Add unit tests for scope enforcement in repositories/query builder.
- [x] Add integration tests for API routes ensuring cross-scope isolation.
- [x] Validate default behavior remains unchanged for single-tenant installs.
- [x] Add docs validation: security checklist, deployment notes, recommended configuration snippets.

## Risks & Mitigations
- Scope logic inconsistently applied → Centralize scope enforcement in repository base class; add conformance tests.
- Migration complexity → Use defaults + backfill; keep scope optional for older DBs with clear migration steps.
- “Auth integration” becomes opinionated → Keep auth hooks generic; provide examples, not forced dependencies.

## Open Questions
- Should scope be transmitted via header (preferred) or query param (easier for debugging) or both?
- Should settings be global or per-scope by default?

## Task Backlog
- Optional Row Level Security (RLS) guide and reference migration.
- Audit log table for destructive operations (node/edge deletes, approvals).

## Parallel / Unblock Options
- Context + middleware design can proceed in parallel with DB schema design.
- React/client header support can proceed once scope transmission is decided.
