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
});
