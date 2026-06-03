# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

個人用 Claude Code プラグインリポジトリ。`ck` CLI・Markdownベースのノート/TODO管理・複数のスキルを提供する。

## コマンド

```bash
# 依存インストール
bun install

# ck CLI をグローバルにリンク（初回セットアップ）
cd packages/ck && bun link

# Claude Code プラグインを登録
ck setup

# 型チェック（tsconfig がない場合は bun build で代替）
bun run packages/ck/src/cli.ts --help

# スキル一覧確認
ck skill list

# ck コマンドをローカルで直接実行（グローバルリンクなしで）
bun run packages/ck/src/cli.ts skill list
```

## 社内移行時の設定変更

社内 GitLab / npm プライベートレジストリへの移行時は `ck-config.json` を編集する:

| キー | デフォルト | 説明 |
|---|---|---|
| `org` | `personal` | 組織名（パッケージ名の `@<org>` 部分） |
| `registry` | `https://registry.npmjs.org` | npm レジストリ URL |
| `pluginName` | `claude-kit-plugin` | プラグイン名 |

変更後: `bun install && ck setup` を実行してプラグインを再登録する。

## アーキテクチャ

### モノレポ構成

```
packages/ck/   — ck CLI 本体（Bun + TypeScript）
plugins/ck/    — Claude Code プラグインスタブ
```

### スキルの二層構造

スキルはスタブと本体に分離されている：

- **スタブ** `plugins/ck/skills/<name>/SKILL.md` — Claude Code プラグインとして登録されるメタデータ。`!`ck skill print <name>`` でシェル実行して本体を読み込む
- **本体** `packages/ck/src/skills/<name>/body.md` — 実際のスキル内容。`ck skill print <name>` で stdout に出力される

スキル内容の変更はファイル編集のみで即反映（再起動・再インストール不要）。

### packages/ck 内部構造

- `src/cli.ts` — エントリポイント（Commander で4コマンドを登録）
- `src/cli/commands/skill.ts` — `ck skill print/list`（`SKILLS_DIR = src/skills/` を参照）
- `src/cli/commands/note.ts` — `ck note <content> [--global]`（`.notes/` または `~/.ck-notes/` に書き込み）
- `src/cli/commands/todo.ts` — `ck todo <content> [--global] [--priority]`（`.notes/todos/` または `~/.ck-notes/todos/` に書き込み）
- `src/cli/commands/setup.ts` — `claude plugin install plugins/ck` を実行

### ノート・TODOのストレージ

すべてMarkdownファイル。SQLiteは使用しない。

| 種別 | ローカル（デフォルト） | グローバル（`--global`） |
|---|---|---|
| ノート | `.notes/<date>-<slug>.md` | `~/.ck-notes/<date>-<slug>.md` |
| TODO | `.notes/todos/<date>-<slug>.md` | `~/.ck-notes/todos/<date>-<slug>.md` |

TODOファイルのフロントマターで `status: open/done` を管理する。
設計判断は `decisions/<date>-<slug>.md` に記録する（`/discuss` スキルが書き込む）。

### plugins/ck 内部構造

- `.claude-plugin/plugin.json` — プラグインメタデータ
- `skills/<name>/SKILL.md` — フロントマター（name/description/allowed-tools）＋ `!`ck skill print <name>`` の1行

## 新しいスキルを追加する場合

1. `packages/ck/src/skills/<name>/body.md` を作成（スキル本体）
2. `plugins/ck/skills/<name>/SKILL.md` を作成（スタブ、既存を参考）
3. `ck skill list` で確認
