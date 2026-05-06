import type { LatestFailuresOverview } from '../../core/contracts/Failures';
import styles from './FailuresKpiStrip.module.css';

interface FailuresKpiStripProps {
  data?: LatestFailuresOverview;
  loading?: boolean;
}

interface KpiProps {
  label: string;
  value: string | number;
  color?: 'danger' | 'warning' | 'persistent' | 'success' | 'muted';
  sub?: string;
}

function Kpi({ label, value, color, sub }: KpiProps) {
  const colorClass = color ? styles[color] : '';
  return (
    <div className={styles.kpi} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${colorClass}`}>{value}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </div>
  );
}

export function FailuresKpiStrip({ data, loading }: FailuresKpiStripProps) {
  if (loading || !data) {
    return (
      <div className={styles.row} aria-busy="true" aria-label="Loading failures KPIs">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <Kpi
        label="New failures"
        value={data.newFailures}
        color={data.newFailures > 0 ? 'danger' : 'muted'}
        sub="failed in latest, green before"
      />
      <Kpi
        label="Persistent failures"
        value={data.persistentFailures}
        color={data.persistentFailures > 0 ? 'persistent' : 'muted'}
        sub="failing in consecutive runs"
      />
      <Kpi
        label="Currently failing"
        value={data.totalFailingTests}
        color={data.totalFailingTests > 0 ? 'warning' : 'muted'}
        sub={`${data.uniqueFailingCases} unique cases`}
      />
      <Kpi
        label="Recovering"
        value={data.recovering}
        color={data.recovering > 0 ? 'success' : 'muted'}
        sub="passing now, was failing"
      />
      <Kpi
        label="Configs with failures"
        value={data.configsWithFailures}
      />
    </div>
  );
}

