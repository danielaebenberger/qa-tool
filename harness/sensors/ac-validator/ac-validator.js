#!/usr/bin/env node
/**
 * AC Validator Sensor — Cypress evidence mapper
 *
 * Scans a repository's Cypress test suite and produces a structured JSON
 * inventory that the `qa-ac-validate` skill uses during VALIDATION mode
 * to map acceptance criteria to test evidence.
 *
 * Usage:
 *   node ac-validator.js --tests-dir <path> [--output <file>] [--feature <keyword>]
 *
 * Output:
 *   JSON file with test inventory, describe/it structure, and data-sel-role coverage
 */

const fs = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, defaultVal) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : defaultVal;
};

const testsDir   = getArg('--tests-dir', './tests/cypress/e2e');
const outputFile = getArg('--output', 'ac-evidence-inventory.json');
const featureKeyword = getArg('--feature', null);

// ── File discovery ────────────────────────────────────────────────────────────
function findCypressFiles(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`[ac-validator] Tests directory not found: ${dir}`);
        process.exit(1);
    }
    const results = [];
    function walk(current) {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (/\.cy\.(ts|js|tsx|jsx)$/.test(entry.name)) {
                results.push(fullPath);
            }
        }
    }
    walk(dir);
    return results;
}

// ── Simple AST-free parser ────────────────────────────────────────────────────
// Extracts describe/it blocks and data-sel-role selectors via regex.
// Not perfect, but fast and dependency-free — no AST tooling required.
function parseTestFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    const describes = [];
    const describeRe = /describe\(['"`]([^'"`]+)['"`]/g;
    let m;
    while ((m = describeRe.exec(content)) !== null) {
        describes.push(m[1]);
    }

    const its = [];
    const itRe = /\bit\(['"`]([^'"`]+)['"`]/g;
    while ((m = itRe.exec(content)) !== null) {
        its.push(m[1]);
    }

    const selRoles = [];
    const selRe = /data-sel-role=["'`]([^"'`]+)["'`]/g;
    while ((m = selRe.exec(content)) !== null) {
        selRoles.push(m[1]);
    }
    // Also capture cy.get('[data-sel-role="..."]') patterns
    const cyGetRe = /\[data-sel-role=["']([^"']+)["']\]/g;
    while ((m = cyGetRe.exec(content)) !== null) {
        if (!selRoles.includes(m[1])) selRoles.push(m[1]);
    }

    const hasBefore  = /\bbefore\s*\(/.test(content);
    const hasAfter   = /\bafter\s*\(/.test(content);
    const hasApollo  = /cy\.apollo/.test(content);
    const hasLoginSession = /loginAndStoreSession/.test(content);

    return {
        file: relativePath,
        describes,
        its,
        selRoles: [...new Set(selRoles)],
        setup: { hasBefore, hasAfter, hasApollo, hasLoginSession },
        testCount: its.length
    };
}

// ── Feature filter ────────────────────────────────────────────────────────────
function matchesFeature(entry, keyword) {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
        entry.file.toLowerCase().includes(kw) ||
        entry.describes.some(d => d.toLowerCase().includes(kw)) ||
        entry.its.some(i => i.toLowerCase().includes(kw))
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = findCypressFiles(testsDir);
const inventory = files
    .map(parseTestFile)
    .filter(e => matchesFeature(e, featureKeyword));

const summary = {
    generatedAt: new Date().toISOString(),
    testsDir,
    featureFilter: featureKeyword || 'none (all files)',
    totalFiles: inventory.length,
    totalTests: inventory.reduce((sum, e) => sum + e.testCount, 0),
    totalSelRoles: [...new Set(inventory.flatMap(e => e.selRoles))].length,
    files: inventory
};

fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));

console.log(`[ac-validator] Inventory written to: ${outputFile}`);
console.log(`  Files scanned:    ${summary.totalFiles}`);
console.log(`  Test cases found: ${summary.totalTests}`);
console.log(`  Unique sel-roles: ${summary.totalSelRoles}`);
if (featureKeyword) {
    console.log(`  Feature filter:   "${featureKeyword}"`);
}
