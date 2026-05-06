import { useState } from 'react';
import type { ConfigFailureGroup, FailureClassification, LatestFailureItem } from '../../core/contracts/Failures';
import { HistoryStrip } from '../../stability/components/HistoryStrip';
import styles from './ConfigFailureCard.module.css';

interface ConfigFailureCardProps {
  group: ConfigFailureGroup;
  defaultOpen?: boolean;
  /** If set, only items of this classification are rendered */
  classFilter?: FailureClassification | 'all';
}

const CLASS_META: Record<
  FailureClassification,
  { label: string; badgeClass: string; title: string }
> = {
  'new-failure': {
    label: 'New',
    badgeClass: 'badgeNew',
    title: 'Failed in the latest run; was passing before',
  },
  persistent: {
    label: 'Persistent',
    badgeClass: 'badgePersistent',
    title: 'Failed in the latest run and in consecutive prior runs',
  },
  recovering: {
    label: 'Recovering',
    badgeClass: 'badgeRecovering',
    title: 'Passing in latest run; had consecutive prior failures',
  },
};

function statusBadgeClass(status: 'failed' | 'blocked' | 'retest' | 'passed'): string {
  if (status === 'failed') return styles.statusFailed;
  if (status === 'blocked') return styles.statusBlocked;
  if (status === 'retest') return styles.statusRetest;
  return styles.statusPassed;
}

interface SectionProps {
  label: string;
  items: LatestFailureItem[];
  classification: FailureClassification;
}

function ClassSection({ label, items, classification }: SectionProps) {
  if (items.length === 0) return null;
  const meta = CLASS_META[classification];
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={`${styles.classBadge} ${styles[meta.badgeClass]}`} title={meta.title}>
          {label}
        </span>
        <span className={styles.sectionCount}>{items.length}</span>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.statusCol}>Status</th>
            <th>Test</th>
            <th className={styles.historyCol}>History →</th>
            <th className={styles.streakCol} title="Consecutive failing runs">Streak</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.caseId}>
              <td>
                <span className={`${styles.statusDot} ${statusBadgeClass(item.latestStatus)}`} />
              </td>
              <td className={styles.testCell}>
                <span className={styles.testTitle}>{item.title}</span>
                <span className={styles.caseId}>C{item.caseId}</span>
              </td>
              <td>
                <HistoryStrip
                  history={item.recentHistory as Parameters<typeof HistoryStrip>[0]['history']}
                />
              </td>
              <td className={styles.streak}>
                {item.consecutiveFailures > 0 ? `×${item.consecutiveFailures}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConfigFailureCard({
  group,
  defaultOpen = false,
  classFilter = 'all',
}: ConfigFailureCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `failures-panel-${group.configName.replace(/[^a-z0-9]+/gi, '-')}`;
  const runDate = new Date(group.runCreatedOn * 1000).toLocaleString();
  const currentlyFailing = group.newFailures + group.persistentFailures;

  const visibleItems =
    classFilter === 'all'
      ? group.items
      : group.items.filter((i) => i.classification === classFilter);

  const newItems = visibleItems.filter((i) => i.classification === 'new-failure');
  const persistentItems = visibleItems.filter((i) => i.classification === 'persistent');
  const recoveringItems = visibleItems.filter((i) => i.classification === 'recovering');

  if (visibleItems.length === 0) return null;

  return (
    <section className={styles.card}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>{group.configName}</h3>
          <p className={styles.summary}>
            <a
              href={group.runUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.runLink}
              onClick={(e) => e.stopPropagation()}
            >
              {group.runName}
            </a>
            <span className={styles.sep}>·</span>
            {runDate}
            <span className={styles.sep}>·</span>
            <span className={styles.passRate}>{group.passRate}% pass</span>
            <span className={styles.sep}>·</span>
            <span className={currentlyFailing > 0 ? styles.dangerText : ''}>
              {currentlyFailing} failing now
            </span>
            {group.newFailures > 0 && (
              <>
                <span className={styles.sep}>·</span>
                <span className={styles.newText}>{group.newFailures} new</span>
              </>
            )}
            {group.persistentFailures > 0 && (
              <>
                <span className={styles.sep}>·</span>
                <span className={styles.persistentText}>{group.persistentFailures} persistent</span>
              </>
            )}
            {group.recovering > 0 && (
              <>
                <span className={styles.sep}>·</span>
                <span className={styles.recoveringText}>{group.recovering} recovering</span>
              </>
            )}
            <span className={styles.sep}>·</span>
            <span className={styles.muted}>{group.historyDepth} runs inspected</span>
          </p>
        </div>
        <span className={`${styles.caret} ${open ? styles.caretOpen : ''}`} aria-hidden="true">
          ▶
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className={styles.panel}
          role="region"
          aria-label={`Failing tests for ${group.configName}`}
        >
          <ClassSection
            label="New failures"
            items={newItems}
            classification="new-failure"
          />
          <ClassSection
            label="Persistent failures"
            items={persistentItems}
            classification="persistent"
          />
          <ClassSection
            label="Recovering"
            items={recoveringItems}
            classification="recovering"
          />
        </div>
      )}
    </section>
  );
}
