import { expect, test } from '@playwright/test';

test('suggests goals, saves a new one and persists it', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('cl-persona', 'camila');
      sessionStorage.setItem('seeded', '1');
    }
  });
  await page.goto('./metas');
  await expect(page.getByTestId('goal')).toHaveCount(3);
  await expect(page.getByTestId('goal').first()).toContainText('Subir mi puntaje');
  await page.getByLabel('Puntaje meta (150–950)').fill('300');
  await page.getByRole('button', { name: 'Guardar meta' }).click();
  await expect(page.getByRole('alert')).toContainText('Ya cumples');
  await page.getByLabel('Puntaje meta (150–950)').fill('720');
  await page.getByRole('button', { name: 'Guardar meta' }).click();
  await expect(page.getByTestId('goal').last()).toContainText('720');
  await page.getByRole('button', { name: 'Quitar meta' }).first().click();
  await expect(page.getByTestId('goal')).toHaveCount(2);
  await page.reload();
  await expect(page.getByTestId('goal')).toHaveCount(2);
});
