# Analysis Portability Strategy (Phase 7B.8)

This document defines what parts of the analysis pipeline are expected to work across storage backends.

## Current pipeline steps
Default pipeline stages:
- embeddings
- clustering
- relationships

## Portable vs backend-specific

### Embeddings (portable)
Embeddings can be supported in all backends:
- Generate embeddings via `EmbeddingProvider`
- Store embeddings on nodes (`embedding`, `embeddingModel`, `embeddingGeneratedAt`)

Caching:
- Cache is stored on the node record (same as Postgres schema).
- Local-first backends persist cached embeddings in memory or JSON file snapshots.

### Similarity search (portable, best-effort)
Used for:
- search endpoints
- relationship candidate selection

Implementation:
- Postgres uses pgvector.
- Local-first uses cosine similarity scans.

### Clustering (best-effort)
Clustering is algorithmic and can run in local-first modes, but:
- persisting cluster tables/memberships may be out of scope for v1 local-first parity
- local-first may implement “clusterId on node” only, or omit clustering entirely

Recommendation for Phase 7B:
- Support embeddings + similarity first.
- Document clustering as optional/experimental in local-first modes unless parity is required.

### Relationship inference (best-effort)
Relationship inference requires:
- an `LLMProvider`
- candidate selection (similarity)
- persistence of inferred edges/suggestions

Local-first feasibility:
- feasible for small graphs, but expensive and slower due to scanning candidate sets.

Recommendation:
- Keep relationship inference enabled but document:
  - small-graph expectation
  - rate limiting/cost considerations

## Practical guidance
- For local-first onboarding:
  - prioritize CRUD + graph fetch + settings
  - add embeddings + similarity as the first “AI feature”
  - treat clustering/inference as optional follow-ups

