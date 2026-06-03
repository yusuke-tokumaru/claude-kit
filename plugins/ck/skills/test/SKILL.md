---
name: test
description: 実装完了後にユニットテストを作成・実行する。E2Eはユーザーに確認してから playwright-mcp-e2e に委譲する。/review の前に使う。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, Task, AskUserQuestion, Skill
---

!`ck skill print test` || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"
