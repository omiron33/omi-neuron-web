# Canonical Ingestion Model (Phase 7C.1)

This document defines the v1 ingestion model used by built-in connectors and the CLI.

Goals:
- Deterministic and idempotent: re-running the same ingest does not duplicate nodes/edges.
- Safe by default: “missing items” never delete user data unless explicitly requested.
- Traceable: every ingested node/edge can be traced back to a source + external item.

## Core concepts

### Connector
A `Connector` is a piece of code that can:
1. enumerate external items (`listItems`)
2. fetch/normalize their content into a stable record shape (`fetchItem` / `toRecord`)
3. map normalized records to graph mutations (nodes + edges)

### Source
A `Source` is a configured instance of a connector (e.g. “my-notes” of type “markdown”).

Minimum identity fields:
- `type`: connector type (`markdown` | `github` | `rss` | `notion`)
- `name`: human label (unique per deployment)
- `config`: connector-specific JSON config (path/repo/url, etc.)

### Source item
A `SourceItem` represents a single external entity (one markdown file, one GitHub issue, one RSS entry).

Minimum identity fields:
- `sourceId`: which source the item belongs to
- `externalId`: stable external identity string (connector-specific)
- `contentHash`: hash of normalized content for change detection

### Sync run
Each ingest execution is a `SyncRun`:
- `sourceId`
- timestamps (started/completed)
- status (`success` | `failed` | `partial`)
- stats (created/updated/skipped/deleted)
- error (optional)

## Identity rules (v1)

### `externalId`
Requirements:
- Stable across runs.
- Deterministic from the external system.
- Unique within a single `sourceId`.

Examples:
- Markdown: repo-relative file path (POSIX) like `docs/notes/alpha.md`
- GitHub: canonical URL like `https://github.com/org/repo/issues/123`
- RSS: `guid` when present, otherwise `link`
- Notion export: export-relative file path (including hierarchy)

### `contentHash`
Used to avoid unnecessary updates.

Rules:
- Hash the normalized content, not the raw response, so cosmetic differences (whitespace) don’t force churn.
- Recommended algorithm: `sha256` over a canonical string (e.g. JSON with stable key ordering).

## Mapping to graph data

### Node identity (slug strategy)
Nodes must have globally unique slugs (the graph model enforces uniqueness).

v1 strategy:
- Make the slug deterministic and source-aware by including a short hash of `(sourceId + externalId)`.
- Prefer a readable base derived from the record title/label.

Example (conceptual):
- `slug = stableSlug(title) + "-" + shortHash(sourceId + ":" + externalId)`

### Upsert semantics
For each source item:
- If no prior mapping exists → create node(s) and record mapping.
- If mapping exists and `contentHash` unchanged → skip (idempotent).
- If mapping exists and `contentHash` changed → update node fields and re-write edges for that item.

### Delete semantics (missing items)
Default: **non-destructive**.

Supported modes (v1):
- `none` (default): missing items are ignored.
- `soft`: mark source item as deleted, keep nodes/edges (optionally mark nodes via metadata).
- `hard`: delete nodes and edges created by that item (requires explicit flags).

## Safety rails
- `--dry-run` prints a summary without writing.
- Destructive operations (`--delete-missing`) require explicit flags and should surface a confirmation prompt in CLI UX.

