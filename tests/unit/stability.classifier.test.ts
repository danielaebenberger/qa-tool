import { describe, it, expect } from 'vitest';
import { classifyStability } from '../../src/dashboard/stability/classifier';

describe('classifyStability', () => {
  it('returns "unknown" for an empty history', () => {
    expect(classifyStability([])).toBe('unknown');
  });

  it('returns "stable" when the test passed in every run', () => {
    expect(classifyStability([true, true, true, true])).toBe('stable');
  });

  it('returns "always-failing" when the test failed in every run', () => {
    expect(classifyStability([false, false, false])).toBe('always-failing');
  });

  it('returns "new-failure" when the test failed only in the most recent run', () => {
    // history[0] is most recent → fail, previous → pass
    expect(classifyStability([false, true, true])).toBe('new-failure');
  });

  it('returns "new-failure" with exactly two entries when most recent failed', () => {
    expect(classifyStability([false, true])).toBe('new-failure');
  });

  it('returns "flaky" when the test alternates pass and fail', () => {
    expect(classifyStability([true, false, true, false])).toBe('flaky');
  });

  it('returns "flaky" when most recent failed but so did others before (not all)', () => {
    // fail, fail, pass — not "always-failing", not "new-failure" (prior also failed)
    expect(classifyStability([false, false, true])).toBe('flaky');
  });

  it('handles a single passing run', () => {
    expect(classifyStability([true])).toBe('stable');
  });

  it('handles a single failing run', () => {
    expect(classifyStability([false])).toBe('always-failing');
  });
});
