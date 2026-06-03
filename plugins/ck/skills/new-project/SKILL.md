---
name: new-project
description: 新規プロジェクト開始時に使用する。ドメインインタビューで技術スタックとアーキテクチャを把握し、CONTEXT.md・CLAUDE.md 階層・.claude/docs/INDEX.md を生成する
user-invocable: true
allowed-tools: Bash, Read, Write, Grep, Glob, Task, Skill
argument-hint: "[プロジェクト名]"
---

!`ck skill print new-project` || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"
