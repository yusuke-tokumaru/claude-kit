# claude-kit 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 個人用 Claude Code プラグインリポジトリ `~/claude-kit` を構築し、`ck` CLI・ナレッジグラフ・7つのスキルを動作させる。

**Architecture:** `packages/ck/`（CLIとスキル本体）と `plugins/ck/`（Claude Code マーケットプレイス用スタブ）の2層構造。スタブは `ck skill print <name>` を呼び出してスキル本体を取得する。ナレッジグラフは `~/.ck-brain/brain.db`（SQLite）に保存。

**Tech Stack:** Bun, TypeScript, bun:sqlite, bun:test, commander@12

---

## ファイルマップ

| ファイル | 役割 |
|---|---|
| `package.json` | Bun ワークスペース設定 |
| `.gitignore` | .claude/works/ など除外 |
| `packages/ck/package.json` | @personal/claude-kit パッケージ定義 |
| `packages/ck/src/cli.ts` | `ck` CLI エントリポイント |
| `packages/ck/src/cli/commands/skill.ts` | `ck skill print/list` 実装 |
| `packages/ck/src/cli/commands/brain.ts` | `ck brain node/link/decision` 実装 |
| `packages/ck/src/cli/commands/setup.ts` | `ck setup` 実装 |
| `packages/ck/src/core/types.ts` | 型定義 |
| `packages/ck/src/core/db.ts` | SQLite CRUD 関数 |
| `packages/ck/src/skills/*/body.md` | スキル本体（7つ） |
| `packages/ck/tests/core/db.test.ts` | DB 層テスト |
| `packages/ck/tests/cli/skill.test.ts` | スキルCLI テスト |
| `plugins/ck/.claude-plugin/plugin.json` | プラグイン定義 |
| `plugins/ck/package.json` | プラグインパッケージ定義 |
| `plugins/ck/skills/*/SKILL.md` | スタブ（7つ） |
| `README.md` | 使い方ドキュメント |

---

## Task 1: ワークスペーススキャフォールド

**Files:**
- Create: `~/claude-kit/package.json`
- Create: `~/claude-kit/.gitignore`

- [ ] **Step 1: ルート package.json を作成**

```json
{
  "name": "claude-kit",
  "private": true,
  "workspaces": ["packages/*", "plugins/*"]
}
```

ファイルパス: `~/claude-kit/package.json`

- [ ] **Step 2: .gitignore を作成**

```
node_modules/
bun.lockb
.claude/works/
*.db
```

ファイルパス: `~/claude-kit/.gitignore`

- [ ] **Step 3: コミット**

```bash
cd ~/claude-kit
git add package.json .gitignore
git commit -m "chore: add workspace scaffold"
```

Expected: `2 files changed`

---

## Task 2: packages/ck スキャフォールドと依存インストール

**Files:**
- Create: `~/claude-kit/packages/ck/package.json`

- [ ] **Step 1: ディレクトリと package.json を作成**

```bash
mkdir -p ~/claude-kit/packages/ck/src/cli/commands
mkdir -p ~/claude-kit/packages/ck/src/core
mkdir -p ~/claude-kit/packages/ck/src/skills
mkdir -p ~/claude-kit/packages/ck/tests/core
mkdir -p ~/claude-kit/packages/ck/tests/cli
```

- [ ] **Step 2: package.json を書く**

```json
{
  "name": "@personal/claude-kit",
  "version": "0.1.0",
  "private": true,
  "bin": {
    "ck": "src/cli.ts"
  },
  "dependencies": {
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

ファイルパス: `~/claude-kit/packages/ck/package.json`

- [ ] **Step 3: ルートで bun install**

```bash
cd ~/claude-kit && bun install
```

Expected: `bun install` が完了し `node_modules/` と `bun.lockb` が生成される

- [ ] **Step 4: コミット**

```bash
git add packages/ck/package.json bun.lockb
git commit -m "chore: add packages/ck with commander dependency"
```

---

## Task 3: 型定義

**Files:**
- Create: `~/claude-kit/packages/ck/src/core/types.ts`

- [ ] **Step 1: types.ts を書く**

```typescript
export type NodeKind = 'note' | 'todo' | 'decision' | 'research';

export interface BrainNode {
  id: string;
  kind: NodeKind;
  title: string;
  body: string;
  tags: string[];
  created_at: string;
}

export interface BrainLink {
  from_id: string;
  to_id: string;
  type: string;
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  created_at: string;
}
```

ファイルパス: `~/claude-kit/packages/ck/src/core/types.ts`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/core/types.ts
git commit -m "feat: add core types for knowledge graph"
```

---

## Task 4: データベース層

**Files:**
- Create: `~/claude-kit/packages/ck/src/core/db.ts`
- Create: `~/claude-kit/packages/ck/tests/core/db.test.ts`

- [ ] **Step 1: テストを先に書く**

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { rmSync, mkdirSync } from 'fs';
import {
  createNode, getNode, searchNodes, updateNode, deleteNode,
  createLink, listLinks,
  createDecision, listDecisions,
} from '../../src/core/db';

const TEST_DB_DIR = '/tmp/ck-brain-test';
const TEST_DB_PATH = join(TEST_DB_DIR, 'brain.db');

beforeEach(() => { mkdirSync(TEST_DB_DIR, { recursive: true }); });
afterEach(() => { rmSync(TEST_DB_DIR, { recursive: true, force: true }); });

