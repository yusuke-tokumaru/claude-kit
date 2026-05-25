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

```markdown
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
(backtick)sh
<git status --short の出力>
(backtick)

### Open questions
- 疑問点

### Recent commits
(backtick)sh
<git log -5 --oneline の出力>
(backtick)

### Notes
<保存しておきたい自由記述のコンテキスト>
```

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
