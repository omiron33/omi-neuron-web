# Local-first example (no Docker/Postgres)

This example shows the **configuration shape** for running `omi-neuron-web` with local-first storage backends:
- `storage.mode = 'memory'` (non-persistent)
- `storage.mode = 'file'` (JSON snapshot persistence)

The recommended way to scaffold this into a real Next.js app is:

```bash
omi-neuron init --storage file --skip-docker
```

See `docs/local-first.md` for details and migration guidance.

