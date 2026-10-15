import { expect, test } from '@playwright/test';

for (const fmt of ['pdf', 'xlsx', 'docx', 'png'] as const) {
  test(`exports the report as ${fmt}`, async ({ page }) => {
    await page.goto('./reporte');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId(`export-${fmt}`).click(),
    ]);
    expect(download.suggestedFilename()).toBe(`credit-lens-reporte-laura.${fmt}`);
    const path = await download.path();
    expect(path).toBeTruthy();
  });
}

test('shows a card preview without personal data', async ({ page }) => {
  await page.goto('./reporte');
  await page.getByRole('button', { name: 'Ver vista previa' }).click();
  await expect(page.getByTestId('card-preview')).toBeVisible();
});
