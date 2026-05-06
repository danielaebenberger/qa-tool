import { Hono } from 'hono';
import type { CIProvider } from '../../core/ci/CIProvider';
import type { RunSummary } from '../../core/contracts/RunSummary';
import type { TestResult } from '../../core/contracts/TestResult';
import {
  LatestFailuresOverviewSchema,
  type ConfigFailureGroup,
  type FailureClassification,
  type FailureHistoryStatus,
  type LatestFailureItem,
} from '../../core/contracts/Failures';
import { withConcurrency } from '../testrail/concurrency';

const FAILING_STATUSES = new Set<string>(['failed', 'blocked', 'retest']);

function isFailing(s: string): boolean {
  return FAILING_STATUSES.has(s);
}

/** Resolve the status of a test in a run. Returns 'absent' if not present. */
function resolveStatus(
  resultsByRun: Map<number, Map<number, TestResult>>,
  runId: number,
  caseId: number
): FailureHistoryStatus {
  const byCase = resultsByRun.get(runId);
  if (!byCase) return 'absent';
  const result = byCase.get(caseId);
  if (!result) return 'absent';
  const s = result.status;
  if (s === 'passed' || s === 'failed' || s === 'blocked' || s === 'retest') return s;
  return 'absent';
}

/**
 * Count consecutive failing runs from the start of `history` (skipping absent).
 * Returns the streak length.
 */
function consecutiveFailureStreak(history: readonly FailureHistoryStatus[]): number {
  let count = 0;
  for (const s of history) {
    if (s === 'absent') continue; // absent doesn't break or count the streak
    if (isFailing(s)) count++;
    else break;
  }
  return count;
}

/**
 * Count consecutive failing runs starting from history[1] (skipping absent).
 * Used to determine prior streak when classifying.
 */
function priorFailureStreak(history: readonly FailureHistoryStatus[]): number {
  return consecutiveFailureStreak(history.slice(1));
}

function classify(
  latestStatus: 'failed' | 'blocked' | 'retest' | 'passed',
  history: readonly FailureHistoryStatus[],
): FailureClassification | null {
  if (isFailing(latestStatus)) {
    const priorStreak = priorFailureStreak(history);
    return priorStreak >= 1 ? 'persistent' : 'new-failure';
  }
  if (latestStatus === 'passed') {
    const priorStreak = priorFailureStreak(history);
    return priorStreak >= 1 ? 'recovering' : null;
  }
  return null;
}

