---
name: plan
description: 詳細な実装プランを作成する際に使用する。/discuss が収束した後、またはタスクの方向性が明確なときに起動する。
user-invocable: true
allowed-tools: Bash(git branch:*), Read, Grep, Glob, Task, Agent, AskUserQuestion, EnterPlanMode, ExitPlanMode, Edit, Write, Skill
argument-hint: <task description>
---

!`ck skill print plan || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
