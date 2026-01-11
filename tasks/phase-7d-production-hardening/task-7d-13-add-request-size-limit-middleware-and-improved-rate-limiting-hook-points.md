---
title: Add request size limit middleware and improved rate limiting hook points.
status: completed
bucket: To-Do
priority: 2
labels:
  - 'Phase:7D-Production'
  - 'Type:Implementation'
assignees:
  - CodingAgent
depends_on:
  - task-7d-8-design-observability-and-logging-conventions
  - task-7a-6-design-graphstore-interface-to-cover-the-minimal-crud-graph-query-needs
---

# Task 7D.13: Add request size limit middleware and improved rate limiting hook points.

Plan item (Phase 3 – Implementation) from `plans/phase-7d-production-hardening-plan.md`: Add request size limit middleware and improved rate limiting hook points.

## Task
Execute this plan item and record design decisions/edge cases in task notes (or a referenced doc) to prevent rework.

### Context / Relevant Files
- `src/api/middleware/*`
- `src/api/routes/*`
- `src/api/repositories/*`
- `src/storage/migrations/*`
- `src/react/api-client.ts`

### Requirements
- [ ] Identify the exact code touchpoints and public API surfaces impacted by this change.
- [ ] Produce the required artifact(s) (code, docs, schema, or tests) to complete the plan item without introducing breaking changes.
- [ ] Update exports/index files where needed so new APIs are available from intended entry points.
- [ ] Add or update tests appropriate for the phase (contracts for design, unit/integration for implementation).

### Acceptance Criteria
- [ ] The plan item intent is fully satisfied (no partial implementation).
- [ ] TypeScript typecheck passes (`pnpm typecheck`).
- [ ] Lint passes for touched areas (`pnpm lint`).
- [ ] Tests pass (`pnpm test`) or new tests are added where gaps exist.
- [ ] Docs/examples updated if developer-facing behavior changed.

## Notes
- Created by generator on 2026-01-10T15:59:28.230Z.
- Added request body guard middleware:
  - `src/api/middleware/body-size-limit.ts` exports `withBodySizeLimit(handler, { maxBytes?, contentLengthHeader? })`
  - portable implementation using `Content-Length` when present; defaults to 1MB when enabled
- Added hook-based rate limiting middleware:
  - `src/api/middleware/rate-limit.ts` exports `withRateLimit(handler, { windowMs, max, keyFn?, limiter? })`
  - no built-in store; consumers provide `limiter` (Redis/KV/in-memory) to enforce
  - returns consistent 429 JSON error shape with optional rate limit headers
- Integrated both into `createNeuronRoutes` via optional `bodySizeLimit` + `rateLimit` options:
  - `src/api/routes/factory.ts` resolves `windowMs/max` from `options.rateLimit` or `config.api.rateLimit` (fallback 60s/60)
  - route handlers wrap contextual handlers with body size + rate limit wrappers (before auth and before parsing JSON)
- Added tests:
  - `tests/api/body-size-limit.test.ts`
  - `tests/api/rate-limit.test.ts`
- Docs updated:
  - `README.md` now documents `bodySizeLimit` and `rateLimit` options and middleware exports.
