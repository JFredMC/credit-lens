// Screenshots of the Pages build: node scripts/shots.mjs <outDir> [route=name ...]
import { chromium } from '@playwright/test';
const [out, ...pairs] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:4320/credit-lens/';
const persona = process.env.PERSONA ?? 'laura';
const theme = process.env.THEME ?? 'light';
const browser = await chromium.launch();
for (const [vp, size] of [
  ['mobile', { width: 360, height: 800 }],
  ['desktop', { width: 1440, height: 900 }],
]) {
  const ctx = await browser.newContext({
    viewport: size,
    deviceScaleFactor: vp === 'mobile' ? 2 : 1,
    locale: 'es-CO',
  });
  await ctx.addInitScript(
    ([p, t]) => {
      localStorage.setItem('cl-persona', p);
      localStorage.setItem('cl-theme', t);
    },
    [persona, theme],
  );
  const page = await ctx.newPage();
  for (const pair of pairs) {
    const [route, name] = pair.split('=');
    await page.goto(base + route);
    await page.waitForTimeout(900);
    await page.screenshot({
      path: `${out}/${name}-${vp}${theme === 'dark' ? '-dark' : ''}.png`,
      fullPage: true,
    });
  }
  await ctx.close();
}
await browser.close();
