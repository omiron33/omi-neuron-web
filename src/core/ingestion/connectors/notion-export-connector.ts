import fs from 'node:fs/promises';
import path from 'node:path';
import type { Connector, ConnectorListOptions, IngestionRecord } from '../types';
import { extractMarkdownLinks } from '../utils/markdown-links';
import { stableSlugBase } from '../utils/slug';

export type NotionExportConnectorConfig = {
  path: string;
};

type NotionFile = {
  absolutePath: string;
  externalId: string;
};

const toPosixPath = (value: string): string => value.split(path.sep).join(path.posix.sep);

const firstHeading = (markdown: string): string | null => {
  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return trimmed.slice(2).trim();
  }
  return null;
};

const listMarkdownFiles = async (root: string): Promise<NotionFile[]> => {
  const results: NotionFile[] = [];

  const walk = async (dir: string) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        const relative = toPosixPath(path.relative(root, abs));
        results.push({ absolutePath: abs, externalId: relative });
      }
    }
  };

  await walk(root);
  return results.sort((a, b) => a.externalId.localeCompare(b.externalId));
};

const tryDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const stripFragment = (value: string): string => value.split('#')[0] ?? value;

const normalizeRelativePath = (currentExternalId: string, target: string): string => {
  const currentDir = path.posix.dirname(currentExternalId);
  const resolved = target.startsWith('/')
    ? target.slice(1)
    : path.posix.join(currentDir, target);
  return path.posix.normalize(resolved);
};

export class NotionExportConnector implements Connector {
  readonly type = 'notion' as const;

  constructor(private config: NotionExportConnectorConfig) {}

  async listRecords(options?: ConnectorListOptions): Promise<IngestionRecord[]> {
    const root = path.resolve(this.config.path);
    const files = await listMarkdownFiles(root);
    const limited = options?.limit ? files.slice(0, Math.max(0, options.limit)) : files;

    const rawRecords: Array<IngestionRecord & { _rawLinks: string[] }> = [];
    for (const file of limited) {
      const stat = await fs.stat(file.absolutePath);
      if (options?.since && stat.mtime < options.since) continue;

      const text = await fs.readFile(file.absolutePath, 'utf8');
      const title = firstHeading(text) || path.posix.basename(file.externalId, '.md');

      rawRecords.push({
        externalId: file.externalId,
        title,
        content: text.trim(),
        updatedAt: stat.mtime,
        metadata: {
          filePath: file.externalId,
        },
        domain: 'notion',
        nodeType: 'document',
        _rawLinks: extractMarkdownLinks(text),
      });
    }

    const byExternalId = new Map<string, string>();
    const bySlug = new Map<string, string>();

    for (const record of rawRecords) {
      byExternalId.set(record.externalId, record.externalId);
      bySlug.set(stableSlugBase(record.title), record.externalId);
      bySlug.set(stableSlugBase(path.posix.basename(record.externalId, '.md')), record.externalId);
    }

    const resolveReference = (current: string, raw: string): string | null => {
      const decoded = tryDecode(raw);
      const withoutFragment = stripFragment(decoded).trim();
      if (!withoutFragment || withoutFragment.startsWith('#')) return null;

      if (
        withoutFragment.includes('/') ||
        withoutFragment.endsWith('.md') ||
        withoutFragment.startsWith('.') ||
        withoutFragment.startsWith('/')
      ) {
        const normalized = normalizeRelativePath(current, withoutFragment);
        if (byExternalId.has(normalized)) return normalized;
        if (!normalized.endsWith('.md') && byExternalId.has(`${normalized}.md`)) return `${normalized}.md`;
        return null;
      }

      return bySlug.get(stableSlugBase(withoutFragment)) ?? null;
    };

    const computeParent = (externalId: string): string | null => {
      const dir = path.posix.dirname(externalId);
      if (!dir || dir === '.' || dir === '/') return null;
      const candidate = `${dir}.md`;
      return byExternalId.has(candidate) ? candidate : null;
    };

    return rawRecords.map(({ _rawLinks, ...record }) => ({
      ...record,
      parentExternalId: computeParent(record.externalId) ?? undefined,
      references: _rawLinks
        .map((raw) => resolveReference(record.externalId, raw))
        .filter((value): value is string => Boolean(value)),
    }));
  }
}

