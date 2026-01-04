import crypto from 'node:crypto';
import type { Database } from '../database';
import { migrations } from './index';

export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
}

export interface MigrationStatus {
  version: string;
  name: string;
  appliedAt: Date | null;
  status: 'applied' | 'pending';
}

export class MigrationRunner {
  constructor(private db: Database) {}

  async getStatus(): Promise<MigrationStatus[]> {
    await this.ensureMigrationTable();
    const applied = await this.getApplied();
    const appliedMap = new Map(applied.map((item) => [item.version, item]));

    return migrations.map((migration) => ({
      version: migration.version,
      name: migration.name,
      appliedAt: appliedMap.get(migration.version)?.appliedAt ?? null,
      status: appliedMap.has(migration.version) ? 'applied' : 'pending',
    }));
  }

  async getPending(): Promise<Migration[]> {
    const status = await this.getStatus();
    return status
      .filter((item) => item.status === 'pending')
      .map((item) => migrations.find((m) => m.version === item.version)!)
      .filter(Boolean);
  }

  async getApplied(): Promise<Array<{ version: string; name: string; appliedAt: Date }>> {
    await this.ensureMigrationTable();
    const rows = await this.db.query<{ version: string; name: string; applied_at: Date }>(
      'SELECT version, name, applied_at FROM neuron_migrations ORDER BY version'
    );
    return rows.map((row) => ({
      version: row.version,
      name: row.name,
      appliedAt: row.applied_at,
    }));
  }

  async up(options?: { to?: string }): Promise<void> {
    const pending = await this.getPending();
    const targetIndex = options?.to
      ? pending.findIndex((m) => m.version === options.to) + 1
      : pending.length;
    const toApply = pending.slice(0, targetIndex > 0 ? targetIndex : pending.length);

    for (const migration of toApply) {
      await this.applyMigration(migration);
    }
  }

  async down(options?: { to?: string; count?: number }): Promise<void> {
    await this.ensureMigrationTable();
    const applied = await this.getApplied();
    const appliedMigrations = applied
      .map((item) => migrations.find((m) => m.version === item.version)!)
      .filter(Boolean);
    const reversed = [...appliedMigrations].reverse();

    let toRollback: Migration[] = [];
    if (options?.to) {
      const idx = reversed.findIndex((m) => m.version === options.to);
      toRollback = idx >= 0 ? reversed.slice(0, idx + 1) : [];
    } else if (options?.count) {
      toRollback = reversed.slice(0, options.count);
    } else {
      toRollback = reversed.slice(0, 1);
    }

    for (const migration of toRollback) {
      await this.rollbackMigration(migration);
    }
  }

  async reset(): Promise<void> {
    await this.down({ count: migrations.length });
    await this.up();
  }

  async dryRun(direction: 'up' | 'down'): Promise<string[]> {
    if (direction === 'up') {
      const pending = await this.getPending();
      return pending.map((m) => m.up);
    }

    const applied = await this.getApplied();
    const appliedMigrations = applied
      .map((item) => migrations.find((m) => m.version === item.version)!)
      .filter(Boolean)
      .reverse();

    return appliedMigrations.map((m) => m.down);
  }

  private async ensureMigrationTable(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS neuron_migrations (
        version VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64)
      );
    `);
  }

  private async applyMigration(migration: Migration): Promise<void> {
    const checksum = this.computeChecksum(migration);
    await this.db.transaction(async (client) => {
      await client.query(migration.up);
      await client.query(
        'INSERT INTO neuron_migrations (version, name, checksum) VALUES ($1, $2, $3)',
        [migration.version, migration.name, checksum]
      );
    });
  }

  private async rollbackMigration(migration: Migration): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query(migration.down);
      await client.query('DELETE FROM neuron_migrations WHERE version = $1', [
        migration.version,
      ]);
    });
  }

  private computeChecksum(migration: Migration): string {
    const hash = crypto.createHash('sha256');
    hash.update(migration.up);
    hash.update(migration.down);
    return hash.digest('hex');
  }
}
