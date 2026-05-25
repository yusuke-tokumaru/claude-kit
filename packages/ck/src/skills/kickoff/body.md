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

以下のプロンプト構造で Explore サブエージェント（Task, subagent_type: Explore）を1つ起動する:

```
あなたは調査専用エージェントです。AskUserQuestion・EnterPlanMode などの対話型ツールは使用しないでください。

## ゴール
[タスクの内容を再掲。何を調査すればこのタスクを上手く議論できるかを示す。]

## 調査内容
[具体的な調査質問: Xはどこにあるか、Yの周辺にどのパターンがあるか、Zの依存関係は何か。]

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
- 設計判断が必要な新機能 → `superpowers:brainstorming`
- 方向性が明確な実装タスク → `superpowers:writing-plans`

## 制約

- **非対話型**: `AskUserQuestion` を使用しない
- **既存コードへの書き込みなし**
- **サブエージェント予算**: コードベースサーベイ1つのみ
