# DataProcessor audit (Phase 7C.2)

`src/core/analysis/data-processor.ts` is useful as a *normalization helper*, but it is not sufficient for real ingestion connectors.

## What DataProcessor does well
- Converts arbitrary JSON/CSV-ish records into `NeuronNodeCreate` using configurable field selection.
- Provides basic slug generation and duplicate detection for a batch.
- Extracts a simple “content” field by concatenating selected fields and stripping HTML tags.

## Gaps for real connectors (v1 requirements)

### Provenance + repeatable sync
Missing today:
- A canonical `Source` and `SourceItem` model (source identity + external IDs).
- Change detection (`contentHash`) and incremental updates.
- Mapping tables from `SourceItem` → created `node_id` (and optionally edges).
- Sync-run tracking (status, stats, error reporting).

### Edge creation / link extraction
Missing today:
- Parsing links (markdown links, wiki links, issue references, RSS links).
- A standardized way for connectors to emit edges alongside nodes.

### Idempotency across backends
Missing today:
- A cross-backend upsert story that does not rely on DB-specific `ON CONFLICT` behavior.
- A deterministic slug strategy that avoids collisions across multiple sources.

### CLI UX and safety rails
Missing today:
- `omi-neuron ingest …` commands with dry-run support.
- Explicit delete semantics (`none`/`soft`/`hard`) with safety prompts.

## Conclusion
Treat `DataProcessor` as a low-level building block for normalization, but build a dedicated connector framework + provenance layer for ingestion.

