import { expect, test } from '@playwright/test';

const routes = [
  './',
  './puntaje',
  './obligaciones',
  './simulador',
  './plan-deudas',
  './uso-de-cupos',
  './permanencia',
  './fuentes',
];

test.describe('no horizontal overflow at 360 px', () => {
  test.use({ viewport: { width: 360, height: 780 } });
  for (const r of routes) {
    test(r, async ({ page }) => {
      await page.goto(r);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
