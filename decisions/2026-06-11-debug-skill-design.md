# /debug スキルの設計

## Context

ck の開発ライフサイクル（kickoff → discuss → plan → test → review → pr）にはバグ対応の入口がなく、kickoff はバグを `superpowers:systematic-debugging` にルーティングしている。しかし (1) 調査結果・根本原因を decisions/ に記録する仕組みがない、(2) 社内 GitLab 移行時に superpowers プラグインが使える保証がない、という2つの空白がある。ユーザーレベルの `investigate-and-plan` スキル（Web UI 特化・Playwright 必須）の資産をどう取り込むかも論点。

## Decision

- ck:debug は**ハイブリッド型**とする: 自前で簡潔な4フェーズ骨格・証拠形式・decisions 記録を持ち、superpowers:systematic-debugging が利用可能な環境では規律の参照先として併用する
- **単一スキル＋UI分岐**とする: 共通4フェーズを持ち、証拠収集フェーズで UI バグなら Playwright 視覚確認を必須化、非 UI バグなら再現コマンド・失敗テスト・ログで証拠化する
- decisions/ への記録は `### <date> debug` セクション・**2タイミング**（原因確定時に Root cause、修正方針合意時に Fix direction）
- 入口: kickoff のバグルーティングを `superpowers:systematic-debugging` から `/debug` に変更する
- 出口: **修正規模で分岐** — 軽微（1〜2ファイル・方針自明）は debug 内で失敗テスト→最小修正→検証して `/test` へ、構造的なら `/plan <bug-slug>` に委譲（記録済み Fix direction が /plan の必須制約になる）。規模の判断はユーザーに確認する

## Consequences

- superpowers が無い環境（社内移行後など）でもデバッグフローが自走する
- 規律の簡略版を ck 側でメンテナンスする必要がある（superpowers 本体との二重管理は骨格レベルに留める）
- kickoff の body（Step 4 ルーティング表）を変更する
- /plan 側の変更は不要（decisions の Decision セクションを制約として読む既存機構がそのまま機能する）

## Discussion Log

### 2026-06-11 discuss

#### Decision: ck:debug はハイブリッド型にする
- **Constraint**: ck:debug は superpowers 非依存で完結する骨格（根本原因調査 → 証拠つき原因特定 → 修正方針）を自前で持つ。superpowers:systematic-debugging の存在は「あれば参照」のオプション扱いとする
- **Why**: kickoff のルーティング先が superpowers のみだと、社内環境でプラグインが使えない場合に開発フローの鎖が切れる。CLAUDE.md に社内移行が明記されており、可搬性は ck の設計前提
- **Rejected alternatives**:
  - B 薄いラッパー（superpowers 前提）— 最小実装だが superpowers が無い環境で機能しない
  - C investigate-and-plan の完全移植 — UI 特化（localhost:3000 / Playwright 必須）の規律が非 UI バグと相性が悪く、改修コストが最大

#### Decision: 単一スキル＋UI分岐とする
- **Constraint**: ck:debug は1スキルに共通4フェーズを持つ。証拠収集フェーズで症状により分岐し、UI バグでは Playwright 視覚確認を必須（スキップ禁止の Red Flags を investigate-and-plan から継承）、非 UI バグでは再現コマンド・失敗テスト・ログを実行時証拠とする。「コード側証拠＋実行時証拠の両方が揃わない限り原因を断言しない」ルールは両分岐で共通
- **Why**: 【原因】【証拠】【影響範囲】の証拠形式は UI / 非 UI で共通に機能する。入口を1つにすることで kickoff のルーティングが単純に保てる
- **Rejected alternatives**: UI 専用（一般バグの自走方針と不整合）、2スキル分割（入口選択をユーザーに転嫁し kickoff 分岐が複雑化）

#### Decision: decisions/ への記録は `### <date> debug` セクション・2タイミング
- **Constraint**: 記録先は `decisions/<date>-<bug-slug>.md`（kickoff と同じスラグ規則、Issue 番号プレフィックス対応）。原因確定時（修正前）に `Root cause` ブロック（Evidence code/runtime・Impact・Ruled out）を、修正方針合意時に `Fix direction` ブロック（Why・Rejected fixes）を追記する。ファイルが無ければ既存 ADR-lite テンプレートで初期化
- **Why**: 修正前に書くことで調査だけで中断しても価値が残る。`Ruled out` を残すことで次セッションの仮説再試行を防ぎ、「3回失敗したらアーキテクチャを疑う」規律と接続する
- **Rejected alternatives**: 修正完了後の一括記録（中断時に調査結果が失われる）

#### Decision: 入口は kickoff から `/debug` へ一本化、出口は修正規模で分岐
- **Constraint**: kickoff Step 4 のバグルーティングを `/debug` に変更する。debug の出口は (1) 軽微な修正（影響1〜2ファイル・方針自明）は debug 内で失敗テスト→最小修正→検証し `/test` `/review` へ、(2) 構造的な修正は `/plan <bug-slug>` に委譲。どちらに進むかはユーザーに確認してから進む
- **Why**: ワンライナー修正にプランモードを強制する過剰と、大規模修正をなし崩しに始める事故の両方を防ぐ。superpowers の規律（修正まで自前）と investigate-and-plan の規律（プラン委譲）の良い側を規模で使い分ける
- **Rejected alternatives**: 常に /plan 委譲（軽微修正に過剰）、常に debug 内で修正（設計判断を含む修正がレビューなしで進む）
