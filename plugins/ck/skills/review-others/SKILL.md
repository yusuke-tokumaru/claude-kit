---
name: review-others
description: 他者が書いたコードをレビュワーとしてレビュー・監査したいときに使用する。「この PR レビューして」「このコード監査して」と言われたとき。対象は PR/MR・ブランチの差分（差分モード）または既存コード・ディレクトリ全体（0からモード）。TanStack Start / Drizzle / better-auth など「型は通り画面も動くが認可漏れ・非決定的な集計・サーバー状態の二重管理が隠れている初心者/AI のコード」を精査したいときにも。自分の差分を PR 前に自己レビューするのは ck:review。
user-invocable: true
allowed-tools: Bash(git:*), Bash(gh:*), Bash(glab:*), Bash(grep:*), Bash(sed:*), Bash(tail:*), Bash(tsc:*), Bash(npx:*), Bash(rm:*), Read, Grep, Glob, Task, Agent, AskUserQuestion, Write
argument-hint: "[PR番号 | ブランチ | パス]（省略時はモード確認）"
---

!`ck skill print review-others || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
