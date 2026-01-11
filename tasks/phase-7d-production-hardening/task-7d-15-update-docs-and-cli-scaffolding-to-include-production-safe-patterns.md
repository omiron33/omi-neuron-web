---
title: Update docs and CLI scaffolding to include production-safe patterns.
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

# Task 7D.15: Update docs and CLI scaffolding to include production-safe patterns.

Plan item (Phase 3 – Implementation) from `plans/phase-7d-production-hardening-plan.md`: Update docs and CLI scaffolding to include production-safe patterns.

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
- Hardened core middleware defaults for production:
  - `src/api/middleware/request-context.ts` now catches handler errors and returns consistent JSON error responses with `requestId`.
  - `src/api/middleware/error-handler.ts` supports including `requestId` in error shapes.
  - `src/api/middleware/logging.ts` is now disabled by default and supports injected loggers (no console noise unless enabled).
  - `src/api/middleware/cors.ts` now uses an explicit allowlist (no `*` by default; disabled when origins are not configured).
  - `src/api/middleware/index.ts` exposes `logging` options via `withNeuronMiddleware(handler, { cors?, logging? })`.
- Updated CLI scaffolding (`omi-neuron init`) to generate production-safer templates:
  - `src/cli/commands/init.ts` server config template now includes `api.rateLimit` defaults.
  - Next.js API route stub template now demonstrates request context, body size limits, and optional auth/rate limiting hooks.
  - Route stub wraps dispatch with `withNeuronMiddleware` and includes commented CORS/logging allowlist examples.
- Updated docs to reflect production hardening options and headers:
  - `docs/secure-nextjs-setup.md`
  - `docs/api-reference.md`
  - `docs/configuration.md`
  - `README.md`
