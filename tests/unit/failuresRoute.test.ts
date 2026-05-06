import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import type { CIProvider } from '../../src/core/ci/CIProvider';
import type { RunSummary } from '../../src/core/contracts/RunSummary';
import type { TestResult } from '../../src/core/contracts/TestResult';
import { failuresRoute } from '../../src/server/routes/failures';
import { LatestFailuresOverviewSchema } from '../../src/core/contracts/Failures';

const now = Math.floor(Date.now() / 1000);
const h = (hours: number) => now - hours * 3600;

function makeRun(partial: Partial<RunSummary> & Pick<RunSummary, 'id' | 'configName'>): RunSummary {
  return {
    name: `AE - ${partial.configName}-run${partial.id ?? ''}`,
    date: '20260506',
    createdOn: h(1),
    completedOn: h(0),
    passedCount: 10,
    failedCount: 0,
    blockedCount: 0,
    untestedCount: 0,
    retestCount: 0,
    totalCount: 10,
    passRate: 100,
    isCompleted: true,
    url: `https://example.testrail.net/runs/view/${partial.id}`,
    ...partial,
  };
}

function makeResult(
  caseId: number,
  status: TestResult['status'],
  runId: number,
  title = `Test ${caseId}`
): TestResult {
  return { testId: caseId * 10, caseId, runId, title, status, statusId: 5, testedOn: null };
}

function makeFakeProvider(
  runs: RunSummary[],
  results: Record<number, TestResult[]>
): CIProvider {
  return {
    getRuns: async () => [...runs].sort((a, b) => b.createdOn - a.createdOn),
    getResultsForRun: async (runId) => results[runId] ?? [],
  };
}

async function callRoute(
  provider: CIProvider,
  query: Record<string, string> = {}
): Promise<ReturnType<typeof LatestFailuresOverviewSchema.parse>> {
  const app = new Hono();
  app.route('/', failuresRoute(provider, 45));
  const params = new URLSearchParams({ projectId: '45', days: '7', history: '5', ...query });
  const req = new Request(`http://localhost/?${params.toString()}`);
  const res = await app.fetch(req);
  const body: unknown = await res.json();
  return LatestFailuresOverviewSchema.parse(body);
}

describe('failuresRoute — empty cases', () => {
  it('returns empty overview when no runs exist', async () => {
    const overview = await callRoute(makeFakeProvider([], {}));
    expect(overview.configsWithFailures).toBe(0);
    expect(overview.totalFailingTests).toBe(0);
    expect(overview.groups).toHaveLength(0);
  });

  it('returns empty when runs exist but all are clean', async () => {
    const run = makeRun({ id: 1, configName: 'alpha', failedCount: 0, passRate: 100 });
    const results = { 1: [makeResult(10, 'passed', 1)] };
    const overview = await callRoute(makeFakeProvider([run], results));
    expect(overview.groups).toHaveLength(0);
  });
});

describe('failuresRoute — new-failure classification', () => {
  it('classifies a test as new-failure when it failed only in the latest run', async () => {
    // run1 = latest (failing), run2 = prior (passing)
    const run1 = makeRun({ id: 1, configName: 'alpha', createdOn: h(1), failedCount: 1, totalCount: 5, passRate: 80 });
    const run2 = makeRun({ id: 2, configName: 'alpha', createdOn: h(25), failedCount: 0, totalCount: 5, passRate: 100 });
    const results: Record<number, TestResult[]> = {
      1: [makeResult(10, 'failed', 1), makeResult(11, 'passed', 1)],
      2: [makeResult(10, 'passed', 2), makeResult(11, 'passed', 2)],
    };
    const overview = await callRoute(makeFakeProvider([run1, run2], results));
    const group = overview.groups[0];
    const item = group.items.find((i) => i.caseId === 10);
    expect(item?.classification).toBe('new-failure');
    expect(item?.consecutiveFailures).toBe(1);
    expect(overview.newFailures).toBe(1);
  });
});

describe('failuresRoute — persistent classification', () => {
  it('classifies a test as persistent when it failed in latest and previous run', async () => {
    const run1 = makeRun({ id: 1, configName: 'alpha', createdOn: h(1), failedCount: 1, totalCount: 5, passRate: 80 });
    const run2 = makeRun({ id: 2, configName: 'alpha', createdOn: h(25), failedCount: 1, totalCount: 5, passRate: 80 });
    const results: Record<number, TestResult[]> = {
      1: [makeResult(10, 'failed', 1)],
      2: [makeResult(10, 'failed', 2)],
    };
    const overview = await callRoute(makeFakeProvider([run1, run2], results));
    const item = overview.groups[0].items.find((i) => i.caseId === 10);
    expect(item?.classification).toBe('persistent');
    expect(item?.consecutiveFailures).toBe(2);
    expect(overview.persistentFailures).toBe(1);
  });

  it('counts a 3-run failure streak correctly', async () => {
    const runs = [
      makeRun({ id: 1, configName: 'alpha', createdOn: h(1), failedCount: 1, totalCount: 5, passRate: 80 }),
      makeRun({ id: 2, configName: 'alpha', createdOn: h(25), failedCount: 1, totalCount: 5, passRate: 80 }),
      makeRun({ id: 3, configName: 'alpha', createdOn: h(49), failedCount: 1, totalCount: 5, passRate: 80 }),
    ];
    const results: Record<number, TestResult[]> = {
      1: [makeResult(10, 'failed', 1)],
      2: [makeResult(10, 'failed', 2)],
      3: [makeResult(10, 'failed', 3)],
    };
    const overview = await callRoute(makeFakeProvider(runs, results));
    const item = overview.groups[0].items.find((i) => i.caseId === 10);
    expect(item?.classification).toBe('persistent');
    expect(item?.consecutiveFailures).toBe(3);
  });
});

