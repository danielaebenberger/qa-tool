import { z } from 'zod';

export const TestStatusSchema = z.enum(['passed', 'failed', 'blocked', 'untested', 'retest']);
export type TestStatus = z.infer<typeof TestStatusSchema>;

export const TestResultSchema = z.object({
  testId: z.number(),
  caseId: z.number(),
  runId: z.number(),
  title: z.string(),
  status: TestStatusSchema,
  statusId: z.number(),
  testedOn: z.number().nullable(),
});

export type TestResult = z.infer<typeof TestResultSchema>;
