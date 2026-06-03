# pr

`/review` 通過後にプルリクエストを作成する。decisions ログからタイトル・本文を生成し、GitHub または GitLab に PR を提出する。

## 手順

### Step 1: 事前確認

```bash
git status --short
git log origin/HEAD..HEAD --oneline
```

- 未コミット変更がある場合は「先にコミットしてください」と伝えて停止する
- コミットが0件の場合は「main と差分がありません」と伝えて停止する

### Step 2: リモートプロバイダーを検出する

```bash
git remote get-url origin
```

- `github.com` を含む → GitHub（`gh` CLI を使用）
- それ以外 → GitLab（`glab` CLI を使用）

### Step 3: ブランチとベースを確認する

```bash
git rev-parse --abbrev-ref HEAD        # 現在のブランチ名
git log origin/main..HEAD --oneline    # コミット一覧
```

ブランチ名のスラグ（例: `feat/add-auth` → `add-auth`）を取り出す。

### Step 4: decisions ログを参照してタイトル・本文を生成する

`/decisions/` でブランチスラグに一致するファイルを検索する。

**見つかった場合:**
- `## Decision` セクションから変更内容のサマリーを抽出する
- `## Context` から背景を抽出する

**見つからない場合:**
- コミットログから内容を推測する

以下の形式で PR 本文を生成する:

```markdown
## 概要
<変更内容を箇条書きで 1〜3 点>

## 背景
<なぜこの変更が必要だったか>

## 変更内容
<コミット一覧または主要な変更ファイル>

## 確認事項
- [ ] テストが通っている
- [ ] `/review` で指摘事項なし
```

### Step 5: ユーザーに確認する

生成したタイトルと本文を表示し、`AskUserQuestion` で確認する:
- 「このまま作成する」
- 「タイトル・本文を編集する」

「編集する」を選んだ場合はユーザーの修正を受けてから Step 6 に進む。

### Step 6: PR を作成する

**GitHub:**
```bash
gh pr create --title "<タイトル>" --body "<本文>" --base main
```

**GitLab:**
```bash
glab mr create --title "<タイトル>" --description "<本文>" --target-branch main
```

作成後、PR/MR の URL を表示する。

## 制約

- `$ARGUMENTS` にタイトルが指定されている場合は Step 4 のタイトル生成をスキップしてそのまま使用する
- ベースブランチは `main` をデフォルトとする。`main` が存在しない場合は `master` を使う
- 未コミット変更があるときは絶対に PR を作成しない
- `git push` が必要な場合は実行前にユーザーに確認する
