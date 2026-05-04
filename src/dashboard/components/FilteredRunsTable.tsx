import type { FilteredRun } from '../../core/contracts/Dashboard';
import { Card } from './Card';
import styles from './FilteredRunsTable.module.css';

interface FilteredRunsTableProps {
  rows: FilteredRun[];
}

function formatTimestamp(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FilteredRunsTable({ rows }: FilteredRunsTableProps) {
  return (
    <Card title="Runs (filtered)" subtitle={`${rows.length} run(s)`} flush>
      {rows.length === 0 ? (
        <div className={styles.empty}>No runs match the current filters.</div>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Run</th>
                <th>Config</th>
                <th>When</th>
                <th className={styles.num}>Tests</th>
                <th className={styles.num}>Passed</th>
                <th className={styles.num}>Failed</th>
                <th className={styles.num}>Blocked</th>
                <th className={styles.num}>Pass rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={styles.nameCell}>
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.name}
                      </a>
                    ) : (
                      r.name
                    )}
                  </td>
                  <td>{r.configName}</td>
                  <td className={styles.muted}>{formatTimestamp(r.createdOn)}</td>
                  <td className={styles.num}>{r.totalCount.toLocaleString()}</td>
                  <td className={`${styles.num} ${styles.passed}`}>
                    {r.passedCount.toLocaleString()}
                  </td>
                  <td
                    className={`${styles.num} ${r.failedCount > 0 ? styles.failed : ''}`}
                  >
                    {r.failedCount}
                  </td>
                  <td
                    className={`${styles.num} ${r.blockedCount > 0 ? styles.blocked : ''}`}
                  >
                    {r.blockedCount}
                  </td>
                  <td className={styles.num}>{r.passRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
