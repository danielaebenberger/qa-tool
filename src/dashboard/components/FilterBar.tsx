import { useState, useEffect } from 'react';
import { useFilters } from '../filters/FiltersContext';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  configs: string[];
}

const QUICK_OPTIONS: Array<{ label: string; days: number }> = [
  { label: 'Today', days: 1 },
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
];

export function FilterBar({ configs }: FilterBarProps) {
  const { filters, setQuickWindow, setRange, setConfig, clear } = useFilters();
  const [fromDraft, setFromDraft] = useState(filters.from ?? '');
  const [toDraft, setToDraft] = useState(filters.to ?? '');

  // Keep drafts in sync if filters change externally (e.g. via Clear button)
  useEffect(() => {
    setFromDraft(filters.from ?? '');
    setToDraft(filters.to ?? '');
  }, [filters.from, filters.to]);

  const apply = () => {
    setRange(fromDraft || undefined, toDraft || undefined);
  };

  const handleClear = () => {
    setFromDraft('');
    setToDraft('');
    clear();
  };

  const isCustomRange = !!(filters.from || filters.to);

  return (
    <div className={styles.bar} role="group" aria-label="Dashboard filters">
      <label className={styles.field}>
        Config
        <select
          value={filters.config}
          onChange={(e) => setConfig(e.target.value)}
          aria-label="Filter by config file"
        >
          <option value="">All configs</option>
          {configs.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        From
        <input
          type="date"
          value={fromDraft}
          onChange={(e) => setFromDraft(e.target.value)}
          aria-label="From date"
        />
      </label>

      <label className={styles.field}>
        To
        <input
          type="date"
          value={toDraft}
          onChange={(e) => setToDraft(e.target.value)}
          aria-label="To date"
        />
      </label>

      <button
        onClick={apply}
        className={`${styles.btn} ${styles.btnPrimary}`}
        disabled={!fromDraft && !toDraft}
      >
        Apply
      </button>

      <button onClick={handleClear} className={styles.btn}>
        Clear
      </button>

      <div className={styles.spacer} />

      <div className={styles.quickGroup} role="group" aria-label="Quick window">
        {QUICK_OPTIONS.map((opt) => {
          const active = !isCustomRange && filters.days === opt.days;
          return (
            <button
              key={opt.days}
              onClick={() => setQuickWindow(opt.days)}
              className={`${styles.quickBtn} ${active ? styles.quickBtnActive : ''}`}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
