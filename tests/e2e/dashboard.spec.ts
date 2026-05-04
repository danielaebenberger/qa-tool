import { test, expect } from '@playwright/test';

test('dashboard renders header, KPIs, and main sections @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'QA Dashboard — CI Test Results' })
  ).toBeVisible();

  // Filter bar
  await expect(page.getByRole('group', { name: 'Dashboard filters' })).toBeVisible();

  // Main sections by accessible name
  await expect(page.getByRole('region', { name: 'Failures & Blocks Trend' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Period Comparison' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Failing & Blocked Tests' })
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pass Rate by Config File' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Per Config-File Breakdown' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Runs (filtered)' })).toBeVisible();
});

test('Refresh data button is accessible @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Refresh data/ })).toBeVisible();
});
