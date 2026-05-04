import type { StabilityOverview } from '../../core/contracts/Stability';
import styles from './StabilityKpiStrip.module.css';

interface StabilityKpiStripProps {
  data?: StabilityOverview;
  loading?: boolean;
}

interface KpiProps {
  label: string;
  value: string | number;
  color?: 'danger' | 'warning' | 'flaky' | 'muted';
}

function Kpi({ label, value, color }: KpiProps) {
  const colorClass = color ? styles[color] : '';
  return (
    <div className={styles.kpi} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${colorClass}`}>{value}</span>
    </div>
  );
}

export function StabilityKpiStrip({ data, loading }: StabilityKpiStripProps) {
  if (loading || !data) {
    return (
      <div className={styles.row} aria-busy="true" aria-label="Loading stability KPIs">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <Kpi label="Configs with failures" value={data.configsWithFailures} />
      <Kpi
        label="New failures (24h)"
        value={data.newFailures24h}
        color={data.newFailures24h > 0 ? 'danger' : 'muted'}
      />
      <Kpi label="Flaky tests" value={data.flakyTests} color="flaky" />
      <Kpi label="Always-failing" value={data.alwaysFailing} color="warning" />
      <Kpi label="Watched cases" value={data.watchedCases} />
    </div>
  );
}
