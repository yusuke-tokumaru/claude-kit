---
name: ck-todo
description: あとでやる作業を TODO として登録したいときに使用する。「TODO に積んで」「あとでやるから残しておいて」と言われたとき。
user-invocable: true
allowed-tools: Bash(ck todo *)
argument-hint: "<TODO内容> [--global] [--priority high|medium|low]"
---

!`ck skill print ck-todo || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
