# claude-kit 7 Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** claude-kit の安定性・UX・拡張性を向上させる7項目の改善を実装する（brain.db のマルチプロジェクト対応、リンク型 Enum 化、/resume スキル新設など）

**Architecture:** DB 基盤（project_id カラム追加・LinkType Enum）→ CLI 拡張（brain.ts バリデーション・skill update コマンド）→ スキル本体変更（handoff/kickoff/resume）→ 設定ファイル追加の順に実装する。各 Phase は独立してコミット可能。`detectProjectId()` は `Bun.spawnSync` を使い child_process を使わない形で実装する。

**Tech Stack:** Bun + TypeScript, bun:sqlite, Commander.js, bun test

---

## ファイル構造

| ファイル | 種別 | 責務 |
|---|---|---|
| `packages/ck/src/core/types.ts` | 変更 | `LinkType` 定数と型を追加 |
| `packages/ck/src/core/db.ts` | 変更 | `project_id` カラムのマイグレーション・全関数に `projectId` 引数追加 |
| `packages/ck/src/cli/commands/brain.ts` | 変更 | `detectProjectId()` ヘルパー・`link create` のバリデーション追加 |
| `packages/ck/src/cli/commands/skill.ts` | 変更 | `update` サブコマンド追加 |
| `packages/ck/src/skills/handoff/body.md` | 変更 | Write ツール使用の明示・スラグ正規化ルール追記 |
| `packages/ck/src/skills/kickoff/body.md` | 変更 | 探索バジェット制約・Greenfield フォールバック追記 |
| `packages/ck/src/skills/resume/body.md` | 新規作成 | /resume スキル本体 |
| `plugins/ck/skills/resume/SKILL.md` | 新規作成 | /resume スキルスタブ |
| `ck-config.json` | 新規作成 | 社内移行用設定テンプレート |
| `CLAUDE.md` | 変更 | 移行手順追記 |
| `packages/ck/tests/core/db.test.ts` | 変更 | project_id 分離テストを追加 |
| `packages/ck/tests/core/types.test.ts` | 新規作成 | LinkType バリデーションテスト |
| `packages/ck/tests/cli/skill.test.ts` | 変更 | skill update テストを追加 |

---

## Phase 1: DB スキーマ変更

### Task 1: `LinkType` Enum を types.ts に追加

**Files:**
- Modify: `packages/ck/src/core/types.ts`
- Create: `packages/ck/tests/core/types.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`packages/ck/tests/core/types.test.ts` を作成:

```ts
import { describe, test, expect } from 'bun:test';
import { LINK_TYPES } from '../../src/core/types';

