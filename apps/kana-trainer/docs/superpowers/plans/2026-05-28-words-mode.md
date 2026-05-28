# Words Mode (Anki-style Vocabulary Trainer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second trainer mode to the kana-trainer site — an Anki-style spaced-repetition flashcard deck of thousands of verified Japanese words (hiragana, katakana, and kanji words), each with reading + romaji + English meaning, with filtering by script / JLPT level / part-of-speech and a Kana ⇄ Words mode switch on the same page.

**Architecture:** The site stays a dependency-free static site (plain HTML/CSS/JS, deployed on Vercel). The existing kana quiz (`app.js`) is left almost entirely intact and becomes the "Kana" mode panel. A new self-contained `words.js` module implements an Anki-like scheduler (SM-2 with learning steps), a filtered card pool, a flip-to-reveal flashcard UI, and the page-level mode switch. The vocabulary lives in a generated `words-data.js` global array, produced by fanning out parallel generation subagents (partitioned by JLPT level × script/category), then deduped and machine-validated. The two modes share the page's theme and `localStorage`, namespaced under distinct prefixes (`kt.*` for kana, `wt.*` for words).

**Tech Stack:** Vanilla HTML/CSS/ES (no build step, no framework, no package.json runtime deps). Node.js used only at authoring time to run a one-off dataset validator. `localStorage` for persistence. `speechSynthesis` (`ja-JP`) for audio, reused from the kana mode pattern.

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `index.html` | Add mode tabs; wrap existing quiz+options in `#kana-mode`; add `#words-mode` panel (flashcard + words filters); load new scripts | Modify |
| `styles.css` | Mode tabs (segmented control), flashcard front/back, grade buttons, filter chips, words stats — all using existing CSS custom properties | Modify (append) |
| `app.js` | Guard the global `keydown` handler so it only acts in Kana mode | Modify (surgical) |
| `words-data.js` | `const WORDS = [...]` — the generated, validated vocabulary dataset (thousands of entries) + `const WORD_POS_ORDER` metadata | Create |
| `words.js` | Words-mode engine: SM-2 scheduler, filtered pool, persistence, flashcard render/flip/grade, keyboard, audio, and the page-level mode switch controller | Create |
| `tools/validate-words.mjs` | One-off Node validator: schema, dedupe, script-tag correctness, kana→romaji consistency check. Authoring-time only; not shipped to the browser | Create |
| `docs/superpowers/plans/2026-05-28-words-mode.md` | This plan | Create (done) |

### Data schema (one entry in `WORDS`)

Compact keys keep the shipped file small while staying readable:

```js
{
  w:   "新しい",      // FRONT of card — word as normally written (kanji / kana / katakana)
  r:   "あたらしい",   // kana reading (furigana)
  o:   "atarashii",  // romaji (Hepburn)
  m:   "new",        // concise English meaning
  lvl: "N5",         // JLPT level: "N5" | "N4" | "N3" | "N2" | "N1"
  pos: "adjective",  // part of speech / category (see WORD_POS_ORDER)
  s:   "kanji"       // script class: "kanji" (contains ≥1 kanji) | "hiragana" | "katakana"
}
```

`WORD_POS_ORDER` (canonical category list, drives filter UI order):
```js
const WORD_POS_ORDER = ["noun","verb","adjective","adverb","expression","other"];
```

Filter dimensions: `s` (script — 3 options), `lvl` (5 options), `pos` (6 options). A card is in the active pool iff its `s` **and** `lvl` **and** `pos` are all currently checked.

### localStorage keys (words mode — all `wt.*`)

```
wt.srs       JSON: { "<id>": {ease,interval,due,reps,lapses,stage,step}, ... }  (per-card SM-2 state)
wt.session   JSON: { reviewed, again, correct }                                  (running session counters)
wt.filter.s.<script>   "1" | "0"     per-script checkbox
wt.filter.lvl.<level>  "1" | "0"     per-level checkbox
wt.filter.pos.<pos>    "1" | "0"     per-category checkbox
kt.mode      "kana" | "words"        active page mode (shared key; theme stays kt.theme)
```

Card `id` = `` `${w}|${r}` `` (word + reading) — stable, unique after dedupe, survives dataset reordering.

---

## Task 1: HTML scaffolding — mode tabs + panels

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update `<title>` and meta description** (line 8–9)

```html
<title>Kana Trainer — practice hiragana, katakana &amp; vocabulary</title>
<meta name="description" content="A fast, mobile-friendly trainer for hiragana, katakana, and Japanese vocabulary. Drill kana by typing romaji, or learn thousands of words with an Anki-style spaced-repetition flashcard deck. Dark mode included." />
```

- [ ] **Step 2: Add the mode-switch tablist** immediately after the closing `</header>` (after line 28), before `<main>`:

```html
<nav class="mode-tabs" role="tablist" aria-label="Trainer mode">
  <button id="tab-kana"  class="mode-tab is-active" role="tab" type="button" aria-selected="true"  aria-controls="kana-mode">Kana</button>
  <button id="tab-words" class="mode-tab"           role="tab" type="button" aria-selected="false" aria-controls="words-mode">Words</button>
</nav>
```

- [ ] **Step 3: Open the Kana-mode wrapper.** Immediately after `<main>` (line 30), add:

```html
<div id="kana-mode" class="mode-panel" role="tabpanel" aria-labelledby="tab-kana">
```

- [ ] **Step 4: Close the Kana-mode wrapper.** The existing `#options` section ends with `</section>` (line 516). Immediately after that `</section>`, add the closing tag and open the Words panel (full markup in Step 5):

