# claude-kit

個人用 Claude Code プラグインリポジトリ。`ck` CLI・ナレッジグラフ・7つのスキルを提供する。

---

## セットアップ

### 1. 依存インストール

```bash
cd ~/claude-kit
bun install
```

### 2. ck CLI をグローバルインストール

```bash
cd ~/claude-kit/packages/ck
bun link
```

`ck --version` で `0.1.0` が表示されれば成功。

### 3. Claude Code プラグインを登録

```bash
ck setup
```

または手動で:

```bash
claude plugin install ~/claude-kit/plugins/ck
```

---

## ck CLI リファレンス

### スキル管理

```bash
# スキル本体を標準出力（プラグインスタブから自動で呼ばれる）
ck skill print <name>

# 利用可能なスキル一覧を表示
ck skill list

# スキルをプロジェクトの .claude/skills/ にコピー（プロジェクト専用カスタマイズ用）
ck skill copy <name>   # 指定スキルのみ
ck skill copy --all    # 全スキルを一括コピー
```

### ナレッジグラフ — ノード

ノードはメモ・TODO・設計判断・調査結果などの情報単位。`~/.ck-brain/brain.db` に保存される。

```bash
# ノードを追加（kind: note | todo | decision | research）
ck brain node create --kind note --title "タイトル" --body "内容" --tags "tag1,tag2"

# IDでノードを取得
ck brain node get <id>

# タイトル・本文で全文検索
ck brain node search "キーワード"

# ノードを更新
ck brain node update <id> --title "新タイトル"

# ノードを削除
ck brain node delete <id>
```

使用例:
```bash
ck brain node create --kind todo --title "ログイン画面を実装する" --tags "auth,frontend"
# → { "id": "abc-123", "kind": "todo", "title": "ログイン画面を実装する", ... }

ck brain node search "ログイン"
# → [{ "id": "abc-123", "title": "ログイン画面を実装する", ... }]
```

### ナレッジグラフ — リンク

ノード間の関係を有向リンクで表現する（type 例: relates, blocks, implements, depends-on）。

```bash
# リンクを追加
ck brain link create --from <fromId> --to <toId> --type <type>

# ノードのリンク一覧
ck brain link list <nodeId>
```

### ナレッジグラフ — 設計判断

重要な設計判断を記録・参照するための専用テーブル。

```bash
# 設計判断を記録
ck brain decision create \
  --title "ORMの選定" \
  --decision "DrizzleORMを採用" \
  --context "型安全性とEdge Runtime対応が必要だった" \
  --consequences "Drizzle固有のクエリビルダーを学習する必要がある"

# 設計判断一覧
ck brain decision list
```

### セットアップ

```bash
# Claude Code プラグインを登録
ck setup
```

---

## スキルリファレンス

Claude Code で `/` コマンドとして呼び出せる。

### `handoff` — セッション引き継ぎ

セッション終了時に作業状態を `.claude/works/handoffs/` に保存する。次のセッションで迷わず作業を再開できる。

```
/handoff              # ブランチ名をスラグとして使用
/handoff my-feature   # スラグを明示指定
```

### `kickoff` — タスク開始サーベイ

タスクを始める前にコードベースを自動調査し、Discussion Briefing を生成する。設計の判断が必要な非自明なタスクを始める前に使う。

```
/kickoff ユーザー認証機能を追加したい
/kickoff #42 申請フォームのバリデーション
```

### `review` — コードレビュー

実装完了後に型チェック・Lint を実行し、コーディング規約に照らしてレビューする。

```
/review
```

### `help` — プロジェクトQ&A

「このプロジェクトでXはどうやる？」という質問に CLAUDE.md → `.claude/docs/` → コードの順で答える。

```
/help サーバー関数はどこに書く？
/help DBマイグレーションの実行方法は？
```

### `git-issue-plan` — Issue から実装計画

GitHub / GitLab の Issue を一覧表示し、選択した Issue の実装計画を作成する（GitHub・GitLab 両対応）。

```
/git-issue-plan
```

### `ck-note` — メモを記録

メモをナレッジグラフに素早く記録する。自動タグ付け・関連ノードへのリンク付き。

```
/ck-note Reactのメモ化はuseMemoよりReact.memoが有効なケースがある
```

### `ck-todo` — TODOを記録

TODO をナレッジグラフにキャプチャし、LLM で優先度・タグを整理する。

```
/ck-todo ログイン画面のリダイレクト処理を修正する
```

---

## ナレッジグラフの保存先

`~/.ck-brain/brain.db` — プロジェクトをまたいでグローバルに使用できる。

---

## スキルの更新方法

スキル本体を編集するだけで即反映される（再起動・再インストール不要）。

```bash
$EDITOR ~/claude-kit/packages/ck/src/skills/handoff/body.md
```

## プロジェクト専用にスキルをカスタマイズする

プラグイン版はすべてのプロジェクトで共通のスキルを使用するが、プロジェクトごとに内容を変えたい場合はスキルをコピーして編集する。

```bash
# 対象プロジェクトのルートで実行
cd /path/to/your-project

# 特定のスキルをコピー
ck skill copy handoff

# 全スキルを一括コピー
ck skill copy --all
```

コピー先 `.claude/skills/<name>/SKILL.md` を直接編集することでそのプロジェクト専用の挙動になる。
プロジェクトの `.claude/skills/` はプラグイン版より優先して読み込まれる。

---

## 将来の社用 Git への移行

```bash
git remote add origin <社内GitURL>
git push -u origin main
```

スタブ（`plugins/ck/skills/*/SKILL.md`）は変更不要。
パッケージを社内 npm レジストリに publish する場合は `bun publish` を使用する。
