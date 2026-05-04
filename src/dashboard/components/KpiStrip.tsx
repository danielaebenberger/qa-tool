import type { Kpis } from '../../core/contracts/Dashboard';
import styles from './KpiStrip.module.css';

interface KpiStripProps {
  kpis?: Kpis;
  loading?: boolean;
}

interface KpiProps {
  label: string;
  value: string | number;
  hint?: string;
  unit?: string;
  color?: 'success' | 'danger' | 'warning' | 'info';
}

function Kpi({ label, value, hint, unit, color }: KpiProps) {
  const colorClass = color
    ? styles[`color${color.charAt(0).toUpperCase()}${color.slice(1)}`]
    : '';
  return (
    <div className={styles.kpi} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${colorClass}`}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}

export function KpiStrip({ kpis, loading }: KpiStripProps) {
  if (loading || !kpis) {
    return (
      <div className={styles.skeletonRow} aria-busy="true" aria-label="Loading KPIs">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  const passColor =
    kpis.passRate >= 99 ? 'success' : kpis.passRate >= 90 ? 'warning' : 'danger';

  return (
    <div className={styles.row}>
      <Kpi
        label="Runs (last 24h)"
        value={kpis.runsLast24h}
        hint={`${kpis.testsLast24h.toLocaleString()} tests · rolling 24 hours`}
      />
      <Kpi label="Pass rate" value={`${kpis.passRate}%`} color={passColor} />
      <Kpi
        label="Failing tests"
        value={kpis.failingTests}
        color={kpis.failingTests > 0 ? 'danger' : 'success'}
        hint={`across ${kpis.runsLast24h} run(s)`}
      />
      <Kpi
        label="Blocked tests"
        value={kpis.blockedTests}
        color={kpis.blockedTests > 0 ? 'warning' : 'success'}
      />
      <Kpi
        label="Passed tests"
        value={kpis.passedTests.toLocaleString()}
        color="success"
      />
    </div>
  );
}
