import path from 'node:path';
import fs from 'node:fs/promises';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { writeTemplateFile } from '../utils/templates';

const SERVER_CONFIG_TEMPLATE = `import { defineNeuronServerConfig, resolveNeuronConfig, DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS, VERSION } from '@omiron33/omi-neuron-web';

export const neuronServerConfig = defineNeuronServerConfig({
  settings: {
    instance: {
      name: '{{INSTANCE_NAME}}',
      version: VERSION,
      repoName: '{{REPO_NAME}}',
    },
    visualization: DEFAULT_VISUALIZATION_SETTINGS,
    analysis: DEFAULT_ANALYSIS_SETTINGS,
    nodeTypes: [],
    domains: [],
    relationshipTypes: [],
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
{{STORAGE_BLOCK}}
  database: {
    {{DB_MODE_BLOCK}}
    port: {{DB_PORT}},
{{DB_AUTH_BLOCK}}
  },
  api: {
    basePath: '/api/neuron',
    enableCors: false,
    rateLimit: {
      windowMs: 60_000,
      max: 60,
    },
  },
  logging: {
    level: 'info',
    prettyPrint: true,
  },
});

export const neuronConfig = resolveNeuronConfig(neuronServerConfig);
`;

const CLIENT_CONFIG_TEMPLATE = `import { defineNeuronClientConfig } from '@omiron33/omi-neuron-web';

export const neuronClientConfig = defineNeuronClientConfig({
  api: { basePath: '/api/neuron' },
});
`;

const COMPAT_CONFIG_TEMPLATE = `export { neuronConfig as default } from './neuron.server';
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

const API_ROUTE_TEMPLATE = `import { createNeuronRoutes, withNeuronMiddleware } from '@omiron33/omi-neuron-web/api';
import { neuronConfig } from '../../../../neuron.server';

const routes = createNeuronRoutes(neuronConfig, {
  // Request context derivation (scope + user) for multi-tenancy + auth.
  requestContext: {
    // Optional: derive scope from auth/session (recommended). Header 'x-neuron-scope' is also supported.
    // resolveScope: async (request) => null,

    // Optional: attach a user identity for logging/rate limiting/authorization decisions.
    // resolveUser: async (request) => null,
  },

  // Optional: gate requests with a portable authorization hook.
  // auth: {
  //   authorize: async (request, context) => true,
  // },

  // Recommended: protect JSON endpoints from oversized payloads (defaults to 1MB when enabled).
  bodySizeLimit: { maxBytes: 1_000_000 },

  // Optional: rate limiting hook (consumer provides the limiter implementation).
  // rateLimit: {
  //   limiter: async (key, windowMs, max) => true,
  // },
});

type RouteContext = { params: { path?: string[] } };

const notFound = () => new Response('Not found', { status: 404 });

const methodNotAllowed = () => new Response('Method not allowed', { status: 405 });

async function dispatch(request: Request, context: RouteContext) {
  const segments = context.params.path ?? [];
  const resource = segments[0] ?? 'health';

  switch (resource) {
    case 'nodes': {
      if (request.method === 'GET') return routes.nodes.GET(request);
      if (request.method === 'POST') return routes.nodes.POST(request);
      if (request.method === 'PATCH') return routes.nodes.PATCH(request);
      if (request.method === 'DELETE') return routes.nodes.DELETE(request);
      return methodNotAllowed();
    }
    case 'edges': {
      if (request.method === 'GET') return routes.edges.GET(request);
      if (request.method === 'POST') return routes.edges.POST(request);
      if (request.method === 'PATCH') return routes.edges.PATCH(request);
      if (request.method === 'DELETE') return routes.edges.DELETE(request);
      return methodNotAllowed();
    }
    case 'graph': {
      if (request.method === 'GET') return routes.graph.GET(request);
      if (request.method === 'POST') return routes.graph.POST(request);
      return methodNotAllowed();
    }
    case 'analyze': {
      if (request.method === 'GET') return routes.analyze.GET(request);
      if (request.method === 'POST') return routes.analyze.POST(request);
      return methodNotAllowed();
    }
    case 'settings': {
      if (request.method === 'GET') return routes.settings.GET(request);
      if (request.method === 'PATCH') return routes.settings.PATCH(request);
      if (request.method === 'POST') return routes.settings.POST(request);
      return methodNotAllowed();
    }
    case 'search': {
      if (request.method === 'POST') return routes.search.POST(request);
      return methodNotAllowed();
    }
    case 'health': {
      if (request.method === 'GET') return routes.health.GET();
      return methodNotAllowed();
    }
    default:
      return notFound();
  }
}

