import type { Migration } from './runner';

export const migration006: Migration = {
  version: '006',
  name: 'scope',
  up: `
-- ============================================================================
-- Scope columns (multi-tenancy)
-- Default scope: 'default'
-- ============================================================================

-- Nodes
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';
ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_nodes_scope_slug_unique ON nodes(scope, slug);
CREATE INDEX IF NOT EXISTS idx_nodes_scope_domain ON nodes(scope, domain);
CREATE INDEX IF NOT EXISTS idx_nodes_scope_node_type ON nodes(scope, node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_scope_analysis_status ON nodes(scope, analysis_status);

-- Edges
ALTER TABLE edges ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';
ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_from_node_id_to_node_id_relationship_type_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_edges_scope_from_to_type_unique ON edges(scope, from_node_id, to_node_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_edges_scope_from_node ON edges(scope, from_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_scope_to_node ON edges(scope, to_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_scope_type ON edges(scope, relationship_type);

-- Clusters + memberships
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';
ALTER TABLE cluster_memberships ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_clusters_scope ON clusters(scope);
CREATE INDEX IF NOT EXISTS idx_cluster_memberships_scope_cluster ON cluster_memberships(scope, cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_memberships_scope_node ON cluster_memberships(scope, node_id);

-- Analysis runs
ALTER TABLE analysis_runs ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_analysis_runs_scope_created ON analysis_runs(scope, created_at DESC);

-- Provenance / ingestion tables
ALTER TABLE sources ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';
ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_type_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_scope_type_name_unique ON sources(scope, type, name);
CREATE INDEX IF NOT EXISTS idx_sources_scope_type ON sources(scope, type);

ALTER TABLE source_items ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';
ALTER TABLE source_item_nodes ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_source_items_scope_source_seen ON source_items(scope, source_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_source_items_scope_source_deleted ON source_items(scope, source_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_sync_runs_scope_source_started ON sync_runs(scope, source_id, started_at DESC);
  `.trim(),
  down: `
-- Best-effort rollback. This may fail if multi-scope duplicates exist.

-- Provenance
DROP INDEX IF EXISTS idx_sync_runs_scope_source_started;
DROP INDEX IF EXISTS idx_source_items_scope_source_deleted;
DROP INDEX IF EXISTS idx_source_items_scope_source_seen;

ALTER TABLE sync_runs DROP COLUMN IF EXISTS scope;
ALTER TABLE source_item_nodes DROP COLUMN IF EXISTS scope;
ALTER TABLE source_items DROP COLUMN IF EXISTS scope;

DROP INDEX IF EXISTS idx_sources_scope_type;
DROP INDEX IF EXISTS idx_sources_scope_type_name_unique;
ALTER TABLE sources ADD CONSTRAINT sources_type_name_key UNIQUE (type, name);
ALTER TABLE sources DROP COLUMN IF EXISTS scope;

-- Analysis runs
DROP INDEX IF EXISTS idx_analysis_runs_scope_created;
ALTER TABLE analysis_runs DROP COLUMN IF EXISTS scope;

-- Clusters
DROP INDEX IF EXISTS idx_cluster_memberships_scope_node;
DROP INDEX IF EXISTS idx_cluster_memberships_scope_cluster;
DROP INDEX IF EXISTS idx_clusters_scope;
ALTER TABLE cluster_memberships DROP COLUMN IF EXISTS scope;
ALTER TABLE clusters DROP COLUMN IF EXISTS scope;

-- Edges
DROP INDEX IF EXISTS idx_edges_scope_type;
DROP INDEX IF EXISTS idx_edges_scope_to_node;
DROP INDEX IF EXISTS idx_edges_scope_from_node;
DROP INDEX IF EXISTS idx_edges_scope_from_to_type_unique;
ALTER TABLE edges ADD CONSTRAINT edges_from_node_id_to_node_id_relationship_type_key UNIQUE (from_node_id, to_node_id, relationship_type);
ALTER TABLE edges DROP COLUMN IF EXISTS scope;

-- Nodes
DROP INDEX IF EXISTS idx_nodes_scope_analysis_status;
DROP INDEX IF EXISTS idx_nodes_scope_node_type;
DROP INDEX IF EXISTS idx_nodes_scope_domain;
DROP INDEX IF EXISTS idx_nodes_scope_slug_unique;
ALTER TABLE nodes ADD CONSTRAINT nodes_slug_key UNIQUE (slug);
ALTER TABLE nodes DROP COLUMN IF EXISTS scope;
  `.trim(),
};

