---
title: PostgreSQL Client with Connection Pooling
status: completed
priority: 1
labels:
  - 'Phase:1-Foundation'
  - 'Type:Database'
assignees:
  - CodingAgent
depends_on:
  - task-1-4-docker-manager
---

# Task 1.5: PostgreSQL Client

## Objective
Build a PostgreSQL client wrapper using the `pg` library with connection pooling, transaction support, and query helpers.

## Requirements

### 1. Database Client (`src/storage/database.ts`)

```typescript
interface DatabaseConfig {
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
}

class Database {
  private pool: Pool;
  
  constructor(config: DatabaseConfig);
  
  // Connection
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  async isConnected(): Promise<boolean>;
  
  // Queries
  async query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  async execute(sql: string, params?: unknown[]): Promise<number>; // affected rows
  
  // Transactions
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
  
  // Utilities
  async tableExists(tableName: string): Promise<boolean>;
  async getPoolStats(): Promise<PoolStats>;
}
```

### 2. Connection Pool Management
- [ ] Configure pool with min/max connections
- [ ] Handle idle timeout
- [ ] Handle connection timeout
- [ ] Graceful shutdown with drain

### 3. Query Helpers
- [ ] Parameterized query execution
- [ ] Single result fetch
- [ ] Multi-result fetch
- [ ] Row count for mutations

### 4. Transaction Support
- [ ] Begin transaction
- [ ] Commit on success
- [ ] Rollback on error
- [ ] Nested transaction warning

### 5. Database Factory (`src/storage/factory.ts`)

```typescript
// Create database from config file
function createDatabase(config: NeuronConfig): Database;

// Create database from environment
function createDatabaseFromEnv(): Database;

// Get singleton instance
function getDatabase(): Database;
```

### 6. Query Builder Helpers (`src/storage/query-helpers.ts`)
- [ ] `buildInsert(table, data)` - Generate INSERT with RETURNING
- [ ] `buildUpdate(table, data, where)` - Generate UPDATE
- [ ] `buildSelect(table, columns, where, options)` - Generate SELECT
- [ ] `buildDelete(table, where)` - Generate DELETE
- [ ] Parameter placeholder generation ($1, $2, etc.)

## Deliverables
- [ ] `src/storage/database.ts`
- [ ] `src/storage/factory.ts`
- [ ] `src/storage/query-helpers.ts`
- [ ] `src/storage/index.ts` (exports)

## Acceptance Criteria
- Pool connects to PostgreSQL
- Queries return typed results
- Transactions commit/rollback correctly
- Pool drains on shutdown
- Error handling is consistent
- SSL connections supported

## Example Usage

```typescript
import { getDatabase } from 'omi-neuron-web/storage';

const db = getDatabase();

// Simple query
const nodes = await db.query<NeuronNode>(
  'SELECT * FROM nodes WHERE domain = $1',
  ['technology']
);

// Transaction
await db.transaction(async (client) => {
  await client.query('INSERT INTO nodes ...');
  await client.query('INSERT INTO edges ...');
});
```

## Notes
- Use `pg` library (already installed)
- Connection string format: `postgresql://user:pass@host:port/db`
- Handle pgvector types properly
- Log slow queries (configurable threshold)

