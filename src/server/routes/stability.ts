import { Hono } from 'hono';
import type { CIProvider } from '../../core/ci/CIProvider';
import type { RunSummary } from '../../core/contracts/RunSummary';
import type { TestResult } from '../../core/contracts/TestResult';
import {
  StabilityOverviewSchema,
  type ConfigStabilityGroup,
  type HistoryStatus,
  type WatchedCase,
} from '../../core/contracts/Stability';
import { withConcurrency } from '../testrail/concurrency';
import { buildWatchedCase } from '../stability/buildWatchedCase';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function statusToHistory(status: TestResult['status']): HistoryStatus {
  return status;
}

export function stabilityRoute(provider: CIProvider, defaultProjectId: number) {
  const app = new Hono();

  // Cache results for completed runs forever (within process lifetime).
  // A completed TestRail run's outcomes never change, so this is safe and
  // makes subsequent refreshes essentially free for runs we've seen before.
  const completedRunCache = new Map<number, TestResult[]>();

  /**
   * GET /api/stability?projectId=45&days=30&history=10
   *
   * Pulls the latest `history` runs per config (within `days` lookback) and
   * builds a per-case stability picture for every case that failed at least
   * once in that window.
   */
  app.get('/', async (c) => {
    const projectId = parseInt(c.req.query('projectId') ?? String(defaultProjectId), 10);
    // Default lookback is 10 days: nightly pipelines should produce far more
    // than `historyDepth` runs in that window, so a wider window only burns
    // through TestRail's rate limit without changing the picture.
    const days = Math.max(1, parseInt(c.req.query('days') ?? '10', 10));
    const historyDepth = Math.max(1, Math.min(50, parseInt(c.req.query('history') ?? '10', 10)));

    const since = new Date(Date.now() - days * TWENTY_FOUR_HOURS_MS);
    const allRuns = await provider.getRuns({ projectId, createdAfter: since });

    // Group runs by config (newest first within each group)
    const runsByConfig = new Map<string, RunSummary[]>();
    for (const r of allRuns) {
      const list = runsByConfig.get(r.configName) ?? [];
      list.push(r);
      runsByConfig.set(r.configName, list);
    }
    for (const list of runsByConfig.values()) {
      list.sort((a, b) => b.createdOn - a.createdOn);
    }

    // Keep only configs that have at least one run with failed/blocked > 0
    const candidateConfigs: Array<{ configName: string; runs: RunSummary[] }> = [];
    for (const [configName, list] of runsByConfig) {
      const trimmed = list.slice(0, historyDepth);
      const hasFailures = trimmed.some(
        (r) => r.failedCount > 0 || r.blockedCount > 0 || r.retestCount > 0
      );
      if (hasFailures) candidateConfigs.push({ configName, runs: trimmed });
    }

    // Fetch results for every selected run with bounded concurrency.
    // Completed runs are cached, so refreshing the page only re-fetches the
    // newest in-progress run per config.
    const fetchTasks: Array<() => Promise<{ runId: number; results: TestResult[] }>> = [];
    for (const { runs } of candidateConfigs) {
      for (const run of runs) {
        const cached = completedRunCache.get(run.id);
        if (cached) {
          fetchTasks.push(async () => ({ runId: run.id, results: cached }));
          continue;
        }
        fetchTasks.push(async () => {
          const results = await provider.getResultsForRun(run.id);
          if (run.isCompleted) completedRunCache.set(run.id, results);
          return { runId: run.id, results };
        });
      }
    }
    const fetched = await withConcurrency(fetchTasks, 4);
    const resultsByRun = new Map<number, TestResult[]>();
    for (const { runId, results } of fetched) resultsByRun.set(runId, results);

    const groups: ConfigStabilityGroup[] = [];
    let totalWatched = 0;
    let totalNewFailures = 0;
    let totalFlaky = 0;
    let totalAlways = 0;

    for (const { configName, runs } of candidateConfigs) {
      const latestRunWithin24h =
        runs.length > 0 && Date.now() - runs[0].createdOn * 1000 <= TWENTY_FOUR_HOURS_MS;

      // Build map: caseId -> { title, history[runIndex] }
      const caseHistories = new Map<number, { title: string; history: HistoryStatus[] }>();

      runs.forEach((run, runIndex) => {
        const results = resultsByRun.get(run.id) ?? [];
        for (const r of results) {
          let entry = caseHistories.get(r.caseId);
          if (!entry) {
            entry = { title: r.title, history: new Array(runs.length).fill('absent') };
            caseHistories.set(r.caseId, entry);
          }
          entry.history[runIndex] = statusToHistory(r.status);
        }
      });

      const cases: WatchedCase[] = [];
      for (const [caseId, { title, history }] of caseHistories) {
        const hasFailure = history.some(
          (s) => s === 'failed' || s === 'blocked' || s === 'retest'
        );
        if (!hasFailure) continue;
        cases.push(buildWatchedCase(caseId, title, history, { latestRunWithin24h }));
      }

      // Sort: always-failing → flaky → new-failure → failing, then by failRate desc
      const labelRank: Record<WatchedCase['label'], number> = {
        always: 0,
        flaky: 1,
        'new-failure': 2,
        failing: 3,
      };
      cases.sort((a, b) => {
        const rank = labelRank[a.label] - labelRank[b.label];
        if (rank !== 0) return rank;
        return b.failRate - a.failRate;
      });

      const alwaysFailing = cases.filter((c) => c.label === 'always').length;
      const flaky = cases.filter((c) => c.label === 'flaky').length;
      const newFailures = cases.filter((c) => c.label === 'new-failure').length;

      totalWatched += cases.length;
      totalAlways += alwaysFailing;
      totalFlaky += flaky;
      totalNewFailures += newFailures;

      groups.push({
        configName,
        runsInspected: runs.length,
        testsWithFailures: cases.length,
        alwaysFailing,
        flaky,
        newFailures,
        cases,
      });
    }

    // Sort groups by total watched cases desc (busiest configs first)
    groups.sort((a, b) => b.testsWithFailures - a.testsWithFailures);

    return c.json(
      StabilityOverviewSchema.parse({
        lastFetched: new Date().toISOString(),
        windowDays: days,
        historyDepth,
        configsWithFailures: groups.length,
        watchedCases: totalWatched,
        newFailures24h: totalNewFailures,
        flakyTests: totalFlaky,
        alwaysFailing: totalAlways,
        groups,
      })
    );
  });

  return app;
}
