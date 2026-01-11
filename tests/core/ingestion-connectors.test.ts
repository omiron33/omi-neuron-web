import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MarkdownConnector,
  NotionExportConnector,
  RssConnector,
  GitHubConnector,
  buildSourceAwareSlug,
  hashIngestionRecord,
} from '../../src/core/ingestion';

const fixturePath = (...parts: string[]) =>
  path.join(process.cwd(), 'tests', 'fixtures', ...parts);

describe('ingestion utils', () => {
  it('buildSourceAwareSlug is deterministic and source-aware', () => {
    const a = buildSourceAwareSlug({
      title: 'Hello World',
      sourceKey: 'markdown:docs',
      externalId: 'alpha.md',
    });
    const b = buildSourceAwareSlug({
      title: 'Hello World',
      sourceKey: 'markdown:docs',
      externalId: 'alpha.md',
    });
    const c = buildSourceAwareSlug({
      title: 'Hello World',
      sourceKey: 'markdown:docs',
      externalId: 'beta.md',
    });
    const d = buildSourceAwareSlug({
      title: 'Hello World',
      sourceKey: 'markdown:other',
      externalId: 'alpha.md',
    });

    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
    expect(a.length).toBeLessThanOrEqual(255);
  });

  it('hashIngestionRecord is stable for equivalent inputs', () => {
    const hash1 = hashIngestionRecord({
      externalId: 'x',
      title: 'T',
      content: 'C',
      metadata: { b: 2, a: 1 },
      references: ['b', 'a'],
    });
    const hash2 = hashIngestionRecord({
      externalId: 'x',
      title: 'T',
      content: 'C',
      metadata: { a: 1, b: 2 },
      references: ['b', 'a'],
    });
    expect(hash1).toBe(hash2);
  });
});

describe('MarkdownConnector', () => {
  it('scans markdown fixtures and resolves best-effort references', async () => {
    const connector = new MarkdownConnector({ path: fixturePath('ingestion', 'markdown') });
    const records = await connector.listRecords();

    expect(records.map((r) => r.externalId).sort()).toEqual([
      'alpha.md',
      'beta.md',
      'folder/gamma.md',
    ]);

    const alpha = records.find((r) => r.externalId === 'alpha.md');
    expect(alpha?.references?.sort()).toEqual(['beta.md', 'folder/gamma.md']);

    const beta = records.find((r) => r.externalId === 'beta.md');
    expect(beta?.references).toEqual(['alpha.md']);
  });
});

describe('NotionExportConnector', () => {
  it('adds parentExternalId based on folder hierarchy when a matching parent file exists', async () => {
    const connector = new NotionExportConnector({ path: fixturePath('ingestion', 'notion') });
    const records = await connector.listRecords();

    const child = records.find((r) => r.externalId === 'Parent/Child.md');
    expect(child?.parentExternalId).toBe('Parent.md');
  });
});

describe('RssConnector', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses an RSS fixture and uses guid/link for externalId', async () => {
    const xml = await fs.readFile(fixturePath('ingestion', 'rss', 'sample.xml'), 'utf8');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(xml, { status: 200 }))
    );

    const connector = new RssConnector({ url: 'https://example.com/feed.xml' });
    const records = await connector.listRecords();

    expect(records[0]?.externalId).toBe('item-1');
    expect(records[1]?.externalId).toBe('https://example.com/two');
    expect(records[0]?.content).toContain('Hello world');
  });
});

describe('GitHubConnector', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses issue/PR fixtures and resolves #number references within the same repo batch', async () => {
    const page1 = await fs.readFile(fixturePath('ingestion', 'github', 'issues-page-1.json'), 'utf8');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(typeof input === 'string' ? input : input.toString());
        const page = url.searchParams.get('page');
        if (page === '1') {
          return new Response(page1, { status: 200 });
        }
        return new Response('[]', { status: 200 });
      })
    );

    const connector = new GitHubConnector({ repo: 'acme/example' });
    const records = await connector.listRecords();

    const issue1 = records.find((r) => r.externalId.endsWith('/issues/1'));
    const pr2 = records.find((r) => r.externalId.endsWith('/pull/2'));

    expect(issue1?.references).toContain(pr2?.externalId);
    expect(pr2?.references).toContain(issue1?.externalId);
  });
});

