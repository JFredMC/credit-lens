import { expect, test } from '@playwright/test';

test('permanence: preset from Andrés and manual doubling', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cl-persona', 'andres'));
  await page.goto('./permanencia');
  await expect(page.getByTestId('preset-a-cons')).toBeVisible();
  await page.getByTestId('perm-start').fill('2025-01-01');
  await page.getByTestId('perm-paid').fill('2026-07-01');
  await expect(page.getByTestId('perm-result')).toHaveText(/2029/);
  await page.getByRole('button', { name: 'Aún no he pagado' }).click();
  await expect(page.getByTestId('perm-result')).toHaveText(/2033/);
});

test('fuentes links open in a new tab and point to official sites', async ({ page }) => {
  await page.goto('./fuentes');
  const links = page.locator('ul.sources a');
  await expect(links).toHaveCount(6);
  for (const a of await links.all()) {
    await expect(a).toHaveAttribute('target', '_blank');
    expect(await a.getAttribute('href')).toMatch(/gov\.co/);
  }
});

test('reclamos: preview updates and PDF downloads', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cl-persona', 'camila'));
  await page.goto('./reclamos');
  await page.getByTestId('type-sin-aviso').check();
  await expect(page.locator('.paper')).toContainText('comunicación previa');
  await expect(page.getByTestId('deadlines')).toContainText('2026');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-pdf').click(),
  ]);
  expect(download.suggestedFilename()).toBe('derecho-de-peticion-sin-aviso.pdf');
});
