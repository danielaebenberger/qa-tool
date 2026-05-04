import type { CIProvider } from './CIProvider';
import type { RunSummary } from '../contracts/RunSummary';
import type { TestResult } from '../contracts/TestResult';

const now = Math.floor(Date.now() / 1000);
const h = (hours: number) => now - hours * 3600;

const FAKE_RUNS: RunSummary[] = [
  {
    id: 1001,
    name: 'AE - acmespace-20260428',
    configName: 'acmespace',
    date: '20260428',
    createdOn: h(2),
    completedOn: h(1),
    passedCount: 145,
    failedCount: 8,
    blockedCount: 2,
    untestedCount: 0,
    retestCount: 1,
    totalCount: 156,
    passRate: 93,
    isCompleted: true,
    url: 'https://jahia.testrail.net/index.php?/runs/view/1001',
  },
  {
    id: 1002,
    name: 'AE - cluster-20260428',
    configName: 'cluster',
    date: '20260428',
    createdOn: h(3),
    completedOn: h(2),
    passedCount: 200,
    failedCount: 3,
    blockedCount: 0,
    untestedCount: 0,
    retestCount: 0,
    totalCount: 203,
    passRate: 99,
    isCompleted: true,
    url: 'https://jahia.testrail.net/index.php?/runs/view/1002',
  },
  {
    id: 1003,
    name: 'AE - standalone-20260427',
    configName: 'standalone',
    date: '20260427',
    createdOn: h(26),
    completedOn: h(25),
    passedCount: 180,
    failedCount: 15,
    blockedCount: 5,
    untestedCount: 0,
    retestCount: 2,
    totalCount: 202,
    passRate: 89,
    isCompleted: true,
    url: 'https://jahia.testrail.net/index.php?/runs/view/1003',
  },
  {
    id: 1004,
    name: 'AE - acmespace-20260427',
    configName: 'acmespace',
    date: '20260427',
    createdOn: h(27),
    completedOn: h(26),
    passedCount: 148,
    failedCount: 5,
    blockedCount: 2,
    untestedCount: 0,
    retestCount: 0,
    totalCount: 155,
    passRate: 95,
    isCompleted: true,
    url: 'https://jahia.testrail.net/index.php?/runs/view/1004',
  },
];

const FAKE_RESULTS: Record<number, TestResult[]> = {
  1001: [
    { testId: 5001, caseId: 101, runId: 1001, title: 'Login with valid credentials', status: 'passed', statusId: 1, testedOn: h(1) },
    { testId: 5002, caseId: 102, runId: 1001, title: 'Content creation in Default workspace', status: 'failed', statusId: 5, testedOn: h(1) },
    { testId: 5003, caseId: 103, runId: 1001, title: 'Module deployment via API', status: 'failed', statusId: 5, testedOn: h(1) },
    { testId: 5004, caseId: 104, runId: 1001, title: 'Search returns correct results', status: 'passed', statusId: 1, testedOn: h(1) },
    { testId: 5005, caseId: 105, runId: 1001, title: 'User permission inheritance', status: 'failed', statusId: 5, testedOn: h(1) },
  ],
  1002: [
    { testId: 6001, caseId: 201, runId: 1002, title: 'Cluster node sync', status: 'passed', statusId: 1, testedOn: h(2) },
    { testId: 6002, caseId: 102, runId: 1002, title: 'Content creation in Default workspace', status: 'failed', statusId: 5, testedOn: h(2) },
    { testId: 6003, caseId: 202, runId: 1002, title: 'Cache invalidation on update', status: 'passed', statusId: 1, testedOn: h(2) },
  ],
  1003: [
    { testId: 7001, caseId: 102, runId: 1003, title: 'Content creation in Default workspace', status: 'passed', statusId: 1, testedOn: h(25) },
    { testId: 7002, caseId: 301, runId: 1003, title: 'Workflow approval step', status: 'failed', statusId: 5, testedOn: h(25) },
    { testId: 7003, caseId: 302, runId: 1003, title: 'Publication to live workspace', status: 'failed', statusId: 5, testedOn: h(25) },
  ],
  1004: [
    { testId: 8001, caseId: 102, runId: 1004, title: 'Content creation in Default workspace', status: 'passed', statusId: 1, testedOn: h(26) },
    { testId: 8002, caseId: 103, runId: 1004, title: 'Module deployment via API', status: 'failed', statusId: 5, testedOn: h(26) },
    { testId: 8003, caseId: 105, runId: 1004, title: 'User permission inheritance', status: 'passed', statusId: 1, testedOn: h(26) },
  ],
};

export class FakeCIProvider implements CIProvider {
  async getRuns(options: { projectId: number; createdAfter?: Date }): Promise<RunSummary[]> {
    let runs = [...FAKE_RUNS];
    if (options.createdAfter) {
      const cutoffSec = options.createdAfter.getTime() / 1000;
      runs = runs.filter((r) => r.createdOn >= cutoffSec);
    }
    return runs.sort((a, b) => b.createdOn - a.createdOn);
  }

  async getResultsForRun(runId: number): Promise<TestResult[]> {
    return FAKE_RESULTS[runId] ?? [];
  }
}