describe('node CRUD', () => {
  test('createNode は id と created_at を付与して返す', () => {
    const node = createNode({ kind: 'note', title: 'テスト', body: '本文' }, TEST_DB_PATH);
    expect(node.id).toBeDefined();
    expect(node.title).toBe('テスト');
    expect(node.kind).toBe('note');
    expect(node.tags).toEqual([]);
    expect(node.created_at).toBeDefined();
  });

  test('getNode は作成したノードを取得できる', () => {
    const created = createNode({ kind: 'todo', title: 'TODO項目' }, TEST_DB_PATH);
    const fetched = getNode(created.id, TEST_DB_PATH);
    expect(fetched).not.toBeNull();
    expect(fetched!.title).toBe('TODO項目');
  });

  test('getNode は存在しないIDでnullを返す', () => {
    expect(getNode('unknown', TEST_DB_PATH)).toBeNull();
  });

  test('searchNodes はタイトル部分一致で検索できる', () => {
    createNode({ kind: 'note', title: 'Reactコンポーネント設計' }, TEST_DB_PATH);
    createNode({ kind: 'note', title: 'Bunセットアップ' }, TEST_DB_PATH);
    const results = searchNodes('React', TEST_DB_PATH);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Reactコンポーネント設計');
  });

  test('updateNode はフィールドを更新して返す', () => {
    const node = createNode({ kind: 'note', title: '元タイトル' }, TEST_DB_PATH);
    const updated = updateNode(node.id, { title: '新タイトル', body: '更新内容' }, TEST_DB_PATH);
    expect(updated!.title).toBe('新タイトル');
    expect(updated!.body).toBe('更新内容');
  });

  test('deleteNode はノードを削除してtrueを返す', () => {
    const node = createNode({ kind: 'note', title: '削除対象' }, TEST_DB_PATH);
    expect(deleteNode(node.id, TEST_DB_PATH)).toBe(true);
    expect(getNode(node.id, TEST_DB_PATH)).toBeNull();
  });
});

describe('link operations', () => {
  test('createLink と listLinks が機能する', () => {
    const a = createNode({ kind: 'note', title: 'A' }, TEST_DB_PATH);
    const b = createNode({ kind: 'note', title: 'B' }, TEST_DB_PATH);
    createLink({ from_id: a.id, to_id: b.id, type: 'relates' }, TEST_DB_PATH);
    const links = listLinks(a.id, TEST_DB_PATH);
    expect(links).toHaveLength(1);
    expect(links[0].type).toBe('relates');
  });
});

describe('decision operations', () => {
  test('createDecision と listDecisions が機能する', () => {
    createDecision({ title: 'DB選定', decision: 'SQLite採用', context: 'ローカル用途' }, TEST_DB_PATH);
    const decisions = listDecisions(TEST_DB_PATH);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].title).toBe('DB選定');
  });
});
```

ファイルパス: `~/claude-kit/packages/ck/tests/core/db.test.ts`

- [ ] **Step 2: テストが失敗することを確認**

```bash
cd ~/claude-kit/packages/ck && bun test tests/core/db.test.ts
```

Expected: `Cannot find module '../../src/core/db'` のようなエラー

- [ ] **Step 3: db.ts を実装する**

```typescript
import { Database } from 'bun:sqlite';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import type { BrainNode, BrainLink, Decision, NodeKind } from './types';

const DEFAULT_DB_PATH = join(homedir(), '.ck-brain', 'brain.db');

function openDb(path = DEFAULT_DB_PATH): Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS links (
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      type TEXT NOT NULL,
      PRIMARY KEY (from_id, to_id, type)
    );
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      context TEXT NOT NULL DEFAULT '',
      decision TEXT NOT NULL,
      consequences TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export function createNode(
  input: { kind: NodeKind; title: string; body?: string; tags?: string[] },
  dbPath?: string,
): BrainNode {
  const db = openDb(dbPath);
  const node: BrainNode = {
    id: crypto.randomUUID(),
    kind: input.kind,
    title: input.title,
    body: input.body ?? '',
    tags: input.tags ?? [],
    created_at: new Date().toISOString(),
  };
  db.run(
    'INSERT INTO nodes (id, kind, title, body, tags, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [node.id, node.kind, node.title, node.body, JSON.stringify(node.tags), node.created_at],
  );
  return node;
}

export function getNode(id: string, dbPath?: string): BrainNode | null {
  const db = openDb(dbPath);
  const row = db.query('SELECT * FROM nodes WHERE id = ?').get(id) as Record<string, unknown> | null;
  if (!row) return null;
  return { ...(row as Omit<BrainNode, 'tags'>), tags: JSON.parse(row.tags as string) };
}

export function searchNodes(query: string, dbPath?: string): BrainNode[] {
  const db = openDb(dbPath);
  const rows = db
    .query('SELECT * FROM nodes WHERE title LIKE ? OR body LIKE ? ORDER BY created_at DESC')
    .all(`%${query}%`, `%${query}%`) as Record<string, unknown>[];
  return rows.map(r => ({ ...(r as Omit<BrainNode, 'tags'>), tags: JSON.parse(r.tags as string) }));
}

export function updateNode(
  id: string,
  input: Partial<Pick<BrainNode, 'title' | 'body' | 'tags'>>,
  dbPath?: string,
): BrainNode | null {
  const existing = getNode(id, dbPath);
  if (!existing) return null;
  const updated: BrainNode = { ...existing, ...input };
  const db = openDb(dbPath);
  db.run('UPDATE nodes SET title = ?, body = ?, tags = ? WHERE id = ?', [
    updated.title,
    updated.body,
    JSON.stringify(updated.tags),
    id,
  ]);
  return updated;
}

export function deleteNode(id: string, dbPath?: string): boolean {
  const db = openDb(dbPath);
  const result = db.run('DELETE FROM nodes WHERE id = ?', [id]);
  return result.changes > 0;
}

export function createLink(input: BrainLink, dbPath?: string): BrainLink {
  const db = openDb(dbPath);
  db.run('INSERT OR REPLACE INTO links (from_id, to_id, type) VALUES (?, ?, ?)', [
    input.from_id,
    input.to_id,
    input.type,
  ]);
  return input;
}

export function listLinks(nodeId: string, dbPath?: string): BrainLink[] {
  const db = openDb(dbPath);
  return db
    .query('SELECT * FROM links WHERE from_id = ? OR to_id = ?')
    .all(nodeId, nodeId) as BrainLink[];
}

export function createDecision(
  input: { title: string; context?: string; decision: string; consequences?: string },
  dbPath?: string,
): Decision {
  const db = openDb(dbPath);
  const dec: Decision = {
    id: crypto.randomUUID(),
    title: input.title,
    context: input.context ?? '',
    decision: input.decision,
    consequences: input.consequences ?? '',
    created_at: new Date().toISOString(),
  };
  db.run(
    'INSERT INTO decisions (id, title, context, decision, consequences, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [dec.id, dec.title, dec.context, dec.decision, dec.consequences, dec.created_at],
  );
  return dec;
}

