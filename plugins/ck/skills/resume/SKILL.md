---
name: resume
description: 直近の handoff ファイルを読み込んで前回の作業コンテキストを復帰する
user-invocable: true
allowed-tools: Bash(ls *, git status *, git log *), Read
argument-hint: "<任意: handoff ファイル名>"
---

!`ck skill print resume || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
