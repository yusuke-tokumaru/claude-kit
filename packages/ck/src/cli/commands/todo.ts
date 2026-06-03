import { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getDate, toSlug } from '../utils';

export const todoCommand = new Command('todo')
  .description('TODOをMarkdownファイルに記録する')
  .argument('<content>', 'TODO内容')
  .option('--global', 'グローバル保存 (~/.ck-notes/todos/)')
  .option('--priority <priority>', '優先度 (high|medium|low)', 'medium')
  .action((content: string, opts) => {
    const date = getDate();
    const slug = toSlug(content);
    const dir = opts.global
      ? join(homedir(), '.ck-notes', 'todos')
      : join(process.cwd(), '.notes', 'todos');
    mkdirSync(dir, { recursive: true });
    const filepath = join(dir, `${date}-${slug}.md`);
    writeFileSync(filepath, `---\nstatus: open\ncreated: ${date}\npriority: ${opts.priority}\n---\n\n${content}\n`);
    console.log(filepath);
  });
