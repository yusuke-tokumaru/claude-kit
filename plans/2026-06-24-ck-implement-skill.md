# 実装プラン: ck:implement 新設と superpowers 依存の脱却

- **ブランチ**: main（現在のブランチで継続。新規ブランチは作らない）
- **決定ソース**: `decisions/2026-06-24-ck-implement-skill.md`（全 Decision を必須制約として反映）

## 調査サマリー

- **plan の現状**: [plan/body.md](packages/ck/src/skills/plan/body.md) Step8 が「計画と実行の両方を担う」と明言。実装方法論は持たない。
- **superpowers 参照（リポジトリ内、grep 確定）**:
  - `review/body.md:58` — `superpowers:code-reviewer`（ハード依存、未インストールで停止）
  - `help/body.md:20,31` — `superpowers:brainstorming`（設計判断のルーティング先）
  - `debug/body.md:11` — `superpowers:systematic-debugging`（条件付き併用、無くても完結と明記済み）
- **CLAUDE.md**: プロジェクト [CLAUDE.md](CLAUDE.md) に superpowers 参照・worktree/並列の記述は**無い**。ck-vs-superpowers 優先節・worktree委譲は**グローバル `~/.claude/CLAUDE.md`（リポジトリ外）**にある。
- **スタブ形式**（[test/SKILL.md](plugins/ck/skills/test/SKILL.md) 準拠）: frontmatter（name/description/user-invocable/allowed-tools）＋ `` !`ck skill print <name> || echo "ERROR..."` ``。
- **doctor**（[skill.ts](packages/ck/src/cli/commands/skill.ts)）: スタブ⇔body のディレクトリ対応、name=ディレクトリ名、description 存在、invoke 行と `||` フォールバック、body にフロントマター無し、を検査。

## 反映する設計決定（decisions → ステップ対応）

| decisions の決定 | 反映ステップ |
|---|---|
| C: plan→implement 委譲 | Step 3（implement本体）, Step 5（plan Step8書換） |
| テスト後置き既定+TDDオプト | Step 3（implement本体のテスト姿勢節） |
| α: implement は新規テストを書かない | Step 3（検証節）, Step 5（plan→test 案内維持） |
| 規律（最小差分/パターン踏襲/1step1commit1検証/3回失敗/歪めない） | Step 3 |
| superpowers脱却を一括 | Step 6（review置換）＋議論D1/D2で範囲確定 |

## ステップ間共有コンテキスト

- **スキル二層**: 本体 `packages/ck/src/skills/<name>/body.md`（フロントマター無し）＋ スタブ `plugins/ck/skills/<name>/SKILL.md`（フロントマター有り）。
- **implement の allowed-tools**（plan/test と同等）: `Bash, Read, Grep, Glob, Edit, Write, Task, AskUserQuestion, Skill`。
- **implement の出口**: 全ステップ完了 → `/test` 案内（テスト後置きの本作成へ）。
- **3回失敗ルールの語彙**: debug/body.md と同一表現で一貫させる。

## 議論が必要な設計決定（プラン議論フェーズで確定）

> **【設計決定 D1】help/debug の superpowers 参照も今回外すか**
> decisions は review のみを明示。help（brainstorming）と debug（systematic-debugging）も参照あり。
> - 選択肢A（推奨）: 全部外す。help は `/kickoff` 単独ルーティングに、debug は「内製の体系的デバッグ規律」に書換。superpowers脱却の目的に忠実。
> - 選択肢B: review のみ。debug は既に「無くても完結」、help は代替提示にすぎず実害が薄いため温存。
> **Why**: 「未インストールで動かない」を完全に消すなら A。最小変更なら B。

> **【設計決定 D2】グローバル `~/.claude/CLAUDE.md` を編集するか**
> ck-vs-superpowers 優先節・worktree/並列委譲はリポジトリ外の個人設定にある。全プロジェクトに影響。
> - 選択肢A（推奨）: 編集する。優先節に implement を追記し、worktree/並列を「組み込み Agent（isolation:worktree・並列起動）」に書換、ck:plan の実行委譲を反映。
> - 選択肢B: 触らない。リポジトリ内で完結させ、グローバル設定はユーザーが手動で更新。
> **Why**: 脱却を実効化するには優先節の更新が要るが、全プロジェクト影響＆リポジトリ外のため慎重に。

> **【設計決定 D3】review の置換先エージェント**
> - 選択肢A（推奨）: `feature-dev:code-reviewer`（コードレビュー専用の組み込みエージェント型）。
> - 選択肢B: `general-purpose`（汎用、確実に存在）。
> **Why**: 専用型の方がレビュー品質が高い。存在保証を優先するなら汎用。

## ステップ

### - [ ] Step 1: implement 本体 body.md を作成
- **ファイル**: `packages/ck/src/skills/implement/body.md`（新規、フロントマター無し）
- **内容**: 位置づけ（plan 経由でも単独でも実行）／テスト姿勢（後置き既定・TDDオプト）／検証（既存テスト＋型/lint＋実挙動、新規テストは書かない＝α）／規律（最小差分・パターン踏襲・1step1commit1検証・3回失敗で設計を疑う・歪めない）／plan 経由時はマーカー `- [ ]→- [x]` 更新／出口は `/test` 案内／制約（git add 自動実行しない 等）／完了条件。
- **依存**: なし（decisions が入力）
- **生産物**: implement の本体
- **コミット**: `feat: ck:implement スキル本体を新設（実装駆動・テスト後置き既定）`
- **検証**: `bun run packages/ck/src/cli.ts skill print implement` がフロントマター無しで全文出力

