export type WhereClause = Record<string, unknown>;

export interface SelectOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export const buildWhereClause = (where?: WhereClause, startIndex = 1) => {
  if (!where || Object.keys(where).length === 0) {
    return { clause: '', values: [], nextIndex: startIndex };
  }

  const keys = Object.keys(where);
  const values: unknown[] = [];
  const conditions = keys.map((key, idx) => {
    values.push(where[key]);
    return `${key} = $${startIndex + idx}`;
  });

  return {
    clause: `WHERE ${conditions.join(' AND ')}`,
    values,
    nextIndex: startIndex + keys.length,
  };
};

export const buildInsert = (table: string, data: Record<string, unknown>) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const columns = keys.map((key) => `"${key}"`).join(', ');
  const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');

  return {
    sql: `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values,
  };
};

export const buildUpdate = (
  table: string,
  data: Record<string, unknown>,
  where: WhereClause
) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, idx) => `"${key}" = $${idx + 1}`).join(', ');

  const whereResult = buildWhereClause(where, keys.length + 1);

  return {
    sql: `UPDATE ${table} SET ${setClause} ${whereResult.clause} RETURNING *`,
    values: [...values, ...whereResult.values],
  };
};

export const buildSelect = (
  table: string,
  columns: string[] | '*',
  where?: WhereClause,
  options?: SelectOptions
) => {
  const columnList = columns === '*' ? '*' : columns.map((col) => `"${col}"`).join(', ');
  const whereResult = buildWhereClause(where);
  const orderClause = options?.orderBy
    ? `ORDER BY ${options.orderBy} ${options.orderDirection ?? 'asc'}`
    : '';
  const limitClause = options?.limit ? `LIMIT ${options.limit}` : '';
  const offsetClause = options?.offset ? `OFFSET ${options.offset}` : '';

  return {
    sql: `SELECT ${columnList} FROM ${table} ${whereResult.clause} ${orderClause} ${limitClause} ${offsetClause}`.trim(),
    values: whereResult.values,
  };
};

export const buildDelete = (table: string, where: WhereClause) => {
  const whereResult = buildWhereClause(where);
  return {
    sql: `DELETE FROM ${table} ${whereResult.clause}`,
    values: whereResult.values,
  };
};