describe('LinkType', () => {
  test('LINK_TYPES に4種の型が含まれる', () => {
    expect(LINK_TYPES).toContain('relates');
    expect(LINK_TYPES).toContain('blocks');
    expect(LINK_TYPES).toContain('implements');
    expect(LINK_TYPES).toContain('depends-on');
    expect(LINK_TYPES).toHaveLength(4);
  });

  test('LINK_TYPES は配列である', () => {
    expect(Array.isArray(LINK_TYPES)).toBe(true);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

```bash
cd packages/ck && bun test tests/core/types.test.ts
```

期待: `LINK_TYPES is not exported` エラー

- [ ] **Step 3: `types.ts` に `LINK_TYPES` と `LinkType` を追加する**

`packages/ck/src/core/types.ts` の `BrainLink` インターフェース前に追加:

```ts
// リンク型の許可リスト（Enum相当）
export const LINK_TYPES = ['relates', 'blocks', 'implements', 'depends-on'] as const;
export type LinkType = typeof LINK_TYPES[number];
```

同ファイルの `BrainLink.type` を `string` から `LinkType` に変更:

```ts
export interface BrainLink {
  from_id: string;
  to_id: string;
  type: LinkType;
}
```

- [ ] **Step 4: テストが通ることを確認する**

```bash
cd packages/ck && bun test tests/core/types.test.ts
```

期待: `2 tests passed`

- [ ] **Step 5: コミット**

```bash
git add packages/ck/src/core/types.ts packages/ck/tests/core/types.test.ts
git commit -m "feat: add LinkType enum to types.ts"
```

---

### Task 2: `db.ts` に `project_id` カラムを追加する

**Files:**
- Modify: `packages/ck/src/core/db.ts`
- Modify: `packages/ck/tests/core/db.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`packages/ck/tests/core/db.test.ts` の末尾（最後の `});` の後）に以下を追加:

```ts
describe('project_id による分離', () => {
  test('異なる projectId のノードは互いに検索できない', () => {
    createNode({ kind: 'note', title: 'プロジェクトA のノード' }, TEST_DB_PATH, 'project-a');
    createNode({ kind: 'note', title: 'プロジェクトB のノード' }, TEST_DB_PATH, 'project-b');

    const resultsA = searchNodes('ノード', TEST_DB_PATH, 'project-a');
    const resultsB = searchNodes('ノード', TEST_DB_PATH, 'project-b');

    expect(resultsA).toHaveLength(1);
    expect(resultsA[0].title).toBe('プロジェクトA のノード');
    expect(resultsB).toHaveLength(1);
    expect(resultsB[0].title).toBe('プロジェクトB のノード');
  });

  test('projectId なしでは全ノードを返す（後方互換）', () => {
    createNode({ kind: 'note', title: 'グローバルノード' }, TEST_DB_PATH);
    const results = searchNodes('グローバル', TEST_DB_PATH);
    expect(results).toHaveLength(1);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

```bash
cd packages/ck && bun test tests/core/db.test.ts
```

期待: `Expected 2 arguments, but got 3` 型エラーまたはテスト失敗

- [ ] **Step 3: `openDb()` に `project_id` マイグレーションを追加する**

`packages/ck/src/core/db.ts` の `openDb()` 内の `db.exec(...)` の後に以下を追加:

```ts
  // project_id カラムの追加（既存DBへのマイグレーション、カラム存在時はスキップ）
  try { db.exec('ALTER TABLE nodes ADD COLUMN project_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE decisions ADD COLUMN project_id TEXT'); } catch {}
```

- [ ] **Step 4: db.ts の全関数に `projectId?: string` 引数を追加する**

`packages/ck/src/core/db.ts` の各関数を以下の通り変更する:

**`createNode`** — シグネチャと INSERT 文を変更:
```ts
export function createNode(
  input: { kind: NodeKind; title: string; body?: string; tags?: string[] },
  dbPath?: string,
  projectId?: string,
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
    'INSERT INTO nodes (id, kind, title, body, tags, created_at, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [node.id, node.kind, node.title, node.body, JSON.stringify(node.tags), node.created_at, projectId ?? null],
  );
  return node;
}
```

**`getNode`** — シグネチャと SELECT 文を変更:
```ts
export function getNode(id: string, dbPath?: string, projectId?: string): BrainNode | null {
  const db = openDb(dbPath);
  const sql = projectId
    ? 'SELECT * FROM nodes WHERE id = ? AND project_id = ?'
    : 'SELECT * FROM nodes WHERE id = ?';
  const params: unknown[] = projectId ? [id, projectId] : [id];
  const row = db.query(sql).get(...(params as [unknown])) as Record<string, unknown> | null;
  if (!row) return null;
  return { ...(row as Omit<BrainNode, 'tags'>), tags: JSON.parse(row.tags as string) };
}
```

**`searchNodes`** — シグネチャと SELECT 文を変更:
```ts
export function searchNodes(query: string, dbPath?: string, projectId?: string): BrainNode[] {
  const db = openDb(dbPath);
  const sql = projectId
    ? 'SELECT * FROM nodes WHERE (title LIKE ? OR body LIKE ?) AND project_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM nodes WHERE title LIKE ? OR body LIKE ? ORDER BY created_at DESC';
  const params: unknown[] = projectId
    ? [`%${query}%`, `%${query}%`, projectId]
    : [`%${query}%`, `%${query}%`];
  const rows = db.query(sql).all(...(params as [unknown])) as Record<string, unknown>[];
  return rows.map(r => ({ ...(r as Omit<BrainNode, 'tags'>), tags: JSON.parse(r.tags as string) }));
}
```

**`updateNode`** — シグネチャを変更（`getNode` 呼び出しに `projectId` を渡す）:
```ts
export function updateNode(
  id: string,
  input: Partial<Pick<BrainNode, 'title' | 'body' | 'tags'>>,
  dbPath?: string,
  projectId?: string,
): BrainNode | null {
  const existing = getNode(id, dbPath, projectId);
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
```

**`deleteNode`** — シグネチャと DELETE 文を変更:
```ts
export function deleteNode(id: string, dbPath?: string, projectId?: string): boolean {
  const db = openDb(dbPath);
  const sql = projectId
    ? 'DELETE FROM nodes WHERE id = ? AND project_id = ?'
    : 'DELETE FROM nodes WHERE id = ?';
  const params: unknown[] = projectId ? [id, projectId] : [id];
  const result = db.run(sql, params);
  return result.changes > 0;
}
```

**`createDecision`** — シグネチャと INSERT 文を変更:
```ts
export function createDecision(
  input: { title: string; context?: string; decision: string; consequences?: string },
  dbPath?: string,
  projectId?: string,
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
    'INSERT INTO decisions (id, title, context, decision, consequences, created_at, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [dec.id, dec.title, dec.context, dec.decision, dec.consequences, dec.created_at, projectId ?? null],
  );
  return dec;
}
```

**`listDecisions`** — シグネチャと SELECT 文を変更:
```ts
export function listDecisions(dbPath?: string, projectId?: string): Decision[] {
  const db = openDb(dbPath);
  const sql = projectId
    ? 'SELECT * FROM decisions WHERE project_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM decisions ORDER BY created_at DESC';
  const params: unknown[] = projectId ? [projectId] : [];
  return db.query(sql).all(...(params as [])) as Decision[];
}
```

`createLink` と `listLinks` はシグネチャ変更なし（`links` テーブルに `project_id` は不要）。

- [ ] **Step 5: テストが通ることを確認する**

```bash
cd packages/ck && bun test tests/core/db.test.ts
```

期待: 全テスト PASS（既存テストと新規 project_id テストを含む）

- [ ] **Step 6: コミット**

```bash
git add packages/ck/src/core/db.ts packages/ck/tests/core/db.test.ts
git commit -m "feat: add project_id column to nodes and decisions tables"
```

---

### Task 3: `brain.ts` に `detectProjectId()` と link type バリデーションを追加する

**Files:**
- Modify: `packages/ck/src/cli/commands/brain.ts`

- [ ] **Step 1: `brain.ts` のインポートに `LINK_TYPES` と `LinkType` を追加する**

`packages/ck/src/cli/commands/brain.ts` の既存インポートを以下に更新:

```ts
import { Command } from 'commander';
import {
  createNode, getNode, searchNodes, updateNode, deleteNode,
  createLink, listLinks,
  createDecision, listDecisions,
} from '../../core/db';
import type { NodeKind, LinkType } from '../../core/types';
import { LINK_TYPES } from '../../core/types';
```

- [ ] **Step 2: `brain.ts` の末尾に `detectProjectId()` を追加する**

`brainCommand.addCommand(decCmd)` の後に追加:

```ts
// カレントディレクトリの git リポジトリルートを project_id として返す
function detectProjectId(): string | undefined {
  const proc = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel']);
  if (proc.exitCode !== 0) return undefined;
  return new TextDecoder().decode(proc.stdout).trim() || undefined;
}
```

- [ ] **Step 3: `node create` / `get` / `search` / `update` / `delete` に `detectProjectId()` を渡す**

`node create` アクションの `createNode` 呼び出しを変更:
```ts
    const node = createNode(
      {
        kind: opts.kind as NodeKind,
        title: opts.title,
        body: opts.body,
        tags: opts.tags ? opts.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      },
      undefined,
      detectProjectId(),
    );
```

`node get` アクション:
```ts
    const node = getNode(id, undefined, detectProjectId());
```

`node search` アクション:
```ts
    const nodes = searchNodes(query, undefined, detectProjectId());
```

`node update` アクション（`updateNode` の呼び出しを変更）:
```ts
    const node = updateNode(id, input, undefined, detectProjectId());
```

`node delete` アクション:
```ts
    const ok = deleteNode(id, undefined, detectProjectId());
```

`decision create` アクション:
```ts
    const dec = createDecision(
      { title: opts.title, decision: opts.decision, context: opts.context, consequences: opts.consequences },
      undefined,
      detectProjectId(),
    );
```

`decision list` アクション:
```ts
    const decisions = listDecisions(undefined, detectProjectId());
```

- [ ] **Step 4: `link create` に LinkType バリデーションを追加する**

`link create` の `.requiredOption` の description を更新:
```ts
  .requiredOption('--type <type>', `リンク種別（${LINK_TYPES.join('|')}）`)
```

`link create` アクションを変更:
```ts
  .action((opts) => {
    if (!LINK_TYPES.includes(opts.type as LinkType)) {
      console.error(`エラー: 不正なリンク型 "${opts.type}"`);
      console.error(`使用可能な型: ${LINK_TYPES.join(', ')}`);
      process.exit(1);
    }
    const link = createLink({ from_id: opts.from, to_id: opts.to, type: opts.type as LinkType });
    console.log(JSON.stringify(link, null, 2));
  });
```

- [ ] **Step 5: 全テストを実行して通ることを確認する**

```bash
cd packages/ck && bun test
```

期待: 全テスト PASS

- [ ] **Step 6: コミット**

```bash
git add packages/ck/src/cli/commands/brain.ts
git commit -m "feat: add detectProjectId and link type validation to brain command"
```

---

## Phase 2: スキル本体変更

### Task 4: `handoff/body.md` のシェルエスケープ対策を追記する

**Files:**
- Modify: `packages/ck/src/skills/handoff/body.md`

- [ ] **Step 1: Step 1（スラグ・日付）のルールを明確化する**

`packages/ck/src/skills/handoff/body.md` の `### Step 1: スラグと日付を決定する` セクション全体を以下に置き換える:

```markdown
### Step 1: スラグと日付を決定する

- `$ARGUMENTS` にスラグが指定されている場合は kebab-case に正規化して使用する
- 指定がない場合は Bash ツールで `git rev-parse --abbrev-ref HEAD` を実行してブランチ名を取得する
- **スラグ正規化ルール**: 英数字・ハイフン・アンダースコア以外を除去し、空白とスラッシュはハイフンに変換する
  （例: `feat/add-form` → `feat-add-form`）
- 今日の日付を `YYYY-MM-DD` 形式で取得する（Bash: `date +%Y-%m-%d`）
```

- [ ] **Step 2: Step 4（ファイル書き出し）の冒頭に Write ツール使用ルールを追記する**

`### Step 4: ファイルに書き出す` の `ファイルパス:` の行の前に以下を挿入:

```markdown
**重要: ファイルへの書き込みは必ず Write ツールを使用すること。**
Bash で文字列をリダイレクト出力すると特殊文字（`"`, `$`, バッククォート）によるエラーが発生する。

```

- [ ] **Step 3: スキルテストを実行して body.md が存在することを確認する**

```bash
cd packages/ck && bun test tests/cli/skill.test.ts
```

期待: PASS

- [ ] **Step 4: コミット**

```bash
git add packages/ck/src/skills/handoff/body.md
git commit -m "fix: clarify Write tool usage and slug normalization in handoff skill"
```

---

### Task 5: `/resume` スキルを新設する

**Files:**
- Create: `packages/ck/src/skills/resume/body.md`
- Create: `plugins/ck/skills/resume/SKILL.md`

- [ ] **Step 1: `resume/body.md` を作成する**

`packages/ck/src/skills/resume/body.md` を作成:

````markdown
---
name: resume
description: 直近の handoff ファイルを読み込んで前回の作業コンテキストを復帰する
---

# resume

前回セッションの `/handoff` で保存した状態を読み込み、作業を再開する。

## 手順

### Step 1: handoff ディレクトリを確認する

Bash ツールで `.claude/works/handoffs/` ディレクトリを確認する:

```sh
ls -1t .claude/works/handoffs/ 2>/dev/null
```

ディレクトリが存在しない、またはファイルが0件の場合:
→ 「handoff ファイルが見つかりません。`/handoff` を先に実行してください。」と通知して終了する。

### Step 2: 対象ファイルを選択する

- ファイルが1件: 自動選択して Step 3 へ進む
- ファイルが複数件: ファイル名一覧を最新順で表示してユーザーに選択を促す

### Step 3: ファイルを読み込む

Read ツールで選択したファイルを読み込む:

- ファイルパス: `.claude/works/handoffs/<選択したファイル名>`
- 最新の `## Entry` ブロックを中心にコンテキストを把握する

### Step 4: コンテキストを展開して作業再開を通知する

以下の形式でサマリーを表示する:

```markdown
## Resume: <ファイル名>

**Topic**: <Topic context の内容>
**Last action**: <Last action の内容>
**Pending work**:
<Pending work のチェックリスト>
**Open questions**: <Open questions の内容（あれば）>
```

「`<ファイル名>` から作業を再開します。続けますか？」と尋ねてユーザーの指示を待つ。

## 制約

- handoff ファイルの内容を変更・削除しない（Read のみ）
- ユーザーの承認前に実装アクション（ファイル編集・コマンド実行）を開始しない
````

- [ ] **Step 2: `resume/SKILL.md` スタブを作成する**

`plugins/ck/skills/resume/SKILL.md` を作成:

```markdown
---
name: resume
description: 直近の handoff ファイルを読み込んで前回の作業コンテキストを復帰する
user-invocable: true
allowed-tools: Bash(ls *), Read
argument-hint: "<任意: handoff ファイル名>"
---

!`ck skill print resume`
```

- [ ] **Step 3: スキル一覧に resume が含まれることを確認する**

```bash
cd packages/ck && bun run src/cli.ts skill list
```

期待: `resume` がリストに含まれる

- [ ] **Step 4: skill テストを実行する**

```bash
cd packages/ck && bun test tests/cli/skill.test.ts
```

期待: PASS（resume/body.md が存在するため）

- [ ] **Step 5: コミット**

```bash
git add packages/ck/src/skills/resume/body.md plugins/ck/skills/resume/SKILL.md
git commit -m "feat: add /resume skill for handoff-based session recovery"
```

---

## Phase 3: CLI 拡張 + スキル本体変更

### Task 6: `ck skill update` コマンドを追加する

**Files:**
- Modify: `packages/ck/src/cli/commands/skill.ts`

- [ ] **Step 1: `skill.ts` に `update` サブコマンドを追加する**

`packages/ck/src/cli/commands/skill.ts` の `skillCommand.command('copy ...')` ブロックの後に追加:

```ts
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
      const result = stub.replace(/^!`ck skill print [^`]+`\s*$/m, bodyContent);
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
```

- [ ] **Step 2: `ck skill update` のエラーケースを手動確認する**

```bash
cd packages/ck && bun run src/cli.ts skill update handoff
```

期待: `スキル "handoff" はローカルにコピーされていません。先に "ck skill copy handoff" を実行してください。`

- [ ] **Step 3: copy → update の正常系を確認する**

```bash
cd packages/ck && bun run src/cli.ts skill copy handoff && bun run src/cli.ts skill update handoff
```

期待: `✔ handoff を最新版に更新しました`

その後クリーンアップ:
```bash
rm -rf .claude/skills/handoff
```

- [ ] **Step 4: 全テストを実行する**

```bash
cd packages/ck && bun test
```

期待: 全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add packages/ck/src/cli/commands/skill.ts
git commit -m "feat: add ck skill update command"
```

---

### Task 7: `kickoff/body.md` に探索バジェット制約と Greenfield フォールバックを追記する

**Files:**
- Modify: `packages/ck/src/skills/kickoff/body.md`

- [ ] **Step 1: Step 2 の先頭に Greenfield 判定を追加する**

`packages/ck/src/skills/kickoff/body.md` の `### Step 2: コードベースをサーベイする` と `以下のプロンプト構造で` の間に以下を挿入:

```markdown
**Greenfield 判定（サブエージェント起動前に確認）:**
Bash ツールで以下を確認する:
```sh
find . -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" | grep -v node_modules | head -5
```
ファイルが3件未満または `src/` ディレクトリが存在しない場合は、サブエージェントをスキップして Step 3 に進む。
その際、Discussion Briefing の Background に「新規プロジェクト（既存コードなし）」と記載する。

```

- [ ] **Step 2: サブエージェント指示プロンプトに探索制約を追記する**

サブエージェントプロンプト内の `以下の形式で返答すること:` の直前に以下を追加:

```markdown
## 探索制約（厳守）
- 参照ファイルは最大 5 ファイルまで
- ファイル全体の読み込みより、エクスポートされた関数・型定義・クラス名の確認を優先すること
- 各セクション（Files / Patterns / Dependencies / Open Questions）は 5 項目以内に収めること

```

- [ ] **Step 3: 変更が反映されることを確認する**

```bash
cd packages/ck && bun run src/cli.ts skill print kickoff | grep "探索制約"
```

期待: `探索制約（厳守）` が出力される

- [ ] **Step 4: コミット**

```bash
git add packages/ck/src/skills/kickoff/body.md
git commit -m "feat: add exploration budget and greenfield fallback to kickoff skill"
```

---

## Phase 4: 設定ファイル追加

### Task 8: `ck-config.json` と `CLAUDE.md` の移行手順を追加する

**Files:**
- Create: `ck-config.json`
- Modify: `CLAUDE.md`

- [ ] **Step 1: `ck-config.json` をプロジェクトルートに作成する**

`/home/tokumaru/claude-kit/ck-config.json` を作成:

```json
{
  "org": "personal",
  "registry": "https://registry.npmjs.org",
  "pluginName": "claude-kit-plugin"
}
```

- [ ] **Step 2: `CLAUDE.md` の `## コマンド` セクション末尾に移行手順を追記する**

`/home/tokumaru/claude-kit/CLAUDE.md` の `## アーキテクチャ` セクションの前に以下のセクションを追加:

```markdown
## 社内移行時の設定変更

社内 GitLab / npm プライベートレジストリへの移行時は `ck-config.json` を編集する:

| キー | デフォルト | 説明 |
|---|---|---|
| `org` | `personal` | 組織名（パッケージ名の `@<org>` 部分） |
| `registry` | `https://registry.npmjs.org` | npm レジストリ URL |
| `pluginName` | `claude-kit-plugin` | プラグイン名 |

変更後: `bun install && ck setup` を実行してプラグインを再登録する。

```

- [ ] **Step 3: コミット**

```bash
git add ck-config.json CLAUDE.md
git commit -m "feat: add ck-config.json template for org migration"
```

---

## 最終確認

- [ ] **全テストを実行する**

```bash
cd packages/ck && bun test
```

期待: 全テスト PASS

- [ ] **`ck` CLI のヘルプを確認する**

```bash
cd packages/ck && bun run src/cli.ts brain link create --help
```

期待: `relates|blocks|implements|depends-on` がオプション説明に表示される

```bash
cd packages/ck && bun run src/cli.ts skill --help
```

期待: `update` がコマンド一覧に表示される

- [ ] **スキル一覧を確認する**

```bash
cd packages/ck && bun run src/cli.ts skill list
```

期待: `resume` がリストに含まれる
