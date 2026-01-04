import { Pool, type PoolClient, type PoolConfig } from 'pg';

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  pool?: {
    min: number;
    max: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
  };
  ssl?: boolean | object;
  slowQueryThresholdMs?: number;
}

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

export class Database {
  private pool: Pool;
  private slowQueryThresholdMs?: number;

  constructor(config: DatabaseConfig) {
    const poolConfig: PoolConfig = {
      connectionString: config.connectionString ?? this.buildConnectionString(config),
      ssl: config.ssl,
      min: config.pool?.min,
      max: config.pool?.max,
      idleTimeoutMillis: config.pool?.idleTimeoutMs,
      connectionTimeoutMillis: config.pool?.connectionTimeoutMs,
    };

    this.pool = new Pool(poolConfig);
    this.slowQueryThresholdMs = config.slowQueryThresholdMs;
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect();
    client.release();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const start = Date.now();
    const result = await this.pool.query(sql, params);
    this.logSlowQuery(sql, Date.now() - start);
    return result.rows as T[];
  }

  async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<number> {
    const start = Date.now();
    const result = await this.pool.query(sql, params);
    this.logSlowQuery(sql, Date.now() - start);
    return result.rowCount ?? 0;
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.queryOne<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1) as exists',
      [tableName]
    );
    return result?.exists ?? false;
  }

  async getPoolStats(): Promise<PoolStats> {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  private buildConnectionString(config: DatabaseConfig): string | undefined {
    if (config.host && config.port && config.user && config.database) {
      const password = config.password ? `:${config.password}` : '';
      return `postgresql://${config.user}${password}@${config.host}:${config.port}/${config.database}`;
    }

    return undefined;
  }

  private logSlowQuery(sql: string, durationMs: number): void {
    if (!this.slowQueryThresholdMs || durationMs < this.slowQueryThresholdMs) {
      return;
    }

    // eslint-disable-next-line no-console
    console.warn(`[omi-neuron] Slow query (${durationMs}ms): ${sql}`);
  }
}
