# Provenance schema (Phase 7C.5)

This document specifies the minimal Postgres schema for ingestion provenance and repeatable sync semantics.

Goals:
- Track which external item created which node(s).
- Support incremental sync via `content_hash`.
- Support safe “missing item” handling (none/soft/hard) without destructive defaults.

## Tables

### `sources`
Represents a configured connector instance.

Columns:
- `id` UUID PK
- `type` TEXT (`markdown` | `github` | `rss` | `notion`)
- `name` TEXT (human label)
- `config` JSONB (connector config)
- `created_at`, `updated_at`

Constraints / indexes:
- `UNIQUE(type, name)`
- Index on `(type)` for filtering.

### `source_items`
Represents a single external entity (a file, issue, RSS entry, etc).

Columns:
- `id` UUID PK
- `source_id` UUID FK → `sources(id)` (cascade delete)
- `external_id` TEXT (stable identifier, connector-defined)
- `content_hash` TEXT (sha256 of normalized content)
- `last_seen_at` TIMESTAMPTZ (updated each time the item appears in a sync run)
- `deleted_at` TIMESTAMPTZ NULL (set for soft-delete / missing marking)
- `created_at`, `updated_at`

Constraints / indexes:
- `UNIQUE(source_id, external_id)` (idempotency)
- Index on `(source_id, last_seen_at)`
- Index on `(source_id, deleted_at)`

### `source_item_nodes`
Mapping table from source items to nodes created/owned by that item.

Columns:
- `source_item_id` UUID FK → `source_items(id)` (cascade delete)
- `node_id` UUID FK → `nodes(id)` (cascade delete)
- `created_at` TIMESTAMPTZ

Constraints / indexes:
- `PRIMARY KEY (source_item_id, node_id)`
- Index on `(node_id)` for reverse lookup.

### `sync_runs`
Tracks an ingestion run for a source.

Columns:
- `id` UUID PK
- `source_id` UUID FK → `sources(id)` (cascade delete)
- `started_at` TIMESTAMPTZ
- `completed_at` TIMESTAMPTZ NULL
- `status` TEXT (`success` | `failed` | `partial`)
- `stats` JSONB (created/updated/skipped/deleted + connector-specific counters)
- `error` TEXT NULL

Indexes:
- Index on `(source_id, started_at DESC)`

## Change detection (incremental sync)

For each `(source_id, external_id)`:
- If the `content_hash` is unchanged → the item is `skipped`.
- If the `content_hash` changed → the item is `updated`.
- If no prior row exists → the item is `created`.

## Missing items + delete semantics

During a sync run, ingestion updates `last_seen_at = sync_run.started_at` for every observed item.

After listing completes, “missing” items are those where:
- `source_id = $sourceId`
- `last_seen_at < sync_run.started_at`
- `deleted_at IS NULL` (optional; depends on behavior)

Behavior by mode:
- `none` (default): do nothing.
- `soft`: set `deleted_at = NOW()` on the missing `source_items` (nodes remain).
- `hard`: delete `source_item_nodes` mappings + delete the mapped nodes (and cascading edges).

## Notes
- File + memory backends can store provenance in `metadata` for demos, but Postgres is the canonical durable provenance store.
- The schema is intentionally minimal; future versions can add per-run item logs and richer mapping (edges, attachments).

