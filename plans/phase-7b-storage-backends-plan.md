# Phase 7B: Storage Backends + Local-First DX Plan

## Outcomes
- Users can try `omi-neuron-web` quickly without Docker/Postgres by using local-first storage backends.
- API + analysis layers operate against a portable store contract (Phase 7A `GraphStore`), enabling multiple backends.
- The library provides a clear “prototype vs production” path:
  - Prototype: in-memory / file-backed
  - Production: Postgres + pgvector
- The CLI and docs provide an opinionated low-ops onboarding flow.

## Scope

### In scope
- Implement local-first storage backends:
  - `InMemoryGraphStore` (fast dev, tests, demos)
  - `FileBackedGraphStore` (JSON persistence for small graphs / prototyping)
- Extend config + factory wiring to support new modes cleanly (without breaking existing Postgres defaults).
- Ensure API routes and React hooks work unchanged against these backends (same route shapes).
- Provide documentation and examples for local-first usage.
- Add tests + fixtures to validate backend behaviors and parity (where meaningful).

#### Planned config shape (proposed)
- Add a new config “storage mode” (or extend existing DB mode) that is explicit and does not overload Postgres-only fields:
  - `storage.mode: 'postgres' | 'memory' | 'file'`
  - `storage.filePath?: string` (required for `file`)
  - `storage.persistIntervalMs?: number` (optional throttling for `file`)
- Keep existing `database` config as-is for Postgres mode to avoid breaking current consumers.

#### Parity targets (explicit)
- Must match Postgres-backed API behavior for:
  - nodes/edges CRUD and listing
  - graph fetch for visualization (`/graph`)
  - settings get/update/reset
- “Best effort” parity for:
  - semantic search and similarity (deterministic in tests via mock embedding provider)
- Explicitly out-of-parity (documented):
  - advanced SQL filtering performance
  - pgvector index behavior

### Out of scope
- High-scale production storage alternatives (Neo4j, Elastic, etc.).
- Distributed locking / multi-process safe file stores (single-process assumed for file mode).
- Advanced vector indexes outside Postgres (prototype backends can use simple cosine similarity).
- Worker queues or cron orchestration (Phase 7E).

## Assumptions & Constraints
- Phase 7A `GraphStore` exists and is the primary abstraction for new backends.
- Local-first modes prioritize developer experience and correctness over maximum performance.
- File-backed storage targets small datasets (explicitly documented).
- Vector search in local-first modes can be approximate/naive (explicitly documented).

## Dependencies
- Phase 7A: `GraphStore` contract + wiring points.
- Existing API route factory (`src/api/routes/*`) should accept injectable store instances (or a factory).
- Existing analysis services should operate via store APIs (or via store + DB-specific helpers only in Postgres mode).

## Execution Phases

### Phase 1 – Discovery 🟥
- [ ] Define minimum feature parity required for local-first modes (CRUD, graph fetch, basic search) and document what is intentionally not supported.
- [ ] Audit current database assumptions (SQL-only queries, pgvector-specific logic) and identify required abstraction boundaries.
- [ ] Define data size expectations + guidance for each backend (in-memory vs file-backed) and where consumers should migrate to Postgres.

### Phase 2 – Design/Architecture 🟥
Design artifacts to produce in this phase (recommended):
- `docs/phase-7b/local-first-parity.md` (what matches Postgres vs what doesn’t)
- `docs/phase-7b/file-store-format.md` (JSON schema, versioning, atomic write strategy)

- [ ] Specify `InMemoryGraphStore` semantics (IDs, slug uniqueness, timestamps, filtering, pagination) to match API expectations.
- [ ] Specify `FileBackedGraphStore` persistence format, write strategy, and failure behavior (atomic writes, corruption handling).
- [ ] Define local-first search behavior:
  - embedding storage format
  - cosine similarity implementation
  - limitations vs pgvector
- [ ] Design config extensions and selection:
  - `storage.mode: 'postgres' | 'memory' | 'file'`
  - `storage.filePath` for file mode
- [ ] Define a portability strategy for analysis:
  - which steps require embeddings
  - how caching works in local-first modes

### Phase 3 – Implementation 🟥
- [ ] Implement `InMemoryGraphStore` with full API parity where feasible (nodes, edges, settings, graph queries, search).
- [ ] Implement `FileBackedGraphStore` with JSON persistence and safe writes; provide migration/versioning strategy for the file format.
- [ ] Add shared utilities for local-first similarity scoring (cosine similarity, normalization).
- [ ] Update storage factory wiring to choose store backend by config, without impacting Postgres default behavior.
- [ ] Update API routes to accept an injected store (or store factory) so backends can be swapped without editing route handlers.
- [ ] Update CLI scaffolding to support local-first templates and add a “quickstart without Docker” path.
- [ ] Add docs and examples demonstrating:
  - local-first quickstart
  - migration to Postgres when ready

### Phase 4 – Validation 🟥
- [ ] Add unit tests for backend semantics and parity (CRUD behavior, pagination/filtering).
- [ ] Add integration tests to ensure API routes behave identically across backends for core operations.
- [ ] Validate local-first search correctness on small fixtures (deterministic embeddings via mock provider).
- [ ] Document performance expectations and explicit limitations.

## Risks & Mitigations
- Divergence between Postgres and local backends → Define parity expectations; add shared conformance tests.
- File corruption/data loss → Use atomic writes; add backups; document limitations; keep file mode “prototype-grade.”
- API routes tightly coupled to SQL → Refactor routes to depend on store methods, not SQL queries.

## Open Questions
- Should local-first modes support clustering/relationship inference, or only CRUD + embeddings + similarity search?
- Should file mode support incremental append logs (safer) or snapshot-only (simpler)?

## Task Backlog
- Consider a SQLite backend if demand is high (requires careful vector story).

## Parallel / Unblock Options
- `InMemoryGraphStore` can be built first to unblock tests and examples.
- File format design can proceed in parallel with in-memory implementation.
