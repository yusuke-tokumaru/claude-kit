import { Command } from 'commander';
import { join } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';

// スキル本体ファイルの格納ディレクトリ
const SKILLS_DIR = join(import.meta.dir, '../../skills');

export const skillCommand = new Command('skill').description('スキル管理');

skillCommand
  .command('print <name>')
  .description('スキル本体を標準出力')
  .action((name: string) => {
    const bodyPath = join(SKILLS_DIR, name, 'body.md');
    if (!existsSync(bodyPath)) {
      console.error(`スキル "${name}" が見つかりません`);
      process.exit(1);
    }
    process.stdout.write(readFileSync(bodyPath, 'utf-8'));
  });

skillCommand
  .command('list')
  .description('利用可能なスキル一覧を表示')
  .action(() => {
    if (!existsSync(SKILLS_DIR)) {
      console.log('スキルが登録されていません');
      return;
    }
    const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    skills.forEach(s => console.log(s));
  });
