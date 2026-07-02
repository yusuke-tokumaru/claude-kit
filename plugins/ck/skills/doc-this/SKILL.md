---
name: doc-this
description: 同じ質問・混乱が繰り返されたとき（Rule of Three）、または直前の会話で解決した知見を根拠付きの恒久ドキュメントとしてプロジェクトに残したいときに使用する。.claude/docs/ への文書化。一時的な走り書きは ck:ck-note。
user-invocable: true
allowed-tools: Bash(date:*), Bash(grep:*), Read, Write, Edit, Grep, Glob
argument-hint: "[トピック]"
---

!`ck skill print doc-this || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