```html
</div><!-- /#kana-mode -->
```

- [ ] **Step 5: Add the Words-mode panel** right after the `</div><!-- /#kana-mode -->` from Step 4:

```html
<div id="words-mode" class="mode-panel" role="tabpanel" aria-labelledby="tab-words" hidden>

  <section id="flashcard" class="card" aria-label="Vocabulary flashcard">
    <div class="fc-badges" id="fc-badges"></div>

    <div id="fc-display" class="fc-display" role="button" tabindex="0" aria-label="Flip card to reveal reading and meaning">
      <div class="fc-word" id="fc-word"></div>
      <div class="fc-back" id="fc-back" hidden>
        <div class="fc-reading" id="fc-reading"></div>
        <div class="fc-romaji" id="fc-romaji"></div>
        <div class="fc-meaning" id="fc-meaning"></div>
      </div>
      <p class="fc-hint" id="fc-hint">Tap the card (or press Space) to reveal.</p>
    </div>

    <div id="fc-grades" class="fc-grades" hidden>
      <button type="button" class="grade-btn grade-again" data-grade="0"><span class="grade-label">Again</span><span class="grade-when" data-when="0"></span></button>
      <button type="button" class="grade-btn grade-hard"  data-grade="1"><span class="grade-label">Hard</span><span class="grade-when" data-when="1"></span></button>
      <button type="button" class="grade-btn grade-good"  data-grade="2"><span class="grade-label">Good</span><span class="grade-when" data-when="2"></span></button>
      <button type="button" class="grade-btn grade-easy"  data-grade="3"><span class="grade-label">Easy</span><span class="grade-when" data-when="3"></span></button>
    </div>

    <div class="quiz-footer">
      <ul id="fc-tools">
        <li><button id="fc-sound" type="button">Play sound</button></li>
        <li><button id="fc-skip" type="button">Skip</button></li>
      </ul>
      <div id="fc-count" class="fc-count" aria-live="polite"></div>
    </div>
  </section>

  <section id="words-options" class="card">
    <details id="words-options-details" open>
      <summary><span>Filters</span><span class="hint">show / hide</span></summary>
      <div class="options-body">

        <h3>Script
          <span class="rowtools">
            <button type="button" data-wf-action="check" data-wf-group="s">check all</button>
            <span class="sep">|</span>
            <button type="button" data-wf-action="uncheck" data-wf-group="s">uncheck all</button>
          </span>
        </h3>
        <div class="filter-chips" data-wf-group="s">
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="s" value="kanji" checked /> <span>Kanji words</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="s" value="hiragana" checked /> <span>Hiragana words</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="s" value="katakana" checked /> <span>Katakana words</span></label>
        </div>

        <h3>JLPT level
          <span class="rowtools">
            <button type="button" data-wf-action="check" data-wf-group="lvl">check all</button>
            <span class="sep">|</span>
            <button type="button" data-wf-action="uncheck" data-wf-group="lvl">uncheck all</button>
          </span>
        </h3>
        <div class="filter-chips" data-wf-group="lvl">
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="lvl" value="N5" checked /> <span>N5</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="lvl" value="N4" checked /> <span>N4</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="lvl" value="N3" checked /> <span>N3</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="lvl" value="N2" /> <span>N2</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="lvl" value="N1" /> <span>N1</span></label>
        </div>

        <h3>Category
          <span class="rowtools">
            <button type="button" data-wf-action="check" data-wf-group="pos">check all</button>
            <span class="sep">|</span>
            <button type="button" data-wf-action="uncheck" data-wf-group="pos">uncheck all</button>
          </span>
        </h3>
        <div class="filter-chips" data-wf-group="pos">
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="pos" value="noun" checked /> <span>Nouns</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="pos" value="verb" checked /> <span>Verbs</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="pos" value="adjective" checked /> <span>Adjectives</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="pos" value="adverb" checked /> <span>Adverbs</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="pos" value="expression" checked /> <span>Expressions</span></label>
          <label class="chip"><input type="checkbox" class="wfilter" data-dim="pos" value="other" checked /> <span>Other</span></label>
        </div>

        <p class="font-help" id="pool-summary"></p>

        <h3>How this deck works</h3>
        <div class="prose">
          <p>This is an <strong>Anki-style</strong> spaced-repetition deck. Each card shows a word; tap to flip and reveal its reading, romaji, and meaning. Then grade how well you knew it: <em>Again</em>, <em>Hard</em>, <em>Good</em>, or <em>Easy</em>.</p>
          <p>New cards start with short <strong>learning steps</strong> (minutes) and graduate to day-scale intervals once you get them right. Cards you find easy come back rarely; cards you miss reset to short intervals and resurface quickly. Schedules persist in your browser's localStorage.</p>
          <p class="kbd-hint">Keyboard: <kbd>Space</kbd> flips; then <kbd>1</kbd> Again, <kbd>2</kbd> Hard, <kbd>3</kbd> Good, <kbd>4</kbd> Easy (<kbd>Space</kbd> = Good).</p>
        </div>
      </div>
    </details>
  </section>

</div><!-- /#words-mode -->
```

- [ ] **Step 6: Load the new scripts.** Replace the single `<script src="app.js"></script>` (line 540) with:

```html
<script src="app.js"></script>
<script src="words-data.js"></script>
<script src="words.js"></script>
```

