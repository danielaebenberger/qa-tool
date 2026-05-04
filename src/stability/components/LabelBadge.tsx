import type { StabilityLabel } from '../../core/contracts/Stability';
import styles from './LabelBadge.module.css';

interface LabelBadgeProps {
  label: StabilityLabel;
}

const META: Record<StabilityLabel, { text: string; className: string; title: string }> = {
  always: { text: 'ALWAYS', className: styles.always, title: '100% failing across the inspected runs' },
  flaky: { text: 'FLAKY', className: styles.flaky, title: '≥2 status flips across the inspected runs' },
  'new-failure': {
    text: 'NEW',
    className: styles.newFailure,
    title: 'First failure in the last 24 hours',
  },
  failing: { text: 'FAIL', className: styles.failing, title: 'Failed at least once in the window' },
};

export function LabelBadge({ label }: LabelBadgeProps) {
  const m = META[label];
  return (
    <span className={`${styles.badge} ${m.className}`} title={m.title}>
      {m.text}
    </span>
  );
}
