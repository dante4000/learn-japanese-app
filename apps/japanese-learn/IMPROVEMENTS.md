# Improvement Instructions: Upgrading the Original Build Instructions
## Applying Memory Architecture Edition Changes to `zero-to-hero-japanese-for-korean-speakers-build-instructions.md`

> **What this is:** A precise, actionable list of every change needed to upgrade the original v4.0 build instructions into the Memory Architecture Edition. Each improvement is categorized, located by section, and described with enough detail for an LLM or developer to apply it mechanically. Changes are ordered from structural (top-level) to granular (per-chapter).
>
> **How to use:** Work through this document top-to-bottom. Each improvement has a **LOCATION** (where in the original to make the change), an **ACTION** (add/modify/replace/expand), and the **SPECIFICATION** (exactly what to do). Where the new document's content is extensive, a summary + reference pointer is given rather than duplicating the full text.

---

# I. TOP-LEVEL STRUCTURAL CHANGES

---

## I-1. Document Header — Update Metadata

**LOCATION:** Lines 1–14 (document header block quote)

**ACTION:** Modify the following fields:

| Field | Original | New |
|-------|----------|-----|
| Badge text | "Zero to Hero — 日本語 for Korean Speakers" | "Zero to Hero — 日本語 Memory Architecture Edition" |
| Document version | v4.0 | v5.0 — Memory Architecture Edition |
| Target reader description | "An adult with high-level Korean proficiency (한국어 고급)" | "An adult native Korean speaker (한국어 모국어 화자) with full command of Korean grammar, vocabulary, and writing" |
| Endgame item (7) | *does not exist* | ADD: "(7) have internalized a personal memory system they can use for ANY future language learning" |
| Version description | "Pedagogically enhanced with evidence-based learning science, interactive quizzes, mnemonics, and completion checkboxes" | "Pedagogically enhanced with state-of-the-art memorization science deeply integrated into every page, exercise, and interaction — including spaced retrieval practice, method of loci (memory palace), keyword mnemonics with vivid imagery, dual coding, elaborative interrogation, interleaving, generation effect, desirable difficulty calibration, context-dependent encoding, self-reference effect, and sleep consolidation protocols" |

**ADD** a new paragraph to the header block quote after "Document version":

```
> **What makes this version different:** This is not a textbook with quizzes bolted on. Every chapter is built around a Memory Architecture — a system of interconnected memorization techniques drawn from cognitive science research (2000–2025). The learning experience is designed so that forgetting is structurally impossible if the reader follows the system.
```

---

## I-2. Table of Contents — Add 3 New Chapters + Column

**LOCATION:** Lines 18–57 (TABLE OF CONTENTS section)

**ACTION:** Make all of the following changes:

### A. Change chapter count from 18 to 20

- Progress bar: "X/18 complete" → "X/20 complete"
- Progress bar segments: 18 → 20

### B. Add a 4th column to the TOC table: "Memory Technique Focus"

New table header:
```
| ☐ | Ch | Title | Memory Technique Focus |
|---|-----|-------|----------------------|
```

### C. Insert Chapter 00 as the first row (before Ch01)

```
| ☐ | 00 | How Your Memory Works — The Science Behind This Book | Metamemory + System Overview |
```

### D. Add Memory Technique Focus to every existing chapter row

| Ch | Memory Technique Focus |
|----|----------------------|
| 01 | Schema Activation + Transfer Theory |
| 02 | Method of Loci + Keyword Mnemonics |
| 03 | Dual Coding + Contrastive Encoding |
| 04 | Motor Encoding + Minimal Pair Drilling |
| 05 | Situational Encoding + Context-Dependent Memory |
| 06 | Analogical Transfer + Elaborative Interrogation |
| 07 | Procedural Memory + Pattern Completion |
| 08 | Episode Encoding + Social Simulation |
| 09 | Chunking + Schema Construction |
| 10 | Morphological Decomposition + Hanja Bridge |
| 11 | Sound Correspondence Rules + Generation Effect |
| 12 | Keyword Method + Vivid Imagery |
| 13 | Pragmatic Schema + Role-Play Encoding |
| 14 | Extensive Reading + Incidental Acquisition |
| 15 | Production Effect + Error-Based Learning |
| 16 | Perceptual Learning + Shadowing Protocol |
| 17 | Cultural Schema + Narrative Encoding |
| 18 | Metacognitive Strategy + Self-Regulated Learning |

### E. Append 2 new chapter rows after Ch18

```
| ☐ | 19 | Your Memory Palace — Building the Permanent Architecture | Method of Loci Mastery + Long-Term Consolidation |
| ☐ | 20 | The 90-Day Sprint — Putting It All Together | Distributed Practice Schedule + Habit Stacking |
```

### F. Expand Appendices list

**Original (4 appendices):**
```
- Glossary
- Cognate Reference (500+ Sino-vocabulary words)
- Sound Correspondence Cheat Sheet
- False Friends (50+ entries)
```

**New (7 appendices — ADD 3):**
```
- Appendix A: Glossary
- Appendix B: Cognate Reference (500+ Sino-vocabulary words)
- Appendix C: Sound Correspondence Cheat Sheet
- Appendix D: False Friends (50+ entries)
- Appendix E: Memory Palace Templates (pre-built loci for each chapter)       ← NEW
- Appendix F: Optimal Spaced Repetition Schedule (90-day calendar)             ← NEW
- Appendix G: Mnemonic Image Bank (200+ keyword images)                        ← NEW
```

### G. Add to landing page implementation notes

After the existing implementation notes, ADD:
```
- Memory streak counter: consecutive days with ≥1 recall check completed, stored via `window.storage`
- "Daily Review" button: pulls SM-2 due items from all chapters
- Forgetting Curve graph: per-chapter projected retention visualization
```

### H. Update design rationale

ADD this sentence to the beginning of the design rationale paragraph:
```
Chapter 00 (memory science) comes first because the reader must understand WHY they're doing each exercise — metamemory research shows that learners who understand the science behind techniques use them 40% more consistently (Dunlosky et al., 2013).
```

