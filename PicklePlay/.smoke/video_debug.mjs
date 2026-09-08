import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(base + '/community/cm-1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.locator('select.w-40').selectOption('Video');
await page.waitForTimeout(200);
await page.screenshot({ path: '.smoke/video_debug_1_after_select.png' });

const fileInput = page.locator('input[type="file"]');
console.log('file input count:', await fileInput.count());
await fileInput.setInputFiles({ name: 'test-clip.webm', mimeType: 'video/webm', buffer: Buffer.from('fake video bytes for prototype test') });
await page.waitForTimeout(300);
await page.screenshot({ path: '.smoke/video_debug_2_after_file.png' });

console.log('preview video tag count:', await page.locator('video').count());

await page.locator('textarea').first().fill('Check out this rally!');
await page.waitForTimeout(150);
console.log('video tag count after filling caption:', await page.locator('video').count());
await page.screenshot({ path: '.smoke/video_debug_3_after_caption.png' });

await page.getByRole('button', { name: 'Post', exact: true }).click();
await page.waitForTimeout(500);
console.log('video tag count after clicking Post:', await page.locator('video').count());
await page.screenshot({ path: '.smoke/video_debug_4_after_post.png', fullPage: true });

await browser.close();
