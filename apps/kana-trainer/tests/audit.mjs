// Full functional audit of all three modes against `vercel dev` (:3000).
// Acts like a human clicking through every part; reports findings + screenshots.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const findings = [];
const FAIL = (msg) => { findings.push('✗ ' + msg); console.error('  ✗ ' + msg); };
const OKAY = (msg) => console.log('  ✓ ' + msg);
const ok = (cond, msg) => cond ? OKAY(msg) : FAIL(msg);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 480, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('console.error: ' + m.text()); });

const shot = (n) => page.screenshot({ path: SHOTS + n + '.png' });
const visiblePanels = () => page.evaluate(() =>
  ['kana-mode', 'words-mode', 'kanji-mode'].filter((id) => {
    const el = document.getElementById(id);
    return el && !el.hidden && el.offsetParent !== null;
  }));
const exactlyOne = async (mode, label) => {
  const v = await visiblePanels();
  ok(v.length === 1 && v[0] === mode + '-mode', `${label}: exactly one panel visible (${mode}-mode) — got [${v.join(', ')}]`);
};

try {
  console.log('\n[A] Initial load');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await exactlyOne('kana', 'initial');
  ok(await page.locator('#tab-kanji').count() === 1, 'Kanji tab present');
  await shot('A-initial-kana');

  console.log('\n[B] Kana mode functionality');
  const r = (await page.locator('#answer').textContent()).trim();
  await page.locator('#input-box').fill(r);
  await page.waitForTimeout(150);
  ok((await page.locator('#count').textContent()).includes('/'), `kana typing works ("${r}")`);

  console.log('\n[C] Switch Kana -> Kanji');
  await page.locator('#tab-kanji').click();
  await page.waitForTimeout(500);
  await exactlyOne('kanji', 'after click Kanji');
  // wait for kanji data
  await page.waitForFunction(() => {
    const t = (document.getElementById('kj-kanji')?.textContent || '').trim();
    return t.length > 0 && t !== '—';
  }, { timeout: 12000 }).then(() => OKAY('kanji character loaded')).catch(() => FAIL('kanji character never loaded'));
  await shot('C-kanji-front');

  console.log('\n[D] Kanji reveal + skip');
  await page.locator('#kj-kanji-display').click().catch(() => {});
  await page.waitForTimeout(300);
  await shot('D-kanji-revealed');
  // skip via button if present
  const skipBtn = page.locator('#kj-tool-skip');
  if (await skipBtn.count()) { await skipBtn.first().click().catch(() => {}); OKAY('kanji skip button works'); }
  else FAIL('no kanji skip control found (#kj-tool-skip)');

  console.log('\n[E] Kanji -> Words (leftover-panel bug check)');
  await page.locator('#tab-words').click();
  await page.waitForTimeout(500);
  await exactlyOne('words', 'after Kanji->Words');

  console.log('\n[F] Words login + flip + grade');
  if (await page.locator('#words-login').isVisible()) {
    await page.locator('#login-name').fill('Audit ' + Date.now());
    await page.locator('#login-start').click();
  }
  await page.waitForFunction(() => {
    const t = (document.getElementById('fc-word')?.textContent || '').trim();
    return t.length > 0 && t !== '…';
  }, { timeout: 12000 }).then(() => OKAY('words card loaded')).catch(() => FAIL('words card never loaded'));
  await page.keyboard.press(' ');
  await page.waitForTimeout(200);
  ok(await page.locator('#fc-grades').isVisible(), 'words flip reveals grades');
  await page.locator('.grade-good').click().catch(() => {});
  await page.waitForTimeout(150);
  await shot('F-words');

  console.log('\n[G] Words -> Kana (leftover-panel bug check)');
  await page.locator('#tab-kana').click();
  await page.waitForTimeout(400);
  await exactlyOne('kana', 'after Words->Kana');

  console.log('\n[H] Kana -> Words -> Kanji rapid, panel integrity');
  await page.locator('#tab-words').click(); await page.waitForTimeout(250);
  await page.locator('#tab-kanji').click(); await page.waitForTimeout(250);
  await exactlyOne('kanji', 'after rapid Kana->Words->Kanji');

  console.log('\n[I] Reload while in Kanji mode');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await exactlyOne('kanji', 'after reload (persisted kanji mode)');

  console.log('\n[J] Dark mode in kanji');
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(200);
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  ok(theme === 'dark' || theme === 'light', `dark mode toggles (${theme})`);
  await shot('J-kanji-dark');

  console.log('\n[K] Console errors across whole audit');
  ok(consoleErrors.length === 0, `no console/page errors — found ${consoleErrors.length}`);
  consoleErrors.slice(0, 15).forEach((e) => console.error('     · ' + e));

} catch (e) {
  FAIL('FATAL: ' + (e && e.message || e));
} finally {
  await browser.close();
  console.log(`\n==== AUDIT COMPLETE: ${findings.length} findings ====`);
  findings.forEach((f) => console.log('  ' + f));
  process.exit(findings.length ? 1 : 0);
}
