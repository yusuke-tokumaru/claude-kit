import { describe, test, expect } from 'bun:test';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';

const SKILLS_DIR = join(import.meta.dir, '../../src/skills');

describe('skill bodies', () => {
  test('skills ディレクトリが存在する', () => {
    expect(existsSync(SKILLS_DIR)).toBe(true);
  });

  test('各スキルディレクトリに body.md がある', () => {
    const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      const bodyPath = join(SKILLS_DIR, skill, 'body.md');
      expect(existsSync(bodyPath)).toBe(true);
    }
  });
});
