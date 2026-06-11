import { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getDate, toSlug, uniqueFilepath } from '../utils';

export const noteCommand = new Command('note')
  .description('メモをMarkdownファイルに記録する')
  .argument('<content>', 'メモ内容')
  .option('--global', 'グローバル保存 (~/.ck-notes/)')
  .action((content: string, opts) => {
    const date = getDate();
    const slug = toSlug(content);
    const dir = opts.global
      ? join(homedir(), '.ck-notes')
      : join(process.cwd(), '.notes');
    mkdirSync(dir, { recursive: true });
    const filepath = uniqueFilepath(dir, `${date}-${slug}`);
    writeFileSync(filepath, `---\ncreated: ${date}\n---\n\n${content}\n`);
    console.log(filepath);
  });
