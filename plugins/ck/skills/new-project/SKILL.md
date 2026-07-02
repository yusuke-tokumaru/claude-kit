---
name: new-project
description: 新規プロジェクトの立ち上げ時、または CLAUDE.md・用語集がまだ整備されていないリポジトリで開発を始めるときに使用する。
user-invocable: true
allowed-tools: Bash(find:*), Bash(date:*), Bash(ck skill print:*), Read, Write, Edit, Grep, Glob
argument-hint: "[プロジェクト名]"
---

!`ck skill print new-project || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
