# ck:review-pr — 他者レビュー専任スキルの新設

## Context

既存 `ck:review` は「作者が自分の差分を PR 化前に自己レビューする」スキルで、`implement → test → review → pr` の連鎖の一部。立場は作者、対象は自分のブランチ差分、出力は自分で直すための指摘。

これに対し「他者の成果物をレビュワー側として評価する」スキルが存在しない。対象は他者の PR/MR（差分）または既存コード全体（0から）の両方があり、レビュー結果を記録として残したい、という要件が出た。

加えて、別プロジェクト（demo-new）でのコードレビュー成果として、TanStack Start + Drizzle + better-auth 向けの **レビューレンズパック** ドラフト（`reviewing-tanstack-start-apps`）が scratchpad に既に存在する。15観点 × 3列（何を疑う × 実 grep × あるべき姿）・IsAny 型実証・Severity Rubric・レビュアー自身の罠（Common Mistakes）を備え、writing-skills 作法（frontmatter = When to use のみ）に沿う。これを正式スキル化する作業と、ck:review-pr との関係整理が論点に加わった。

## Decision

- **別スキル `ck:review-pr` を新設する**。既存 `ck:review`（自己レビュー）は据え置き、連鎖参照（implement/test/pr/CLAUDE.md）は無修正。
- **2モードを引数で切り替える**:
  - 差分モード — 引数が PR/MR 番号 or ブランチ。作者の意図（PR description）+ 差分を読んでレビュー。
  - 0からモード — 引数がファイル/ディレクトリ。差分なしで対象全体をコールドレビュー。
  - 引数なし — どちらか確認する。
- **検証観点は新規作成せず既存資産を再利用する**: `ck:review` のコード品質/セキュリティ/論理整合性チェックリスト + `qa` の L1〜L8 レンズ。独立視点が必要なら `feature-dev:code-reviewer` エージェントを起動。
- **レビュー結果を `reviews/<YYYY-MM-DD>-<slug>.md` にレビュー1回単位で記録する**（`decisions/` の流儀に倣う）。記録内容: 対象/作者の意図・指摘（high/medium/low）・判断（approve/request-changes）・PR へのコメント案・フォローアップ。
- `reviews/` は git 管理。実在の顧客名・案件名・認証情報は書き込まない。

### スキル構成（一本化 — 前項「レンズパックとのレイヤリング」を撤回）

- **レビュワー機能は `ck:review-pr` 1スキルに一本化する**。別レイヤーの個人スキル（`reviewing-tanstack-start-apps`）は新設しない。`~/.claude/skills/` への配置も行わない。
- **scratchpad ドラフトの 15 レビューレンズ（何を疑う × 実 grep × あるべき姿）を `ck:review-pr` の body にインライン収録する**。IsAny 型実証・順序不定の横断 grep・Severity Rubric・Common Mistakes（レビュアー自身の罠）も body に含める。
- **記録・モードも ck 流で揃える**: 差分/0からモード、`reviews/<date>-<slug>.md` 記録。
- **frontmatter（スタブ側 SKILL.md）の description は writing-skills 作法に従い When to use（トリガー）のみ**で記述する。スタック明示 + 「型は通るが隠れた問題がある初心者/AIコード」を症状キーワードに。workflow 要約は入れない。
- **汎用観点とスタック固有観点が body 内に混在することを許容**（単体駆動・重複は意図的の方針に整合）。将来2つ目のスタックが必要になったら、その時点で分離を再検討する。

## Consequences

- 新スキル本体 `packages/ck/src/skills/review-pr/body.md` とスタブ `plugins/ck/skills/review-pr/SKILL.md` を作成し、`ck skill doctor` で整合性確認、セッション再起動で認識させる。
- 新ストレージ場所 `reviews/` が増える。CLAUDE.md のストレージ一覧・運用ルールに追記が必要。
- 名前 `review-pr` は PR 限定に読めるが、実体は差分/0からの両モードを扱う。エイリアスや description で「他者コードのレビュー全般」であることを明示する必要がある。
- `ck:review`（自己）と `ck:review-pr`（他者）の使い分けを各スキルの description / help で明確化する。
- 新スキル本体 `packages/ck/src/skills/review-pr/body.md` にドラフト由来の 15 レンズ・検証手法・Rubric・Common Mistakes をインライン収録する。body はかなり大きくなるが、これは意図的（qa の重厚さと同じ位置づけ）。
- frontmatter（description / allowed-tools）の源泉はスタブ側 `plugins/ck/skills/review-pr/SKILL.md`。body にフロントマターは書かない（CLAUDE.md の二層構造ルール）。
- scratchpad ドラフトのレンズ群は TanStack Start + Drizzle + better-auth 固有の記述を含む。description で対象スタックを明示し、非該当スタックでは汎用レンズのみ当てる旨を body に注記する。
- writing-skills の TDD は ck システムでは適用しないが、レンズの実効性（実際にエージェントが観点を見落とすか）は実装時に軽く確認しておくと品質が上がる。

