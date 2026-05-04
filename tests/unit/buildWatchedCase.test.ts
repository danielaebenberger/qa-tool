import { describe, expect, it } from 'vitest';
import { buildWatchedCase } from '../../src/server/stability/buildWatchedCase';
import type { HistoryStatus } from '../../src/core/contracts/Stability';

const recent = { latestRunWithin24h: true } as const;
const old = { latestRunWithin24h: false } as const;

const h = (...arr: HistoryStatus[]) => arr;

describe('buildWatchedCase', () => {
  it('labels a never-passing case as always', () => {
    const c = buildWatchedCase(1, 't', h('failed', 'failed', 'failed'), recent);
    expect(c.label).toBe('always');
    expect(c.failRate).toBe(100);
    expect(c.streak).toBe(3);
    expect(c.flips).toBe(0);
  });

  it('treats blocked as failing for the always classification', () => {
    const c = buildWatchedCase(1, 't', h('blocked', 'blocked', 'failed'), recent);
    expect(c.label).toBe('always');
  });

  it('labels a passed→failed transition within 24h as new-failure', () => {
    const c = buildWatchedCase(1, 't', h('failed', 'passed', 'passed'), recent);
    expect(c.label).toBe('new-failure');
  });

  it('does NOT label new-failure when the latest run is older than 24h', () => {
    const c = buildWatchedCase(1, 't', h('failed', 'passed', 'passed'), old);
    expect(c.label).not.toBe('new-failure');
  });

  it('labels ≥2 status flips as flaky', () => {
    const c = buildWatchedCase(
      1,
      't',
      h('passed', 'failed', 'passed', 'failed', 'passed'),
      recent
    );
    expect(c.label).toBe('flaky');
    expect(c.flips).toBe(4);
  });

  it('labels a single recent failure with prior failures as failing (not new)', () => {
    const c = buildWatchedCase(1, 't', h('failed', 'failed', 'passed'), recent);
    expect(c.label).toBe('failing');
  });

  it('counts streak from the most recent end', () => {
    const c = buildWatchedCase(1, 't', h('failed', 'failed', 'passed', 'passed'), recent);
    expect(c.streak).toBe(2);
  });

  it('ignores absent entries when computing run-only metrics', () => {
    const c = buildWatchedCase(1, 't', h('failed', 'absent', 'passed'), recent);
    expect(c.flips).toBe(1);
    expect(c.failRate).toBe(50);
    expect(c.notRunCount).toBe(1);
  });

  it('falls back to failing on insufficient history', () => {
    const c = buildWatchedCase(1, 't', h('absent', 'absent'), recent);
    expect(c.label).toBe('failing');
  });
});
