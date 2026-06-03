import { describe, test, expect, afterEach } from 'bun:test';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'bun';

const CLI = join(import.meta.dir, '../../cli.ts');
const TMP = join(import.meta.dir, '__test_todos__');

afterEach(() => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
});

function runTodo(args: string[], cwd = TMP): { stdout: string; exitCode: number } {
  mkdirSync(cwd, { recursive: true });
  const result = spawnSync(['bun', 'run', CLI, 'todo', ...args], { cwd });
  return {
    stdout: new TextDecoder().decode(result.stdout).trim(),
    exitCode: result.exitCode ?? 1,
  };
}

describe('ck todo', () => {
  test('todos/ サブディレクトリに個別ファイルを作成する', () => {
    const { stdout, exitCode } = runTodo(['テストを書く']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('todos');
    expect(existsSync(stdout)).toBe(true);
  });

  test('フロントマターに status: open が含まれる', () => {
    const { stdout } = runTodo(['implement feature']);
    const content = readFileSync(stdout, 'utf-8');
    expect(content).toContain('status: open');
  });

  test('--priority high が反映される', () => {
    const { stdout } = runTodo(['urgent task', '--priority', 'high']);
    const content = readFileSync(stdout, 'utf-8');
    expect(content).toContain('priority: high');
  });

  test('デフォルト優先度は medium', () => {
    const { stdout } = runTodo(['default priority task']);
    const content = readFileSync(stdout, 'utf-8');
    expect(content).toContain('priority: medium');
  });
});
