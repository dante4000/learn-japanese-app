# Kana Feedback Redesign — Mnemonics & Adaptive Teaching — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a wrong kana answer into a fast, researched, adaptively-deepening teaching moment — why you slipped, how to remember it, an example word — without breaking flow.

**Architecture:** A new dependency-free data module `kana-mnemonics.js` (browser/node dual export, research-generated) holds per-kana mnemonic, emoji, confusables, and curated example words. The wrong-answer branch of `checkAnswer` in `app.js` is rewritten into a staged renderer driven by how many times the learner has missed that specific kana (reusing existing `stats[kana].wrong`/`leech`). Examples resolve curated-first, falling back to the existing `WORDS` dataset. Pictures are emoji/CSS only.

**Tech Stack:** Vanilla JS (browser globals + `<script>` tags), Node test runner (`node --test`), Playwright e2e against `vercel dev`. No new runtime deps.

**Spec:** `docs/superpowers/specs/2026-05-30-kana-feedback-mnemonics-design.md`

---

## File Structure

- **Create** `kana-mnemonics.js` — content module: `const KANA_MNEMONICS = { '<kana>': { mnemonic, emoji, confusables:[{k,hint}], examples:[{w,r,m}] } }` for every single hiragana + katakana kana, with browser/node dual-export guards (mirrors `words-data.js`).
- **Create** `tools/validate-mnemonics.mjs` — schema/coverage validator (mirrors `tools/validate-words.mjs`): reads the file via `new Function`, asserts every base single kana is present with non-empty `mnemonic`, `emoji`, ≥1 `examples`, and that example romaji matches `kanaToRomaji(w)`.
- **Modify** `app.js` — fix the continue-after-miss bug; replace the wrong-answer branch with a staged renderer; add `resolveExamples()` (curated + `WORDS` fallback) and `whyLine()` (typed-vs-confusable).
- **Modify** `index.html` — add `<script src="kana-mnemonics.js" defer>` before `app.js`; add a `#miss-card` container under `#message`.
- **Modify** `styles.css` — styles for `#miss-card` stages (mnemonic line, confusable contrast, emoji picture, examples).
- **Modify** `tests/unit.mjs` — unit tests for `validate-mnemonics` coverage and the pure `whyLine` helper (exported from a small node-importable shim).
- **Modify** `tests/e2e.mjs` — assert miss renders mnemonic+example, escalates by stage, why-line reflects typed error, and space/click advance.

---

## Task 1: Fix the "press space to continue" bug

The continue affordance after a miss is currently broken. Root-cause before building on top.

**Files:**
- Modify: `app.js` (keydown handler ~696-721, `checkAnswer` ~356-399, `forceNext` ~401-412)
- Test: `tests/e2e.mjs`

- [ ] **Step 1: Invoke systematic-debugging.** Use the `superpowers:systematic-debugging` skill. Do NOT guess-patch.

- [ ] **Step 2: Write the failing e2e repro.** In `tests/e2e.mjs`, immediately after section `[2] Kana mode typing`, add:

```js
  /* ---------- 2b. wrong answer + space advances ---------- */
  console.log('\n[2b] Wrong answer then space advances');
  const beforeKana = (await page.locator('#kana').textContent()).trim();
  // type something guaranteed wrong (and not a prefix) for any kana
  await page.locator('#input-box').fill('zzz');
  await page.waitForTimeout(150);
  ok((await page.locator('#message').textContent()).length > 0, 'miss feedback shown');
  await page.locator('#input-box').press(' ');
  await page.waitForTimeout(200);
  const afterKana = (await page.locator('#kana').textContent()).trim();
  ok(afterKana !== beforeKana || (await page.locator('#input-box').inputValue()) === '',
     'space after a miss advanced to the next prompt');
```

- [ ] **Step 3: Reproduce.** Start `vercel dev` on :3000, run `node tests/e2e.mjs`. Confirm `[2b]` fails (or the miss never advances). Capture the actual root cause (e.g. `wrongOnCurrent` state, `e.target` guard, or message not clearing) in your notes.

- [ ] **Step 4: Fix the root cause in `app.js`.** Apply the minimal fix identified in Step 3 (do not rewrite unrelated logic). Ensure both `#input-box`-focused and body-focused space/enter advance after a miss.

- [ ] **Step 5: Verify.** Re-run `node tests/e2e.mjs`; `[2b]` passes and no prior assertions regressed.

- [ ] **Step 6: Commit.**

```bash
git add apps/japanese-trainer/app.js apps/japanese-trainer/tests/e2e.mjs
git commit -m "fix(kana-trainer): space/enter reliably advances after a miss"
```

