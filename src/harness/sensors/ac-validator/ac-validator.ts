#!/usr/bin/env -S node --experimental-strip-types
/**
 * AC Validator Sensor — Cypress evidence mapper.
 *
 * Scans a repository's Cypress test suite and produces a structured
 * inventory that the `qa-ac-validate` skill uses during VALIDATION mode
 * to map acceptance criteria to test evidence.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface TestFileSetup {
  hasBefore: boolean;
  hasAfter: boolean;
  hasApollo: boolean;
  hasLoginSession: boolean;
}

export interface TestFileEntry {
  file: string;
  describes: string[];
  its: string[];
  selRoles: string[];
  setup: TestFileSetup;
  testCount: number;
}

export interface AcInventorySummary {
  generatedAt: string;
  testsDir: string;
  featureFilter: string;
  totalFiles: number;
  totalTests: number;
  totalSelRoles: number;
  files: TestFileEntry[];
}

export function findCypressFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    throw new Error(`[ac-validator] Tests directory not found: ${dir}`);
  }
  const results: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.cy\.(ts|js|tsx|jsx)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  };
  walk(dir);
  return results;
}

export function parseTestFile(filePath: string, cwd: string): TestFileEntry {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = relative(cwd, filePath);

  const describes = [...content.matchAll(/describe\(['"`]([^'"`]+)['"`]/g)].map((m) => m[1] as string);
  const its = [...content.matchAll(/\bit\(['"`]([^'"`]+)['"`]/g)].map((m) => m[1] as string);

  const selRoles = new Set<string>();
  for (const m of content.matchAll(/data-sel-role=["'`]([^"'`]+)["'`]/g)) selRoles.add(m[1] as string);
  for (const m of content.matchAll(/\[data-sel-role=["']([^"']+)["']\]/g)) selRoles.add(m[1] as string);

  const setup: TestFileSetup = {
    hasBefore: /\bbefore\s*\(/.test(content),
    hasAfter: /\bafter\s*\(/.test(content),
    hasApollo: /cy\.apollo/.test(content),
    hasLoginSession: /loginAndStoreSession/.test(content),
  };

  return {
    file: relativePath,
    describes,
    its,
    selRoles: [...selRoles],
    setup,
    testCount: its.length,
  };
}

export function matchesFeature(entry: TestFileEntry, keyword: string | null): boolean {
  if (!keyword) return true;
  const kw = keyword.toLowerCase();
  return (
    entry.file.toLowerCase().includes(kw) ||
    entry.describes.some((d) => d.toLowerCase().includes(kw)) ||
    entry.its.some((i) => i.toLowerCase().includes(kw))
  );
}

export function buildAcInventory(testsDir: string, featureKeyword: string | null, cwd: string = process.cwd()): AcInventorySummary {
  const files = findCypressFiles(testsDir);
  const inventory = files.map((f) => parseTestFile(f, cwd)).filter((e) => matchesFeature(e, featureKeyword));

  return {
    generatedAt: new Date().toISOString(),
    testsDir,
    featureFilter: featureKeyword ?? 'none (all files)',
    totalFiles: inventory.length,
    totalTests: inventory.reduce((sum, e) => sum + e.testCount, 0),
    totalSelRoles: new Set(inventory.flatMap((e) => e.selRoles)).size,
    files: inventory,
  };
}

function runCli(): void {
  const args = process.argv.slice(2);
  const getArg = (flag: string, def: string | null): string | null => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? (args[idx + 1] ?? def) : def;
  };

  const testsDir = getArg('--tests-dir', './tests/cypress/e2e') as string;
  const outputFile = getArg('--output', 'ac-evidence-inventory.json') as string;
  const featureKeyword = getArg('--feature', null);

  const summary = buildAcInventory(testsDir, featureKeyword);
  writeFileSync(outputFile, JSON.stringify(summary, null, 2));

  console.log(`[ac-validator] Inventory written to: ${outputFile}`);
  console.log(`  Files scanned:    ${summary.totalFiles}`);
  console.log(`  Test cases found: ${summary.totalTests}`);
  console.log(`  Unique sel-roles: ${summary.totalSelRoles}`);
  if (featureKeyword) console.log(`  Feature filter:   "${featureKeyword}"`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
