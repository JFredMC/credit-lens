import { expect, test } from '@playwright/test';

test('resumen shows score, KPIs and upcoming payments', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('score-value')).toHaveText(/^\d{3}$/);
  await expect(page.getByText('Deuda total')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Próximos pagos' })).toBeVisible();
});

test('persona switch changes the score and persists', async ({ page }) => {
  await page.goto('./');
  const before = await page.getByTestId('score-value').textContent();
  await page.getByTestId('persona-select').selectOption('camila');
  await expect(page.getByTestId('score-value')).not.toHaveText(before ?? '');
  await page.reload();
  await expect(page.getByTestId('persona-select')).toHaveValue('camila');
});

test('mi puntaje lists five factors', async ({ page }) => {
  await page.goto('./puntaje');
  for (const id of ['payment', 'utilization', 'age', 'inquiries', 'mix']) {
    await expect(page.getByTestId(`factor-${id}`)).toBeVisible();
  }
});

test('obligaciones filter and detail', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('persona-select').selectOption('camila');
  await page.goto('./obligaciones');
  await page.getByRole('button', { name: /En mora/ }).click();
  await expect(page.getByTestId('product-c-card-2')).toBeVisible();
  await expect(page.getByTestId('product-c-card-1')).toHaveCount(0);
  await page.getByTestId('product-c-card-2').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Banco Aurora');
  await expect(page.getByText(/días de mora/)).toBeVisible();
});
