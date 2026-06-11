# playwright-mcp-e2e

Playwright MCP ツールでブラウザを直接操作し、観察した動作を Playwright テストコードに変換する。  
**MCP server name: `playwright`** — ツール名は `mcp__playwright__browser_*` 形式で呼び出す。

## 利用可能な主要ツール

| ツール | 用途 |
|--------|------|
| `mcp__playwright__browser_navigate` | URL に遷移 |
| `mcp__playwright__browser_snapshot` | アクセシビリティツリー取得（セレクタ特定に使う） |
| `mcp__playwright__browser_take_screenshot` | スクリーンショット撮影 |
| `mcp__playwright__browser_click` | 要素クリック |
| `mcp__playwright__browser_type` | テキスト入力（既存値クリア後） |
| `mcp__playwright__browser_fill_form` | フォーム複数フィールドへの一括入力 |
| `mcp__playwright__browser_select_option` | select/combobox で選択 |
| `mcp__playwright__browser_press_key` | キーボード操作（Enter, Tab 等） |
| `mcp__playwright__browser_wait_for` | 要素やテキストの出現を待機 |
| `mcp__playwright__browser_hover` | ホバー |
| `mcp__playwright__browser_handle_dialog` | confirm/alert ダイアログ操作 |
| `mcp__playwright__browser_console_messages` | コンソールログ取得（エラー確認） |
| `mcp__playwright__browser_evaluate` | JS 実行（状態確認等） |
| `mcp__playwright__browser_navigate_back` | ブラウザ戻る |

## 前提条件チェックリスト

テスト作成前に必ず確認する:
- [ ] 開発サーバーが起動している（`package.json` の `dev` スクリプトを確認）
- [ ] DB にテストデータが存在する（必要に応じてシードを実行）
- [ ] テスト対象の URL を把握している

## 標準ワークフロー

1. **遷移**: `browser_navigate` でページを開く
2. **構造把握**: `browser_snapshot` でアクセシビリティツリーを確認（セレクタが分かる）
3. **操作**: `browser_click` / `browser_type` / `browser_fill_form` / `browser_select_option` で操作
4. **待機**: 非同期処理後は `browser_wait_for` でテキスト/要素を待つ
5. **確認**: `browser_snapshot` または `browser_take_screenshot` で結果を確認
6. **生成**: 観察した操作をテストコードに変換して保存

## テストコード生成規則

- **ファイル場所**: `e2e/{feature}/{scenario-name}.spec.ts`（プロジェクトの規約に従う）
- **セレクタの優先順位**: `getByRole` > `getByLabel` > `getByText` > `data-testid` > CSS
- **アサーション**: `expect(page.getByText('...')).toBeVisible()` を基本とする
- **待機**: `waitFor` より `expect().toBeVisible()` の方が安定する

```typescript
import { test, expect } from '@playwright/test';

test.describe('フォームバリデーション', () => {
  test('必須項目が空のとき送信できない', async ({ page }) => {
    await page.goto('http://localhost:3000/...');

    await page.getByRole('button', { name: '送信' }).click();

    await expect(page.getByText('必須項目です')).toBeVisible();
  });
});
```

## よくある失敗と対処

| 問題 | 原因 | 対処 |
|------|------|------|
| セレクタが見つからない | shadow DOM や動的レンダリング | `browser_snapshot` で実際の DOM を確認 |
| クリックが反応しない | 要素が隠れている / disabled | `browser_hover` 後に click、または JS で確認 |
| フォームが送信されない | バリデーションエラー | `browser_console_messages` でエラーを確認 |
| 認証が切れる | セッションタイムアウト | storageState を更新するか再ログイン |
| ダイアログが邪魔をする | confirm/alert の未処理 | `browser_handle_dialog` で先に登録 |

## 認証が必要な場合

ログインフローを最初に実行し、`e2e/.auth/` に storageState を保存して再利用する:

```typescript
// playwright.config.ts
use: { storageState: 'e2e/.auth/user.json' }
```

プロジェクト固有の認証情報は `.env` または `playwright.config.ts` から参照する。
