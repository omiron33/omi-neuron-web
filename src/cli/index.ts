#!/usr/bin/env node
import { program } from 'commander';
import { initCommand } from './commands/init';
import { dbCommand } from './commands/db';
import { analyzeCommand } from './commands/analyze';
import { validateCommand } from './commands/validate';
import { configCommand } from './commands/config';

program
  .name('omi-neuron')
  .description('CLI for omi-neuron-web library')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(dbCommand);
program.addCommand(analyzeCommand);
program.addCommand(validateCommand);
program.addCommand(configCommand);

program.parse();

