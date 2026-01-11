import type { Migration } from './runner';
import { migration001 } from './001_initial_schema';
import { migration002 } from './002_embeddings';
import { migration003 } from './003_clusters';
import { migration004 } from './004_analysis_runs';
import { migration005 } from './005_provenance';
import { migration006 } from './006_scope';
import { migration007 } from './007_analysis_runs_progress';
import { migration008 } from './008_suggested_edges';

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
];

export * from './runner';
export * from './001_initial_schema';
export * from './002_embeddings';
export * from './003_clusters';
export * from './004_analysis_runs';
export * from './005_provenance';
export * from './006_scope';
export * from './007_analysis_runs_progress';
export * from './008_suggested_edges';
