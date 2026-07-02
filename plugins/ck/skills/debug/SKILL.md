---
name: debug
description: バグ・エラー・テスト失敗・予期しない挙動を調査したいときに使用する。修正を始める前の根本原因特定が必要なとき。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion, Edit, Write, Skill, mcp__playwright__*
argument-hint: "<症状・エラーメッセージ>"
---

!`ck skill print debug || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