export function listDecisions(dbPath?: string): Decision[] {
  const db = openDb(dbPath);
  return db.query('SELECT * FROM decisions ORDER BY created_at DESC').all() as Decision[];
}
```

ファイルパス: `~/claude-kit/packages/ck/src/core/db.ts`

- [ ] **Step 4: テストが通ることを確認**

```bash
cd ~/claude-kit/packages/ck && bun test tests/core/db.test.ts
```

Expected: `12 pass, 0 fail`

- [ ] **Step 5: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/core/db.ts packages/ck/tests/core/db.test.ts
git commit -m "feat: add knowledge graph database layer"
```

---

## Task 5: CLI エントリポイント

**Files:**
- Create: `~/claude-kit/packages/ck/src/cli.ts`

- [ ] **Step 1: cli.ts を作成**

```typescript
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
```

ファイルパス: `~/claude-kit/packages/ck/src/cli.ts`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/cli.ts
git commit -m "feat: add CLI entry point"
```

---

## Task 6: スキルCLIコマンド

**Files:**
- Create: `~/claude-kit/packages/ck/src/cli/commands/skill.ts`
- Create: `~/claude-kit/packages/ck/tests/cli/skill.test.ts`

- [ ] **Step 1: テストを先に書く**

```typescript
import { describe, test, expect } from 'bun:test';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';

const SKILLS_DIR = join(import.meta.dir, '../../src/skills');

describe('skill bodies', () => {
  test('skills ディレクトリが存在する', () => {
    expect(existsSync(SKILLS_DIR)).toBe(true);
  });

  test('各スキルディレクトリに body.md がある', () => {
    const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      const bodyPath = join(SKILLS_DIR, skill, 'body.md');
      expect(existsSync(bodyPath)).toBe(true);
    }
  });
});
```

ファイルパス: `~/claude-kit/packages/ck/tests/cli/skill.test.ts`

- [ ] **Step 2: テストが失敗することを確認**

```bash
cd ~/claude-kit/packages/ck && bun test tests/cli/skill.test.ts
```

Expected: `skills ディレクトリが存在する` が FAIL（まだ作っていないため）

- [ ] **Step 3: skill.ts を実装する**

```typescript
import { Command } from 'commander';
import { join } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';

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
```

ファイルパス: `~/claude-kit/packages/ck/src/cli/commands/skill.ts`

- [ ] **Step 4: skills ディレクトリを空で作成してテストが通ることを確認**

```bash
mkdir -p ~/claude-kit/packages/ck/src/skills/.keep
cd ~/claude-kit/packages/ck && bun test tests/cli/skill.test.ts
```

Expected: 2 tests PASS（0スキルなので空ループ）

- [ ] **Step 5: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/cli/commands/skill.ts packages/ck/tests/cli/skill.test.ts
git commit -m "feat: add skill CLI commands (print, list)"
```

---

## Task 7: Brain コマンド

**Files:**
- Create: `~/claude-kit/packages/ck/src/cli/commands/brain.ts`

- [ ] **Step 1: brain.ts を実装する**

```typescript
import { Command } from 'commander';
import {
  createNode, getNode, searchNodes, updateNode, deleteNode,
  createLink, listLinks,
  createDecision, listDecisions,
} from '../../core/db';
import type { NodeKind } from '../../core/types';

export const brainCommand = new Command('brain').description('ナレッジグラフ操作');

// ----- node -----
const nodeCmd = new Command('node').description('ノード管理');

nodeCmd
  .command('create')
  .description('ノードを追加')
  .requiredOption('--kind <kind>', 'note|todo|decision|research')
  .requiredOption('--title <title>', 'タイトル')
  .option('--body <body>', '本文', '')
  .option('--tags <tags>', 'タグ（カンマ区切り）', '')
  .action((opts) => {
    const node = createNode({
      kind: opts.kind as NodeKind,
      title: opts.title,
      body: opts.body,
      tags: opts.tags ? opts.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    });
    console.log(JSON.stringify(node, null, 2));
  });

nodeCmd
  .command('get <id>')
  .description('ノードを取得')
  .action((id: string) => {
    const node = getNode(id);
    if (!node) { console.error('ノードが見つかりません'); process.exit(1); }
    console.log(JSON.stringify(node, null, 2));
  });

nodeCmd
  .command('search <query>')
  .description('ノードを全文検索')
  .action((query: string) => {
    const nodes = searchNodes(query);
    console.log(JSON.stringify(nodes, null, 2));
  });

nodeCmd
  .command('update <id>')
  .description('ノードを更新')
  .option('--title <title>', 'タイトル')
  .option('--body <body>', '本文')
  .option('--tags <tags>', 'タグ（カンマ区切り）')
  .action((id: string, opts) => {
    const input: Parameters<typeof updateNode>[1] = {};
    if (opts.title !== undefined) input.title = opts.title;
    if (opts.body !== undefined) input.body = opts.body;
    if (opts.tags !== undefined) input.tags = opts.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    const node = updateNode(id, input);
    if (!node) { console.error('ノードが見つかりません'); process.exit(1); }
    console.log(JSON.stringify(node, null, 2));
  });

nodeCmd
  .command('delete <id>')
  .description('ノードを削除')
  .action((id: string) => {
    const ok = deleteNode(id);
    if (!ok) { console.error('ノードが見つかりません'); process.exit(1); }
    console.log('削除しました');
  });

brainCommand.addCommand(nodeCmd);

// ----- link -----
const linkCmd = new Command('link').description('リンク管理');

linkCmd
  .command('create')
  .description('ノード間リンクを追加')
  .requiredOption('--from <id>', 'リンク元ノードID')
  .requiredOption('--to <id>', 'リンク先ノードID')
  .requiredOption('--type <type>', 'リンク種別（例: relates, blocks, implements）')
  .action((opts) => {
    const link = createLink({ from_id: opts.from, to_id: opts.to, type: opts.type });
    console.log(JSON.stringify(link, null, 2));
  });

linkCmd
  .command('list <nodeId>')
  .description('ノードのリンク一覧を表示')
  .action((nodeId: string) => {
    const links = listLinks(nodeId);
    console.log(JSON.stringify(links, null, 2));
  });

brainCommand.addCommand(linkCmd);

// ----- decision -----
const decCmd = new Command('decision').description('設計判断管理');

decCmd
  .command('create')
  .description('設計判断を記録')
  .requiredOption('--title <title>', 'タイトル')
  .requiredOption('--decision <decision>', '決定内容')
  .option('--context <context>', '背景・経緯', '')
  .option('--consequences <consequences>', '影響・トレードオフ', '')
  .action((opts) => {
    const dec = createDecision({
      title: opts.title,
      decision: opts.decision,
      context: opts.context,
      consequences: opts.consequences,
    });
    console.log(JSON.stringify(dec, null, 2));
  });

decCmd
  .command('list')
  .description('設計判断一覧を表示')
  .action(() => {
    const decisions = listDecisions();
    console.log(JSON.stringify(decisions, null, 2));
  });

brainCommand.addCommand(decCmd);
```

