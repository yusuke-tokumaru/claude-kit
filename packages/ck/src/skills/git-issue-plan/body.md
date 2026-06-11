# git-issue-plan

リモートに登録された自分向けの Issue を確認し、実装計画（Plan）を作成する。

## Phase 1: リモートプロバイダーの検出

```bash
git remote get-url origin
```

URL から自動検出する:
- `github.com` を含む → GitHub（`gh` CLI を使用）
- `gitlab` を含む（セルフホスト含む） → GitLab（`glab` CLI を使用）
- どちらも含まない（Bitbucket 等） → どちらのサービスかユーザーに確認する。gh / glab のどちらでも扱えない場合は対応していない旨を伝えて停止する
- リモート未設定 → 「origin が設定されていません」と伝えて停止する

### GitHub の場合: gh CLI の確認

```bash
which gh && gh auth status
```

`gh` が見つからない場合は、公式手順（https://github.com/cli/cli#installation — apt の場合は GitHub の公式リポジトリ追加が必要）でのインストールと `gh auth login` を案内して停止する（パッケージリポジトリの追加や sudo を伴うためスキルからは実行しない）。

### GitLab の場合: glab CLI の確認

```bash
which glab && glab auth status
```

`glab` が見つからない場合は、公式手順（https://gitlab.com/gitlab-org/cli#installation）でのインストールと `glab auth login` を案内して停止する（sudo を伴うためスキルからは実行しない）。

CLI が使えない / 未ログインの場合は案内して停止する。

## Phase 2: Issue 一覧の取得

**GitHub:**
```bash
gh issue list --assignee @me --json number,title,labels
```

**GitLab:**
```bash
glab issue list --assignee @me --output json
```

取得した Issue を以下の形式で表示する:

| # | タイトル | ラベル |
|---|--------|--------|

Issue が 0 件の場合はその旨を伝えて終了する。

## Phase 3: Issue の選択と詳細確認

ユーザーに「対象の Issue 番号を教えてください」と尋ねる。

**GitHub:**
```bash
gh issue view {number}
```

**GitLab:**
```bash
glab issue view {number}
```

取得した内容（title, description, labels）を日本語で要約して表示する。
body が空または極端に短い場合はユーザーに補足情報を求める。

## Phase 4: コードベースサーベイ（kickoff）

Skill tool で `kickoff` スキルを呼び出す。引数:
```
#<issue番号> <issueタイトル>
例: "#42 申請フォームのバリデーションを追加"
```

`kickoff` がコードベースをサーベイし Discussion Briefing を作成する。
その後 `kickoff` が次のスキルを提案するので、ユーザーが判断して進む。

## 重要なルール

- Phase を順番通りに実行する。スキップ禁止
- CLI がない / 未ログインの場合は必ず案内で停止する
- `writing-plans` はユーザーが判断して呼び出す（自動遷移しない）