## Discussion Log

### 2026-06-29 discuss

#### Decision: ck:review とは別スキルとして新設する（統合しない）
- **Constraint**: レビュワー専任機能は既存 `ck:review` に統合せず、独立スキルとして実装する。
- **Why**: 立場が違えば入力・ゴール・出力先がすべて変わる（作者=自分で直す洗い出し／レビュワー=他者へ判断とコメント）。ck は既にこの種の立場分割を `git-issue-create`/`git-issue-plan` で採用済み。「単体駆動・重複は意図的」の方針とも整合し、`ck:review` の連鎖文脈（test 後・pr 前）を汚さない。
- **Rejected alternatives**: role パラメータで `ck:review` に統合する案（スキル肥大化・連鎖文脈の混在で却下）。

#### Decision: 新スキル名は ck:review-pr
- **Constraint**: 新スキルの名前は `ck:review-pr`。既存 `ck:review` は改名しない。
- **Why**: 移行コストゼロ（連鎖参照の書き換え不要）。
- **Rejected alternatives**: 名前を入れ替える案（`ck:review` を他者レビューへ／既存を `ck:self-review` に改名 — 意味的に最もきれいだが連鎖参照の全書き換えが必要で却下）。`ck:critique`/`ck:audit` 等の独立語（ck にない語彙が増えるため却下）。

#### Decision: 差分/0から の2モードを引数で切り替え、既存レンズを再利用
- **Constraint**: 引数（PR番号・ブランチ → 差分モード／パス → 0からモード／なし → 確認）でモードを決める。検証観点は `ck:review` のチェックリストと `qa` の L1〜L8 レンズを再利用する。
- **Why**: 他者レビューには差分レビューと0からのレビューの両方があるという要件。`qa` の full/light スコープ切替と同じ発想で、観点の重複作成を避ける。

#### Decision: レビュー結果は reviews/<date>-<slug>.md にレビュー単位で記録
- **Constraint**: 記録先は `reviews/<YYYY-MM-DD>-<slug>.md`、粒度はレビュー1回単位。指摘・判断・PRコメント案・フォローアップを残す。
- **Why**: 「レビュー内容を残したい」という要件。`decisions/` のトピック単位・追記の流儀が、レビュー1回＝1トピックの粒度に最も合う。
- **Rejected alternatives**: `.notes/reviews/`（軽量フロー、台帳性なしで却下）／`reviews/` 台帳+index（qa 流。同一対象を継続的に複数回レビューする場合に強いが、今回の主用途には重いため却下）／記録しない（要件と不一致で却下）。

#### Decision: ~~ck:review-pr（駆動）と reviewing-tanstack-start-apps（レンズパック）を別レイヤーで両立~~（撤回）
- **撤回**: 後続の「一本化」決定により無効。2スキル分割は採らない。

#### Decision: ~~汎用観点の別スキル抽出は後回し、tanstack パックは混在のまま正式化~~（部分撤回）
- **撤回**: `reviewing-tanstack-start-apps` を独立スキルとして正式化する前提が無効化。「汎用/固有を今は分けない（混在許容）」という結論のみ、一本化後の body 内方針として存続。

#### Decision: ~~reviewing-tanstack-start-apps は TDD 検証後に ~/.claude/skills/ へ配置~~（撤回）
- **撤回**: 個人スキルとしての配置を行わないため無効。

