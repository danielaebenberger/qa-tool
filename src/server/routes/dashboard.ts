import { Hono } from 'hono';
import type { CIProvider } from '../../core/ci/CIProvider';
import type { RunSummary } from '../../core/contracts/RunSummary';
import {
  DashboardOverviewSchema,
  type ConfigBreakdownRow,
  type FilteredRun,
  type Kpis,
  type PeriodTotals,
  type TrendPoint,
} from '../../core/contracts/Dashboard';

function isoDate(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}

function passRateOf(passed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((passed / total) * 10000) / 100; // 2 decimals
}

function totalsFromRuns(runs: RunSummary[]): PeriodTotals {
  let passed = 0,
    failed = 0,
    blocked = 0;
  for (const r of runs) {
    passed += r.passedCount;
    failed += r.failedCount;
    blocked += r.blockedCount;
  }
  const tests = passed + failed + blocked;
  return {
    runs: runs.length,
    tests,
    passed,
    failed,
    blocked,
    passRate: passRateOf(passed, tests),
  };
}

export function dashboardRoute(provider: CIProvider, defaultProjectId: number) {
  const app = new Hono();

  /**
   * GET /api/dashboard?projectId=45&days=30&from=YYYY-MM-DD&to=YYYY-MM-DD&config=NAME
   *
   * Returns the consolidated overview used by the dashboard UI.
   * - `days` is used when `from`/`to` are absent.
   * - `config` filters only the runs / breakdown / filtered list.
   * - KPIs always describe the rolling last-24-hours window across all configs.
   * - Trend always uses the resolved [from, to] window and respects the config filter.
   * - Comparison: current = [from, to]; previous = same length immediately before.
   */
  app.get('/', async (c) => {
    const projectId = parseInt(c.req.query('projectId') ?? String(defaultProjectId), 10);
    const days = Math.max(1, parseInt(c.req.query('days') ?? '30', 10));
    const configFilter = c.req.query('config') ?? '';
    const fromQ = c.req.query('from');
    const toQ = c.req.query('to');

    const now = Date.now();
    const to = toQ ? new Date(`${toQ}T23:59:59Z`).getTime() : now;
    const from = fromQ
      ? new Date(`${fromQ}T00:00:00Z`).getTime()
      : now - days * 24 * 60 * 60 * 1000;
    const windowMs = to - from;
    const previousFrom = from - windowMs;

    // Need to fetch enough history to cover [previousFrom, to]
    const fetchFrom = new Date(previousFrom);
    const allRunsRaw = await provider.getRuns({ projectId, createdAfter: fetchFrom });

    const inCurrent = (r: RunSummary) =>
      r.createdOn * 1000 >= from && r.createdOn * 1000 <= to;
    const inPrevious = (r: RunSummary) =>
      r.createdOn * 1000 >= previousFrom && r.createdOn * 1000 < from;

    const matchesConfig = (r: RunSummary) => !configFilter || r.configName === configFilter;

    const currentRuns = allRunsRaw.filter(inCurrent);
    const previousRuns = allRunsRaw.filter(inPrevious);
    const currentRunsScoped = currentRuns.filter(matchesConfig);
    const previousRunsScoped = previousRuns.filter(matchesConfig);

    const allConfigs = [
      ...new Set(allRunsRaw.map((r) => r.configName).filter(Boolean)),
    ].sort();

    // KPIs: rolling last 24h, NOT scoped to from/to or config (always project-wide)
    const last24hRuns = allRunsRaw.filter((r) => r.createdOn * 1000 >= now - 24 * 60 * 60 * 1000);
    const last24hTotals = totalsFromRuns(last24hRuns);
    const kpis: Kpis = {
      runsLast24h: last24hTotals.runs,
      testsLast24h: last24hTotals.tests,
      passRate: last24hTotals.passRate,
      failingTests: last24hTotals.failed,
      blockedTests: last24hTotals.blocked,
      passedTests: last24hTotals.passed,
    };

    // Trend: per-day failed + blocked across the [from, to] window, with config filter
    const trendMap = new Map<string, TrendPoint>();
    for (let day = from; day <= to; day += 24 * 60 * 60 * 1000) {
      const key = new Date(day).toISOString().slice(0, 10);
      trendMap.set(key, { date: key, failed: 0, blocked: 0, passed: 0, runs: 0 });
    }
    for (const r of currentRunsScoped) {
      const key = isoDate(r.createdOn);
      const point = trendMap.get(key);
      if (!point) continue;
      point.failed += r.failedCount;
      point.blocked += r.blockedCount;
      point.passed += r.passedCount;
      point.runs += 1;
    }
    const trend = [...trendMap.values()].sort((a, b) => (a.date < b.date ? -1 : 1));

    // Comparison
    const comparison = {
      current: totalsFromRuns(currentRunsScoped),
      previous: totalsFromRuns(previousRunsScoped),
    };

    // Per-config breakdown across the [from, to] window (ignores config filter on purpose
    // — the table is the place to compare configs against each other)
    const byConfigMap = new Map<string, RunSummary[]>();
    for (const r of currentRuns) {
      const list = byConfigMap.get(r.configName) ?? [];
      list.push(r);
      byConfigMap.set(r.configName, list);
    }
    const byConfig: ConfigBreakdownRow[] = [...byConfigMap.entries()]
      .map(([configName, runs]) => {
        const t = totalsFromRuns(runs);
        return {
          configName: configName || '(unknown)',
          runs: t.runs,
          tests: t.tests,
          passed: t.passed,
          failed: t.failed,
          blocked: t.blocked,
          passRate: t.passRate,
        };
      })
      .sort((a, b) => a.passRate - b.passRate); // worst pass rate first

    // Filtered runs table (newest first)
    const runs: FilteredRun[] = currentRunsScoped
      .slice()
      .sort((a, b) => b.createdOn - a.createdOn)
      .map((r) => ({
        id: r.id,
        name: r.name,
        configName: r.configName,
        createdOn: r.createdOn,
        passedCount: r.passedCount,
        failedCount: r.failedCount,
        blockedCount: r.blockedCount,
        totalCount: r.totalCount,
        passRate: r.passRate,
        url: r.url,
      }));

    return c.json(
      DashboardOverviewSchema.parse({
        lastFetched: new Date().toISOString(),
        windowDays: Math.round(windowMs / (24 * 60 * 60 * 1000)),
        configs: allConfigs,
        kpis,
        trend,
        comparison,
        byConfig,
        runs,
      })
    );
  });

  return app;
}
