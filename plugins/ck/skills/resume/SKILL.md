---
name: resume
description: 前回の作業を再開したいときに使用する。「続きから」「前回どこまでやった？」と言われたとき、セッション開始直後の文脈復帰に。
user-invocable: true
allowed-tools: Bash(ls *, git status *, git log *), Read
argument-hint: "<任意: handoff ファイル名>"
---

!`ck skill print resume || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
