# Phase 7E — SSE Contract (Job Progress Streaming)

This document defines the v1 Server-Sent Events (SSE) contract for analysis job progress streaming.

Design goals:
- SSE is an **optional enhancement**; polling remains first-class.
- The SSE stream is safe and portable: Fetch-native, works in Next.js Node runtime, and does not require a queue system.
- Reconnection should be safe without requiring full event replay (send a snapshot on connect).

## Endpoint
Proposed route (v1):
- `GET /api/neuron/analyze/:jobId/stream`

Notes:
- This is scoped to analysis jobs; future phases can generalize this to `/jobs/:jobId/stream`.
- The stream should be wrapped with the same middleware stack as other API routes:
  - request context (scope + request id)
  - optional auth guard
  - rate limiting (optional)

## Headers
Responses must set:
- `Content-Type: text/event-stream; charset=utf-8`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`

Recommended:
- `x-request-id` echoed (from request context middleware).

## Event framing
Use standard SSE framing:

```
id: <opaque-id>
event: <event-name>
data: <json>

```

Guidance:
- `data` is always JSON (one line, stringified).
- `id` can be a monotonically increasing integer per connection (sufficient if no replay is supported).
- `event` names should match the Phase 7E job event taxonomy (see `docs/phase-7e/job-progress-contract.md`).

## Initial snapshot
On connect, the server should immediately send a progress snapshot event so clients can render without a separate poll:
- `event: analysis.job.progress`
- `data: <latest progress snapshot>`

This snapshot is also the reconnection strategy:
- If the connection drops, clients can reconnect and receive a fresh snapshot.

## Heartbeats / keep-alive
To keep proxies and load balancers from closing idle connections, the server should emit a heartbeat:
- interval: every ~15 seconds (configurable)
- format: a comment line is sufficient:

```
: ping

```

Alternative:
- `event: ping` with a tiny JSON payload.

## Stream termination
The server should close the stream when:
- the job enters a terminal state (`completed|failed|cancelled`)
- or the client disconnects (abort signal)

When closing due to terminal state, send one final terminal event before closing:
- `analysis.job.completed` / `analysis.job.failed` / `analysis.job.canceled`

## Error handling
If the request is invalid:
- `401` when auth is configured and authorization fails
- `404` when the job id does not exist in the current scope
- `400` for malformed job ids or unsupported backends

The server should not attempt to stream error stacks; return a normal JSON error response when possible.

## Fallback polling strategy
Polling is required for environments that do not support SSE streaming reliably.

Recommended polling endpoint:
- `GET /api/neuron/analyze/:jobId`

Suggested client behavior:
- While `status === 'running'`:
  - poll every 1–2 seconds
- After job becomes terminal:
  - stop polling

If both SSE and polling are supported:
- prefer SSE for low-latency updates
- fall back to polling on connection errors or timeouts

