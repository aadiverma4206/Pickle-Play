import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(base + '/home', { waitUntil: 'networkidle' });
await page.locator('header button').last().click();
await page.waitForTimeout(150);
await page.getByRole('button', { name: /Ananya Bose/ }).first().click();
await page.waitForTimeout(300);

for (const [route, file] of [
  ['/admin/settings', 'final_settings.png'],
  ['/admin/audit', 'final_audit.png'],
  ['/admin/roles', 'final_roles.png'],
]) {
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `.smoke/${file}` });
}

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
