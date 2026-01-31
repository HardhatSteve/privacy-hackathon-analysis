import { test, expect } from '@playwright/test';

test.describe('Analyze Page', () => {
  test('should display analyze form', async ({ page }) => {
    await page.goto('/analyze');

    await expect(page.getByRole('heading', { name: 'Analyze Your Program' })).toBeVisible();
    await expect(page.getByText('Program Address')).toBeVisible();
    await expect(page.getByText('Upload Bytecode')).toBeVisible();
    await expect(page.getByText('GitHub')).toBeVisible();
  });

  test('should switch between input methods', async ({ page }) => {
    await page.goto('/analyze');

    // Check address tab is active by default
    await expect(page.getByPlaceholder('Enter program address')).toBeVisible();

    // Switch to upload tab
    await page.getByText('Upload Bytecode').click();
    await expect(page.getByText('Upload Program Bytecode')).toBeVisible();

    // Switch to GitHub tab
    await page.getByText('GitHub').click();
    await expect(page.getByText('Connect GitHub Repository')).toBeVisible();
  });

  test('should change analysis configuration', async ({ page }) => {
    await page.goto('/analyze');

    // Open depth selector
    await page.getByRole('combobox').first().click();
    await page.getByText('Deep Analysis').click();

    // Open severity selector
    await page.getByRole('combobox').nth(1).click();
    await page.getByText('High and Above').click();
  });

  test('should disable submit without input', async ({ page }) => {
    await page.goto('/analyze');

    const submitButton = page.getByRole('button', { name: 'Start Analysis' });
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit with program address', async ({ page }) => {
    await page.goto('/analyze');

    await page.getByPlaceholder('Enter program address').fill('TokenSwap1111111111111111111111111111111111');

    const submitButton = page.getByRole('button', { name: 'Start Analysis' });
    await expect(submitButton).toBeEnabled();
  });
});
