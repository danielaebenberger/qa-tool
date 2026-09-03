#!/usr/bin/env -S node --experimental-strip-types
/**
 * Doc Reviewer Sensor — QA Harness Pillar D.
 *
 * Scans local documentation for mentions of feature-specific terms; fetches
 * publicly-accessible remote sources (Academy/Confluence-style) for the
 * same. Auth-gated remote sources are flagged for manual review, never
 * treated as evidence.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { get as httpsGet } from 'node:https';
import { fileURLToPath } from 'node:url';

export function extractTermsFromDiff(diffPath: string | null, featureSlug?: string): string[] {
  const terms = new Set<string>();

  if (diffPath && existsSync(diffPath)) {
    const diff = readFileSync(diffPath, 'utf8');
    const added = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));

    const i18nRe = /"([a-zA-Z][a-zA-Z0-9_.]+)":\s*"([^"]+)"/g;
    for (const line of added) {
      for (const m of line.matchAll(i18nRe)) {
        const value = m[2] as string;
        if (value.length > 2 && value.length < 60) terms.add(value);
      }
    }
    const selRe = /data-sel-role=["']([^"']+)["']/g;
    for (const line of added) for (const m of line.matchAll(selRe)) terms.add(m[1] as string);

    const btnRe = /buttonLabel[^"']*['"]([^"']+)['"]/g;
    for (const line of added) for (const m of line.matchAll(btnRe)) terms.add(m[1] as string);
  }

  if (featureSlug) terms.add(featureSlug);

  return [...terms].filter((t) => t.length > 2);
}

export type DocVerdict = 'LIKELY_UPDATED' | 'PARTIALLY_UPDATED' | 'LIKELY_STALE' | 'EXISTS_NO_TERMS' | 'FILE_NOT_FOUND';

export interface LocalDocScanResult {
  exists: boolean;
  path: string;
  absolutePath?: string;
  lineCount?: number;
  lastModified?: string;
  hasVersionRef?: boolean;
  hasTodoMarker?: boolean;
  termsFound: string[];
  termsMissing: string[];
  coveragePercent?: number;
  verdict: DocVerdict;
}

export function scanLocalFile(filePath: string, terms: string[], repoRoot: string): LocalDocScanResult {
  const absPath = resolve(repoRoot, filePath);
  if (!existsSync(absPath)) {
    return { exists: false, path: filePath, termsFound: [], termsMissing: terms, verdict: 'FILE_NOT_FOUND' };
  }
  const content = readFileSync(absPath, 'utf8').toLowerCase();
  const termsFound = terms.filter((t) => content.includes(t.toLowerCase()));
  const termsMissing = terms.filter((t) => !content.includes(t.toLowerCase()));

  const hasVersionRef = /\d+\.\d+\.\d+/.test(content);
  const hasTodoMarker = /\bTODO\b|\bFIXME\b|\bXXX\b/.test(content);
  const lineCount = content.split('\n').length;
  const lastModified = statSync(absPath).mtime.toISOString().split('T')[0] as string;
  const coverage = terms.length > 0 ? Math.round((termsFound.length / terms.length) * 100) : 100;

  const verdict: DocVerdict = terms.length === 0 ? 'EXISTS_NO_TERMS' : coverage >= 80 ? 'LIKELY_UPDATED' : coverage >= 40 ? 'PARTIALLY_UPDATED' : 'LIKELY_STALE';

  return { exists: true, path: filePath, absolutePath: absPath, lineCount, lastModified, hasVersionRef, hasTodoMarker, termsFound, termsMissing, coveragePercent: coverage, verdict };
}

export interface RemoteDocScanResult {
  url: string;
  accessible: boolean;
  reason?: string;
  termsFound?: string[];
  termsMissing?: string[];
  coveragePercent?: number;
  verdict: string;
}

export function fetchRemote(url: string, terms: string[], timeoutMs = 8000): Promise<RemoteDocScanResult> {
  return new Promise((resolvePromise) => {
    const req = httpsGet(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        resolvePromise({ url, accessible: false, reason: 'AUTH_REQUIRED', verdict: 'MANUAL_REVIEW_REQUIRED' });
        return;
      }
      if (res.statusCode === 404) {
        resolvePromise({ url, accessible: false, reason: 'NOT_FOUND', verdict: 'URL_NOT_FOUND' });
        return;
      }
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => {
        const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
        const termsFound = terms.filter((t) => text.includes(t.toLowerCase()));
        const termsMissing = terms.filter((t) => !text.includes(t.toLowerCase()));
        const coverage = terms.length > 0 ? Math.round((termsFound.length / terms.length) * 100) : 100;
        resolvePromise({
          url,
          accessible: true,
          termsFound,
          termsMissing,
          coveragePercent: coverage,
          verdict: coverage >= 80 ? 'LIKELY_UPDATED' : coverage >= 40 ? 'PARTIALLY_UPDATED' : 'LIKELY_STALE',
        });
      });
    });
    req.on('error', (err) => resolvePromise({ url, accessible: false, reason: err.message, verdict: 'FETCH_ERROR' }));
    req.on('timeout', () => { req.destroy(); resolvePromise({ url, accessible: false, reason: 'TIMEOUT', verdict: 'FETCH_ERROR' }); });
  });
}

export interface ParsedSources {
  local: string[];
  remote: string[];
  manual: string[];
  rawContent: string;
}

export function parseSourcesForm(filePath: string | null): ParsedSources | null {
  if (!filePath || !existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf8');
  const sources: ParsedSources = { local: [], remote: [], manual: [], rawContent: content };

  const rowRe = /\|\s*\*\*[^|]+\*\*\s*\|\s*([^|]+)\s*\|/g;
  for (const m of content.matchAll(rowRe)) {
    const val = (m[1] as string).trim();
    if (val.startsWith('http')) sources.remote.push(val);
    else if (/\.(md|txt|graphql|yaml|yml|json)$/.test(val)) sources.local.push(val);
    else if (val.toLowerCase().includes('n/a') || val.toLowerCase().includes('none')) { /* skip */ }
    else if (val.toLowerCase().includes('manual') || val.toLowerCase().includes('login')) sources.manual.push(val);
  }
  return sources;
}

