import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface DashboardFilters {
  /** Inclusive YYYY-MM-DD; if undefined, server falls back to `days` */
  from?: string;
  to?: string;
  /** Quick-window in days; ignored when from/to are set */
  days: number;
  /** Empty string = all configs */
  config: string;
}

interface FiltersContextValue {
  filters: DashboardFilters;
  setQuickWindow: (days: number) => void;
  setRange: (from: string | undefined, to: string | undefined) => void;
  setConfig: (config: string) => void;
  clear: () => void;
}

const DEFAULT_FILTERS: DashboardFilters = { days: 30, config: '' };

const Ctx = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setQuickWindow: (days) =>
        setFilters((f) => ({ ...f, days, from: undefined, to: undefined })),
      setRange: (from, to) => setFilters((f) => ({ ...f, from, to })),
      setConfig: (config) => setFilters((f) => ({ ...f, config })),
      clear: () => setFilters(DEFAULT_FILTERS),
    }),
    [filters]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFilters must be used inside <FiltersProvider>');
  return ctx;
}
