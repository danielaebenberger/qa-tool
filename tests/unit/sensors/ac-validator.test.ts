import { describe, it, expect } from 'vitest';
import { parseTestFile, matchesFeature, buildAcInventory } from '../../../src/harness/sensors/ac-validator/ac-validator';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeTempCypressDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ac-validator-test-'));
  for (const [relPath, content] of Object.entries(files)) {
    const full = join(dir, relPath);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return dir;
}

describe('parseTestFile', () => {
  it('extracts describe/it blocks and data-sel-role selectors', () => {
    const dir = makeTempCypressDir({
      'versioning.cy.ts': `
        describe('Versioning', () => {
          before(() => { cy.apollo({ mutation: 'create' }); });
          it('publishes a new version', () => {
            cy.get('[data-sel-role="publish-button"]').click();
          });
          after(() => { cy.logout(); });
        });
      `,
    });
    try {
      const entry = parseTestFile(join(dir, 'versioning.cy.ts'), dir);
      expect(entry.describes).toEqual(['Versioning']);
      expect(entry.its).toEqual(['publishes a new version']);
      expect(entry.selRoles).toEqual(['publish-button']);
      expect(entry.setup.hasBefore).toBe(true);
      expect(entry.setup.hasAfter).toBe(true);
      expect(entry.setup.hasApollo).toBe(true);
      expect(entry.testCount).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('matchesFeature', () => {
  it('matches when keyword is null (no filter)', () => {
    const entry = { file: 'x.cy.ts', describes: [], its: [], selRoles: [], setup: {} as never, testCount: 0 };
    expect(matchesFeature(entry, null)).toBe(true);
  });

  it('matches on describe text case-insensitively', () => {
    const entry = { file: 'x.cy.ts', describes: ['Versioning Flow'], its: [], selRoles: [], setup: {} as never, testCount: 0 };
    expect(matchesFeature(entry, 'versioning')).toBe(true);
    expect(matchesFeature(entry, 'unrelated')).toBe(false);
  });
});

describe('buildAcInventory', () => {
  it('summarizes across multiple files and applies a feature filter', () => {
    const dir = makeTempCypressDir({
      'versioning.cy.ts': `describe('Versioning', () => { it('a', () => {}); });`,
      'unrelated.cy.ts': `describe('Something else', () => { it('b', () => {}); });`,
    });
    try {
      const summary = buildAcInventory(dir, 'versioning', dir);
      expect(summary.totalFiles).toBe(1);
      expect(summary.totalTests).toBe(1);
      expect(summary.files[0]?.file).toContain('versioning.cy.ts');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
