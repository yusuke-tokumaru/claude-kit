import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { rmSync, mkdirSync } from 'fs';
import {
  createNode, getNode, searchNodes, updateNode, deleteNode,
  createLink, listLinks,
  createDecision, listDecisions,
} from '../../src/core/db';

const TEST_DB_DIR = '/tmp/ck-brain-test';
const TEST_DB_PATH = join(TEST_DB_DIR, 'brain.db');

beforeEach(() => { mkdirSync(TEST_DB_DIR, { recursive: true }); });
afterEach(() => { rmSync(TEST_DB_DIR, { recursive: true, force: true }); });

describe('node CRUD', () => {
  test('createNode は id と created_at を付与して返す', () => {
    const node = createNode({ kind: 'note', title: 'テスト', body: '本文' }, TEST_DB_PATH);
    expect(node.id).toBeDefined();
    expect(node.title).toBe('テスト');
    expect(node.kind).toBe('note');
    expect(node.tags).toEqual([]);
    expect(node.created_at).toBeDefined();
  });

  test('getNode は作成したノードを取得できる', () => {
    const created = createNode({ kind: 'todo', title: 'TODO項目' }, TEST_DB_PATH);
    const fetched = getNode(created.id, TEST_DB_PATH);
    expect(fetched).not.toBeNull();
    expect(fetched!.title).toBe('TODO項目');
  });

  test('getNode は存在しないIDでnullを返す', () => {
    expect(getNode('unknown', TEST_DB_PATH)).toBeNull();
  });

  test('searchNodes はタイトル部分一致で検索できる', () => {
    createNode({ kind: 'note', title: 'Reactコンポーネント設計' }, TEST_DB_PATH);
    createNode({ kind: 'note', title: 'Bunセットアップ' }, TEST_DB_PATH);
    const results = searchNodes('React', TEST_DB_PATH);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Reactコンポーネント設計');
  });

  test('updateNode はフィールドを更新して返す', () => {
    const node = createNode({ kind: 'note', title: '元タイトル' }, TEST_DB_PATH);
    const updated = updateNode(node.id, { title: '新タイトル', body: '更新内容' }, TEST_DB_PATH);
    expect(updated!.title).toBe('新タイトル');
    expect(updated!.body).toBe('更新内容');
  });

  test('deleteNode はノードを削除してtrueを返す', () => {
    const node = createNode({ kind: 'note', title: '削除対象' }, TEST_DB_PATH);
    expect(deleteNode(node.id, TEST_DB_PATH)).toBe(true);
    expect(getNode(node.id, TEST_DB_PATH)).toBeNull();
  });
});

describe('link operations', () => {
  test('createLink と listLinks が機能する', () => {
    const a = createNode({ kind: 'note', title: 'A' }, TEST_DB_PATH);
    const b = createNode({ kind: 'note', title: 'B' }, TEST_DB_PATH);
    createLink({ from_id: a.id, to_id: b.id, type: 'relates' }, TEST_DB_PATH);
    const links = listLinks(a.id, TEST_DB_PATH);
    expect(links).toHaveLength(1);
    expect(links[0].type).toBe('relates');
  });
});

describe('decision operations', () => {
  test('createDecision と listDecisions が機能する', () => {
    createDecision({ title: 'DB選定', decision: 'SQLite採用', context: 'ローカル用途' }, TEST_DB_PATH);
    const decisions = listDecisions(TEST_DB_PATH);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].title).toBe('DB選定');
  });
});
