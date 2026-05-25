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

// ノード間のリンク定義
export interface BrainLink {
  from_id: string;
  to_id: string;
  type: string;
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