export function failuresRoute(provider: CIProvider, defaultProjectId: number) {
  // Cache completed-run results to avoid re-fetching across requests
  const completedRunCache = new Map<number, Map<number, TestResult>>();

  function cacheRun(run: RunSummary, results: TestResult[]): Map<number, TestResult> {
    const byCase = new Map<number, TestResult>(results.map((r) => [r.caseId, r]));
    if (run.isCompleted) completedRunCache.set(run.id, byCase);
    return byCase;
  }

  const app = new Hono();

  /**
   * GET /api/failures?projectId=45&days=7&history=5
   *
   * For each config, inspects the last `history` runs (within `days` lookback).
   * Classifies every test case that was recently involved in a failure as:
   *   - new-failure : failed in latest run, was green/absent before
   *   - persistent  : failed in latest run AND in ≥1 consecutive prior run
   *   - recovering  : passing in latest run, had ≥1 consecutive prior failure
   *
   * `days` defaults to 7 to cover configs that don't run every day.
   * `history` defaults to 5 runs per config.
   */
  app.get('/', async (c) => {
    const projectId = parseInt(c.req.query('projectId') ?? String(defaultProjectId), 10);
    const days = Math.max(1, parseInt(c.req.query('days') ?? '7', 10));
    const historyDepth = Math.max(2, Math.min(10, parseInt(c.req.query('history') ?? '5', 10)));

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const allRuns = await provider.getRuns({ projectId, createdAfter: since });

    // Group runs by config, newest first, keep only the last historyDepth per config
    const runsByConfig = new Map<string, RunSummary[]>();
    for (const run of allRuns) {
      const list = runsByConfig.get(run.configName) ?? [];
      list.push(run);
      runsByConfig.set(run.configName, list);
    }
    for (const [key, list] of runsByConfig) {
      list.sort((a, b) => b.createdOn - a.createdOn);
      runsByConfig.set(key, list.slice(0, historyDepth));
    }

    // Only inspect configs where at least one run had failures
    const candidateConfigs: Array<{ configName: string; runs: RunSummary[] }> = [];
    for (const [configName, runs] of runsByConfig) {
      const hasAnyFailure = runs.some(
        (r) => r.failedCount > 0 || r.blockedCount > 0 || r.retestCount > 0
      );
      if (hasAnyFailure) candidateConfigs.push({ configName, runs });
    }

    if (candidateConfigs.length === 0) {
      return c.json(
        LatestFailuresOverviewSchema.parse({
          lastFetched: new Date().toISOString(),
          historyDepth,
          configsWithFailures: 0,
          totalFailingTests: 0,
          uniqueFailingCases: 0,
          newFailures: 0,
          persistentFailures: 0,
          recovering: 0,
          groups: [],
        })
      );
    }

    // Fetch results for every run across all candidate configs
    const fetchTasks: Array<() => Promise<{ run: RunSummary; byCase: Map<number, TestResult> }>> =
      [];
    for (const { runs } of candidateConfigs) {
      for (const run of runs) {
        const cached = completedRunCache.get(run.id);
        if (cached) {
          fetchTasks.push(async () => ({ run, byCase: cached }));
        } else {
          fetchTasks.push(async () => {
            const results = await provider.getResultsForRun(run.id);
            return { run, byCase: cacheRun(run, results) };
          });
        }
      }
    }
    const fetched = await withConcurrency(fetchTasks, 4);

    // Index: runId → Map<caseId, TestResult>
    const resultsByRun = new Map<number, Map<number, TestResult>>();
    for (const { run, byCase } of fetched) resultsByRun.set(run.id, byCase);

    const groups: ConfigFailureGroup[] = [];
    let totalNewFailures = 0;
    let totalPersistent = 0;
    let totalRecovering = 0;
    let totalCurrentlyFailing = 0;
    const allFailingCaseIds = new Set<number>();

    for (const { configName, runs } of candidateConfigs) {
      const latestRun = runs[0];

      // Collect all caseIds seen across any run in the history window
      const allCaseIds = new Set<number>();
      for (const run of runs) {
        const byCase = resultsByRun.get(run.id);
        if (!byCase) continue;
        for (const caseId of byCase.keys()) allCaseIds.add(caseId);
      }

      const items: LatestFailureItem[] = [];

      for (const caseId of allCaseIds) {
        // Build history array: newest first across all inspected runs
        const recentHistory: FailureHistoryStatus[] = runs.map((run) =>
          resolveStatus(resultsByRun, run.id, caseId)
        );

        // The latest status is the first non-absent entry
        const firstReal = recentHistory.find((s) => s !== 'absent');
        if (!firstReal) continue;

        const latestStatus = firstReal as 'failed' | 'blocked' | 'retest' | 'passed';

        const classification = classify(latestStatus, recentHistory);
        if (!classification) continue;

        const consecutive =
          classification === 'recovering'
            ? priorFailureStreak(recentHistory)
            : consecutiveFailureStreak(recentHistory);

        // Find the title from the most recent run that has this case
        const title =
          runs
            .map((r) => resultsByRun.get(r.id)?.get(caseId)?.title)
            .find(Boolean) ?? `Case ${caseId}`;

        items.push({
          caseId,
          title,
          latestStatus,
          classification,
          recentHistory,
          consecutiveFailures: consecutive,
          runId: latestRun.id,
          runName: latestRun.name,
          configName,
          runCreatedOn: latestRun.createdOn,
          runUrl: latestRun.url,
        });
      }

      if (items.length === 0) continue;

      // Sort: new-failure first, then persistent (longest streak first), then recovering
      items.sort((a, b) => {
        const order = { 'new-failure': 0, persistent: 1, recovering: 2 };
        const co = order[a.classification] - order[b.classification];
        if (co !== 0) return co;
        return b.consecutiveFailures - a.consecutiveFailures;
      });

      const newCount = items.filter((i) => i.classification === 'new-failure').length;
      const persistentCount = items.filter((i) => i.classification === 'persistent').length;
      const recoveringCount = items.filter((i) => i.classification === 'recovering').length;

      totalNewFailures += newCount;
      totalPersistent += persistentCount;
      totalRecovering += recoveringCount;
      totalCurrentlyFailing += newCount + persistentCount;

      for (const item of items) {
        if (item.classification !== 'recovering') allFailingCaseIds.add(item.caseId);
      }

      groups.push({
        configName,
        runId: latestRun.id,
        runName: latestRun.name,
        runCreatedOn: latestRun.createdOn,
        runUrl: latestRun.url,
        passRate: latestRun.passRate,
        failedCount: latestRun.failedCount,
        blockedCount: latestRun.blockedCount,
        retestCount: latestRun.retestCount,
        totalCount: latestRun.totalCount,
        historyDepth: runs.length,
        newFailures: newCount,
        persistentFailures: persistentCount,
        recovering: recoveringCount,
        items,
      });
    }

    // Sort groups: most currently-failing tests first
    groups.sort(
      (a, b) =>
        b.newFailures + b.persistentFailures - (a.newFailures + a.persistentFailures)
    );

    return c.json(
      LatestFailuresOverviewSchema.parse({
        lastFetched: new Date().toISOString(),
        historyDepth,
        configsWithFailures: groups.filter(
          (g) => g.newFailures + g.persistentFailures > 0
        ).length,
        totalFailingTests: totalCurrentlyFailing,
        uniqueFailingCases: allFailingCaseIds.size,
        newFailures: totalNewFailures,
        persistentFailures: totalPersistent,
        recovering: totalRecovering,
        groups,
      })
    );
  });

  return app;
}


