import { expect, test } from '@playwright/test';

test('calendar: month navigation, totals and .ics download', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cl-persona', 'camila'));
  await page.goto('./calendario');
  await expect(page.getByTestId('month-title')).toHaveText(/octubre 2026/i);
  await expect(page.getByText(/incluye .* vencidos/)).toBeVisible();
  const oct = await page.getByTestId('month-total').textContent();
  await page.getByRole('button', { name: 'Mes siguiente' }).click();
  await expect(page.getByTestId('month-title')).toHaveText(/noviembre 2026/i);
  await expect(page.getByTestId('month-total')).not.toHaveText(oct ?? '');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-ics').click(),
  ]);
  expect(download.suggestedFilename()).toBe('credit-lens-pagos.ics');
});
