import { describe, it, expect } from 'vitest';
import { extractTermsFromDiff, scanLocalFile } from '../../../src/harness/sensors/doc-reviewer/doc-reviewer';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('extractTermsFromDiff', () => {
  it('extracts i18n display strings and data-sel-role values from added diff lines', () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-reviewer-test-'));
    const diffFile = join(dir, 'change.diff');
    writeFileSync(
      diffFile,
      [
        '+  "versioning.title": "Content Versioning",',
        '+  <button data-sel-role="restore-version-button">Restore</button>',
        '-  "old.key": "Old Value",',
      ].join('\n'),
      'utf8',
    );
    try {
      const terms = extractTermsFromDiff(diffFile);
      expect(terms).toContain('Content Versioning');
      expect(terms).toContain('restore-version-button');
      expect(terms).not.toContain('Old Value');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns an empty array when no diff path is given', () => {
    expect(extractTermsFromDiff(null)).toEqual([]);
  });

  it('adds the feature slug as a term even with no diff', () => {
    expect(extractTermsFromDiff(null, 'my-feature')).toEqual(['my-feature']);
  });
});

describe('scanLocalFile', () => {
  it('marks a file LIKELY_UPDATED when all terms are present', () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-reviewer-test-'));
    writeFileSync(join(dir, 'README.md'), 'This README documents Content Versioning support.', 'utf8');
    try {
      const result = scanLocalFile('README.md', ['Content Versioning'], dir);
      expect(result.verdict).toBe('LIKELY_UPDATED');
      expect(result.termsFound).toEqual(['Content Versioning']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('marks a missing file FILE_NOT_FOUND', () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-reviewer-test-'));
    try {
      const result = scanLocalFile('MISSING.md', ['x'], dir);
      expect(result.verdict).toBe('FILE_NOT_FOUND');
      expect(result.exists).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
