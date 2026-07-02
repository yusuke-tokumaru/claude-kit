---
name: git-issue-create
description: バグ報告・機能要望・タスクを GitHub / GitLab に Issue として起票したいときに使用する。「Issue にして」「起票して」と言われたとき。
user-invocable: true
allowed-tools: Bash(gh:*), Bash(glab:*), Bash(git:*), Bash(which:*), Bash(cat:*), Read, Grep, Glob, Write, AskUserQuestion
argument-hint: "[任意: バグ・要望の概要（直前の会話文脈からも補完される）]"
---

!`ck skill print git-issue-create || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
