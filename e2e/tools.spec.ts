import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cl-persona', 'camila'));
});

test('simulator: catching up raises the score', async ({ page }) => {
  await page.goto('./simulador');
  await expect(page.getByTestId('sim-delta')).toHaveText('0');
  await page.getByTestId('catchup-c-card-2').check();
  await expect(page.getByTestId('sim-delta')).toHaveText(/\+\d+/);
});

test('payoff planner shows a debt-free date and order', async ({ page }) => {
  await page.goto('./plan-deudas');
  await expect(page.getByTestId('payoff-date')).toHaveText(/\d{4}/);
  await page.getByRole('button', { name: /Bola de nieve/ }).click();
  await expect(page.getByRole('heading', { name: 'Orden de pago' })).toBeVisible();
});

test('utilization shows total and target advice', async ({ page }) => {
  await page.goto('./uso-de-cupos');
  await expect(page.getByTestId('util-total')).toHaveText(/94/);
  await expect(page.getByText(/para quedar en 30/)).toBeVisible();
});
