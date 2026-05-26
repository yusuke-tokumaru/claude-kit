import { Command } from 'commander';
import { execFileSync } from 'child_process';
import { join } from 'path';

// plugins/ ディレクトリをマーケットプレイスとして登録し、ck プラグインをインストールする
const PLUGINS_DIR = join(import.meta.dir, '..', '..', '..', '..', '..', 'plugins');

export const setupCommand = new Command('setup')
  .description('Claude Code プラグインを登録し初期設定を行う')
  .action(() => {
    console.log(`プラグインディレクトリ: ${PLUGINS_DIR}`);
    try {
      console.log('マーケットプレイスを登録中...');
      execFileSync('claude', ['plugin', 'marketplace', 'add', PLUGINS_DIR], { stdio: 'inherit' });
      console.log('プラグインをインストール中...');
      execFileSync('claude', ['plugin', 'install', 'ck'], { stdio: 'inherit' });
      console.log('登録完了');
    } catch {
      console.error('登録失敗。claude CLIが利用可能か確認してください。');
      process.exit(1);
    }
  });
