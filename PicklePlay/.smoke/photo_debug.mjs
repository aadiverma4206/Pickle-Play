import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

// A real, valid 1x1 red PNG (base64), so the <img> actually decodes successfully.
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

await page.goto(base + '/community/cm-1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.locator('select.w-40').selectOption('Photo');
await page.waitForTimeout(150);
await page.locator('input[type="file"]').setInputFiles({ name: 'real.png', mimeType: 'image/png', buffer: Buffer.from(PNG_BASE64, 'base64') });
await page.waitForTimeout(200);
await page.locator('textarea').first().fill('A real photo attachment.');
await page.getByRole('button', { name: 'Post', exact: true }).click();
await page.waitForTimeout(500);
console.log('img tag count in feed after posting a real PNG:', await page.locator('img[alt="Post attachment"]').count());
await page.screenshot({ path: '.smoke/photo_debug_success.png' });

await browser.close();
