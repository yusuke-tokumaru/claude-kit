---
name: refactor
description: 挙動を変えずにコード構造を改善したいときに使用する。「リファクタして」「重複をまとめて」「命名を整理して」と言われたとき。機能追加・バグ修正は含まない（implement / debug の責務）。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, AskUserQuestion
argument-hint: "<対象と狙い（例: src/order の重複集計を集約）>"
---

!`ck skill print refactor || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
