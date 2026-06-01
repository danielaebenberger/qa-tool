#!/usr/bin/env node
/**
 * Doc Reviewer Sensor — QA Harness Pillar D
 *
 * Scans LOCAL documentation files (README, CHANGELOG, MIGRATION, API docs)
 * for mentions of feature-specific terms and detects potential documentation gaps.
 *
 * For REMOTE sources (Academy, Confluence) it fetches publicly accessible URLs
 * and scans their text content. Auth-gated sources are flagged for manual review.
 *
 * Usage:
 *   node doc-reviewer.js --sources <doc-sources.md> --feature <slug> [options]
 *
 * Options:
 *   --sources    <file>   Path to filled DOC_SOURCES_TEMPLATE.md
 *   --feature    <slug>   Feature keyword (used in diff and term search)
 *   --diff       <file>   Path to git diff or PR diff file (for user-visible change extraction)
 *   --repo-root  <path>   Root of the target repository (default: .)
 *   --output     <file>   Output JSON report (default: doc-review-raw.json)
 *   --verbose             Print findings to stdout
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const http = require('https');

const args    = process.argv.slice(2);
const getArg  = (f, d) => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : d; };
const hasFlag = f => args.includes(f);

const sourcesFile = getArg('--sources', null);
const featureSlug = getArg('--feature', '');
const diffFile    = getArg('--diff', null);
const repoRoot    = getArg('--repo-root', '.');
const outputFile  = getArg('--output', 'doc-review-raw.json');
const verbose     = hasFlag('--verbose');

// ── Term extraction from diff ─────────────────────────────────────────────────
// Extract terms the reviewer should look for in documentation.
// These are UI strings, config keys, API fields, and component names added in the diff.
function extractTermsFromDiff(diffPath) {
    if (!diffPath || !fs.existsSync(diffPath)) return [];
    const diff = fs.readFileSync(diffPath, 'utf8');
    const terms = new Set();

    // Added lines only (lines starting with +, not +++)
    const added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));

    // i18n keys and their values (e.g. "versioning": "Versioning")
    const i18nRe = /"([a-zA-Z][a-zA-Z0-9_.]+)":\s*"([^"]+)"/g;
    for (const line of added) {
        let m;
        while ((m = i18nRe.exec(line)) !== null) {
            if (m[2].length > 2 && m[2].length < 60) terms.add(m[2]); // the display string
        }
    }
    // data-sel-role values
    const selRe = /data-sel-role=["']([^"']+)["']/g;
    for (const line of added) {
        let m;
        while ((m = selRe.exec(line)) !== null) terms.add(m[1]);
    }
    // buttonLabel values in action registrations
    const btnRe = /buttonLabel[^"']*['"]([^"']+)['"]/g;
    for (const line of added) {
        let m;
        while ((m = btnRe.exec(line)) !== null) terms.add(m[1]);
    }
    // Feature slug itself
    if (featureSlug) terms.add(featureSlug);

    return [...terms].filter(t => t.length > 2);
}

// ── Local file scanner ────────────────────────────────────────────────────────
function scanLocalFile(filePath, terms) {
    const absPath = path.resolve(repoRoot, filePath);
    if (!fs.existsSync(absPath)) {
        return { exists: false, path: filePath, termsFound: [], termsMissing: terms, verdict: 'FILE_NOT_FOUND' };
    }
    const content = fs.readFileSync(absPath, 'utf8').toLowerCase();
    const termsFound   = terms.filter(t => content.includes(t.toLowerCase()));
    const termsMissing = terms.filter(t => !content.includes(t.toLowerCase()));

    // Additional signals
    const hasVersionRef  = /\d+\.\d+\.\d+/.test(content);
    const hasTodoMarker  = /\bTODO\b|\bFIXME\b|\bXXX\b/.test(content);
    const lineCount      = content.split('\n').length;
    const lastModified   = fs.statSync(absPath).mtime.toISOString().split('T')[0];

    const coverage = terms.length > 0
        ? Math.round((termsFound.length / terms.length) * 100)
        : 100;

    const verdict =
        !fs.existsSync(absPath) ? 'FILE_NOT_FOUND' :
        terms.length === 0      ? 'EXISTS_NO_TERMS' :
        coverage >= 80          ? 'LIKELY_UPDATED' :
        coverage >= 40          ? 'PARTIALLY_UPDATED' :
        'LIKELY_STALE';

    return {
        exists: true,
        path: filePath,
        absolutePath: absPath,
        lineCount,
        lastModified,
        hasVersionRef,
        hasTodoMarker,
        termsFound,
        termsMissing,
        coveragePercent: coverage,
        verdict
    };
}

// ── Remote URL fetcher (simple, no auth) ──────────────────────────────────────
function fetchRemote(url, terms, timeoutMs = 8000) {
    return new Promise(resolve => {
        const req = http.get(url, { timeout: timeoutMs }, res => {
            if (res.statusCode === 401 || res.statusCode === 403) {
                resolve({ url, accessible: false, reason: 'AUTH_REQUIRED', verdict: 'MANUAL_REVIEW_REQUIRED' });
                return;
            }
            if (res.statusCode === 404) {
                resolve({ url, accessible: false, reason: 'NOT_FOUND', verdict: 'URL_NOT_FOUND' });
                return;
            }
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                // Strip HTML tags for text matching
                const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
                const termsFound   = terms.filter(t => text.includes(t.toLowerCase()));
                const termsMissing = terms.filter(t => !text.includes(t.toLowerCase()));
                const coverage     = terms.length > 0
                    ? Math.round((termsFound.length / terms.length) * 100) : 100;
                resolve({
                    url,
                    accessible: true,
                    termsFound,
                    termsMissing,
                    coveragePercent: coverage,
                    verdict:
                        coverage >= 80 ? 'LIKELY_UPDATED' :
                        coverage >= 40 ? 'PARTIALLY_UPDATED' : 'LIKELY_STALE'
                });
            });
        });
        req.on('error', err => resolve({ url, accessible: false, reason: err.message, verdict: 'FETCH_ERROR' }));
        req.on('timeout', () => { req.destroy(); resolve({ url, accessible: false, reason: 'TIMEOUT', verdict: 'FETCH_ERROR' }); });
    });
}

// ── Sources form parser ───────────────────────────────────────────────────────
// Extracts URL and file path values from the filled DOC_SOURCES_TEMPLATE.md
function parseSourcesForm(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const sources = { local: [], remote: [], manual: [], rawContent: content };

    // Extract table rows: | **Label** | value |
    const rowRe = /\|\s*\*\*[^|]+\*\*\s*\|\s*([^|]+)\s*\|/g;
    let m;
    while ((m = rowRe.exec(content)) !== null) {
        const val = m[1].trim();
        if (val.startsWith('http')) sources.remote.push(val);
        else if (val.match(/\.(md|txt|graphql|yaml|yml|json)$/)) sources.local.push(val);
        else if (val.toLowerCase().includes('n/a') || val.toLowerCase().includes('none')) { /* skip */ }
        else if (val.toLowerCase().includes('manual') || val.toLowerCase().includes('login')) sources.manual.push(val);
    }
    return sources;
}

