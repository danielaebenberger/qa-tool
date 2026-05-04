import type { StabilityClass } from '../../core/contracts/Metrics';

/**
 * Classify a test's stability from its pass/fail history.
 *
 * @param history - Pass/fail results in chronological order, **most recent first**.
 *                  `true` = passed, `false` = failed.
 * @returns A StabilityClass label.
 */
export function classifyStability(history: readonly boolean[]): StabilityClass {
  if (history.length === 0) return 'unknown';

  const failedCount = history.filter((r) => !r).length;
  const passedCount = history.filter((r) => r).length;

  if (failedCount === 0) return 'stable';
  if (passedCount === 0) return 'always-failing';

  // Failed in the most recent run but passed in the one before → new failure
  if (!history[0] && history[1] === true) return 'new-failure';

  // Mixed: at least one pass and one fail → flaky
  return 'flaky';
}
