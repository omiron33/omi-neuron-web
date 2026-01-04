import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadNeuronConfig } from '../utils/config';
import { logger } from '../utils/logger';

const CONFIG_FILE = path.resolve('neuron.config.ts');

const serializeConfig = (config: unknown): string => `import { defineNeuronConfig } from 'omi-neuron-web';\n\nexport default defineNeuronConfig(${JSON.stringify(
  config,
  null,
  2
)});\n`;

const getNestedValue = (obj: Record<string, unknown>, key: string): unknown => {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
};

const setNestedValue = (obj: Record<string, unknown>, key: string, value: unknown): void => {
  const parts = key.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
};

export const configCommand = new Command('config')
  .description('Manage neuron.config.ts')
  .addCommand(
    new Command('get')
      .argument('<key>', 'Dot path key')
      .action(async (key) => {
        const config = await loadNeuronConfig();
        if (!config) {
          logger.error('neuron.config.ts not found');
          return;
        }
        const value = getNestedValue(config as unknown as Record<string, unknown>, key);
        console.log(JSON.stringify(value, null, 2));
      })
  )
  .addCommand(
    new Command('set')
      .argument('<key>', 'Dot path key')
      .argument('<value>', 'Value (JSON)')
      .action(async (key, value) => {
        const config = await loadNeuronConfig();
        if (!config) {
          logger.error('neuron.config.ts not found');
          return;
        }
        const parsed = JSON.parse(value);
        const updated = { ...(config as unknown as Record<string, unknown>) };
        setNestedValue(updated, key, parsed);
        await fs.writeFile(CONFIG_FILE, serializeConfig(updated), 'utf8');
        logger.success(`Updated ${key}`);
      })
  )
  .addCommand(
    new Command('list').action(async () => {
      const config = await loadNeuronConfig();
      if (!config) {
        logger.error('neuron.config.ts not found');
        return;
      }
      console.log(JSON.stringify(config, null, 2));
    })
  )
  .addCommand(
    new Command('reset')
      .option('--section <section>', 'Section to reset')
      .action(async (options) => {
        const config = await loadNeuronConfig();
        if (!config) {
          logger.error('neuron.config.ts not found');
          return;
        }
        const updated = { ...(config as unknown as Record<string, unknown>) };
        if (options.section) {
          delete updated[options.section];
        } else {
          for (const key of Object.keys(updated)) {
            delete updated[key];
          }
        }
        await fs.writeFile(CONFIG_FILE, serializeConfig(updated), 'utf8');
        logger.success('Config reset');
      })
  );
