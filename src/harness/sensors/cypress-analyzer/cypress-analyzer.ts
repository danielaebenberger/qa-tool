#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cypress Analyzer — QA Harness Pillar B.
 *
 * Analyses a Cypress test suite for test adequacy: scenario coverage,
 * assertion quality, data hygiene, persona coverage, and structural smells.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Smell {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  fix: string;
}

const SMELLS: Record<string, Smell> = {
  NO_BEFORE_HOOK: { id: 'NO_BEFORE_HOOK', severity: 'MEDIUM', message: 'No before() or beforeEach() hook — test may depend on shared state or external data', fix: 'Add a before() block that creates test data via cy.apollo() and loginAndStoreSession()' },
  NO_AFTER_HOOK: { id: 'NO_AFTER_HOOK', severity: 'MEDIUM', message: 'No after() or afterEach() hook — test data may leak between runs', fix: 'Add an after() block that deletes test data and calls cy.logout()' },
  NO_SEL_ROLE: { id: 'NO_SEL_ROLE', severity: 'HIGH', message: 'No data-sel-role selectors found — tests are coupled to CSS class names or DOM structure', fix: 'Replace CSS selectors with data-sel-role="..." attributes on the component' },
  ONLY_VISIBILITY: { id: 'ONLY_VISIBILITY', severity: 'MEDIUM', message: 'Assertions only check .should("be.visible") — no content or behaviour verified', fix: 'Add assertions on text content, disabled state, ARIA attributes, or data values' },
  HAS_SKIP: { id: 'HAS_SKIP', severity: 'HIGH', message: 'Contains .skip — test is not running; may hide coverage gap', fix: 'Re-enable the test or document the reason it is skipped with a ticket reference' },
  HAS_ONLY: { id: 'HAS_ONLY', severity: 'HIGH', message: 'Contains .only — other tests in the suite are suppressed', fix: 'Remove .only before merging; this must not reach CI' },
  HARDCODED_PATH: { id: 'HARDCODED_PATH', severity: 'LOW', message: 'Contains hardcoded JCR paths outside test data fixtures', fix: 'Move paths to constants or cy.apollo() fixtures to improve maintainability' },
  NO_ERROR_SCENARIO: { id: 'NO_ERROR_SCENARIO', severity: 'MEDIUM', message: 'No error or failure scenario detected — only happy path is tested', fix: 'Add at least one test case for an error state (API unavailable, permission denied, empty data)' },
  NO_MULTILANG: { id: 'NO_MULTILANG', severity: 'LOW', message: 'No multilingual scenario detected — tests only use one language', fix: 'Consider adding a language-switch test if the feature is language-aware' },
};

const PERSONA_KEYWORDS: Record<string, RegExp> = {
  'content-editor': /editor|jcontent|content.*creat|publish|workflow/i,
  'site-builder': /site.*build|page.*build|layout|component|template/i,
  developer: /api|graphql|module|deploy|bundle/i,
  admin: /admin|permission|role|user.*manag|module.*install/i,
  'compliance-user': /gdpr|wcag|a11y|accessibility|audit|keyboard|aria/i,
};

export interface CypressFileAnalysis {
  file: string;
  describes: string[];
  its: string[];
  testCount: number;
  selRoles: string[];
  cssSelectors: string[];
  assertions: { visibilityOnly: boolean; hasContentAssert: boolean; hasAriaAssert: boolean };
  setup: { hasBefore: boolean; hasAfter: boolean; hasApollo: boolean; hasLoginSession: boolean; hasLogout: boolean };
  coverage: { hasErrorScenario: boolean; hasMultilang: boolean; hasSkip: boolean; hasOnly: boolean; hasHardcodedPath: boolean };
  usesPageObjects: boolean;
  personaSignals: string[];
  smells: Smell[];
  qualityScore: number;
  qualityGrade: 'GOOD' | 'FAIR' | 'POOR';
}

export interface AcCoverageEntry {
  acId: string;
  description: string;
  covered: boolean;
  evidence: string | null;
}

export interface CypressAdequacySummary {
  totalFiles: number;
  totalTests: number;
  averageQualityScore: number;
  overallGrade: 'GOOD' | 'FAIR' | 'POOR';
  smellCount: { HIGH: number; MEDIUM: number; LOW: number };
  coverageSignals: {
    hasErrorScenarios: boolean;
    hasMultilingualTests: boolean;
    hasSkippedTests: boolean;
    hasOnlyTests: boolean;
    usesPageObjects: boolean;
    personasCovered: string[];
  };
  acCoverage: { total: number; covered: number; missing: string[] } | null;
}

export interface CypressAdequacyReport {
  meta: { generatedAt: string; testsDir: string; featureFilter: string; acMatrix: string | null };
  summary: CypressAdequacySummary;
  files: CypressFileAnalysis[];
}

