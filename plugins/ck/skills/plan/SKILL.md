---
name: plan
description: 詳細な実装プランを作成する際に使用する。/discuss が収束した後、またはタスクの方向性が明確なときに起動する。
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Task, AskUserQuestion, EnterPlanMode, ExitPlanMode, Edit, Write
argument-hint: <task description>
---

!`ck skill print plan` || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"