- [ ] **Step 7: Verify in a browser.** Open `index.html`. Expect: two tabs render under the header; "Kana" active and the existing quiz unchanged; clicking "Words" does nothing yet (no JS) but the Words panel markup exists in the DOM (check devtools). No console errors except the (not-yet-created) `words-data.js`/`words.js` 404s — create stubs in Task 3/5 before this is clean.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat(words): add mode tabs and Words-mode HTML scaffolding"
```

---

## Task 2: CSS — tabs, flashcard, grade buttons, filter chips

**Files:**
- Modify: `styles.css` (append a new clearly-marked section before the `@media (prefers-reduced-motion)` block, or at end of file)

- [ ] **Step 1: Append the Words-mode styles.** All colors reference existing custom properties so dark mode works for free. Add a `--good`/`--easy` accent pair to `:root` and `[data-theme="dark"]` plus the dark `@media` block (three places — match the existing pattern at lines 1–64), then the component styles.

Add to `:root` (after `--danger`):
```css
  --good: #3f9d6b;
  --easy: #4d8fb7;
```
Add to `[data-theme="dark"]` and to the `@media (prefers-color-scheme: dark)` `:root:not([data-theme="light"])` block (both):
```css
  --good: #5fc78c;
  --easy: #7cc3df;
```

Then append:
```css
/* ===== Words mode ===== */

.mode-tabs {
  max-width: 760px;
  margin: 0.6rem auto 0;
  padding: 0 var(--pad);
  display: flex;
  gap: 0.4rem;
}
.mode-tab {
  flex: 1;
  padding: 0.6rem 0.9rem;
  font: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: color 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}
.mode-tab.is-active {
  color: var(--surface);
  background: var(--accent);
  border-color: var(--accent);
}
.mode-tab:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.mode-panel[hidden] { display: none; }

/* flashcard */
#flashcard { padding: clamp(1.1rem, 3.5vw, 1.6rem) clamp(1rem, 4vw, 2rem); text-align: center; }

.fc-badges {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  min-height: 1.5em;
  flex-wrap: wrap;
}
.badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--header-band);
  color: var(--heading-strong);
  border: 1px solid var(--rule-dotted);
}

.fc-display {
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  border-radius: var(--radius);
  outline: none;
  padding: 0.6rem 0;
}
.fc-display:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.fc-word {
  font-size: clamp(2.6rem, 11vw, 4rem);
  line-height: 1.15;
  color: var(--text);
  font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", "Meiryo", sans-serif;
  word-break: keep-all;
}
.fc-back { margin-top: 0.4rem; }
.fc-reading {
  font-size: clamp(1.3rem, 5vw, 1.8rem);
  color: var(--heading);
  font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
}
.fc-romaji {
  font-size: 0.95rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  margin-top: 0.1rem;
}
.fc-meaning {
  font-size: 1.15rem;
  color: var(--text);
  margin-top: 0.55rem;
  font-weight: 600;
}
.fc-hint { font-size: 0.85rem; color: var(--text-muted); margin: 0.7rem 0 0; min-height: 1.2em; }
.fc-hint[hidden] { display: none; }

/* grade buttons */
.fc-grades {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
}
.fc-grades[hidden] { display: none; }
.grade-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.55rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  min-height: 52px;
  transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease;
}
.grade-btn:hover { transform: translateY(-1px); }
.grade-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.grade-label { font-weight: 700; font-size: 0.9rem; }
.grade-when { font-size: 0.7rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.grade-again { border-color: color-mix(in srgb, var(--danger) 45%, var(--border)); }
.grade-again .grade-label { color: var(--danger); }
.grade-good  { border-color: color-mix(in srgb, var(--good) 45%, var(--border)); }
.grade-good  .grade-label { color: var(--good); }
.grade-easy  { border-color: color-mix(in srgb, var(--easy) 45%, var(--border)); }
.grade-easy  .grade-label { color: var(--easy); }

.fc-count { color: var(--text-muted); font-variant-numeric: tabular-nums; font-weight: 600; font-size: 0.85rem; }
ul#fc-tools { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.2rem 1.1rem; }
ul#fc-tools button { background: none; border: none; padding: 0.35rem 0; font: inherit; font-weight: 600; color: var(--accent); cursor: pointer; min-height: 32px; }
ul#fc-tools button:hover { color: var(--accent-hover); }
ul#fc-tools button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: 3px; }

/* filter chips */
.filter-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.88rem;
  user-select: none;
}
.chip input { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; margin: 0; }
.chip:has(input:checked) { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }

@media (max-width: 480px) {
  .grade-label { font-size: 0.82rem; }
  .grade-when { font-size: 0.62rem; }
  .fc-grades { gap: 0.35rem; }
}
```

- [ ] **Step 2: Verify in browser.** Reload `index.html`. Tabs now look like a segmented control (Kana filled with accent). Click Words tab manually toggling `hidden` in devtools to confirm the flashcard/filter layout looks right and respects dark mode (toggle theme).

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "feat(words): styles for mode tabs, flashcard, grade buttons, filter chips"
```

---

## Task 3: Generate and assemble the vocabulary dataset

**Files:**
- Create: `words-data.js`

**Approach:** Fan out parallel generation subagents (via the Agent tool — independent, no shared state; see `superpowers:dispatching-parallel-agents`). Partition the work so agents don't overlap and each can focus its accuracy:

Partitions (one subagent each, ~150–300 verified entries per call; multiple calls per level to reach volume):
- N5 nouns · N5 verbs · N5 adjectives+adverbs · N5 expressions+other
- N4 nouns · N4 verbs · N4 adjectives+adverbs · N4 expressions+other
- N3 nouns · N3 verbs · N3 adjectives+adverbs+expressions
- N2 nouns · N2 verbs+adjectives+adverbs+expressions
- N1 nouns · N1 verbs+adjectives+adverbs+expressions
- Katakana loanwords (gairaigo): food, tech, daily-life, places/people, misc — `s:"katakana"`, spread across levels

