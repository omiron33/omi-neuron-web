import type { Migration } from './runner';
import { migration001 } from './001_initial_schema';
import { migration002 } from './002_embeddings';
import { migration003 } from './003_clusters';
import { migration004 } from './004_analysis_runs';

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
];

export * from './runner';
export * from './001_initial_schema';
export * from './002_embeddings';
export * from './003_clusters';
export * from './004_analysis_runs';
