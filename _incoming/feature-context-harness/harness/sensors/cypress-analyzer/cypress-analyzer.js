#!/usr/bin/env node
/**
 * Cypress Analyzer — QA Harness Pillar B
 *
 * Analyses a Cypress test suite for TEST ADEQUACY — not just line coverage,
 * but scenario coverage, assertion quality, data hygiene, persona coverage,
 * and structural test smells.
 *
 * Usage:
 *   node cypress-analyzer.js --tests-dir <path> [options]
 *
 * Options:
 *   --tests-dir   <path>   Path to Cypress e2e tests folder (default: ./tests/cypress/e2e)
 *   --ac-matrix   <file>   Path to ac-matrix.md or ac-evidence-inventory.json for AC cross-ref
 *   --feature     <slug>   Filter to a specific feature keyword
 *   --output      <file>   Output JSON file (default: cypress-adequacy-report.json)
 *   --verbose              Print findings to stdout
 *
 * Output:
 *   JSON report consumed by the qa-cypress-analyze skill
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const getArg   = (flag, def) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : def; };
const hasFlag  = flag => args.includes(flag);

const testsDir   = getArg('--tests-dir', './tests/cypress/e2e');
const acMatrix   = getArg('--ac-matrix', null);
const feature    = getArg('--feature', null);
const outputFile = getArg('--output', 'cypress-adequacy-report.json');
const verbose    = hasFlag('--verbose');

// ── Constants: smell detectors ────────────────────────────────────────────────
const SMELLS = {
    NO_BEFORE_HOOK: {
        id: 'NO_BEFORE_HOOK',
        severity: 'MEDIUM',
        message: 'No before() or beforeEach() hook — test may depend on shared state or external data',
        fix: 'Add a before() block that creates test data via cy.apollo() and loginAndStoreSession()'
    },
    NO_AFTER_HOOK: {
        id: 'NO_AFTER_HOOK',
        severity: 'MEDIUM',
        message: 'No after() or afterEach() hook — test data may leak between runs',
        fix: 'Add an after() block that deletes test data and calls cy.logout()'
    },
    NO_SEL_ROLE: {
        id: 'NO_SEL_ROLE',
        severity: 'HIGH',
        message: 'No data-sel-role selectors found — tests are coupled to CSS class names or DOM structure',
        fix: 'Replace CSS selectors with data-sel-role="..." attributes on the component'
    },
    ONLY_VISIBILITY: {
        id: 'ONLY_VISIBILITY',
        severity: 'MEDIUM',
        message: 'Assertions only check .should("be.visible") — no content or behaviour verified',
        fix: 'Add assertions on text content, disabled state, ARIA attributes, or data values'
    },
    HAS_SKIP: {
        id: 'HAS_SKIP',
        severity: 'HIGH',
        message: 'Contains .skip — test is not running; may hide coverage gap',
        fix: 'Re-enable the test or document the reason it is skipped with a ticket reference'
    },
    HAS_ONLY: {
        id: 'HAS_ONLY',
        severity: 'HIGH',
        message: 'Contains .only — other tests in the suite are suppressed',
        fix: 'Remove .only before merging; this must not reach CI'
    },
    HARDCODED_PATH: {
        id: 'HARDCODED_PATH',
        severity: 'LOW',
        message: 'Contains hardcoded JCR paths (e.g. /sites/digitall/...) outside test data fixtures',
        fix: 'Move paths to constants or cy.apollo() fixtures to improve maintainability'
    },
    NO_ERROR_SCENARIO: {
        id: 'NO_ERROR_SCENARIO',
        severity: 'MEDIUM',
        message: 'No error or failure scenario detected — only happy path is tested',
        fix: 'Add at least one test case for an error state (API unavailable, permission denied, empty data)'
    },
    NO_MULTILANG: {
        id: 'NO_MULTILANG',
        severity: 'LOW',
        message: 'No multilingual scenario detected — tests only use one language',
        fix: 'Consider adding a language-switch test if the feature is language-aware'
    }
};

// ── File discovery ────────────────────────────────────────────────────────────
function findCypressFiles(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`[cypress-analyzer] Tests directory not found: ${dir}`);
        process.exit(1);
    }
    const results = [];
    (function walk(cur) {
        for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
            const full = path.join(cur, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.cy\.(ts|js|tsx|jsx)$/.test(entry.name)) results.push(full);
        }
    })(dir);
    return results;
}

// ── Per-file analysis ─────────────────────────────────────────────────────────
function analyzeFile(filePath) {
    const src      = fs.readFileSync(filePath, 'utf8');
    const relative = path.relative(process.cwd(), filePath);

    // Describe / it extraction
    const describes = [...src.matchAll(/describe\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
    const its       = [...src.matchAll(/\bit\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]);

    // Selector analysis
    const cssSelectors  = [...src.matchAll(/cy\.get\(['"`](?!.*data-sel-role)([.#[\w][^'"`]+)['"`]\)/g)].map(m => m[1]);
    const selRoles      = [...new Set([
        ...[...src.matchAll(/data-sel-role=["'`]([^"'`]+)["'`]/g)].map(m => m[1]),
        ...[...src.matchAll(/\[data-sel-role=["']([^"']+)["']\]/g)].map(m => m[1])
    ])];

    // Assertion quality
    const visibilityOnly = src.includes('.should(\'be.visible\')') || src.includes('.should("be.visible")');
    const hasContentAssert = /\.should\((["'])(contain|have\.text|have\.value|have\.attr|not\.have|include|equal)/.test(src);
    const hasAriaAssert    = /aria-/.test(src) || /\.should\(.*aria/.test(src);

    // Setup / teardown hygiene
    const hasBefore       = /\bbefore(Each)?\s*\(/.test(src);
    const hasAfter        = /\bafter(Each)?\s*\(/.test(src);
    const hasApollo       = /cy\.apollo/.test(src);
    const hasLoginSession = /loginAndStoreSession/.test(src);
    const hasLogout       = /cy\.logout/.test(src);

    // Scenario coverage signals
    const hasErrorScenario = /error|fail|unavailable|denied|invalid|empty|null/i.test(src)
        && its.some(t => /error|fail|unavailable|denied|invalid|empty|null/i.test(t));
    const hasMultilang = /switchLanguage|changeLanguage|lang.*fr|lang.*de|'fr'|"fr"|'de'|"de"/i.test(src)
        || its.some(t => /language|lang|multilingual/i.test(t));
    const hasSkip  = /\.skip\(/.test(src);
    const hasOnly  = /\.only\(/.test(src);
    const hasHardcodedPath = /\/sites\/[a-z]+\/[a-z-]+\/[a-z-]+\/[a-z-]+/.test(src);

    // Page object usage (Jahia pattern)
    const usesPageObjects = /from ['"].*page-object['"]/.test(src) || /new (JContent|ContentEditor|JContentPublish)/.test(src);

    // Persona signals (from test labels)
    const personaSignals = [];
    const personaKeywords = {
        'content-editor': /editor|jcontent|content.*creat|publish|workflow/i,
        'site-builder':   /site.*build|page.*build|layout|component|template/i,
        'developer':      /api|graphql|module|deploy|bundle/i,
        'admin':          /admin|permission|role|user.*manag|module.*install/i,
        'compliance-user':/gdpr|wcag|a11y|accessibility|audit|keyboard|aria/i
    };
    for (const [persona, re] of Object.entries(personaKeywords)) {
        if (re.test(src) || its.some(t => re.test(t))) personaSignals.push(persona);
    }

    // Smell detection
    const fileSmells = [];
    if (!hasBefore)             fileSmells.push(SMELLS.NO_BEFORE_HOOK);
    if (!hasAfter)              fileSmells.push(SMELLS.NO_AFTER_HOOK);
    if (selRoles.length === 0)  fileSmells.push(SMELLS.NO_SEL_ROLE);
    if (visibilityOnly && !hasContentAssert) fileSmells.push(SMELLS.ONLY_VISIBILITY);
    if (hasSkip)                fileSmells.push(SMELLS.HAS_SKIP);
    if (hasOnly)                fileSmells.push(SMELLS.HAS_ONLY);
    if (hasHardcodedPath)       fileSmells.push(SMELLS.HARDCODED_PATH);
    if (!hasErrorScenario)      fileSmells.push(SMELLS.NO_ERROR_SCENARIO);
    if (!hasMultilang)          fileSmells.push(SMELLS.NO_MULTILANG);

    // Quality score: 0–100
    let score = 100;
    for (const smell of fileSmells) {
        if (smell.severity === 'HIGH')   score -= 20;
        if (smell.severity === 'MEDIUM') score -= 10;
        if (smell.severity === 'LOW')    score -= 5;
    }
    score = Math.max(0, score);

    return {
        file: relative,
        describes,
        its,
        testCount: its.length,
        selRoles,
        cssSelectors: cssSelectors.slice(0, 10), // sample, not full list
        assertions: { visibilityOnly, hasContentAssert, hasAriaAssert },
        setup: { hasBefore, hasAfter, hasApollo, hasLoginSession, hasLogout },
        coverage: { hasErrorScenario, hasMultilang, hasSkip, hasOnly, hasHardcodedPath },
        usesPageObjects,
        personaSignals,
        smells: fileSmells.map(s => ({ ...s })),
        qualityScore: score,
        qualityGrade: score >= 80 ? 'GOOD' : score >= 50 ? 'FAIR' : 'POOR'
    };
}

// ── Feature filter ────────────────────────────────────────────────────────────
function matchesFeature(entry, kw) {
    if (!kw) return true;
    const k = kw.toLowerCase();
    return entry.file.toLowerCase().includes(k)
        || entry.describes.some(d => d.toLowerCase().includes(k))
        || entry.its.some(i => i.toLowerCase().includes(k));
}

// ── AC matrix cross-reference ─────────────────────────────────────────────────
function crossRefWithAC(inventory, acMatrixPath) {
    if (!acMatrixPath || !fs.existsSync(acMatrixPath)) return null;

    // Support both JSON (from ac-validator output) and Markdown (ac-matrix template)
    const content = fs.readFileSync(acMatrixPath, 'utf8');
    const acIds = [];

    if (acMatrixPath.endsWith('.json')) {
        // From ac-evidence-inventory.json: extract it-labels
        const json = JSON.parse(content);
        json.files?.forEach(f => f.its?.forEach(i => acIds.push(i)));
    } else {
        // From ac-matrix.md: extract AC-NNN rows
        const acRowRe = /\|\s*(AC-\w+)\s*\|([^|]+)\|/g;
        let m;
        while ((m = acRowRe.exec(content)) !== null) {
            acIds.push({ id: m[1].trim(), description: m[2].trim() });
        }
    }

    // Try to match each AC to a test it-label
    const allIts = inventory.flatMap(e => e.its.map(t => ({ file: e.file, label: t })));
    const acCoverage = acIds.map(ac => {
        const id   = typeof ac === 'string' ? ac : ac.id;
        const desc = typeof ac === 'string' ? ac : ac.description;
        const match = allIts.find(t => t.label.toLowerCase().includes(desc.toLowerCase().substring(0, 30)));
        return {
            acId: id,
            description: desc,
            covered: !!match,
            evidence: match ? match.file : null
        };
    });

    return acCoverage;
}

// ── Summary computation ───────────────────────────────────────────────────────
function computeSummary(inventory, acCoverage) {
    const allSmells      = inventory.flatMap(e => e.smells);
    const highSmells     = allSmells.filter(s => s.severity === 'HIGH').length;
    const mediumSmells   = allSmells.filter(s => s.severity === 'MEDIUM').length;
    const lowSmells      = allSmells.filter(s => s.severity === 'LOW').length;

    const avgQuality     = inventory.length
        ? Math.round(inventory.reduce((s, e) => s + e.qualityScore, 0) / inventory.length)
        : 0;

    const allPersonas    = [...new Set(inventory.flatMap(e => e.personaSignals))];
    const hasErrorCov    = inventory.some(e => e.coverage.hasErrorScenario);
    const hasMultilangCov= inventory.some(e => e.coverage.hasMultilang);
    const hasSkippedTests= inventory.some(e => e.coverage.hasSkip);
    const hasOnlyTests   = inventory.some(e => e.coverage.hasOnly);
    const usesPageObjects= inventory.some(e => e.usesPageObjects);

    const overallGrade =
        avgQuality >= 80 && highSmells === 0 ? 'GOOD' :
        avgQuality >= 50 && highSmells <= 2  ? 'FAIR' : 'POOR';

    return {
        totalFiles:    inventory.length,
        totalTests:    inventory.reduce((s, e) => s + e.testCount, 0),
        averageQualityScore: avgQuality,
        overallGrade,
        smellCount: { HIGH: highSmells, MEDIUM: mediumSmells, LOW: lowSmells },
        coverageSignals: {
            hasErrorScenarios: hasErrorCov,
            hasMultilingualTests: hasMultilangCov,
            hasSkippedTests,
            hasOnlyTests,
            usesPageObjects,
            personasCovered: allPersonas
        },
        acCoverage: acCoverage
            ? {
                total: acCoverage.length,
                covered: acCoverage.filter(a => a.covered).length,
                missing: acCoverage.filter(a => !a.covered).map(a => a.acId)
              }
            : null
    };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files     = findCypressFiles(testsDir);
const inventory = files.map(analyzeFile).filter(e => matchesFeature(e, feature));
const acCovRef  = crossRefWithAC(inventory, acMatrix);
const summary   = computeSummary(inventory, acCovRef);

const report = {
    meta: {
        generatedAt: new Date().toISOString(),
        testsDir,
        featureFilter: feature || 'all',
        acMatrix: acMatrix || null
    },
    summary,
    files: inventory
};

fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

if (verbose || !outputFile) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  Cypress Test Adequacy Report                ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`  Files analysed:    ${summary.totalFiles}`);
    console.log(`  Test cases:        ${summary.totalTests}`);
    console.log(`  Quality score:     ${summary.averageQualityScore}/100 (${summary.overallGrade})`);
    console.log(`  Smells — HIGH: ${summary.smellCount.HIGH}  MEDIUM: ${summary.smellCount.MEDIUM}  LOW: ${summary.smellCount.LOW}`);
    console.log(`  Error scenarios:   ${summary.coverageSignals.hasErrorScenarios ? '✅' : '⚠️  MISSING'}`);
    console.log(`  Multilingual:      ${summary.coverageSignals.hasMultilingualTests ? '✅' : '⚠️  MISSING'}`);
    console.log(`  Skipped tests:     ${summary.coverageSignals.hasSkippedTests ? '⚠️  YES' : '✅ none'}`);
    console.log(`  .only present:     ${summary.coverageSignals.hasOnlyTests ? '🚨 YES — will suppress tests in CI' : '✅ none'}`);
    console.log(`  Personas covered:  ${summary.coverageSignals.personasCovered.join(', ') || 'none detected'}`);
    if (summary.acCoverage) {
        console.log(`  AC coverage:       ${summary.acCoverage.covered}/${summary.acCoverage.total}`);
        if (summary.acCoverage.missing.length > 0) {
            console.log(`  Missing AC tests:  ${summary.acCoverage.missing.join(', ')}`);
        }
    }
    console.log(`\n  Report written to: ${outputFile}\n`);
}

console.log(`[cypress-analyzer] Done. Overall grade: ${summary.overallGrade}`);
process.exit(summary.coverageSignals.hasOnlyTests ? 1 : 0); // fail CI if .only present
