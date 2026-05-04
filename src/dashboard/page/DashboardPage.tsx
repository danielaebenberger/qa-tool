import { useQueryClient } from '@tanstack/react-query';
import { useFilters } from '../filters/FiltersContext';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { FilterBar } from '../components/FilterBar';
import { KpiStrip } from '../components/KpiStrip';
import { TrendCard } from '../components/TrendCard';
import { ComparisonCard } from '../components/ComparisonCard';
import { Failing24hCard } from '../components/Failing24hCard';
import { PassRateByConfigCard } from '../components/PassRateByConfigCard';
import { ConfigBreakdownTable } from '../components/ConfigBreakdownTable';
import { FilteredRunsTable } from '../components/FilteredRunsTable';
import { navigate } from '../../routing/navigate';
import styles from './DashboardPage.module.css';

const PROJECT_ID = 45;

function describeWindow(days: number, from?: string, to?: string): string {
  if (from || to) {
    return `${from ?? '…'} → ${to ?? 'now'}`;
  }
  if (days === 1) return 'Today';
  return `Last ${days} days`;
}

export function DashboardPage() {
  const { filters } = useFilters();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, isFetching } = useDashboardQuery();

  const windowLabel = describeWindow(filters.days, filters.from, filters.to);
  const configLabel = filters.config || 'All configs';

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['failures-24h'] });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>QA Dashboard — CI Test Results</h1>
          <p className={styles.subtitle}>
            Project {PROJECT_ID}
            {data && (
              <>
                {' '}· refreshed {new Date(data.lastFetched).toLocaleTimeString()} · lookback{' '}
                {data.windowDays}d
              </>
            )}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => navigate('/stability')}
            className={styles.linkBtn}
          >
            Test Stability →
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={isFetching}
            className={styles.refreshBtn}
          >
            {isFetching ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
      </header>

      <FilterBar configs={data?.configs ?? []} />

      {isError && (
        <div className={styles.errorBanner} role="alert">
          {error instanceof Error ? error.message : 'Failed to load dashboard.'}
        </div>
      )}

      <KpiStrip kpis={data?.kpis} loading={isLoading} />

      {data && (
        <>
          <div className={styles.gridTwoCol}>
            <TrendCard data={data.trend} />
            <ComparisonCard data={data.comparison} configLabel={configLabel} />
          </div>

          <div className={styles.gridTwoCol}>
            <Failing24hCard />
            <PassRateByConfigCard rows={data.byConfig} windowLabel={windowLabel} />
          </div>

          <ConfigBreakdownTable rows={data.byConfig} windowLabel={windowLabel} />

          <FilteredRunsTable rows={data.runs} />
        </>
      )}

      {isLoading && !data && (
        <div className={styles.loadingHint}>Loading dashboard data…</div>
      )}
    </div>
  );
}
