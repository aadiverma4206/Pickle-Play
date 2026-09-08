import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

// As default player (usr-1, organizer of gm-1), confirm Edit button appears.
await page.goto(base + '/games/gm-1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
console.log('Organizer sees Edit Game button:', await page.getByRole('button', { name: 'Edit Game' }).count() > 0);
await page.getByRole('button', { name: 'Edit Game' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: '.smoke/organizer_edit_modal.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// Log in as Super Admin, view a game organized by someone else (gm-1, organizer usr-1/Amit Verma).
await page.locator('header button').last().click();
await page.waitForTimeout(150);
await page.getByRole('button', { name: /Logout/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Ananya Bose/ }).click();
await page.click('button[type="submit"]');
await page.waitForTimeout(500);

await page.goto(base + '/games/gm-1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
console.log('Admin viewer sees oversight banner:', await page.getByText('viewing this with admin oversight').count() > 0);
console.log('Admin viewer sees Cancel Game:', await page.getByRole('button', { name: 'Cancel Game' }).count() > 0);
console.log('Admin viewer sees Delete Permanently:', await page.getByRole('button', { name: 'Delete Permanently' }).count() > 0);
console.log('Admin viewer does NOT see Join Game:', await page.getByRole('button', { name: 'Join Game' }).count() === 0);
await page.screenshot({ path: '.smoke/admin_viewer_gamepage.png' });

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
