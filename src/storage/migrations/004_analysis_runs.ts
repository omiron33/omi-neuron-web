import type { Migration } from './runner';

export const migration004: Migration = {
  version: '004',
  name: 'analysis_runs',
  up: `
CREATE TABLE IF NOT EXISTS analysis_runs (
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

CREATE INDEX IF NOT EXISTS idx_analysis_runs_status ON analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_created ON analysis_runs(created_at DESC);
  `.trim(),
  down: `
DROP TABLE IF EXISTS analysis_runs;
  `.trim(),
};