---

## Task 2: Seed `kana-mnemonics.js` + validator (schema before content)

Stand up the data file and its validator with a small seed, so Task 3 fills a validated shape.

**Files:**
- Create: `kana-mnemonics.js`
- Create: `tools/validate-mnemonics.mjs`
- Test: `tests/unit.mjs`

- [ ] **Step 1: Create `kana-mnemonics.js` seed** (dual-export, mirrors `words-data.js` footer):

```js
// Mnemonic content for Kana mode miss-feedback. Research-generated.
// Each entry keyed by a single kana: { mnemonic, emoji, confusables:[{k,hint}], examples:[{w,r,m}] }
// Dakuten/handakuten/yōon derive their mnemonic from the base kana at runtime.
const KANA_MNEMONICS = {
  'し': {
    mnemonic: '"she" has a fishhook — one stroke hooking down then up-left',
    emoji: '🪝',
    confusables: [{ k: 'つ', hint: 'し hooks downward; つ swings across like a wave' }],
    examples: [
      { w: 'すし', r: 'sushi', m: 'sushi' },
      { w: 'しろ', r: 'shiro', m: 'white' },
      { w: 'あし', r: 'ashi', m: 'foot' },
    ],
  },
};

if (typeof window !== 'undefined') { window.KANA_MNEMONICS = KANA_MNEMONICS; }
if (typeof module !== 'undefined' && module.exports) { module.exports = { KANA_MNEMONICS }; }
```

- [ ] **Step 2: Create `tools/validate-mnemonics.mjs`:**

```js
// Validate kana-mnemonics.js: coverage + schema + example romaji consistency.
// Usage: node tools/validate-mnemonics.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kanaToRomaji } from './kana-romaji.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '..', 'kana-mnemonics.js'), 'utf8');
const { KANA_MNEMONICS } = new Function(src + '\nreturn { KANA_MNEMONICS };')();

const errors = [];
for (const [k, e] of Object.entries(KANA_MNEMONICS)) {
  if (!e.mnemonic || typeof e.mnemonic !== 'string') errors.push(`${k}: missing mnemonic`);
  if (!e.emoji) errors.push(`${k}: missing emoji`);
  if (!Array.isArray(e.examples) || e.examples.length < 1) errors.push(`${k}: needs >=1 example`);
  for (const ex of (e.examples || [])) {
    if (!ex.w || !ex.r || !ex.m) errors.push(`${k}: example missing w/r/m`);
    else if (kanaToRomaji(ex.w) !== String(ex.r).toLowerCase())
      errors.push(`${k}: example ${ex.w} reads "${kanaToRomaji(ex.w)}" not "${ex.r}"`);
  }
  for (const c of (e.confusables || [])) {
    if (!c.k || !c.hint) errors.push(`${k}: confusable missing k/hint`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${Object.keys(KANA_MNEMONICS).length} mnemonic entries valid`);
