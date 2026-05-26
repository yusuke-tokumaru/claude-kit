import { describe, test, expect } from 'bun:test';
import { LINK_TYPES } from '../../src/core/types';

describe('LinkType', () => {
  test('LINK_TYPES に4種の型が含まれる', () => {
    expect(LINK_TYPES).toContain('relates');
    expect(LINK_TYPES).toContain('blocks');
    expect(LINK_TYPES).toContain('implements');
    expect(LINK_TYPES).toContain('depends-on');
    expect(LINK_TYPES).toHaveLength(4);
  });

  test('LINK_TYPES は配列である', () => {
    expect(Array.isArray(LINK_TYPES)).toBe(true);
  });
});
