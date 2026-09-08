import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 500, height: 950 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { console.log('[console]', m.type(), m.text()); if (m.type() === 'error') errors.push(m.text()); });

// The app boots pre-authenticated as a demo convenience, so log out via the
// real UI flow to reach an actual logged-out /login screen.
await page.goto(base + '/home', { waitUntil: 'networkidle' });
await page.locator('header button').last().click();
await page.waitForTimeout(150);
await page.getByRole('button', { name: /Logout/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: '.smoke/login_picker.png' });

// Click a non-default demo account (Club Manager) and confirm prefill.
await page.getByRole('button', { name: /Sanjay Gupta/ }).click();
await page.waitForTimeout(150);
const email = await page.locator('input[type="email"]').inputValue();
const pass = await page.locator('input[type="password"]').inputValue();
console.log('Prefilled email:', email, '| password length:', pass.length);
await page.screenshot({ path: '.smoke/login_picker_filled.png' });

await page.click('button[type="submit"]');
await page.waitForTimeout(400);
console.log('URL @400ms:', page.url());
await page.waitForTimeout(400);
console.log('URL @800ms:', page.url());
await page.waitForTimeout(1000);
console.log('URL @1800ms:', page.url());
await page.screenshot({ path: '.smoke/login_picker_success.png' });

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
