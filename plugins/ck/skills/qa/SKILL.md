---
name: qa
description: テストケース・QA観点の洗い出しが必要なときに使用する。「テストケースを作って」「QA観点を出して」「移行データの確認項目を洗い出して」と言われたとき。正常系に偏らずL1〜L7 の検証レンズ（WHO軸）とテスト技法（HOW軸）で網羅する。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Task, AskUserQuestion, Edit, Write
argument-hint: <機能名 or 対象>
---

!`ck skill print qa || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
