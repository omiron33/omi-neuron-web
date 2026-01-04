import type { Migration } from './runner';

export const migration002: Migration = {
  version: '002',
  name: 'embeddings',
  up: `
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE nodes ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_nodes_embedding ON nodes
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
  `.trim(),
  down: `
DROP INDEX IF EXISTS idx_nodes_embedding;
ALTER TABLE nodes DROP COLUMN IF EXISTS embedding;
ALTER TABLE nodes DROP COLUMN IF EXISTS embedding_model;
ALTER TABLE nodes DROP COLUMN IF EXISTS embedding_generated_at;
DROP EXTENSION IF EXISTS vector;
  `.trim(),
};
