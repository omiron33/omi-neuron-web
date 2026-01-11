# Sync safety rails (Phase 7C.7)

Ingestion is powerful and potentially destructive. v1 must be safe by default.

## Default behavior
- Idempotent upsert behavior is always enabled.
- Missing external items never delete anything unless explicitly requested.
- Partial failures should not corrupt provenance: a run can be marked `partial` and still record successful items.

## Dry-run
`--dry-run` must:
- perform listing + change detection
- compute the intended actions (create/update/skip/delete)
- print a summary
- write nothing to the store or provenance tables

## Destructive operations require explicit confirmation

Destructive operations include:
- `--delete-missing` (soft/hard)
- any “hard” delete of mapped nodes

Safety rails:
- require explicit flags (`--delete-missing --delete-mode hard`)
- print an exact count of items/nodes that would be affected
- require an interactive confirmation (unless a `--yes` flag is provided for CI)

## Idempotent identity + conflict strategy

### Slugs
To avoid collisions:
- slugs should include a stable short hash of `(sourceId + externalId)`
- do not rely on `title` alone

### Updates
When an item changes:
- update node content fields and metadata
- keep the node ID stable
- re-apply edges owned by the item deterministically (delete/recreate for that item is acceptable in v1)

### Skips
When `contentHash` is unchanged:
- do not update `updatedAt` or node content fields
- still update `last_seen_at` on the `source_item`

## Reporting
Every run should record:
- a `sync_run` row with status + stats
- per-item errors aggregated (v1 can store summarized errors; detailed per-item logs can be added later)

