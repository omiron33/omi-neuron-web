import path from 'node:path';
import fs from 'node:fs/promises';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { writeTemplateFile } from '../utils/templates';

const CONFIG_TEMPLATE = `import { defineNeuronConfig, DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from 'omi-neuron-web';

export default defineNeuronConfig({
  instance: {
    name: '{{INSTANCE_NAME}}',
    version: '0.1.0',
    repoName: '{{REPO_NAME}}',
  },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: DEFAULT_ANALYSIS_SETTINGS,
  nodeTypes: [],
  domains: [],
  relationshipTypes: [],
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
  database: {
    mode: 'docker',
    port: {{DB_PORT}},
    user: 'neuron',
    password: 'neuron_dev',
    database: 'neuron_web',
  },
  api: {
    basePath: '/api/neuron',
    enableCors: false,
  },
  logging: {
    level: 'info',
    prettyPrint: true,
  },
});
`;

const ENV_TEMPLATE = `# omi-neuron-web environment variables
OPENAI_API_KEY=
DATABASE_URL=
`;

const DOCKER_TEMPLATE = `version: '3.8'

services:
  pg-{{REPO_NAME}}:
    image: pgvector/pgvector:pg16
    container_name: pg-{{REPO_NAME}}
    restart: unless-stopped
    environment:
      POSTGRES_USER: neuron
      POSTGRES_PASSWORD: neuron_dev
      POSTGRES_DB: neuron_web
    ports:
      - "{{DB_PORT}}:5432"
    volumes:
      - {{REPO_NAME}}_neuron_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U neuron -d neuron_web"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  {{REPO_NAME}}_neuron_data:
    name: {{REPO_NAME}}_neuron_data
`;

const API_ROUTE_TEMPLATE = `import { createNeuronRoutes } from 'omi-neuron-web/api';
import config from '../../../../neuron.config';

const routes = createNeuronRoutes(config);

export const GET = routes.health.GET;
export const POST = routes.health.GET;
`;

export const initCommand = new Command('init')
  .description('Initialize omi-neuron-web in your project')
  .option('--name <name>', 'Instance name (default: directory name)')
  .option('--port <port>', 'PostgreSQL port (default: 5433)', '5433')
  .option('--skip-docker', "Don't generate Docker files")
  .option('--skip-api', "Don't generate API route files")
  .option('--skip-config', "Don't generate neuron.config.ts")
  .option('--app-dir <path>', 'Path to Next.js app directory', './app')
  .option('--force', 'Overwrite existing files')
  .action(async (options) => {
    const repoName = path.basename(process.cwd());
    const instanceName = options.name ?? repoName;
    const port = Number(options.port ?? 5433);

    if (!options.skipConfig) {
      await writeTemplateFile(
        path.join(process.cwd(), 'neuron.config.ts'),
        CONFIG_TEMPLATE,
        {
          INSTANCE_NAME: instanceName,
          REPO_NAME: repoName,
          DB_PORT: String(port),
        },
        options.force
      );
      logger.success('Created neuron.config.ts');
    }

    if (!options.skipDocker) {
      await writeTemplateFile(
        path.join(process.cwd(), 'docker-compose.neuron.yml'),
        DOCKER_TEMPLATE,
        {
          REPO_NAME: repoName,
          DB_PORT: String(port),
        },
        options.force
      );
      logger.success('Created docker-compose.neuron.yml');
    }

    await writeTemplateFile(
      path.join(process.cwd(), '.env.neuron.local'),
      ENV_TEMPLATE,
      {},
      options.force
    );
    logger.success('Created .env.neuron.local');

    if (!options.skipApi) {
      const apiPath = path.join(process.cwd(), options.appDir, 'api', 'neuron', '[...path]');
      await fs.mkdir(apiPath, { recursive: true });
      await fs.writeFile(path.join(apiPath, 'route.ts'), API_ROUTE_TEMPLATE, 'utf8');
      logger.success('Created Next.js API route stub');
    }

    logger.info('Initialization complete.');
  });
