---
name: handoff
description: セッションを終了・中断するとき、または「ここまでの状態を保存して」「引き継ぎを作って」と言われたときに使用する。コンテキストが長くなり区切りたいときにも。
user-invocable: true
allowed-tools: Bash(git *, mkdir *, date *), Read, Write, Edit
argument-hint: "<任意: トピックスラグ>"
---

!`ck skill print handoff || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
