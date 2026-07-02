---
name: pr
description: レビュー通過後、プルリクエスト / マージリクエストを作成したいときに使用する。
user-invocable: true
allowed-tools: Bash(git:*), Bash(gh:*), Bash(glab:*), Bash(sed:*), Bash(cat:*), Bash(echo:*), Bash(which:*), Read, Grep, Glob, Write, AskUserQuestion
argument-hint: "[タイトル]"
---

!`ck skill print pr || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
