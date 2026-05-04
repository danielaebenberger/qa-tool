import { useQuery } from '@tanstack/react-query';
import { fetchFailures24h } from '../../api/client';
import { Card } from './Card';
import styles from './Failing24hCard.module.css';

const PROJECT_ID = 45;

export function Failing24hCard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['failures-24h', PROJECT_ID],
    queryFn: () => fetchFailures24h(PROJECT_ID),
    staleTime: Infinity,
  });

  return (
    <Card title="Failing & Blocked Tests" subtitle="last 24 hours">
      {isLoading && <div className={styles.muted}>Loading…</div>}
      {isError && (
        <div className={styles.error} role="alert">
          {error instanceof Error ? error.message : 'Failed to load.'}
        </div>
      )}
      {data && (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total failing</span>
              <span className={`${styles.summaryValue} ${data.total > 0 ? styles.bad : styles.good}`}>
                {data.total}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>New</span>
              <span className={`${styles.summaryValue} ${data.newFailures > 0 ? styles.bad : ''}`}>
                {data.newFailures}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Recurring</span>
              <span className={`${styles.summaryValue} ${data.recurringFailures > 0 ? styles.warn : ''}`}>
                {data.recurringFailures}
              </span>
            </div>
          </div>

          {data.topNew.length === 0 ? (
            <div className={styles.empty}>No new failures in the last 24 hours. ✓</div>
          ) : (
            <ul className={styles.list}>
              {data.topNew.map((item) => (
                <li key={`${item.caseId}-${item.runId}`} className={styles.item}>
                  <span className={styles.tag} aria-label="New failure">
                    NEW
                  </span>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle}>{item.title}</div>
                    <div className={styles.itemMeta}>
                      C{item.caseId} · {item.runName}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
