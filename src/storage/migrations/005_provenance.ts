import type { Migration } from './runner';

export const migration005: Migration = {
  version: '005',
  name: 'provenance',
  up: `
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type, name)
);

CREATE TABLE IF NOT EXISTS source_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, external_id)
);

CREATE TABLE IF NOT EXISTS source_item_nodes (
  source_item_id UUID NOT NULL REFERENCES source_items(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY(source_item_id, node_id)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'success',
  stats JSONB NOT NULL DEFAULT '{}',
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(type);
CREATE INDEX IF NOT EXISTS idx_source_items_source_seen ON source_items(source_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_source_items_source_deleted ON source_items(source_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_source_item_nodes_node ON source_item_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_source_started ON sync_runs(source_id, started_at DESC);
  `.trim(),
  down: `
DROP TABLE IF EXISTS sync_runs;
DROP TABLE IF EXISTS source_item_nodes;
DROP TABLE IF EXISTS source_items;
DROP TABLE IF EXISTS sources;
  `.trim(),
};
