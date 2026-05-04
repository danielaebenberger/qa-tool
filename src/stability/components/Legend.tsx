import styles from './Legend.module.css';

export function Legend() {
  return (
    <div className={styles.legend} aria-label="Stability page legend">
      <span className={styles.muted}>Last results (newest → oldest):</span>
      <span className={`${styles.chip} ${styles.passed}`}>P</span>
      <span className={styles.muted}>passed</span>
      <span className={`${styles.chip} ${styles.failed}`}>F</span>
      <span className={styles.muted}>failed</span>
      <span className={`${styles.chip} ${styles.blocked}`}>B</span>
      <span className={styles.muted}>blocked</span>
      <span className={`${styles.chip} ${styles.retest}`}>R</span>
      <span className={styles.muted}>retest</span>
      <span className={`${styles.badge} ${styles.bgNew}`}>NEW</span>
      <span className={styles.muted}>first failure in last 24h</span>
      <span className={`${styles.badge} ${styles.bgFlaky}`}>FLAKY</span>
      <span className={styles.muted}>≥2 status flips</span>
      <span className={`${styles.badge} ${styles.bgAlways}`}>ALWAYS</span>
      <span className={styles.muted}>100% failing</span>
    </div>
  );
}
