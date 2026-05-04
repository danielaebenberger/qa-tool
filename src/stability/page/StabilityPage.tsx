import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStability } from '../../api/client';
import { Legend } from '../components/Legend';
import { StabilityKpiStrip } from '../components/StabilityKpiStrip';
import { ConfigAccordion } from '../components/ConfigAccordion';
import { navigate } from '../../routing/navigate';
import styles from './StabilityPage.module.css';

const PROJECT_ID = 45;

type ConfigFilter = 'all-failures' | 'always' | 'flaky' | 'new' | string;

export function StabilityPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ConfigFilter>('all-failures');

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['stability', PROJECT_ID],
    queryFn: () => fetchStability({ projectId: PROJECT_ID, days: 10, history: 10 }),
    staleTime: Infinity,
  });

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    switch (filter) {
      case 'all-failures':
        return data.groups;
      case 'always':
        return data.groups.filter((g) => g.alwaysFailing > 0);
      case 'flaky':
        return data.groups.filter((g) => g.flaky > 0);
      case 'new':
        return data.groups.filter((g) => g.newFailures > 0);
      default:
        return data.groups.filter((g) => g.configName === filter);
    }
  }, [data, filter]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['stability'] });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Test Stability &amp; Flakiness</h1>
          <p className={styles.subtitle}>
            {data ? (
              <>
                Refreshed {new Date(data.lastFetched).toLocaleString()} · lookback{' '}
                {data.windowDays}d · last {data.historyDepth} runs per config · history{' '}
                {data.historyDepth}
              </>
            ) : (
              <>Loading…</>
            )}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate('/')}
          >
            ← Dashboard
          </button>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={refresh}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
      </header>

      <div className={styles.filterBar} role="group" aria-label="Stability filters">
        <label className={styles.field}>
          Filter config
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ConfigFilter)}
            aria-label="Filter configs"
          >
            <option value="all-failures">All configs with failures</option>
            <option value="always">Configs with always-failing tests</option>
            <option value="flaky">Configs with flaky tests</option>
            <option value="new">Configs with new failures (24h)</option>
            {data?.groups.map((g) => (
              <option key={g.configName} value={g.configName}>
                {g.configName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => setFilter('all-failures')}
          disabled={filter === 'all-failures'}
        >
          Clear
        </button>
        <div className={styles.spacer} />
        {data && (
          <span className={styles.counts}>
            {filteredGroups.length} of {data.configsWithFailures} configs ·{' '}
            {data.watchedCases} watched tests
          </span>
        )}
      </div>

      <StabilityKpiStrip data={data} loading={isLoading} />

      <Legend />

      {isError && (
        <div className={styles.errorBanner} role="alert">
          {error instanceof Error ? error.message : 'Failed to load stability data.'}
        </div>
      )}

      {data && filteredGroups.length === 0 && (
        <div className={styles.emptyState}>
          No configs match the current filter.
        </div>
      )}

      <div className={styles.list}>
        {filteredGroups.map((group, i) => (
          <ConfigAccordion
            key={group.configName}
            group={group}
            // Open the first group by default when there's a single result
            defaultOpen={filteredGroups.length === 1 && i === 0}
          />
        ))}
      </div>
    </div>
  );
}
