# ck:implement スキルの新設と superpowers 依存の脱却

## Context

ck スキルキットは「設計・品質」系（kickoff/discuss/debug/plan/qa/test/review/pr）は手厚いが、**実装そのものを駆動する規律が空白**。現状 plan の Step8 が「計画と実行の両方を担う」が、実装方法論（テスト姿勢・最小差分・失敗時の打ち切り等）を持たず、TDD・worktree・並列・code-reviewer を superpowers に暗黙依存している。

ユーザーは superpowers を極力使いたくない。理由は (1) 中身の理解負債が大きい (2) 未インストールだと名指し参照で動かない。これを解消するため、実装駆動スキル `ck:implement` を新設し、superpowers 依存をゼロにする。

## Decision

- **責務境界**: plan は計画専任に戻し、実行フェーズ（旧 Step8）は `ck:implement` に委譲する。implement は plan 経由でも単独でも呼べる「実装規律の単一の置き場所」。
- **テスト姿勢**: テスト後置きを既定とする（CLAUDE.md と整合）。ユーザーが「TDDで」と明示したときのみ implement 内でテスト先行モードに切り替える。TDD は superpowers に依存せず ck 内に薄く内製する。
- **implement と test の境界**: implement は新規テストを書かない。各ステップ検証は「既存テスト実行＋型/lint＋実挙動」で満たす。新規ユニットテスト作成は `/test` の単一責務。
- **implement の規律**: 最小差分／既存パターン踏襲／1ステップ=1コミット=1検証（緑になるまで次へ進まない）／3回失敗で設計を疑う（debug と一貫）／検証に合わせて実装を歪めない／全ステップ完了で `/test` を案内。superpowers のコードは写さず ck の既存語彙で再記述する。
- **スコープ**: superpowers脱却を1プランで一括実施する。implement 新設に加え、review の `superpowers:code-reviewer` 名指しを組み込みエージェントに置換／worktree・並列を組み込み Agent へ寄せる／CLAUDE.md の superpowers 参照節を掃除／plan Step8 を委譲に書き換え。

## Consequences

- 新規スキルは `ck:implement` の1本のみ。他は既存ファイルの書き換え。
- plan/body.md・review/body.md・ルート CLAUDE.md・グローバル CLAUDE.md（superpowers優先関係の節）の改訂が必要。
- implement のスタブ作成と `ck skill doctor` 整合確認、セッション再起動でスタブ認識。
- superpowers 未インストールでも全スキルが完結する状態になる。

## Discussion Log

### 2026-06-24 discuss

#### Decision: 責務境界は plan→implement 委譲（案C）
- **Constraint**: plan は計画専任に戻し、実行は implement に委譲する。implement は単独でも plan 経由でも実行規律の単一の置き場所。
- **Why**: 実装規律を一箇所に集約でき plan 経由でも単独でも再利用可能。kit 既存の委譲パターン（git-issue-plan→kickoff）と一致。
- **Rejected alternatives**: 案A（実行を plan から剥がしユーザーが手動で /implement 起動）=手動の継ぎ目増。案B（小タスク専用に新設、plan は現状維持）=規律が plan と implement で二重管理。

#### Decision: テスト後置き既定 + TDD オプトイン
- **Constraint**: implement は既定でテスト後置き（実装駆動規律に集中、テストは /test）。ユーザー明示時のみテスト先行モード。
- **Why**: CLAUDE.md の既存方針（テスト後置き／TDDは明示時のみ）と整合し改訂不要。ユーザー指示が最優先。
- **Rejected alternatives**: リスクベース適応（CLAUDE.md改訂が必要）。TDD内製し既定化（CLAUDE.md・test と正面衝突）。

#### Decision: implement は新規テストを書かない（案α）
- **Constraint**: implement の検証は「既存テスト実行＋型/lint＋実挙動」。新規ユニットテスト作成は /test の単一責務。
- **Why**: test を「テスト作成の単一の置き場所」に保ち責務が交差しない。1スキル1責務というキット思想に忠実で理解負債を増やさない。
- **Rejected alternatives**: 案β（implement が最小スモークテスト1本を書く）=test とテスト作成責務が二重化し新たな線引きの曖昧さを生む。

#### Decision: superpowers脱却を1プランで一括
- **Constraint**: implement 新設・plan Step8 委譲化・review 名指し置換・worktree/並列の組み込み化・CLAUDE.md 掃除を1プランで実施。
- **Why**: superpowers脱却という単一目的で変更が相互に絡む（CLAUDE.md掃除と plan改訂が implement 新設と一体）。
- **Rejected alternatives**: implement 本体を先行し付随作業を別プラン化（目的が分断され中途半端な依存が残る）。

### 2026-06-24 plan

プラン: `plans/2026-06-24-ck-implement-skill.md`（議論で D1=help/debug も外す・D2=グローバル CLAUDE.md も編集・D3=feature-dev:code-reviewer に確定）。

実装結果（main 上で5コミット）:
- `ck:implement` 本体＋スタブを新設（テスト後置き既定・α境界・規律内蔵）。
- `ck:plan` を計画専任化（Step8 を `Skill: implement` 委譲に書換）。
- `ck:review` の独立レビューを `feature-dev:code-reviewer` に置換。
- `help` を `/discuss` ルーティングに、`debug` を体系的デバッグ規律の内製記述に書換。
- グローバル `~/.claude/CLAUDE.md` の優先節を superpowers 非依存に更新（リポ外のため git 対象外）。
- 検証: `skill doctor` ✓（21スキル）、リポ内 superpowers 参照0件。