ADD to the end:
```
Chapters 19-20 are capstone: build the permanent memory architecture and execute a structured 90-day intensive plan.
```

---

# II. PEDAGOGICAL FRAMEWORK OVERHAUL

---

## II-1. Expand "Six Pillars" to "Twelve Pillars"

**LOCATION:** Lines 61–83 (PEDAGOGICAL FRAMEWORK section)

**ACTION:** Replace the entire "The Six Pillars" section. Keep the existing 6 but upgrade them AND add 6 new ones.

### Upgraded existing pillars:

**Pillar 1: Retrieval Practice** — ADD:
- "No hover-to-see-answer — force click-to-reveal with a mandatory 3-second thinking pause (timer shown)"
- "Self-rating: Easy / Hard / Again — feeds into per-item spaced repetition schedule"
- "Retrieval Roulette widget: randomly pulls items from ANY previous chapter for surprise recall"

**Pillar 2: Spaced Repetition** — UPGRADE from "Cues" to full SM-2 engine:
- Replace "sidebar quizzing 3-5 items" with full SM-2 algorithm implementation
- ADD: per-item tracking (last_review, interval, ease_factor), visual Forgetting Curve graph, Memory Strength indicators (red→yellow→green), Daily Review button on landing page
- ADD: citation (Pashler et al., 2007)

**Pillar 3: Mnemonics and Dual Coding** — SPLIT into two separate pillars:
- **Pillar 4: Keyword Mnemonics with Vivid Imagery** — specify the full mnemonic chain format:
  ```
  Japanese: 食べる (taberu) — to eat
  Keyword bridge: "TABLE" (sounds like tabe-)
  Image: "You're eating directly off a TABLE with no plate, food flying everywhere"
  Korean anchor: 먹다 (meokda)
  Full chain: 먹다 → TABLE → 食べる (taberu)
  ```
  - ADD: "The more bizarre, violent, or emotionally charged the image, the better" (bizarreness effect, McDaniel & Einstein, 1986)
  - ADD: SVG illustration for every keyword image
  - ADD: "Create Your Own" personalization prompt
- **Pillar 5: Dual Coding** — separate pillar with Paivio 1986 citation, emphasize two independent retrieval pathways
  - ADD: Color coding system: blue = Japanese, green = Korean parallel, orange = mnemonic bridge

**Pillar 5 (old numbering) → Pillar 6: Elaborative Interrogation** — ADD:
- "'Predict Before You Peek' protocol: hypothesis → reveal → compare → correct"
- "Self-generated explanations are more durable — prompt the reader to write their own summary"

**Pillar 6 (old) → Pillar 9: Desirable Difficulty** — ADD:
- Adaptive difficulty guidance: "if reader self-rates Easy 3x in a row, suggest jumping to Challenge tier"
- "'Remove the Scaffolding' progression: romaji → romaji fading → kana only → kanji + kana → kanji only"
- Progressive hint system: hint 1 (category) → hint 2 (first character) → hint 3 (Korean parallel) → full answer
- Target success rate: ~70-85% (zone of proximal development)

### 6 new pillars to ADD:

