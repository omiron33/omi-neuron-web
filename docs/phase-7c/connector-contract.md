# Connector Contract (Phase 7C.4)

This document defines the connector interfaces used by Phase 7C ingestion.

Design goals:
- **Deterministic + idempotent**: connectors must provide stable identities so ingestion can upsert safely.
- **Separation of concerns**: connectors *extract + normalize*; ingestion *writes* to `GraphStore` and provenance.
- **Safe by default**: connectors never delete data; delete behavior is controlled by ingestion flags.

## Core terms

See `docs/phase-7c/ingestion-model.md` for the canonical ingestion model.

## Connector responsibilities (v1)

A connector is responsible for:
- Defining a connector `type` and validating its config.
- Listing external items (`externalId` must be stable).
- Fetching the content/metadata for each external item.
- Normalizing items into a connector-agnostic record shape for ingestion.

A connector is **not** responsible for:
- Writing to the graph store.
- Managing provenance tables directly.
- Performing destructive actions.

## Interfaces (conceptual)

### `ConnectorDefinition`
Each connector exposes:
- `type`: unique identifier (`markdown` | `github` | `rss` | `notion`)
- `displayName`: human label
- `configSchema`: a Zod schema for runtime validation
- `create(config)`: returns a concrete `Connector` instance

### `Connector`
Required methods:
- `listItems(options)`: list external item references.
- `fetchItem(ref, options)`: fetch the full item content (or enough to build a record).
- `toRecord(item)`: normalize to an `IngestionRecord`.

Optional:
- `resolveLink(link)`: map a parsed link/reference into a connector-specific `externalId` (used for edges).

### `IngestionRecord`
This is the normalized, connector-agnostic output consumed by the ingestion engine.

Required:
- `externalId: string` (stable, deterministic)
- `title: string`
- `content: string` (raw or lightly normalized; used for hashing and embeddings later)

Recommended:
- `url?: string`
- `updatedAt?: Date`
- `metadata?: Record<string, unknown>` (connector-specific details, labels, author, etc.)
- `nodeType?: string` (defaults applied by ingestion)
- `domain?: string` (defaults applied by ingestion)

Relationships (v1 best-effort):
- `references?: string[]` — a list of connector-resolved external IDs that this item links to.
- `parentExternalId?: string` — for hierarchy sources (e.g., Notion export).

## Error handling + partial failures

Connectors should throw regular `Error`s with human-friendly messages.

Ingestion behavior:
- A single item failure should not abort the whole run by default; mark the run as `partial` and continue.
- A connector can surface a fatal error (auth, invalid config) by failing early before listing items.

## Idempotency guarantees required from connectors

Connectors must ensure:
- `externalId` is stable across time.
- `references` contains stable identifiers (not transient display strings).
- Record normalization is consistent (avoid adding timestamps to `content`).

Ingestion uses:
- `contentHash` for change detection (computed from `title + content + stable metadata`).
- Source-aware slugging so node uniqueness is preserved across sources.

