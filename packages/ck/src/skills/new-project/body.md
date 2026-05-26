---
name: new-project
description: 新規プロジェクト開始時に使用する。grill-with-docs セッションで技術スタックとアーキテクチャを把握し、CONTEXT.md・CLAUDE.md 階層・.claude/docs/INDEX.md を生成する
---

# new-project

新規プロジェクトのルートで実行する。grill-with-docs の手法で計画を徹底的にインタビューし、**共通理解に達するまで設計ツリーの各分岐を 1 問ずつ** 辿る。各質問には推奨回答を添える。

コードベースで回答できる質問は、ユーザーに問わずコードベースを調査して回答する。

## 事前チェック: grill-with-docs のインストール確認

まず `grill-with-docs` スキルが利用可能かを確認する:

```bash
# インストール済みスキルを確認
claude skill list 2>/dev/null | grep grill-with-docs
```

**インストールされていない場合は処理を止めて、以下を表示してからユーザーの確認を待つ:**

```
grill-with-docs が見つかりません。インストールが必要です。

  npx skills@latest add mattpocock/skills

インストール後、もう一度 /new-project を実行してください。
```

インストール確認後、以下の Phase 1 に進む。

## Phase 1: grill-with-docs セッション

計画のあらゆる側面について徹底的にインタビューし、共通理解に達するまで設計ツリーの各分岐を解決する。

**1 問ずつ質問し、各回答を受け取ってから次に進む。**

### ドメイン認識

セッション開始前に以下のドキュメントを探す:

```
/
├── CONTEXT.md          ← 用語集（単一コンテキスト）
├── CONTEXT-MAP.md      ← 複数コンテキストがある場合のマップ
└── docs/adr/           ← アーキテクチャ決定記録
```

ファイルが存在しなければ、最初に記録すべき内容が確定した時点で作成する（lazy creation）。

### セッション中の動作

**用語の矛盾を指摘する**
CONTEXT.md の既存定義とユーザーの発言が食い違う場合は即座に指摘する。
> 「グロッサリーでは "cancellation" を X と定義していますが、今は Y の意味で使っているようです。どちらですか？」

**曖昧な言語を精確化する**
曖昧・多義的な用語には正確な正規用語を提案する。
> 「"account" とは Customer ですか、それとも User ですか？」

**具体的なシナリオでストレステスト**
ドメイン関係を議論するとき、エッジケースを探るシナリオを作ってユーザーを精密な定義に誘導する。

**コードとクロスリファレンス**
ユーザーの発言と実際のコードが矛盾していたら指摘する。
> 「コードでは Order 全体をキャンセルしていますが、部分キャンセルが可能とおっしゃいました。どちらが正しいですか？」

**CONTEXT.md をインラインで更新**
用語が確定したらその場で CONTEXT.md に記録する。まとめて書かない。
CONTEXT.md は **純粋な用語集**。実装詳細・仕様・スクラッチパッドとして使わない。

```markdown
# {Context Name}

{このコンテキストが何であるかの 1〜2 文}

## Language

**{Term}**:
{1〜2 文の定義}
_Avoid_: {使ってはいけない代替語}
```

**ADR は慎重に提案する**
以下の 3 条件 **すべて** を満たす場合のみ ADR を提案する:

1. 変更コストが高い（Hard to reverse）
2. 文脈なしには驚くべき決定（Surprising without context）
3. 実際のトレードオフの結果（Real trade-off with genuine alternatives）

ADR は `docs/adr/` に `0001-slug.md` 形式で保存。本文は 1 段落でよい。

---

## Phase 2: CLAUDE.md 階層の生成

grill-with-docs セッションで得た情報をもとに CLAUDE.md 階層を生成する。
情報がない項目はセクション自体を省略する。

### CLAUDE.md（ルート）

常にロードされる共通規約:

- **Git 禁止事項**: main/master への直接 push 禁止、force push 禁止など
- **セキュリティ**: 認証ミドルウェア一覧（どのルートにどのガードが適用されるか表形式で）
- **開発コマンド**: install / dev / build / test / lint
- **アーキテクチャ概要**: パッケージ構成と各ディレクトリの役割
- **環境変数**: 変数名と用途（値は記載しない）

### src/CLAUDE.md

`src/` を操作中にロードされる:

- フレームワーク固有のベストプラクティス（例: TanStack Start の SSR/CSR 境界、ローダー/アクションパターン）
- JSX 注意点
- コンポーネント命名規則
- ルーティング規則
- 共有 UI パッケージの import パターン（例: `@ui/*`）

### packages/\<name\>/CLAUDE.md

packages/ 以下の各パッケージに個別ファイルを生成する（例: `packages/core/CLAUDE.md`）:

- ORM ルール（スキーマ定義・マイグレーション方針）
- サーバー関数パターン（配置・命名・呼び出し規則）
- 認証詳細（ミドルウェア使い方・session 管理・protected route 作成）
- API 機能の構成パターン
- DB スキーマファイルの場所と主要テーブル

---

## Phase 3: .claude/docs/INDEX.md の生成

```markdown
# エリア別ドキュメント索引

| エリア | ファイル | 内容 |
|--------|---------|------|
| ルート | CLAUDE.md | 共通規約・Git・セキュリティ・開発コマンド |
| src/ | src/CLAUDE.md | フロントエンド規約 |
| packages/core/ | packages/core/CLAUDE.md | バックエンド・DB 規約 |

## Rule of Three

同じ質問・混乱が **3 回** 繰り返されたら `.claude/docs/{area}-{topic}.md` に文書化し、このインデックスを更新する。

例:
- src のルーティングで混乱が繰り返される → `.claude/docs/src-routing.md`
- DB スキーマの質問が何度も出る → `.claude/docs/core-schema.md`
- 認証ミドルウェアの適用方法が不明になりがち → `.claude/docs/core-auth-middleware.md`
```

---

## 制約

- 各 CLAUDE.md には **そのエリアだけに関係する情報のみ** 記載する（重複禁止）
- 環境変数の **値** は記載しない（変数名と説明のみ）
- 「当たり前のこと」は書かない（「エラーハンドリングをしましょう」「テストを書きましょう」等）
- 既存の CLAUDE.md がある場合は上書きせず **差分提案** として出力する
