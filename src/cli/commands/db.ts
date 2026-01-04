import { Command } from 'commander';
import { DockerManager } from '../../storage/docker-manager';
import { Database } from '../../storage/database';
import { MigrationRunner } from '../../storage/migrations/runner';
import { resolveCliConfig } from '../utils/config';
import { logger } from '../utils/logger';
import { confirmPrompt } from '../utils/prompts';
import { Spinner } from '../utils/spinner';

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

export const dbCommand = new Command('db')
  .description('Database management commands')
  .addCommand(
    new Command('up')
      .description('Start PostgreSQL container')
      .option('--port <port>', 'Override port')
      .option('--force-recreate', 'Force recreate container')
      .option('--wait', 'Wait for readiness', true)
      .action(async (options) => {
        const config = await resolveCliConfig({
          port: options.port ? Number(options.port) : undefined,
        });
        const docker = new DockerManager({
          repoName: config.repoName,
          port: config.port,
          containerName: config.containerName,
          user: config.databaseUser,
          password: config.databasePassword,
          database: config.databaseName,
        });
        const spinner = new Spinner('Starting PostgreSQL container');
        spinner.start();
        await docker.start({
          forceRecreate: options.forceRecreate,
          waitForReady: options.wait,
        });
        spinner.stop(true, 'Database ready');
        const connectionString = await docker.getConnectionString();
        logger.info(`Connection string: ${connectionString}`);
      })
  )
  .addCommand(
    new Command('down')
      .description('Stop PostgreSQL container')
      .option('--remove-volumes', 'Remove volumes (destructive)')
      .action(async (options) => {
        const config = await resolveCliConfig();
        const docker = new DockerManager({
          repoName: config.repoName,
          port: config.port,
          containerName: config.containerName,
        });
        await docker.stop({ removeVolumes: options.removeVolumes });
        logger.success('Database container stopped');
      })
  )
  .addCommand(
    new Command('migrate')
      .description('Run migrations')
      .option('--status', 'Show status only')
      .option('--rollback <count>', 'Rollback N migrations')
      .option('--to <version>', 'Migrate to specific version')
      .option('--dry-run', 'Show SQL without executing')
      .action(async (options) => {
        const config = await resolveCliConfig();
        const db = new Database({
          connectionString: buildConnectionString(config),
        });
        const runner = new MigrationRunner(db);

        if (options.status) {
          const status = await runner.getStatus();
          status.forEach((item) => {
            logger.info(`${item.version} ${item.name} - ${item.status}`);
          });
          return;
        }

        if (options.dryRun) {
          const sql = await runner.dryRun(options.rollback ? 'down' : 'up');
          logger.info(sql.join('\n\n'));
          return;
        }

        if (options.rollback) {
          await runner.down({ count: Number(options.rollback) });
          logger.success('Rollback complete');
          return;
        }

        await runner.up({ to: options.to });
        logger.success('Migrations complete');
      })
  )
  .addCommand(
    new Command('status')
      .description('Show database status')
      .option('--json', 'Output JSON')
      .option('--verbose', 'Include stats')
      .action(async (options) => {
        const config = await resolveCliConfig();
        const docker = new DockerManager({
          repoName: config.repoName,
          port: config.port,
          containerName: config.containerName,
        });
        const health = await docker.healthCheck();

        if (options.json) {
          console.log(JSON.stringify(health, null, 2));
          return;
        }

        logger.info(`Container running: ${health.containerRunning}`);
        logger.info(`Database ready: ${health.databaseReady}`);
        if (options.verbose) {
          const stats = await docker.getStats();
          logger.info(`Stats: ${JSON.stringify(stats)}`);
        }
      })
  )
  .addCommand(
    new Command('reset')
      .description('Reset database schema')
      .option('--confirm', 'Skip confirmation prompt')
      .action(async (options) => {
        if (!options.confirm) {
          const confirmed = await confirmPrompt('This will drop and reapply all migrations. Continue?');
          if (!confirmed) return;
        }
        const config = await resolveCliConfig();
        const db = new Database({
          connectionString: buildConnectionString(config),
        });
        const runner = new MigrationRunner(db);
        await runner.reset();
        logger.success('Database reset complete');
      })
  )
  .addCommand(
    new Command('seed')
      .description('Seed database with sample data')
      .option('--file <path>', 'Custom seed file')
      .option('--clear', 'Clear before seeding')
      .option('--count <n>', 'Number of example nodes', '10')
      .action(async (options) => {
        const config = await resolveCliConfig();
        const db = new Database({
          connectionString: buildConnectionString(config),
        });
        if (options.clear) {
          await db.execute('DELETE FROM edges');
          await db.execute('DELETE FROM nodes');
        }
        const count = Number(options.count ?? 10);
        for (let i = 0; i < count; i += 1) {
          await db.execute(
            'INSERT INTO nodes (slug, label, node_type, domain, metadata) VALUES ($1, $2, $3, $4, $5)',
            [`seed-${i + 1}`, `Seed Node ${i + 1}`, 'concept', 'general', {}]
          );
        }
        logger.success('Seed data inserted');
      })
  );
