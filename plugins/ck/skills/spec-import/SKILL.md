---
name: spec-import
description: Excel・Word 等の仕様書を構造化 Markdown 仕様（specs/）に取り込みたいときに使用する。「この仕様書を取り込んで」「Excel 仕様を Markdown 化して」と言われたとき。/qa・/plan の一次情報を作る（/office の後工程）。
user-invocable: true
allowed-tools: Read, Grep, Glob, Write, Edit, AskUserQuestion, Skill
argument-hint: "<仕様書ファイルのパス>"
---

!`ck skill print spec-import || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
