import type { ConfigBreakdownRow } from '../../core/contracts/Dashboard';
import { useFilters } from '../filters/FiltersContext';
import { Card } from './Card';
import styles from './ConfigBreakdownTable.module.css';

interface ConfigBreakdownTableProps {
  rows: ConfigBreakdownRow[];
  windowLabel: string;
}

export function ConfigBreakdownTable({ rows, windowLabel }: ConfigBreakdownTableProps) {
  const { filters, setConfig } = useFilters();
  const activeConfig = filters.config;

  const handleRowClick = (configName: string) => {
    // Toggle: clicking the active row clears the filter.
    setConfig(activeConfig === configName ? '' : configName);
  };

  return (
    <Card title="Per Config-File Breakdown" subtitle={windowLabel} flush>
      {rows.length === 0 ? (
        <div className={styles.empty}>No data.</div>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Config</th>
                <th className={styles.num}>Runs</th>
                <th className={styles.num}>Tests</th>
                <th className={styles.num}>Passed</th>
                <th className={styles.num}>Failed</th>
                <th className={styles.num}>Blocked</th>
                <th className={styles.num}>Pass rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isActive = activeConfig === row.configName;
                return (
                  <tr
                    key={row.configName}
                    className={`${styles.row} ${isActive ? styles.rowActive : ''}`}
                    onClick={() => handleRowClick(row.configName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(row.configName);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isActive}
                    aria-label={`Filter dashboard by ${row.configName}`}
                  >
                    <td className={styles.configCell}>{row.configName}</td>
                    <td className={styles.num}>{row.runs}</td>
                    <td className={styles.num}>{row.tests.toLocaleString()}</td>
                    <td className={`${styles.num} ${styles.passed}`}>
                      {row.passed.toLocaleString()}
                    </td>
                    <td
                      className={`${styles.num} ${row.failed > 0 ? styles.failed : ''}`}
                    >
                      {row.failed}
                    </td>
                    <td
                      className={`${styles.num} ${row.blocked > 0 ? styles.blocked : ''}`}
                    >
                      {row.blocked}
                    </td>
                    <td className={styles.num}>{row.passRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
