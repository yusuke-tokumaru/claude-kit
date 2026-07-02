---
name: office
description: Excel・PowerPoint・Word ファイルの内容を確認・テキスト化したいときに使用する。xlsx/xlsm/pptx/docx に対応（旧形式 xls は非対応）。
user-invocable: true
allowed-tools: Bash(python3:*), Bash(which:*), Bash(uv:*), Bash(test:*)
argument-hint: "<ファイルパス>"
---

!`ck skill print office || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
