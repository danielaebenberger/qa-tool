import type {
  HistoryStatus,
  StabilityLabel,
  WatchedCase,
} from '../../core/contracts/Stability';

const FAILING_STATUSES: ReadonlySet<HistoryStatus> = new Set(['failed', 'blocked', 'retest']);
const RUN_STATUSES: ReadonlySet<HistoryStatus> = new Set([
  'passed',
  'failed',
  'blocked',
  'retest',
]);

function isFailing(status: HistoryStatus): boolean {
  return FAILING_STATUSES.has(status);
}

function isRun(status: HistoryStatus): boolean {
  return RUN_STATUSES.has(status);
}

/** Count how many times the status group flips between pass and fail across the history. */
function countFlips(history: readonly HistoryStatus[]): number {
  let flips = 0;
  let prev: 'pass' | 'fail' | undefined;
  for (const status of history) {
    if (!isRun(status)) continue;
    const group = isFailing(status) ? 'fail' : 'pass';
    if (prev !== undefined && prev !== group) flips += 1;
    prev = group;
  }
  return flips;
}

/** Length of consecutive same-status streak at the start (newest end) of history. */
function streakFromStart(history: readonly HistoryStatus[]): number {
  if (history.length === 0) return 0;
  const head = history[0];
  let n = 0;
  for (const status of history) {
    if (status === head) n += 1;
    else break;
  }
  return n;
}

export interface ClassifyOptions {
  /** True when the most recent run's timestamp is within the last 24 hours. */
  latestRunWithin24h: boolean;
}

/**
 * Build the stability summary for a single watched case.
 *
 * @param history Newest result first. May contain `absent` entries for runs in
 *                which the case wasn't present.
 */
export function buildWatchedCase(
  caseId: number,
  title: string,
  history: readonly HistoryStatus[],
  opts: ClassifyOptions
): WatchedCase {
  const failedCount = history.filter((s) => s === 'failed').length;
  const blockedCount = history.filter((s) => s === 'blocked' || s === 'retest').length;
  const passedCount = history.filter((s) => s === 'passed').length;
  const notRunCount = history.filter((s) => s === 'absent' || s === 'untested').length;

  const runStatuses = history.filter(isRun);
  const failingRuns = runStatuses.filter(isFailing).length;
  const flips = countFlips(history);
  const streak = streakFromStart(history);
  const lastStatus = history.find((s) => s !== 'absent') ?? 'untested';

  const failRateBase = failedCount + blockedCount + passedCount;
  const failRate =
    failRateBase === 0 ? 0 : Math.round(((failedCount + blockedCount) / failRateBase) * 100);

  const label = classifyLabel({
    runStatuses,
    failingRuns,
    flips,
    history,
    latestRunWithin24h: opts.latestRunWithin24h,
  });

  return {
    caseId,
    title,
    label,
    history: [...history],
    failedCount,
    blockedCount,
    passedCount,
    notRunCount,
    flips,
    streak,
    lastStatus,
    failRate,
  };
}

interface ClassifyArgs {
  runStatuses: HistoryStatus[];
  failingRuns: number;
  flips: number;
  history: readonly HistoryStatus[];
  latestRunWithin24h: boolean;
}

function classifyLabel(args: ClassifyArgs): StabilityLabel {
  const { runStatuses, failingRuns, flips, history, latestRunWithin24h } = args;
  if (runStatuses.length === 0) return 'failing';

  // Always-failing: every observed run is failing
  if (failingRuns === runStatuses.length) return 'always';

  // New failure: most recent run was a failure, the one before it was a pass,
  // and the latest run actually happened in the last 24h.
  const lastObserved = history.find((s) => s !== 'absent');
  if (
    latestRunWithin24h &&
    lastObserved &&
    isFailing(lastObserved) &&
    runStatuses.length >= 2 &&
    !isFailing(runStatuses[1])
  ) {
    return 'new-failure';
  }

  // Flaky: at least 2 status flips
  if (flips >= 2) return 'flaky';

  return 'failing';
}
