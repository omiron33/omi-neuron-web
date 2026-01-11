# File Store Format (Phase 7B.5)

This document defines the persistence format and write strategy for `FileBackedGraphStore`.

Goals:
- Simple, human-inspectable JSON format
- Versioned for forward evolution
- Atomic writes to avoid partial corruption
- Prototype-grade guarantees (single-process writer)

## File format (v1)

Top-level JSON shape:

```json
{
  "version": 1,
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "nodes": [],
  "edges": [],
  "settings": { "id": "default", "value": {} }
}
```

### Nodes
- Stored as an array of serialized `NeuronNode` records.
- Date fields are ISO strings (`createdAt`, `updatedAt`, `embeddingGeneratedAt`).
- Embeddings are stored inline on the node:
  - `embedding: number[] | null`
  - `embeddingModel: string | null`
  - `embeddingGeneratedAt: string | null`

### Edges
- Stored as an array of serialized `NeuronEdge` records.
- Date fields are ISO strings.

### Settings
- Stored as a single object equivalent to `NeuronSettings`.
- Persisted under a stable `"default"` record (mirrors Postgres default row).

## Atomic write strategy

Single-process assumption:
- Only one writer should update the file at a time.

Write algorithm:
1) Serialize to JSON with stable ordering (for deterministic tests where possible).
2) Write to a temp file in the same directory:
   - `${filePath}.tmp`
3) Flush and close.
4) Rename temp file over the original:
   - `rename(tmp, filePath)`

Optional safety improvement (recommended):
- Before overwriting, rename the old file to:
  - `${filePath}.bak`

## Corruption handling

On load:
- If JSON parse fails:
  - attempt to load `.bak` if present
  - otherwise throw a clear error and refuse to proceed

## Versioning

Rules:
- `version` is required.
- Backwards-incompatible changes must bump `version`.
- Readers should:
  - support known versions
  - throw clear errors for unknown versions