export { KANA_MNEMONICS };
```

- [ ] **Step 3: Add unit test** to `tests/unit.mjs` (append):

```js
test('kana-mnemonics: seed entry valid + romaji-consistent', async () => {
  const { KANA_MNEMONICS } = await import('../kana-mnemonics.js');
  const e = KANA_MNEMONICS['し'];
  assert.ok(e && e.mnemonic && e.emoji, 'し has mnemonic + emoji');
  assert.ok(e.examples.length >= 1, 'し has an example');
  assert.equal(kanaToRomaji(e.examples[0].w), e.examples[0].r);
});
```

- [ ] **Step 4: Run.** `node tools/validate-mnemonics.mjs` prints OK; `node --test tests/unit.mjs` passes.

- [ ] **Step 5: Commit.**

```bash
git add apps/japanese-trainer/kana-mnemonics.js apps/japanese-trainer/tools/validate-mnemonics.mjs apps/japanese-trainer/tests/unit.mjs
git commit -m "feat(kana-trainer): mnemonic data schema + validator (seed)"
```

---

## Task 3: Generate the full mnemonic dataset (research workflow)

Populate `kana-mnemonics.js` for every single hiragana + katakana kana using research agents, then validate. **This task is run by the orchestrator via the `Workflow` tool — the user explicitly opted into research agents.**

**Files:**
- Modify: `kana-mnemonics.js` (replace seed with full dataset)

- [ ] **Step 1: Run the research workflow.** Author and run a `Workflow` that:
  - Fans out across kana groups (hiragana vowels/k/s/t/n/h/m/y/r/w/n; same for katakana) — one research agent per group.
  - Each agent returns, per kana in its group, a structured record `{ kana, mnemonic, emoji, confusables:[{k,hint}], examples:[{w,r,m}] }` grounded in established systems (Tofugu "Learn Kana", Kanjidamage, Dr. Moku, Heisig-adjacent). Examples must be kana-only and decode via `kanaToRomaji`.
  - A verification stage adversarially checks each record (mnemonic maps to the actual shape/sound; emoji fits; confusable hint discriminates; example romaji correct).
  - Use a `schema` on each agent so records come back validated.
  Assemble all verified records into the `KANA_MNEMONICS` object and write `kana-mnemonics.js` (keep the dual-export footer).

- [ ] **Step 2: Coverage gate.** Ensure every base single kana in both scripts has an entry. Known confusable pairs that MUST carry a discriminating `hint`: し/つ, き/さ, ぬ/め, わ/れ/ね, は/ほ, る/ろ, ソ/ン, シ/ツ, ク/タ, ノ/メ/ホ.

- [ ] **Step 3: Validate.** `node tools/validate-mnemonics.mjs` exits 0. If any romaji mismatch, fix the example (the validator names the offender).

- [ ] **Step 4: Commit.**

```bash
git add apps/japanese-trainer/kana-mnemonics.js
git commit -m "feat(kana-trainer): research-generated mnemonic dataset (full kana coverage)"
```

---

## Task 4: Staged miss-feedback renderer in `app.js`

Replace the flat wrong-answer message with the adaptive renderer.

**Files:**
- Modify: `index.html` (script tag + `#miss-card` container)
- Modify: `app.js` (`checkAnswer` wrong branch; add helpers)
- Test: `tests/e2e.mjs`

- [ ] **Step 1: Wire data + container.** In `index.html`: add `<script src="kana-mnemonics.js" defer></script>` immediately before `<script src="app.js" defer></script>`. Under `<p id="message">` (line ~63), add:

```html
  <div id="miss-card" class="miss-card" hidden aria-live="polite"></div>
```

- [ ] **Step 2: Add helpers to `app.js`** (near the stroke helpers). `mnemonicFor` decomposes dakuten/combos to the base via the existing `strokeBaseChar`:

```js
function mnemonicFor(kana) {
  const M = (typeof KANA_MNEMONICS !== 'undefined') ? KANA_MNEMONICS : {};
  if (M[kana]) return M[kana];
  const base = strokeBaseChar(kana);           // NFD base for dakuten/handakuten
  if (M[base]) return M[base];
  if (kana.length > 1 && M[kana[0]]) return M[kana[0]]; // yōon → lead kana
  return null;
}

// Examples: curated on the record first, else words from WORDS containing the kana.
function resolveExamples(kana, rec, n = 3) {
  const out = (rec && rec.examples ? rec.examples.slice(0, n) : []);
  if (out.length >= n && typeof WORDS !== 'undefined') return out;
  if (typeof WORDS !== 'undefined') {
    for (const w of WORDS) {
      if (out.length >= n) break;
      if ((w.r || '').includes(kana) && !out.some((e) => e.w === w.r)) {
        out.push({ w: w.r, r: w.o, m: w.m });
      }
    }
  }
  return out;
}

// Why-line: did they type a known confusable's reading?
function whyLine(rec, typed) {
  if (!rec || !rec.confusables) return null;
  for (const c of rec.confusables) {
    const cr = mnemonicFor(c.k);
    const reading = (typeof KANA && KANA) ? null : null; // reading lookup below
    if (c.k && typed && (kanaReading(c.k) === typed)) return `You typed ${typed} — that's ${c.k}. ${c.hint}`;
  }
  return null;
}

