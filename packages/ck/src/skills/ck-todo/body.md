---
name: ck-todo
description: TODO をナレッジグラフに素早くキャプチャし、LLM によるグルーミングを行う
---

# ck-todo

やるべきことをナレッジグラフに記録し、既存の TODO と重複・依存関係を整理する。

## 手順

### Step 1: TODO 内容を把握する

`$ARGUMENTS` に TODO 内容が渡された場合はそれを使用する。
渡されていない場合は「何をTODOとして登録しますか？」と1行で尋ねる。

### Step 2: 既存の TODO を確認する

```bash
ck brain node search "todo"
```

似た TODO が既存にある場合は重複の可能性をユーザーに伝える。

### Step 3: 優先度・タグをグルーミングする

TODO の内容から以下を推定してユーザーに提示する:
- **優先度**: high / medium / low
- **タグ**: 関連機能・コンポーネント名など

ユーザーが修正なければそのまま使用する。

### Step 4: ノードを作成する

```bash
ck brain node create \
  --kind todo \
  --title "<TODO のタイトル（動詞から始める）>" \
  --body "<詳細・背景・完了条件>" \
  --tags "<priority:high|medium|low>,<tag1>,<tag2>"
```

### Step 5: 依存関係をリンクする（オプション）

Step 2 で依存・ブロック関係のある TODO が見つかった場合、ユーザーに確認してリンクを作成する。

```bash
ck brain link create \
  --from <新ノードID> \
  --to <依存ノードID> \
  --type blocks
```

### Step 6: 完了を報告する

作成したノードの ID とタイトルを1行で表示する。
