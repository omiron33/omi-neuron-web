# Phase 7C: Connectors + Ingestion Recipes Plan

## Outcomes
- Users can ingest real-world content into the graph with minimal glue code.
- The library supports repeatable sync semantics (idempotency, updates, optional deletes) with provenance.
- The CLI offers standardized ingestion commands for common sources.
- Consumers can build custom connectors by implementing a stable connector interface.

## Scope

### In scope
- Connector interface (source → normalized records → nodes/edges)
- Built-in ingestion recipes/connectors:
  - Markdown folder (Obsidian-style vault / docs folder)
  - GitHub Issues/PRs (as nodes, with cross-links as edges)
  - RSS/Atom feeds (articles as nodes)
  - Notion export (markdown/html export parsing)
- Provenance + sync semantics:
  - stable external IDs
  - upsert rules
  - optional soft-delete strategy
  - source metadata stored explicitly (not only ad-hoc JSON)
- CLI ingestion commands (`omi-neuron ingest ...`) + templates
- Docs + examples + fixtures

#### Provenance model (v1 target)
The ingestion system should be able to answer:
- “Which external item created this node?”
- “What changed since the last sync?”
- “What should happen when an external item disappears?”

Proposed minimal schema (exact names finalized in Phase 2 design):
- `sources`
  - `id` (uuid), `type` (markdown/github/rss/notion), `name`, `config` (jsonb), timestamps
- `source_items`
  - `id` (uuid), `source_id`, `external_id` (string), `content_hash` (string), timestamps
- `source_item_nodes`
  - `source_item_id`, `node_id` (mapping table), unique `(source_item_id, node_id)`
- `sync_runs`
  - `id`, `source_id`, `started_at`, `completed_at`, `status`, `stats` (jsonb), `error` (text)

Notes:
- “External ID” must be stable and deterministic for each connector (e.g., file path, GitHub issue number URL, RSS GUID/link).
- Deletion should default to **non-destructive** unless an explicit flag is used.

### Out of scope
- Building a full ETL framework (scheduling, retries across days, distributed locks).
- A UI ingestion wizard (CLI-first).
- Proprietary API integrations that require complex auth flows (can be added later).

## Assumptions & Constraints
- Phase 7A provider abstractions exist for embeddings/LLM usage in ingestion (optional).
- Phase 7B local-first backends may be used for ingestion demos (small fixtures).
- Ingestion must be deterministic and idempotent for safety.
- Default behavior must never delete user data unexpectedly (explicit flags required).

## Dependencies
- Storage layer (Postgres default) + migrations system for provenance tables/columns.
- DataProcessor (`src/core/analysis/data-processor.ts`) as a base for normalization utilities.
- API routes + repositories for node/edge upserts and lookups.
- CLI commands framework (`src/cli/*`) for new ingestion commands.

## Execution Phases

### Phase 1 – Discovery 🟥
- [x] Define canonical ingestion model:
  - external IDs
  - source identity
  - sync run metadata
  - delete semantics (none/soft/hard)
- [x] Audit current ingestion utilities (`DataProcessor`) and identify what is missing for real connectors (provenance, mapping tables, incremental sync).
- [x] Select the initial connector set (Markdown, GitHub, RSS, Notion) and define minimal v1 feature parity for each.

### Phase 2 – Design/Architecture 🟥
Design artifacts to produce in this phase (recommended):
- `docs/phase-7c/connector-contract.md` (interfaces, lifecycle, error handling)
- `docs/phase-7c/provenance-schema.md` (tables/columns/indexes, backfill strategy)
- `docs/phase-7c/ingestion-cli-ux.md` (commands/flags, examples, safety rails)

- [x] Design connector contracts:
  - `Connector` interface (list items, fetch item content, map to nodes/edges)
  - “record model” for normalized source items
  - error handling and partial failure behavior
- [x] Design provenance storage:
  - tables/columns for `source`, `source_item`, `sync_run`
  - mapping from `source_item` → `node_id`
  - indexes for fast upserts
- [x] Design CLI UX:
  - `omi-neuron ingest markdown --path ./docs`
  - `omi-neuron ingest github --repo owner/name`
  - `omi-neuron ingest rss --url ...`
  - flags for `--upsert`, `--delete-missing`, `--dry-run`, `--limit`
- [x] Design “sync safety rails”:
  - dry-run summary output
  - explicit confirmation for destructive ops
  - idempotent slug generation and conflict strategy

### Phase 3 – Implementation 🟥
- [x] Add DB migrations for provenance + sync tracking and update repositories to support external ID upserts.
- [x] Implement connector framework + shared normalization helpers (slugging, metadata mapping, content extraction).
- [x] Implement Markdown connector (file scanning, frontmatter parsing, link extraction → edges).
- [x] Implement GitHub connector (issues/PRs as nodes; cross-references and mentions as edges).
- [x] Implement RSS connector (feed parsing, content extraction; dedupe by GUID/link).
- [x] Implement Notion export connector (parse export format → nodes; preserve hierarchy via `part_of` edges).
- [x] Add CLI commands + templates to scaffold connector config and run ingestion.
- [x] Add docs + examples + fixtures for each connector.

### Phase 4 – Validation 🟥
- [x] Add unit tests for connector normalization and slug/idempotency rules.
- [x] Add integration tests for provenance upsert behavior and safe delete modes.
- [x] Validate connectors on representative fixtures (markdown vault fixture, GitHub fixture, RSS fixture, Notion export fixture).
- [x] Validate end-to-end “ingest → analyze → visualize” example flows.

## Risks & Mitigations
- Accidental destructive sync behavior → Default to non-destructive; require explicit flags; require dry-run summaries.
- Connector brittleness (format changes) → Keep connectors modular; focus on stable export formats; document supported variants.
- Data model sprawl → Centralize provenance schema and keep connector metadata in `metadata` only when appropriate.

## Open Questions
- Should provenance be a separate table only, or should nodes also store `sourceId`/`externalId` fields directly for faster lookups?
- Do we want “connector plugin loading” (dynamic import) or only code-level connectors in this repo initially?

## Task Backlog
- Add connectors: Google Docs export, Jira/Linear, Slack exports, email threads.

## Parallel / Unblock Options
- Provenance schema + migrations can be built first to unblock all connectors.
- Markdown connector can be implemented first as the simplest and most deterministic.
