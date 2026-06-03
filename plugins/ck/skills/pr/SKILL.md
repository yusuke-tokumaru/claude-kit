---
name: pr
description: レビュー通過後にプルリクエストを作成する。decisions ログからタイトル・本文を生成し、gh または glab で PR を作成する。
user-invocable: true
allowed-tools: Bash(git *, gh *, glab *), Read, AskUserQuestion
argument-hint: "[タイトル]"
---

!`ck skill print pr` || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"