// Reading for a single kana (search the KANA groups).
function kanaReading(ch) {
  for (const group of Object.values(KANA)) {
    if (group[ch]) return group[ch];
  }
  return null;
}
```

- [ ] **Step 3: Add the staged render** to `app.js`:

```js
function renderMiss(kana, reading, typed) {
  const rec = mnemonicFor(kana);
  const card = $('miss-card');
  card.textContent = '';
  card.hidden = false;
  const s = stats[kana] || { wrong: 1, leech: false };
  const stage = s.leech || s.wrong >= 3 ? 3 : (s.wrong >= 2 ? 2 : 1);

  const head = document.createElement('div');
  head.className = 'miss-head';
  const big = document.createElement('span'); big.className = 'miss-kana'; big.lang = 'ja'; big.textContent = kana;
  head.append(big, ` ✗ ${typed} → `, Object.assign(document.createElement('b'), { textContent: reading }));
  card.append(head);

  if (rec) {
    const mn = document.createElement('div'); mn.className = 'miss-mnemonic';
    mn.textContent = `${rec.emoji} ${rec.mnemonic}`;
    card.append(mn);
  }

  if (stage >= 2) {
    const why = whyLine(rec, typed) || (rec && rec.confusables && rec.confusables[0]
      ? `Mind ${rec.confusables[0].k}: ${rec.confusables[0].hint}` : null);
    if (why) { const w = document.createElement('div'); w.className = 'miss-why'; w.textContent = why; card.append(w); }
  }

  if (stage >= 3 && rec && rec.confusables && rec.confusables[0]) {
    const vs = document.createElement('div'); vs.className = 'miss-pic'; vs.lang = 'ja';
    vs.textContent = rec.emoji; card.append(vs);
  }

  const exN = stage >= 3 ? 3 : (stage === 2 ? 2 : 1);
  const exs = resolveExamples(kana, rec, exN);
  if (exs.length) {
    const ex = document.createElement('div'); ex.className = 'miss-ex';
    for (const e of exs) {
      const span = document.createElement('span'); span.className = 'miss-ex-item';
      const jp = document.createElement('span'); jp.lang = 'ja'; jp.className = 'jp'; jp.textContent = e.w;
      span.append(jp, ` ${e.r} · ${e.m}`);
      ex.append(span);
    }
    card.append(ex);
  }

  const hint = document.createElement('div'); hint.className = 'miss-hint';
  hint.textContent = 'press space to continue ›';
  card.append(hint);
}

function clearMiss() { const c = $('miss-card'); if (c) { c.hidden = true; c.textContent = ''; } }
```

- [ ] **Step 4: Rewrite the wrong branch of `checkAnswer`.** Replace the `if (!isPrefix) { ... }` block (app.js ~371-387) with:

```js
  if (!isPrefix) {
    if (!wrongOnCurrent) {
      wrongOnCurrent = true;
      recordResult(current[0], false);
    }
    $('message').textContent = '';
    renderMiss(current[0], reading, typed);
    return;
  }
```

- [ ] **Step 5: Clear the card on advance.** In `showKana()` add `clearMiss();` near the top (after `if (!next) return;`). Confirm `forceNext`/`checkAnswer`-correct both route through `showKana`.

- [ ] **Step 6: e2e assertions.** In `tests/e2e.mjs` extend section `[2b]`:

```js
  ok(await page.locator('#miss-card .miss-mnemonic').count() > 0, 'mnemonic shown on miss');
  ok(await page.locator('#miss-card .miss-ex-item').count() > 0, 'example word shown on miss');
```

- [ ] **Step 7: Run.** `node tests/e2e.mjs` — `[2b]` mnemonic + example assertions pass; space still advances; no regressions.

- [ ] **Step 8: Commit.**

```bash
git add apps/japanese-trainer/app.js apps/japanese-trainer/index.html apps/japanese-trainer/tests/e2e.mjs
git commit -m "feat(kana-trainer): adaptive staged miss feedback (mnemonic, why, examples)"
```

---

## Task 5: Styles for the miss card

**Files:**
- Modify: `styles.css` (after the `#message` / `.leech-badge` block ~272)

- [ ] **Step 1: Add styles:**

```css
.miss-card {
  max-width: 28rem;
  margin: 0.75rem auto 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--rule-dotted);
  border-radius: 12px;
  background: var(--header-band);
  text-align: left;
  font-size: 0.9rem;
}
.miss-card[hidden] { display: none; }
.miss-head { font-size: 1rem; }
.miss-head .miss-kana { font-size: 1.8rem; vertical-align: middle; }
.miss-head b { color: var(--ok, #2e8b57); }
.miss-mnemonic { margin-top: 0.4rem; color: var(--heading-strong); }
.miss-why { margin-top: 0.4rem; color: var(--danger); font-size: 0.85rem; }
.miss-pic { font-size: 2.5rem; text-align: center; margin: 0.5rem 0; }
.miss-ex { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem; color: var(--text-muted); }
.miss-ex-item .jp { font-size: 1.1rem; color: var(--heading-strong); }
.miss-hint { margin-top: 0.6rem; font-size: 0.8rem; color: var(--text-muted); }
```

- [ ] **Step 2: Verify dark + light.** Run `node tests/e2e.mjs`; review `tests/shots/01-kana-mode.png` and add a `shot(page, '0A-miss-card')` call in the `[2b]` block after the miss renders. Confirm legible in both themes.

