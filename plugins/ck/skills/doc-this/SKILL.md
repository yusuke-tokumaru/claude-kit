---
name: doc-this
description: 同じ質問・混乱が繰り返されたとき（Rule of Three）、または直前の会話で解決した知見をプロジェクトに残したいときに使用する。.claude/docs/ への文書化。
user-invocable: true
allowed-tools: Bash(date:*), Bash(grep:*), Read, Write, Edit, Grep, Glob
argument-hint: "[トピック]"
---

!`ck skill print doc-this || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
