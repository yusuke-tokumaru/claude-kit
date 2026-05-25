# claude-kit 設計ドキュメント

**作成日:** 2026-05-25  
**ステータス:** 承認済み

## 概要

個人用 Claude Code プラグインリポジトリ。スキル管理・配布基盤と CLI ツール (`ck`) およびナレッジグラフ（SQLite）を提供する。  
将来的に社用プライベート Git へ上げることを前提としたローカル運用から始める。

---

## アーキテクチャ

### 配布モデル（2層構造）

`agent-extensions` と同じ2層構造を採用する。

1. **npm パッケージ** (`packages/ck/`): スキル本体・CLI・ナレッジグラフを含む。`bun link` でローカルインストール。
2. **マーケットプレイス スタブ** (`plugins/ck/`): フロントマター + `` !`ck skill print <name>` `` のみの薄いファイル。Claude Code プラグインとして登録。

スキルを更新するには本体の markdown を編集するだけでよく、スタブは滅多に変更しない。

---

## ディレクトリ構造

```
~/claude-kit/
  packages/ck/
    package.json              # @personal/claude-kit, bin: { ck: "src/cli.ts" }
    src/
      cli.ts                  # エントリポイント (#!/usr/bin/env bun)
      cli/commands/
        skill.ts              # ck skill print / list
        brain.ts              # ck brain node|link|decision
      core/
        db.ts                 # SQLite (bun:sqlite)
        types.ts
      skills/                 # スキル本体 markdown
        handoff/body.md
        kickoff/body.md
        review/body.md
        help/body.md
        git-issue-plan/body.md
        ck-note/body.md
        ck-todo/body.md
    bun.lockb

  plugins/ck/
    .claude-plugin/plugin.json
    package.json
    skills/
      handoff/SKILL.md        # frontmatter + !`ck skill print handoff`
      kickoff/SKILL.md
      review/SKILL.md
      help/SKILL.md
      git-issue-plan/SKILL.md
      ck-note/SKILL.md
      ck-todo/SKILL.md

  package.json                # workspaces: ["packages/*", "plugins/*"]
  bun.lockb
  README.md
```

---

## CLI 設計

バイナリ名: `ck`  
ランタイム: Bun（TypeScript 直接実行、ビルド不要）

### コマンド一覧

```
# スキル管理
ck skill print <name>         スキル本体を標準出力（スタブから呼ばれる）
ck skill list                 利用可能なスキル一覧を表示

# ナレッジグラフ
ck brain node create          ノードを追加
ck brain node get <id>        ノードを取得
ck brain node search <query>  ノードを全文検索
ck brain node update <id>     ノードを更新
ck brain node delete <id>     ノードを削除
ck brain link create          ノード間リンクを追加
ck brain link list <id>       ノードのリンク一覧
ck brain decision create      設計判断を記録
ck brain decision list        設計判断一覧を表示

# セットアップ
ck setup                      プラグイン登録・初期設定
```

---

## ナレッジグラフ設計

**保存先:** `~/.ck-brain/brain.db`（プロジェクトをまたいでグローバルに利用可能）

### データモデル

```sql
-- エントリ（メモ・TODO・調査結果など）
nodes (
  id          TEXT PRIMARY KEY,
  kind        TEXT,           -- note | todo | decision | research
  title       TEXT,
  body        TEXT,
  tags        TEXT,           -- JSON配列
  created_at  TEXT
)

-- ノード間の有向リンク
links (
  from_id     TEXT,
  to_id       TEXT,
  type        TEXT,
  PRIMARY KEY (from_id, to_id, type)
)

-- 設計判断（重要度が高いものを別管理）
decisions (
  id            TEXT PRIMARY KEY,
  title         TEXT,
  context       TEXT,
  decision      TEXT,
  consequences  TEXT,
  created_at    TEXT
)
```

---

## スキル一覧

### yaesu-v2 から移植（汎用化）

> yaesu-v2 固有のファイルパス・ツール名・プロジェクト構造への参照を取り除き、任意のプロジェクトで使えるよう書き直す。


| スキル | 概要 |
|---|---|
| `handoff` | セッション終了時に作業状態をナレッジグラフに保存し、次のセッションで復帰できるようにする |
| `kickoff` | タスク開始時にコードベースを自動サーベイし、Discussion Briefing を生成する |
| `review` | 変更に対して tsc・lint を実行し、コーディング規約に照らしてコードレビューする |
| `help` | プロジェクト固有のQ&Aルーター。CLAUDE.md → .claude/docs/ → コードの順で回答する |
| `git-issue-plan` | GitHub / GitLab の Issue を一覧表示し、実装計画を作成する |

### 新規作成（ナレッジグラフ連携）

| スキル | 概要 |
|---|---|
| `ck-note` | メモをナレッジグラフに素早く記録する。自動タグ付け・関連ノードへのリンク付き |
| `ck-todo` | TODO を素早くキャプチャし、LLM によるグルーミングを行う |

---

## セットアップ手順

```bash
# 1. リポジトリ作成
git init ~/claude-kit && cd ~/claude-kit

# 2. 依存インストール
bun install

# 3. ck をグローバルインストール
bun link

# 4. Claude Code にプラグイン登録
claude plugin install ~/claude-kit/plugins/ck
```

以降はスキル本体（`packages/ck/src/skills/<name>/body.md`）を編集するだけで即反映される。

---

## 将来対応（社用 Git への移行）

- `bun link` → `bun publish` or 社内 npm レジストリへ publish
- スタブの `!ck skill print <name>` はそのまま維持（変更不要）
- `package.json` の `version` フィールドを手動バンプ → CI でパッチ自動バンプも追加可能
