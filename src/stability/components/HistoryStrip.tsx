import type { HistoryStatus } from '../../core/contracts/Stability';
import styles from './HistoryStrip.module.css';

interface HistoryStripProps {
  history: readonly HistoryStatus[];
}

const META: Record<
  HistoryStatus,
  { letter: string; className: string; label: string }
> = {
  passed: { letter: 'P', className: styles.passed, label: 'Passed' },
  failed: { letter: 'F', className: styles.failed, label: 'Failed' },
  blocked: { letter: 'B', className: styles.blocked, label: 'Blocked' },
  retest: { letter: 'R', className: styles.retest, label: 'Retest' },
  untested: { letter: 'N', className: styles.absent, label: 'Untested' },
  absent: { letter: '·', className: styles.absent, label: 'Not in run' },
};

export function HistoryStrip({ history }: HistoryStripProps) {
  return (
    <div className={styles.row} role="img" aria-label="Run history, newest first">
      {history.map((status, i) => {
        const m = META[status];
        return (
          <span
            key={i}
            className={`${styles.cell} ${m.className}`}
            title={`${m.label} (run ${i + 1})`}
            aria-hidden="true"
          >
            {m.letter}
          </span>
        );
      })}
    </div>
  );
}
