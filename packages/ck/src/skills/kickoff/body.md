---
name: kickoff
description: タスク開始時に自動でコードベースをサーベイし、Discussion Briefing を生成する非対話型スキル
---

# kickoff

タスクに着手する前にコードベースを調査し、Discussion Briefing を作成する。**非対話型** — 途中でユーザーに質問しない。

## 手順

### Step 1: トピックとスラグを特定する

`$ARGUMENTS` からタスク説明を解析し、kebab-case のスラグを導出する。
（例: "申請フォームを追加したい" → `add-application-form`）

Issue キー検出: `$ARGUMENTS` に `#<数字>` が含まれる場合、数字をスラグのプレフィックスとする。
（例: "ログイン修正 #42" → `42-fix-login`）

### Step 2: コードベースをサーベイする

**Greenfield 判定（サブエージェント起動前に確認）:**
Bash ツールで以下を確認する:
```sh
# コードファイル数をカウント（4件見つかった時点で打ち切り）
find . \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) \
  -not -path "*/node_modules/*" | head -4 | wc -l
# src/ ディレクトリの存在確認
test -d src && echo "has-src" || echo "no-src"
```
**カウントが 3 未満かつ `no-src`** の場合は Greenfield と判定し、サブエージェントをスキップして Step 3 に進む。
その際、Discussion Briefing の Background に「新規プロジェクト（既存コードなし）」と記載する。

以下のプロンプト構造で Explore サブエージェント（Task, subagent_type: Explore）を1つ起動する:

```
あなたは調査専用エージェントです。AskUserQuestion・EnterPlanMode などの対話型ツールは使用しないでください。

## ゴール
[タスクの内容を再掲。何を調査すればこのタスクを上手く議論できるかを示す。]

## 調査内容
[具体的な調査質問: Xはどこにあるか、Yの周辺にどのパターンがあるか、Zの依存関係は何か。]

## 探索制約（厳守）
- 参照ファイルは最大 10 ファイルまで
- ファイル全体の読み込みより、エクスポートされた関数・型定義・クラス名の確認を優先すること
- 各セクション（Files / Patterns / Dependencies / Open Questions）は 8 項目以内に収めること

以下の形式で返答すること:
### Files
- `path/to/file` — トピックとの関連性
### Patterns
- パターン名 — 見つかった規約やパターンの説明
### Dependencies
- 依存関係 — トピックとの関係
### Open Questions
- 質問 — この調査だけでは不明な点
```

利用可能な場合は `CLAUDE.md`（ルートおよびサブエリア）を参照するようサブエージェントに伝える。

### Step 3: Discussion Briefing を合成する

```markdown
- **Topic**: <一文でタスクをまとめる>
- **Background**: <コードベース調査の主要な発見・現状・既存パターン>
- **Key Questions**: <依存関係の順に並べた2〜4つの設計上の問い>
- **Constraints**: <調査で浮かび上がった技術的・設計的な制約>
```

### Step 4: 次のスキルを提案する

issue の性質から適切なスキルを提案する（自動で呼び出さない）:

- バグ・エラー → `superpowers:systematic-debugging`
- 設計の不確定要素がある新機能 → `/discuss`（設計の不確定要素を対話で解消してから `/plan` へ）
- 方向性が明確な実装タスク → `/plan`（直接プランを作成）

## 制約

- **非対話型**: `AskUserQuestion` を使用しない
- **既存コードへの書き込みなし**
- **サブエージェント予算**: コードベースサーベイ1つのみ

## 完了条件

Step 4 で次のスキルを提案した時点で完了。このスキル自身は実装も設計議論も行わない。
