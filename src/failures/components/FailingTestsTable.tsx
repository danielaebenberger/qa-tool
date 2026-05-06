import { useMemo, useState } from 'react';
import type { FailureClassification, LatestFailureItem } from '../../core/contracts/Failures';
import { HistoryStrip } from '../../stability/components/HistoryStrip';
import styles from './FailingTestsTable.module.css';

interface FailingTestsTableProps {
  items: LatestFailureItem[];
  classFilter?: FailureClassification | 'all';
}

type SortKey = 'title' | 'config' | 'status' | 'classification' | 'streak';
type SortDir = 'asc' | 'desc';

const CLASS_ORDER: Record<FailureClassification, number> = {
  'new-failure': 0,
  persistent: 1,
  recovering: 2,
};

const CLASS_META: Record<FailureClassification, { label: string; badgeClass: string }> = {
  'new-failure': { label: 'New', badgeClass: 'badgeNew' },
  persistent: { label: 'Persistent', badgeClass: 'badgePersistent' },
  recovering: { label: 'Recovering', badgeClass: 'badgeRecovering' },
};

function statusDotClass(status: 'failed' | 'blocked' | 'retest' | 'passed'): string {
  if (status === 'failed') return styles.dotFailed;
  if (status === 'blocked') return styles.dotBlocked;
  if (status === 'retest') return styles.dotRetest;
  return styles.dotPassed;
}

export function FailingTestsTable({ items, classFilter = 'all' }: FailingTestsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('classification');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const visible = useMemo(
    () =>
      classFilter === 'all' ? items : items.filter((i) => i.classification === classFilter),
    [items, classFilter]
  );

  const sorted = useMemo(() => {
    const copy = [...visible];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'classification':
          cmp =
            CLASS_ORDER[a.classification] - CLASS_ORDER[b.classification] ||
            b.consecutiveFailures - a.consecutiveFailures;
          break;
        case 'streak':
          cmp = b.consecutiveFailures - a.consecutiveFailures;
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'config':
          cmp = a.configName.localeCompare(b.configName) || a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = a.latestStatus.localeCompare(b.latestStatus);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [visible, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function indicator(key: SortKey) {
    if (sortKey !== key) return <span className={styles.sortInactive}>↕</span>;
    return <span className={styles.sortActive}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  if (visible.length === 0) {
    return (
      <div className={styles.empty} role="status">
        No tests match the current filter.
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>All tests</h2>
        <span className={styles.count}>{visible.length} tests</span>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <button type="button" className={styles.sortBtn} onClick={() => handleSort('classification')}>
                  Classification {indicator('classification')}
                </button>
              </th>
              <th>
                <button type="button" className={styles.sortBtn} onClick={() => handleSort('status')}>
                  Latest {indicator('status')}
                </button>
              </th>
              <th>
                <button type="button" className={styles.sortBtn} onClick={() => handleSort('title')}>
                  Test title {indicator('title')}
                </button>
              </th>
              <th>
                <button type="button" className={styles.sortBtn} onClick={() => handleSort('config')}>
                  Config {indicator('config')}
                </button>
              </th>
              <th>History →</th>
              <th>
                <button type="button" className={styles.sortBtn} onClick={() => handleSort('streak')}>
                  Streak {indicator('streak')}
                </button>
              </th>
              <th>Run</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => {
              const meta = CLASS_META[item.classification];
              return (
                <tr key={`${item.configName}-${item.caseId}`}>
                  <td>
                    <span className={`${styles.classBadge} ${styles[meta.badgeClass]}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusDot} ${statusDotClass(item.latestStatus)}`} />
                  </td>
                  <td className={styles.testCell}>
                    <span className={styles.testTitle}>{item.title}</span>
                    <span className={styles.caseId}>C{item.caseId}</span>
                  </td>
                  <td className={styles.config}>{item.configName}</td>
                  <td>
                    <HistoryStrip
                      history={item.recentHistory as Parameters<typeof HistoryStrip>[0]['history']}
                    />
                  </td>
                  <td className={styles.streak}>
                    {item.consecutiveFailures > 0 ? `×${item.consecutiveFailures}` : '—'}
                  </td>
                  <td>
                    <a
                      href={item.runUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.runLink}
                    >
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

