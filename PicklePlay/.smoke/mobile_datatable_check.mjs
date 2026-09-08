import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

// Log in as Super Admin so every admin route is reachable.
await page.goto(base + '/home', { waitUntil: 'networkidle' });
await page.locator('header button').last().click();
await page.waitForTimeout(150);
await page.getByRole('button', { name: /Logout/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Ananya Bose/ }).click();
await page.click('button[type="submit"]');
await page.waitForTimeout(500);

for (const [route, file] of [
  ['/admin/users', 'mobile_dt_users.png'],
  ['/admin/bookings', 'mobile_dt_bookings.png'],
  ['/admin/support', 'mobile_dt_support.png'],
  ['/admin/audit', 'mobile_dt_audit.png'],
]) {
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `.smoke/${file}` });
}

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