describe('failuresRoute — recovering classification', () => {
  it('classifies a test as recovering when it passed in latest after prior failure', async () => {
    // run1 = latest (passing), run2 = prior (failing), run3 = prior (failing)
    const run1 = makeRun({ id: 1, configName: 'alpha', createdOn: h(1), failedCount: 0, totalCount: 5, passRate: 100 });
    const run2 = makeRun({ id: 2, configName: 'alpha', createdOn: h(25), failedCount: 1, totalCount: 5, passRate: 80 });
    const run3 = makeRun({ id: 3, configName: 'alpha', createdOn: h(49), failedCount: 1, totalCount: 5, passRate: 80 });
    const results: Record<number, TestResult[]> = {
      1: [makeResult(10, 'passed', 1)],
      2: [makeResult(10, 'failed', 2)],
      3: [makeResult(10, 'failed', 3)],
    };
    const overview = await callRoute(makeFakeProvider([run1, run2, run3], results));
    const item = overview.groups[0]?.items.find((i) => i.caseId === 10);
    expect(item?.classification).toBe('recovering');
    expect(item?.consecutiveFailures).toBe(2); // 2-run streak that just ended
    expect(overview.recovering).toBe(1);
  });
});

describe('failuresRoute — history and uniqueness', () => {
  it('only uses the most recent run per config', async () => {
    const older = makeRun({ id: 1, configName: 'alpha', createdOn: h(48), failedCount: 3, totalCount: 5, passRate: 40 });
    const newer = makeRun({ id: 2, configName: 'alpha', createdOn: h(2), failedCount: 1, totalCount: 5, passRate: 80 });
    const results: Record<number, TestResult[]> = {
      1: [makeResult(10, 'failed', 1), makeResult(11, 'failed', 1), makeResult(12, 'failed', 1)],
      2: [makeResult(10, 'failed', 2), makeResult(11, 'passed', 2), makeResult(12, 'passed', 2)],
    };
    const overview = await callRoute(makeFakeProvider([older, newer], results));
    // Only case 10 is failing in the latest run
    const failing = overview.groups[0].items.filter(
      (i) => i.classification === 'new-failure' || i.classification === 'persistent'
    );
    expect(failing).toHaveLength(1);
    expect(failing[0].caseId).toBe(10);
  });

  it('counts unique failing caseIds across configs (not counting recovering)', async () => {
    // caseId 10 failing in both configs → 1 unique failing case
    // caseId 20 recovering in one config → not counted
    const runA = makeRun({ id: 1, configName: 'alpha', failedCount: 1, totalCount: 5, passRate: 80 });
    const runB = makeRun({ id: 2, configName: 'beta', createdOn: h(2), failedCount: 1, totalCount: 5, passRate: 80 });
    const runC = makeRun({ id: 3, configName: 'gamma', createdOn: h(3), failedCount: 0, totalCount: 5, passRate: 100 });
    const runCold = makeRun({ id: 4, configName: 'gamma', createdOn: h(27), failedCount: 1, totalCount: 5, passRate: 80 });
    const results: Record<number, TestResult[]> = {
      1: [makeResult(10, 'failed', 1)],
      2: [makeResult(10, 'failed', 2)],
      3: [makeResult(20, 'passed', 3)],
      4: [makeResult(20, 'failed', 4)],
    };
    const overview = await callRoute(makeFakeProvider([runA, runB, runC, runCold], results));
    expect(overview.uniqueFailingCases).toBe(1); // only caseId 10
    expect(overview.totalFailingTests).toBe(2);  // alpha + beta, each has caseId 10 failing
  });

  it('sorts groups by descending currently-failing count', async () => {
    const runA = makeRun({ id: 1, configName: 'alpha', failedCount: 1, totalCount: 5, passRate: 80 });
    const runB = makeRun({ id: 2, configName: 'beta', createdOn: h(2), failedCount: 3, totalCount: 5, passRate: 40 });
    const results: Record<number, TestResult[]> = {
      1: [makeResult(10, 'failed', 1)],
      2: [makeResult(20, 'failed', 2), makeResult(21, 'failed', 2), makeResult(22, 'failed', 2)],
    };
    const overview = await callRoute(makeFakeProvider([runA, runB], results));
    expect(overview.groups[0].configName).toBe('beta');
  });
});
