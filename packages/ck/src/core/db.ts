import { Database } from 'bun:sqlite';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import type { BrainNode, BrainLink, Decision, NodeKind } from './types';

// デフォルトのDB保存パス
const DEFAULT_DB_PATH = join(homedir(), '.ck-brain', 'brain.db');

// DBを開き、テーブルが存在しない場合は作成する
function openDb(path = DEFAULT_DB_PATH): Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS links (
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      type TEXT NOT NULL,
      PRIMARY KEY (from_id, to_id, type)
    );
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      context TEXT NOT NULL DEFAULT '',
      decision TEXT NOT NULL,
      consequences TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

// ノードを新規作成して返す
export function createNode(
  input: { kind: NodeKind; title: string; body?: string; tags?: string[] },
  dbPath?: string,
): BrainNode {
  const db = openDb(dbPath);
  const node: BrainNode = {
    id: crypto.randomUUID(),
    kind: input.kind,
    title: input.title,
    body: input.body ?? '',
    tags: input.tags ?? [],
    created_at: new Date().toISOString(),
  };
  db.run(
    'INSERT INTO nodes (id, kind, title, body, tags, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [node.id, node.kind, node.title, node.body, JSON.stringify(node.tags), node.created_at],
  );
  return node;
}

// IDでノードを取得する（存在しない場合はnull）
export function getNode(id: string, dbPath?: string): BrainNode | null {
  const db = openDb(dbPath);
  const row = db.query('SELECT * FROM nodes WHERE id = ?').get(id) as Record<string, unknown> | null;
  if (!row) return null;
  return { ...(row as Omit<BrainNode, 'tags'>), tags: JSON.parse(row.tags as string) };
}

// タイトル・本文の部分一致でノードを検索する
export function searchNodes(query: string, dbPath?: string): BrainNode[] {
  const db = openDb(dbPath);
  const rows = db
    .query('SELECT * FROM nodes WHERE title LIKE ? OR body LIKE ? ORDER BY created_at DESC')
    .all(`%${query}%`, `%${query}%`) as Record<string, unknown>[];
  return rows.map(r => ({ ...(r as Omit<BrainNode, 'tags'>), tags: JSON.parse(r.tags as string) }));
}

// ノードのフィールドを部分更新して返す（存在しない場合はnull）
export function updateNode(
  id: string,
  input: Partial<Pick<BrainNode, 'title' | 'body' | 'tags'>>,
  dbPath?: string,
): BrainNode | null {
  const existing = getNode(id, dbPath);
  if (!existing) return null;
  const updated: BrainNode = { ...existing, ...input };
  const db = openDb(dbPath);
  db.run('UPDATE nodes SET title = ?, body = ?, tags = ? WHERE id = ?', [
    updated.title,
    updated.body,
    JSON.stringify(updated.tags),
    id,
  ]);
  return updated;
}

// ノードを削除し、削除成功ならtrueを返す
export function deleteNode(id: string, dbPath?: string): boolean {
  const db = openDb(dbPath);
  const result = db.run('DELETE FROM nodes WHERE id = ?', [id]);
  return result.changes > 0;
}

// ノード間のリンクを作成して返す
export function createLink(input: BrainLink, dbPath?: string): BrainLink {
  const db = openDb(dbPath);
  db.run('INSERT OR REPLACE INTO links (from_id, to_id, type) VALUES (?, ?, ?)', [
    input.from_id,
    input.to_id,
    input.type,
  ]);
  return input;
}

// 指定ノードに関連するリンク一覧を返す
export function listLinks(nodeId: string, dbPath?: string): BrainLink[] {
  const db = openDb(dbPath);
  return db
    .query('SELECT * FROM links WHERE from_id = ? OR to_id = ?')
    .all(nodeId, nodeId) as BrainLink[];
}

// 意思決定記録を作成して返す
export function createDecision(
  input: { title: string; context?: string; decision: string; consequences?: string },
  dbPath?: string,
): Decision {
  const db = openDb(dbPath);
  const dec: Decision = {
    id: crypto.randomUUID(),
    title: input.title,
    context: input.context ?? '',
    decision: input.decision,
    consequences: input.consequences ?? '',
    created_at: new Date().toISOString(),
  };
  db.run(
    'INSERT INTO decisions (id, title, context, decision, consequences, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [dec.id, dec.title, dec.context, dec.decision, dec.consequences, dec.created_at],
  );
  return dec;
}

// 意思決定記録を新しい順で一覧取得する
export function listDecisions(dbPath?: string): Decision[] {
  const db = openDb(dbPath);
  return db.query('SELECT * FROM decisions ORDER BY created_at DESC').all() as Decision[];
}
