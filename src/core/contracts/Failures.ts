import { z } from 'zod';

/**
 * How a test case relates to the most recent run of a config.
 *
 *   new-failure  — failed in the latest run; was passing (or absent) in all
 *                  prior inspected runs
 *   persistent   — failed in the latest run AND in ≥1 consecutive previous run
 *   recovering   — passing in the latest run, but had ≥1 consecutive failure
 *                  streak immediately before it
 */
export const FailureClassificationSchema = z.enum([
  'new-failure',
  'persistent',
  'recovering',
]);
export type FailureClassification = z.infer<typeof FailureClassificationSchema>;

/** Per-run status for a test case in the failures history (newest → oldest). */
export const FailureHistoryStatusSchema = z.enum([
  'passed',
  'failed',
  'blocked',
  'retest',
  'absent', // case not present in that run
]);
export type FailureHistoryStatus = z.infer<typeof FailureHistoryStatusSchema>;

export const LatestFailureItemSchema = z.object({
  caseId: z.number(),
  title: z.string(),
  /** Status in the most recent run (= recentHistory[0]) */
  latestStatus: z.enum(['failed', 'blocked', 'retest', 'passed']),
  classification: FailureClassificationSchema,
  /**
   * Per-run history, newest first, across the last historyDepth runs.
   * 'absent' means the case was not present in that run.
   */
  recentHistory: z.array(FailureHistoryStatusSchema),
  /**
   * For new-failure / persistent: consecutive failing runs ending at (and
   * including) the latest run.
   * For recovering: the length of the failure streak that just ended.
   */
  consecutiveFailures: z.number(),
  /** ID / name / URL of the latest run for this config */
  runId: z.number(),
  runName: z.string(),
  configName: z.string(),
  runCreatedOn: z.number(),
  runUrl: z.string(),
});
export type LatestFailureItem = z.infer<typeof LatestFailureItemSchema>;

export const ConfigFailureGroupSchema = z.object({
  configName: z.string(),
  /** Latest run info */
  runId: z.number(),
  runName: z.string(),
  runCreatedOn: z.number(),
  runUrl: z.string(),
  passRate: z.number(),
  failedCount: z.number(),
  blockedCount: z.number(),
  retestCount: z.number(),
  totalCount: z.number(),
  /** How many runs were inspected to build history */
  historyDepth: z.number(),
  /** Per-classification counts for quick scanning */
  newFailures: z.number(),
  persistentFailures: z.number(),
  recovering: z.number(),
  items: z.array(LatestFailureItemSchema),
});
export type ConfigFailureGroup = z.infer<typeof ConfigFailureGroupSchema>;

export const LatestFailuresOverviewSchema = z.object({
  lastFetched: z.string(),
  historyDepth: z.number(),
  /** Configs that have new-failure or persistent items */
  configsWithFailures: z.number(),
  /** Total new-failure + persistent items across all configs */
  totalFailingTests: z.number(),
  /** Distinct caseIds currently failing (new-failure + persistent) */
  uniqueFailingCases: z.number(),
  newFailures: z.number(),
  persistentFailures: z.number(),
  recovering: z.number(),
  groups: z.array(ConfigFailureGroupSchema),
});
export type LatestFailuresOverview = z.infer<typeof LatestFailuresOverviewSchema>;
