---
name: ck-note
description: メモをMarkdownファイルに素早く記録する。ローカル(.notes/)またはグローバル(~/.ck-notes/)を選択可能
user-invocable: true
allowed-tools: Bash(date *), Read, Write, AskUserQuestion
argument-hint: <メモ内容>
---

!`ck skill print ck-note` || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"
