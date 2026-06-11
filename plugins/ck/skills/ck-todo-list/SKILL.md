---
name: ck-todo-list
description: 登録済みの TODO を確認・消化したいときに使用する。「TODO 一覧」「残タスク確認」「TODO を完了にして」と言われたとき。
user-invocable: true
allowed-tools: Bash(ck todo *), Read
argument-hint: "[done <スラグ> | --all | --global]"
---

!`ck skill print ck-todo-list || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