#### Decision: レビュワー機能は ck:review-pr 1スキルに一本化する
- **Constraint**: 別レイヤーの個人スキル（`reviewing-tanstack-start-apps`）は新設せず、`~/.claude/skills/` への配置も行わない。scratchpad ドラフトの 15 レンズ・IsAny 型実証・順序不定の横断 grep・Severity Rubric・Common Mistakes（レビュアー自身の罠）を `ck:review-pr` の body にインライン収録する。差分/0からモードと `reviews/` 記録も同 body に統合。description（スタブ側）は writing-skills 作法に従い When to use のみ・スタック明示＋症状キーワードで書く。
- **Why**: ユーザーが「1つのスキルにしてほしい」と明示。維持対象を1つに絞り、駆動と知識を同一 body にまとめる。スタック固有観点と汎用観点の body 内混在は許容（単体駆動・重複は意図的の方針に整合）。
- **Rejected alternatives**: reviewing-tanstack-start-apps（writing-skills 流の個人スキル）に一本化（ck の連鎖・記録・doctor と切り離されるため却下）／ドラフトを純レンズパックのまま正式化（モード・記録のワークフロー要件を満たさないため却下）。

### 2026-06-29 plan

実装プランを作成・承認した（プランファイル: `plans/2026-06-29-review-pr-skill.md`）。

- **構成**: スタブ `plugins/ck/skills/review-pr/SKILL.md` + 本体 `packages/ck/src/skills/review-pr/body.md` + `CLAUDE.md` 追記の3点。
- **確定した設計判断**: description は When to use 形式（他者レビュー全般を主・スタック/症状を従）／body はレンズを「汎用」「スタック固有（TanStack Start 系）」の2節に分ける／reviews/ に索引（README）は作らず「1回1ファイル」のみ。
- **再利用**: review の差分取得コマンドと code-reviewer 起動判定、qa の L1〜L8 観点軸、scratchpad ドラフトの15レンズ・IsAny実証・Rubric・Common Mistakes。
- **ブランチ**: 現在のブランチ（main）で続行。
- 実行は `ck:implement` に委譲。

### 2026-06-29 改善（レビュー指摘の反映）

実装後のスキル自己評価で挙がった弱点4件を body に反映した。

- **汎用レンズ（Step 3）を単体完結化**: `ck:qa` L1〜L8 を名前参照からインライン定義に展開し、`ck:review` チェックリストも本体に明示掲載。非 TanStack スタックでも Step 3 だけでレビューの厚みを保てるようにした（最大の減点要因だった「汎用レンズが外部スキル依存で薄い」を解消）。
- **Step 6 独立視点トリガーを限定**: 「high/medium が1件でも出たら起動」→「根幹に high の疑い／根幹に関わる medium が複数本／規模大」に絞り、単発 medium での過剰起動を止めた。
- **Step 4 のスタック結合**: skip 時に「Step 3 が主軸・単体完結」とクロスリファレンスを追加（2スタック目までの分離保留方針は据え置き）。

#### Decision: スキル名を ck:review-pr → ck:review-others に rename（当初の命名判断を上書き）
- **Constraint**: スキル名を `review-others` に変更する。スタブ名・`ck skill print` 対象・ディレクトリ（`packages/ck/src/skills/review-others/`・`plugins/ck/skills/review-others/`）・本文タイトル/対比表/再実行案内・`CLAUDE.md` の `/review-pr` 参照をすべて更新。
- **Why**: `review-pr` は PR 限定に読めるが実体は差分/0からの両モード（他者コードレビュー全般）。`ck:review`（自己）↔ `ck:review-others`（他者）と review 語幹で対になり、本文冒頭の対比表と名前が一致する。スキル本体は未コミット・参照は5ファイルのみで rename コストが低く、`ck:audit`/`ck:critique` のような新語彙も増やさない（先行判断「新語彙回避」と整合）。
- **Supersedes**: 「新スキル名は ck:review-pr」（2026-06-29 discuss）。移行コストゼロを理由に review-pr を選んだ判断を、未コミット段階での低コスト rename により上書き。
- **Rejected alternatives**: review-pr 据え置き＋文言での注記のみ（名前由来の誤読が残るため却下）／review-pr を残し alias 追加（スキルが2名に見え doctor 整合も複雑化するため却下）／`ck:audit` へ rename（先行判断で却下した新語彙のため不採用）。
