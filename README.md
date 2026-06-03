# claude-kit

Claude Code をもっと使いやすくする、個人用プラグインセットです。

よく使う開発ワークフローをスラッシュコマンド（`/kickoff`、`/discuss`、`/plan` など）として登録し、  
メモや設計判断をナレッジグラフ（SQLite）に蓄積できます。

---

## できること

### 開発フローをコマンドで進める

```
/kickoff → /discuss → /plan → （実装）→ /review → /handoff
```

| コマンド | やること |
|----------|----------|
| `/kickoff` | タスク開始時にコードベースを自動調査してブリーフィングを作る |
| `/git-issue-plan` | GitHub/GitLab の Issue を選んでブリーフィングを作る |
| `/discuss` | 設計の不確定要素を対話で整理し、決定事項を記録する |
| `/plan` | 実装ステップをプランファイルにまとめる |
| `/review` | 実装完了後に型チェック・Lint・コード品質を確認する |
| `/handoff` | セッションを終えるとき、次回再開用に作業状態を保存する |

### メモや設計判断を記録する

```
/ck-note  Reactのメモ化はuseCallbackよりuseMemoが有効なケースがある
/ck-todo  ログイン画面のリダイレクト処理を修正する
```

`ck brain` コマンドでCLI からも操作できます。記録はプロジェクトをまたいで `~/.ck-brain/brain.db` に蓄積されます。

---

## セットアップ

### 必要なもの

- [Bun](https://bun.sh) 1.0 以上
- [Claude Code](https://claude.ai/code) がインストール済み

### 手順

**1. 依存インストール**

```bash
cd ~/claude-kit
bun install
```

**2. `ck` コマンドをグローバルに使えるようにする**

```bash
cd ~/claude-kit/packages/ck
bun link
```

確認:
```bash
ck --version   # 0.1.0 と表示されればOK
```

**3. Claude Code にプラグインを登録する**

```bash
ck setup
```

これで Claude Code を開いたとき `/kickoff` などのコマンドが使えるようになります。

---

## スキルの使い方

### 開発を始めるとき

**`/kickoff` — コードベースを調べてタスクの概要をつかむ**

```
/kickoff ユーザー認証機能を追加したい
/kickoff #42 申請フォームのバリデーション
```

Issue 番号（`#42`）を含めると、スラグに番号が付きます。  
調査結果をもとに、次に進むべきスキル（`/discuss` または `/plan`）を提案します。

**`/git-issue-plan` — GitHub/GitLab の Issue から始める**

```
/git-issue-plan
```

自分にアサインされた Issue を一覧表示 → 選択 → `/kickoff` でブリーフィングを作成します。  
GitHub・GitLab どちらにも対応しています。

---

### 設計を固めるとき

**`/discuss <トピック>` — 設計の不確定要素を対話で整理する**

```
/discuss 認証方式の選定
```

- コードベースを調査してから議論を始めます（推測ではなく証拠から）
- 決定事項を `/decisions/<日付>-<slug>.md` に記録します
- 初回実行時にプロジェクトに `decisions/` ディレクトリを自動作成します
- 方向性が決まったら `/plan` を提案します

---

### 実装計画を立てるとき

**`/plan <タスク説明>` — ステップバイステップの実装計画を作る**

```
/plan JWTトークン認証の実装
```

- `/decisions/` に記録された決定事項を制約として読み込みます
- コードベースを調査してから計画を作成します
- プランモードで内容を確認・修正してから実装を開始します
- 計画は `/decisions/` にも要約が記録されます

---

### 実装完了後

**`/review` — マージ前のチェック**

```
/review
```

型チェック・Lint を実行し、コード品質・セキュリティ・論理的整合性を確認します。  
問題がなければ `/handoff` での引き継ぎを案内します。

**`/handoff` — 次のセッションへ引き継ぐ**

```
/handoff              # ブランチ名をスラグとして使用
/handoff my-feature   # スラグを明示指定
```

作業中のコンテキスト・未完了タスク・未コミット変更を `.claude/works/handoffs/` に保存します。  
次のセッションで `/resume` を使うと状態を復元できます。

---

### その他のコマンド

**`/help` — プロジェクトの使い方を調べる**

```
/help サーバー関数はどこに書く？
/help DBマイグレーションの実行方法は？
```

CLAUDE.md → `.claude/docs/` → コードの順で検索して答えます。

**`/ck-note` — メモをナレッジグラフに記録**

```
/ck-note Reactのメモ化はuseMemoよりReact.memoが有効なケースがある
```

**`/ck-todo` — TODO をナレッジグラフに記録**

```
/ck-todo ログイン画面のリダイレクト処理を修正する
```

---

## ナレッジグラフ（`ck brain`）

メモ・TODO・設計判断・調査結果をCLI から直接操作できます。  
保存先: `~/.ck-brain/brain.db`（プロジェクトをまたいで共有）

```bash
# ノードを追加
ck brain node create --kind note --title "タイトル" --body "内容" --tags "tag1,tag2"

# 検索
ck brain node search "キーワード"

# 設計判断を記録
ck brain decision create \
  --title "ORMの選定" \
  --decision "DrizzleORMを採用" \
  --context "型安全性とEdge Runtime対応が必要だった" \
  --consequences "Drizzle固有のクエリビルダーを学習する必要がある"

# 設計判断一覧
ck brain decision list
```

ノードの種類: `note`（メモ）/ `todo`（タスク）/ `decision`（設計判断）/ `research`（調査）

---

## スキルをカスタマイズする

### スキル本体を直接編集する

```bash
$EDITOR ~/claude-kit/packages/ck/src/skills/handoff/body.md
```

保存するだけで即反映されます（再起動・再インストール不要）。

### プロジェクト専用にスキルをカスタマイズする

スキルをプロジェクトにコピーして編集すると、そのプロジェクトだけ挙動を変えられます。

```bash
# 対象プロジェクトのルートで実行
cd /path/to/your-project

ck skill copy handoff      # 特定のスキルをコピー
ck skill copy --all        # 全スキルを一括コピー
```

コピー先 `.claude/skills/<name>/SKILL.md` を編集するとプロジェクト専用の挙動になります。  
（プロジェクトの `.claude/skills/` はプラグイン版より優先されます）

---

## ck CLI リファレンス

```bash
ck skill list              # 利用可能なスキル一覧
ck skill print <name>      # スキル本体を標準出力
ck skill copy <name>       # スキルをプロジェクトにコピー
ck skill copy --all        # 全スキルをコピー
ck brain node create ...   # ノードを追加
ck brain node search ...   # ノードを検索
ck brain decision create   # 設計判断を記録
ck setup                   # Claude Code プラグインを登録
```
