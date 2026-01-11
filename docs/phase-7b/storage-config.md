# Storage Config Extensions (Phase 7B.7)

This document defines the config shape used to select a storage backend.

## Goals
- Keep existing Postgres defaults working unchanged.
- Add explicit storage mode selection for local-first backends.
- Avoid overloading Postgres-only `database.*` fields for non-Postgres backends.

## Proposed config shape

Add a new `storage` section:

```ts
storage: {
  mode: 'postgres' | 'memory' | 'file';
  filePath?: string;          // required when mode === 'file'
  persistIntervalMs?: number; // optional throttling for file writes
}
```

### Defaults
- If `storage` is omitted:
  - treat as `storage.mode = 'postgres'`
- If `storage.mode = 'postgres'`:
  - use existing `database.*` configuration

### File mode requirements
- `storage.filePath` must be provided.
- Recommended default for `persistIntervalMs`: ~250–1000ms (implementation choice).

## Compatibility
- Existing `NeuronConfig` files remain valid; `storage` is optional and additive.
- Existing CLI templates continue to work for Postgres mode; Phase 7B templates add local-first options.

