import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLatestFailures } from '../../api/client';
import type { FailureClassification } from '../../core/contracts/Failures';
import { FailuresKpiStrip } from '../components/FailuresKpiStrip';
import { ConfigFailureCard } from '../components/ConfigFailureCard';
import { FailingTestsTable } from '../components/FailingTestsTable';
import { navigate } from '../../routing/navigate';
import styles from './FailuresPage.module.css';

const PROJECT_ID = 45;
const DAYS_OPTIONS = [1, 3, 7] as const;
type Days = (typeof DAYS_OPTIONS)[number];

type ClassFilter = 'all' | FailureClassification;

const CLASS_FILTER_OPTIONS: Array<{ value: ClassFilter; label: string; title: string }> = [
  { value: 'all', label: 'All', title: 'Show all classifications' },
  { value: 'new-failure', label: 'New failures', title: 'Failed in latest run, green before' },
  { value: 'persistent', label: 'Persistent', title: 'Failing in consecutive runs including latest' },
  { value: 'recovering', label: 'Recovering', title: 'Passing now, was failing before' },
];

export function FailuresPage() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState<Days>(3);
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['failures', PROJECT_ID, days],
    queryFn: () => fetchLatestFailures({ projectId: PROJECT_ID, days }),
    staleTime: Infinity,
  });

  const allItems = useMemo(() => data?.groups.flatMap((g) => g.items) ?? [], [data]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['failures'] });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Latest Failures</h1>
          <p className={styles.subtitle}>
            Most recent run per config · lookback {days}d
            {data && (
              <> · {data.historyDepth} runs inspected per config · refreshed{' '}
              {new Date(data.lastFetched).toLocaleTimeString()}</>
            )}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.linkBtn} onClick={() => navigate('/')}>
            ← Dashboard
          </button>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate('/stability')}
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

      <div className={styles.filterRow}>
        <div className={styles.filterBar} role="group" aria-label="Lookback window">
          <span className={styles.filterLabel}>Lookback:</span>
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.filterChip} ${days === d ? styles.filterChipActive : ''}`}
              onClick={() => setDays(d)}
              aria-pressed={days === d}
            >
              {d === 1 ? 'Today' : `Last ${d} days`}
            </button>
          ))}
        </div>

        <div className={styles.filterBar} role="group" aria-label="Classification filter">
          <span className={styles.filterLabel}>Show:</span>
          {CLASS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.title}
              className={`${styles.filterChip} ${styles[`chip-${opt.value}`] ?? ''} ${classFilter === opt.value ? styles.filterChipActive : ''}`}
              onClick={() => setClassFilter(opt.value)}
              aria-pressed={classFilter === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className={styles.errorBanner} role="alert">
          {error instanceof Error ? error.message : 'Failed to load failures.'}
        </div>
      )}

      <FailuresKpiStrip data={data} loading={isLoading} />

      {data && data.groups.length === 0 && (
        <div className={styles.emptyState} role="status">
          <p>No failures found in the last {days} day{days !== 1 ? 's' : ''}. All green!</p>
        </div>
      )}

      {data && data.groups.length > 0 && (
        <>
          <section aria-label="Failures by config">
            <h2 className={styles.sectionTitle}>By config</h2>
            <div className={styles.configList}>
              {data.groups.map((group, i) => (
                <ConfigFailureCard
                  key={group.configName}
                  group={group}
                  defaultOpen={i === 0}
                  classFilter={classFilter}
                />
              ))}
            </div>
          </section>

          <FailingTestsTable items={allItems} classFilter={classFilter} />
        </>
      )}

      {isLoading && !data && (
        <div className={styles.loadingHint}>Loading failures…</div>
      )}
    </div>
  );
}
