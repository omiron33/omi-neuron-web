import fs from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import { loadNeuronConfig } from '../utils/config';
import { logger } from '../utils/logger';
import { writeTemplateFile } from '../utils/templates';
import { MigrationRunner } from '../../storage/migrations/runner';
import { createDatabase, createGraphStore } from '../../storage/factory';
import { IngestionEngine, MarkdownConnector, GitHubConnector, RssConnector, NotionExportConnector, MemoryProvenanceStore, PostgresProvenanceStore } from '../../core/ingestion';
import { PostgresGraphStore, FileBackedGraphStore, type GraphStore } from '../../core/store';

const parseSince = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid --since value: ${value}`);
  return date;
};

const ensureConfig = async () => {
  const config = await loadNeuronConfig();
  if (!config) throw new Error('Missing neuron.config.ts. Run `omi-neuron init` first.');
  return config;
};

const flushIfFileStore = async (store: GraphStore) => {
  if (store instanceof FileBackedGraphStore) {
    await store.flush();
  }
};

const runIngestion = async (params: {
  connectorType: 'markdown' | 'github' | 'rss' | 'notion';
  sourceName: string;
  connectorConfig: Record<string, unknown>;
  limit?: number;
  since?: Date;
  dryRun?: boolean;
}) => {
  const config = await ensureConfig();
  const storageMode = config.storage?.mode ?? 'postgres';

  if (storageMode === 'postgres') {
    const db = createDatabase(config);
    const runner = new MigrationRunner(db);
    await runner.up();

    const store = new PostgresGraphStore(db);
    const provenance = new PostgresProvenanceStore(db);
    const engine = new IngestionEngine(store, provenance);

    const connector =
      params.connectorType === 'markdown'
        ? new MarkdownConnector(params.connectorConfig as { path: string })
        : params.connectorType === 'github'
          ? new GitHubConnector(params.connectorConfig as { repo: string; token?: string })
          : params.connectorType === 'rss'
            ? new RssConnector(params.connectorConfig as { url: string })
            : new NotionExportConnector(params.connectorConfig as { path: string });

    const records = await connector.listRecords({ limit: params.limit, since: params.since });
    const result = await engine.ingest(records, {
      source: {
        type: connector.type,
        name: params.sourceName,
        config: params.connectorConfig,
      },
      dryRun: params.dryRun,
    });

    logger.info(`Source: ${connector.type}/${params.sourceName}`);
    logger.info(`Status: ${result.status}`);
    logger.info(
      `Items: ${result.stats.total} (created ${result.stats.created}, updated ${result.stats.updated}, skipped ${result.stats.skipped}, errors ${result.stats.errors})`
    );

    if (result.errors.length) {
      logger.warn(`Errors: ${result.errors.length}`);
    }

    await db.disconnect();
    return;
  }

  const store = createGraphStore(config);
  const provenance = new MemoryProvenanceStore();
  const engine = new IngestionEngine(store, provenance);

  const connector =
    params.connectorType === 'markdown'
      ? new MarkdownConnector(params.connectorConfig as { path: string })
      : params.connectorType === 'github'
        ? new GitHubConnector(params.connectorConfig as { repo: string; token?: string })
        : params.connectorType === 'rss'
          ? new RssConnector(params.connectorConfig as { url: string })
          : new NotionExportConnector(params.connectorConfig as { path: string });

  const records = await connector.listRecords({ limit: params.limit, since: params.since });
  const result = await engine.ingest(records, {
    source: {
      type: connector.type,
      name: params.sourceName,
      config: params.connectorConfig,
    },
    dryRun: params.dryRun,
  });

  logger.info(`Source: ${connector.type}/${params.sourceName}`);
  logger.info(`Status: ${result.status}`);
  logger.info(
    `Items: ${result.stats.total} (created ${result.stats.created}, updated ${result.stats.updated}, skipped ${result.stats.skipped}, errors ${result.stats.errors})`
  );

  await flushIfFileStore(store);
};

const SOURCE_TEMPLATE = `{
  "type": "{{TYPE}}",
  "name": "{{NAME}}",
  "config": {{CONFIG}}
}
`;

export const ingestCommand = new Command('ingest')
  .description('Ingest external sources into the graph')
  .addCommand(
    new Command('init')
      .description('Scaffold a connector source config JSON')
      .argument('<connector>', 'markdown | github | rss | notion')
      .option('--source <name>', 'Source name (provenance identity)', 'default')
      .option('--out <path>', 'Output file', '.neuron/source.json')
      .action(async (connector: string, options) => {
        const type = String(connector);
        const sourceName = String(options.source ?? 'default');

        const config =
          type === 'markdown'
            ? { path: './docs' }
            : type === 'github'
              ? { repo: 'owner/name', token: '${GITHUB_TOKEN}' }
              : type === 'rss'
                ? { url: 'https://example.com/feed.xml' }
                : type === 'notion'
                  ? { path: './notion-export' }
                  : null;

        if (!config) {
          throw new Error(`Unknown connector type: ${type}`);
        }

        await fs.mkdir(path.dirname(path.resolve(options.out)), { recursive: true });
        await writeTemplateFile(
          options.out,
          SOURCE_TEMPLATE,
          {
            TYPE: type,
            NAME: sourceName,
            CONFIG: JSON.stringify(config, null, 2),
          },
          false
        );

        logger.success(`Created ${options.out}`);
        logger.info(`Next: run 'omi-neuron ingest ${type} --source ${sourceName} ...'`);
      })
  )
  .addCommand(
    new Command('markdown')
      .description('Ingest a markdown folder')
      .requiredOption('--source <name>', 'Source name (provenance identity)')
      .requiredOption('--path <dir>', 'Path to markdown folder')
      .option('--limit <n>', 'Limit number of files')
      .option('--since <iso>', 'Only include items updated since this timestamp')
      .option('--dry-run', 'Compute changes without writing')
      .action(async (options) => {
        await runIngestion({
          connectorType: 'markdown',
          sourceName: options.source,
          connectorConfig: { path: options.path },
          limit: options.limit ? Number(options.limit) : undefined,
          since: parseSince(options.since),
          dryRun: Boolean(options.dryRun),
        });
      })
  )
  .addCommand(
    new Command('github')
      .description('Ingest GitHub issues and PRs')
      .requiredOption('--source <name>', 'Source name (provenance identity)')
      .requiredOption('--repo <owner/name>', 'GitHub repository')
      .option('--token <token>', 'GitHub token (falls back to GITHUB_TOKEN)')
      .option('--state <state>', 'open | closed | all', 'open')
      .option('--limit <n>', 'Limit number of items')
      .option('--since <iso>', 'Only include items updated since this timestamp')
      .option('--dry-run', 'Compute changes without writing')
      .action(async (options) => {
        await runIngestion({
          connectorType: 'github',
          sourceName: options.source,
          connectorConfig: {
            repo: options.repo,
            token: options.token,
            state: options.state,
          },
          limit: options.limit ? Number(options.limit) : undefined,
          since: parseSince(options.since),
          dryRun: Boolean(options.dryRun),
        });
      })
  )
  .addCommand(
    new Command('rss')
      .description('Ingest an RSS/Atom feed')
      .requiredOption('--source <name>', 'Source name (provenance identity)')
      .requiredOption('--url <url>', 'Feed URL')
      .option('--limit <n>', 'Limit number of items')
      .option('--since <iso>', 'Only include items updated since this timestamp')
      .option('--dry-run', 'Compute changes without writing')
      .action(async (options) => {
        await runIngestion({
          connectorType: 'rss',
          sourceName: options.source,
          connectorConfig: { url: options.url },
          limit: options.limit ? Number(options.limit) : undefined,
          since: parseSince(options.since),
          dryRun: Boolean(options.dryRun),
        });
      })
  )
  .addCommand(
    new Command('notion')
      .description('Ingest a Notion export folder')
      .requiredOption('--source <name>', 'Source name (provenance identity)')
      .requiredOption('--path <dir>', 'Path to Notion export folder')
      .option('--limit <n>', 'Limit number of items')
      .option('--since <iso>', 'Only include items updated since this timestamp')
      .option('--dry-run', 'Compute changes without writing')
      .action(async (options) => {
        await runIngestion({
          connectorType: 'notion',
          sourceName: options.source,
          connectorConfig: { path: options.path },
          limit: options.limit ? Number(options.limit) : undefined,
          since: parseSince(options.since),
          dryRun: Boolean(options.dryRun),
        });
      })
  );

