# Phase 7E — Governance API (Suggested Edges)

This document defines the v1 REST API contract for suggested edges (review/approval workflow).

Principles:
- Suggested edges are stored separately from real `edges`.
- Approval creates an edge and marks the suggestion as approved.
- Endpoints are scope-aware (Phase 7D) and can be protected by the existing auth guard hooks.

## Resource: suggested edges
Proposed base path:
- `/api/neuron/suggestions`

Rationale:
- Keeps Next.js route dispatch simple (separate “resource” from `/edges`).
- Avoids overloading `/edges/*` paths.

## Types (conceptual)
Suggested edge record (v1 minimum):
- `id`
- `fromNodeId`, `toNodeId`
- `relationshipType`
- `confidence`, `strength`
- `reasoning`, `evidence`
- `status: pending|approved|rejected`
- `analysisRunId?`, `sourceModel?`
- `reviewedBy?`, `reviewedAt?`, `reviewReason?`
- `approvedEdgeId?`

## List suggestions
`GET /api/neuron/suggestions`

Query params (v1):
- `status=pending|approved|rejected` (optional; default: `pending`)
- `relationshipType` (optional)
- `minConfidence` (optional)
- `limit` (optional)
- `page` (optional)

Response:
```json
{
  "suggestions": [],
  "pagination": { "page": 1, "limit": 50, "total": 0, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

## Approve suggestion(s)
### Single approve
`POST /api/neuron/suggestions/:id/approve`

Response:
```json
{ "approved": true, "edgeId": "..." }
```

### Bulk approve
`POST /api/neuron/suggestions/approve`

Body:
```json
{ "ids": ["..."] }
```

Response:
```json
{ "approvedIds": ["..."], "edgeIds": ["..."], "notFoundIds": [] }
```

Notes:
- Approval should be idempotent:
  - already-approved suggestions return `approved: true` and include the existing `edgeId` when known.
- When an approval creates an edge, emit:
  - `edges.suggestion.approved`
  - `edge:created` (existing event type)

## Reject suggestion(s)
### Single reject
`POST /api/neuron/suggestions/:id/reject`

Body:
```json
{ "reason": "optional" }
```

Response:
```json
{ "rejected": true }
```

### Bulk reject
`POST /api/neuron/suggestions/reject`

Body:
```json
{ "ids": ["..."], "reason": "optional" }
```

Response:
```json
{ "rejectedIds": ["..."], "notFoundIds": [] }
```

Notes:
- Rejection should be idempotent.
- Emit `edges.suggestion.rejected`.

## Auth + scope
All endpoints should use:
- request context middleware (to derive `scope`)
- auth guard (optional)

If multi-tenant is enabled and clients are untrusted:
- validate `context.scope` in `auth.authorize` before allowing list/approve/reject.

## Auto-approve configuration (server-side)
Relationship inference can be configured to either:
- write only suggestions (pending) for human review, or
- auto-approve high-confidence suggestions into real edges.

Current settings (Phase 7E):
- `analysis.relationshipGovernanceEnabled` (default: `true`) — when enabled, inference persists to `suggested_edges`.
- `analysis.relationshipAutoApproveEnabled` (default: `true`) — when enabled, eligible suggestions are auto-approved.
- `analysis.relationshipAutoApproveMinConfidence` (default: `0.7`) — minimum confidence required for auto-approval.

Notes:
- If `suggested_edges` does not exist (migrations not applied), inference falls back to edge-only writes.
