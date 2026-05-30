# Kana Feedback Redesign — Mnemonics & Adaptive Teaching

**Date:** 2026-05-30
**App:** `apps/japanese-trainer` (Kana mode, `app.js`)
**Status:** Approved design

## Problem

When you get a kana wrong in Kana mode, the app flashes a flat `し = shi` and
waits for space. It teaches nothing: no reason you slipped, no way to remember
it better, no example of the kana in use. The "press space to continue"
affordance is also currently broken. The miss moment — the single highest-value
learning opportunity in the app — is wasted.

## Goals

- A miss becomes a fast, high-quality teaching moment that does **not** break flow.
- Tell the learner **why** they slipped and **how** to remember it better.
- Go **deep** when the learner is actually stuck (repeated misses), light when not.
- Use the best-researched mnemonics, with pictures where they help.
- Zero new runtime dependencies; works offline; fits the existing static build.

## Non-Goals

- No changes to Words or Kanji modes.
- No backend / `api/state.js` changes.
- No image hosting, CDN, or AI image generation at runtime.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Feedback shape | Inline minimal baseline that **adaptively escalates** with repeated misses |
| Pictures | **Emoji + CSS art** only (zero-dependency), shown at the deep stage |
| Example words | **Curated kana-only list per kana**, with **dataset fallback** to `WORDS` for rare combos |
| Mnemonic content | Produced by a **research workflow** (best-in-class, adversarially verified) |

## Architecture

### 1. Content layer — `kana-mnemonics.js` (new)

A dependency-free module exporting one record per kana:

```js
const KANA_MNEMONICS = {
  'し': {
    mnemonic: '"she" has a fishhook',          // researched, best-in-class
    emoji: '🪝',                                // emoji / CSS art only
    confusables: [{ k: 'つ', hint: 'つ waves across; し hooks down' }],
    examples: [                                 // curated, kana-only, decodable
      { w: 'すし', r: 'sushi', m: 'sushi' },
      { w: 'しろ', r: 'shiro', m: 'white' },
      { w: 'あし', r: 'ashi',  m: 'foot' },
    ],
  },
  // ...
};
```

Coverage: hiragana + katakana singles, dakuten/handakuten, and yōon combos.
Dakuten/handakuten/combo entries derive their mnemonic from the base kana + the
mark/combo rule (e.g. が = か + dakuten "゛"), so the research workload centers
on the ~46 base shapes per script plus the confusable pairs.

Example-word resolution order: curated list on the record → fall back to a word
from the existing `WORDS` dataset (`words-data.js`) that contains the kana, when
no curated example exists (rare combos like きゃ, ぢ).

### 2. Feedback engine — rewrite the wrong-answer branch of `checkAnswer` (`app.js`)

Replace the current flat message with a **staged renderer**. The stage is driven
by how many times the learner has missed *that specific kana*, reusing the
existing `stats[kana].wrong` counter and `leech` flag:

- **Miss 1 (light):** mnemonic line + 1 example word. Minimal interruption.
- **Miss 2 (more):** adds the confusable contrast (し vs つ) + a 2nd example.
- **Miss 3+ / leech (deep):** emoji/CSS picture, personalized error pattern
  ("3/3 times you typed *tsu*"), 3 examples, stroke-order link (reuse existing
  stroke modal).

All stages keep the "press space / click to continue" model.

### 3. "Why you slipped" line

Match what the learner **typed** against the current kana's `confusables` table.
If they typed `tsu` for し and つ=tsu is a listed confusable, surface that
specific contrast. If the typed string isn't a known confusable, fall back to a
generic "look again at the stroke direction" note. This is the personalized
"tell me why" behavior.

### 4. Continue interaction (bug fix)

The current "press space to continue" does not reliably advance after a miss.
Root-cause it via systematic debugging **before** rebuilding the feedback on top.
Acceptance: both **space/enter** and **click/tap** reliably advance from any
feedback stage, on desktop and touch.

### 5. Pictures

Emoji + CSS art only, surfaced at the deep stage. No network, no hosting, offline-safe.

## Research Workflow (content generation)

The mnemonic dataset is the part that makes this exceptional. Generate it with a
verification-backed research workflow (the user explicitly opted into research
agents):

1. **Fan-out research:** parallel agents pull proven mnemonic systems
   (Tofugu/"Learn Kana"-style, Kanjidamage-style, Dr. Moku-style, Heisig-adjacent)
   for every base kana in both scripts.
2. **Confusable mining:** identify the kana pairs learners actually mix up
   (し/つ, ソ/ン, シ/ツ, ね/れ/わ, etc.) with the discriminating tell for each.
3. **Example curation:** pick ~3 short, kana-only example words per kana.
4. **Adversarial verification:** each entry is independently checked
   (mnemonic actually maps to the shape/sound; romaji correct; examples decode in
   kana the learner would know) before it lands in `kana-mnemonics.js`.

Output: the populated `kana-mnemonics.js`. The workflow writes data only — no app
logic.

## Testing

Extend `tests/e2e.mjs` and/or `tests/unit.mjs`:

- A miss renders a mnemonic + at least one example word.
- Feedback escalates by stage on the 1st / 2nd / 3rd miss of the same kana.
- The "why" line reflects the **typed** error (typing a known confusable surfaces
  that contrast).
- Space/enter **and** click advance from each feedback stage.
- Dakuten/combo kana resolve an example (curated or dataset fallback).

## File Touch List

- `kana-mnemonics.js` — new content module (research-generated).
- `app.js` — rewrite wrong-answer branch into staged renderer; fix continue bug.
- `index.html` — `<script src="kana-mnemonics.js">`; any feedback DOM containers.
- `styles.css` — feedback stage styles, emoji/CSS picture, confusable contrast.
- `tests/e2e.mjs` / `tests/unit.mjs` — assertions above.
