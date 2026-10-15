import { expect, test } from '@playwright/test';

test('alerts: filter, mark read, persistence and nav badge', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear();
      localStorage.setItem('cl-persona', 'camila');
      sessionStorage.setItem('seeded', '1');
    }
  });
  await page.goto('./alertas');
  const badge = page.locator('.nav .badge');
  const before = Number(await badge.textContent());
  expect(before).toBeGreaterThan(0);
  await page.getByRole('button', { name: /^Cupos/ }).click();
  await expect(page.getByTestId('alert-cupo')).toHaveCount(2);
  await page.getByRole('button', { name: 'Marcar como leída' }).first().click();
  await expect(badge).toHaveText(String(before - 1));
  await page.reload();
  await expect(page.locator('.nav .badge')).toHaveText(String(before - 1));
  await page.getByTestId('mark-all').click();
  await expect(page.locator('.nav .badge')).toHaveCount(0);
});
