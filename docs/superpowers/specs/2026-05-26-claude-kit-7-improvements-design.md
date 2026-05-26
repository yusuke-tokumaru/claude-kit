# claude-kit 改善・リファクタリング設計書

**作成日**: 2026-05-26
**トピック**: 安定性・UX・拡張性の向上（7項目）
**実装アプローチ**: DB基盤 → CLI拡張 → スキル本体変更の順

---

## 概要

PDF指示書に基づく7項目の改善。優先度順に High 3件 → Medium 2件 → Low 2件。

---

## 優先度 High — 安定性と安全性の向上

### 1. ナレッジグラフ（brain.db）のマルチプロジェクト対応

**設計方針**: 単一 `~/.ck-brain/brain.db` を維持しつつ、カラム分離でプロジェクトを識別する。

**スキーマ変更**

`openDb()` 内の初期化処理に以下を追加（既にカラムが存在する場合のエラーは try/catch で握り潰す）:

```sql
ALTER TABLE nodes     ADD COLUMN project_id TEXT;
ALTER TABLE decisions ADD COLUMN project_id TEXT;
```

`links` テーブルへの追加は不要（ノードの参照関係であり、ノード側の `project_id` で間接的に分離される）。

**`project_id` の値**

- `git rev-parse --show-toplevel` の出力（絶対パス）をそのまま使用
- ハッシュ化しない（デバッグ時の可読性を優先）
- git リポジトリ外で実行された場合は `undefined`（グローバルデータとして扱う）

**API変更**

`packages/ck/src/core/db.ts` の全関数シグネチャに `projectId?: string` 引数を追加:

- 指定あり: `WHERE project_id = ?`
- 指定なし: `WHERE project_id IS NULL OR project_id = ?`（後方互換）

`packages/ck/src/cli/commands/brain.ts` で各コマンド実行前に `detectProjectId()` ヘルパーを呼び出し、自動的に `projectId` を解決して渡す。

**`detectProjectId()` の実装方針**

`execFileSync("git", ["rev-parse", "--show-toplevel"])` を使用（シェルインジェクション防止のため `execFile` 系を使う）。
取得失敗時は `undefined` を返す。

**既存データのマイグレーション**

既存行の `project_id` は `NULL` のまま残す。グローバルデータとして扱われ、全プロジェクトから参照可能な状態を維持する。

---

### 2. /handoff スキルのシェルエスケープ対策と /resume スキル新設

**シェルエスケープ対策**

`packages/ck/src/skills/handoff/body.md` の書き込み処理フェーズを以下の方針に修正:

- ファイルへの書き込みは **Write ツールのみ使用**（Bash での文字列リダイレクトは使わない）
- ブランチ名・コミットメッセージ等の動的値は Bash ツールで取得後、変数として保持してから Write ツールに渡す
- スラグ生成時の正規化ルールを明記: 英数字・ハイフン・アンダースコア以外を除去し、空白はハイフンに変換

**`/resume` スキル新設**

対象ファイル:
- `plugins/ck/skills/resume/SKILL.md`（スタブ）
- `packages/ck/src/skills/resume/body.md`（本体）

動作フロー:

1. `.claude/works/handoffs/` ディレクトリを確認（存在しない場合は「handoff ファイルが見つかりません。`/handoff` を先に実行してください。」と通知して終了）
2. ファイルが1つ: 自動選択
3. ファイルが複数: ファイル名リストを表示してユーザーに選択を促す
4. Read ツールで選択ファイルを読み込み、内容をセッションのコンテキストとして展開
5. 「`YYYY-MM-DD-<slug>.md` から作業を再開します」と通知し、ユーザーの指示を待つ

---

### 3. ナレッジグラフのリンク型（type）のバリデーション

**型定義の変更**

`packages/ck/src/core/types.ts` に `LinkType` 型を追加:

```ts
export const LINK_TYPES = ["relates", "blocks", "implements", "depends-on"] as const;
export type LinkType = typeof LINK_TYPES[number];
```

`BrainLink.type` を `string` から `LinkType` に変更。

**CLIバリデーション**

`packages/ck/src/cli/commands/brain.ts` の `link create` コマンドで `--type` 受け取り後にバリデーション:

- 不正な型が渡された場合: エラーメッセージ ＋ 許可リストを表示して `process.exit(1)`
- LLM が不正な型を渡した場合、exit code 1 と許可リストを受け取って正しい型で再試行できる