ファイルパス: `~/claude-kit/packages/ck/src/cli/commands/brain.ts`

- [ ] **Step 2: 動作確認**

```bash
cd ~/claude-kit/packages/ck
bun src/cli.ts brain node create --kind note --title "テスト" --body "確認用"
```

Expected: JSON形式でノードが出力される（id, kind, title, body, tags, created_at を含む）

- [ ] **Step 3: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/cli/commands/brain.ts
git commit -m "feat: add brain CLI commands (node, link, decision)"
```

---

## Task 8: Setup コマンド

**Files:**
- Create: `~/claude-kit/packages/ck/src/cli/commands/setup.ts`

- [ ] **Step 1: setup.ts を実装する**

`execFileSync` を使用してシェルインジェクションを防ぐ。

```typescript
import { Command } from 'commander';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';

const PLUGIN_DIR = join(dirname(import.meta.dir), '..', '..', '..', 'plugins', 'ck');

export const setupCommand = new Command('setup')
  .description('Claude Code プラグインを登録し初期設定を行う')
  .action(() => {
    console.log(`プラグインディレクトリ: ${PLUGIN_DIR}`);
    console.log('Claude Code プラグインを登録中...');
    try {
      execFileSync('claude', ['plugin', 'install', PLUGIN_DIR], { stdio: 'inherit' });
      console.log('登録完了');
    } catch {
      console.error('登録失敗。claude CLIが利用可能か確認してください。');
      process.exit(1);
    }
  });
```

ファイルパス: `~/claude-kit/packages/ck/src/cli/commands/setup.ts`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/cli/commands/setup.ts
git commit -m "feat: add setup command for Claude Code plugin registration"
```

---

## Task 9: bun link で ck をグローバルインストール

- [ ] **Step 1: packages/ck で bun link を実行**

```bash
cd ~/claude-kit/packages/ck && bun link
```

Expected: `Linked @personal/claude-kit` と表示される

- [ ] **Step 2: ck コマンドが使えることを確認**

```bash
ck --version
```

Expected: `0.1.0`

```bash
ck brain node create --kind note --title "動作確認" --body "bun linkが機能している"
```

Expected: JSON形式でノードが出力される

---

## Task 10: プラグインスタブ

**Files:**
- Create: `~/claude-kit/plugins/ck/.claude-plugin/plugin.json`
- Create: `~/claude-kit/plugins/ck/package.json`
- Create: `~/claude-kit/plugins/ck/skills/*/SKILL.md` （7ファイル）

- [ ] **Step 1: ディレクトリ作成**

```bash
mkdir -p ~/claude-kit/plugins/ck/.claude-plugin
mkdir -p ~/claude-kit/plugins/ck/skills/{handoff,kickoff,review,help,git-issue-plan,ck-note,ck-todo}
```

- [ ] **Step 2: plugin.json を作成**

```json
{
  "name": "ck",
  "description": "個人用 Claude Code スキル管理・ナレッジグラフ",
  "version": "0.1.0"
}
```

ファイルパス: `~/claude-kit/plugins/ck/.claude-plugin/plugin.json`

- [ ] **Step 3: plugins/ck/package.json を作成**

```json
{
  "name": "@personal/claude-kit-plugin",
  "version": "0.1.0",
  "private": true
}
```

ファイルパス: `~/claude-kit/plugins/ck/package.json`

- [ ] **Step 4: 各スタブ SKILL.md を作成（7ファイル）**

`plugins/ck/skills/handoff/SKILL.md`:
```markdown
---
name: handoff
description: セッション終了時または中断時に作業状態を保存し、次のセッションで復帰できるようにする
user-invocable: true
allowed-tools: Bash(git *), Read, Write, Task
argument-hint: <任意: トピックスラグ>
---

!`ck skill print handoff`
```

`plugins/ck/skills/kickoff/SKILL.md`:
```markdown
---
name: kickoff
description: タスク開始時に自動でコードベースをサーベイし、Discussion Briefing を生成する非対話型スキル
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Task
argument-hint: <タスク説明>
---

!`ck skill print kickoff`
```

`plugins/ck/skills/review/SKILL.md`:
```markdown
---
name: review
description: 実装完了後に型チェック・Lintを実行し、コーディング規約に照らしてコードレビューを行う
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
---

!`ck skill print review`
```

`plugins/ck/skills/help/SKILL.md`:
```markdown
---
name: help
description: プロジェクト固有のQ&Aルーター。CLAUDE.md → .claude/docs/ → コードの優先順で回答する
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
argument-hint: <質問>
---

!`ck skill print help`
```

`plugins/ck/skills/git-issue-plan/SKILL.md`:
```markdown
---
name: git-issue-plan
description: GitHub / GitLab の Issue を一覧表示して選択し、実装計画を作成する
user-invocable: true
allowed-tools: Bash(gh *), Bash(glab *), Bash(git *), Read, Grep, Glob, Task
---

!`ck skill print git-issue-plan`
```

`plugins/ck/skills/ck-note/SKILL.md`:
```markdown
---
name: ck-note
description: メモをナレッジグラフに素早く記録する。自動タグ付け・関連ノードへのリンク付き
user-invocable: true
allowed-tools: Bash(ck *), Read
argument-hint: <メモ内容>
---

!`ck skill print ck-note`
```

