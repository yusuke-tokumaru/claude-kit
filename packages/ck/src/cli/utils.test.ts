import { describe, test, expect } from 'bun:test';
import { getDate, toSlug } from './utils';

describe('getDate', () => {
  test('YYYY-MM-DD 形式を返す', () => {
    expect(getDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('toSlug', () => {
  test('英語テキストを kebab-case に変換する', () => {
    expect(toSlug('React performance tips')).toBe('react-performance-tips');
  });

  test('40文字を超える場合は切り詰める', () => {
    expect(toSlug('a'.repeat(50))).toHaveLength(40);
  });

  test('日本語のみの場合はミリ秒タイムスタンプにフォールバックする', () => {
    expect(toSlug('テスト用メモです')).toMatch(/^\d{13}$/);
  });

  test('英数字混在（テスト用TODO）は ASCII 部分を抽出する', () => {
    expect(toSlug('テスト用TODO')).toBe('todo');
  });

  test('末尾のハイフンを除去する', () => {
    expect(toSlug('hello world-')).not.toMatch(/-$/);
  });
});
