import type { Connector, ConnectorListOptions, IngestionRecord } from '../types';

export type GitHubConnectorConfig = {
  repo: string; // owner/name
  token?: string;
  state?: 'open' | 'closed' | 'all';
  apiBaseUrl?: string;
};

type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  updated_at: string;
  created_at: string;
  pull_request?: Record<string, unknown>;
  user?: { login?: string } | null;
  labels?: Array<string | { name?: string }>;
};

const parseRepo = (repo: string): { owner: string; name: string } => {
  const [owner, name] = repo.split('/');
  if (!owner || !name) throw new Error(`GitHubConnector: invalid repo "${repo}" (expected owner/name)`);
  return { owner, name };
};

const asLabel = (label: string | { name?: string }): string =>
  typeof label === 'string' ? label : (label.name ?? '');

const extractIssueNumberRefs = (text: string): number[] => {
  const refs = new Set<number>();
  const pattern = /(^|[^\w])#(\d+)\b/g;
  for (const match of text.matchAll(pattern)) {
    const num = Number(match[2]);
    if (Number.isFinite(num)) refs.add(num);
  }
  return [...refs];
};

const extractGitHubUrls = (text: string): string[] => {
  const urls = new Set<string>();
  const pattern = /https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(?:issues|pull)\/\d+/g;
  for (const match of text.matchAll(pattern)) {
    urls.add(match[0]);
  }
  return [...urls];
};

export class GitHubConnector implements Connector {
  readonly type = 'github' as const;

  constructor(private config: GitHubConnectorConfig) {}

  async listRecords(options?: ConnectorListOptions): Promise<IngestionRecord[]> {
    const { owner, name } = parseRepo(this.config.repo);
    const apiBaseUrl = this.config.apiBaseUrl ?? 'https://api.github.com';
    const state = this.config.state ?? 'open';

    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
    };
    const token = this.config.token ?? process.env.GITHUB_TOKEN;
    if (token) headers.authorization = `Bearer ${token}`;

    const records: IngestionRecord[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = new URL(`${apiBaseUrl}/repos/${owner}/${name}/issues`);
      url.searchParams.set('state', state);
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));
      if (options?.since) url.searchParams.set('since', options.since.toISOString());

      const response = await fetch(url, { headers, signal: options?.signal });
      if (!response.ok) {
        throw new Error(`GitHubConnector: request failed (${response.status}) ${await response.text()}`);
      }

      const batch = (await response.json()) as GitHubIssue[];
      if (!Array.isArray(batch) || batch.length === 0) break;

      for (const item of batch) {
        const isPullRequest = Boolean(item.pull_request);
        const nodeType = isPullRequest ? 'pull_request' : 'issue';

        records.push({
          externalId: item.html_url,
          url: item.html_url,
          title: `${owner}/${name}#${item.number}: ${item.title}`,
          content: item.body ?? '',
          updatedAt: new Date(item.updated_at),
          domain: 'github',
          nodeType,
          metadata: {
            repo: `${owner}/${name}`,
            number: item.number,
            state: item.state,
            author: item.user?.login ?? null,
            labels: (item.labels ?? []).map(asLabel).filter(Boolean),
          },
        });

        if (options?.limit && records.length >= options.limit) break;
      }

      if (options?.limit && records.length >= options.limit) break;
      page += 1;
    }

    const numberToExternalId = new Map<number, string>();
    records.forEach((r) => {
      const number = (r.metadata?.number as number | undefined) ?? undefined;
      if (typeof number === 'number') numberToExternalId.set(number, r.externalId);
    });

    const byUrl = new Map<string, IngestionRecord>();
    records.forEach((r) => byUrl.set(r.externalId, r));

    return records.map((record) => {
      const text = `${record.title}\n${record.content}`;
      const refs = extractIssueNumberRefs(text)
        .map((n) => numberToExternalId.get(n))
        .filter((value): value is string => Boolean(value));
      const urls = extractGitHubUrls(text).filter((u) => byUrl.has(u));
      return {
        ...record,
        references: [...new Set([...refs, ...urls].filter((id) => id !== record.externalId))],
      };
    });
  }
}

