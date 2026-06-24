# handoff

次のセッションがコンテキストを再発見せずに作業を引き継げる状態を記録する。
出力先: `.claude/works/handoffs/<YYYY-MM-DD>-<slug>.md`（gitignore 対象、一時的）

## 手順

### Step 1: スラグと日付を決定する

- `$ARGUMENTS` にスラグが指定されている場合は kebab-case に正規化して使用する
- 指定がない場合は Bash ツールで `git rev-parse --abbrev-ref HEAD` を実行してブランチ名を取得する
- **スラグ正規化ルール**: 英数字・ハイフン・アンダースコア以外を除去し、空白とスラッシュはハイフンに変換する
  （例: `feat/add-form` → `feat-add-form`）
- 今日の日付を `YYYY-MM-DD` 形式で取得する（Bash: `date +%Y-%m-%d`）

### Step 2: ディレクトリと gitignore を確認する

```sh
mkdir -p .claude/works/handoffs
```

`.gitignore` を Read で確認し、`.claude/works/` を無視する行が無ければ Edit/Write で追記して「`.gitignore` に `.claude/works/` を追加しました」と報告する（`.gitignore` 自体が無い場合は新規作成する）。

### Step 3: 状態を収集する

- **Topic context** — 何を作業していたか、なぜか
- **Last action** — 最後の意味ある変更（`git log -1 --oneline` と会話コンテキストから）
- **Pending work** — 進行中または次に予定している作業（`git status --short`）
- **Open questions** — 先に進むために必要な回答が得られていない疑問点
- **Recent commits** — `git log -5 --oneline` の出力

### Step 4: ファイルに書き出す

**重要: ファイルへの書き込みは必ず Write ツールを使用すること。**
Bash で文字列をリダイレクト出力すると特殊文字（`"`, `$`, バッククォート）によるエラーが発生する。

ファイルパス: `.claude/works/handoffs/<YYYY-MM-DD>-<slug>.md`

ファイルが存在しない場合は新規作成、存在する場合は新しいエントリを追記する。

````markdown
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
````

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
