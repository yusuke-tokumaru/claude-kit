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
    // メタデータの源泉はスタブ側。body 先頭のフロントマターは出力に含めない
    const rawBody = readFileSync(bodyPath, 'utf-8');
    process.stdout.write(rawBody.replace(/^---[\s\S]*?---\n+/, ''));
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
  .command('doctor')
  .description('スタブ（plugins/）と本体（src/skills/）の整合性を検査')
  .action(() => {
    const errors: string[] = [];
    const warns: string[] = [];
    const listDirs = (base: string) =>
      existsSync(base)
        ? readdirSync(base, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
        : [];
    const bodies = listDirs(SKILLS_DIR);
    const stubs = listDirs(PLUGIN_SKILLS_DIR);

    for (const s of stubs) if (!bodies.includes(s)) errors.push(`${s}: スタブに対応する body.md ディレクトリがありません`);
    for (const b of bodies) if (!stubs.includes(b)) errors.push(`${b}: body に対応するスタブ（plugins/ck/skills/）がありません`);

    for (const s of stubs) {
      const stubPath = join(PLUGIN_SKILLS_DIR, s, 'SKILL.md');
      if (!existsSync(stubPath)) {
        errors.push(`${s}: SKILL.md がありません`);
        continue;
      }
      const raw = readFileSync(stubPath, 'utf-8');
      const fm = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) {
        errors.push(`${s}: スタブにフロントマターがありません`);
        continue;
      }
      const name = fm[1].match(/^name:\s*(.+)$/m)?.[1].trim();
      if (name !== s) errors.push(`${s}: name "${name}" がディレクトリ名と一致しません`);
      if (!/^description:\s*\S/m.test(fm[1])) errors.push(`${s}: description がありません`);

      const invoke = raw.match(/^!`ck skill print ([a-z0-9-]+)([^`]*)`/m);
      if (!invoke) {
        errors.push(`${s}: 実行行 !\`ck skill print ...\` が見つかりません`);
      } else {
        if (invoke[1] !== s) errors.push(`${s}: print 対象 "${invoke[1]}" がディレクトリ名と一致しません`);
        if (!invoke[2].includes('||')) warns.push(`${s}: フォールバック（|| echo）がバッククォート内にありません`);
      }
      if (/^!`[^`]*`\s*\|\|/m.test(raw)) errors.push(`${s}: || フォールバックがバッククォートの外にあります（シェル実行されません）`);
    }

    for (const b of bodies) {
      const bodyPath = join(SKILLS_DIR, b, 'body.md');
      if (!existsSync(bodyPath)) {
        errors.push(`${b}: body.md がありません`);
        continue;
      }
      if (readFileSync(bodyPath, 'utf-8').startsWith('---\n')) {
        errors.push(`${b}: body.md にフロントマターがあります（メタデータはスタブに一本化）`);
      }
    }

    warns.forEach(w => console.log(`⚠ ${w}`));
    if (errors.length > 0) {
      errors.forEach(e => console.error(`✗ ${e}`));
      console.error(`\n${errors.length} 件のエラー`);
      process.exit(1);
    }
    console.log(`✓ ${stubs.length} スキル — 問題なし${warns.length > 0 ? `（警告 ${warns.length} 件）` : ''}`);
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
      const result = stub.replace(/^!`ck skill print [^`]+`.*$/m, bodyContent);

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

skillCommand
  .command('update [name]')
  .description('ローカルコピーのスキル本体を最新版で上書き更新')
  .option('--all', '全ローカルスキルを更新')
  .action((name: string | undefined, opts: { all?: boolean }) => {
    const localBase = join(process.cwd(), '.claude', 'skills');

    const updateSkill = (skillName: string): boolean => {
      const localSkillPath = join(localBase, skillName, 'SKILL.md');
      if (!existsSync(localSkillPath)) {
        console.error(`スキル "${skillName}" はローカルにコピーされていません。先に "ck skill copy ${skillName}" を実行してください。`);
        return false;
      }
      const stubPath = join(PLUGIN_SKILLS_DIR, skillName, 'SKILL.md');
      const bodyPath = join(SKILLS_DIR, skillName, 'body.md');
      if (!existsSync(stubPath) || !existsSync(bodyPath)) {
        console.error(`スキル "${skillName}" のグローバル定義が見つかりません`);
        return false;
      }
      const stub = readFileSync(stubPath, 'utf-8');
      const rawBody = readFileSync(bodyPath, 'utf-8');
      const bodyContent = rawBody.replace(/^---[\s\S]*?---\n+/, '').trimEnd();
      const result = stub.replace(/^!`ck skill print [^`]+`.*$/m, bodyContent);
      writeFileSync(localSkillPath, result);
      console.log(`✔ ${skillName} を最新版に更新しました`);
      return true;
    };

    if (opts.all) {
      if (!existsSync(localBase)) {
        console.error('ローカルスキルが見つかりません。先に "ck skill copy --all" を実行してください。');
        process.exit(1);
      }
      const localSkills = readdirSync(localBase, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      if (localSkills.length === 0) {
        console.error('更新対象のローカルスキルがありません。');
        process.exit(1);
      }
      localSkills.forEach(updateSkill);
    } else if (name) {
      const ok = updateSkill(name);
      if (!ok) process.exit(1);
    } else {
      console.error('スキル名を指定するか --all を使用してください');
      process.exit(1);
    }
  });
