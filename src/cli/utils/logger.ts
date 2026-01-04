import chalk from 'chalk';

export const logger = {
  info: (message: string) => {
    console.log(chalk.cyan(`[omi-neuron] ${message}`));
  },
  success: (message: string) => {
    console.log(chalk.green(`[omi-neuron] ${message}`));
  },
  warn: (message: string) => {
    console.warn(chalk.yellow(`[omi-neuron] ${message}`));
  },
  error: (message: string) => {
    console.error(chalk.red(`[omi-neuron] ${message}`));
  },
};
