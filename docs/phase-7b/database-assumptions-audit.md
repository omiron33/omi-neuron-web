# Database Assumptions Audit (Phase 7B.2)

This document lists the current Postgres/SQL-specific assumptions in the codebase and the abstraction boundaries needed to support local-first backends (`InMemoryGraphStore`, `FileBackedGraphStore`).

## Summary

The codebase currently assumes Postgres in several hotspots:
- API route handlers construct a `Database` instance and use repositories/query builder directly.
- Similarity search and candidate selection use pgvector operators (`<=>`).
- Graph traversal queries (expand/path) are implemented as recursive SQL.

Phase 7B relies on the Phase 7A `GraphStore` contract to isolate these assumptions behind a portable interface.

## Key Postgres-specific touchpoints

### Graph queries (visualization)
- `src/api/query-builder.ts`
  - Builds SQL with recursive CTEs for expansion/pathfinding.
  - Uses direct joins and expects `nodes`/`edges` schema.

Abstraction boundary:
- `GraphStore.getGraph`, `GraphStore.expandGraph`, `GraphStore.findPaths`
  - Postgres keeps using SQL.
  - Local-first implements equivalent traversal in memory.

### Similarity search (pgvector)
- `src/core/analysis/scoring-engine.ts`
  - Uses `embedding <=> $1` and `1 - (embedding <=> ...)` similarity scoring.
- `src/core/analysis/relationship-engine.ts`
  - Candidate selection uses `embedding <=> (SELECT embedding ...)`.

Abstraction boundary:
- `GraphStore.findSimilarNodeIds`
  - Postgres uses pgvector.
  - Local-first uses cosine similarity over stored embeddings.

### Embedding persistence
- `src/core/analysis/embeddings-service.ts`
  - Reads/writes embedding fields directly on `nodes` rows.

Abstraction boundary:
- `GraphStore.getNodeEmbeddingInfo`, `GraphStore.setNodeEmbedding`, `GraphStore.clearNodeEmbeddings`
  - Postgres stores vectors in `nodes.embedding`.
  - Local-first stores vectors in memory/JSON.

### CRUD and settings
- API routes use repositories (SQL-backed):
  - `NodeRepository`, `EdgeRepository`, `SettingsRepository`

Abstraction boundary:
- `GraphStore` node/edge/settings methods
  - Postgres delegates to repositories.
  - Local-first implements semantics directly.

## Required refactors for Phase 7B

To make backends swappable without editing route handlers:
- API route creators should accept an injected `GraphStore` (or store factory)
- Existing `createNeuronRoutes(config)` should remain supported by:
  - constructing a `PostgresGraphStore` from `config` internally (default behavior)

## Notes on parity risks

- Local-first `findPaths` and `expandGraph` may differ in ordering; document and keep deterministic in tests.
- Performance in file/memory mode will be dominated by O(n) scans; this is expected and documented.

