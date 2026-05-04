import { Hono } from 'hono';
import type { CIProvider } from '../../core/ci/CIProvider';
import type { RunSummary } from '../../core/contracts/RunSummary';
import type { TestResult } from '../../core/contracts/TestResult';
import type { NewFailureItem, TopFailingItem } from '../../core/contracts/Metrics';
import {
  Failures24hResponseSchema,
  TopFailingResponseSchema,
} from '../../core/contracts/Metrics';
import { withConcurrency } from '../testrail/concurrency';

export function metricsRoute(provider: CIProvider, defaultProjectId: number) {
  const app = new Hono();

  /**
   * GET /api/metrics/failures-24h?projectId=45
   *
   * Classifies failures from runs created in the last 24 hours as:
   * - new:       failed in a recent run, but NOT in the immediately preceding run of the same config
   * - recurring: failed in a recent run AND in the preceding run of the same config
   */
  app.get('/failures-24h', async (c) => {
    const projectId = parseInt(c.req.query('projectId') ?? String(defaultProjectId), 10);
    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Fetch enough history to find "prior" runs for comparison
    const allRuns = await provider.getRuns({ projectId, createdAfter: thirtyDaysAgo });

    const recent24h = allRuns.filter((r) => r.createdOn * 1000 > oneDayAgo.getTime());
    const older = allRuns.filter((r) => r.createdOn * 1000 <= oneDayAgo.getTime());

    if (recent24h.length === 0) {
      return c.json(
        Failures24hResponseSchema.parse({
          lastFetched: new Date().toISOString(),
          newFailures: 0,
          recurringFailures: 0,
          total: 0,
          topNew: [],
        })
      );
    }

    // Most recent prior run per config name
    const priorByConfig = new Map<string, RunSummary>();
    for (const run of older) {
      if (!priorByConfig.has(run.configName)) {
        priorByConfig.set(run.configName, run);
      }
    }

    // Fetch results for recent runs that have failures
    const recentWithFailures = recent24h.filter((r) => r.failedCount > 0);
    const recentResultsList = await withConcurrency(
      recentWithFailures.map((run) => () => provider.getResultsForRun(run.id))
    );
    const recentResultsByRunId = new Map<number, TestResult[]>();
    recentWithFailures.forEach((run, i) => {
      recentResultsByRunId.set(run.id, recentResultsList[i]);
    });

    // Fetch results for the prior runs we'll compare against
    const priorRunsNeeded = [
      ...new Set(
        recentWithFailures
          .map((r) => priorByConfig.get(r.configName))
          .filter((r): r is RunSummary => r !== undefined)
      ),
    ];
    const priorResultsList = await withConcurrency(
      priorRunsNeeded.map((run) => () => provider.getResultsForRun(run.id))
    );
    const priorFailedCasesByRunId = new Map<number, Set<number>>();
    priorRunsNeeded.forEach((run, i) => {
      const failedCaseIds = new Set(
        priorResultsList[i].filter((r) => r.status === 'failed').map((r) => r.caseId)
      );
      priorFailedCasesByRunId.set(run.id, failedCaseIds);
    });

    let newCount = 0;
    let recurringCount = 0;
    const topNew: NewFailureItem[] = [];

    for (const run of recentWithFailures) {
      const results = recentResultsByRunId.get(run.id) ?? [];
      const priorRun = priorByConfig.get(run.configName);
      const priorFailedCases = priorRun
        ? (priorFailedCasesByRunId.get(priorRun.id) ?? new Set<number>())
        : new Set<number>();

      for (const r of results.filter((r) => r.status === 'failed')) {
        if (priorFailedCases.has(r.caseId)) {
          recurringCount++;
        } else {
          newCount++;
          if (topNew.length < 20) {
            topNew.push({ caseId: r.caseId, title: r.title, runName: run.name, runId: run.id });
          }
        }
      }
    }

    return c.json(
      Failures24hResponseSchema.parse({
        lastFetched: new Date().toISOString(),
        newFailures: newCount,
        recurringFailures: recurringCount,
        total: newCount + recurringCount,
        topNew,
      })
    );
  });

  /**
   * GET /api/metrics/top-failing?projectId=45&limit=10&days=7
   *
   * Returns the test cases with the most failures across runs in the window.
   */
  app.get('/top-failing', async (c) => {
    const projectId = parseInt(c.req.query('projectId') ?? String(defaultProjectId), 10);
    const limit = Math.min(parseInt(c.req.query('limit') ?? '10', 10), 50);
    const days = parseInt(c.req.query('days') ?? '7', 10);

    const createdAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const runs = await provider.getRuns({ projectId, createdAfter });
    const runsWithFailures = runs.filter((r) => r.failedCount > 0);

    const allResultsList = await withConcurrency(
      runsWithFailures.map((run) => () => provider.getResultsForRun(run.id))
    );

    // Aggregate: case_id → { title, failureCount, distinct run ids }
    const caseMap = new Map<
      number,
      { title: string; failureCount: number; runIds: Set<number> }
    >();

    allResultsList.forEach((results) => {
      for (const r of results.filter((r) => r.status === 'failed')) {
        const entry = caseMap.get(r.caseId) ?? {
          title: r.title,
          failureCount: 0,
          runIds: new Set<number>(),
        };
        entry.failureCount++;
        entry.runIds.add(r.runId);
        caseMap.set(r.caseId, entry);
      }
    });

    const totalRuns = runsWithFailures.length;
    const items: TopFailingItem[] = [...caseMap.entries()]
      .sort(([, a], [, b]) => b.failureCount - a.failureCount)
      .slice(0, limit)
      .map(([caseId, data]) => ({
        caseId,
        title: data.title,
        failureCount: data.failureCount,
        runCount: data.runIds.size,
        failureRate: totalRuns > 0 ? Math.round((data.runIds.size / totalRuns) * 100) : 0,
      }));

    return c.json(
      TopFailingResponseSchema.parse({
        lastFetched: new Date().toISOString(),
        windowDays: days,
        items,
      })
    );
  });

  return app;
}
