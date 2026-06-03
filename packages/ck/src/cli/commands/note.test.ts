import { describe, test, expect, afterEach } from 'bun:test';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'bun';

const CLI = join(import.meta.dir, '../../cli.ts');
const TMP = join(import.meta.dir, '__test_notes__');

afterEach(() => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
});

function runNote(args: string[], cwd = TMP): { stdout: string; exitCode: number } {
  mkdirSync(cwd, { recursive: true });
  const result = spawnSync(['bun', 'run', CLI, 'note', ...args], { cwd });
  return {
    stdout: new TextDecoder().decode(result.stdout).trim(),
    exitCode: result.exitCode ?? 1,
  };
}

describe('ck note', () => {
  test('ローカルにMarkdownファイルを作成する', () => {
    const { stdout, exitCode } = runNote(['テスト用メモ']);
    expect(exitCode).toBe(0);
    expect(existsSync(stdout)).toBe(true);
  });

  test('作成したファイルがフロントマターと本文を含む', () => {
    const { stdout } = runNote(['hello world']);
    const content = readFileSync(stdout, 'utf-8');
    expect(content).toContain('created:');
    expect(content).toContain('hello world');
  });

  test('ファイル名が YYYY-MM-DD-<slug>.md 形式になる', () => {
    const { stdout } = runNote(['my note content']);
    expect(stdout).toMatch(/\d{4}-\d{2}-\d{2}-my-note-content\.md$/);
  });

  test('--global フラグで ~/.ck-notes/ に保存する', () => {
    const { stdout, exitCode } = runNote(['global note', '--global']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('.ck-notes');
    if (existsSync(stdout)) rmSync(stdout);
  });
});
