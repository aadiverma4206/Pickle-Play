import { chromium } from 'playwright';

const base = 'http://localhost:5173';
const errors = []; // { route, msg }
let currentRoute = 'startup';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (err) => errors.push({ route: currentRoute, msg: `[pageerror] ${err.message}` }));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push({ route: currentRoute, msg: `[console] ${msg.text()}` });
});

async function visit(path) {
  currentRoute = path;
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(300);
}

// Switch via the in-app account switcher — only works for Player targets
// unless the CURRENT session is already Super Admin (by design).
async function switchTo(name) {
  currentRoute = `switch-to:${name}`;
  const toggle = page.locator('header button').last();
  await toggle.click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: new RegExp(name) }).first().click();
  await page.waitForTimeout(300);
}

// Reach a non-Player role the "real" way: log out, then log in via the
// login page's quick demo picker (Super Admin / Club Manager only) or a
// typed email (any role, e.g. Finance/Community Admin which the picker
// intentionally omits).
async function loginAs(email) {
  currentRoute = `login-as:${email}`;
  await visit('/home');
  await page.locator('header button').last().click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: /Logout/ }).click();
  await page.waitForTimeout(300);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
}

const PLAYER_ROUTES = [
  '/home', '/games', '/games/mine', '/games/gm-1', '/games/gm-3',
  '/courts', '/courts/clb-1', '/bookings',
  '/community', '/community/cm-1',
  '/tournaments', '/tournaments/tn-1', '/tournaments/tn-2',
  '/performance', '/leaderboard', '/achievements', '/head-to-head',
  '/notifications', '/support', '/profile', '/profile/usr-2', '/settings',
];

const ADMIN_ROUTES = [
  '/admin', '/admin/users', '/admin/users/usr-1',
  '/admin/clubs', '/admin/clubs/clb-1',
  '/admin/games', '/admin/bookings',
  '/admin/tournaments', '/admin/tournaments/tn-1', '/admin/tournaments/tn-2',
  '/admin/communities', '/admin/finance', '/admin/support', '/admin/reports',
  '/admin/settings', '/admin/audit', '/admin/roles',
];

console.log('--- Player routes (default user, usr-1) ---');
for (const r of PLAYER_ROUTES) {
  await visit(r);
  console.log('visited', r);
}
await page.screenshot({ path: '.smoke/full_player_home.png' });

console.log('--- Logging in as Super Admin ---');
await loginAs('super.admin@pickleplay.app');
for (const r of ADMIN_ROUTES) {
  await visit(r);
  console.log('visited (super admin)', r);
}
await page.screenshot({ path: '.smoke/full_admin_dashboard.png' });
await visit('/admin/tournaments/tn-1');
await page.screenshot({ path: '.smoke/full_admin_tournament_manage.png' });

console.log('--- Super Admin switching to Club Manager (Sanjay Gupta) ---');
await visit('/home');
await switchTo('Sanjay Gupta');
await visit('/admin');
await page.screenshot({ path: '.smoke/full_club_manager_dashboard.png' });
for (const r of ['/admin/clubs', '/admin/finance', '/admin/roles', '/admin/bookings']) {
  await visit(r);
  console.log('visited (club manager)', r);
}

console.log('--- Logging in directly as Finance Admin (not in the quick picker by design) ---');
await loginAs('finance.admin@pickleplay.app');
await visit('/admin/finance');
await page.screenshot({ path: '.smoke/full_finance_admin.png' });

console.log('--- Logging in directly as Community Admin (not in the quick picker by design) ---');
await loginAs('karan.community@pickleplay.app');
await visit('/admin/communities');
await page.screenshot({ path: '.smoke/full_community_admin.png' });

console.log('\n=== ERRORS ===');
if (errors.length === 0) {
  console.log('NONE');
} else {
  const byRoute = {};
  for (const e of errors) (byRoute[e.route] ||= []).push(e.msg);
  for (const [route, msgs] of Object.entries(byRoute)) {
    console.log(`\n[${route}]`);
    [...new Set(msgs)].forEach((m) => console.log('  ' + m));
  }
}

await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
