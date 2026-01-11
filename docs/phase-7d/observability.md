# Phase 7D — Observability (Request IDs + Logging)

This document defines minimal observability conventions.

## Request IDs
- Incoming: read `x-request-id` if present.
- Generated: when absent, generate a request id per request.
- Outgoing: include `x-request-id` on responses when feasible.

## Structured logging
Goals:
- predictable log messages
- correlation via request id
- avoid noisy default logging in production

Recommended approach:
- Use an injectable logger interface (info/warn/error/debug).
- Default to a no-op logger unless explicitly enabled.
- Include fields:
  - `requestId`
  - `scope`
  - `method`, `path`, `status`
  - `durationMs`

## Error shapes
Server errors should be returned consistently:
- `error` (message)
- `code` (machine-readable)
- `statusCode`
- optional `requestId` (for correlation)

