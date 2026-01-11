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
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';

export interface QueryOptions extends SelectOptions {
  where?: WhereClause;
}

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  constructor(protected db: Database, protected tableName: string) {}

  private withScope(where: WhereClause | undefined, context?: GraphStoreContext): WhereClause {
    const scope = resolveScope(context);
    return { ...(where ?? {}), scope };
  }

  async findById(id: string, context?: GraphStoreContext): Promise<T | null> {
    const { sql, values } = buildSelect(this.tableName, '*', this.withScope({ id }, context));
    const rows = await this.db.query<T>(sql, values);
    return rows[0] ?? null;
  }

  async findAll(options?: QueryOptions, context?: GraphStoreContext): Promise<T[]> {
    const { sql, values } = buildSelect(
      this.tableName,
      '*',
      this.withScope(options?.where, context),
      options
    );
    return this.db.query<T>(sql, values);
  }

  async create(data: CreateDTO, context?: GraphStoreContext): Promise<T> {
    const { sql, values } = buildInsert(this.tableName, {
      ...(data as Record<string, unknown>),
      scope: resolveScope(context),
    });
    const rows = await this.db.query<T>(sql, values);
    return rows[0];
  }

  async update(id: string, data: UpdateDTO, context?: GraphStoreContext): Promise<T | null> {
    const { sql, values } = buildUpdate(this.tableName, data as Record<string, unknown>, this.withScope({ id }, context));
    const rows = await this.db.query<T>(sql, values);
    return rows[0] ?? null;
  }

  async delete(id: string, context?: GraphStoreContext): Promise<boolean> {
    const { sql, values } = buildDelete(this.tableName, this.withScope({ id }, context));
    const count = await this.db.execute(sql, values);
    return count > 0;
  }

  async count(where?: WhereClause, context?: GraphStoreContext): Promise<number> {
    const whereResult = buildWhereClause(this.withScope(where, context));
    const sql = `SELECT COUNT(*)::int as count FROM ${this.tableName} ${whereResult.clause}`;
    const rows = await this.db.query<{ count: number }>(sql, whereResult.values);
    return Number(rows[0]?.count ?? 0);
  }
}