// ── Standard files to always check ───────────────────────────────────────────
const STANDARD_LOCAL = ['README.md', 'CHANGELOG.md', 'MIGRATION.md'];

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
    const terms   = extractTermsFromDiff(diffFile);
    const parsed  = parseSourcesForm(sourcesFile);
    const results = { meta: { generatedAt: new Date().toISOString(), featureSlug, terms }, sources: [] };

    // Always scan standard local files
    const localFiles = [...new Set([...STANDARD_LOCAL, ...(parsed?.local || [])])];
    for (const f of localFiles) {
        results.sources.push({ type: 'local', ...scanLocalFile(f, terms) });
    }

    // Remote sources from the form
    const remoteUrls = parsed?.remote || [];
    for (const url of remoteUrls) {
        if (verbose) process.stdout.write(`[doc-reviewer] Fetching: ${url} ... `);
        const result = await fetchRemote(url, terms);
        results.sources.push({ type: 'remote', ...result });
        if (verbose) console.log(result.verdict);
    }

    // Manual review flags
    for (const note of (parsed?.manual || [])) {
        results.sources.push({ type: 'manual', note, verdict: 'MANUAL_REVIEW_REQUIRED' });
    }

    // Summary
    const allSources = results.sources;
    results.summary = {
        total: allSources.length,
        likelyUpdated:    allSources.filter(s => s.verdict === 'LIKELY_UPDATED').length,
        partiallyUpdated: allSources.filter(s => s.verdict === 'PARTIALLY_UPDATED').length,
        likelyStale:      allSources.filter(s => s.verdict === 'LIKELY_STALE').length,
        notFound:         allSources.filter(s => ['FILE_NOT_FOUND', 'URL_NOT_FOUND'].includes(s.verdict)).length,
        manualRequired:   allSources.filter(s => s.verdict === 'MANUAL_REVIEW_REQUIRED').length,
        termsSearched:    terms,
        overallVerdict:
            allSources.some(s => s.verdict === 'LIKELY_STALE')      ? 'GAPS_DETECTED' :
            allSources.some(s => s.verdict === 'PARTIALLY_UPDATED') ? 'PARTIALLY_COMPLETE' :
            allSources.some(s => s.verdict === 'MANUAL_REVIEW_REQUIRED') ? 'MANUAL_REVIEW_NEEDED' :
            'LIKELY_COMPLETE'
    };

    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

    if (verbose) {
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║  Documentation Review Report                 ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log(`  Sources checked:       ${results.summary.total}`);
        console.log(`  Likely updated:        ${results.summary.likelyUpdated}`);
        console.log(`  Partially updated:     ${results.summary.partiallyUpdated}`);
        console.log(`  Likely stale:          ${results.summary.likelyStale}`);
        console.log(`  Not found:             ${results.summary.notFound}`);
        console.log(`  Manual review needed:  ${results.summary.manualRequired}`);
        console.log(`  Terms searched:        ${terms.join(', ') || '(none — no diff provided)'}`);
        console.log(`  Overall verdict:       ${results.summary.overallVerdict}`);
        console.log(`  Report: ${outputFile}\n`);
    }

    console.log(`[doc-reviewer] Done. Verdict: ${results.summary.overallVerdict}`);
})();