### - [ ] Step 2: implement スタブ SKILL.md を作成
- **ファイル**: `plugins/ck/skills/implement/SKILL.md`（新規）
- **内容**:
```markdown
---
name: implement
description: plan で確定した計画、または方向性が明確なタスクを実装するときに使用する。テスト後置き既定で実装を駆動し、完了後 /test に渡す。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, Task, AskUserQuestion, Skill
---

!`ck skill print implement || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
```
- **依存**: Step 1（本体が存在しないと print が失敗）
- **生産物**: implement のスタブ
- **コミット**: `feat: ck:implement スタブを追加`
- **検証**: `bun run packages/ck/src/cli.ts skill doctor` が ✓（エラー0件）

### - [ ] Step 3: plan/body.md Step8 を implement 委譲に書き換え
- **ファイル**: `packages/ck/src/skills/plan/body.md`
- **変更**: Step8「計画と実行の両方を担う」→「計画専任。承認後は `Skill: implement` を呼んで実行を委譲する」に書換。冒頭説明と完了条件も整合更新（全マーカー `- [x]` は implement 側の責務として記述）。
- **依存**: Step 1（委譲先が存在）
- **生産物**: 計画専任化した plan
- **コミット**: `refactor: ck:plan の実行フェーズを ck:implement に委譲（計画専任化）`
- **検証**: `skill doctor` 維持。plan→implement の委譲が本文で追跡可能

### - [ ] Step 4: review/body.md の superpowers:code-reviewer を組み込みエージェントに置換
- **ファイル**: `packages/ck/src/skills/review/body.md`（Step3 節）
- **変更**: `superpowers:code-reviewer` → D3 で確定したエージェント型。
- **依存**: D3 の結論
- **生産物**: superpowers 非依存の review
- **コミット**: `refactor: ck:review の独立レビューを組み込みエージェントに置換（superpowers依存解消）`
- **検証**: `grep -n superpowers packages/ck/src/skills/review/body.md` が0件

### - [ ] Step 5: help/debug の superpowers 参照を処理（D1 の結論次第）
- **ファイル**: `packages/ck/src/skills/help/body.md`, `packages/ck/src/skills/debug/body.md`
- **変更**: D1=A の場合のみ。help は brainstorming 参照を除去し `/kickoff` 単独に。debug は「systematic-debugging 併用」節を「内製の体系的デバッグ規律（Iron Law 相当を自前記述）」に書換。D1=B なら本ステップはスキップ。
- **依存**: D1 の結論
- **生産物**: help/debug の superpowers 非依存化（A の場合）
- **コミット**: `refactor: help/debug の superpowers 参照を解消`
- **検証**: D1=A なら `grep -rn superpowers packages/ck/src/skills/` が0件

### - [ ] Step 6: CLAUDE.md 更新（D2 の結論次第）
- **ファイル**: プロジェクト [CLAUDE.md](CLAUDE.md)（implement をスキル一覧/新スキル追加手順に反映）。D2=A ならグローバル `~/.claude/CLAUDE.md` も（優先節に implement、worktree/並列を組み込みに、plan の委譲反映）。
- **依存**: Step 1〜5、D2 の結論
- **生産物**: ドキュメント整合
- **コミット**: `docs: ck:implement 追加と superpowers脱却を CLAUDE.md に反映`
- **検証**: プロジェクト CLAUDE.md に implement が記載。D2=A ならグローバルに superpowers 委譲記述が残っていない

### - [ ] Step 7: 整合確認とセッション再起動の案内
- **コマンド**: `bun run packages/ck/src/cli.ts skill doctor` と `skill list`
- **依存**: 全ステップ
- **生産物**: 全スキル整合
- **コミット**: なし（検証のみ）
- **検証**: doctor ✓、list に implement が出る。新スタブ認識にはセッション再起動が必要な旨をユーザーに案内

## リスクと軽減策

- **リスク1: plan/review/debug/help の本文書換でスキル間の連鎖案内（/test・/review・/kickoff 等）が壊れる。**
  - 軽減: 各書換後に該当スキルの「位置づけ」「出口」「完了条件」節を読み返し、委譲先・案内先が実在スキルを指すか確認。Step7 の doctor＋list で最終チェック。
- **リスク2: グローバル CLAUDE.md 編集（D2=A）が他プロジェクトの挙動を変える。**
  - 軽減: D2 を議論フェーズで明示確定。編集する場合は優先節のみ最小差分で、変更箇所をユーザーに提示してから適用。
- **リスク3: implement と test/plan の責務が再び曖昧化。**
  - 軽減: implement 本文に「新規テストは書かない（/test の責務）」「計画は作らない（/plan の責務）」を制約として明記。

## 完了条件

全ステップのマーカーが `- [x]`、`skill doctor` が ✓、リポジトリ内 superpowers 参照が方針どおり（D1 の結論に一致）になった状態。完了後は `/review` を案内する。
