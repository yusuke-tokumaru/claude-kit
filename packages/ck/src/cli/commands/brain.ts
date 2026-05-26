import { Command } from 'commander';
import {
  createNode, getNode, searchNodes, updateNode, deleteNode,
  createLink, listLinks,
  createDecision, listDecisions,
} from '../../core/db';
import type { NodeKind, LinkType } from '../../core/types';
import { LINK_TYPES } from '../../core/types';

export const brainCommand = new Command('brain').description('ナレッジグラフ操作');

// ----- node -----
const nodeCmd = new Command('node').description('ノード管理');

nodeCmd
  .command('create')
  .description('ノードを追加')
  .requiredOption('--kind <kind>', 'note|todo|decision|research')
  .requiredOption('--title <title>', 'タイトル')
  .option('--body <body>', '本文', '')
  .option('--tags <tags>', 'タグ（カンマ区切り）', '')
  .action((opts) => {
    const node = createNode(
      {
        kind: opts.kind as NodeKind,
        title: opts.title,
        body: opts.body,
        tags: opts.tags ? opts.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      },
      undefined,
      detectProjectId(),
    );
    console.log(JSON.stringify(node, null, 2));
  });

nodeCmd
  .command('get <id>')
  .description('ノードを取得')
  .action((id: string) => {
    const node = getNode(id, undefined, detectProjectId());
    if (!node) { console.error('ノードが見つかりません'); process.exit(1); }
    console.log(JSON.stringify(node, null, 2));
  });

nodeCmd
  .command('search <query>')
  .description('ノードを全文検索')
  .action((query: string) => {
    const nodes = searchNodes(query, undefined, detectProjectId());
    console.log(JSON.stringify(nodes, null, 2));
  });

nodeCmd
  .command('update <id>')
  .description('ノードを更新')
  .option('--title <title>', 'タイトル')
  .option('--body <body>', '本文')
  .option('--tags <tags>', 'タグ（カンマ区切り）')
  .action((id: string, opts) => {
    const input: Parameters<typeof updateNode>[1] = {};
    if (opts.title !== undefined) input.title = opts.title;
    if (opts.body !== undefined) input.body = opts.body;
    if (opts.tags !== undefined) input.tags = opts.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    const node = updateNode(id, input, undefined, detectProjectId());
    if (!node) { console.error('ノードが見つかりません'); process.exit(1); }
    console.log(JSON.stringify(node, null, 2));
  });

nodeCmd
  .command('delete <id>')
  .description('ノードを削除')
  .action((id: string) => {
    const ok = deleteNode(id, undefined, detectProjectId());
    if (!ok) { console.error('ノードが見つかりません'); process.exit(1); }
    console.log('削除しました');
  });

brainCommand.addCommand(nodeCmd);

// ----- link -----
const linkCmd = new Command('link').description('リンク管理');

linkCmd
  .command('create')
  .description('ノード間リンクを追加')
  .requiredOption('--from <id>', 'リンク元ノードID')
  .requiredOption('--to <id>', 'リンク先ノードID')
  .requiredOption('--type <type>', `リンク種別（${LINK_TYPES.join('|')}）`)
  .action((opts) => {
    if (!LINK_TYPES.includes(opts.type as LinkType)) {
      console.error(`エラー: 不正なリンク型 "${opts.type}"`);
      console.error(`使用可能な型: ${LINK_TYPES.join(', ')}`);
      process.exit(1);
    }
    const link = createLink({ from_id: opts.from, to_id: opts.to, type: opts.type as LinkType });
    console.log(JSON.stringify(link, null, 2));
  });

linkCmd
  .command('list <nodeId>')
  .description('ノードのリンク一覧を表示')
  .action((nodeId: string) => {
    const links = listLinks(nodeId);
    console.log(JSON.stringify(links, null, 2));
  });

brainCommand.addCommand(linkCmd);

// ----- decision -----
const decCmd = new Command('decision').description('設計判断管理');

decCmd
  .command('create')
  .description('設計判断を記録')
  .requiredOption('--title <title>', 'タイトル')
  .requiredOption('--decision <decision>', '決定内容')
  .option('--context <context>', '背景・経緯', '')
  .option('--consequences <consequences>', '影響・トレードオフ', '')
  .action((opts) => {
    const dec = createDecision(
      { title: opts.title, decision: opts.decision, context: opts.context, consequences: opts.consequences },
      undefined,
      detectProjectId(),
    );
    console.log(JSON.stringify(dec, null, 2));
  });

decCmd
  .command('list')
  .description('設計判断一覧を表示')
  .action(() => {
    const decisions = listDecisions(undefined, detectProjectId());
    console.log(JSON.stringify(decisions, null, 2));
  });

brainCommand.addCommand(decCmd);

// カレントディレクトリの git リポジトリルートを project_id として返す
function detectProjectId(): string | undefined {
  const proc = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel']);
  if (proc.exitCode !== 0) return undefined;
  return new TextDecoder().decode(proc.stdout).trim() || undefined;
}
