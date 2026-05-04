import { Hono } from 'hono';
import type { CIProvider } from '../../core/ci/CIProvider';
import { RunsResponseSchema } from '../../core/contracts/RunSummary';

export function runsRoute(provider: CIProvider) {
  const app = new Hono();

  /**
   * GET /api/runs?projectId=45&days=7
   * Returns all runs for the project created within the last `days` days.
   */
  app.get('/', async (c) => {
    const projectId = parseInt(c.req.query('projectId') ?? '45', 10);
    const days = parseInt(c.req.query('days') ?? '7', 10);

    const createdAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const runs = await provider.getRuns({ projectId, createdAfter });

    return c.json(
      RunsResponseSchema.parse({
        runs,
        lastFetched: new Date().toISOString(),
      })
    );
  });

  return app;
}