export function findCypressFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    throw new Error(`[cypress-analyzer] Tests directory not found: ${dir}`);
  }
  const results: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.cy\.(ts|js|tsx|jsx)$/.test(entry.name)) results.push(full);
    }
  };
  walk(dir);
  return results;
}

export function analyzeFile(filePath: string, cwd: string): CypressFileAnalysis {
  const src = readFileSync(filePath, 'utf8');
  const relativePath = relative(cwd, filePath);

  const describes = [...src.matchAll(/describe\(['"`]([^'"`]+)['"`]/g)].map((m) => m[1] as string);
  const its = [...src.matchAll(/\bit\(['"`]([^'"`]+)['"`]/g)].map((m) => m[1] as string);

  const cssSelectors = [...src.matchAll(/cy\.get\(['"`](?!.*data-sel-role)([.#[\w][^'"`]+)['"`]\)/g)].map((m) => m[1] as string);
  const selRoles = [
    ...new Set([
      ...[...src.matchAll(/data-sel-role=["'`]([^"'`]+)["'`]/g)].map((m) => m[1] as string),
      ...[...src.matchAll(/\[data-sel-role=["']([^"']+)["']\]/g)].map((m) => m[1] as string),
    ]),
  ];

  const visibilityOnly = src.includes("should('be.visible')") || src.includes('should("be.visible")');
  const hasContentAssert = /\.should\((["'])(contain|have\.text|have\.value|have\.attr|not\.have|include|equal)/.test(src);
  const hasAriaAssert = /aria-/.test(src) || /\.should\(.*aria/.test(src);

  const hasBefore = /\bbefore(Each)?\s*\(/.test(src);
  const hasAfter = /\bafter(Each)?\s*\(/.test(src);
  const hasApollo = /cy\.apollo/.test(src);
  const hasLoginSession = /loginAndStoreSession/.test(src);
  const hasLogout = /cy\.logout/.test(src);

  const hasErrorScenario = /error|fail|unavailable|denied|invalid|empty|null/i.test(src) && its.some((t) => /error|fail|unavailable|denied|invalid|empty|null/i.test(t));
  const hasMultilang = /switchLanguage|changeLanguage|lang.*fr|lang.*de|'fr'|"fr"|'de'|"de"/i.test(src) || its.some((t) => /language|lang|multilingual/i.test(t));
  const hasSkip = /\.skip\(/.test(src);
  const hasOnly = /\.only\(/.test(src);
  const hasHardcodedPath = /\/sites\/[a-z]+\/[a-z-]+\/[a-z-]+\/[a-z-]+/.test(src);

  const usesPageObjects = /from ['"].*page-object['"]/.test(src) || /new (JContent|ContentEditor|JContentPublish)/.test(src);

  const personaSignals: string[] = [];
  for (const [persona, re] of Object.entries(PERSONA_KEYWORDS)) {
    if (re.test(src) || its.some((t) => re.test(t))) personaSignals.push(persona);
  }

  const fileSmells: Smell[] = [];
  if (!hasBefore) fileSmells.push(SMELLS.NO_BEFORE_HOOK as Smell);
  if (!hasAfter) fileSmells.push(SMELLS.NO_AFTER_HOOK as Smell);
  if (selRoles.length === 0) fileSmells.push(SMELLS.NO_SEL_ROLE as Smell);
  if (visibilityOnly && !hasContentAssert) fileSmells.push(SMELLS.ONLY_VISIBILITY as Smell);
  if (hasSkip) fileSmells.push(SMELLS.HAS_SKIP as Smell);
  if (hasOnly) fileSmells.push(SMELLS.HAS_ONLY as Smell);
  if (hasHardcodedPath) fileSmells.push(SMELLS.HARDCODED_PATH as Smell);
  if (!hasErrorScenario) fileSmells.push(SMELLS.NO_ERROR_SCENARIO as Smell);
  if (!hasMultilang) fileSmells.push(SMELLS.NO_MULTILANG as Smell);

  let score = 100;
  for (const smell of fileSmells) {
    if (smell.severity === 'HIGH') score -= 20;
    if (smell.severity === 'MEDIUM') score -= 10;
    if (smell.severity === 'LOW') score -= 5;
  }
  score = Math.max(0, score);

  return {
    file: relativePath,
    describes,
    its,
    testCount: its.length,
    selRoles,
    cssSelectors: cssSelectors.slice(0, 10),
    assertions: { visibilityOnly, hasContentAssert, hasAriaAssert },
    setup: { hasBefore, hasAfter, hasApollo, hasLoginSession, hasLogout },
    coverage: { hasErrorScenario, hasMultilang, hasSkip, hasOnly, hasHardcodedPath },
    usesPageObjects,
    personaSignals,
    smells: fileSmells,
    qualityScore: score,
    qualityGrade: score >= 80 ? 'GOOD' : score >= 50 ? 'FAIR' : 'POOR',
  };
}

export function matchesFeature(entry: CypressFileAnalysis, kw: string | null): boolean {
  if (!kw) return true;
  const k = kw.toLowerCase();
  return entry.file.toLowerCase().includes(k) || entry.describes.some((d) => d.toLowerCase().includes(k)) || entry.its.some((i) => i.toLowerCase().includes(k));
}

export function crossRefWithAC(inventory: CypressFileAnalysis[], acMatrixPath: string | null): AcCoverageEntry[] | null {
  if (!acMatrixPath || !existsSync(acMatrixPath)) return null;
  const content = readFileSync(acMatrixPath, 'utf8');
  const acEntries: Array<{ id: string; description: string }> = [];

  if (acMatrixPath.endsWith('.json')) {
    const json = JSON.parse(content) as { files?: Array<{ its?: string[] }> };
    for (const f of json.files ?? []) for (const i of f.its ?? []) acEntries.push({ id: i, description: i });
  } else {
    for (const m of content.matchAll(/\|\s*(AC-\w+)\s*\|([^|]+)\|/g)) {
      acEntries.push({ id: (m[1] as string).trim(), description: (m[2] as string).trim() });
    }
  }

  const allIts = inventory.flatMap((e) => e.its.map((t) => ({ file: e.file, label: t })));
  return acEntries.map((ac) => {
    const match = allIts.find((t) => t.label.toLowerCase().includes(ac.description.toLowerCase().substring(0, 30)));
    return { acId: ac.id, description: ac.description, covered: !!match, evidence: match ? match.file : null };
  });
}

export function computeSummary(inventory: CypressFileAnalysis[], acCoverage: AcCoverageEntry[] | null): CypressAdequacySummary {
  const allSmells = inventory.flatMap((e) => e.smells);
  const highSmells = allSmells.filter((s) => s.severity === 'HIGH').length;
  const mediumSmells = allSmells.filter((s) => s.severity === 'MEDIUM').length;
  const lowSmells = allSmells.filter((s) => s.severity === 'LOW').length;

  const avgQuality = inventory.length ? Math.round(inventory.reduce((s, e) => s + e.qualityScore, 0) / inventory.length) : 0;
  const allPersonas = [...new Set(inventory.flatMap((e) => e.personaSignals))];

  const overallGrade: 'GOOD' | 'FAIR' | 'POOR' = avgQuality >= 80 && highSmells === 0 ? 'GOOD' : avgQuality >= 50 && highSmells <= 2 ? 'FAIR' : 'POOR';

  return {
    totalFiles: inventory.length,
    totalTests: inventory.reduce((s, e) => s + e.testCount, 0),
    averageQualityScore: avgQuality,
    overallGrade,
    smellCount: { HIGH: highSmells, MEDIUM: mediumSmells, LOW: lowSmells },
    coverageSignals: {
      hasErrorScenarios: inventory.some((e) => e.coverage.hasErrorScenario),
      hasMultilingualTests: inventory.some((e) => e.coverage.hasMultilang),
      hasSkippedTests: inventory.some((e) => e.coverage.hasSkip),
      hasOnlyTests: inventory.some((e) => e.coverage.hasOnly),
      usesPageObjects: inventory.some((e) => e.usesPageObjects),
      personasCovered: allPersonas,
    },
    acCoverage: acCoverage ? { total: acCoverage.length, covered: acCoverage.filter((a) => a.covered).length, missing: acCoverage.filter((a) => !a.covered).map((a) => a.acId) } : null,
  };
}

export function buildAdequacyReport(testsDir: string, feature: string | null, acMatrix: string | null, cwd: string = process.cwd()): CypressAdequacyReport {
  const files = findCypressFiles(testsDir);
  const inventory = files.map((f) => analyzeFile(f, cwd)).filter((e) => matchesFeature(e, feature));
  const acCovRef = crossRefWithAC(inventory, acMatrix);
  const summary = computeSummary(inventory, acCovRef);
  return { meta: { generatedAt: new Date().toISOString(), testsDir, featureFilter: feature ?? 'all', acMatrix }, summary, files: inventory };
}

function runCli(): void {
  const args = process.argv.slice(2);
  const getArg = (flag: string, def: string | null): string | null => {
    const i = args.indexOf(flag);
    return i !== -1 ? (args[i + 1] ?? def) : def;
  };

  const testsDir = getArg('--tests-dir', './tests/cypress/e2e') as string;
  const acMatrix = getArg('--ac-matrix', null);
  const feature = getArg('--feature', null);
  const outputFile = getArg('--output', 'cypress-adequacy-report.json') as string;

  const report = buildAdequacyReport(testsDir, feature, acMatrix);
  writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`[cypress-analyzer] Done. Overall grade: ${report.summary.overallGrade}`);
  process.exit(report.summary.coverageSignals.hasOnlyTests ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
