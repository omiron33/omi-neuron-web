# Data Size Guidance (Phase 7B.3)

This document provides practical guidance for when to use each storage backend.

## Storage modes

### `storage.mode = 'postgres'` (production)
Use Postgres + pgvector when you need:
- large graphs
- fast similarity search
- reliable persistence
- multi-process deployments

### `storage.mode = 'memory'` (dev/tests)
Use in-memory storage when you want:
- fastest startup (no Docker)
- deterministic tests
- ephemeral demo data

Recommended scale:
- ✅ ~1–5k nodes / ~5–50k edges (depends on operations)
- ❌ not recommended for long-running persistence or multi-process use

### `storage.mode = 'file'` (prototype persistence)
Use file-backed storage when you want:
- persistence without Postgres
- small “local-first” prototypes

Recommended scale (prototype-grade):
- ✅ hundreds to low-thousands of nodes/edges
- ⚠️ naive similarity search will slow down as graphs grow
- ❌ not safe for concurrent writers or multi-process setups

## When to migrate to Postgres

Strong signals you should migrate:
- slow graph fetch / expand operations
- slow semantic search or “find similar”
- need for concurrent users/environments
- need for durable production-grade backups and recovery

## Operational notes
- File mode is single-process by design; treat it like an embedded prototype DB.
- For performance, keep embeddings and similarity search expectations modest in local-first modes.

