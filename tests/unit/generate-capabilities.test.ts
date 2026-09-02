// tests/unit/generate-capabilities.test.ts
import { describe, it, expect } from 'vitest';
import { parseFrontmatter, renderCapabilitiesMarkdown, type Capability } from '../../scripts/generate-capabilities';

describe('parseFrontmatter', () => {
  it('parses simple key: value pairs and bracketed lists', () => {
    const content = [
      '---',
      'name: qa-tldr',
      'description: "Digest a ticket fast."',
      'kind: skill',
      'pillar: test-case-identification',
      'version: "1.0"',
      'see_also: [qa-bug-brief, qa-define-testcases]',
      '---',
      '',
      '# Body',
    ].join('\n');
    const fm = parseFrontmatter(content);
    expect(fm).toEqual({
      name: 'qa-tldr',
      description: 'Digest a ticket fast.',
      kind: 'skill',
      pillar: 'test-case-identification',
      version: '1.0',
      see_also: 'qa-bug-brief, qa-define-testcases',
    });
  });

  it('returns null when there is no frontmatter block', () => {
    expect(parseFrontmatter('# Just a heading\n\nNo frontmatter here.')).toBeNull();
  });
});

describe('renderCapabilitiesMarkdown', () => {
  it('groups capabilities by pillar into a markdown table', () => {
    const capabilities: Capability[] = [
      { name: 'qa-tldr', description: 'Digest a ticket fast.', kind: 'skill', pillar: 'test-case-identification', version: '1.0', seeAlso: [] },
      { name: 'qa-run', description: 'Runs the full pipeline.', kind: 'skill', pillar: 'feature-validation', version: '1.0', seeAlso: [] },
    ];
    const md = renderCapabilitiesMarkdown(capabilities);
    expect(md).toContain('## Pillar 2 — Feature Validation');
    expect(md).toContain('## Pillar 3 — Test-Case Identification');
    expect(md).toContain('qa-tldr');
    expect(md).toContain('qa-run');
  });
});
