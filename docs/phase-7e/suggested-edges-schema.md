# Phase 7E — Suggested Edges Schema (v1)

This document defines the v1 schema for “suggested edges” (governance queue).

Goals:
- Keep inferred relationships out of the main `edges` table until explicitly approved.
- Support a minimal, portable governance workflow:
  - list suggestions
  - approve → creates an edge
  - reject
- Remain compatible with Phase 7D multi-tenancy scoping (`scope`).

## Table: `suggested_edges` (proposed)
Recommended columns:
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `scope TEXT NOT NULL DEFAULT 'default'`
- `from_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE`
- `to_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE`
- `relationship_type VARCHAR(100) NOT NULL`
- `strength DOUBLE PRECISION DEFAULT 0.5`
- `confidence DOUBLE PRECISION NOT NULL`
- `reasoning TEXT` (LLM explanation; safe to display)
- `evidence JSONB DEFAULT '[]'` (structured evidence; safe subset only)
- `status VARCHAR(20) NOT NULL DEFAULT 'pending'` (`pending|approved|rejected`)
- `source_model VARCHAR(100)` (e.g. `gpt-4o-mini`)
- `analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE SET NULL`
- `reviewed_by TEXT NULL` (portable reviewer identifier)
- `reviewed_at TIMESTAMP WITH TIME ZONE NULL`
- `review_reason TEXT NULL` (optional; useful for rejections/audit)
- `approved_edge_id UUID NULL REFERENCES edges(id) ON DELETE SET NULL` (optional linkage when approved)
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
- `updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`

## Indexes
Recommended indexes for common UI queries:
- `INDEX suggested_edges(scope, status, created_at DESC)`
- `INDEX suggested_edges(scope, from_node_id)`
- `INDEX suggested_edges(scope, to_node_id)`

## Dedupe / uniqueness strategy (v1)
To avoid duplicates across repeated inference runs, v1 should prefer dedupe:
- `UNIQUE(scope, from_node_id, to_node_id, relationship_type)`

Behavior implications:
- A new inference for the same pair/type should update the existing row (e.g., confidence/reasoning/evidence) rather than creating duplicates.
- If a suggestion is already `approved` and the corresponding edge exists, inference should skip generating a suggestion for that pair/type.

Alternative (not chosen for v1):
- Allow duplicates per analysis run: `UNIQUE(scope, analysis_run_id, from_node_id, to_node_id, relationship_type)`.

## Status transitions
Allowed transitions (v1):
- `pending → approved`
- `pending → rejected`

Notes:
- `approved` and `rejected` are terminal for v1.
- Future extension: allow “reopen” (rejected → pending) or “superseded” for newer suggestions.

