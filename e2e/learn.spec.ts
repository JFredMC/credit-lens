import { expect, test } from '@playwright/test';

test('aprende: lessons, rate converter and cited sources', async ({ page }) => {
  await page.goto('./aprende');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Lo básico del crédito, sin letra pequeña',
  );
  await page.getByTestId('lesson-suplantacion').locator('summary').click();
  await expect(page.getByTestId('lesson-suplantacion')).toContainText(
    'Víctima de Falsedad Personal',
  );
  await page.getByTestId('ea').fill('12');
  await expect(page.getByTestId('mv')).toContainText('0,95 %');
  await expect(page.getByTestId('usury')).toContainText('No supera');
  await page.getByTestId('ea').fill('35');
  await expect(page.getByTestId('usury')).toContainText('Supera');
  for (const a of await page.locator('a[href^="http"]').all()) {
    await expect(a).toHaveAttribute('target', '_blank');
  }
});
