import { describe, it, expect } from 'vitest';
import { FakeCIProvider } from '../../src/core/ci/FakeCIProvider';

describe('FakeCIProvider', () => {
  const provider = new FakeCIProvider();

  describe('getRuns', () => {
    it('returns runs sorted newest-first', async () => {
      const runs = await provider.getRuns({ projectId: 45 });
      for (let i = 0; i < runs.length - 1; i++) {
        expect(runs[i].createdOn).toBeGreaterThanOrEqual(runs[i + 1].createdOn);
      }
    });

    it('filters by createdAfter', async () => {
      // Only runs created in the last 10 hours
      const recent = await provider.getRuns({
        projectId: 45,
        createdAfter: new Date(Date.now() - 10 * 60 * 60 * 1000),
      });
      // Runs from 26–27h ago should be excluded
      const tooOld = recent.filter((r) => r.createdOn * 1000 < Date.now() - 10 * 60 * 60 * 1000);
      expect(tooOld).toHaveLength(0);
    });

    it('returns all runs when no createdAfter is given', async () => {
      const all = await provider.getRuns({ projectId: 45 });
      expect(all.length).toBeGreaterThan(0);
    });

    it('parses configName from run name', async () => {
      const runs = await provider.getRuns({ projectId: 45 });
      const acme = runs.find((r) => r.name.includes('acmespace'));
      expect(acme?.configName).toBe('acmespace');
    });
  });

  describe('getResultsForRun', () => {
    it('returns results for a known run id', async () => {
      const results = await provider.getResultsForRun(1001);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns an empty array for an unknown run id', async () => {
      const results = await provider.getResultsForRun(9999);
      expect(results).toHaveLength(0);
    });

    it('results have the expected run id', async () => {
      const results = await provider.getResultsForRun(1002);
      for (const r of results) {
        expect(r.runId).toBe(1002);
      }
    });
  });
});
