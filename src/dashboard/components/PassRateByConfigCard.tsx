import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ConfigBreakdownRow } from '../../core/contracts/Dashboard';
import { Card } from './Card';
import styles from './PassRateByConfigCard.module.css';

interface PassRateByConfigCardProps {
  rows: ConfigBreakdownRow[];
  windowLabel: string;
}

type SeriesKey = 'failed' | 'blocked' | 'passed';

interface SeriesDef {
  key: SeriesKey;
  label: string;
  color: string;
}

const SERIES: SeriesDef[] = [
  { key: 'failed', label: 'Failed', color: 'var(--color-danger)' },
  { key: 'blocked', label: 'Blocked', color: 'var(--color-warning)' },
  { key: 'passed', label: 'Passed', color: 'var(--color-success)' },
];

const ROW_HEIGHT = 28;
const CHART_VERTICAL_PAD = 70;

export function PassRateByConfigCard({ rows, windowLabel }: PassRateByConfigCardProps) {
  // Track which series the user has toggled OFF via the legend.
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  const data = useMemo(
    () =>
      rows
        .map((r) => ({
          configName: r.configName,
          failed: r.failed,
          blocked: r.blocked,
          passed: r.passed,
          passRate: r.passRate,
          runs: r.runs,
          tests: r.tests,
        }))
        // Largest workloads first so the busiest configs sit at the top of the
        // chart, mirroring how readers scan a vertical bar chart.
        .sort((a, b) => b.tests - a.tests),
    [rows]
  );

  const toggleSeries = (key: SeriesKey) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <Card title="Pass Rate by Config File" subtitle={windowLabel}>
        <div className={styles.empty}>No runs in this window.</div>
      </Card>
    );
  }

  const chartHeight = Math.max(220, rows.length * ROW_HEIGHT + CHART_VERTICAL_PAD);

  return (
    <Card title="Pass Rate by Config File" subtitle={windowLabel}>
      <div className={styles.scroll}>
        <div className={styles.chartWrap} style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            barCategoryGap={6}
          >
            <CartesianGrid stroke="var(--color-border)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="configName"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              width={220}
              interval={0}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                fontSize: 12,
              }}
              cursor={{ fill: 'var(--color-surface-hover)', opacity: 0.4 }}
              formatter={(value: number, name) => [value.toLocaleString(), name]}
            />
            <Legend
              verticalAlign="top"
              align="center"
              wrapperStyle={{ fontSize: 12, paddingBottom: 8, cursor: 'pointer' }}
              iconType="square"
              onClick={(item) => toggleSeries(item.dataKey as SeriesKey)}
              payload={SERIES.map((s) => ({
                value: s.label,
                type: 'square',
                id: s.key,
                dataKey: s.key,
                color: s.color,
                inactive: hidden.has(s.key),
              }))}
            />
            {SERIES.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="counts"
                fill={s.color}
                hide={hidden.has(s.key)}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
      <p className={styles.hint}>Click a series in the legend to show or hide it.</p>
    </Card>
  );
}
