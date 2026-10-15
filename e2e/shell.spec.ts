import { expect, test } from '@playwright/test';

test('shell: disclaimer, brand and theme toggle', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('disclaimer')).toContainText('datos ficticios');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByTestId('theme-toggle').first().click();
  await expect(html).not.toHaveAttribute('data-theme', before ?? '');
  const jf = page.getByRole('link', { name: 'JFredDev' }).last();
  await expect(jf).toHaveAttribute('target', '_blank');
});

test('deep link served by 404.html fallback', async ({ page }) => {
  await page.goto('./ruta-que-no-existe');
  await expect(page.getByTestId('disclaimer')).toBeVisible();
});
