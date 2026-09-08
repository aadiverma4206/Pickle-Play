import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

async function loginAsSuperAdmin() {
  await page.goto(base + '/home', { waitUntil: 'networkidle' });
  await page.locator('header button').last().click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: /Logout/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Ananya Bose/ }).click();
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
}

// --- Player side: community video upload (as default pre-authenticated
// player usr-1, who is already an active member of cm-1) ---
await page.goto(base + '/community/cm-1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.locator('select.w-40').selectOption('Video');
await page.waitForTimeout(150);
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles({ name: 'test-clip.webm', mimeType: 'video/webm', buffer: Buffer.from('fake video bytes for prototype test') });
await page.waitForTimeout(200);
await page.locator('textarea').first().fill('Check out this rally!');
await page.getByRole('button', { name: 'Post', exact: true }).click();
await page.waitForTimeout(400);
const videoTagCount = await page.locator('video').count();
console.log('Video element rendered in feed after posting:', videoTagCount > 0);
await page.screenshot({ path: '.smoke/community_video_post.png' });

await loginAsSuperAdmin();

// --- Admin: Create a game ---
await page.goto(base + '/admin/games', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Create Game' }).click();
await page.waitForTimeout(200);
await page.fill('input[placeholder="Evening Doubles Fun"]', 'Smoke Test Game');
const modalSelects = page.locator('form select');
await modalSelects.nth(0).selectOption({ label: 'Smash Point Pickleball Club' });
await page.waitForTimeout(150);
await modalSelects.nth(1).selectOption({ index: 1 });
await page.getByRole('button', { name: 'Publish Game' }).click();
await page.waitForTimeout(500);
const drawerTitle = await page.locator('h2').filter({ hasText: 'Smoke Test Game' }).count();
console.log('Drawer opened for new game:', drawerTitle > 0);
await page.screenshot({ path: '.smoke/admin_game_created.png' });

// --- Admin: Delete the game permanently (Super Admin only) ---
const deleteBtn = page.getByRole('button', { name: 'Delete Permanently' });
console.log('Delete Permanently button visible (Super Admin):', await deleteBtn.count() > 0);
await deleteBtn.click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Delete Permanently' }).last().click();
await page.waitForTimeout(500);
await page.goto(base + '/admin/games', { waitUntil: 'networkidle' });
const stillExists = await page.getByText('Smoke Test Game').count();
console.log('Game still listed after delete (should be 0):', stillExists);

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
