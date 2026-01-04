import type { Migration } from './runner';

export const migration001: Migration = {
  version: '001',
  name: 'initial_schema',
  up: `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  label VARCHAR(500) NOT NULL,
  node_type VARCHAR(100) NOT NULL DEFAULT 'concept',
  domain VARCHAR(100) NOT NULL DEFAULT 'general',
  summary TEXT,
  description TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  tier VARCHAR(20),
  visual_priority INTEGER DEFAULT 50,
  position_override DOUBLE PRECISION[3],
  connection_count INTEGER DEFAULT 0,
  inbound_count INTEGER DEFAULT 0,
  outbound_count INTEGER DEFAULT 0,
  analysis_status VARCHAR(20) DEFAULT 'pending',
  analysis_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100) NOT NULL DEFAULT 'related_to',
  strength DOUBLE PRECISION DEFAULT 0.5,
  confidence DOUBLE PRECISION DEFAULT 1.0,
  evidence JSONB DEFAULT '[]',
  label VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  source VARCHAR(20) NOT NULL DEFAULT 'manual',
  source_model VARCHAR(100),
  bidirectional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_node_id, to_node_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  visualization JSONB DEFAULT '{}',
  analysis JSONB DEFAULT '{}',
  node_types JSONB DEFAULT '[]',
  domains JSONB DEFAULT '[]',
  relationship_types JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_slug ON nodes(slug);
CREATE INDEX IF NOT EXISTS idx_nodes_domain ON nodes(domain);
CREATE INDEX IF NOT EXISTS idx_nodes_node_type ON nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_analysis_status ON nodes(analysis_status);
CREATE INDEX IF NOT EXISTS idx_edges_from_node ON edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_to_node ON edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_type ON edges(relationship_type);
  `.trim(),
  down: `
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS edges;
DROP TABLE IF EXISTS nodes;
DROP EXTENSION IF EXISTS "uuid-ossp";
  `.trim(),
};
