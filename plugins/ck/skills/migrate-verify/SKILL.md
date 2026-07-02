---
name: migrate-verify
description: 移行データの旧新突合（リコンサイル）を実行したいときに使用する。「旧システムと件数を突合して」「移行データの一致を確認して」と言われたとき。件数・キー・値・形式の4種突合を読み取り専用で行う。/qa 移行モードの実行系。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, AskUserQuestion
argument-hint: "<対象（機能名・テーブル・ファイル）>"
---

!`ck skill print migrate-verify || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
