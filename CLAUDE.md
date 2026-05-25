# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

個人用 Claude Code プラグインリポジトリ。`ck` CLI・ナレッジグラフ（SQLite）・7つのスキルを提供する。

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

- `src/cli.ts` — エントリポイント（Commander で3コマンドを登録）
- `src/cli/commands/skill.ts` — `ck skill print/list`（`SKILLS_DIR = src/skills/` を参照）
- `src/cli/commands/brain.ts` — `ck brain node/link/decision` サブコマンド
- `src/cli/commands/setup.ts` — `claude plugin install plugins/ck` を実行
- `src/core/db.ts` — Bun SQLite を使ったナレッジグラフ操作。DB は `~/.ck-brain/brain.db`
- `src/core/types.ts` — `BrainNode`, `BrainLink`, `Decision`, `NodeKind` の型定義

### ナレッジグラフのスキーマ

`~/.ck-brain/brain.db`（グローバル、プロジェクトをまたぐ）に3テーブル：
- `nodes` — `kind: note | todo | decision | research`、タグは JSON 配列で保存
- `links` — `(from_id, to_id, type)` の有向リンク
- `decisions` — 設計判断の専用テーブル

### plugins/ck 内部構造

- `.claude-plugin/plugin.json` — プラグインメタデータ
- `skills/<name>/SKILL.md` — フロントマター（name/description/allowed-tools）＋ `!`ck skill print <name>`` の1行

## 新しいスキルを追加する場合

1. `packages/ck/src/skills/<name>/body.md` を作成（スキル本体）
2. `plugins/ck/skills/<name>/SKILL.md` を作成（スタブ、既存を参考）
3. `ck skill list` で確認
