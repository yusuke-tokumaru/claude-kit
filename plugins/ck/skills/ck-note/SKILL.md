---
name: ck-note
description: 会話中の気づき・調査結果を一時的な走り書きメモとして残したいときに使用する。「メモして」「記録しておいて」と言われたとき。恒久的な知見の文書化は ck:doc-this、設計判断の記録は ck:discuss（decisions/）。
user-invocable: true
allowed-tools: Bash(ck note:*)
argument-hint: "<メモ内容> [--global]"
---

!`ck skill print ck-note || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
