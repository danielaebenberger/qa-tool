import { describe, it, expect } from 'vitest';
import { analyzeFile, computeSummary } from '../../../src/harness/sensors/cypress-analyzer/cypress-analyzer';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function writeTempCyFile(content: string): { dir: string; file: string } {
  const dir = mkdtempSync(join(tmpdir(), 'cypress-analyzer-test-'));
  const file = join(dir, 'sample.cy.ts');
  writeFileSync(file, content, 'utf8');
  return { dir, file };
}

describe('analyzeFile', () => {
  it('flags HAS_ONLY and scores it POOR when .only is present with no hooks or sel-roles', () => {
    const { dir, file } = writeTempCyFile(`
      describe('X', () => {
        it.only('does a thing', () => {
          cy.get('.some-css-class').should('be.visible');
        });
      });
    `);
    try {
      const result = analyzeFile(file, dir);
      expect(result.coverage.hasOnly).toBe(true);
      expect(result.smells.some((s) => s.id === 'HAS_ONLY')).toBe(true);
      expect(result.smells.some((s) => s.id === 'NO_SEL_ROLE')).toBe(true);
      expect(result.qualityGrade).toBe('POOR');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not flag NO_SEL_ROLE when data-sel-role selectors are present, and detects personas', () => {
    const { dir, file } = writeTempCyFile(`
      describe('Content editor publishes', () => {
        before(() => { cy.apollo({ mutation: 'seed' }); loginAndStoreSession(); });
        it('publishes content', () => {
          cy.get('[data-sel-role="publish-button"]').click();
          cy.get('[data-sel-role="status"]').should('contain', 'Published');
        });
        after(() => { cy.logout(); });
      });
    `);
    try {
      const result = analyzeFile(file, dir);
      expect(result.smells.some((s) => s.id === 'NO_SEL_ROLE')).toBe(false);
      expect(result.personaSignals).toContain('content-editor');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('computeSummary', () => {
  it('sets hasOnlyTests true if any file has .only, used to gate CI', () => {
    const { dir, file } = writeTempCyFile(`describe('X', () => { it.only('a', () => {}); });`);
    try {
      const entry = analyzeFile(file, dir);
      const summary = computeSummary([entry], null);
      expect(summary.coverageSignals.hasOnlyTests).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
