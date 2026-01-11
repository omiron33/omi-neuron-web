# Phase 7D — Scoping Schema (v1)

This document defines how **tenant/workspace scoping** is stored and enforced.

## Decision: `scope` (string)
We use a single scoping key: `scope: string`.

- Default scope: `"default"`
- Primary transport: `x-neuron-scope` request header
- Optional: consumer-provided `resolveScope(request)` hook

## Entities that are scoped
Scoped entities must be isolated across scopes:
- Nodes (`nodes`)
- Edges (`edges`)
- Clusters + memberships (`clusters`, `cluster_memberships`)
- Analysis runs (`analysis_runs`)
- Provenance / ingestion tables:
  - `sources`
  - `source_items`
  - `source_item_nodes`
  - `sync_runs`
- Settings are treated as **per-scope** using `settings.id = scope` (no schema change required).

## Postgres schema changes (migration plan)
### Columns
Add a `scope` column with default:
- `scope TEXT NOT NULL DEFAULT 'default'`

### Indexes
Add indexes to keep scoped queries fast:
- `nodes(scope, slug)` unique (replaces global slug uniqueness)
- `nodes(scope, domain)`
- `edges(scope, from_node_id)`
- `edges(scope, to_node_id)`
- `clusters(scope)`
- `analysis_runs(scope, created_at)`
- `sources(scope, type, name)` unique (replaces global type/name uniqueness)

### Uniqueness strategy
To allow the same slug across different tenants:
- Drop `nodes.slug UNIQUE`
- Add `UNIQUE(scope, slug)`

For edges:
- Replace `UNIQUE(from_node_id, to_node_id, relationship_type)` with `UNIQUE(scope, from_node_id, to_node_id, relationship_type)`

## Local-first backends
For `storage.mode = 'memory' | 'file'`, scope is enforced in the GraphStore layer:
- Nodes/edges are stored with an internal scope value.
- All reads/writes filter/stamp by scope.

## Settings scoping
Settings are per-scope using the existing schema:
- `settings.id` is treated as the `scope` key.
- `"default"` remains the implicit single-tenant behavior.

