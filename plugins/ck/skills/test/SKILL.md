---
name: test
description: 実装が完了し、ユニットテストで動作を検証したいときに使用する。/review の前段。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, AskUserQuestion, Skill
---

!`ck skill print test || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
