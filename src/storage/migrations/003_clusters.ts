import type { Migration } from './runner';

export const migration003: Migration = {
  version: '003',
  name: 'clusters',
  up: `
CREATE TABLE IF NOT EXISTS clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(255) NOT NULL,
  cluster_type VARCHAR(100) DEFAULT 'topic',
  centroid vector(1536),
  member_count INTEGER DEFAULT 0,
  avg_similarity DOUBLE PRECISION,
  cohesion DOUBLE PRECISION,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_recomputed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS cluster_memberships (
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
  similarity_score DOUBLE PRECISION NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (node_id, cluster_id)
);

ALTER TABLE nodes ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS cluster_similarity DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_cluster_memberships_cluster ON cluster_memberships(cluster_id);
CREATE INDEX IF NOT EXISTS idx_nodes_cluster ON nodes(cluster_id);
  `.trim(),
  down: `
DROP TABLE IF EXISTS cluster_memberships;
DROP TABLE IF EXISTS clusters;
ALTER TABLE nodes DROP COLUMN IF EXISTS cluster_id;
ALTER TABLE nodes DROP COLUMN IF EXISTS cluster_similarity;
  `.trim(),
};
