#!/usr/bin/env bun
import { program } from 'commander';
import { skillCommand } from './cli/commands/skill';
import { brainCommand } from './cli/commands/brain';
import { setupCommand } from './cli/commands/setup';

program
  .name('ck')
  .description('@personal/claude-kit — Claude Code スキル管理とナレッジグラフ')
  .version('0.1.0');

program.addCommand(skillCommand);
program.addCommand(brainCommand);
program.addCommand(setupCommand);

program.parse();
