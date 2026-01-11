import type { Migration } from './runner';

export const migration008: Migration = {
  version: '008',
  name: 'suggested_edges',
  up: `
CREATE TABLE IF NOT EXISTS suggested_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope TEXT NOT NULL DEFAULT 'default',
  from_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100) NOT NULL,
  strength DOUBLE PRECISION DEFAULT 0.5,
  confidence DOUBLE PRECISION NOT NULL,
  reasoning TEXT,
  evidence JSONB DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  source_model VARCHAR(100),
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_reason TEXT,
  approved_edge_id UUID REFERENCES edges(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scope, from_node_id, to_node_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_suggested_edges_scope_status_created ON suggested_edges(scope, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggested_edges_scope_from_node ON suggested_edges(scope, from_node_id);
CREATE INDEX IF NOT EXISTS idx_suggested_edges_scope_to_node ON suggested_edges(scope, to_node_id);
  `.trim(),
  down: `
DROP TABLE IF EXISTS suggested_edges;
  `.trim(),
};

