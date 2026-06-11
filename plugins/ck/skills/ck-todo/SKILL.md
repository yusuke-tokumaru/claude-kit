---
name: ck-todo
description: TODOを個別Markdownファイルに記録する。status: open/done で完了管理。ローカル・グローバル選択可能
user-invocable: true
allowed-tools: Bash(date *), Read, Write, AskUserQuestion
argument-hint: <TODO内容>
---

!`ck skill print ck-todo || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
