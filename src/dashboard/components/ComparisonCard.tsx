import type { PeriodComparison } from '../../core/contracts/Dashboard';
import { Card } from './Card';
import styles from './ComparisonCard.module.css';

interface ComparisonCardProps {
  data: PeriodComparison;
  configLabel: string;
}

interface MetricRow {
  label: string;
  current: number;
  previous: number;
  /** When true, lower is better (e.g. failures) */
  inverted?: boolean;
  formatter?: (value: number) => string;
}

function formatDelta(current: number, previous: number, inverted = false): {
  text: string;
  direction: 'up' | 'down' | 'flat';
  good: boolean;
} {
  if (previous === 0 && current === 0) {
    return { text: '–', direction: 'flat', good: true };
  }
  if (previous === 0) {
    return { text: 'new', direction: 'up', good: !inverted };
  }
  const diff = current - previous;
  if (diff === 0) return { text: '±0', direction: 'flat', good: true };
  const pct = Math.round((diff / previous) * 100);
  const direction = diff > 0 ? 'up' : 'down';
  const isImprovement = inverted ? diff < 0 : diff > 0;
  const arrow = direction === 'up' ? '↑' : '↓';
  return {
    text: `${arrow} ${Math.abs(pct)}%`,
    direction,
    good: isImprovement,
  };
}

function fmtNumber(v: number): string {
  return v.toLocaleString();
}

function fmtPct(v: number): string {
  return `${v}%`;
}

export function ComparisonCard({ data, configLabel }: ComparisonCardProps) {
  const rows: MetricRow[] = [
    { label: 'Runs', current: data.current.runs, previous: data.previous.runs, formatter: fmtNumber },
    { label: 'Tests', current: data.current.tests, previous: data.previous.tests, formatter: fmtNumber },
    { label: 'Pass rate', current: data.current.passRate, previous: data.previous.passRate, formatter: fmtPct },
    { label: 'Failed', current: data.current.failed, previous: data.previous.failed, inverted: true, formatter: fmtNumber },
    { label: 'Blocked', current: data.current.blocked, previous: data.previous.blocked, inverted: true, formatter: fmtNumber },
  ];

  return (
    <Card title="Period Comparison" subtitle={configLabel}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.metricCol}>Metric</th>
            <th className={styles.numCol}>Current</th>
            <th className={styles.numCol}>Previous</th>
            <th className={styles.deltaCol}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const delta = formatDelta(row.current, row.previous, row.inverted);
            const fmt = row.formatter ?? fmtNumber;
            return (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className={styles.num}>{fmt(row.current)}</td>
                <td className={`${styles.num} ${styles.muted}`}>{fmt(row.previous)}</td>
                <td className={`${styles.delta} ${delta.good ? styles.good : styles.bad}`}>
                  {delta.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
