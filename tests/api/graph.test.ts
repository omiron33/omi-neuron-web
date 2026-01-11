import { describe, it, expect } from 'vitest';
import { GraphQueryBuilder } from '../../src/api/query-builder';

const mockDb = {
  query: async () => [],
} as unknown as import('../../src/storage/database').Database;

describe('GraphQueryBuilder', () => {
  it('builds graph query', () => {
    const builder = new GraphQueryBuilder(mockDb);
    const { sql } = builder.buildGraphQuery({ domains: ['general'] });
    expect(sql).toContain('filtered_nodes');
  });

  it('injects default scope filter when no context is provided', () => {
    const builder = new GraphQueryBuilder(mockDb);
    const { sql, values } = builder.buildGraphQuery({});
    expect(sql).toContain('scope = $1');
    expect(values[0]).toBe('default');
  });

  it('uses provided scope in query context', () => {
    const builder = new GraphQueryBuilder(mockDb);
    const { sql, values } = builder.buildGraphQuery({}, { scope: 'scope-a' });
    expect(sql).toContain('scope = $1');
    expect(values[0]).toBe('scope-a');
  });
});
