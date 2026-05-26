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

  db.run(`CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS links (
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    type TEXT NOT NULL,
    PRIMARY KEY (from_id, to_id, type)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    context TEXT NOT NULL DEFAULT '',
    decision TEXT NOT NULL,
    consequences TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`);

  // project_id カラムの追加（既存DBへのマイグレーション、カラム存在時はスキップ）
  try { db.run('ALTER TABLE nodes ADD COLUMN project_id TEXT'); } catch {}
  try { db.run('ALTER TABLE decisions ADD COLUMN project_id TEXT'); } catch {}

  return db;
}

// ノードを新規作成して返す
export function createNode(
  input: { kind: NodeKind; title: string; body?: string; tags?: string[] },
  dbPath?: string,
  projectId?: string,
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
    'INSERT INTO nodes (id, kind, title, body, tags, created_at, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [node.id, node.kind, node.title, node.body, JSON.stringify(node.tags), node.created_at, projectId ?? null],
  );
  return node;
}

// IDでノードを取得する（存在しない場合はnull）
export function getNode(id: string, dbPath?: string, projectId?: string): BrainNode | null {
  const db = openDb(dbPath);
  const sql = projectId
    ? 'SELECT * FROM nodes WHERE id = ? AND project_id = ?'
    : 'SELECT * FROM nodes WHERE id = ?';
  const params: unknown[] = projectId ? [id, projectId] : [id];
  const row = db.query(sql).get(...(params as [unknown])) as Record<string, unknown> | null;
  if (!row) return null;
  return { ...(row as Omit<BrainNode, 'tags'>), tags: JSON.parse(row.tags as string) };
}

// タイトル・本文の部分一致でノードを検索する
export function searchNodes(query: string, dbPath?: string, projectId?: string): BrainNode[] {
  const db = openDb(dbPath);
  const sql = projectId
    ? 'SELECT * FROM nodes WHERE (title LIKE ? OR body LIKE ?) AND project_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM nodes WHERE title LIKE ? OR body LIKE ? ORDER BY created_at DESC';
  const params: unknown[] = projectId
    ? [`%${query}%`, `%${query}%`, projectId]
    : [`%${query}%`, `%${query}%`];
  const rows = db.query(sql).all(...(params as [unknown])) as Record<string, unknown>[];
  return rows.map(r => ({ ...(r as Omit<BrainNode, 'tags'>), tags: JSON.parse(r.tags as string) }));
}

// ノードのフィールドを部分更新して返す（存在しない場合はnull）
export function updateNode(
  id: string,
  input: Partial<Pick<BrainNode, 'title' | 'body' | 'tags'>>,
  dbPath?: string,
  projectId?: string,
): BrainNode | null {
  const existing = getNode(id, dbPath, projectId);
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
export function deleteNode(id: string, dbPath?: string, projectId?: string): boolean {
  const db = openDb(dbPath);
  const sql = projectId
    ? 'DELETE FROM nodes WHERE id = ? AND project_id = ?'
    : 'DELETE FROM nodes WHERE id = ?';
  const params: unknown[] = projectId ? [id, projectId] : [id];
  const result = db.run(sql, params);
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
  projectId?: string,
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
    'INSERT INTO decisions (id, title, context, decision, consequences, created_at, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [dec.id, dec.title, dec.context, dec.decision, dec.consequences, dec.created_at, projectId ?? null],
  );
  return dec;
}

// 意思決定記録を新しい順で一覧取得する
export function listDecisions(dbPath?: string, projectId?: string): Decision[] {
  const db = openDb(dbPath);
  const sql = projectId
    ? 'SELECT * FROM decisions WHERE project_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM decisions ORDER BY created_at DESC';
  const params: unknown[] = projectId ? [projectId] : [];
  return db.query(sql).all(...(params as [])) as Decision[];
}