`plugins/ck/skills/ck-todo/SKILL.md`:
```markdown
---
name: ck-todo
description: TODO をナレッジグラフに素早くキャプチャし、LLM によるグルーミングを行う
user-invocable: true
allowed-tools: Bash(ck *), Read
argument-hint: <TODO内容>
---

!`ck skill print ck-todo`
```

- [ ] **Step 5: コミット**

```bash
cd ~/claude-kit
git add plugins/
git commit -m "feat: add plugin stubs for Claude Code marketplace"
```

---

## Task 11: スキル本体 — handoff

**Files:**
- Create: `~/claude-kit/packages/ck/src/skills/handoff/body.md`

- [ ] **Step 1: handoff/body.md を作成**

yaesu-v2 版から「git commit 禁止」など yaesu-v2 固有の制約を取り除き汎用化する。

```markdown
---
name: handoff
description: セッション終了時または中断時に作業状態を保存し、次のセッションで復帰できるようにする
---

# handoff

次のセッションがコンテキストを再発見せずに作業を引き継げる状態を記録する。
出力先: `.claude/works/handoffs/<YYYY-MM-DD>-<slug>.md`（gitignore 対象、一時的）

## 手順

### Step 1: スラグと日付を決定する

- `$ARGUMENTS` にスラグが指定されている場合は kebab-case に正規化して使用する
- 指定がない場合は `git branch --show-current` でブランチ名を取得して正規化する
  （例: `feat/add-form` → `feat-add-form`）
- 今日の日付を `YYYY-MM-DD` 形式で取得する

### Step 2: ディレクトリを確認する

```sh
mkdir -p .claude/works/handoffs
```

### Step 3: 状態を収集する

- **Topic context** — 何を作業していたか、なぜか
- **Last action** — 最後の意味ある変更（`git log -1 --oneline` と会話コンテキストから）
- **Pending work** — 進行中または次に予定している作業（`git status --short`）
- **Open questions** — 先に進むために必要な回答が得られていない疑問点
- **Recent commits** — `git log -5 --oneline` の出力

### Step 4: ファイルに書き出す

ファイルパス: `.claude/works/handoffs/<YYYY-MM-DD>-<slug>.md`

ファイルが存在しない場合は新規作成、存在する場合は新しいエントリを追記する。

~~~markdown
# Handoff: <slug>

## Topic context
<一段落でタスクをまとめる>

---

## Entry: <ISO タイムスタンプ>

### Last action
<コミットハッシュ + メッセージ、またはコミット前の最後の変更説明>

### Pending work
- [ ] 項目

### Uncommitted changes
```sh
<git status --short の出力>
```

### Open questions
- 疑問点

### Recent commits
```sh
<git log -5 --oneline の出力>
```

### Notes
<保存しておきたい自由記述のコンテキスト>
~~~

### Step 5: 確認する

ファイルパスと記録した内容の1行サマリーを表示する。

## 復帰方法

次のセッション開始時:
1. `.claude/works/handoffs/` で最新ファイルを確認する
2. 最新の `## Entry` ブロックを読む
3. `git status` と `git log -5 --oneline` で作業ツリーを確認する

## 制約

- 既存の `## Entry` ブロックを編集・削除しない — 追記のみ
- `git add` を実行しない（gitignore 対象）
```

ファイルパス: `~/claude-kit/packages/ck/src/skills/handoff/body.md`

- [ ] **Step 2: ck skill print で出力確認**

```bash
ck skill print handoff | head -5
```

Expected: `---` から始まるフロントマターが出力される

- [ ] **Step 3: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/skills/handoff/body.md
git commit -m "feat: add handoff skill"
```

---

## Task 12: スキル本体 — kickoff

**Files:**
- Create: `~/claude-kit/packages/ck/src/skills/kickoff/body.md`

- [ ] **Step 1: kickoff/body.md を作成**

yaesu-v2 版から `packages/core/CLAUDE.md` などプロジェクト固有の参照を取り除き汎用化する。

```markdown
---
name: kickoff
description: タスク開始時に自動でコードベースをサーベイし、Discussion Briefing を生成する非対話型スキル
---

# kickoff

タスクに着手する前にコードベースを調査し、Discussion Briefing を作成する。**非対話型** — 途中でユーザーに質問しない。

## 手順

### Step 1: トピックとスラグを特定する

`$ARGUMENTS` からタスク説明を解析し、kebab-case のスラグを導出する。
（例: "申請フォームを追加したい" → `add-application-form`）

Issue キー検出: `$ARGUMENTS` に `#<数字>` が含まれる場合、数字をスラグのプレフィックスとする。
（例: "ログイン修正 #42" → `42-fix-login`）

### Step 2: コードベースをサーベイする

以下のプロンプト構造で Explore サブエージェント（Task, subagent_type: Explore）を1つ起動する:

```
あなたは調査専用エージェントです。AskUserQuestion・EnterPlanMode などの対話型ツールは使用しないでください。

## ゴール
[タスクの内容を再掲。何を調査すればこのタスクを上手く議論できるかを示す。]

## 調査内容
[具体的な調査質問: Xはどこにあるか、Yの周辺にどのパターンがあるか、Zの依存関係は何か。]

以下の形式で返答すること:
### Files
- `path/to/file` — トピックとの関連性
### Patterns
- パターン名 — 見つかった規約やパターンの説明
### Dependencies
- 依存関係 — トピックとの関係
### Open Questions
- 質問 — この調査だけでは不明な点
```

利用可能な場合は `CLAUDE.md`（ルートおよびサブエリア）を参照するようサブエージェントに伝える。

### Step 3: Discussion Briefing を合成する

```markdown
- **Topic**: <一文でタスクをまとめる>
- **Background**: <コードベース調査の主要な発見・現状・既存パターン>
- **Key Questions**: <依存関係の順に並べた2〜4つの設計上の問い>
- **Constraints**: <調査で浮かび上がった技術的・設計的な制約>
```

### Step 4: 次のスキルを提案する

issue の性質から適切なスキルを提案する（自動で呼び出さない）:

- バグ・エラー → `superpowers:systematic-debugging`
- 設計判断が必要な新機能 → `superpowers:brainstorming`
- 方向性が明確な実装タスク → `superpowers:writing-plans`

