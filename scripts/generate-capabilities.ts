#!/usr/bin/env -S node --experimental-strip-types
// Regenerates docs/CAPABILITIES.md from the frontmatter of every
// SKILL.md, agent.md, and SENSOR.md file. Never hand-edit CAPABILITIES.md —
// this script is the single source of truth for its content.
// No third-party YAML parser: frontmatter is a flat key: value block,
// optionally with a bracketed list value — uses a simple hand-written parser.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Capability {
  name: string;
  description: string;
  kind: 'skill' | 'agent' | 'sensor';
  pillar: string;
  version: string;
  seeAlso: string[];
}

export function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const block = match[1] as string;
  const result: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1] as string;
    let value = (m[2] as string).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith('[') && value.endsWith(']')) value = value.slice(1, -1).trim();
    result[key] = value;
  }
  return result;
}

function toCapability(frontmatter: Record<string, string>): Capability | null {
  if (!frontmatter.name || !frontmatter.kind || !frontmatter.pillar) return null;
  return {
    name: frontmatter.name,
    description: frontmatter.description ?? '',
    kind: frontmatter.kind as Capability['kind'],
    pillar: frontmatter.pillar,
    version: frontmatter.version ?? '1.0',
    seeAlso: frontmatter.see_also ? frontmatter.see_also.split(',').map((s) => s.trim()).filter(Boolean) : [],
  };
}

function readCapabilityFiles(dir: string, matcher: RegExp): string[] {
  const results: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...readCapabilityFiles(full, matcher));
    else if (matcher.test(entry.name)) results.push(full);
  }
  return results;
}

export function collectCapabilities(rootDir: string): Capability[] {
  const files = [
    ...readCapabilityFiles(join(rootDir, '.claude/skills'), /^SKILL\.md$/),
    ...readCapabilityFiles(join(rootDir, '.claude/agents'), /\.agent\.md$/),
    ...readCapabilityFiles(join(rootDir, 'src/harness/sensors'), /^SENSOR\.md$/),
  ];
  const capabilities: Capability[] = [];
  for (const file of files) {
    const fm = parseFrontmatter(readFileSync(file, 'utf8'));
    if (!fm) continue;
    const cap = toCapability(fm);
    if (cap) capabilities.push(cap);
  }
  return capabilities.sort((a, b) => a.name.localeCompare(b.name));
}

const PILLAR_ORDER = ['ci-insight', 'feature-validation', 'test-case-identification', 'team-motivation', 'harness-engineering'];
const PILLAR_TITLES: Record<string, string> = {
  'ci-insight': 'Pillar 1 — CI Insight',
  'feature-validation': 'Pillar 2 — Feature Validation',
  'test-case-identification': 'Pillar 3 — Test-Case Identification',
  'team-motivation': 'Pillar 4 — Team Motivation',
  'harness-engineering': 'Harness Engineering',
};

export function renderCapabilitiesMarkdown(capabilities: Capability[]): string {
  const lines: string[] = [
    '<!-- GENERATED FILE — do not hand-edit. Run `pnpm capabilities:generate` after adding or changing a skill, agent, or sensor. -->',
    '',
    '# qa-tool capability catalog',
    '',
  ];

  const pillars = [...new Set(capabilities.map((c) => c.pillar))].sort((a, b) => {
    const ai = PILLAR_ORDER.indexOf(a);
    const bi = PILLAR_ORDER.indexOf(b);
    return (ai === -1 ? PILLAR_ORDER.length : ai) - (bi === -1 ? PILLAR_ORDER.length : bi);
  });

  for (const pillar of pillars) {
    lines.push(`## ${PILLAR_TITLES[pillar] ?? pillar}`, '', '| Name | Kind | Description | Version | See also |', '|---|---|---|---|---|');
    for (const cap of capabilities.filter((c) => c.pillar === pillar)) {
      const seeAlso = cap.seeAlso.length ? cap.seeAlso.join(', ') : '—';
      lines.push(`| \`${cap.name}\` | ${cap.kind} | ${cap.description} | ${cap.version} | ${seeAlso} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function runCli(): void {
  const rootDir = process.cwd();
  const capabilities = collectCapabilities(rootDir);
  const markdown = renderCapabilitiesMarkdown(capabilities);
  writeFileSync(join(rootDir, 'docs/CAPABILITIES.md'), markdown);
  console.log(`[generate-capabilities] Wrote docs/CAPABILITIES.md with ${capabilities.length} entries.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
