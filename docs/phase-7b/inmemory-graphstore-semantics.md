# InMemoryGraphStore Semantics (Phase 7B.4)

This document defines the expected semantics for `InMemoryGraphStore` so API behavior remains predictable across backends.

## ID + slug rules
- Node IDs are UUID v4 strings.
- Edge IDs are UUID v4 strings.
- Node `slug` must be unique:
  - on conflict, creation should either:
    - skip the record, or
    - deterministically derive a new slug (preferred in ingestion)
  - for Phase 7B API parity, “skip duplicates” is acceptable when the route supports it.

## Timestamps
- `createdAt` is set on create.
- `updatedAt` is set on create and update.
- Updates should not mutate `createdAt`.

## Node defaults
- If `nodeType` is missing on create, default to `"concept"`.
- If `domain` is missing on create, default to `"general"`.
- `metadata` defaults to `{}`.

## Edge defaults
- If `relationshipType` is missing on create, default to `"related_to"`.
- `strength` defaults to `0.5`.
- `confidence` defaults to `1`.
- `source` defaults to `"manual"`.

## Delete semantics
- Deleting a node should remove associated edges (inbound and outbound).
- Return `edgesRemoved` count for parity with API responses.

## List + pagination
- `limit` and `offset` should behave like SQL:
  - default `limit` can be backend-defined, but route handlers usually set it.
  - `offset` of 0 means “start from first”.
- Ordering:
  - deterministic ordering is required for tests.
  - Recommended default ordering: `createdAt ASC` for nodes and edges.

## Graph queries
For `getGraph/expandGraph/findPaths`:
- Behavior should be correct for small graphs; performance is not the priority.
- Ordering should be deterministic for test stability.

## Embeddings + similarity
- Embeddings are stored on the node record (`embedding`, `embeddingModel`, `embeddingGeneratedAt`).
- Similarity search uses cosine similarity over stored vectors.

