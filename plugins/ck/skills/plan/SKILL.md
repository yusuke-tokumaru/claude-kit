---
name: plan
description: Create a detailed implementation plan with steps, commits, validation criteria, and risks. Reads decisions from /decisions/<date>-<slug>.md. Use after /discuss converges or when the task is well-defined.
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Task, AskUserQuestion, EnterPlanMode, ExitPlanMode, Edit, Write
argument-hint: <task description>
---

!`ck skill print plan`
