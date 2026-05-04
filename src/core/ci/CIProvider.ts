import type { RunSummary } from '../contracts/RunSummary';
import type { TestResult } from '../contracts/TestResult';

export interface CIProvider {
  /**
   * Return runs for a project, optionally filtered to those created after a given date.
   * Results should be sorted newest-first.
   */
  getRuns(options: { projectId: number; createdAfter?: Date }): Promise<RunSummary[]>;

  /**
   * Return the final status of every test in a run.
   * (Uses TestRail's "get_tests" endpoint, not "get_results_for_run".)
   */
  getResultsForRun(runId: number): Promise<TestResult[]>;
}
