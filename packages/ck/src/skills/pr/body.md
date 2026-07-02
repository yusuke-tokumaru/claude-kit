# pr

`/review` 通過後にプルリクエストを作成する。decisions ログからタイトル・本文を生成し、GitHub または GitLab に PR を提出する。

## 非対話実行時

push と PR 作成は外向きアクションのため、`AskUserQuestion` が使えない場合でも無確認で実行しない。生成したタイトル・本文と実行予定のコマンド（push を含む）を提示して停止し、最終承認は人間に残す。Step 5 の本文確認も同様（推奨案で先に進まない）。

## 手順

### Step 1: 事前確認

```bash
git status --short
git rev-parse --abbrev-ref HEAD
git log "$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo refs/remotes/origin/main)"..HEAD --oneline
```

- 未コミット変更がある場合は「先にコミットしてください」と伝えて停止する（論理単位への分割コミットは `/commit` で行える）
- コミットが0件の場合は「デフォルトブランチと差分がありません」と伝えて停止する
- 現在のブランチがデフォルトブランチ（main / master 等）の場合は「フィーチャーブランチを作成してください」と伝えて停止する

### Step 2: リモートプロバイダーを検出する

```bash
git remote get-url origin
```

- `github.com` を含む → GitHub（`gh` CLI を使用）
- `gitlab` を含む（セルフホスト含む） → GitLab（`glab` CLI を使用）
- どちらも含まない（Bitbucket 等） → ホスティングサービス名をユーザーに確認する。gh / glab のどちらでも扱えない場合は対応していない旨を伝えて停止する

### Step 3: ブランチとベースを確認する

```bash
# デフォルトブランチを検出（設定がない場合は main にフォールバック）
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||'
git rev-parse --abbrev-ref HEAD        # 現在のブランチ名
git log origin/<デフォルトブランチ>..HEAD --oneline    # コミット一覧
```

ブランチ名のスラグ（例: `feat/add-auth` → `add-auth`）を取り出す。

### Step 4: decisions ログを参照してタイトル・本文を生成する

`decisions/` でブランチスラグに一致するファイルを検索する。

**見つかった場合:**
- `## Decision` セクションから変更内容のサマリーを抽出する
- `## Context` から背景を抽出する
- `## Decision` が無いファイル（`/debug` が記録したもの等）の場合は、最新の `### <date> debug` ブロックの `#### Root cause` / `#### Fix direction` からサマリーと背景を抽出する

**見つからない場合:**
- コミットログから内容を推測する

タイトルはブランチの変更内容を表す1行（コミットメッセージと同じ言語・トーン）とし、本文と併せて Step 5 で確認を受ける。

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

### Step 6: リモートへ push する

PR 作成にはブランチがリモートに存在する必要がある。push 状態を確認する:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "no-upstream"
git status -sb   # ahead 表示の確認
```

upstream が無い、またはローカルが ahead の場合は、**ユーザーに push の承認を得てから**実行する:

```bash
git push -u origin HEAD
```

承認が得られない場合は PR を作成せず停止する。push 済みなら何もしない。

### Step 7: PR を作成する

**GitHub:**
```bash
gh pr create --title "<タイトル>" --body "<本文>" --base <デフォルトブランチ>
```

**GitLab:**
```bash
glab mr create --title "<タイトル>" --description "<本文>" --target-branch <デフォルトブランチ>
```

作成後、PR/MR の URL を表示する。

## 制約

- `$ARGUMENTS` にタイトルが指定されている場合は Step 4 のタイトル生成をスキップしてそのまま使用する
- ベースブランチは `git symbolic-ref refs/remotes/origin/HEAD` で自動検出する。取得できない場合は `main` にフォールバックする
- 未コミット変更があるとき、またはデフォルトブランチ上にいるときは絶対に PR を作成しない
- `git push` が必要な場合は実行前にユーザーに確認する（プッシュはユーザーの承認後のみ）

## 完了条件

PR/MR の URL をユーザーに表示した時点で完了。
