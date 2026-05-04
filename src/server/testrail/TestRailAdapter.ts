import { z } from 'zod';
import type { CIProvider } from '../../core/ci/CIProvider';
import { RunSummarySchema, type RunSummary } from '../../core/contracts/RunSummary';
import { TestResultSchema, type TestResult } from '../../core/contracts/TestResult';
import { parseRunName } from './parseRunName';

// TestRail status IDs (standard + some installations use 6+ for custom)
const TR_STATUS = { PASSED: 1, BLOCKED: 2, UNTESTED: 3, RETEST: 4, FAILED: 5 } as const;

function toPassRate(passed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((passed / total) * 100);
}

function mapStatus(statusId: number): TestResult['status'] {
  switch (statusId) {
    case TR_STATUS.PASSED:
      return 'passed';
    case TR_STATUS.BLOCKED:
      return 'blocked';
    case TR_STATUS.FAILED:
      return 'failed';
    case TR_STATUS.RETEST:
      return 'retest';
    default:
      return 'untested';
  }
}

/** Run as returned by TestRail's get_runs endpoint */
const TRRunSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_completed: z.boolean(),
  completed_on: z.number().nullable(),
  passed_count: z.number(),
  failed_count: z.number(),
  blocked_count: z.number(),
  untested_count: z.number(),
  retest_count: z.number(),
  created_on: z.number(),
  url: z.string(),
});

const TRRunsResponseSchema = z.object({
  runs: z.array(TRRunSchema),
  offset: z.number(),
  limit: z.number(),
  size: z.number(),
});

/** Test as returned by TestRail's get_tests endpoint */
const TRTestSchema = z.object({
  id: z.number(),
  case_id: z.number(),
  run_id: z.number(),
  title: z.string(),
  status_id: z.number(),
});

const TRTestsResponseSchema = z.object({
  tests: z.array(TRTestSchema),
  offset: z.number(),
  limit: z.number(),
  size: z.number(),
});

export interface TestRailConfig {
  baseUrl: string;
  username: string;
  /** Plain password for now; replace value with API key later without code changes */
  password: string;
}

export class TestRailAdapter implements CIProvider {
  private readonly authHeader: string;
  private readonly baseUrl: string;

  constructor(config: TestRailConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;
  }

  private async fetchTR<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    params?: Record<string, string | number>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/index.php?/api/v2/${endpoint}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    // TestRail caps the API at 180 requests/minute and returns 429 with a
    // `Retry-After` header (seconds) when exceeded. Honour it transparently.
    const MAX_RETRIES = 5;
    let attempt = 0;
    for (;;) {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 429 && attempt < MAX_RETRIES) {
        const headerWait = parseFloat(res.headers.get('retry-after') ?? '');
        // Exponential backoff fallback if the header is missing/garbage.
        const waitSec = Number.isFinite(headerWait) && headerWait > 0
          ? headerWait
          : Math.min(30, 2 ** attempt);
        await new Promise((r) => setTimeout(r, (waitSec + 0.25) * 1000));
        attempt += 1;
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(
          `TestRail API error ${res.status} ${res.statusText} [${endpoint}]: ${body.slice(0, 200)}`
        );
      }
      const json: unknown = await res.json();
      return schema.parse(json);
    }
  }

  async getRuns(options: { projectId: number; createdAfter?: Date }): Promise<RunSummary[]> {
    const PAGE = 250;
    const results: RunSummary[] = [];
    let offset = 0;

    const params: Record<string, string | number> = { limit: PAGE };
    if (options.createdAfter) {
      params['created_after'] = Math.floor(options.createdAfter.getTime() / 1000);
    }

    for (;;) {
      params['offset'] = offset;
      const page = await this.fetchTR(
        `get_runs/${options.projectId}`,
        TRRunsResponseSchema,
        params
      );

      for (const run of page.runs) {
        const { configName, date } = parseRunName(run.name);
        const total =
          run.passed_count +
          run.failed_count +
          run.blocked_count +
          run.retest_count;
        results.push(
          RunSummarySchema.parse({
            id: run.id,
            name: run.name,
            configName,
            date,
            createdOn: run.created_on,
            completedOn: run.completed_on,
            passedCount: run.passed_count,
            failedCount: run.failed_count,
            blockedCount: run.blocked_count,
            untestedCount: run.untested_count,
            retestCount: run.retest_count,
            totalCount: total,
            passRate: toPassRate(run.passed_count, total),
            isCompleted: run.is_completed,
            url: run.url,
          })
        );
      }

      if (page.runs.length < PAGE) break;
      offset += PAGE;
    }

    return results.sort((a, b) => b.createdOn - a.createdOn);
  }

  async getResultsForRun(runId: number): Promise<TestResult[]> {
    const PAGE = 250;
    const results: TestResult[] = [];
    let offset = 0;

    for (;;) {
      const page = await this.fetchTR(`get_tests/${runId}`, TRTestsResponseSchema, {
        limit: PAGE,
        offset,
      });

      for (const t of page.tests) {
        results.push(
          TestResultSchema.parse({
            testId: t.id,
            caseId: t.case_id,
            runId: t.run_id,
            title: t.title,
            status: mapStatus(t.status_id),
            statusId: t.status_id,
            testedOn: null,
          })
        );
      }

      if (page.tests.length < PAGE) break;
      offset += PAGE;
    }

    return results;
  }
}
