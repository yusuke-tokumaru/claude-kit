# 実装プラン: ck:review-pr スキルの新設

## タスク要約

他者のコードをレビュワー側として評価する ck スキル `ck:review-pr` を新設する。差分（PR/ブランチ）と 0から（パス）の2モード、scratchpad ドラフト由来の 15 レビューレンズ・検証手法・Severity Rubric・Common Mistakes を body にインライン収録し、レビュー結果を `reviews/<date>-<slug>.md` に記録する。

- **ブランチ**: 現在のブランチ（main）で続行（ユーザー確認済み）
- **根拠決定**: [decisions/2026-06-29-review-pr-skill.md](../decisions/2026-06-29-review-pr-skill.md)

## 調査サマリー

- **二層構造**: スタブ `plugins/ck/skills/<name>/SKILL.md`（frontmatter + `!`ck skill print <name>`` 行）／本体 `packages/ck/src/skills/<name>/body.md`（フロントマター不可）。変更はファイル編集のみで即反映。新スタブ認識のみセッション再起動が必要。
- **最重厚な先例**: [packages/ck/src/skills/qa/body.md](../packages/ck/src/skills/qa/body.md)（240行・L1〜L8 レンズ表・記録生成）。review-pr も同等の重厚さが想定され、これは意図的。
- **差分基盤**: [packages/ck/src/skills/review/body.md](../packages/ck/src/skills/review/body.md) の git 差分取得コマンド（origin/HEAD → HEAD~1 → 未コミットのフォールバック）と feature-dev:code-reviewer 起動判定を流用。
- **記録の流儀**: discuss の `decisions/`（ADR-lite・追記・git リマインダー）と qa の `tests/qa/`（台帳生成）。reviews/ は前者寄りの「1回1ファイル」。
- **doctor 検査**: ディレクトリ名↔name 一致／frontmatter 必須（name・description）／print 行の形式と対象名一致／body にフロントマターがあればエラー。reviews/ は doctor 対象外。
- **CLAUDE.md 追記箇所**: 運用ルール（l.31〜34）・ストレージ一覧（l.74〜85）に reviews/ を追加。

## 反映された設計決定（decisions/2026-06-29-review-pr-skill.md）

| 決定（Decision タイトル） | 反映ステップ |
|---|---|
| 別スキル ck:review-pr を新設（ck:review は据え置き） | Step 1・2 |
| 新スキル名は ck:review-pr | Step 1・2 |
| 差分/0から の2モードを引数で切替、既存レンズ再利用 | Step 2（モード判定・レンズ節） |
| レビュー結果は reviews/<date>-<slug>.md にレビュー単位で記録 | Step 2（記録節）・Step 4 |
| レビュワー機能は ck:review-pr 1スキルに一本化 | Step 2（15レンズ・検証・Rubric・Common Mistakes を body にインライン） |
| frontmatter description は When to use のみ・スタック明示＋症状キーワード | Step 1（スタブ） |
| （撤回）2レイヤー分割／~/.claude/skills 配置／別 TDD | 除外制約 — 個人スキルは作らない |

## ステップ間共有コンテキスト

**ディレクトリ／ファイル**
- 本体: `packages/ck/src/skills/review-pr/body.md`（フロントマター無し）
- スタブ: `plugins/ck/skills/review-pr/SKILL.md`
- 記録先: `reviews/<YYYY-MM-DD>-<slug>.md`（リポジトリルート直下、git 管理）

**スタブ frontmatter（確定形は Design Decision A で詰める）**
```yaml
name: review-pr
description: <When to use のみ・スタック明示＋症状キーワード>
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Task, AskUserQuestion, Edit, Write
argument-hint: "[PR番号 | ブランチ | パス]（省略時はモード確認）"
```
print 行: `!`ck skill print review-pr || echo "ERROR: ck CLI not found"``

**差分取得コマンド（review から流用）**
```bash
BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||')
git diff --name-only "origin/${BASE:-main}...HEAD" 2>/dev/null \
  || git diff --name-only HEAD~1 HEAD 2>/dev/null \
  || git diff --name-only
```