## 制約

- **非対話型**: `AskUserQuestion` を使用しない
- **既存コードへの書き込みなし**
- **サブエージェント予算**: コードベースサーベイ1つのみ
```

ファイルパス: `~/claude-kit/packages/ck/src/skills/kickoff/body.md`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/skills/kickoff/body.md
git commit -m "feat: add kickoff skill"
```

---

## Task 13: スキル本体 — review

**Files:**
- Create: `~/claude-kit/packages/ck/src/skills/review/body.md`

- [ ] **Step 1: review/body.md を作成**

yaesu-v2 版から TanStack / Drizzle / pnpm 固有チェックを取り除き汎用化する。

```markdown
---
name: review
description: 実装完了後に型チェック・Lintを実行し、コーディング規約に照らしてコードレビューを行う
---

# コードレビュー

実装完了後に以下のステップを順番に実行し、レビュー結果を報告する。

---

## Step 1: 自動チェックの実行

プロジェクトで設定されているチェックコマンドを実行する。エラーがあっても Step 2 以降を続ける。

TypeScript プロジェクトの場合:
```bash
npx tsc --noEmit   # または bun tsc --noEmit
```

Linter が設定されている場合:
```bash
npx eslint .       # または bun lint / pnpm lint
```

コマンドが存在しない場合はスキップし、その旨を記録する。

## Step 2: 差分レビュー

`git diff --name-only HEAD~1 HEAD`（またはコミット前なら `git diff`）で変更ファイルを確認し、以下を検査する。

**コード品質:**
- [ ] 未使用の import・変数がないか
- [ ] `null` / `undefined` の考慮漏れがないか
- [ ] 型アサーション（`as`、`!`）を不必要に使っていないか
- [ ] フォルダ構成・命名規則が CLAUDE.md に従っているか

**セキュリティ:**
- [ ] ユーザー入力のバリデーションをサーバー側で行っているか
- [ ] 機密情報（パスワード・トークン）をログや API レスポンスに含めていないか
- [ ] SQL / コマンドインジェクションのリスクがないか

**論理的整合性:**
- [ ] 変更の意図と実装が一致しているか
- [ ] エッジケース（空配列・null・境界値）が考慮されているか

## Step 3: エージェントレビュー（オプション）

以下に該当する場合、`superpowers:code-reviewer` エージェントを起動して独立した視点でレビューする:
- Step 1〜2 で **high / medium** の問題が見つかった場合
- 変更規模が大きい場合（5ファイル超または新規機能追加）

---

## レビュー結果の報告形式

問題あり:
```
## レビュー結果
- 型チェック: ✅ / ❌ N件
- Lint: ✅ / ❌ N件

**[high/medium/low]** カテゴリ
- ファイル: path/to/file.ts:行番号
- 問題: 内容
- 修正案: 対応方法

合計 N件
```

問題なし: 「レビュー完了 — 指摘事項なし」と明示する。

| 重要度 | 基準 |
|--------|------|
| high   | セキュリティ・認証漏れ・本番障害リスク |
| medium | 機能の正確性・保守性に影響 |
| low    | コード品質・規約違反 |
```

ファイルパス: `~/claude-kit/packages/ck/src/skills/review/body.md`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/skills/review/body.md
git commit -m "feat: add review skill"
```

---

## Task 14: スキル本体 — help

**Files:**
- Create: `~/claude-kit/packages/ck/src/skills/help/body.md`

- [ ] **Step 1: help/body.md を作成**

yaesu-v2 版から固有の CLAUDE.md パスを取り除き汎用化する。

```markdown
---
name: help
description: プロジェクト固有のQ&Aルーター。CLAUDE.md → .claude/docs/ → コードの優先順で回答する
---

# help

「このプロジェクトでXはどうやる？」という質問に答える。信頼できるソースを先に検索し、ソースが回答をカバーしていない場合は LLM の推論を明示的な注釈付きで使用する。

## ルーティングフロー

### Step 1: 信頼できるソースを検索する

以下の優先順で検索する。確信が持てる回答が得られた時点で止める。

1. **CLAUDE.md**（ルートおよびサブエリア） — プロジェクト規約の第一ソース
2. **`.claude/docs/`** — `grep -ri "<キーワード>" .claude/docs/` で検索
3. **コード** — 最終手段。`Grep` / `Glob` でシンボルやパターンを検索

### Step 2: 質問を分類する

| 質問の形 | ルーティング |
|---------|------------|
| 手続き型（Xはどうやって実行する？） | ソース引用付きで直接回答 |
| 設計上の判断（XとYどちらを使うべきか？） | `/kickoff` または `/brainstorming` を提案 |
| 歴史的背景（なぜXはこうなっているのか？） | ソースを検索して引用 |
| 調査（これはバグか？） | コードを読んで不確実性を明示しながら見解を述べる |

### Step 3: 回答する

**手続き型・歴史的・調査系の質問:**
- ソースを引用する: `path:行番号` 形式または CLAUDE.md セクション名
- 部分的な回答の場合は何がドキュメント化されていて何が推論かを明示する

**設計判断の質問:**
- このスキルで回答しようとしない — `/kickoff` または `/brainstorming` を提案する

**ソースが回答をサポートしない場合:**

> **注意**: CLAUDE.md や .claude/docs/ に直接記述がないため、コードベースからの推論です。

その後、推論の根拠となったコードやコンテキストを引用する。

## 制約

- 読み取り専用。いかなるファイルも書き込まない
- 設計上の判断は回答しようとせず、適切なスキルへルーティングする
- 回答は簡潔に。ポインタや Yes/No を求めている
```

ファイルパス: `~/claude-kit/packages/ck/src/skills/help/body.md`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/skills/help/body.md
git commit -m "feat: add help skill"
```

---

## Task 15: スキル本体 — git-issue-plan

**Files:**
- Create: `~/claude-kit/packages/ck/src/skills/git-issue-plan/body.md`

- [ ] **Step 1: git-issue-plan/body.md を作成**

yaesu-v2 版（GitLab のみ）を GitHub / GitLab 両対応に拡張する。

