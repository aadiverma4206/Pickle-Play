import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`); });

async function shot(path, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path });
  console.log('URL:', page.url(), '-> screenshot:', path);
}

const base = 'http://localhost:5173';
await shot('home.png', `${base}/home`);
await shot('games.png', `${base}/games`);
await shot('game-detail.png', `${base}/games/gm-1`);
await shot('admin-redirect.png', `${base}/admin`);

console.log('--- Console/Page errors ---');
console.log(errors.length ? errors.join('\n') : 'none');

await browser.close();
