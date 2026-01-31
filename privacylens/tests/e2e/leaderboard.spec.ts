import { test, expect } from '@playwright/test';

test.describe('Leaderboard Page', () => {
  test('should display leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');

    await expect(page.getByRole('heading', { name: 'Privacy Leaderboard' })).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/leaderboard');

    await expect(page.getByText('Programs Ranked')).toBeVisible();
    await expect(page.getByText('Average Score')).toBeVisible();
    await expect(page.getByText('Score Improvement This Month')).toBeVisible();
    await expect(page.getByText('Perfect Scores')).toBeVisible();
  });

  test('should display leaderboard table', async ({ page }) => {
    await page.goto('/leaderboard');

    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('Rank')).toBeVisible();
    await expect(page.getByText('Program')).toBeVisible();
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByText('Score')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/leaderboard');

    await page.getByRole('combobox').first().click();
    await page.getByText('DeFi').click();

    // Should still show the leaderboard
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should search programs', async ({ page }) => {
    await page.goto('/leaderboard');

    await page.getByPlaceholder('Search programs...').fill('Jupiter');

    // Wait for search results
    await page.waitForTimeout(300);
  });
});