Target ≈ **3,000+** entries after dedupe.

- [ ] **Step 1: Dispatch generation subagents** with this exact instruction template per partition (substitute LEVEL, CATEGORY, COUNT):

> You are building a verified Japanese vocabulary dataset for a reading trainer. Produce a JSON array of **{COUNT}** common, real Japanese words at JLPT **{LEVEL}**, part of speech **{CATEGORY}**. These should reflect the vocabulary found in popular decks (JLPT {LEVEL} lists, Tango N-series, Core 2k/6k). Each object MUST have exactly these keys: `w` (word as normally written — use kanji where a word is normally written with kanji, otherwise kana), `r` (kana reading in hiragana; for katakana loanwords the reading is the katakana itself), `o` (Hepburn romaji of the reading, lowercase, long vowels written out e.g. "ou"/"uu", no macrons), `m` (concise English meaning, ≤ 6 words), `lvl` ("{LEVEL}"), `pos` (one of "noun","verb","adjective","adverb","expression","other"), `s` ("kanji" if `w` contains at least one kanji character, else "hiragana", else "katakana"). Rules: (1) Only include words you are confident are correct — accuracy over volume. (2) `r` must be the correct reading of `w`. (3) `o` must be the correct romaji of `r`. (4) No duplicates within your list. (5) Output ONLY the JSON array, no prose. Double-check every reading before emitting.

  Use `schema` to force a structured array return where possible. Run partitions in parallel batches.

- [ ] **Step 2: Assemble `words-data.js`.** Concatenate all returned arrays, dedupe by `id = w + "|" + r` (keep the lowest JLPT level on collision), sort by `lvl` then `pos`, and write:

```js
// Vocabulary dataset for Words mode. Generated + validated; see tools/validate-words.mjs.
// Each entry: { w, r, o, m, lvl, pos, s }  (see docs plan for field meanings)
const WORD_POS_ORDER = ["noun","verb","adjective","adverb","expression","other"];

const WORDS = [
  { w:"私", r:"わたし", o:"watashi", m:"I, me", lvl:"N5", pos:"noun", s:"kanji" },
  /* …thousands of entries… */
];

// Expose for non-module consumers
if (typeof window !== "undefined") { window.WORDS = WORDS; window.WORD_POS_ORDER = WORD_POS_ORDER; }
```

- [ ] **Step 3: Commit** (data validated in Task 4 before relying on it)

```bash
git add words-data.js
git commit -m "feat(words): generated vocabulary dataset (~3k verified entries)"
```

---

## Task 4: Dataset validator (the "double-check thoroughly" gate)

**Files:**
- Create: `tools/validate-words.mjs`

- [ ] **Step 1: Write the validator.** It loads `words-data.js`, then checks structure + dedupe + script-tag correctness + a kana→romaji consistency transliteration. Mismatches are reported, not auto-fixed.

```js
// Usage: node tools/validate-words.mjs
// Authoring-time only. Validates words-data.js; exits non-zero on hard errors.
import { readFileSync } from "node:fs";

// load the browser global by evaluating the file in a tiny shim
const src = readFileSync(new URL("../words-data.js", import.meta.url), "utf8");
const sandbox = { window: {} };
new Function("window", src + "\n;return {WORDS, WORD_POS_ORDER};").call(sandbox, sandbox.window);
const { WORDS, WORD_POS_ORDER } = new Function(src + "\nreturn {WORDS, WORD_POS_ORDER};")();

const POS = new Set(WORD_POS_ORDER);
const LVL = new Set(["N5","N4","N3","N2","N1"]);
const isKanji = (c) => { const x = c.codePointAt(0); return (x>=0x4E00 && x<=0x9FFF) || (x>=0x3400 && x<=0x4DBF); };
const isHira  = (c) => { const x = c.codePointAt(0); return x>=0x3040 && x<=0x309F; };
const isKata  = (c) => { const x = c.codePointAt(0); return (x>=0x30A0 && x<=0x30FF) || c==="ー"; };

// kana → romaji table for the consistency check (Hepburn-ish)
const ROMA = { /* full hiragana+katakana → romaji map; combos first */ };
// (map is generated from app.js KANA in Step 2; see note)

const errors = [], warns = [];
const seen = new Map();

WORDS.forEach((e, i) => {
  for (const k of ["w","r","o","m","lvl","pos","s"]) {
    if (typeof e[k] !== "string" || !e[k]) errors.push(`#${i} ${e.w||"?"}: missing/empty "${k}"`);
  }
  if (!LVL.has(e.lvl)) errors.push(`#${i} ${e.w}: bad lvl "${e.lvl}"`);
  if (!POS.has(e.pos)) errors.push(`#${i} ${e.w}: bad pos "${e.pos}"`);
  // script tag matches actual characters in w
  const chars = [...e.w];
  const expected = chars.some(isKanji) ? "kanji"
    : chars.every((c) => isKata(c)) ? "katakana"
    : chars.every((c) => isHira(c) || isKata(c)) && chars.some(isHira) ? "hiragana"
    : null;
  if (expected && e.s !== expected) warns.push(`#${i} ${e.w}: s="${e.s}" but chars look like "${expected}"`);
  // reading must be kana only
  if (![...e.r].every((c) => isHira(c) || isKata(c))) warns.push(`#${i} ${e.w}: reading "${e.r}" has non-kana`);
  // dedupe
  const id = e.w + "|" + e.r;
  if (seen.has(id)) errors.push(`dup id "${id}" at #${i} and #${seen.get(id)}`);
  else seen.set(id, i);
});

