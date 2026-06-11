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

あわせて現在の作業ツリーの状態を取得し、Entry に記録された状態（Uncommitted changes / Recent commits）と突き合わせる:

```sh
git status --short
git log -5 --oneline
```

### Step 4: コンテキストを展開して作業再開を通知する

以下の形式でサマリーを表示する:

```markdown
## Resume: <ファイル名>

**Topic**: <Topic context の内容>
**Last action**: <Last action の内容>
**Pending work**:
<Pending work のチェックリスト>
**Open questions**: <Open questions の内容（あれば）>
**Drift check**: <handoff 記録時と現在の git 状態の差異。なければ「なし」>
```

「`<ファイル名>` から作業を再開します。続けますか？」と尋ねてユーザーの指示を待つ。

## 制約

- handoff ファイルの内容を変更・削除しない（読み取りのみ。git コマンドも読み取り系のみ）
- ユーザーの承認前に実装アクション（ファイル編集・コマンド実行）を開始しない
