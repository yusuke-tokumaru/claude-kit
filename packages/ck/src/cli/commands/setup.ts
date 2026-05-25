import { Command } from 'commander';
import { execFileSync } from 'child_process';
import { join } from 'path';

// プラグインディレクトリのパスを解決（packages/ck/src/cli/commands から5段上がって plugins/ck へ）
const PLUGIN_DIR = join(import.meta.dir, '..', '..', '..', '..', '..', 'plugins', 'ck');

export const setupCommand = new Command('setup')
  .description('Claude Code プラグインを登録し初期設定を行う')
  .action(() => {
    console.log(`プラグインディレクトリ: ${PLUGIN_DIR}`);
    console.log('Claude Code プラグインを登録中...');
    try {
      execFileSync('claude', ['plugin', 'install', PLUGIN_DIR], { stdio: 'inherit' });
      console.log('登録完了');
    } catch {
      console.error('登録失敗。claude CLIが利用可能か確認してください。');
      process.exit(1);
    }
  });
