import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';

const execFileAsync = promisify(execFile);

export interface DockerConfig {
  repoName: string;
  port: number;
  containerName?: string;
  image?: string;
  user?: string;
  password?: string;
  database?: string;
  memoryLimit?: string;
}

export interface StartOptions {
  forceRecreate?: boolean;
  waitForReady?: boolean;
  timeoutMs?: number;
}

export interface StopOptions {
  removeVolumes?: boolean;
  timeoutMs?: number;
}

export interface EnsureOptions {
  waitForReady?: boolean;
}

export interface HealthCheckResult {
  containerRunning: boolean;
  databaseReady: boolean;
  connectionString: string;
  details?: string;
}

export interface ContainerStats {
  cpuPercent?: string;
  memoryUsage?: string;
  memoryPercent?: string;
  netIO?: string;
  blockIO?: string;
}

export interface LogOptions {
  tail?: number;
  since?: string;
}

interface ComposeCommand {
  cmd: string;
  args: string[];
}

const DEFAULTS = {
  image: 'pgvector/pgvector:pg16',
  user: 'neuron',
  password: 'neuron_dev',
  database: 'neuron_web',
  memoryLimit: '1g',
};

export class DockerManager {
  private config: DockerConfig;
  private composeFilePath: string;

  constructor(config: DockerConfig) {
    this.config = { ...config };
    this.composeFilePath = path.join(process.cwd(), 'docker', 'docker-compose.neuron.yml');
  }

  async start(options?: StartOptions): Promise<void> {
    await this.assertDockerAvailable();
    await this.ensureComposeFile();

    const port = await this.ensurePortAvailable(this.config.port);
    if (port !== this.config.port) {
      this.config.port = port;
      await this.ensureComposeFile();
    }

    const compose = await this.getComposeCommand();
    const args = ['-f', this.composeFilePath, 'up', '-d'];
    if (options?.forceRecreate) {
      args.push('--force-recreate');
    }

    await execFileAsync(compose.cmd, [...compose.args, ...args]);

    if (options?.waitForReady ?? true) {
      await this.waitForReady(options?.timeoutMs ?? 60_000);
    }
  }

  async stop(options?: StopOptions): Promise<void> {
    await this.assertDockerAvailable();
    const compose = await this.getComposeCommand();
    const args = ['-f', this.composeFilePath, 'down'];
    if (options?.removeVolumes) {
      args.push('-v');
    }
    await execFileAsync(compose.cmd, [...compose.args, ...args]);
  }

  async ensureRunning(options?: EnsureOptions): Promise<void> {
    const running = await this.isRunning();
    if (!running) {
      await this.start({ waitForReady: options?.waitForReady });
      return;
    }

    if (options?.waitForReady ?? true) {
      await this.waitForReady(60_000);
    }
  }

