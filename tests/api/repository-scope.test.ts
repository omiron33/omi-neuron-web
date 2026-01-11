import { describe, expect, it, vi } from 'vitest';
import { BaseRepository } from '../../src/api/repositories/base';

type Row = Record<string, unknown>;

class TestRepository extends BaseRepository<Row, Row, Row> {
  constructor(db: import('../../src/storage/database').Database) {
    super(db, 'widgets');
  }
}

describe('BaseRepository scope enforcement', () => {
  it('adds scope filter to findById', async () => {
    const query = vi.fn(async () => []);
    const execute = vi.fn(async () => 0);
    const db = {
      query,
      execute,
    } as unknown as import('../../src/storage/database').Database;

    const repo = new TestRepository(db);
    await repo.findById('id-1', { scope: 'scope-a' });

    expect(query).toHaveBeenCalledOnce();
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM widgets');
    expect(sql).toContain('scope = $2');
    expect(values).toEqual(['id-1', 'scope-a']);
  });

  it('adds scope filter to findAll', async () => {
    const query = vi.fn(async () => []);
    const execute = vi.fn(async () => 0);
    const db = {
      query,
      execute,
    } as unknown as import('../../src/storage/database').Database;

    const repo = new TestRepository(db);
    await repo.findAll({ where: { domain: 'general' } }, { scope: 'scope-a' });

    expect(query).toHaveBeenCalledOnce();
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM widgets');
    expect(sql).toContain('domain = $1');
    expect(sql).toContain('scope = $2');
    expect(values).toEqual(['general', 'scope-a']);
  });

  it('stamps scope on create', async () => {
    const query = vi.fn(async () => [{ id: 'row-1' }]);
    const execute = vi.fn(async () => 0);
    const db = {
      query,
      execute,
    } as unknown as import('../../src/storage/database').Database;

    const repo = new TestRepository(db);
    await repo.create({ slug: 's1' }, { scope: 'scope-a' });

    expect(query).toHaveBeenCalledOnce();
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO widgets');
    expect(sql).toContain('"scope"');
    expect(values).toContain('scope-a');
  });
});
