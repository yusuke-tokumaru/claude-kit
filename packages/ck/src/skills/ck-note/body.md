---
name: ck-note
description: メモをMarkdownファイルに素早く記録する
---

# ck-note

会話中のメモ・気づき・調査結果をMarkdownファイルに記録する。

## 手順

### Step 1: メモ内容を把握する

`$ARGUMENTS` にメモ内容が渡された場合はそれを使用する。
渡されていない場合は「何をメモしますか？」と1行で尋ねる。

### Step 2: 保存先を確認する

`AskUserQuestion` で以下を尋ねる:

- **ローカル** — `.notes/<date>-<slug>.md`（このプロジェクトに保存、git管理下）
- **グローバル** — `~/.ck-notes/<date>-<slug>.md`（全プロジェクト共通）

### Step 3: ファイルを作成する

今日の日付を取得する:

```bash
date +%Y-%m-%d
```

メモのタイトル（1行要約）から kebab-case のスラグを生成し、ファイルパスを決める。

`Write` ツールで書き込む:

```markdown
---
created: YYYY-MM-DD
---

<メモ内容>
```

### Step 4: 完了を報告する

作成したファイルパスを1行で表示する。
