---
name: help
description: プロジェクト固有のQ&Aルーター。CLAUDE.md → .claude/docs/ → コードの優先順で回答する
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
argument-hint: <質問>
---

!`ck skill print help || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