```markdown
---
name: git-issue-plan
description: GitHub / GitLab の Issue を一覧表示して選択し、実装計画を作成する
---

# git-issue-plan

リモートに登録された自分向けの Issue を確認し、実装計画（Plan）を作成する。

## Phase 1: リモートプロバイダーの検出

```bash
git remote get-url origin
```

URL から自動検出する:
- `github.com` を含む → GitHub（`gh` CLI を使用）
- それ以外 → GitLab（`glab` CLI を使用）

### GitHub の場合: gh CLI の確認

```bash
which gh && gh auth status
```

`gh` が見つからない場合:
```bash
sudo apt install gh
gh auth login
```

### GitLab の場合: glab CLI の確認

```bash
which glab && glab auth status
```

`glab` が見つからない場合:
```bash
sudo apt install glab
glab auth login
```

CLI が使えない / 未ログインの場合は案内して停止する。

## Phase 2: Issue 一覧の取得

**GitHub:**
```bash
gh issue list --assignee @me --json number,title,labels
```

**GitLab:**
```bash
glab issue list --assignee @me --output json
```

取得した Issue を以下の形式で表示する:

| # | タイトル | ラベル |
|---|--------|--------|

Issue が 0 件の場合はその旨を伝えて終了する。

## Phase 3: Issue の選択と詳細確認

ユーザーに「対象の Issue 番号を教えてください」と尋ねる。

**GitHub:**
```bash
gh issue view {number}
```

**GitLab:**
```bash
glab issue view {number}
```

取得した内容（title, description, labels）を日本語で要約して表示する。
body が空または極端に短い場合はユーザーに補足情報を求める。

## Phase 4: コードベースサーベイ（kickoff）

Skill tool で `kickoff` スキルを呼び出す。引数:
```
#<issue番号> <issueタイトル>
例: "#42 申請フォームのバリデーションを追加"
```

`kickoff` がコードベースをサーベイし Discussion Briefing を作成する。
その後 `kickoff` が次のスキルを提案するので、ユーザーが判断して進む。

## 重要なルール

- Phase を順番通りに実行する。スキップ禁止
- CLI がない / 未ログインの場合は必ず案内で停止する
- `writing-plans` はユーザーが判断して呼び出す（自動遷移しない）
```

ファイルパス: `~/claude-kit/packages/ck/src/skills/git-issue-plan/body.md`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/skills/git-issue-plan/body.md
git commit -m "feat: add git-issue-plan skill (GitHub + GitLab)"
```

---

## Task 16: スキル本体 — ck-note（新規）

**Files:**
- Create: `~/claude-kit/packages/ck/src/skills/ck-note/body.md`

- [ ] **Step 1: ck-note/body.md を作成**

```markdown
---
name: ck-note
description: メモをナレッジグラフに素早く記録する
---

# ck-note

会話中のメモ・気づき・調査結果をナレッジグラフに記録する。

## 手順

### Step 1: メモ内容を把握する

`$ARGUMENTS` にメモ内容が渡された場合はそれを使用する。
渡されていない場合は「何をメモしますか？」と1行で尋ねる。

### Step 2: タグを自動推定する

メモの内容から適切なタグを1〜3個推定する。
例: "Reactのレンダリング最適化について" → `["react", "performance"]`

### Step 3: 関連ノードを検索する

タグのキーワードで既存ノードを検索し、関連するものがあればリンク候補として提示する。

```bash
ck brain node search "<キーワード>"
```

### Step 4: ノードを作成する

```bash
ck brain node create \
  --kind note \
  --title "<メモのタイトル（1行要約）>" \
  --body "<メモ内容>" \
  --tags "<tag1>,<tag2>"
```

### Step 5: 関連ノードへリンクする（オプション）

Step 3 で関連ノードが見つかった場合、ユーザーに確認してリンクを作成する。

```bash
ck brain link create \
  --from <新ノードID> \
  --to <関連ノードID> \
  --type relates
```

### Step 6: 完了を報告する

作成したノードの ID とタイトルを1行で表示する。
```

ファイルパス: `~/claude-kit/packages/ck/src/skills/ck-note/body.md`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/skills/ck-note/body.md
git commit -m "feat: add ck-note skill"
```

---

## Task 17: スキル本体 — ck-todo（新規）

**Files:**
- Create: `~/claude-kit/packages/ck/src/skills/ck-todo/body.md`

- [ ] **Step 1: ck-todo/body.md を作成**

```markdown
---
name: ck-todo
description: TODO をナレッジグラフに素早くキャプチャし、LLM によるグルーミングを行う
---

# ck-todo

やるべきことをナレッジグラフに記録し、既存の TODO と重複・依存関係を整理する。

## 手順

### Step 1: TODO 内容を把握する

`$ARGUMENTS` に TODO 内容が渡された場合はそれを使用する。
渡されていない場合は「何をTODOとして登録しますか？」と1行で尋ねる。

### Step 2: 既存の TODO を確認する

```bash
ck brain node search "todo"
```

似た TODO が既存にある場合は重複の可能性をユーザーに伝える。

### Step 3: 優先度・タグをグルーミングする

TODO の内容から以下を推定してユーザーに提示する:
- **優先度**: high / medium / low
- **タグ**: 関連機能・コンポーネント名など

ユーザーが修正なければそのまま使用する。

### Step 4: ノードを作成する

```bash
ck brain node create \
  --kind todo \
  --title "<TODO のタイトル（動詞から始める）>" \
  --body "<詳細・背景・完了条件>" \
  --tags "<priority:high|medium|low>,<tag1>,<tag2>"
```

### Step 5: 依存関係をリンクする（オプション）

Step 2 で依存・ブロック関係のある TODO が見つかった場合、ユーザーに確認してリンクを作成する。

```bash
ck brain link create \
  --from <新ノードID> \
  --to <依存ノードID> \
  --type blocks
```

### Step 6: 完了を報告する

作成したノードの ID とタイトルを1行で表示する。
```

ファイルパス: `~/claude-kit/packages/ck/src/skills/ck-todo/body.md`

- [ ] **Step 2: 全スキルが認識されていることを確認**

```bash
ck skill list
```

Expected:
```
ck-note
ck-todo
git-issue-plan
handoff
help
kickoff
review
```

- [ ] **Step 3: コミット**

