import { z } from 'zod';

export const RunSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  /** Extracted from "AE - <configName>-<date>" */
  configName: z.string(),
  /** Date string as it appears in the run name (e.g. "20260427" or "2026-04-27") */
  date: z.string(),
  /** Unix timestamp (seconds) when the run was created */
  createdOn: z.number(),
  completedOn: z.number().nullable(),
  passedCount: z.number(),
  failedCount: z.number(),
  blockedCount: z.number(),
  untestedCount: z.number(),
  retestCount: z.number(),
  totalCount: z.number(),
  /** Pass rate as integer 0-100 */
  passRate: z.number(),
  isCompleted: z.boolean(),
  url: z.string(),
});

export type RunSummary = z.infer<typeof RunSummarySchema>;

export const RunsResponseSchema = z.object({
  runs: z.array(RunSummarySchema),
  lastFetched: z.string(),
});

export type RunsResponse = z.infer<typeof RunsResponseSchema>;
