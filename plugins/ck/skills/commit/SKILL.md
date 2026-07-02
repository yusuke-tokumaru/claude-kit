---
name: commit
description: 未コミットの変更を論理単位に分割してコミットしたいときに使用する。「コミットして」「コミットを切って」と言われたとき。implement 完了後〜 /pr の前段。
user-invocable: true
allowed-tools: Bash(git:*), Read, Grep, Glob, AskUserQuestion, Edit
argument-hint: "[任意: 分割方針・対象スコープ]"
---

!`ck skill print commit || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