---

## 優先度 Medium — UXと開発効率の向上

### 4. /kickoff スキルの探索バジェット厳格化

`packages/ck/src/skills/kickoff/body.md` の Step 2 サブエージェント指示プロンプトに以下を追記:

```
## 探索制約（厳守）
- 参照ファイルは最大 5 ファイルまで
- ファイル全体の読み込みより、エクスポートされた関数・型定義・クラス名の確認を優先すること
- 各セクション（Files / Patterns / Dependencies / Open Questions）は 5 項目以内に収めること
```

### 5. スキルの上流更新（ck skill update）

**コマンド追加**

`packages/ck/src/cli/commands/skill.ts` に `update <name>` サブコマンドを追加:

- `packages/ck/src/skills/<name>/body.md` を読み込む
- プロジェクトローカルの `.claude/skills/<name>/SKILL.md` が存在するか確認
  - 存在しない場合: 「ローカルにコピーされていません。先に `ck skill copy <name>` を実行してください。」と表示して終了
  - 存在する場合: SKILL.md の本体部分（フロントマター以降）を最新の `body.md` で上書き
- `--all` フラグ: `.claude/skills/` に存在する全スキルを一括更新

**スタブのフロントマター（name / description / allowed-tools）は更新対象外**（安定したメタデータのため）。

---

## 優先度 Low — 将来の拡張性とメンテナンス性

### 6. Greenfield（新規プロジェクト）時の /kickoff フォールバック

`packages/ck/src/skills/kickoff/body.md` の Step 2 に条件分岐を追加:

```
## Greenfield 判定
調査を開始する前に、以下を確認すること:
- プロジェクトのファイル数が 3 未満、または `src/` ディレクトリが存在しない場合は
  コードベース調査をスキップし、Step 3 へ直接進む。
- Discussion Briefing の Background セクションに「新規プロジェクト（既存コードなし）」と記載する。
```

### 7. 社内移行（GitLab / npm）用の構成ファイルテンプレート化

プロジェクトルートに `ck-config.json` を新設（ドキュメント的役割、CLI からは参照しない）:

```json
{
  "org": "personal",
  "registry": "https://registry.npmjs.org",
  "pluginName": "claude-kit-plugin"
}
```

`CLAUDE.md` に移行手順を追記:
> 社内移行時は `ck-config.json` の `org` / `registry` を書き換えてから `bun install && ck setup` を実行。

---

## 実装順序

```
Phase 1 (High): DB スキーマ変更
  1-a. db.ts に project_id カラム追加（ALTER TABLE + try/catch）
  1-b. db.ts 全関数に projectId 引数を追加
  1-c. brain.ts に detectProjectId() を追加して各コマンドに注入
  1-d. types.ts に LinkType Enum を追加
  1-e. brain.ts の link create にバリデーションを追加

Phase 2 (High): スキル本体変更
  2-a. handoff/body.md のシェルエスケープ対策を記述
  2-b. resume スキル（スタブ + 本体）を新設

Phase 3 (Medium): CLI 拡張 + スキル本体変更
  3-a. skill.ts に update コマンドを追加
  3-b. kickoff/body.md に探索バジェット制約を追記
  3-c. kickoff/body.md に Greenfield フォールバックを追記

Phase 4 (Low): 設定ファイル追加
  4-a. ck-config.json を新設
  4-b. CLAUDE.md に移行手順を追記
```

---

## 影響範囲

| ファイル | 変更種別 |
|---|---|
| `packages/ck/src/core/db.ts` | 変更（スキーマ追加・関数シグネチャ変更） |
| `packages/ck/src/core/types.ts` | 変更（LinkType 追加） |
| `packages/ck/src/cli/commands/brain.ts` | 変更（detectProjectId・バリデーション追加） |
| `packages/ck/src/cli/commands/skill.ts` | 変更（update コマンド追加） |
| `packages/ck/src/skills/handoff/body.md` | 変更（シェルエスケープ対策の記述追加） |
| `packages/ck/src/skills/kickoff/body.md` | 変更（バジェット制約・Greenfieldフォールバック追記） |
| `plugins/ck/skills/resume/SKILL.md` | 新規作成 |
| `packages/ck/src/skills/resume/body.md` | 新規作成 |
| `ck-config.json` | 新規作成 |
| `CLAUDE.md` | 変更（移行手順追記） |
