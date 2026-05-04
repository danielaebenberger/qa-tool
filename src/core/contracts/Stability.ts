import { z } from 'zod';

/**
 * Stability classification for a single watched test case.
 *
 *   - new-failure  : passed in the previous run, failed in the most recent one
 *   - always       : failed in every inspected run
 *   - flaky        : ≥2 status flips across the inspected runs
 *   - failing      : failing recently but not always and not flaky enough
 */
export const StabilityLabelSchema = z.enum(['new-failure', 'always', 'flaky', 'failing']);
export type StabilityLabel = z.infer<typeof StabilityLabelSchema>;

/**
 * Per-run outcome for a watched case, newest → oldest.
 * `null` means the case wasn't present in that run.
 */
export const HistoryStatusSchema = z.enum([
  'passed',
  'failed',
  'blocked',
  'retest',
  'untested',
  'absent',
]);
export type HistoryStatus = z.infer<typeof HistoryStatusSchema>;

export const WatchedCaseSchema = z.object({
  caseId: z.number(),
  title: z.string(),
  label: StabilityLabelSchema,
  /** Newest result first */
  history: z.array(HistoryStatusSchema),
  failedCount: z.number(),
  blockedCount: z.number(),
  passedCount: z.number(),
  /** "absent" + "untested" combined */
  notRunCount: z.number(),
  /** Number of status flips (passed↔failed/blocked transitions) across the history */
  flips: z.number(),
  /** Consecutive same-status streak from the most recent result */
  streak: z.number(),
  /** Most recent observed status (excluding absent) */
  lastStatus: HistoryStatusSchema,
  /** failedCount / (failedCount + passedCount) as integer 0-100 */
  failRate: z.number(),
});
export type WatchedCase = z.infer<typeof WatchedCaseSchema>;

export const ConfigStabilityGroupSchema = z.object({
  configName: z.string(),
  runsInspected: z.number(),
  testsWithFailures: z.number(),
  alwaysFailing: z.number(),
  flaky: z.number(),
  newFailures: z.number(),
  cases: z.array(WatchedCaseSchema),
});
export type ConfigStabilityGroup = z.infer<typeof ConfigStabilityGroupSchema>;

export const StabilityOverviewSchema = z.object({
  lastFetched: z.string(),
  windowDays: z.number(),
  /** History depth requested (e.g. last 10 runs per config) */
  historyDepth: z.number(),
  configsWithFailures: z.number(),
  watchedCases: z.number(),
  newFailures24h: z.number(),
  flakyTests: z.number(),
  alwaysFailing: z.number(),
  groups: z.array(ConfigStabilityGroupSchema),
});
export type StabilityOverview = z.infer<typeof StabilityOverviewSchema>;