```bash
cd ~/claude-kit
git add packages/ck/src/skills/ck-todo/body.md
git commit -m "feat: add ck-todo skill"
```

---

## Task 18: README

**Files:**
- Create: `~/claude-kit/README.md`

- [ ] **Step 1: README.md を作成**

```markdown
# claude-kit

個人用 Claude Code プラグインリポジトリ。`ck` CLI・ナレッジグラフ・7つのスキルを提供する。

---

## セットアップ

### 1. 依存インストール

```bash
cd ~/claude-kit
bun install
```

### 2. ck CLI をグローバルインストール

```bash
cd ~/claude-kit/packages/ck
bun link
```

`ck --version` で `0.1.0` が表示されれば成功。

### 3. Claude Code プラグインを登録

```bash
ck setup
```

または手動で:

```bash
claude plugin install ~/claude-kit/plugins/ck
```

---

## ck CLI リファレンス

### スキル管理

```bash
# スキル本体を標準出力（プラグインスタブから自動で呼ばれる）
ck skill print <name>

# 利用可能なスキル一覧を表示
ck skill list
```

### ナレッジグラフ — ノード

ノードはメモ・TODO・設計判断・調査結果などの情報単位。`~/.ck-brain/brain.db` に保存される。

```bash
# ノードを追加（kind: note | todo | decision | research）
ck brain node create --kind note --title "タイトル" --body "内容" --tags "tag1,tag2"

# IDでノードを取得
ck brain node get <id>

# タイトル・本文で全文検索
ck brain node search "キーワード"

# ノードを更新
ck brain node update <id> --title "新タイトル"

# ノードを削除
ck brain node delete <id>
```

使用例:
```bash
ck brain node create --kind todo --title "ログイン画面を実装する" --tags "auth,frontend"
# → { "id": "abc-123", "kind": "todo", "title": "ログイン画面を実装する", ... }

ck brain node search "ログイン"
# → [{ "id": "abc-123", "title": "ログイン画面を実装する", ... }]
```

### ナレッジグラフ — リンク

ノード間の関係を有向リンクで表現する（type 例: relates, blocks, implements, depends-on）。

```bash
# リンクを追加
ck brain link create --from <fromId> --to <toId> --type <type>

# ノードのリンク一覧
ck brain link list <nodeId>
```

### ナレッジグラフ — 設計判断

重要な設計判断を記録・参照するための専用テーブル。

```bash
# 設計判断を記録
ck brain decision create \
  --title "ORMの選定" \
  --decision "DrizzleORMを採用" \
  --context "型安全性とEdge Runtime対応が必要だった" \
  --consequences "Drizzle固有のクエリビルダーを学習する必要がある"

# 設計判断一覧
ck brain decision list
```

### セットアップ

```bash
# Claude Code プラグインを登録
ck setup
```

---

## スキルリファレンス

Claude Code で `/` コマンドとして呼び出せる。

### `handoff` — セッション引き継ぎ

セッション終了時に作業状態を `.claude/works/handoffs/` に保存する。次のセッションで迷わず作業を再開できる。

```
/handoff              # ブランチ名をスラグとして使用
/handoff my-feature   # スラグを明示指定
```

### `kickoff` — タスク開始サーベイ

タスクを始める前にコードベースを自動調査し、Discussion Briefing を生成する。設計の判断が必要な非自明なタスクを始める前に使う。

```
/kickoff ユーザー認証機能を追加したい
/kickoff #42 申請フォームのバリデーション
```

### `review` — コードレビュー

実装完了後に型チェック・Lint を実行し、コーディング規約に照らしてレビューする。

```
/review
```

### `help` — プロジェクトQ&A

「このプロジェクトでXはどうやる？」という質問に CLAUDE.md → `.claude/docs/` → コードの順で答える。

```
/help サーバー関数はどこに書く？
/help DBマイグレーションの実行方法は？
```

### `git-issue-plan` — Issue から実装計画

GitHub / GitLab の Issue を一覧表示し、選択した Issue の実装計画を作成する（GitHub・GitLab 両対応）。

```
/git-issue-plan
```

### `ck-note` — メモを記録

メモをナレッジグラフに素早く記録する。自動タグ付け・関連ノードへのリンク付き。

```
/ck-note Reactのメモ化はuseMemoよりReact.memoが有効なケースがある
```

### `ck-todo` — TODOを記録

TODO をナレッジグラフにキャプチャし、LLM で優先度・タグを整理する。

```
/ck-todo ログイン画面のリダイレクト処理を修正する
```

---

## ナレッジグラフの保存先

`~/.ck-brain/brain.db` — プロジェクトをまたいでグローバルに使用できる。

---

## スキルの更新方法

スキル本体を編集するだけで即反映される（再起動・再インストール不要）。

```bash
$EDITOR ~/claude-kit/packages/ck/src/skills/handoff/body.md
```

---

## 将来の社用 Git への移行

```bash
git remote add origin <社内GitURL>
git push -u origin main
```

スタブ（`plugins/ck/skills/*/SKILL.md`）は変更不要。
パッケージを社内 npm レジストリに publish する場合は `bun publish` を使用する。
```

ファイルパス: `~/claude-kit/README.md`

- [ ] **Step 2: コミット**

```bash
cd ~/claude-kit
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Task 19: 最終テストと Claude Code プラグイン登録

- [ ] **Step 1: 全テストを実行**

```bash
cd ~/claude-kit/packages/ck && bun test
```

Expected: 全テスト PASS（12件以上）

- [ ] **Step 2: ck skill list で全スキルが表示されることを確認**

```bash
ck skill list
```

Expected:
```
ck-note
ck-todo
git-issue-plan
handoff
help
kickoff
review
```

- [ ] **Step 3: Claude Code にプラグインを登録**

```bash
ck setup
```

または:
```bash
claude plugin install ~/claude-kit/plugins/ck
```

- [ ] **Step 4: Claude Code を再起動して `/handoff` が認識されることを確認**

Claude Code セッションを再起動し、以下を試す:
```
/handoff
```

Expected: handoff スキルが実行される

- [ ] **Step 5: 最終コミット**

```bash
cd ~/claude-kit && git log --oneline
```

Expected: Task 1〜18 のコミットが並んでいる
```
