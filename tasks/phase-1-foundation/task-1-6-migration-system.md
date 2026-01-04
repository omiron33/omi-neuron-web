---
title: Database Migration System
status: not_started
priority: 1
labels:
  - 'Phase:1-Foundation'
  - 'Type:Database'
assignees:
  - CodingAgent
depends_on:
  - task-1-5-postgres-client
---

# Task 1.6: Migration System

## Objective
Build a database migration system that manages schema versions, runs up/down migrations, and tracks migration history.

## Requirements

### 1. Migration Runner (`src/storage/migrations/runner.ts`)

```typescript
interface Migration {
  version: string;        // e.g., "001"
  name: string;           // e.g., "initial_schema"
  up: string;             // SQL for upgrade
  down: string;           // SQL for rollback
}

interface MigrationStatus {
  version: string;
  name: string;
  appliedAt: Date | null;
  status: 'applied' | 'pending';
}

class MigrationRunner {
  constructor(db: Database);
  
  async getStatus(): Promise<MigrationStatus[]>;
  async getPending(): Promise<Migration[]>;
  async getApplied(): Promise<Migration[]>;
  
  async up(options?: { to?: string }): Promise<void>;
  async down(options?: { to?: string; count?: number }): Promise<void>;
  async reset(): Promise<void>;
  
  async dryRun(direction: 'up' | 'down'): Promise<string[]>; // SQL to execute
}
```

### 2. Migration Table
```sql
CREATE TABLE IF NOT EXISTS neuron_migrations (
  version VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(64)
);
```

### 3. Migration: 001_initial_schema

```sql
-- UP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE nodes (
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

CREATE TABLE edges (
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

CREATE TABLE settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  visualization JSONB DEFAULT '{}',
  analysis JSONB DEFAULT '{}',
  node_types JSONB DEFAULT '[]',
  domains JSONB DEFAULT '[]',
  relationship_types JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_nodes_slug ON nodes(slug);
CREATE INDEX idx_nodes_domain ON nodes(domain);
CREATE INDEX idx_nodes_node_type ON nodes(node_type);
CREATE INDEX idx_nodes_analysis_status ON nodes(analysis_status);
CREATE INDEX idx_edges_from_node ON edges(from_node_id);
CREATE INDEX idx_edges_to_node ON edges(to_node_id);
CREATE INDEX idx_edges_type ON edges(relationship_type);

-- DOWN
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS edges;
DROP TABLE IF EXISTS nodes;
DROP EXTENSION IF EXISTS "uuid-ossp";
```

### 4. Migration: 002_embeddings

```sql
-- UP
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE nodes ADD COLUMN embedding vector(1536);
ALTER TABLE nodes ADD COLUMN embedding_model VARCHAR(100);
ALTER TABLE nodes ADD COLUMN embedding_generated_at TIMESTAMP WITH TIME ZONE;

-- HNSW index for fast similarity search
CREATE INDEX idx_nodes_embedding ON nodes 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- DOWN
DROP INDEX IF EXISTS idx_nodes_embedding;
ALTER TABLE nodes DROP COLUMN IF EXISTS embedding;
ALTER TABLE nodes DROP COLUMN IF EXISTS embedding_model;
ALTER TABLE nodes DROP COLUMN IF EXISTS embedding_generated_at;
DROP EXTENSION IF EXISTS vector;
```

### 5. Migration: 003_clusters

```sql
-- UP
CREATE TABLE clusters (
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

CREATE TABLE cluster_memberships (
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
  similarity_score DOUBLE PRECISION NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (node_id, cluster_id)
);

ALTER TABLE nodes ADD COLUMN cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL;
ALTER TABLE nodes ADD COLUMN cluster_similarity DOUBLE PRECISION;

CREATE INDEX idx_cluster_memberships_cluster ON cluster_memberships(cluster_id);
CREATE INDEX idx_nodes_cluster ON nodes(cluster_id);

-- DOWN
DROP TABLE IF EXISTS cluster_memberships;
DROP TABLE IF EXISTS clusters;
ALTER TABLE nodes DROP COLUMN IF EXISTS cluster_id;
ALTER TABLE nodes DROP COLUMN IF EXISTS cluster_similarity;
```

### 6. Migration: 004_analysis_runs

```sql
-- UP
CREATE TABLE analysis_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_type VARCHAR(50) NOT NULL,
  input_params JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analysis_runs_status ON analysis_runs(status);
CREATE INDEX idx_analysis_runs_created ON analysis_runs(created_at DESC);

-- DOWN
DROP TABLE IF EXISTS analysis_runs;
```

## Deliverables
- [ ] `src/storage/migrations/runner.ts`
- [ ] `src/storage/migrations/001_initial_schema.ts`
- [ ] `src/storage/migrations/002_embeddings.ts`
- [ ] `src/storage/migrations/003_clusters.ts`
- [ ] `src/storage/migrations/004_analysis_runs.ts`
- [ ] `src/storage/migrations/index.ts`

## Acceptance Criteria
- Migrations run in order
- Rollbacks work correctly
- Status shows applied/pending
- Dry run shows SQL without executing
- Checksums detect modified migrations
- Transactions wrap each migration

## Notes
- pgvector extension must be available in image
- Use vector(1536) for OpenAI ada-002 embeddings
- HNSW index for fast similarity search
- All tables have timestamps for auditing