const STANDARD_LOCAL = ['README.md', 'CHANGELOG.md', 'MIGRATION.md'];

async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  const getArg = (f: string, d: string | null): string | null => {
    const i = args.indexOf(f);
    return i !== -1 ? (args[i + 1] ?? d) : d;
  };
  const hasFlag = (f: string): boolean => args.includes(f);

  const sourcesFile = getArg('--sources', null);
  const featureSlug = getArg('--feature', '') as string;
  const diffFile = getArg('--diff', null);
  const repoRoot = getArg('--repo-root', '.') as string;
  const outputFile = getArg('--output', 'doc-review-raw.json') as string;
  const verbose = hasFlag('--verbose');

  const terms = extractTermsFromDiff(diffFile, featureSlug);
  const parsed = parseSourcesForm(sourcesFile);
  const results: { meta: unknown; sources: Array<Record<string, unknown>>; summary?: Record<string, unknown> } = {
    meta: { generatedAt: new Date().toISOString(), featureSlug, terms },
    sources: [],
  };

  const localFiles = [...new Set([...STANDARD_LOCAL, ...(parsed?.local ?? [])])];
  for (const f of localFiles) {
    results.sources.push({ type: 'local', ...scanLocalFile(f, terms, repoRoot) });
  }

  for (const url of parsed?.remote ?? []) {
    if (verbose) process.stdout.write(`[doc-reviewer] Fetching: ${url} ... `);
    const result = await fetchRemote(url, terms);
    results.sources.push({ type: 'remote', ...result });
    if (verbose) console.log(result.verdict);
  }

  for (const note of parsed?.manual ?? []) {
    results.sources.push({ type: 'manual', note, verdict: 'MANUAL_REVIEW_REQUIRED' });
  }

  const allSources = results.sources;
  results.summary = {
    total: allSources.length,
    likelyUpdated: allSources.filter((s) => s.verdict === 'LIKELY_UPDATED').length,
    partiallyUpdated: allSources.filter((s) => s.verdict === 'PARTIALLY_UPDATED').length,
    likelyStale: allSources.filter((s) => s.verdict === 'LIKELY_STALE').length,
    notFound: allSources.filter((s) => ['FILE_NOT_FOUND', 'URL_NOT_FOUND'].includes(s.verdict as string)).length,
    manualRequired: allSources.filter((s) => s.verdict === 'MANUAL_REVIEW_REQUIRED').length,
    termsSearched: terms,
    overallVerdict: allSources.some((s) => s.verdict === 'LIKELY_STALE')
      ? 'GAPS_DETECTED'
      : allSources.some((s) => s.verdict === 'PARTIALLY_UPDATED')
        ? 'PARTIALLY_COMPLETE'
        : allSources.some((s) => s.verdict === 'MANUAL_REVIEW_REQUIRED')
          ? 'MANUAL_REVIEW_NEEDED'
          : 'LIKELY_COMPLETE',
  };

  writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`[doc-reviewer] Done. Verdict: ${(results.summary as { overallVerdict: string }).overallVerdict}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
