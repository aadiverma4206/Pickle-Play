import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(base + '/home', { waitUntil: 'networkidle' });
await page.locator('header button').last().click();
await page.waitForTimeout(150);
await page.getByRole('button', { name: /Logout/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Ananya Bose/ }).click();
await page.click('button[type="submit"]');
await page.waitForTimeout(500);

await page.goto(base + '/admin/roles', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.screenshot({ path: '.smoke/sidebar_before_scroll.png' });

// Scroll the main content area (not the window) and confirm sidebar stays put.
await page.evaluate(() => {
  const main = document.querySelector('main');
  main.closest('.overflow-y-auto').scrollTop = 600;
});
await page.waitForTimeout(200);
await page.screenshot({ path: '.smoke/sidebar_after_scroll.png' });

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
