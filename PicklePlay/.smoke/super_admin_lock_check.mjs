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
await page.getByRole('button', { name: /Logout/ }).click();
await page.waitForTimeout(300);
await page.fill('input[type="email"]', 'super.admin@pickleplay.app');
await page.fill('input[type="password"]', 'Password@123');
await page.click('button[type="submit"]');
await page.waitForTimeout(500);

await page.goto(base + '/admin/roles', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.screenshot({ path: '.smoke/super_admin_lock.png' });

// Confirm there is no "Change" button next to the Super Admin row (Ananya Bose).
const changeButtonCount = await page.getByRole('button', { name: 'Change' }).count();
console.log('Total "Change" buttons visible:', changeButtonCount);
console.log('Permanent label visible near Super Admin:', await page.getByText('Permanent').count());

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