  async isRunning(): Promise<boolean> {
    try {
    const status = await this.inspectContainer();
    return Boolean((status as { State?: { Running?: boolean } } | null)?.State?.Running);
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const connectionString = await this.getConnectionString();
    const containerRunning = await this.isRunning();
    if (!containerRunning) {
      return {
        containerRunning: false,
        databaseReady: false,
        connectionString,
        details: 'Container not running',
      };
    }

    try {
      await this.execPgIsReady();
      return {
        containerRunning: true,
        databaseReady: true,
        connectionString,
      };
    } catch (error) {
      return {
        containerRunning: true,
        databaseReady: false,
        connectionString,
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getStats(): Promise<ContainerStats> {
    const containerName = this.getContainerName();
    const { stdout } = await execFileAsync('docker', [
      'stats',
      containerName,
      '--no-stream',
      '--format',
      '{{json .}}',
    ]);
    const trimmed = stdout.trim();
    if (!trimmed) {
      return {};
    }

    try {
      const parsed = JSON.parse(trimmed);
      return {
        cpuPercent: parsed.CPUPerc,
        memoryUsage: parsed.MemUsage,
        memoryPercent: parsed.MemPerc,
        netIO: parsed.NetIO,
        blockIO: parsed.BlockIO,
      };
    } catch {
      return {};
    }
  }

  async getConnectionString(): Promise<string> {
    const user = this.config.user ?? DEFAULTS.user;
    const password = this.config.password ?? DEFAULTS.password;
    const database = this.config.database ?? DEFAULTS.database;
    const port = this.config.port;
    return `postgresql://${user}:${password}@localhost:${port}/${database}`;
  }

  async getLogs(options?: LogOptions): Promise<string> {
    const containerName = this.getContainerName();
    const args = ['logs'];
    if (options?.tail) {
      args.push('--tail', String(options.tail));
    }
    if (options?.since) {
      args.push('--since', options.since);
    }
    args.push(containerName);
    const { stdout } = await execFileAsync('docker', args);
    return stdout;
  }

  async execSql(sql: string): Promise<string> {
    const containerName = this.getContainerName();
    const user = this.config.user ?? DEFAULTS.user;
    const database = this.config.database ?? DEFAULTS.database;
    const { stdout } = await execFileAsync('docker', [
      'exec',
      containerName,
      'psql',
      '-U',
      user,
      '-d',
      database,
      '-c',
      sql,
    ]);
    return stdout;
  }

  async updatePort(newPort: number): Promise<void> {
    this.config.port = newPort;
    await this.ensureComposeFile();
  }

  private async assertDockerAvailable(): Promise<void> {
    try {
      await execFileAsync('docker', ['--version']);
    } catch {
      throw new Error(
        'Docker is not available. Install Docker Desktop: https://www.docker.com/products/docker-desktop/'
      );
    }
  }

  private async getComposeCommand(): Promise<ComposeCommand> {
    try {
      await execFileAsync('docker', ['compose', 'version']);
      return { cmd: 'docker', args: ['compose'] };
    } catch {
      return { cmd: 'docker-compose', args: [] };
    }
  }

  private getContainerName(): string {
    return this.config.containerName ?? `pg-${this.config.repoName}`;
  }

  private getVolumeName(): string {
    return `${this.config.repoName}_neuron_data`;
  }

  private async ensureComposeFile(): Promise<void> {
    const templatePath = path.join(process.cwd(), 'docker', 'docker-compose.template.yml');
    const template = await fs.readFile(templatePath, 'utf8');
    const rendered = this.renderTemplate(template);
    await fs.mkdir(path.dirname(this.composeFilePath), { recursive: true });
    await fs.writeFile(this.composeFilePath, rendered, 'utf8');
  }

  private renderTemplate(template: string): string {
    const image = this.config.image ?? DEFAULTS.image;
    const user = this.config.user ?? DEFAULTS.user;
    const password = this.config.password ?? DEFAULTS.password;
    const database = this.config.database ?? DEFAULTS.database;
    const memoryLimit = this.config.memoryLimit ?? DEFAULTS.memoryLimit;
    const containerName = this.getContainerName();
    const volumeName = this.getVolumeName();

    return template
      .replace(/{{REPO_NAME}}/g, this.config.repoName)
      .replace(/{{DB_PORT}}/g, String(this.config.port))
      .replace(/{{DB_USER}}/g, user)
      .replace(/{{DB_PASSWORD}}/g, password)
      .replace(/{{DB_NAME}}/g, database)
      .replace(/{{VOLUME_NAME}}/g, volumeName)
      .replace(/{{MEMORY_LIMIT}}/g, memoryLimit)
      .replace(/{{IMAGE_NAME}}/g, image)
      .replace(/{{CONTAINER_NAME}}/g, containerName);
  }

  private async ensurePortAvailable(port: number): Promise<number> {
    const candidates = [port, 5432, 5433, 5434, 5435, 5436, 5437];
    for (const candidate of candidates) {
      if (await this.isPortAvailable(candidate)) {
        return candidate;
      }
    }
    throw new Error(`No available PostgreSQL ports found. Tried: ${candidates.join(', ')}`);
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '127.0.0.1');
    });
  }

  private async waitForReady(timeoutMs: number): Promise<void> {
    const start = Date.now();
    let delay = 500;
    while (Date.now() - start < timeoutMs) {
      try {
        await this.execPgIsReady();
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 3000);
      }
    }
    throw new Error('Database did not become ready within timeout');
  }

  private async execPgIsReady(): Promise<void> {
    const containerName = this.getContainerName();
    const user = this.config.user ?? DEFAULTS.user;
    const database = this.config.database ?? DEFAULTS.database;
    await execFileAsync('docker', [
      'exec',
      containerName,
      'pg_isready',
      '-U',
      user,
      '-d',
      database,
    ]);
  }

  private async inspectContainer(): Promise<Record<string, unknown> | null> {
    const containerName = this.getContainerName();
    try {
      const { stdout } = await execFileAsync('docker', ['inspect', containerName]);
      const parsed = JSON.parse(stdout);
      return parsed?.[0] ?? null;
    } catch {
      return null;
    }
  }
}
