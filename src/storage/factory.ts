import type { NeuronConfig } from '../core/types/settings';
import { Database, type DatabaseConfig } from './database';

let singleton: Database | null = null;

export function createDatabase(config: NeuronConfig): Database {
  const dbConfig: DatabaseConfig = {
    connectionString: config.database.url,
    host: config.database.mode === 'docker' ? 'localhost' : undefined,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    pool: config.database.pool,
  };

  return new Database(dbConfig);
}

export function createDatabaseFromEnv(): Database {
  const dbConfig: DatabaseConfig = {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  return new Database(dbConfig);
}

export function getDatabase(config?: DatabaseConfig): Database {
  if (!singleton) {
    singleton = new Database(config ?? {});
  }

  return singleton;
}

export function resetDatabaseSingleton(): void {
  singleton = null;
}
