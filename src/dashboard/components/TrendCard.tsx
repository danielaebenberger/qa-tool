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
import type { TrendPoint } from '../../core/contracts/Dashboard';
import { Card } from './Card';
import styles from './TrendCard.module.css';

interface TrendCardProps {
  data: TrendPoint[];
}

function formatTick(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export function TrendCard({ data }: TrendCardProps) {
  const isEmpty = data.length === 0 || data.every((p) => p.failed === 0 && p.blocked === 0);
  const range = data.length
    ? `${data[0].date} → ${data[data.length - 1].date}`
    : '';

  return (
    <Card title="Failures & Blocks Trend" subtitle={range}>
      {isEmpty ? (
        <div className={styles.empty}>No failures or blocks in this window. ✓</div>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickFormatter={formatTick}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelFormatter={formatTick}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
              <Bar dataKey="failed" stackId="a" fill="var(--color-danger)" name="Failed" />
              <Bar dataKey="blocked" stackId="a" fill="var(--color-warning)" name="Blocked" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
