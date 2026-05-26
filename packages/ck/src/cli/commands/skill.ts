import { Command } from 'commander';
import { join } from 'path';
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'fs';

const SKILLS_DIR = join(import.meta.dir, '../../skills');
const PLUGIN_SKILLS_DIR = join(import.meta.dir, '../../../../../plugins/ck/skills');

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

skillCommand
  .command('copy [name]')
  .description('スキルをプロジェクトの .claude/skills/ にコピー（カスタマイズ用）')
  .option('--all', '全スキルをコピー')
  .action((name: string | undefined, opts: { all?: boolean }) => {
    const targetBase = join(process.cwd(), '.claude', 'skills');

    const copySkill = (skillName: string) => {
      const stubPath = join(PLUGIN_SKILLS_DIR, skillName, 'SKILL.md');
      const bodyPath = join(SKILLS_DIR, skillName, 'body.md');

      if (!existsSync(stubPath) || !existsSync(bodyPath)) {
        console.error(`スキル "${skillName}" が見つかりません`);
        return;
      }

      // スタブの !`ck skill print ...` 行をボディ内容（フロントマター除去済み）で置換
      const stub = readFileSync(stubPath, 'utf-8');
      const rawBody = readFileSync(bodyPath, 'utf-8');
      const bodyContent = rawBody.replace(/^---[\s\S]*?---\n+/, '').trimEnd();
      const result = stub.replace(/^!`ck skill print [^`]+`\s*$/m, bodyContent);

      const destDir = join(targetBase, skillName);
      mkdirSync(destDir, { recursive: true });
      writeFileSync(join(destDir, 'SKILL.md'), result);
      console.log(`✔ ${skillName} → .claude/skills/${skillName}/SKILL.md`);
    };

    if (opts.all) {
      const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      skills.forEach(copySkill);
    } else if (name) {
      copySkill(name);
    } else {
      console.error('スキル名を指定するか --all を使用してください');
      process.exit(1);
    }
  });