console.log(`Total entries: ${WORDS.length}`);
console.log(`By level:`, [...LVL].map((l)=>`${l}:${WORDS.filter(w=>w.lvl===l).length}`).join("  "));
console.log(`By script:`, ["kanji","hiragana","katakana"].map((s)=>`${s}:${WORDS.filter(w=>w.s===s).length}`).join("  "));
console.log(`By pos:`, WORD_POS_ORDER.map((p)=>`${p}:${WORDS.filter(w=>w.pos===p).length}`).join("  "));
if (warns.length) { console.warn(`\n${warns.length} WARNINGS:`); warns.slice(0,50).forEach((w)=>console.warn("  "+w)); }
if (errors.length) { console.error(`\n${errors.length} ERRORS:`); errors.slice(0,80).forEach((e)=>console.error("  "+e)); process.exit(1); }
console.log("\nOK — no hard errors.");
```

  Note for Step 1: build `ROMA` and a `kanaToRomaji(reading)` consistency check by reusing the `KANA` table from `app.js` (it already maps every kana → romaji). For the consistency check, transliterate `e.r` with longest-match-first and compare loosely to `e.o` (ignore long-vowel spelling differences); emit a **warning** (not error) on mismatch so genuine irregular readings don't block the build.

- [ ] **Step 2: Run the validator**

Run: `node tools/validate-words.mjs`
Expected: prints totals + per-level/script/pos breakdown; exits 0. Investigate every ERROR (fix the data) and review WARNINGS (fix obvious ones; the romaji-consistency warnings catch wrong readings — the core accuracy check).

- [ ] **Step 3: Re-run any generation subagents to fix flagged entries**, then re-run the validator until errors = 0 and warnings are reviewed.

- [ ] **Step 4: Commit**

```bash
git add tools/validate-words.mjs words-data.js
git commit -m "feat(words): dataset validator + corrections from validation pass"
```

---

## Task 5: Words engine — SM-2 scheduler

**Files:**
- Create: `words.js` (this task adds the scheduler; later tasks add UI in the same file)

- [ ] **Step 1: Scaffold `words.js` and the scheduler constants + state mutation.**

```js
// Words Trainer — Anki-style SRS scheduler, filtered pool, flashcard UI, mode switch.
(function () {
  "use strict";

  const MIN = 60 * 1000, DAY = 24 * 60 * MIN;
  const LEARN_STEPS = [1 * MIN, 10 * MIN]; // learning steps
  const GRADUATE = 1 * DAY;                // interval after finishing learning with Good
  const EASY_GRAD = 4 * DAY;               // interval when Easy from learning
  const MIN_EASE = 1.3, START_EASE = 2.5;
  const HARD_MULT = 1.2, EASY_BONUS = 1.3;
  const COOLDOWN = 4; // don't repeat the same card within N picks unless it's the only due one

  const WSTORE = {
    srs: "wt.srs", session: "wt.session",
    filter: (dim, val) => `wt.filter.${dim}.${val}`,
  };

  const idOf = (e) => e.w + "|" + e.r;
  const now = () => Date.now();

  let srs = {};        // id -> {ease,interval,due,reps,lapses,stage,step}
  let session = { reviewed: 0, again: 0, correct: 0 };

  function safeGet(k){ try { return localStorage.getItem(k); } catch { return null; } }
  function safeSet(k,v){ try { localStorage.setItem(k,v); } catch {} }

  function loadSrs(){ try { srs = JSON.parse(safeGet(WSTORE.srs)) || {}; } catch { srs = {}; } }
  function saveSrs(){ safeSet(WSTORE.srs, JSON.stringify(srs)); }
  function loadSession(){ try { const s = JSON.parse(safeGet(WSTORE.session)); if (s) session = s; } catch {} }
  function saveSession(){ safeSet(WSTORE.session, JSON.stringify(session)); }

  function stateFor(id){
    if (!srs[id]) srs[id] = { ease: START_EASE, interval: 0, due: 0, reps: 0, lapses: 0, stage: "new", step: 0 };
    return srs[id];
  }
```

- [ ] **Step 2: Add `applyGrade(id, grade)` — the SM-2 + learning-steps transition.** Returns nothing; mutates and persists. `grade`: 0 Again, 1 Hard, 2 Good, 3 Easy.

```js
  function applyGrade(id, grade){
    const s = stateFor(id);
    const t = now();
    if (s.stage === "new" || s.stage === "learning"){
      if (s.stage === "new") { s.stage = "learning"; s.step = 0; }
      if (grade === 0){ s.step = 0; s.due = t + LEARN_STEPS[0]; }
      else if (grade === 1){ s.due = t + LEARN_STEPS[Math.min(s.step, LEARN_STEPS.length-1)]; }
      else if (grade === 2){
        s.step += 1;
        if (s.step >= LEARN_STEPS.length){ s.stage = "review"; s.interval = GRADUATE; s.due = t + GRADUATE; s.reps += 1; }
        else { s.due = t + LEARN_STEPS[s.step]; }
      } else { // Easy → graduate now
        s.stage = "review"; s.interval = EASY_GRAD; s.due = t + EASY_GRAD; s.reps += 1;
      }
    } else { // review
      if (grade === 0){
        s.lapses += 1; s.ease = Math.max(MIN_EASE, s.ease - 0.2);
        s.stage = "learning"; s.step = 0; s.interval = 0; s.due = t + LEARN_STEPS[0];
      } else if (grade === 1){
        s.ease = Math.max(MIN_EASE, s.ease - 0.15);
        s.interval = Math.max(MIN, s.interval * HARD_MULT); s.due = t + s.interval; s.reps += 1;
      } else if (grade === 2){
        s.interval = Math.max(MIN, s.interval * s.ease); s.due = t + s.interval; s.reps += 1;
      } else {
        s.ease = s.ease + 0.15;
        s.interval = Math.max(MIN, s.interval * s.ease * EASY_BONUS); s.due = t + s.interval; s.reps += 1;
      }
    }
    session.reviewed += 1;
    if (grade === 0) session.again += 1; else session.correct += 1;
    saveSrs(); saveSession();
  }
```

- [ ] **Step 3: Add `previewInterval(id, grade)` → short human string** for the grade buttons ("1m", "10m", "1d", "4d", "12d").

```js
  function fmtMs(ms){
    if (ms < 60*MIN) return Math.max(1, Math.round(ms/MIN)) + "m";
    if (ms < DAY)    return Math.max(1, Math.round(ms/(60*MIN))) + "h";
    if (ms < 30*DAY) return Math.max(1, Math.round(ms/DAY)) + "d";
    return Math.max(1, Math.round(ms/(30*DAY))) + "mo";
  }
  function previewInterval(id, grade){
    const s = stateFor(id);
    if (s.stage === "new" || s.stage === "learning"){
      if (grade === 0) return fmtMs(LEARN_STEPS[0]);
      if (grade === 1) return fmtMs(LEARN_STEPS[Math.min(s.step, LEARN_STEPS.length-1)]);
      if (grade === 2){ const ns = s.step + 1; return ns >= LEARN_STEPS.length ? fmtMs(GRADUATE) : fmtMs(LEARN_STEPS[ns]); }
      return fmtMs(EASY_GRAD);
    }
    if (grade === 0) return fmtMs(LEARN_STEPS[0]);
    if (grade === 1) return fmtMs(Math.max(MIN, s.interval * HARD_MULT));
    if (grade === 2) return fmtMs(Math.max(MIN, s.interval * s.ease));
    return fmtMs(Math.max(MIN, s.interval * s.ease * EASY_BONUS));
  }
```

- [ ] **Step 4: Sanity-check the scheduler in the browser console** (temporary). After loading the page with `words.js` (even before UI), in console: paste a quick check — grade a fake id Good twice and confirm it graduates to ~1 day. (Since the IIFE is private, add a temporary `window.__wt = { applyGrade, srs, previewInterval }` export, verify, then remove.) Expected: after two Goods, `srs["x|y"].stage === "review"` and `interval === DAY`.

- [ ] **Step 5: Commit**

```bash
git add words.js
git commit -m "feat(words): SM-2 scheduler with learning steps + interval previews"
```

---

## Task 6: Words engine — filters, pool, and card selection

**Files:**
- Modify: `words.js`

- [ ] **Step 1: Add filter persistence + pool building.** Reads the `.wfilter` checkboxes, intersects across the three dimensions.

```js
  function loadFilters(){
    document.querySelectorAll("input.wfilter").forEach((cb) => {
      const v = safeGet(WSTORE.filter(cb.dataset.dim, cb.value));
      if (v === "1") cb.checked = true; else if (v === "0") cb.checked = false;
    });
  }
  function saveFilters(){
    document.querySelectorAll("input.wfilter").forEach((cb) => {
      safeSet(WSTORE.filter(cb.dataset.dim, cb.value), cb.checked ? "1" : "0");
    });
  }
  function activeSet(dim){
    const set = new Set();
    document.querySelectorAll(`input.wfilter[data-dim="${dim}"]`).forEach((cb) => { if (cb.checked) set.add(cb.value); });
    return set;
  }
  function buildPool(){
    const s = activeSet("s"), lvl = activeSet("lvl"), pos = activeSet("pos");
    return WORDS.filter((e) => s.has(e.s) && lvl.has(e.lvl) && pos.has(e.pos));
  }
```

- [ ] **Step 2: Add card selection `pickNext(pool, recent)`** — Anki-like queue priority: due learning/review first (earliest due), else a new card, else soonest-due (review-ahead). Respects a small recency cooldown.

```js
  function pickNext(pool, recent){
    if (!pool.length) return null;
    const t = now();
    const notRecent = (e) => !recent.includes(idOf(e)) || pool.length <= recent.length;

    // 1) due cards (learning or review), earliest due first
    const due = pool
      .map((e) => ({ e, s: srs[idOf(e)] }))
      .filter(({ s }) => s && s.stage !== "new" && s.due <= t)
      .sort((a, b) => a.s.due - b.s.due)
      .map(({ e }) => e)
      .filter(notRecent);
    if (due.length) return due[0];

    // 2) a new (unseen) card
    const fresh = pool.filter((e) => !srs[idOf(e)]).filter(notRecent);
    if (fresh.length) return fresh[0];

    // 3) review ahead: soonest due overall
    const ahead = pool
      .map((e) => ({ e, s: stateFor(idOf(e)) }))
      .sort((a, b) => a.s.due - b.s.due)
      .map(({ e }) => e)
      .filter(notRecent);
    return ahead[0] || pool[0];
  }
```

- [ ] **Step 3: Add `poolCounts(pool)`** for the summary line + footer (new / learning / due).

```js
  function poolCounts(pool){
    const t = now(); let neu = 0, due = 0, learn = 0;
    for (const e of pool){
      const s = srs[idOf(e)];
      if (!s) neu++;
      else if (s.stage === "learning") { learn++; if (s.due <= t) due++; }
      else if (s.due <= t) due++;
    }
    return { total: pool.length, neu, due, learn };
  }
```

- [ ] **Step 4: Verify** (console, temporary export): `buildPool().length` equals the filtered count the validator reported for the default checkboxes (kanji+hira+kata × N5+N4+N3 × all pos). Toggle a checkbox in devtools, re-run `buildPool().length`, confirm it shrinks.

- [ ] **Step 5: Commit**

```bash
git add words.js
git commit -m "feat(words): filters, pool building, and Anki-style card selection"
```

---

## Task 7: Words engine — flashcard UI (render, flip, grade, audio, keyboard)

**Files:**
- Modify: `words.js`

- [ ] **Step 1: Add DOM refs + render/flip/grade functions.**

```js
  const $ = (id) => document.getElementById(id);
  let pool = [];
  let current = null;       // current WORD entry
  let flipped = false;
  let recent = [];          // recent ids for cooldown

  function refreshPool(){ pool = buildPool(); }

  function updateSummary(){
    const c = poolCounts(pool);
    const sum = $("pool-summary");
    if (sum) sum.textContent = pool.length
      ? `${c.total} words match — ${c.neu} new, ${c.due} due now`
      : "No words match the current filters. Check at least one box in each group.";
    const foot = $("fc-count");
    if (foot) foot.textContent = `${session.reviewed} reviewed this session`;
  }

  function renderBadges(e){
    $("fc-badges").innerHTML = e
      ? `<span class="badge">${e.lvl}</span><span class="badge">${e.pos}</span><span class="badge">${e.s}</span>`
      : "";
  }

  function showCard(){
    refreshPool();
    current = pickNext(pool, recent);
    flipped = false;
    if (!current){
      $("fc-word").textContent = "—";
      $("fc-back").hidden = true;
      $("fc-grades").hidden = true;
      $("fc-hint").hidden = false;
      $("fc-hint").textContent = "No cards. Adjust the filters below.";
      renderBadges(null);
      updateSummary();
      return;
    }
    renderBadges(current);
    $("fc-word").textContent = current.w;
    $("fc-reading").textContent = current.r;
    $("fc-romaji").textContent = current.o;
    $("fc-meaning").textContent = current.m;
    $("fc-back").hidden = true;
    $("fc-grades").hidden = true;
    $("fc-hint").hidden = false;
    $("fc-hint").textContent = "Tap the card (or press Space) to reveal.";
    updateSummary();
  }

  function flip(){
    if (!current || flipped) return;
    flipped = true;
    $("fc-back").hidden = false;
    $("fc-hint").hidden = true;
    const g = $("fc-grades");
    g.hidden = false;
    const id = idOf(current);
    g.querySelectorAll(".grade-when").forEach((el) => {
      el.textContent = previewInterval(id, Number(el.dataset.when));
    });
  }

  function grade(g){
    if (!current || !flipped) return;
    const id = idOf(current);
    applyGrade(id, g);
    recent.push(id); if (recent.length > COOLDOWN) recent.shift();
    showCard();
  }

  function skip(){
    if (!current) return;
    const id = idOf(current);
    recent.push(id); if (recent.length > COOLDOWN) recent.shift();
    showCard();
  }

  function playSound(){
    if (!current || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(current.w);
      u.lang = "ja-JP"; u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch {}
  }
```

- [ ] **Step 2: Add `initWords()` — wire events; called by the mode controller (Task 8).**

```js
  let initialized = false;
  function initWords(){
    if (initialized) return; initialized = true;
    loadSrs(); loadSession(); loadFilters();

    const disp = $("fc-display");
    disp.addEventListener("click", flip);
    disp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
    });

    $("fc-grades").addEventListener("click", (e) => {
      const btn = e.target.closest(".grade-btn"); if (!btn) return;
      grade(Number(btn.dataset.grade));
    });

    $("fc-sound").addEventListener("click", playSound);
    $("fc-skip").addEventListener("click", skip);

    document.querySelectorAll("input.wfilter").forEach((cb) => {
      cb.addEventListener("change", () => { saveFilters(); showCard(); });
    });
    document.querySelectorAll("button[data-wf-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const on = btn.dataset.wfAction === "check";
        document.querySelectorAll(`input.wfilter[data-dim="${btn.dataset.wfGroup}"]`).forEach((cb) => { cb.checked = on; });
        saveFilters(); showCard();
      });
    });

    showCard();
  }
