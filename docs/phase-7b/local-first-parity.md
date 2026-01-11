# Local-First Parity (Phase 7B)

This document defines what “parity” means for local-first storage modes (`memory` and `file`) versus the default Postgres backend.

Goal: make it easy to prototype without Docker/Postgres while keeping a clear migration path to production.

## Required parity (must match)

These behaviors should match the Postgres-backed API as closely as feasible:

### Nodes
- Create nodes (batch create)
- Update nodes
- Delete nodes
- List nodes (basic pagination semantics)

### Edges
- Create edges (batch create)
- Update edges
- Delete edges
- List edges

### Graph fetch for visualization
- `GET /graph` returns:
  - `NeuronVisualNode[]`
  - `NeuronVisualEdge[]`
  - `meta.totalNodes`, `meta.totalEdges`, `meta.truncated`

### Settings
- `GET /settings`
- `PATCH /settings` (partial updates)
- `POST /settings/reset`

## Best-effort parity (supported, but not identical)

### Embeddings + similarity search
Local-first modes should support:
- storing embeddings on nodes
- “find similar” operations using cosine similarity on stored vectors
- semantic search for small graphs

Notes:
- Local-first similarity search will be naive (no indexes).
- Deterministic tests should use a mock embedding provider.

## Explicitly out-of-parity (documented limitations)

### Performance
- No pgvector index behavior.
- No SQL-level filtering performance; in-memory scans are expected.
- File-backed mode is single-process and not designed for concurrent writers.

### Advanced query behavior
- No guarantee of identical ordering for complex queries.
- No support for Postgres-specific operators (e.g., pgvector `<=>`) outside the Postgres backend.

## Migration expectation

Prototype → production guidance:
- Use `memory` for tests and demos.
- Use `file` for small persisted prototypes.
- Migrate to `postgres` for production, larger datasets, and reliable similarity search performance.

