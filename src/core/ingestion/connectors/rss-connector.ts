import type { Connector, ConnectorListOptions, IngestionRecord } from '../types';

export type RssConnectorConfig = {
  url: string;
  headers?: Record<string, string>;
};

const stripCdata = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith('<![CDATA[') && trimmed.endsWith(']]>')) {
    return trimmed.slice('<![CDATA['.length, -']]>'.length);
  }
  return value;
};

const stripHtml = (value: string): string => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const firstTagText = (xml: string, tag: string): string | null => {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(pattern);
  if (!match) return null;
  return stripCdata(match[1] ?? '').trim();
};

const atomLinkHref = (xml: string): string | null => {
  const pattern = /<link\b[^>]*href="([^"]+)"[^>]*\/?>/i;
  const match = xml.match(pattern);
  return match?.[1]?.trim() ?? null;
};

const parseRssItems = (xml: string): Array<{ title: string; link: string | null; id: string | null; updated: Date | null; content: string }> => {
  const items: Array<{ title: string; link: string | null; id: string | null; updated: Date | null; content: string }> = [];
  const pattern = /<item\b[\s\S]*?<\/item>/gi;
  for (const match of xml.matchAll(pattern)) {
    const itemXml = match[0];
    const title = firstTagText(itemXml, 'title') ?? 'Untitled';
    const link = firstTagText(itemXml, 'link');
    const guid = firstTagText(itemXml, 'guid');
    const pubDate = firstTagText(itemXml, 'pubDate') ?? firstTagText(itemXml, 'updated');
    const updated = pubDate ? new Date(pubDate) : null;
    const content =
      firstTagText(itemXml, 'content:encoded') ??
      firstTagText(itemXml, 'description') ??
      '';
    items.push({ title, link, id: guid ?? link, updated: updated && !Number.isNaN(updated.getTime()) ? updated : null, content });
  }
  return items;
};

const parseAtomEntries = (xml: string): Array<{ title: string; link: string | null; id: string | null; updated: Date | null; content: string }> => {
  const entries: Array<{ title: string; link: string | null; id: string | null; updated: Date | null; content: string }> = [];
  const pattern = /<entry\b[\s\S]*?<\/entry>/gi;
  for (const match of xml.matchAll(pattern)) {
    const entryXml = match[0];
    const title = firstTagText(entryXml, 'title') ?? 'Untitled';
    const id = firstTagText(entryXml, 'id');
    const link = atomLinkHref(entryXml) ?? firstTagText(entryXml, 'link');
    const updatedText = firstTagText(entryXml, 'updated') ?? firstTagText(entryXml, 'published');
    const updated = updatedText ? new Date(updatedText) : null;
    const content = firstTagText(entryXml, 'content') ?? firstTagText(entryXml, 'summary') ?? '';
    entries.push({
      title,
      link,
      id: id ?? link,
      updated: updated && !Number.isNaN(updated.getTime()) ? updated : null,
      content,
    });
  }
  return entries;
};

export class RssConnector implements Connector {
  readonly type = 'rss' as const;

  constructor(private config: RssConnectorConfig) {}

  async listRecords(options?: ConnectorListOptions): Promise<IngestionRecord[]> {
    const response = await fetch(this.config.url, {
      headers: this.config.headers,
      signal: options?.signal,
    });
    if (!response.ok) {
      throw new Error(`RssConnector: request failed (${response.status}) ${await response.text()}`);
    }

    const xml = await response.text();
    const isAtom = /<feed\b/i.test(xml) && /<entry\b/i.test(xml);
    const parsed = isAtom ? parseAtomEntries(xml) : parseRssItems(xml);

    const filtered = parsed
      .filter((item) => Boolean(item.id))
      .filter((item) => (options?.since && item.updated ? item.updated >= options.since : true));

    const limited = options?.limit ? filtered.slice(0, Math.max(0, options.limit)) : filtered;

    return limited.map((item) => ({
      externalId: item.id ?? item.link ?? item.title,
      url: item.link ?? undefined,
      title: item.title,
      content: stripHtml(item.content),
      updatedAt: item.updated ?? undefined,
      domain: 'rss',
      nodeType: 'article',
      metadata: {
        link: item.link ?? null,
      },
    }));
  }
}