**reviews/<date>-<slug>.md の節構成**
```markdown
# <対象> レビュー（<差分|0から>モード）
## 対象 / 作者の意図
## 指摘（high / medium / low）
- <ファイル:行> / 問題 / なぜ / 直し方 / 裏取り（grep・tsc など）
## 判断: approve | request-changes
## PR コメント案
## フォローアップ
```

**Severity Rubric（body・記録で共通）**
| 重要度 | 基準 |
|--------|------|
| High | 機能不成立・認可漏れ・なりすまし・ロックアウト・金額が不定 |
| Med | 立場で結果が変わる/誤集計、重複による将来の乖離、認可の手書き依存 |
| Low | 品質・規約・型精度・UX・優先度低い予防 |

## ステップ

### - [x] Step 1: スタブ SKILL.md の作成

**コミット**: `feat: ck:review-pr スタブを追加（他者レビュー専任スキル）`

**依存**: なし / **生産物**: `plugins/ck/skills/review-pr/SKILL.md`（doctor が本体と対応付けるスタブ）

**ファイル変更**
- 新規 `plugins/ck/skills/review-pr/SKILL.md` — 共有コンテキストの frontmatter（description は Design Decision A で確定）+ print 行。既存 `plugins/ck/skills/qa/SKILL.md` を雛形にする。

**検証基準**
- `bun run packages/ck/src/cli.ts skill list` に review-pr が出る（本体は Step 2 後）
- frontmatter に name・description が存在（doctor の必須項目）

### - [x] Step 2: 本体 body.md の作成

**コミット**: `feat: ck:review-pr 本体を追加（2モード・15レンズ・検証手法・記録）`

**依存**: Step 1（スタブの print 対象） / **生産物**: `packages/ck/src/skills/review-pr/body.md`

**ファイル構成（節）**
```
# 他者コードレビュー（review-pr）
## 位置づけ          ← ck:review（自己）との違い・他者PR/0からが対象
## Step 1: モード判定  ← 引数: PR番号/ブランチ→差分, パス→0から, なし→AskUserQuestion
## Step 2: 対象把握    ← 差分: PR description+差分取得コマンド / 0から: 対象精読
## Step 3: レビューレンズ
   - 汎用レンズ（qa L1〜L8 の観点軸を流用、出典明記）
   - スタック固有レンズ（TanStack Start+Drizzle+better-auth の15観点表：何を疑う×実grep×あるべき姿）
     ※ Design Decision B の方式で「固有」を視覚的に明示
## Step 4: 検証手法    ← IsAny 型実証(tsc)・順序不定の横断grep（推測で指摘しない原則）
## Step 5: 独立視点    ← 根幹（認可・状態管理・エラー設計）は feature-dev:code-reviewer 起動
## Severity Rubric
## Common Mistakes（レビュアー自身の罠：推測指摘・「絶対」断定・1箇所満足・新解押し付け・良い点を書かない）
## Step 6: 記録        ← reviews/<date>-<slug>.md を Write、git add リマインダー
## 報告形式            ← 指摘一覧＋判断（approve/request-changes）＋PRコメント案
## 完了条件
## Note                ← スタック非依存/固有の混在・対象スタック非該当時は汎用レンズのみ
```
- 15 レンズ・IsAny 実証・Rubric・Common Mistakes は scratchpad ドラフト（`/tmp/.../skills/reviewing-tanstack-start-apps/SKILL.md`）の内容を移植・ck 文体に整える。
- **フロントマターを書かない**（doctor がエラーにする）。

**検証基準**
- `bun run packages/ck/src/cli.ts skill print review-pr` が body 全文を stdout 出力（exit 0）
- body 先頭が `---` で始まらない（フロントマター無し）

### - [x] Step 3: doctor 整合性検査

**コミット**: （Step 1〜2 に含める。単独コミット不要。検査のみ）

**依存**: Step 1・2 / **生産物**: 検査パス

**検証基準**
- `bun run packages/ck/src/cli.ts skill doctor` が review-pr について 0 エラー（ディレクトリ名↔name 一致・frontmatter 完全・print 行形式・body フロントマター無し）

### - [x] Step 4: reviews/ の初期化方針を body に内蔵

**コミット**: （Step 2 のコミットに含める）

