import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import type { NeuronConfig } from '../../core/types/settings';

export interface CliConfig {
  repoName: string;
  port: number;
  containerName?: string;
  databaseUrl?: string;
  databaseUser?: string;
  databasePassword?: string;
  databaseName?: string;
}

export async function loadNeuronConfig(): Promise<NeuronConfig | null> {
  const configPath = path.resolve('neuron.config.ts');
  try {
    await fs.access(configPath);
  } catch {
    return null;
  }

  try {
    const module = await import(pathToFileURL(configPath).toString());
    return module.default ?? module;
  } catch (error) {
    throw new Error(
      `Unable to load neuron.config.ts. Consider transpiling or using a JS config. ${String(error)}`
    );
  }
}

export async function resolveCliConfig(overrides?: Partial<CliConfig>): Promise<CliConfig> {
  const repoName = overrides?.repoName ?? path.basename(process.cwd());
  let config: NeuronConfig | null = null;

  try {
    config = await loadNeuronConfig();
  } catch {
    config = null;
  }

  return {
    repoName,
    port:
      overrides?.port ??
      config?.database?.port ??
      (process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433),
    containerName: overrides?.containerName ?? config?.database?.containerName,
    databaseUrl: overrides?.databaseUrl ?? config?.database?.url ?? process.env.DATABASE_URL,
    databaseUser: overrides?.databaseUser ?? config?.database?.user ?? process.env.DB_USER,
    databasePassword:
      overrides?.databasePassword ?? config?.database?.password ?? process.env.DB_PASSWORD,
    databaseName: overrides?.databaseName ?? config?.database?.database ?? process.env.DB_NAME,
  };
}
