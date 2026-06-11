---
name: kickoff
description: 新しいタスク・機能・修正に着手する前に使用する。コードベースの現状把握と、タスクをどのスキルで進めるかの判断材料が欲しいとき。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Task
argument-hint: <タスク説明>
---

!`ck skill print kickoff || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
