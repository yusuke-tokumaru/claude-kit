# ck-todo

やるべきことを個別のMarkdownファイルとして記録する。完了時は `status: done` に変更することで管理する。

## 手順

### Step 1: TODO 内容を把握する

`$ARGUMENTS` に TODO 内容が渡された場合はそれを使用する。
渡されていない場合は「何をTODOとして登録しますか？」と1行で尋ねる。

### Step 2: 保存先と優先度を確認する

`AskUserQuestion` で以下を尋ねる（1回の呼び出しで両方）:

1. **保存先**: ローカル（`.notes/todos/`）/ グローバル（`~/.ck-notes/todos/`）
2. **優先度**: high / medium / low

### Step 3: ファイルを作成する

今日の日付を取得する:

```bash
date +%Y-%m-%d
```

TODO のタイトル（動詞から始める1行）から kebab-case のスラグを生成し、ファイルパスを決める。

`Write` ツールで書き込む:

```markdown
---
status: open
created: YYYY-MM-DD
priority: high|medium|low
---

<TODO内容・完了条件>
```

### Step 4: 完了を報告する

作成したファイルパスを1行で表示する。