- [ ] **Step 3: Commit.**

```bash
git add apps/japanese-trainer/styles.css apps/japanese-trainer/tests/e2e.mjs
git commit -m "style(kana-trainer): miss-card feedback styling"
```

---

## Task 6: Escalation + why-line e2e coverage

Prove the adaptive behavior and the typed-error why-line.

**Files:**
- Test: `tests/e2e.mjs`

- [ ] **Step 1: Add a focused escalation test.** Append a new section that drives the same kana to a miss three times using the app's own state. Because the next kana is weighted/random, force a known kana via the page API:

```js
  /* ---------- 2c. escalation + why-line ---------- */
  console.log('\n[2c] Miss escalation + why-line');
  // Force the current prompt to し so we can type its confusable つ-reading.
  await page.evaluate(() => {
    window.current = ['し', 'shi'];
    document.getElementById('kana').textContent = 'し';
    window.stats = window.stats || {};
    window.stats['し'] = { correct: 0, wrong: 1, lastSeen: 0, leech: false };
  });
  await page.locator('#input-box').fill('tsu');
  await page.waitForTimeout(150);
  ok((await page.locator('#miss-card .miss-mnemonic').textContent()).length > 0, 'stage1 mnemonic');
  await page.evaluate(() => { window.stats['し'].wrong = 3; window.stats['し'].leech = true; });
  await page.locator('#input-box').fill('');
  await page.locator('#input-box').fill('tsu');
  await page.waitForTimeout(150);
  ok(await page.locator('#miss-card .miss-why').count() > 0, 'stage3 shows a why-line');
  ok((await page.locator('#miss-card .miss-why').textContent()).toLowerCase().includes('tsu'),
     'why-line reflects the typed confusable (tsu)');
  ok(await page.locator('#miss-card .miss-ex-item').count() >= 2, 'stage3 shows multiple examples');
```

Note: this requires `current`, `stats`, `KANA`, `KANA_MNEMONICS` to be reachable on `window`. In `app.js` `init()` (or module scope), expose for tests: `if (typeof window !== 'undefined') Object.assign(window, { current: null, stats, KANA });` — assign `window.current`/`window.stats` via setters is fragile, so instead read module state through accessors. Simplest: add at end of `app.js`: `window.__kana = { get current(){return current;}, set current(v){current=v;}, get stats(){return stats;}, set stats(v){stats=v;}, KANA };` and update the test to use `window.__kana`.

- [ ] **Step 2: Reconcile the test with the chosen accessor.** Use `window.__kana` in the `page.evaluate` blocks above (`window.__kana.current = ['し','shi']`, `window.__kana.stats['し'] = ...`).

- [ ] **Step 3: Run.** `node tests/e2e.mjs` — `[2c]` passes.

- [ ] **Step 4: Commit.**

```bash
git add apps/japanese-trainer/app.js apps/japanese-trainer/tests/e2e.mjs
git commit -m "test(kana-trainer): escalation + typed-confusable why-line e2e"
```

---

## Task 7: Full verification + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Full suite.** Run `node --test tests/unit.mjs`, `node tools/validate-mnemonics.mjs`, `node tools/validate-words.mjs`, and `node tests/e2e.mjs` (with `vercel dev` running). All green.

- [ ] **Step 2: Manual smoke** (use the `run` skill or `vercel dev`): in Kana mode, type a wrong reading → confirm mnemonic + example appear and space advances; miss the same kana repeatedly → confirm it deepens (why-line, picture, more examples); confirm dark mode legibility.

- [ ] **Step 3: Update docs.** In `index.html` Help/About copy (~514) replace the "read a Tofugu mnemonic" sentence with a line noting the trainer now shows a built-in mnemonic, the confusable tell, and example words on a miss, deepening if you keep missing.

- [ ] **Step 4: Commit.**

```bash
git add apps/japanese-trainer/index.html
git commit -m "docs(kana-trainer): describe built-in adaptive miss feedback"
```

---

## Self-Review Notes

- **Spec coverage:** content layer (Task 2/3), staged renderer (Task 4), why-line (Task 4/6), continue bug (Task 1), emoji pictures (Task 4/5), research workflow (Task 3), testing (Task 4/6/7) — all mapped.
- **Example fallback** (`resolveExamples`) uses `WORDS` `r`/`o`/`m` fields per `words-data.js` schema.
- **Dakuten/combo** mnemonics derive via `strokeBaseChar` (already in `app.js`) and lead-kana fallback.
- **Test reachability** of module state resolved via the `window.__kana` accessor (Task 6, Step 1).
