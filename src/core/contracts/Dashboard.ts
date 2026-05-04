import { z } from 'zod';

export const KpisSchema = z.object({
  runsLast24h: z.number(),
  testsLast24h: z.number(),
  passRate: z.number(),
  failingTests: z.number(),
  blockedTests: z.number(),
  passedTests: z.number(),
});
export type Kpis = z.infer<typeof KpisSchema>;

export const TrendPointSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  failed: z.number(),
  blocked: z.number(),
  passed: z.number(),
  runs: z.number(),
});
export type TrendPoint = z.infer<typeof TrendPointSchema>;

export const PeriodTotalsSchema = z.object({
  runs: z.number(),
  tests: z.number(),
  passed: z.number(),
  failed: z.number(),
  blocked: z.number(),
  passRate: z.number(),
});
export type PeriodTotals = z.infer<typeof PeriodTotalsSchema>;

export const PeriodComparisonSchema = z.object({
  current: PeriodTotalsSchema,
  previous: PeriodTotalsSchema,
});
export type PeriodComparison = z.infer<typeof PeriodComparisonSchema>;

export const ConfigBreakdownRowSchema = z.object({
  configName: z.string(),
  runs: z.number(),
  tests: z.number(),
  passed: z.number(),
  failed: z.number(),
  blocked: z.number(),
  passRate: z.number(),
});
export type ConfigBreakdownRow = z.infer<typeof ConfigBreakdownRowSchema>;

export const FilteredRunSchema = z.object({
  id: z.number(),
  name: z.string(),
  configName: z.string(),
  createdOn: z.number(),
  passedCount: z.number(),
  failedCount: z.number(),
  blockedCount: z.number(),
  totalCount: z.number(),
  passRate: z.number(),
  url: z.string(),
});
export type FilteredRun = z.infer<typeof FilteredRunSchema>;

export const DashboardOverviewSchema = z.object({
  lastFetched: z.string(),
  windowDays: z.number(),
  configs: z.array(z.string()),
  kpis: KpisSchema,
  trend: z.array(TrendPointSchema),
  comparison: PeriodComparisonSchema,
  byConfig: z.array(ConfigBreakdownRowSchema),
  runs: z.array(FilteredRunSchema),
});
export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>;
