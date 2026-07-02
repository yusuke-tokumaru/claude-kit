---
name: playwright-mcp-e2e
description: UIのE2Eテストを作成する際に使用する。UIテスト作成・フォーム動作確認・e2eスペック作成を依頼されたときに起動する。UIバグの原因調査・再現は ck:debug が主担当（debug が視覚確認の手段として本スキルの手順を使う）。
user-invocable: true
allowed-tools: Bash, Read, Write, Grep, Glob, mcp__playwright__*
---

!`ck skill print playwright-mcp-e2e || echo "ERROR: ck not found. Fix: cd ~/claude-kit && bun link"`