export async function GET(request: Request, context: RouteContext) {
  return withNeuronMiddleware((req) => dispatch(req, context), {
    // CORS is disabled by default. If you enable it, provide an explicit allowlist.
    // cors: { origins: ['https://your-app.com'] },

    // Logging is disabled by default. Provide a logger (e.g. console, pino adapter) to enable.
    // logging: { enabled: process.env.NODE_ENV !== 'production', logger: console },
  })(request);
}

export async function POST(request: Request, context: RouteContext) {
  return withNeuronMiddleware((req) => dispatch(req, context), {})(request);
}

export async function PATCH(request: Request, context: RouteContext) {
  return withNeuronMiddleware((req) => dispatch(req, context), {})(request);
}

export async function DELETE(request: Request, context: RouteContext) {
  return withNeuronMiddleware((req) => dispatch(req, context), {})(request);
}
`;

export const initCommand = new Command('init')
  .description('Initialize omi-neuron-web in your project')
  .option('--name <name>', 'Instance name (default: directory name)')
  .option('--port <port>', 'PostgreSQL port (default: 5433)', '5433')
  .option('--storage <mode>', "Storage mode: 'postgres' | 'memory' | 'file' (default: postgres)", 'postgres')
  .option('--file-path <path>', 'File path for storage.mode=file (default: .neuron/graph.json)', '.neuron/graph.json')
  .option('--persist-interval <ms>', 'Persist interval ms for storage.mode=file (default: 500)', '500')
  .option('--skip-docker', "Don't generate Docker files")
  .option('--skip-api', "Don't generate API route files")
  .option('--skip-config', "Don't generate neuron.config.ts")
  .option('--app-dir <path>', 'Path to Next.js app directory', './app')
  .option('--force', 'Overwrite existing files')
  .action(async (options) => {
    const repoName = path.basename(process.cwd());
    const instanceName = options.name ?? repoName;
    const port = Number(options.port ?? 5433);
    const storageMode = String(options.storage ?? 'postgres');
    const persistIntervalMs = Number(options.persistInterval ?? 500);

    const storageBlock =
      storageMode === 'memory'
        ? `  storage: { mode: 'memory' },`
        : storageMode === 'file'
          ? `  storage: {\n    mode: 'file',\n    filePath: '${String(options.filePath)}',\n    persistIntervalMs: ${persistIntervalMs},\n  },`
          : `  storage: { mode: 'postgres' },`;

    const dbModeBlock = storageMode === 'postgres' ? `mode: 'docker',` : `mode: 'external',`;
    const dbAuthBlock =
      storageMode === 'postgres'
        ? `    user: 'neuron',\n    password: 'neuron_dev',\n    database: 'neuron_web',`
        : `    url: process.env.DATABASE_URL,`;

    if (!options.skipConfig) {
      await writeTemplateFile(
        path.join(process.cwd(), 'neuron.server.ts'),
        SERVER_CONFIG_TEMPLATE,
        {
          INSTANCE_NAME: instanceName,
          REPO_NAME: repoName,
          DB_PORT: String(port),
          STORAGE_BLOCK: storageBlock,
          DB_MODE_BLOCK: dbModeBlock,
          DB_AUTH_BLOCK: dbAuthBlock,
        },
        options.force
      );
      logger.success('Created neuron.server.ts');

      await writeTemplateFile(path.join(process.cwd(), 'neuron.client.ts'), CLIENT_CONFIG_TEMPLATE, {}, options.force);
      logger.success('Created neuron.client.ts');

      await writeTemplateFile(path.join(process.cwd(), 'neuron.config.ts'), COMPAT_CONFIG_TEMPLATE, {}, options.force);
      logger.success('Created neuron.config.ts (compat)');
    }

    if (!options.skipDocker && storageMode === 'postgres') {
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
