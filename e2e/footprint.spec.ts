import { expect, test } from '@playwright/test';

test('huella de consulta shows windows, self consultations and impact', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cl-persona', 'camila'));
  await page.goto('./huella');
  await expect(page.getByTestId('fp-6')).toHaveText('4');
  await expect(page.getByText('Tus propias consultas no cuentan.')).toBeVisible();
  await expect(page.getByText('Cuenta para tu puntaje')).toHaveCount(4);
});
