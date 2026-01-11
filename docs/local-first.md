# Local-first storage (memory + file)

`omi-neuron-web` defaults to Postgres (`storage` omitted or `storage.mode = 'postgres'`).

For fast prototyping (no Docker/Postgres), you can run the API routes against a local-first backend:
- `storage.mode = 'memory'` — dev/tests only (non-persistent)
- `storage.mode = 'file'` — small prototypes persisted to a JSON file (single-process)

## Quickstart (no Docker)

Generate config + route handler with local-first storage:

```bash
omi-neuron init --storage file --skip-docker
```

This generates:
- `neuron.server.ts` with `storage.mode = 'file'`
- `neuron.client.ts` (client-safe)
- `neuron.config.ts` compat export
- `app/api/neuron/[...path]/route.ts` dispatcher

Recommended file path defaults to:
- `.neuron/graph.json`

## Config examples

### In-memory (tests/demos)

```ts
export const neuronServerConfig = defineNeuronServerConfig({
  // ...
  storage: { mode: 'memory' },
  database: { mode: 'external', port: 5433, url: process.env.DATABASE_URL },
});
```

### File-backed (small persisted prototypes)

```ts
export const neuronServerConfig = defineNeuronServerConfig({
  // ...
  storage: {
    mode: 'file',
    filePath: '.neuron/graph.json',
    persistIntervalMs: 500,
  },
  database: { mode: 'external', port: 5433, url: process.env.DATABASE_URL },
});
```

Notes:
- File-backed mode assumes a single process writes the file.
- Many serverless platforms have ephemeral file systems; file mode is best for local dev.

## Performance expectations

Local-first backends are intentionally simple and trade performance for ease-of-setup:

- Similarity search (`/search`, `/search/similar`) is an O(n · d) scan (n = nodes with embeddings, d = embedding dimensions).
- Graph expansion / pathfinding can get expensive as graphs grow (depth-first searches).
- File-backed persistence rewrites the full JSON snapshot; large graphs increase write time and file size.

### Recommended scale (rule of thumb)

From `docs/phase-7b/data-size-guidance.md`:

- `storage.mode = 'memory'`: ✅ ~1–5k nodes / ~5–50k edges (depends on operations)
- `storage.mode = 'file'`: ✅ hundreds to low-thousands of nodes/edges (prototype-grade)

If you exceed these ranges (or need multi-process / multi-user), migrate to Postgres.

## Explicit limitations

- **No index acceleration:** local-first similarity is a full scan and will slow down as graphs grow.
- **Single-process file mode:** file-backed storage is not safe for concurrent writers; do not run multiple server instances against the same file.
- **Serverless caveats:** many platforms use ephemeral or read-only file systems; file mode is best for local dev.
- **Durability is best-effort:** file writes are atomic (write `.tmp` + rename) and may use `.bak` fallback, but crashes can still lose the most recent in-memory changes (depending on `persistIntervalMs`).
- **Analysis portability:** advanced analysis endpoints are currently Postgres-only; local-first modes focus on CRUD + graph fetch + similarity.

## Migrating to Postgres

When you outgrow local-first constraints:
1. Set `storage.mode` to `'postgres'`.
2. Configure `database` (docker or external).
3. Run migrations.

The API surface remains the same; you’re switching the backend implementation only.
