import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the hero section', async ({ page }) => {
    await page.goto('/');

    // Check hero title
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Privacy Analysis for Solana Programs'
    );

    // Check CTA buttons
    await expect(page.getByRole('link', { name: 'Analyze Your Program' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Documentation' })).toBeVisible();
  });

  test('should navigate to analyze page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Analyze Your Program' }).click();
    await expect(page).toHaveURL('/analyze');
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Privacy Vulnerability Detection')).toBeVisible();
    await expect(page.getByText('Quantifiable Privacy Score')).toBeVisible();
    await expect(page.getByText('Deep Analysis Engine')).toBeVisible();
  });

  test('should display stats section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Programs Analyzed')).toBeVisible();
    await expect(page.getByText('Vulnerabilities Found')).toBeVisible();
    await expect(page.getByText('Average Analysis Time')).toBeVisible();
    await expect(page.getByText('Detection Accuracy')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Go to Analyze
    await page.getByRole('link', { name: 'Analyze' }).first().click();
    await expect(page).toHaveURL('/analyze');

    // Go to Leaderboard
    await page.getByRole('link', { name: 'Leaderboard' }).first().click();
    await expect(page).toHaveURL('/leaderboard');

    // Go back to home
    await page.getByRole('link', { name: 'PrivacyLens' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should toggle theme', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');

    // Click theme toggle
    await page.getByRole('button', { name: 'Toggle theme' }).click();

    // Check that theme class changes
    await expect(html).toHaveClass(/dark|light/);
  });
});