**依存**: Step 2 / **生産物**: body の記録節が reviews/ の作成・追記・git リマインダーを規定

**ファイル変更**
- body Step 6 節に: `reviews/` 不在なら作成、`reviews/<date>-<slug>.md` を Write、`git add` は自動実行せずリマインダー出力（discuss/qa と同じ流儀）。索引ファイルは作らない（決定で qa 流台帳+index を却下済み）。

**検証基準**
- body の記録節を読み、reviews/ 作成・ファイル名規則・git リマインダー・「顧客名等を書かない」注記が揃っている

### - [x] Step 5: CLAUDE.md への追記

**コミット**: `docs: CLAUDE.md に reviews/ ストレージと ck:review-pr を追記`

**依存**: Step 2（スキルの実体確定後） / **生産物**: CLAUDE.md 更新

**ファイル変更**
- `CLAUDE.md` 運用ルール（l.31〜34）: git 管理・顧客名記録不可の対象に `reviews/` を追加。
- `CLAUDE.md` ストレージ一覧（l.74〜85 付近）: reviews/ の粒度（レビュー1回単位）・スキル（ck:review-pr）・内容（対象/指摘/判断/コメント案/フォローアップ）を追記。
- スキル優先関係（~/.claude/CLAUDE.md は対象外）には触れない。`ck:review`（自己）と `ck:review-pr`（他者）の違いは各 description で表現。

**検証基準**
- CLAUDE.md に reviews/ の記載があり、既存ストレージ表と整合（粒度・記録先・git 管理）

## リスクと軽減策

- **リスク1: body にスタック固有（TanStack）観点を混ぜることで、他スタックのレビュー時にノイズになる／誤適用される。**
  - 軽減: Design Decision B で固有レンズを視覚的に明示（節分け or タグ）。body Note に「対象スタック非該当時は汎用レンズのみ当て、固有レンズはスキップ」と明記。description でも対象スタックを明示。
- **リスク2: ck:review（自己）と ck:review-pr（他者）の使い分けが曖昧で誤起動される。**
  - 軽減: 両 description を「自己/他者」「PR前自分の差分/他者の成果物」で対比的に書く。review-pr body 位置づけ節に明記。
- **リスク3: スタブ追加はセッション再起動まで Claude Code に認識されず、当セッションで `/review-pr` 起動できない。**
  - 軽減: 想定内。検証は `ck skill print/doctor` の CLI で行い、起動確認は再起動後に回す（CLAUDE.md 既述の制約）。

## 議論が必要な設計決定

> **Design Decision A: スタブ description の確定文（When to use・スタック明示＋症状キーワード）**
> - 案: 「他者が書いたコードをレビュワーとしてレビュー・監査したいときに使用する。PR/MR・ブランチの差分、または既存コード（0から）が対象。『この PR レビューして』『このコード監査して』、TanStack Start / Drizzle / better-auth など “型は通り画面も動くが認可漏れ・非決定的集計・サーバー状態の二重管理が隠れている初心者/AI のコード” を精査したいとき。」
> - トレードオフ: スタック名を具体列挙するとトリガー精度が上がるが、他スタックで起動されにくくなる懸念。→ 「など」で開く。
> - **推奨**: 上記案ベース。汎用トリガー（他者コードのレビュー全般）を主、スタック＋症状を従に置く。

> **Design Decision B: body 内で汎用レンズとスタック固有レンズをどう区別するか**
> - 選択肢1（推奨）: 節を分ける（「汎用レンズ」「スタック固有レンズ（TanStack Start 系）」の2見出し）。視認性が高く、非該当時にまるごとスキップしやすい。
> - 選択肢2: 1つの表に「固有」タグ列を足す。一覧性は高いが、スキップ判断が行単位になり煩雑。
> - **推奨**: 選択肢1。decisions の「混在許容・将来分離」とも整合し、将来の切り出しが容易。

> **Design Decision C: reviews/ の索引（README）を作るか**
> - decisions で qa 流の台帳+index は却下済み。本プランは索引を作らない方針。
> - 確認: この方針で確定してよいか（将来同一対象を複数回レビューする運用が増えたら再検討）。
