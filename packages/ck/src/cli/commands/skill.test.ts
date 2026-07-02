import { describe, expect, test } from 'bun:test';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { toolMismatches } from './skill';

const tools = (body: string, allowed: string) => toolMismatches(body, allowed).map(m => m.tool);

describe('toolMismatches: 検出する（肯定的な使用文）', () => {
  test('Skill 呼び出し（`Skill: <name>`）で Skill を要求する', () => {
    expect(tools('`Skill: implement` を呼び出して実行フェーズを委譲する', 'Bash, Read')).toContain('Skill');
  });

  test('Skill tool の表記でも Skill を要求する', () => {
    expect(tools('Skill tool で `kickoff` スキルを呼び出す', 'Bash, Read, Task')).toContain('Skill');
  });

  test('サブエージェント言及で Task/Agent を要求する', () => {
    expect(tools('Explore サブエージェントを1つ起動する', 'Bash, Read')).toContain('Task');
  });

  test('「エージェント（…）を起動」の表記でも Task/Agent を要求する', () => {
    expect(tools('feature-dev:code-reviewer エージェント（組み込みエージェント型）を起動して再検証する', 'Bash')).toContain('Task');
  });

  test('AskUserQuestion の肯定使用で AskUserQuestion を要求する', () => {
    expect(tools('`AskUserQuestion` で1度だけ確認する', 'Bash, Read')).toContain('AskUserQuestion');
  });

  test('EnterPlanMode を呼び出す記述で EnterPlanMode を要求する', () => {
    expect(tools('`EnterPlanMode` を呼び出す。', 'Bash, Read')).toContain('EnterPlanMode');
  });

  test('mcp__playwright__ 言及で許可を要求する', () => {
    expect(tools('ツール名は `mcp__playwright__browser_*` 形式で呼び出す', 'Bash, Read')).toContain('mcp__playwright__');
  });
});

describe('toolMismatches: 検出しない（許可済み・否定的言及）', () => {
  test('allowed-tools に Skill があれば検出しない', () => {
    expect(tools('`Skill: implement` を呼び出す', 'Bash, Read, Skill')).toEqual([]);
  });

  test('Agent が許可されていれば Task 不在でも検出しない', () => {
    expect(tools('サブエージェントを起動する', 'Bash, Agent')).toEqual([]);
  });

  test('mcp__playwright__* のワイルドカード表記を許可として認める', () => {
    expect(tools('`mcp__playwright__browser_navigate` で遷移する', 'Bash, mcp__playwright__*')).toEqual([]);
  });

  test('EnterPlanMode の否定的言及（入らない）は検出しない', () => {
    expect(tools('プランモード（`EnterPlanMode`）に入らない。それは `/plan` の責務。', 'Bash')).toEqual([]);
  });

  test('AskUserQuestion の条件・否定言及は検出しない', () => {
    expect(tools('`AskUserQuestion` は比較可能な3案以上のときのみ使用する', 'Bash')).toEqual([]);
    expect(tools('AskUserQuestion が使えない場合は止まらない', 'Bash')).toEqual([]);
  });

  test('シグナルに該当しない本文は何も返さない', () => {
    expect(tools('git status --short で作業ツリーを確認する', 'Bash(git *)')).toEqual([]);
  });
});

describe('実リポジトリの全スキルが整合している（回帰テスト）', () => {
  const SKILLS_DIR = join(import.meta.dir, '../../skills');
  const PLUGIN_SKILLS_DIR = join(import.meta.dir, '../../../../../plugins/ck/skills');

  const stubs = readdirSync(PLUGIN_SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const s of stubs) {
    test(`${s}: body の要求ツールが allowed-tools に揃っている`, () => {
      const stub = readFileSync(join(PLUGIN_SKILLS_DIR, s, 'SKILL.md'), 'utf-8');
      const allowedTools = stub.match(/^allowed-tools:\s*(.+)$/m)?.[1] ?? '';
      const bodyPath = join(SKILLS_DIR, s, 'body.md');
      expect(existsSync(bodyPath)).toBe(true);
      expect(toolMismatches(readFileSync(bodyPath, 'utf-8'), allowedTools)).toEqual([]);
    });
  }
});
