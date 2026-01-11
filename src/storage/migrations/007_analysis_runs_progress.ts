import type { Migration } from './runner';

export const migration007: Migration = {
  version: '007',
  name: 'analysis_runs_progress',
  up: `
ALTER TABLE analysis_runs
  ADD COLUMN IF NOT EXISTS progress_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE analysis_runs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE analysis_runs
  SET updated_at = created_at
  WHERE updated_at IS NULL;
  `.trim(),
  down: `
ALTER TABLE analysis_runs DROP COLUMN IF EXISTS progress_snapshot;
ALTER TABLE analysis_runs DROP COLUMN IF EXISTS updated_at;
  `.trim(),
};