```

- [ ] **Step 3: Add the words-mode keyboard handler** (only active while in words mode — guarded by `document.body.dataset.mode`). Append inside the IIFE:

```js
  document.addEventListener("keydown", (e) => {
    if (document.body.dataset.mode !== "words") return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON" || e.target.tagName === "SUMMARY") {
      // still allow Space to flip when focus isn't on a control we care about
    }
    if (!flipped){
      if (e.key === " " || e.key === "Enter"){ e.preventDefault(); flip(); }
      return;
    }
    if (e.key === "1"){ e.preventDefault(); grade(0); }
    else if (e.key === "2"){ e.preventDefault(); grade(1); }
    else if (e.key === "3"){ e.preventDefault(); grade(2); }
    else if (e.key === "4"){ e.preventDefault(); grade(3); }
    else if (e.key === " " || e.key === "Enter"){ e.preventDefault(); grade(2); } // Space = Good
  });
```

- [ ] **Step 4: Expose `initWords`/`showCard` to the mode controller** at the end of the IIFE:

```js
  window.WordsMode = { init: initWords, refresh: showCard };
})();
```

- [ ] **Step 5: Commit**

```bash
git add words.js
git commit -m "feat(words): flashcard render/flip/grade UI, audio, keyboard handling"
```

---

## Task 8: Page mode switch + app.js keydown guard

**Files:**
- Modify: `words.js` (add mode controller — it owns the tabs)
- Modify: `app.js` (guard global keydown so it no-ops outside Kana mode)

- [ ] **Step 1: Add the mode controller to `words.js`** (separate small IIFE at the end of the file, after `WordsMode`):

```js
(function () {
  "use strict";
  const KEY = "kt.mode";
  function safeGet(k){ try { return localStorage.getItem(k); } catch { return null; } }
  function safeSet(k,v){ try { localStorage.setItem(k,v); } catch {} }

  function setMode(mode){
    const isWords = mode === "words";
    document.body.dataset.mode = mode;
    document.getElementById("kana-mode").hidden = isWords;
    document.getElementById("words-mode").hidden = !isWords;
    const tk = document.getElementById("tab-kana"), tw = document.getElementById("tab-words");
    tk.classList.toggle("is-active", !isWords); tk.setAttribute("aria-selected", String(!isWords));
    tw.classList.toggle("is-active", isWords);  tw.setAttribute("aria-selected", String(isWords));
    safeSet(KEY, mode);
    if (isWords && window.WordsMode){ window.WordsMode.init(); window.WordsMode.refresh(); }
    if (!isWords){ const inp = document.getElementById("input-box"); if (inp) inp.focus(); }
  }

  function init(){
    document.getElementById("tab-kana").addEventListener("click", () => setMode("kana"));
    document.getElementById("tab-words").addEventListener("click", () => setMode("words"));
    const saved = safeGet(KEY) === "words" ? "words" : "kana";
    setMode(saved);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
```

- [ ] **Step 2: Guard the Kana global keydown handler in `app.js`.** At the very top of the `document.body.addEventListener('keydown', (e) => {` callback (line ~581), add:

```js
    if (document.body.dataset.mode === 'words') return;
```

  Place it as the first statement inside the handler so Kana key-stealing never fires while Words mode is active.

- [ ] **Step 3: Verify the full switch in browser.** Reload. Default mode = Kana (unchanged behavior, typing works). Click Words → flashcard appears, a card shows, Space flips, 1–4 grade and advance, filters change the pool, footer counts rise. Reload the page while on Words → it restores to Words. Switch back to Kana → typing romaji works again (no interference). Toggle dark mode in each.

- [ ] **Step 4: Commit**

```bash
git add words.js app.js
git commit -m "feat(words): page mode switch + guard kana keydown outside kana mode"
```

---

## Task 9: Final integration, footer, manual verification, deploy

**Files:**
- Modify: `index.html` (footer copy)

- [ ] **Step 1: Update footer copy** (line 537) to mention both trainers:

```html
  <p>Built from scratch as an open Japanese trainer — kana drilling and an Anki-style vocabulary deck. Scores, schedules, and selections persist locally.</p>
```

- [ ] **Step 2: Full manual QA pass** (checklist — run each, confirm):
  - Kana mode unchanged: type romaji, prefix match, skip, stroke order modal, fonts, leech badge.
  - Words mode: card renders word large; flip reveals reading/romaji/meaning + badges; grade buttons show interval previews; 1–4 + Space grade; Skip advances; Play sound speaks; filters (each dimension) change pool and summary; check-all/uncheck-all per group; empty-pool message when all of a dimension is unchecked.
  - Persistence: grade several cards, reload → schedule retained (a just-graded card isn't immediately due); filters + mode retained.
  - Mobile width (≤480px): tabs, grade grid, chips wrap and are tappable.
  - Dark/light theme correct in both modes.
  - `node tools/validate-words.mjs` exits 0.

- [ ] **Step 3: Commit + deploy**

```bash
git add index.html
git commit -m "feat(words): footer copy; complete Words mode integration"
```

  Deploy via existing Vercel setup (`.vercel` present). Use the project's normal deploy (e.g. `vercel deploy --prod` or the `/vercel:deploy` flow) — preview first, then production after QA.

---

## Self-Review (against the confirmed spec)

- **Anki-style flashcard** → Tasks 5 (SM-2 + learning steps), 7 (flip/reveal/grade UI). ✅
- **Thousands of words, popular decks + verified** → Task 3 (parallel generation, JLPT/Core partitions), Task 4 (validator: schema + dedupe + kana→romaji consistency = the "double-check"). ✅
- **Hiragana, katakana, and kanji words** → `s` field + script filter; katakana loanword partition; kanji-containing words tagged `s:"kanji"`. ✅
- **Reading + romaji + meaning per card** → schema `r`/`o`/`m`; rendered on flip. ✅
- **Filtering** → Task 1 chips (script/level/category) + Task 6 pool intersection + persistence. ✅
- **Mode switch** → Task 1 tabs + Task 8 controller + app.js guard. ✅
- **Fits existing design / no new deps** → Task 2 reuses CSS custom properties; vanilla JS; no build step. ✅

**Open data note:** generation produces "thousands" but exact totals depend on dedupe; Task 4 prints the real counts. If a level/category comes back thin, re-dispatch that partition (Task 3 Step 1) before final commit.
