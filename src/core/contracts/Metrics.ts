import { z } from 'zod';

export const StabilityClassSchema = z.enum([
  'flaky',
  'new-failure',
  'always-failing',
  'stable',
  'unknown',
]);
export type StabilityClass = z.infer<typeof StabilityClassSchema>;

export const TopFailingItemSchema = z.object({
  caseId: z.number(),
  title: z.string(),
  /** Number of times this case failed across the checked window */
  failureCount: z.number(),
  /** Number of distinct runs where this case was seen */
  runCount: z.number(),
  /** failureCount / runCount as integer 0-100 */
  failureRate: z.number(),
});
export type TopFailingItem = z.infer<typeof TopFailingItemSchema>;

export const NewFailureItemSchema = z.object({
  caseId: z.number(),
  title: z.string(),
  runName: z.string(),
  runId: z.number(),
});
export type NewFailureItem = z.infer<typeof NewFailureItemSchema>;

export const Failures24hResponseSchema = z.object({
  lastFetched: z.string(),
  /** Cases that failed in the last 24h but did NOT fail in the immediately preceding run */
  newFailures: z.number(),
  /** Cases that failed in the last 24h AND also failed in the preceding run */
  recurringFailures: z.number(),
  total: z.number(),
  topNew: z.array(NewFailureItemSchema),
});
export type Failures24hResponse = z.infer<typeof Failures24hResponseSchema>;

export const TopFailingResponseSchema = z.object({
  lastFetched: z.string(),
  windowDays: z.number(),
  items: z.array(TopFailingItemSchema),
});
export type TopFailingResponse = z.infer<typeof TopFailingResponseSchema>;
