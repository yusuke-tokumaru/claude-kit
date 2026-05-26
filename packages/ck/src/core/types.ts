// ナレッジグラフのノード種別
export type NodeKind = 'note' | 'todo' | 'decision' | 'research';

// ナレッジグラフのノード定義
export interface BrainNode {
  id: string;
  kind: NodeKind;
  title: string;
  body: string;
  tags: string[];
  created_at: string;
}

// リンク型の許可リスト（Enum相当）
export const LINK_TYPES = ['relates', 'blocks', 'implements', 'depends-on'] as const;
export type LinkType = typeof LINK_TYPES[number];

// ノード間のリンク定義
export interface BrainLink {
  from_id: string;
  to_id: string;
  type: LinkType;
}

// 意思決定記録
export interface Decision {
  id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  created_at: string;
}
