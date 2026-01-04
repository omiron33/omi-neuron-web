import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DockerManager } from '../../storage/docker-manager';
import { Database } from '../../storage/database';
import { MigrationRunner } from '../../storage/migrations/runner';
import { resolveCliConfig } from '../utils/config';
import { logger } from '../utils/logger';

const buildConnectionString = (config: {
  databaseUrl?: string;
  databaseUser?: string;
  databasePassword?: string;
  databaseName?: string;
  port: number;
}) => {
  if (config.databaseUrl) return config.databaseUrl;
  const user = config.databaseUser ?? 'neuron';
  const password = config.databasePassword ?? 'neuron_dev';
  const database = config.databaseName ?? 'neuron_web';
  return `postgresql://${user}:${password}@localhost:${config.port}/${database}`;
};

export const validateCommand = new Command('validate')
  .description('Validate configuration and setup')
  .option('--fix', 'Attempt to fix issues')
  .option('--verbose', 'Show detailed validation')
  .action(async (options) => {
    const config = await resolveCliConfig();
    let hasError = false;

    const configPath = path.resolve('neuron.config.ts');
    try {
      await fs.access(configPath);
      logger.success('neuron.config.ts exists');
    } catch {
      hasError = true;
      logger.error('neuron.config.ts not found');
    }

    try {
      const docker = new DockerManager({ repoName: config.repoName, port: config.port });
      const health = await docker.healthCheck();
      logger.info(`Docker container running: ${health.containerRunning}`);
      logger.info(`Database ready: ${health.databaseReady}`);
    } catch (error) {
      hasError = true;
      logger.error(`Docker check failed: ${String(error)}`);
    }

    try {
      const db = new Database({ connectionString: buildConnectionString(config) });
      await db.connect();
      logger.success('Database connection ok');
      const runner = new MigrationRunner(db);
      const pending = await runner.getPending();
      if (pending.length > 0) {
        logger.warn(`Pending migrations: ${pending.map((m) => m.version).join(', ')}`);
      } else {
        logger.success('Migrations up to date');
      }
    } catch (error) {
      hasError = true;
      logger.error(`Database check failed: ${String(error)}`);
    }

    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OPENAI_API_KEY not set');
      if (options.fix) {
        logger.info('Set OPENAI_API_KEY in your environment to enable analysis');
      }
    }

    if (hasError) {
      process.exitCode = 1;
    }
  });
