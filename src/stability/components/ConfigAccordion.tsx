import { useState } from 'react';
import type { ConfigStabilityGroup } from '../../core/contracts/Stability';
import { HistoryStrip } from './HistoryStrip';
import { LabelBadge } from './LabelBadge';
import styles from './ConfigAccordion.module.css';

interface ConfigAccordionProps {
  group: ConfigStabilityGroup;
  defaultOpen?: boolean;
}

export function ConfigAccordion({ group, defaultOpen = false }: ConfigAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `stability-panel-${group.configName.replace(/[^a-z0-9]+/gi, '-')}`;

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
            <strong>{group.testsWithFailures}</strong> tests with failures
            {group.alwaysFailing > 0 && (
              <>
                <span className={styles.sep}>·</span>
                <strong>{group.alwaysFailing}</strong>{' '}
                <span className={styles.always}>always failing</span>
              </>
            )}
            {group.flaky > 0 && (
              <>
                <span className={styles.sep}>·</span>
                <strong>{group.flaky}</strong> <span className={styles.flaky}>flaky</span>
              </>
            )}
            {group.newFailures > 0 && (
              <>
                <span className={styles.sep}>·</span>
                <strong>{group.newFailures}</strong>{' '}
                <span className={styles.newFailure}>new</span>
              </>
            )}
            <span className={styles.sep}>·</span>
            <span className={styles.muted}>{group.runsInspected} runs inspected</span>
          </p>
        </div>
        <span className={`${styles.caret} ${open ? styles.caretOpen : ''}`} aria-hidden="true">
          ▶
        </span>
      </button>

      {open && (
        <div id={panelId} className={styles.panel} role="region" aria-label={`${group.configName} tests`}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.testCol}>Test</th>
                  <th>Last 10 results</th>
                  <th className={styles.numCol}>Fail %</th>
                  <th className={styles.numCol} title="Failed runs">F</th>
                  <th className={styles.numCol} title="Blocked runs">B</th>
                  <th className={styles.numCol} title="Passed runs">P</th>
                  <th className={styles.numCol} title="Not-run / absent">N</th>
                  <th className={styles.numCol}>Flips</th>
                </tr>
              </thead>
              <tbody>
                {group.cases.map((c) => (
                  <tr key={c.caseId}>
                    <td>
                      <div className={styles.testCell}>
                        <LabelBadge label={c.label} />
                        <div className={styles.testInfo}>
                          <div className={styles.testTitle}>{c.title}</div>
                          <div className={styles.testMeta}>
                            C{c.caseId} · last: {c.lastStatus} · streak: {c.streak}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><HistoryStrip history={c.history} /></td>
                    <td className={styles.num}>{c.failRate}%</td>
                    <td className={`${styles.num} ${c.failedCount > 0 ? styles.bad : ''}`}>
                      {c.failedCount}
                    </td>
                    <td className={`${styles.num} ${c.blockedCount > 0 ? styles.warn : ''}`}>
                      {c.blockedCount}
                    </td>
                    <td className={`${styles.num} ${styles.good}`}>{c.passedCount}</td>
                    <td className={`${styles.num} ${styles.muted}`}>{c.notRunCount}</td>
                    <td className={styles.num}>{c.flips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
