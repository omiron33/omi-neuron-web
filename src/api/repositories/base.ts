import type { Database } from '../../storage/database';
import {
  buildDelete,
  buildInsert,
  buildSelect,
  buildUpdate,
  buildWhereClause,
  type SelectOptions,
  type WhereClause,
} from '../../storage/query-helpers';

export interface QueryOptions extends SelectOptions {
  where?: WhereClause;
}

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  constructor(protected db: Database, protected tableName: string) {}

  async findById(id: string): Promise<T | null> {
    const { sql, values } = buildSelect(this.tableName, '*', { id });
    const rows = await this.db.query<T>(sql, values);
    return rows[0] ?? null;
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    const { sql, values } = buildSelect(
      this.tableName,
      '*',
      options?.where,
      options
    );
    return this.db.query<T>(sql, values);
  }

  async create(data: CreateDTO): Promise<T> {
    const { sql, values } = buildInsert(this.tableName, data as Record<string, unknown>);
    const rows = await this.db.query<T>(sql, values);
    return rows[0];
  }

  async update(id: string, data: UpdateDTO): Promise<T | null> {
    const { sql, values } = buildUpdate(this.tableName, data as Record<string, unknown>, { id });
    const rows = await this.db.query<T>(sql, values);
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const { sql, values } = buildDelete(this.tableName, { id });
    const count = await this.db.execute(sql, values);
    return count > 0;
  }

  async count(where?: WhereClause): Promise<number> {
    const whereResult = buildWhereClause(where);
    const sql = `SELECT COUNT(*)::int as count FROM ${this.tableName} ${whereResult.clause}`;
    const rows = await this.db.query<{ count: number }>(sql, whereResult.values);
    return Number(rows[0]?.count ?? 0);
  }
}
