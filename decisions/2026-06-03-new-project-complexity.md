# new-project スキルの複雑度改善

## Context

`/new-project` スキルは業務用 Web アプリを対象に設計されているが、外部依存・固定パス前提・二重の決定記録先という3つの問題を抱えていた。

## Decision

- `grill-with-docs` 外部プラグイン依存を廃止し、インタビュー手法を内製化する
- CLAUDE.md 生成先を Phase 1 完了後のディレクトリ調査で動的決定する（`src/`/`packages/` 固定を廃止）
- 決定記録先を `/decisions/` に一本化し、`docs/adr/` を廃止する

## Consequences

- 外部プラグイン未インストール時に停止するフラジャイルな挙動がなくなる
- プロジェクト構造（モノレポ/フラット/frontend-backend 分離など）に応じて適切な CLAUDE.md が生成される
- `/discuss` との記録先統一により、決定の検索が `/decisions/` 1箇所で完結する

## Discussion Log

### 2026-06-03 discuss

#### Decision: grill-with-docs 依存を廃止してインタビュー手法を内製化
- **Constraint**: `grill-with-docs` プラグインのチェックと停止ロジックを削除する。Phase 1 のインタビュー手法は body.md 内に直接記述する
- **Why**: Phase 1 本体にすでにインタビュー手法が書かれており、外部依存は名前を借りているだけで実質的な機能追加がなかった
- **Rejected alternatives**: 依存を維持する（フラジャイルさが残るため却下）

#### Decision: CLAUDE.md 生成先を動的決定
- **Constraint**: Phase 1 完了後に `ls`/`find` でプロジェクト構造を調査し、存在するディレクトリに対応した CLAUDE.md のみを生成する。`src/CLAUDE.md` や `packages/<name>/CLAUDE.md` は固定で生成しない
- **Why**: 業務 Web アプリでも構造は多様（Next.js フラット/モノレポ/frontend-backend 分離など）。固定パス前提では不要ファイルが生成される
- **Rejected alternatives**: テンプレートを「例示」に変えて Claude の判断に委ねる（品質がブレるため却下）

### 2026-06-03 plan

#### Summary
`packages/ck/src/skills/new-project/body.md` を以下の3点で改修した。プランファイル: `~/.claude/plans/piped-singing-zebra.md`
- `grill-with-docs` 依存（事前チェックセクション）を全削除し、インタビュー手法を body.md 内に内製化
- Phase 2 冒頭にディレクトリ検出ステップ（`find` + ユーザー確認）を追加し、CLAUDE.md 生成先を動的決定に変更
- `docs/adr/` への言及をすべて削除し、決定記録を `/decisions/` パターンに統一

#### Decision: 決定記録を /decisions/ に一本化
- **Constraint**: `/new-project` は `docs/adr/` を生成しない。Phase 1 中に確定した決定は `/decisions/<date>-<slug>.md` に書き込む
- **Why**: `/discuss` が `/decisions/` に書き込むため、2箇所管理では「どこに記録があるか」の検索コストが発生する。`/decisions/` の `## Decision` セクションで ADR と同等の重要度表現が可能
- **Rejected alternatives**: `docs/adr/`（重大決定）と `/decisions/`（作業ログ）の役割分離（毎回の判断コストが発生するため却下）
