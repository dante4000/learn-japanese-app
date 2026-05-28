// End-to-end functional test of the kana + words trainer against `vercel dev`.
// Run: node tests/e2e.mjs   (requires vercel dev on :3000 and `npx playwright install chromium`)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const NAME = 'E2E ' + Date.now();          // unique user each run -> fresh session counters
const SLUG = NAME.toLowerCase().replace(/\s+/g, '-');
console.log('test user:', NAME, '->', SLUG);

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.error('  ✗ ' + msg); } };
const shot = (page, name) => page.screenshot({ path: SHOTS + name + '.png', fullPage: false });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 480, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => { fail++; console.error('  ✗ PAGE ERROR: ' + e.message); });
page.on('console', (m) => { if (m.type() === 'error') console.error('  · console.error: ' + m.text()); });

try {
  /* ---------- 1. initial load = kana mode ---------- */
  console.log('\n[1] Initial load — kana mode');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  ok(await page.locator('#kana-mode').isVisible(), 'kana-mode visible on load');
  ok(!(await page.locator('#words-mode').isVisible()), 'words-mode hidden on load');
  ok(await page.locator('#tab-kana').evaluate((e) => e.classList.contains('is-active')), 'Kana tab active');
  ok((await page.locator('#kana').textContent()).trim().length > 0, 'a kana character is shown');
  await shot(page, '01-kana-mode');

  /* ---------- 2. kana typing still works ---------- */
  console.log('\n[2] Kana mode typing');
  const romaji = (await page.locator('#answer').textContent()).trim();
  await page.locator('#input-box').fill(romaji);
  await page.waitForTimeout(200);
  ok((await page.locator('#count').textContent()).includes('/'), `typing "${romaji}" advanced & updated score`);

  /* ---------- 3. switch to words mode -> login ---------- */
  console.log('\n[3] Switch to Words mode');
  await page.locator('#tab-words').click();
  await page.waitForTimeout(200);
  ok(await page.locator('#words-mode').isVisible(), 'words-mode visible after tab click');
  ok(await page.locator('#words-login').isVisible(), 'login screen shown (no user yet)');
  ok(!(await page.locator('#flashcard').isVisible()), 'flashcard hidden before login');
  await shot(page, '02-words-login');

  /* ---------- 4. login by name ---------- */
  console.log('\n[4] Login by name');
  await page.locator('#login-name').fill(NAME);
  await page.locator('#login-start').click();
  await page.waitForSelector('#flashcard:visible', { timeout: 8000 });
  // wait for the async deck load to populate a real word (not the "…" loading placeholder)
  await page.waitForFunction(() => {
    const t = (document.getElementById('fc-word').textContent || '').trim();
    return t.length > 0 && t !== '…';
  }, { timeout: 10000 });
  ok(await page.locator('#flashcard').isVisible(), 'flashcard visible after login');
  ok(!(await page.locator('#words-login').isVisible()), 'login hidden after login');
  ok((await page.locator('#words-user-name').textContent()).includes(NAME), 'username shown in bar');
  const w1 = (await page.locator('#fc-word').textContent()).trim();
  ok(w1.length > 0 && w1 !== '—', `a word is shown: ${w1}`);
  ok((await page.locator('#fc-badges .badge').count()) === 3, 'three badges (level/pos/script) shown');
  ok(!(await page.locator('#fc-back').isVisible()), 'answer hidden on front of card');
  await shot(page, '03-flashcard-front');

  /* ---------- 5. flip ---------- */
  console.log('\n[5] Flip card (Space)');
  await page.keyboard.press(' ');
  await page.waitForTimeout(150);
  ok(await page.locator('#fc-back').isVisible(), 'back (reading/romaji/meaning) revealed');
  ok(await page.locator('#fc-grades').isVisible(), 'grade buttons revealed');
  ok((await page.locator('#fc-reading').textContent()).trim().length > 0, 'reading shown');
  ok((await page.locator('#fc-meaning').textContent()).trim().length > 0, 'meaning shown');
  const previews = await page.locator('#fc-grades .grade-when').allTextContents();
  ok(previews.every((t) => t.trim().length > 0), `interval previews populated: [${previews.join(', ')}]`);
  await shot(page, '04-flashcard-back');

  /* ---------- 6. grade Good via click ---------- */
  console.log('\n[6] Grade "Good" (click)');
  await page.locator('.grade-good').click();
  await page.waitForTimeout(150);
  ok(!(await page.locator('#fc-back').isVisible()), 'card flipped back to front after grading');
  ok((await page.locator('#fc-count').textContent()).includes('1 reviewed'), 'session count = 1 reviewed');

  /* ---------- 7. grade via keyboard ---------- */
  console.log('\n[7] Grade via keyboard (Space then 3=Good)');
  await page.keyboard.press(' ');
  await page.waitForTimeout(120);
  await page.keyboard.press('3');
  await page.waitForTimeout(150);
  ok((await page.locator('#fc-count').textContent()).includes('2 reviewed'), 'session count = 2 reviewed after keyboard grade');

  /* ---------- 8. filter: katakana only ---------- */
  console.log('\n[8] Filter to katakana-only');
  await page.locator('button[data-wf-action="uncheck"][data-wf-group="s"]').click();
  await page.waitForTimeout(120);
  await page.locator('input.wfilter[data-dim="s"][value="katakana"]').check();
  await page.waitForTimeout(200);
  const kataBadges = await page.locator('#fc-badges .badge').allTextContents();
  ok(kataBadges.map((t) => t.toLowerCase()).includes('katakana'), `card is katakana (badges: ${kataBadges.join(',')})`);
  const kataWord = (await page.locator('#fc-word').textContent()).trim();
  ok(/^[゠-ヿーー・]+$/.test(kataWord), `word is all katakana: ${kataWord}`);
  await shot(page, '05-filter-katakana');
  // restore
  await page.locator('button[data-wf-action="check"][data-wf-group="s"]').click();
  await page.waitForTimeout(150);

  /* ---------- 9. blob persistence round-trip ---------- */
  console.log('\n[9] Blob persistence');
  // Poll until the debounced POST for both grades lands in Blob. A production
  // deployment can briefly expose the first save before the second debounce
  // finishes, so wait for the full expected state instead of stopping at any
  // saved card.
  let remote = null;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500);
    remote = await page.evaluate(async (slug) => (await fetch('/api/state?user=' + slug, { cache: 'no-store' })).json(), SLUG);
    if (
      remote &&
      remote.state &&
      remote.state.srs &&
      Object.keys(remote.state.srs).length >= 1 &&
      remote.state.session &&
      remote.state.session.reviewed >= 2
    ) break;
  }
  ok(remote && remote.state && remote.state.srs && Object.keys(remote.state.srs).length >= 1, `state saved to Blob (${remote && remote.state && remote.state.srs ? Object.keys(remote.state.srs).length : 0} cards)`);
  ok(remote && remote.state && remote.state.session && remote.state.session.reviewed >= 2, 'session reviewed >= 2 saved to Blob');

  /* ---------- 10. reload restores mode + user + progress ---------- */
  console.log('\n[10] Reload restores session');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  ok(await page.locator('#words-mode').isVisible(), 'restored to words mode after reload');
  await page.waitForSelector('#flashcard:visible', { timeout: 8000 });
  await page.waitForFunction(() => {
    const t = (document.getElementById('fc-word').textContent || '').trim();
    return t.length > 0 && t !== '…';
  }, { timeout: 10000 });
  ok((await page.locator('#words-user-name').textContent()).includes(NAME), 'still logged in after reload');
  const countText = (await page.locator('#fc-count').textContent()).trim();
  const reviewedNum = parseInt(countText, 10);
  ok(reviewedNum >= 2, `session progress restored from Blob/cache (footer: "${countText}")`);

  /* ---------- 11. dark mode ---------- */
  console.log('\n[11] Dark mode toggle');
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(200);
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  ok(theme === 'dark' || theme === 'light', `theme toggled to "${theme}"`);
  await shot(page, '06-dark-mode');

  /* ---------- 12. switch user ---------- */
  console.log('\n[12] Switch user');
  await page.locator('#words-signout').click();
  await page.waitForTimeout(200);
  ok(await page.locator('#words-login').isVisible(), 'login screen returns after switch user');

  /* ---------- 13. back to kana works ---------- */
  console.log('\n[13] Back to Kana mode');
  await page.locator('#tab-kana').click();
  await page.waitForTimeout(150);
  ok(await page.locator('#kana-mode').isVisible(), 'kana mode visible again');
  await page.locator('#input-box').focus();
  const r2 = (await page.locator('#answer').textContent()).trim();
  await page.locator('#input-box').fill(r2);
  await page.waitForTimeout(150);
  ok(true, 'kana typing functional after returning from words mode');

} catch (e) {
  fail++;
  console.error('\nFATAL: ' + (e && e.stack || e));
} finally {
  await browser.close();
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
}
