---
name: ck-note
description: メモをナレッジグラフに素早く記録する
---

# ck-note

会話中のメモ・気づき・調査結果をナレッジグラフに記録する。

## 手順

### Step 1: メモ内容を把握する

`$ARGUMENTS` にメモ内容が渡された場合はそれを使用する。
渡されていない場合は「何をメモしますか？」と1行で尋ねる。

### Step 2: タグを自動推定する

メモの内容から適切なタグを1〜3個推定する。
例: "Reactのレンダリング最適化について" → `["react", "performance"]`

### Step 3: 関連ノードを検索する

タグのキーワードで既存ノードを検索し、関連するものがあればリンク候補として提示する。

```bash
ck brain node search "<キーワード>"
```

### Step 4: ノードを作成する

```bash
ck brain node create \
  --kind note \
  --title "<メモのタイトル（1行要約）>" \
  --body "<メモ内容>" \
  --tags "<tag1>,<tag2>"
```

### Step 5: 関連ノードへリンクする（オプション）

Step 3 で関連ノードが見つかった場合、ユーザーに確認してリンクを作成する。

```bash
ck brain link create \
  --from <新ノードID> \
  --to <関連ノードID> \
  --type relates
```

### Step 6: 完了を報告する

作成したノードの ID とタイトルを1行で表示する。
