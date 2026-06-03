#!/usr/bin/env bun
import { program } from 'commander';
import { skillCommand } from './cli/commands/skill';
import { noteCommand } from './cli/commands/note';
import { todoCommand } from './cli/commands/todo';
import { setupCommand } from './cli/commands/setup';

program
  .name('ck')
  .description('@personal/claude-kit — Claude Code スキル管理')
  .version('0.1.0');

program.addCommand(skillCommand);
program.addCommand(noteCommand);
program.addCommand(todoCommand);
program.addCommand(setupCommand);

program.parse();
