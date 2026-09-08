import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone 12-ish
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.screenshot({ path: '.smoke/mobile_home.png', fullPage: false });

await page.goto('http://localhost:5173/games/gm-1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.screenshot({ path: '.smoke/mobile_game_detail.png', fullPage: false });

// tablet
await page.setViewportSize({ width: 834, height: 1112 });
await page.goto('http://localhost:5173/tournaments/tn-1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.screenshot({ path: '.smoke/tablet_tournament.png', fullPage: false });

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