**Pillar 3: Method of Loci (Memory Palace)**
- Science: most powerful memorization technique known; exploits spatial memory (O'Keefe & Nadel, 1978; Maguire et al., 2003)
- Implementation: each chapter assigns a SPECIFIC location in the reader's memory palace:
  - Ch02 Hiragana → Kitchen (46 characters at 46 spots)
  - Ch03 Katakana → Living room
  - Ch05 Survival phrases → Street from home to station
  - Ch06 Particles → Bathroom (11 particles at 11 spots)
  - Ch10 Kanji radicals → Bedroom
  - Ch12 Native vocabulary → Familiar park
- Pre-built "loci maps" (SVG diagrams) showing suggested placements
- Interactive "Walk the Palace" exercise
- "Palace Audit" quiz: location → item and item → location

**Pillar 7: Interleaving** — UPGRADE from existing brief mention:
- ADD: "'Interleave Mode' toggle on all quizzes — pulls items from current + 2 random previous chapters"
- ADD: "Confusion Pairs exercises: items that are easily confused presented together deliberately"
- ADD: citation (Taylor & Rohrer, 2010)

**Pillar 8: Generation Effect**
- Science: self-generated info remembered better than received info (Slamecka & Graf, 1978)
- Prioritize production exercises over recognition (fill-in > multiple choice)
- "Generate Before You See" protocol
- Sentence construction from scratch
- "Predict the Reading" for kanji
- "Create Your Own Mnemonic" prompts

**Pillar 10: Context-Dependent Memory**
- Science: retrieval strongest when context matches encoding (Tulving & Thomson, 1973; Godden & Baddeley, 1975)
- "Scene Setting" vivid narrative at start of each section
- Exercises use realistic situational prompts, not decontextualized drills
- "Tokyo Day Simulation" already exists — frame it explicitly as context-dependent encoding

**Pillar 11: Self-Reference Effect**
- Science: info encoded in relation to SELF remembered better (Rogers et al., 1977)
- Personalization prompts: "Think about YOUR favorite restaurant"
- "My Japanese Identity" exercise: reader builds their real self-introduction
- Exercises use reader's actual life details
- Personal vocabulary log stored via `window.storage`

**Pillar 12: Sleep Consolidation Protocol**
- Science: consolidation during sleep, especially slow-wave and REM (Diekelmann & Born, 2010)
- "Before Bed Review" widget: 5-minute focused recall session
- "Morning After" quiz: 3 items from previous evening
- Recommended schedule: new material morning, review evening, quick recall before sleep
- Guidance only — system suggests but doesn't enforce timing

---

## II-2. Expand Quiz Engine — 7 Types to 9 Types

**LOCATION:** Lines 87–99 (Interactive Component Specifications)

**ACTION:** Keep all 7 existing types, upgrade Type 1 and Type 7, and ADD 2 new types.

### Upgrade Type 1 (Click-to-Reveal Flashcard):
```
OLD: prompt → mental answer → flip → self-rate (Easy/Hard/Again)
NEW: prompt → 3-second forced thinking pause (visible timer) → flip → self-rate (Easy/Hard/Again). Feeds SM-2 scheduling.
```

### Upgrade Type 7 (Spaced Recall Check):
```
OLD: sidebar widget, random items from earlier chapters
NEW: sidebar widget pulling items due for review from ANY previous chapter. SM-2 scheduling per item. Not random — algorithm-selected based on due date and ease factor.
```

### ADD Type 8: Memory Palace Walker
```
8. **Memory Palace Walker** — interactive SVG map of a memory palace. Click locations to test recall. Sequential "Walk the route" mode available. System verifies correct item at each location.
```

### ADD Type 9: Predict-and-Verify
```
9. **Predict-and-Verify** — given partial information (Korean hanja reading, context clue), reader predicts the Japanese. Then reveals correct answer. Tracks prediction accuracy %. Specifically designed for Sino-vocabulary and kanji readings. Leverages generation effect.
```

### ADD after quiz types — Daily Review Engine specification:

```
**Daily Review Engine:**
- Landing page "Daily Review" button
- Pulls all items where `today >= last_review + interval_days`
- Orders by: overdue items first, then lowest ease_factor (hardest first)
- Session length: 15–25 items, ~5–10 minutes
- After session: shows accuracy %, items mastered, items to re-review, streak count
- Updates streak counter
```

### ADD — SM-2 item data structure:

```javascript
{
  id: "ch02-hiragana-ka",
  chapter: 2,
  type: "character", // character | vocabulary | grammar | phrase
  prompt: "か",
  answer: "ka",
  korean_bridge: "카",
  mnemonic: "CUT on the counter",
  palace_location: "Kitchen counter, left end",
  last_review: "2024-01-15",
  interval_days: 7,
  ease_factor: 2.5,
  times_reviewed: 4,
  times_correct: 3,
  created: "2024-01-01"
}
```

### ADD — SM-2 algorithm specification:

```javascript
function calculateNextReview(quality, previousInterval, easeFactor) {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;
  let newInterval;
  if (quality < 3) {
    newInterval = 1;
  } else if (previousInterval === 0) {
    newInterval = 1;
  } else if (previousInterval === 1) {
    newInterval = 3;
  } else {
    newInterval = Math.round(previousInterval * newEF);
  }
  return { interval: newInterval, easeFactor: newEF };
}
```

---

# III. META-INSTRUCTIONS CHANGES

---

## III-1. Project Scaffold — Add New Files and Directories

**LOCATION:** Lines 105–131 (Step 0: Project Scaffold)

**ACTION:** Add the following to the scaffold tree:

Under `src/js/`:
```
│   │   ├── spaced-repetition.js    # SM-2 algorithm + daily review engine      ← NEW
│   │   ├── memory-palace.js        # Interactive palace walker                  ← NEW
```

Under `src/assets/`:
```
│   ├── assets/
│   │   ├── palace-maps/            # SVG memory palace templates               ← NEW
│   │   └── mnemonic-images/        # SVG keyword images                        ← NEW
```

Under `docs/`:
```
│   └── MEMORY-SCIENCE-NOTES.md                                                 ← NEW
```

Update chapter file range:
```
OLD: ch-01.html through ch-18.html
NEW: ch-00.html through ch-20.html   # One file per chapter (21 files)
```

Update landing page comment:
```
OLD: # Landing: hero + chapter checklist + progress bar
NEW: # Landing: hero + checklist + progress + streak + daily review
```

Update quiz-engine.js comment:
```
OLD: # All 7 quiz types
NEW: # All 9 quiz/memory types
```

---

## III-2. CLAUDE.md — Add New Build Rules

**LOCATION:** Lines 133–156 (Step 1: CLAUDE.md)

**ACTION:** Apply the following changes to the CLAUDE.md template:

### Update Project Overview:
```
OLD: 18-chapter interactive HTML reference.
NEW: 20-chapter interactive HTML reference + memory system.
```
ADD: "SM-2 spaced repetition engine for all learned items."

### Add to Build Rules (after existing rule 4):
```
5. Every new vocabulary item must be registered in the SM-2 item database
6. Every keyword mnemonic must follow the format: Korean anchor → phonetic bridge → vivid image → Japanese word
```

### Update existing Build Rule 3:
```
OLD: ≥3 quiz widgets, ≥1 mnemonic SVG, ≥1 Recall Check (after Ch01), exercises at 3 difficulty tiers, "Mark as Complete ✅" button
NEW: ≥3 quiz widgets, ≥1 mnemonic SVG, ≥1 Recall Check (after Ch00), Memory Palace placement (after Ch00), exercises at 3 difficulty tiers, "Mark as Complete ✅" button
```

### Add to Pedagogical Non-Negotiables:
```
- NO vocabulary word without a keyword mnemonic chain (Korean → bridge → image → Japanese)
- NO character without a visual mnemonic AND palace placement
- Every chapter includes "Memory Technique Spotlight" sidebar explaining the science behind that chapter's primary technique
- All exercises default to PRODUCTION (generation) over RECOGNITION (multiple choice)
```

---

## III-3. PROGRESS.md — Add New Tracking Columns and Rows

**LOCATION:** Lines 158–196 (Step 2: PROGRESS.md)

**ACTION:** Apply all of the following changes:

### Add to Infrastructure checklist:
```
- [ ] SM-2 engine | - [ ] Memory palace walker | - [ ] Daily review engine
```

### Add 2 new columns to the Chapters table: "Palace" and "SM-2 Items"

New table header:
```
| Ch | Title | Status | Quizzes | Mnemonics | Palace | Recall | SM-2 Items | QA | Pedagogy |
```

Palace and SM-2 Items values per chapter:
| Ch | Palace | SM-2 Items |
|----|--------|-----------|
| 00 | Setup | N/A |
| 01 | ⬜ | ⬜ |
| 02 | Kitchen | 46+ |
| 03 | Living Room | 46+ |
| 04 | ⬜ | ⬜ |
| 05 | Street | 80+ |
| 06 | Bathroom | 11+ |
| 07 | ⬜ | 30+ |
| 08 | ⬜ | 60+ |
| 09 | ⬜ | 20+ |
| 10 | Bedroom | 100+ |
| 11 | ⬜ | 100+ |
| 12 | Park | 200+ |
| 13 | ⬜ | 30+ |
| 14 | ⬜ | ⬜ |
| 15 | ⬜ | ⬜ |
| 16 | ⬜ | ⬜ |
| 17 | ⬜ | 20+ |
| 18 | ⬜ | ⬜ |
| 19 | All | Review |
| 20 | ⬜ | N/A |

### Insert Ch00 row before Ch01:
```
| 00 | Memory Science | ⬜ | ⬜ | ⬜ | Setup | N/A | N/A | ⬜ | ⬜ |
```

### Append Ch19 and Ch20 rows after Ch18:
```
| 19 | Memory Palace | ⬜ | ⬜ | ⬜ | All | ⬜ | Review | ⬜ | ⬜ |
| 20 | 90-Day Sprint | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | N/A | ⬜ | ⬜ |
```

### Add to Appendices checklist:
```
- [ ] Palace Templates | - [ ] 90-Day Calendar | - [ ] Mnemonic Image Bank (200+)
```

---

## III-4. Execution Sequence — Update

**LOCATION:** Lines 193–196

**ACTION:** Replace with:
```
**Infrastructure:** SM-2 engine → Quiz engine (9 types) → Memory palace walker → CSS/JS from FUSO → index.html with checklist + progress bar + streak + daily review → sidebar with checkboxes → fonts → CJK rendering.
**Content:** Chapters 00–20 in order. Per chapter: spec → draft → mnemonic SVGs → palace map → quiz widgets → SM-2 item registration → ch-XX.html → QA → PROGRESS.md.
**Appendices → Final QA.**
```

---

# IV. CORE THESIS — Add Memory Problem

**LOCATION:** Lines 200–214 (THE CORE THESIS)

**ACTION:** The existing thesis addresses only the "transfer problem." ADD a second thesis about the "memory problem."

After the existing opening paragraph, INSERT:

```
**This document attacks TWO problems simultaneously:**

1. **The Transfer Problem:** Standard textbooks are designed for English speakers. They waste weeks on concepts a Korean speaker already knows. We exploit the transfer ruthlessly.

2. **The Memory Problem:** Even resources designed for Korean speakers still teach via passive reading, list memorization, and massed practice — the LEAST effective methods known to cognitive science. We replace every passive moment with an active memory technique.
```

In the "What does NOT transfer" list, ADD a "Memory Strategy" column:

| Area | Difficulty | Memory Strategy to ADD |
|------|-----------|----------------------|
| Writing system | ★★★★ | Method of Loci (palace) + keyword images (Ch02-03) |
| Pronunciation | ★★ | Motor encoding + perceptual training |
| Vocabulary | ★★★★★ | Keyword method + vivid imagery + spaced repetition |
| Verb conjugation | ★★★ | Procedural memory + pattern drills |
| Cultural pragmatics | ★★ | Narrative encoding + cultural schema building |

UPDATE the timeline:
```
OLD: "Starting from ~40%. English speakers: ~2,200 hours. You: ~800-1,000."
NEW: "Starting from ~40%. English speakers: ~2,200 hours to JLPT N2. Korean speakers with conventional study: ~1,000 hours. Korean speakers with Memory Architecture: ~600–700 hours. Why? Because you eliminate ~60% of re-study time by encoding correctly the FIRST time."
```

---

# V. CHAPTER-BY-CHAPTER IMPROVEMENTS

---

## V-0. ADD NEW CHAPTER: Chapter 00 — How Your Memory Works

**LOCATION:** Insert BEFORE Chapter 01 (before line 221)

**ACTION:** Add a complete new chapter specification. This chapter has 4 sections:

### Section 0A: The Forgetting Curve — Your Enemy
- Interactive SVG: Ebbinghaus forgetting curve with 3 lines (no review / single review / spaced reviews)
- Key message: "Without a system, you forget 80%. The solution is 'study smarter.'"

### Section 0B: The Twelve Pillars (Simplified for the Learner)
- Present each pillar as a simple rule + analogy table (12 rows)
- Example format: Retrieval Practice → "Lifting weights, not watching fitness videos"

### Section 0C: Building Your First Memory Palace
- Step-by-step guided exercise using the reader's Korean home/apartment
- 12 loci established in fixed walking order: front door → shoe area → kitchen → dining table → living room → sofa → TV area → bathroom → bedroom → desk → window → balcony
- Interactive SVG: floor plan of typical Korean apartment with numbered loci
- Quiz (Type 8): Practice walking the empty palace

### Section 0D: The Daily Routine
- Recommended daily structure table: morning (new material, 20-30min), morning (generate/produce, 5-10min), evening (daily review SM-2, 10-15min), before bed (palace walk, 5min)
- Streak system introduction

**Quizzes:** 2+ (palace walker + pillar matching)

---

## V-1. Chapter 01 — Add Memory Technique Spotlight + Enhancements

**LOCATION:** Lines 221–255

**ACTION:** Apply these additions:

1. ADD at chapter top: `**Memory Technique Spotlight:** Schema Activation — activating existing knowledge structures so new information attaches to them, not learned in isolation.`

2. ADD pre-test (Elaborative Interrogation): "Before reading anything, try to answer: What do you think Korean and Japanese have in common? Write down 5 guesses."

3. ADD a 5th column "Memory Note" to the grammar transfer map table indicating memory strategy per row (e.g., "No memorization needed — just use Korean order" for items that transfer 100%)

4. EXPAND the "Doesn't transfer" list into a table with a "Memory Strategy" column mapping each area to its technique and chapter reference

5. ADD post-test: "Look at your 5 guesses from the beginning. How many were right?"

6. ADD Palace Placement note: "This chapter activates the schema but doesn't add palace items."

---

## V-2. Chapter 02 — Deep Memory Palace Integration

**LOCATION:** Lines 258–278

**ACTION:** This chapter requires the most significant expansion. Add all of the following:

1. ADD: `**Memory Technique Spotlight:** Method of Loci — placing each hiragana at a specific location in your kitchen.`

2. ADD: `**Palace Assignment: The Kitchen (부엌)**` with SVG diagram of a Korean kitchen showing 46+ marked positions mapped to hiragana rows:
   - Refrigerator surface: vowels あいうえお
   - Kitchen counter: ka-row
   - Sink: sa-row
   - Stove: ta-row
   - Pots hanging above: na-row
   - Rice cooker: ha-row
   - Microwave: ma-row
   - Kitchen window: ya-row
   - Kitchen table: ra-row
   - Kitchen door: wa-row + ん

3. EXPAND every character's mnemonic entry to include ALL of:
   - Visual mnemonic SVG
   - Story sentence
   - Korean approximation
   - **Keyword bridge word** (NEW — a real English/Korean word that sounds like the character)
   - **Memory palace scene** (NEW — vivid scene at the specific kitchen location)
   - Stroke order
   - Practice word
   - **SM-2 registration** (NEW)

4. ADD specific pronunciation warnings at し (must be "shi" not "si"), つ (doesn't exist in Korean), ふ (bilabial fricative)

5. ADD Palace Walker quiz (Type 8): Walk through the kitchen, recall characters at each spot

6. ADD to Boss Level: "Read Real Words" — 20 real Japanese words in hiragana → type romaji

---

## V-3. Chapter 03 — Add Contrastive Encoding System

**LOCATION:** Lines 281–288

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Dual Coding + Contrastive Encoding — learning katakana BY CONTRAST with already-known hiragana.`

2. ADD: `**Palace Assignment: The Living Room (거실)**`

3. ADD contrastive encoding format: every katakana taught as a PAIR with its hiragana counterpart, showing visual contrast mnemonic (e.g., "あ is a person doing a kick. ア is just the FIRST stroke — sharper, quicker, modern")

4. EXPAND the loanword bridge table from "~50" to a fully specified 50-entry table with Korean (외래어) and Japanese (カタカナ) columns plus similarity ratings

5. ADD confusable pairs discrimination drill: シ vs ツ, ソ vs ン, ノ vs メ, ウ vs フ — with visual distinction mnemonics and a dedicated quiz requiring 20 in a row correct

6. ADD Generation Exercise: "Given the Korean loanword, PREDICT the Japanese katakana before looking."

---

## V-4. Chapter 04 — Expand Each Trap

**LOCATION:** Lines 292–303

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Motor Encoding + Perceptual Training`

2. ADD "What's EASIER" comparison table (Korean features vs Japanese features) showing Japanese is simpler

3. EXPAND each of the 6 traps from one-line descriptions to full specifications:
   - Problem statement (what Korean speakers do wrong)
   - "What it sounds like" (to a Japanese listener)
   - Fix (specific articulatory instruction)
   - Korean-specific bridge instruction (e.g., "Japanese k is BETWEEN Korean ㄱ and ㅋ — volume 5-6 on a 1-10 scale")
   - Mnemonic for the fix
   - Practice drill with minimal pairs

4. ADD minimal pair table for Trap 3 (Long vowels): おばさん/おばあさん, おじさん/おじいさん, ビル/ビール with pattern insight: "longer sound = bigger/older/more"

---

## V-5. Chapter 05 — Add Scene Setting + Palace Spots

**LOCATION:** Lines 307–498

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Context-Dependent Memory + Situational Encoding`

2. ADD: `**Palace Assignment: The Street (집에서 역까지 가는 길)**` — build a memory palace from home to the nearest station, with each section mapped to a stretch of the route:
   - 5A Restaurant → restaurant you pass
   - 5B Shopping → convenience store
   - 5C Directions → intersection
   - 5D Transportation → station
   - 5E Polite phrases → front door
   - 5F Emergency → hospital sign
   - 5G Numbers → price signs on shops

3. ADD "Scene Setting" vivid narrative at the start of each section (e.g., "Imagine you've just landed in Tokyo. It's your first evening. You're hungry...")

4. ADD a "Palace Spot" column to every phrase table — each phrase gets a specific memorable location on the route

5. ADD a # column for sequential numbering of all phrases (helps SM-2 tracking)

6. ADD to the existing survival phrase format requirement:
   ```
   7. Palace placement: specific spot on the home-to-station route      ← NEW
   8. SM-2 registration for spaced review                               ← NEW
   ```

7. ADD Memory Palace Walker quiz (Type 8) at end: Walk the home-to-station route, recall phrases at each location

8. EXPAND the "Tokyo Day Simulation" Boss Level from 8 steps to 11 steps (add: buying a ticket, getting lost and asking directions, taking a taxi)

---

## V-6. Chapter 06 — Add Bathroom Palace + Deeper Elaboration

**LOCATION:** Lines 502–529

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Analogical Transfer + Elaborative Interrogation`

2. ADD: `**Palace Assignment: The Bathroom (화장실)**` — each particle mapped to a specific bathroom fixture:
   - は → Mirror (you look at yourself — YOU are the topic)
   - が → Towel hook (GRABS the towel)
   - を → Toilet paper roll (WRAPPED)
   - に → Tile grout (NEEDLE-thin lines)
   - で → Shower (where you DO washing)
   - へ → Door (going TOWARD exit)
   - の → Bath drain (spiral connecting)
   - から → Faucet (water COMES FROM)
   - まで → Bathtub (fill to the line — UNTIL)
   - も → Toothbrush holder (MOre!)
   - と → Double sink (TIED together)

3. ADD "Retroactive Understanding" exercise before new content: quote 4+ phrases from Ch05 and identify the particles hiding inside them

4. EXPAND particle table to include Palace Spot column and Elaborative Interrogation column (a "WHY?" question per particle)

5. ADD は vs が deep-dive section with 5+ pattern examples showing where Korean mapping is reliable (95% of cases)

6. ADD "Confusion Zones" expanded table showing how Japanese particles cover multiple Korean particles with examples

7. ADD Palace Walker quiz (Type 8) and Confusion Zone quiz (Type 3: Korean 에서 → is it で or から in THIS context?)

---

## V-7. Chapter 07 — Add Procedural Memory Focus + Full Conjugation Tables

**LOCATION:** Lines 533–550

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Procedural Memory + Pattern Completion`

2. EXPAND the anchor verb 食べる table to show ALL major conjugation forms (12+ rows) with Korean 먹다 parallel for each

3. ADD explicit verb group classification with mnemonics:
   - Group 2: "ONE step — drop る, done."
   - Group 1: "FIVE steps — ending vowel walks through あいうえお."
   - Group 3: "Only TWO troublemakers: する and 来る."

4. EXPAND te-form to full table (9 rows with all rules), not just mnemonic summary

5. ADD te-form mnemonic song: "U-TSU-RU → って, MU-BU-NU → んで, KU → いて, GU → いで, SU → して"

6. EXPAND adjective system with conjugation examples for both い-adj and な-adj

---

## V-8. Chapter 08 — Add Episode Encoding + Self-Reference

**LOCATION:** Lines 554–590

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Episode Encoding + Social Simulation`

2. EXPAND self-introduction to full line-by-line table (6 rows) with Japanese, Korean parallel, and function for each line

3. ADD Self-Reference Effect exercise: "Fill in YOUR actual information. Practice YOUR actual self-introduction."

4. ADD keyword mnemonics for key new phrases (e.g., どうぞよろしくお願いします, 本当に, マジで)

5. EXPAND small talk patterns into full tables with keyword mnemonics

6. ADD filler word table with explicit Korean→Japanese mapping (8+ entries including そうなんだ, そうそう)

7. ADD Apology Escalation table (4 levels) with explicit Korean level parallels

8. ADD Boss Level: Full Conversation simulation (greeting → intro → small talk → plans → goodbye)

---

## V-9. Chapter 09 — Add Chunking Focus + Conditional Pattern

**LOCATION:** Lines 594–613

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Chunking + Schema Construction`

2. EXPAND Pattern 1 (いる/ある) with elaborative interrogation: "WHY does Japanese split 있다 into two verbs?" + answer about autonomous movement categorization

3. EXPAND Pattern 3 (Giving/Receiving) with SVG river diagram description and full direction labels

4. ADD Pattern 6: Conditional (ば/たら/と/なら) — mapped to Korean ~면 with the insight "Japanese splits ~면 four ways"

---

## V-10. Chapter 10 — Add Sound Rules Table + Radical Palace

**LOCATION:** Lines 617–633

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Morphological Decomposition + Hanja Bridge`

2. ADD: `**Palace Assignment: The Bedroom (침실)**` — 30 radicals at bedroom positions

3. EXPAND Sound Correspondence Rules from brief mention to full table with 9 rules, each with 3+ examples and a rule mnemonic:
   - ㅎ→k: "H to K — HACK becomes KACK"
   - ㅂ→h: "B to H — BALL becomes HALL"
   - ㅈ→s/sh: "J to S — JAM becomes SAM"
   - etc.

4. ADD "Predict the Reading" generation exercise (Type 9): 20+ 한자어 where reader predicts Japanese from Korean, then verifies

5. EXPAND cognate accelerator from "100+ entries" to at minimum one fully specified domain (Education) with 7+ entries as a template

6. ADD 30 most useful radicals table with meaning, mnemonic, and palace spot (bedroom location)

---

## V-11. Chapter 11 — Add False Friends Table

**LOCATION:** Lines 637–644

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Sound Correspondence Rules + Generation Effect`

2. EXPAND false friends from "30+" to a fully specified table of at least 8 entries with columns: Kanji, Korean Meaning, Japanese Meaning, Danger Level (★), Example — including the critical ones: 大丈夫, 人参, 愛人, 工夫, 手紙

3. ADD "Predict and Verify Marathon" (Type 9): 50 words, tracks accuracy %

4. ADD "News Headline Translation" Boss Level

---

## V-12. Chapter 12 — Full Keyword Mnemonic Architecture

**LOCATION:** Lines 648–665

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Keyword Method + Vivid Imagery`

2. ADD: `**Palace Assignment: A Familiar Park (공원)**`

3. EXPAND the vocabulary table format from 4 columns to include Keyword and Vivid Image columns:
   ```
   | Japanese | Reading | Meaning | Korean | Keyword | Vivid Image |
   ```

4. EXPAND the word list from 6 examples to at minimum 30 fully specified entries across categories: Body/Health (10), Nature/Weather (8), Emotions/States (12+)

5. ADD vivid, bizarre, exaggerated image descriptions for each word (e.g., 食べる: "Smashing face into a TABLE to eat — food flying, sauce dripping")

6. ADD onomatopoeia table expansion with vivid mnemonics for each entry

7. ADD Palace Walker (Type 8) and "Story Writing" Boss Level (write a story using 20+ wago — generation effect)

---

## V-13. Chapter 13 — Add Special Verb Pairs Table + Role-Play

**LOCATION:** Lines 669–679

**ACTION:**

1. ADD: `**Memory Technique Spotlight:** Pragmatic Schema + Role-Play Encoding`

2. ADD structural comparison table: Korean 해요체/높임말/겸양어 mapped to Japanese 丁寧語/尊敬語/謙譲語

3. ADD special verb pairs table: 10 meanings (go, come, be, eat, say, see, know, give, receive + 1 more) with plain/sonkeigo/kenjougo/Korean columns

4. ADD keyword mnemonics for key keigo verbs: いらっしゃる, いただく

5. ADD 3 scenario-based practice exercises (meeting boss's boss, customer phone call, register switching)

6. ADD Boss Level: Business Email writing in keigo

---

## V-14–V-18. Chapters 14-18 — Add Memory Technique Spotlights

**LOCATION:** Lines 683–726

**ACTION:** For each chapter, ADD a `**Memory Technique Spotlight:**` line:

| Ch | Spotlight to ADD |
|----|-----------------|
| 14 | Extensive Reading + Incidental Acquisition |
| 15 | Production Effect + Error-Based Learning |
| 16 | Perceptual Learning + Shadowing Protocol |
| 17 | Cultural Schema + Narrative Encoding |
| 18 | Metacognitive Strategy + Self-Regulated Learning |

For Ch15, ADD: Korean internet shorthand parallels (ㅋㅋㅋ → www, ㅠㅠ → T_T)

For Ch18, UPDATE closing quote to reference memory architecture:
```
"이 책에서 배운 기억의 궁전, 간격 반복, 키워드 연상법은 일본어뿐만 아니라 앞으로 어떤 것을 배우든 평생 사용할 수 있는 도구입니다."
```

---

## V-19. ADD NEW CHAPTER: Chapter 19 — Your Memory Palace

**LOCATION:** Insert after Chapter 18

**ACTION:** Add complete new chapter specification:

1. **Purpose:** Consolidation. Link all palaces, audit them, teach expansion and maintenance.

2. **Palace Inventory Audit:** Interactive exercise walking through EVERY palace:
   - Kitchen: 46 hiragana
   - Living Room: 46 katakana
   - Street Route: 60+ survival phrases
   - Bathroom: 11 particles
   - Bedroom: 30 radicals
   - Park: 200+ wago

3. **Palace Linking:** Connect all palaces into ONE continuous Grand Tour route

4. **Building New Palaces:** Teach reader to create palaces for future vocabulary (workplace, school, gym, restaurant)

5. **Maintenance Schedule table:** Daily (SM-2 review, 10-15min), Weekly (walk one palace, 10min), Monthly (walk all, 30-60min), Quarterly (Grand Tour, 45min)

---

## V-20. ADD NEW CHAPTER: Chapter 20 — The 90-Day Sprint

**LOCATION:** Insert after Chapter 19

**ACTION:** Add complete new chapter specification:

1. **Purpose:** Structured 90-day intensive plan integrating all Memory Architecture techniques

2. **90-Day Calendar** in 3 phases:
   - Phase 1 Foundation (Days 1-30): Ch00-07, 45min/day
   - Phase 2 Expansion (Days 31-60): Ch08-11, 45-60min/day
   - Phase 3 Depth (Days 61-90): Ch12-20, 45min/day

3. **Habit Stacking table:** Attach study to existing habits:
   - After waking → Morning Review (5min, Spaced Repetition)
   - During commute → Listen to NHK Easy (20-30min, Listening)
   - During lunch → New chapter section (15-20min, Encoding)
   - After dinner → Practice exercises (15-20min, Generation)
   - Before bed → Palace Walk + hard items (5-10min, Loci + Sleep)

4. **Progress Metrics:** Self-assessment at Day 30, 60, 90 with specific targets (hiragana speed, phrase recall %, vocabulary count, kanji count)

5. **Closing Message** (bilingual Korean/Japanese)

---

# VI. DOCUMENT-WIDE REQUIREMENTS UPDATES

---

## VI-1. Language Display Convention — Adjust for Ch00

**LOCATION:** Lines 732-734

**ACTION:**
```
OLD: Chapters 01-09: kanji/kana + (romaji) + Korean equivalent
NEW: Chapters 00-09: kanji/kana + (romaji) + Korean equivalent
```

---

## VI-2. Interactive Exercise Minimums — Expand Table

**LOCATION:** Lines 736–745

**ACTION:** Replace entire table with expanded version:

| Chapter Type | Min Quizzes | Min Mnemonics | Palace | Recall Check | SM-2 Items | Tiers |
|-------------|------------|--------------|--------|-------------|-----------|-------|
| Meta (00) | 2+ | Palace setup | Build palace | N/A | N/A | N/A |
| Script (02,03) | 5+ (incl sprint+palace) | Every character | Walk kitchen/living room | From prev ch | 46+ per ch | Warm-Up, Challenge, Boss |
| Pronunciation (04) | 4+ | Key traps | N/A | 2-3 ch ago | N/A | Warm-Up, Challenge, Boss |
| Survival/Conv (05,08) | 5+ (incl simulation) | Key phrases | Walk route | 2-3 ch ago | 60-80+ | Warm-Up, Challenge, Boss |
| Grammar (06,07,09) | 4+ (incl builder+palace) | Key rules | Walk bathroom | 2-3 ch ago | 11-30+ | Warm-Up, Challenge, Boss |
| Kanji/Vocab (10,11,12) | 4+ (incl predict+sprint) | Every word/radical | Walk bedroom/park | 2-3 ch ago | 100-200+ | Warm-Up, Challenge, Boss |
| Depth (13-18) | 3+ (incl role-play) | Key concepts | Reference | All prior | 20-30+ | Challenge, Boss |
| Capstone (19) | Palace Grand Tour | — | ALL | Comprehensive | Review | Audit |
| Sprint (20) | Self-assessment | — | Linked route | Comprehensive | N/A | Plan |

Key additions: "Palace" column, "SM-2 Items" column, palace-specific quiz requirements, new rows for Ch00/19/20.

---

## VI-3. Chapter Completion System — Update Counts

**LOCATION:** Lines 747–751

**ACTION:**
```
OLD: Sidebar: 18 chapters with checkboxes ... "X/18 complete"
NEW: Sidebar: 20 chapters with checkboxes ... "X/20 complete"
```

ADD:
```
- Memory streak counter: "🔥 X-day streak" on landing page
- Condition: complete ≥1 Daily Review OR ≥1 Palace Walk per day
- Milestone celebrations: 7 days, 14 days, 30 days, 60 days, 90 days
- Stored via `window.storage.set('streak_count', X)` and `window.storage.set('last_review_date', date)`
```

---

## VI-4. Design System Adaptation — Add Memory Motif + Color Coding

**LOCATION:** Lines 753–760

**ACTION:** Apply these changes:

```
OLD Badge: "Zero to Hero — 日本語 for Korean Speakers"
NEW Badge: "Zero to Hero — 日本語 Memory Architecture Edition"

OLD Title: "From 한국어 to 日本語 — The Bridge Builder's Guide"
NEW Title: "From 한국어 to 日本語 — The Memory Architect's Guide"

OLD Subtitle: "Not a standard textbook — a systematic exploitation of everything you already know."
NEW Subtitle: "Not a standard textbook — a systematic exploitation of everything you already know, powered by the science of memory."

OLD Sidebar: flat list of 18 chapters with checkboxes
NEW Sidebar: flat list of 20 chapters with checkboxes + streak counter
```

ADD hero description update:
```
OLD: torii gate or ink brush stroke SVG
NEW: torii gate or ink brush stroke SVG with memory palace motif (palace gate)
```

ADD color coding system:
```
- Color coding: blue = Japanese text, green = Korean parallel, orange = mnemonic bridge, purple = memory technique callout
```

---

## VI-5. Appendices — Add 3 New Appendices

**LOCATION:** Lines 762–774

**ACTION:** Keep existing 4 appendices, add "sound rule applied" field to Cognate Reference entries. Then ADD:

### Appendix E: Memory Palace Templates
Pre-built SVG maps for each palace location:
- Kitchen (hiragana) — 46 positions
- Living room (katakana) — 46 positions
- Home-to-station route (survival phrases) — 30 positions
- Bathroom (particles) — 11 positions
- Bedroom (radicals) — 30 positions
- Park (native vocabulary) — 50 positions
Each template: labeled SVG diagram + suggested placement list + walking order.

### Appendix F: Optimal Spaced Repetition Schedule
90-day calendar showing:
- New items introduced per day (10-20 recommended)
- Review items due per day (SM-2 calculated)
- Projected total items mastered at each checkpoint
- Daily time estimate (15-60 min depending on review load)

### Appendix G: Mnemonic Image Bank
200+ keyword mnemonic images, organized alphabetically:
- Each entry: Japanese word, keyword, image description, SVG reference
- Cross-referenced to chapter and palace location

---

## VI-6. Estimated Scale — Update Numbers

**LOCATION:** Lines 776–781

**ACTION:** Replace with:

```
## Estimated Scale
- 20 chapters + 7 appendices = 27 sections
- Each chapter: 3,000-8,000 words + tables + mnemonics + quizzes + palace maps
- Total: ~100,000-130,000 words
- Quiz widgets: ~120+
- Mnemonic SVGs: ~200+
- Palace map SVGs: ~6 major palaces
- SM-2 tracked items: ~800+
- Memory palace locations: ~200+
```

---

# VII. SUMMARY CHECKLIST — ALL IMPROVEMENTS AT A GLANCE

Use this checklist to verify all improvements have been applied:

## Structural
- [ ] Header metadata updated (badge, version, target reader, endgame)
- [ ] Chapter 00 added (Memory Science)
- [ ] Chapter 19 added (Memory Palace)
- [ ] Chapter 20 added (90-Day Sprint)
- [ ] TOC updated (20 chapters, Memory Technique Focus column)
- [ ] 3 new appendices added (E, F, G)
- [ ] Chapter count references updated throughout (18→20)

## Framework
- [ ] 6 Pillars → 12 Pillars (6 upgraded + 6 new)
- [ ] Method of Loci pillar added with palace assignments per chapter
- [ ] Generation Effect pillar added
- [ ] Context-Dependent Memory pillar added
- [ ] Self-Reference Effect pillar added
- [ ] Sleep Consolidation pillar added
- [ ] Interleaving pillar expanded
- [ ] Quiz engine: 7 types → 9 types (Palace Walker + Predict-and-Verify)
- [ ] SM-2 spaced repetition engine specification added
- [ ] Daily Review Engine specification added
- [ ] Memory Streak system specification added

## Infrastructure
- [ ] Scaffold: spaced-repetition.js added
- [ ] Scaffold: memory-palace.js added
- [ ] Scaffold: palace-maps/ directory added
- [ ] Scaffold: mnemonic-images/ directory added
- [ ] Scaffold: MEMORY-SCIENCE-NOTES.md added
- [ ] Scaffold: ch-00.html through ch-20.html (21 files)
- [ ] CLAUDE.md: new build rules (SM-2 registration, keyword format)
- [ ] PROGRESS.md: Palace and SM-2 Items columns added
- [ ] PROGRESS.md: Ch00, Ch19, Ch20 rows added
- [ ] Execution sequence updated

## Per-Chapter (for each of Ch01-18)
- [ ] Memory Technique Spotlight added
- [ ] Palace assignment added (where applicable)
- [ ] SM-2 registration requirement noted
- [ ] Keyword mnemonic chain format specified (where applicable)
- [ ] Palace Walker quiz added (where palace assigned)
- [ ] Content expanded per chapter-specific instructions above

## Document-Wide
- [ ] Language convention updated for Ch00-09
- [ ] Exercise minimums table expanded (Palace, SM-2 columns)
- [ ] Completion system updated (20 chapters + streak)
- [ ] Design system updated (badge, title, subtitle, color coding)
- [ ] Estimated scale updated
- [ ] Core thesis: memory problem added
- [ ] Timeline updated (600-700 hours)
