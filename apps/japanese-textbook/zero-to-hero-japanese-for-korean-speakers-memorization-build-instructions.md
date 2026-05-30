# Zero to Hero: Japanese for Korean Speakers — Memory Architecture Edition
## Complete Build Instructions for an LLM

> **What this is:** Complete instructions to hand to an LLM (with the FUSO HMI HTML file as a design reference) to build a comprehensive, interactive HTML reference document that takes a highly proficient Korean speaker from zero Japanese to functional fluency — reading, writing, speaking, and listening — by systematically leveraging the massive structural overlap between Korean and Japanese AND by deeply integrating state-of-the-art memorization science into every page, exercise, and interaction.
>
> **What makes this version different:** This is not a textbook with quizzes bolted on. Every chapter is built around a **Memory Architecture** — a system of interconnected memorization techniques drawn from cognitive science research (2000–2025). The learning experience is designed so that forgetting is structurally impossible if the reader follows the system. Techniques include: spaced retrieval practice, method of loci (memory palace), keyword mnemonics with vivid imagery, dual coding, elaborative interrogation, interleaving, generation effect, desirable difficulty calibration, retrieval-induced facilitation, sleep-aware scheduling, chunking via schema activation, context-dependent encoding, self-reference effect, and metamemory training.
>
> **Target reader:** An adult native Korean speaker (한국어 모국어 화자) with full command of Korean grammar, vocabulary, and writing. They understand 존댓말/반말 systems intuitively, are native-level with particles (조사), SOV word order, topic/subject marking (은/는 vs 이/가), agglutinative verb conjugation, and hanja-based vocabulary. They know ZERO Japanese — no hiragana, no kanji, no vocabulary. But their Korean gives them an enormous head start that this document ruthlessly exploits.
>
> **Language of instruction:** English. Korean is used extensively for direct comparisons, bridges, and anchoring. Japanese content presented in all three scripts with romaji for Chapters 01–09, dropping romaji from Chapter 10 onward.
>
> **Design system:** Identical to the FUSO HMI Expert Reference. Same fonts, colors, components, dark/light theme, sidebar, responsive layout. Rebrand with Japanese aesthetic — torii gate or ink brush stroke SVG silhouette. Badge: "Zero to Hero — 日本語 Memory Architecture Edition."
>
> **The endgame:** By the final chapter, the reader should be able to: (1) read and write all three Japanese scripts including ~1,200 kanji, (2) hold everyday conversations in both polite and casual registers, (3) consume native Japanese media (news, manga, YouTube) with reasonable comprehension, (4) understand the keigo (敬語) system by mapping it against Korean 존댓말, (5) pass JLPT N3 with preparation toward N2, (6) leverage their Korean hanja knowledge to rapidly expand vocabulary, (7) have internalized a personal memory system they can use for ANY future language learning.
>
> **Document version:** v1.0 — Memory Architecture Edition. Survival-first chapter order with deep memorization science integration. Every technique is evidence-based with citations.

---

# TABLE OF CONTENTS — INTERACTIVE CHECKLIST

The sidebar and landing page render this as an interactive checklist. Each chapter has a clickable checkbox that persists via `window.storage`. A progress bar at the top shows "X/20 complete." Memory streak counter shows consecutive days of recall practice.

| ☐ | Ch | Title | Memory Technique Focus |
|---|-----|-------|----------------------|
| ☐ | 00 | How Your Memory Works — The Science Behind This Book | Metamemory + System Overview |
| ☐ | 01 | Your Korean Advantage — What Transfers and What Doesn't | Schema Activation + Transfer Theory |
| ☐ | 02 | Hiragana — Your First Script (ひらがな) | Method of Loci + Keyword Mnemonics |
| ☐ | 03 | Katakana — The Foreign Word Script (カタカナ) | Dual Coding + Contrastive Encoding |
| ☐ | 04 | Pronunciation — Where Korean Habits Help and Hurt | Motor Encoding + Minimal Pair Drilling |
| ☐ | 05 | Survival Japanese — Restaurants, Shopping, Getting Around | Situational Encoding + Context-Dependent Memory |
| ☐ | 06 | Particles — The 1:1 Map (助詞/조사) | Analogical Transfer + Elaborative Interrogation |
| ☐ | 07 | Verb Conjugation — Same System, Different Clothes (動詞/동사) | Procedural Memory + Pattern Completion |
| ☐ | 08 | Daily Conversations — Phrases That Get You Through the Day | Episode Encoding + Social Simulation |
| ☐ | 09 | Sentence Patterns — Thinking in Japanese (文型/문형) | Chunking + Schema Construction |
| ☐ | 10 | Kanji — The Long Game (漢字/한자) | Morphological Decomposition + Hanja Bridge |
| ☐ | 11 | Sino-Vocabulary Turbocharger (漢語/한자어) | Sound Correspondence Rules + Generation Effect |
| ☐ | 12 | Native Japanese Vocabulary — Words Korean Can't Help With (和語) | Keyword Method + Vivid Imagery |
| ☐ | 13 | Honorifics and Politeness — Mapping 존댓말 to 敬語 | Pragmatic Schema + Role-Play Encoding |
| ☐ | 14 | Reading Real Japanese — Newspapers, Manga, and the Web | Extensive Reading + Incidental Acquisition |
| ☐ | 15 | Writing — From Texts to Business Emails | Production Effect + Error-Based Learning |
| ☐ | 16 | Listening — Training Your Ear for Japanese | Perceptual Learning + Shadowing Protocol |
| ☐ | 17 | Cultural Pragmatics — What the Textbook Won't Teach You | Cultural Schema + Narrative Encoding |
| ☐ | 18 | JLPT and Beyond — The Path to True Fluency | Metacognitive Strategy + Self-Regulated Learning |
| ☐ | 19 | Your Memory Palace — Building the Permanent Architecture | Method of Loci Mastery + Long-Term Consolidation |
| ☐ | 20 | The 90-Day Sprint — Putting It All Together | Distributed Practice Schedule + Habit Stacking |

**Appendices** (no checkbox — reference material):
- Appendix A: Glossary
- Appendix B: Cognate Reference (500+ Sino-vocabulary words)
- Appendix C: Sound Correspondence Cheat Sheet
- Appendix D: False Friends (50+ entries)
- Appendix E: Memory Palace Templates (pre-built loci for each chapter)
- Appendix F: Optimal Spaced Repetition Schedule (90-day calendar)
- Appendix G: Mnemonic Image Bank (200+ keyword images)

**Design rationale for chapter order:** Chapter 00 (memory science) comes first because the reader must understand WHY they're doing each exercise — metamemory research shows that learners who understand the science behind techniques use them 40% more consistently (Dunlosky et al., 2013). Then scripts (Ch02-03), pronunciation (Ch04), and immediate real-world use (Ch05). Grammar theory (Ch06-09) AFTER the reader has tasted practical success. Kanji (Ch10) delayed because the reader can function with kana alone through Ch05-09. Chapters 19-20 are capstone: build the permanent memory architecture and execute a structured 90-day intensive plan.

**Implementation notes for the table of contents:**
- Sidebar: persistent navigation with checkboxes, flat list (no grouping)
- Landing page: large visual checklist with chapter descriptions + global progress bar + memory streak counter
- Checkbox state via `window.storage.set('ch-XX-complete', 'true')` / `window.storage.get('ch-XX-complete')`
- Completed: ✅ icon + subtle green left-border accent
- Progress bar: 20 segments, "X/20 complete"
- Memory streak: consecutive days with ≥1 recall check completed, stored via `window.storage`
- Each chapter page: "Mark as Complete ✅" button at bottom

---

# MEMORIZATION SCIENCE FRAMEWORK — THE FOUNDATION

This is the core intellectual engine of the document. Every chapter implements these techniques. This section defines them precisely so the LLM knows exactly what to build.

## The Twelve Pillars of Memory Architecture

### Pillar 1: Retrieval Practice (Active Recall)
**The science:** Testing yourself on material produces 50–100% better long-term retention than re-reading or re-studying the same material for the same amount of time (Roediger & Karpicke, 2006; Karpicke & Blunt, 2011). The act of RETRIEVING a memory strengthens it more than the act of ENCODING it again.

**Implementation in every chapter:**
- Interactive quizzes after every major concept — reader must PRODUCE the answer before seeing it
- No "hover to see answer" — force click-to-reveal with a mandatory 3-second thinking pause (timer shown)
- Self-rating: Easy / Hard / Again — feeds into per-item spaced repetition schedule
- "Retrieval Roulette" widget: randomly pulls items from ANY previous chapter for surprise recall

### Pillar 2: Spaced Repetition (Distributed Practice)
**The science:** Reviewing material at expanding intervals (1 day → 3 days → 7 days → 14 days → 30 days → 90 days) produces dramatically superior retention compared to massed practice. The optimal gap between reviews increases as the memory strengthens (Cepeda et al., 2006; Pashler et al., 2007). The Ebbinghaus forgetting curve shows ~70% memory loss within 24 hours without review — but each successful retrieval flattens the curve.

**Implementation:**
- "Recall Check" sidebar widget in EVERY chapter (after Ch00) quizzes 3–5 items from 2–3 chapters ago
- Global "Daily Review" button on the landing page — pulls items due for review based on individual item schedules
- Each item tracks: last reviewed, interval, ease factor (SM-2 algorithm adapted for in-browser use)
- Visual "Forgetting Curve" graph per chapter showing the reader's projected retention
- "Memory Strength" indicator (color bar: red → yellow → green) on each item in review

### Pillar 3: Method of Loci (Memory Palace)
**The science:** The method of loci (memory palace) is the single most powerful memorization technique known to science. World memory champions use it to memorize thousands of items. It exploits the brain's powerful spatial memory system — humans evolved to remember locations for survival (O'Keefe & Nadel, 1978; Maguire et al., 2003). Placing information at vivid locations in a familiar mental space creates durable, retrievable memories.

**Implementation:**
- Chapter 00 teaches the reader to build their FIRST memory palace (their Korean home/apartment)
- Each chapter assigns a SPECIFIC location in the palace for its content:
  - Ch02 Hiragana → Kitchen (46 characters placed at 46 spots in the kitchen)
  - Ch03 Katakana → Living room
  - Ch05 Survival phrases → The street from home to the nearest station
  - Ch06 Particles → Bathroom (small, contained — 11 particles at 11 spots)
  - Ch10 Kanji radicals → Bedroom
  - Ch12 Native vocabulary → A familiar park
- Pre-built "loci maps" (SVG diagrams) showing suggested placement
- Interactive "Walk the Palace" exercise: reader mentally walks through the palace recalling items at each location
- "Palace Audit" quiz: given a location, recall the item; given an item, recall its location

### Pillar 4: Keyword Mnemonics with Vivid Imagery
**The science:** The keyword method creates a phonetic bridge between the foreign word and a known-language word, then links them with a vivid, bizarre, or emotional mental image. This produces 2x vocabulary acquisition speed compared to rote repetition (Atkinson, 1975; Shapiro & Waters, 2005). The more bizarre, violent, sexual, or emotionally charged the image, the better the retention (bizarreness effect, McDaniel & Einstein, 1986).

**Implementation:**
- EVERY new Japanese word gets a keyword mnemonic following this format:
  ```
  Japanese: 食べる (taberu) — to eat
  Keyword bridge: "TABLE" (sounds like tabe-)
  Image: "You're eating directly off a TABLE with no plate, food flying everywhere"
  Korean anchor: 먹다 (meokda)
  Full chain: 먹다 → TABLE → 食べる (taberu)
  ```
- Images must be: vivid, exaggerated, involving motion/action, emotionally striking
- SVG illustration for every keyword image (simplified but evocative)
- "Create Your Own" prompt: reader is encouraged to modify/personalize the image
- Korean bridge word included when the Korean word itself can serve as a phonetic anchor

### Pillar 5: Dual Coding (Verbal + Visual)
**The science:** Information encoded in BOTH verbal and visual formats creates two independent retrieval pathways, dramatically increasing the probability of successful recall (Paivio, 1986; Mayer, 2009). If one pathway fails, the other can still retrieve the information.

**Implementation:**
- Every character: written form + stroke order animation + mnemonic SVG + story sentence
- Every grammar concept: rule statement + visual diagram + example sentence + Korean parallel
- Every vocabulary word: Japanese text + keyword image SVG + Korean equivalent + example sentence
- Color coding system: blue = Japanese, green = Korean parallel, orange = mnemonic bridge
- Concept maps (SVG) showing relationships between related items

### Pillar 6: Elaborative Interrogation
**The science:** Asking "WHY does this work?" or "WHY is this true?" before seeing the explanation produces 40-70% better retention than simply reading the explanation (Dunlosky et al., 2013; Pressley et al., 1987). The act of generating an explanation — even a wrong one — primes the brain to encode the correct answer more deeply.

**Implementation:**
- "WHY?" prompts before every explanation — reader must attempt their own explanation first
- "Predict Before You Peek" protocol: hypothesis → reveal → compare → correct
- Every comparison table followed by "Why do you think Korean and Japanese share this pattern? Think for 10 seconds, then click to see our explanation."
- Self-generated explanations are more durable than provided explanations — prompt the reader to write their own summary

### Pillar 7: Interleaving (Mixed Practice)
**The science:** Mixing different types of problems or material during practice (ABCABC) produces better long-term performance than blocked practice (AAABBBCCC), even though it feels harder (Rohrer, 2012; Taylor & Rohrer, 2010). This is because interleaving forces the brain to discriminate between similar items and select the correct strategy.

**Implementation:**
- Exercises within each chapter MIX old and new material — never pure "drill the new stuff"
- "Interleave Mode" toggle on all quizzes — when ON, quiz pulls items from current + 2 random previous chapters
- End-of-chapter "Boss Level" quizzes ALWAYS interleave material from 3+ chapters
- "Confusion Pairs" exercises: items that are easily confused (は vs が, に vs で, する vs やる) are deliberately presented together

### Pillar 8: Generation Effect
**The science:** Information that the learner GENERATES (produces, creates, constructs) is remembered better than information that is merely read or received (Slamecka & Graf, 1978; Jacoby, 1978). This is why fill-in-the-blank is superior to multiple choice, and why writing a sentence from scratch beats reading one.

**Implementation:**
- Prioritize production exercises over recognition exercises (fill-in > multiple choice)
- "Generate Before You See" protocol: reader attempts to write/say the Japanese before the answer is shown
- Sentence construction exercises: given Korean sentence + vocabulary → construct Japanese sentence from scratch
- "Predict the Reading" exercises: given a kanji compound, predict the Japanese reading based on Korean hanja knowledge
- "Create Your Own Mnemonic" prompts: reader personalizes the keyword image

### Pillar 9: Desirable Difficulty
**The science:** Learning conditions that make encoding HARDER (but not impossible) produce better long-term retention than conditions that make encoding easy (Bjork & Bjork, 2011). This includes spacing, interleaving, generation, and varying practice conditions. The key is "desirable" — difficulty must be calibrated so the learner succeeds ~70-85% of the time (the "zone of proximal development").

**Implementation:**
- Three tiers per chapter: Warm-Up (recognition, ~90% success), Challenge (production, ~70% success), Boss Level (application in novel context, ~60% success)
- Adaptive difficulty: if reader self-rates "Easy" 3x in a row, system suggests jumping to Challenge tier
- "Remove the Scaffolding" progression: romaji → romaji fading → kana only → kanji + kana → kanji only
- Progressive hint system: stuck? Get hint 1 (category). Still stuck? Hint 2 (first character). Still stuck? Hint 3 (Korean parallel). Only then: full answer.

### Pillar 10: Context-Dependent Memory (Encoding Specificity)
**The science:** Memory retrieval is strongest when the retrieval context matches the encoding context (Tulving & Thomson, 1973; Godden & Baddeley, 1975). If you learn restaurant Japanese while imagining a restaurant, you'll recall it better IN a restaurant.

**Implementation:**
- Every survival phrase (Ch05) and conversation (Ch08) is taught within a vivid situational narrative
- "Scene Setting" at the start of each section: "Imagine you've just walked into a busy 居酒屋 in Shinjuku. It's Friday night, the place is packed, steam rising from the kitchen..."
- Exercises present realistic situational prompts, not decontextualized drills
- "Tokyo Day Simulation" (Ch05 Boss Level): full day narrative with choices and consequences
- Photo-realistic scene descriptions for each practice context

### Pillar 11: Self-Reference Effect
**The science:** Information encoded in relation to the SELF is remembered better than information encoded in relation to others or abstractly (Rogers et al., 1977; Symons & Johnson, 1997). "Would YOU use this word?" produces better recall than "Is this word common?"

**Implementation:**
- Personalization prompts: "Think about YOUR favorite restaurant in Korea. Now imagine ordering there in Japanese."
- "My Japanese Identity" exercise: reader creates a Japanese self-introduction and adds to it each chapter
- Exercises use reader's real life: "Your actual commute. Your actual job. Your actual hobbies."
- "How would YOU say this?" production exercises before showing the standard phrasing
- Personal vocabulary log: reader adds their own high-priority words to a persistent list

### Pillar 12: Sleep Consolidation Protocol
**The science:** Memory consolidation occurs primarily during sleep, particularly during slow-wave sleep (stages 3-4) and REM sleep (Diekelmann & Born, 2010; Rasch et al., 2007). Reviewing material immediately before sleep significantly enhances next-day recall. "Sleep on it" is literal neuroscience.

**Implementation:**
- "Before Bed Review" widget: 5-minute focused recall session designed for nighttime
- Recommended study schedule: new material in the morning, review in the evening, quick recall before sleep
- "Morning After" quiz: 3 items from the previous evening's study — tests overnight consolidation
- Study schedule suggestions account for sleep cycles
- Note: this is guidance, not enforcement — the system suggests but doesn't require timing

---

## Interactive Component Specifications

9 reusable quiz/memory components in `quiz-engine.js`:

1. **Click-to-Reveal Flashcard** — prompt → 3-second forced thinking pause (visible timer) → flip → self-rate (Easy/Hard/Again). Feeds SM-2 scheduling.
2. **Drag-and-Drop Matching** — two columns, drag to match, color feedback. Shuffled on every attempt.
3. **Fill-in-the-Blank (Generation)** — type answer, submit, check, explanation + Korean parallel. NO multiple choice — pure production.
4. **Timed Recognition Sprint** — rapid-fire identification, tracks speed + accuracy. Personal best tracking via `window.storage`.
5. **Sentence Builder** — arrange scrambled words/morphemes into correct sentence. Korean parallel shown as hint.
6. **Audio Discrimination (Visual)** — minimal pairs with pitch/length visual indicators (waveform-style SVG). Click to "hear" (visual representation).
7. **Spaced Recall Check** — sidebar widget pulling items due for review from ANY previous chapter. SM-2 scheduling per item.
8. **Memory Palace Walker** — interactive SVG map of a memory palace. Click locations to test recall. "Walk the route" sequential mode.
9. **Predict-and-Verify** — given partial information (Korean hanja, context clue), reader predicts the Japanese. Then reveals. Specifically for Sino-vocabulary and kanji readings.

**Storage:** `window.storage` API for persistence. Per-item tracking: { item_id, last_review, interval_days, ease_factor, times_reviewed, times_correct }. In-memory fallback.

**Daily Review Engine:**
- Landing page "Daily Review" button
- Pulls all items where `today >= last_review + interval_days`
- Orders by: overdue items first, then by lowest ease_factor (hardest items first)
- Session length: 15–25 items, ~5–10 minutes
- After session: shows accuracy %, items mastered, items to rereview, streak count

---

# === META-INSTRUCTIONS ===

## Step 0: Project Scaffold

```
zero-to-hero-japanese-memory/
├── CLAUDE.md
├── docs/
│   ├── BUILD-INSTRUCTIONS.md
│   ├── PROGRESS.md
│   ├── DECISIONS.md
│   ├── QA-CHECKLIST.md
│   ├── PEDAGOGY-REVIEW.md
│   ├── COMPONENT-REGISTRY.md
│   └── MEMORY-SCIENCE-NOTES.md
├── src/
│   ├── index.html                  # Landing: hero + checklist + progress + streak + daily review
│   ├── ch-00.html through ch-20.html   # One file per chapter (21 chapters)
│   ├── appendices.html
│   ├── css/design-system.css       # ALL CSS from FUSO ref
│   ├── js/
│   │   ├── theme.js
│   │   ├── sidebar.js              # Includes chapter checkboxes + streak
│   │   ├── quiz-engine.js          # All 9 quiz/memory types
│   │   ├── spaced-repetition.js    # SM-2 algorithm + daily review engine
│   │   ├── memory-palace.js        # Interactive palace walker
│   │   └── shared.js
│   ├── assets/
│   │   ├── palace-maps/            # SVG memory palace templates
│   │   └── mnemonic-images/        # SVG keyword images
│   └── drafts/
├── reference/fuso-hmi-reference.html
└── output/
```

## Step 1: CLAUDE.md

```markdown
# Japanese Zero-to-Hero Memory Architecture Build

## Project Overview
20-chapter interactive HTML reference + memory system. One HTML file per chapter. Survival-first order: memory science → scripts → daily use → grammar → depth → memory architecture capstone. Interactive TOC with completion checkboxes, progress bar, and memory streak counter. SM-2 spaced repetition engine for all learned items.

## Build Rules
1. NEVER modify reference/fuso-hmi-reference.html
2. Build ONE chapter at a time, in order
3. Every chapter MUST include: ≥3 quiz widgets, ≥1 mnemonic SVG, ≥1 Recall Check (after Ch00), exercises at 3 difficulty tiers, Memory Palace placement (after Ch00), "Mark as Complete ✅" button
4. Update PROGRESS.md after each chapter
5. Every new vocabulary item must be registered in the SM-2 item database
6. Every keyword mnemonic must follow the format: Korean anchor → phonetic bridge → vivid image → Japanese word

## Pedagogical Non-Negotiables
- NO concept without a concrete example
- NO character without a visual mnemonic AND palace placement
- NO grammar rule without a Korean parallel AND interactive exercise
- NO vocabulary word without a keyword mnemonic chain (Korean → bridge → image → Japanese)
- NO chapter ends without retrieval practice quiz
- NO chapter (after Ch00) starts without Recall Check pulling from SM-2 schedule
- Every comparison table followed by elaborative interrogation prompt ("WHY?")
- Every chapter includes "Memory Technique Spotlight" sidebar explaining the science behind that chapter's primary technique
- All exercises default to PRODUCTION (generation) over RECOGNITION (multiple choice)

## Font: Noto Sans JP + Noto Sans KR. <meta charset="UTF-8">. Verify CJK rendering.
```

## Step 2: PROGRESS.md

```markdown
# Build Progress Tracker

## Infrastructure
- [ ] CSS extracted | - [ ] Theme toggle | - [ ] Sidebar + checkboxes + streak | - [ ] Progress bar
- [ ] Quiz engine (9 types) | - [ ] SM-2 engine | - [ ] Memory palace walker | - [ ] Daily review engine
- [ ] Fonts | - [ ] CJK rendering | - [ ] Landing page + daily review button

## Chapters
| Ch | Title | Status | Quizzes | Mnemonics | Palace | Recall | SM-2 Items | QA | Pedagogy |
|----|-------|--------|---------|-----------|--------|--------|-----------|-----|----------|
| 00 | Memory Science | ⬜ | ⬜ | ⬜ | Setup | N/A | N/A | ⬜ | ⬜ |
| 01 | Korean Advantage | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 02 | Hiragana | ⬜ | ⬜ | ⬜ | Kitchen | ⬜ | 46+ | ⬜ | ⬜ |
| 03 | Katakana | ⬜ | ⬜ | ⬜ | Living Room | ⬜ | 46+ | ⬜ | ⬜ |
| 04 | Pronunciation | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 05 | Survival Japanese | ⬜ | ⬜ | ⬜ | Street | ⬜ | 80+ | ⬜ | ⬜ |
| 06 | Particles | ⬜ | ⬜ | ⬜ | Bathroom | ⬜ | 11+ | ⬜ | ⬜ |
| 07 | Verb Conjugation | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 30+ | ⬜ | ⬜ |
| 08 | Daily Conversations | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 60+ | ⬜ | ⬜ |
| 09 | Sentence Patterns | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 20+ | ⬜ | ⬜ |
| 10 | Kanji | ⬜ | ⬜ | ⬜ | Bedroom | ⬜ | 100+ | ⬜ | ⬜ |
| 11 | Sino-Vocabulary | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 100+ | ⬜ | ⬜ |
| 12 | Native Vocabulary | ⬜ | ⬜ | ⬜ | Park | ⬜ | 200+ | ⬜ | ⬜ |
| 13 | Honorifics | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 30+ | ⬜ | ⬜ |
| 14 | Reading | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 15 | Writing | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 16 | Listening | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 17 | Cultural Pragmatics | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 20+ | ⬜ | ⬜ |
| 18 | JLPT and Beyond | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 19 | Memory Palace | ⬜ | ⬜ | ⬜ | All | ⬜ | Review | ⬜ | ⬜ |
| 20 | 90-Day Sprint | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | N/A | ⬜ | ⬜ |

## Appendices
- [ ] Glossary | - [ ] Cognate Ref (500+) | - [ ] Sound Cheat Sheet | - [ ] False Friends (50+)
- [ ] Palace Templates | - [ ] 90-Day Calendar | - [ ] Mnemonic Image Bank (200+)
```

## Execution Sequence
**Infrastructure:** SM-2 engine → Quiz engine (9 types) → Memory palace walker → CSS/JS from FUSO → index.html with checklist + progress bar + streak + daily review → sidebar with checkboxes → fonts → CJK rendering.
**Content:** Chapters 00–20 in order. Per chapter: spec → draft → mnemonic SVGs → palace map → quiz widgets → SM-2 item registration → ch-XX.html → QA → PROGRESS.md.
**Appendices → Final QA.**

---

# THE CORE THESIS

**The Korean speaker's unfair advantage is MASSIVE — but almost every Japanese textbook ignores it. And almost every language course ignores memory science.**

This document attacks BOTH problems simultaneously:

1. **The Transfer Problem:** Standard textbooks (Genki, Minna no Nihongo) are designed for English speakers. They waste weeks explaining SOV order, particles, topic vs. subject, verb-final sentences, honorifics, subject omission. A Korean speaker already knows ALL of this. We exploit the transfer ruthlessly.

2. **The Memory Problem:** Even resources designed for Korean speakers (if they exist) still teach via passive reading, list memorization, and massed practice — the LEAST effective methods known to cognitive science. We replace every passive moment with an active memory technique.

**What does NOT transfer (where memory techniques must work hardest):**
1. **Writing system** (★★★★): Three scripts. Hiragana/katakana → Method of Loci + keyword images. Kanji → hanja bridge + morphological decomposition.
2. **Pronunciation** (★★): Simpler than Korean, but pitch accent is new → Motor encoding + perceptual training.
3. **Vocabulary** (★★★★★): Core everyday words (和語) are completely different → Keyword method + vivid imagery + spaced repetition. This is the #1 investment and the #1 place memory science pays off.
4. **Verb conjugation forms** (★★★): Same system, different endings → Procedural memory + pattern drills.
5. **Cultural pragmatics** (★★): Similar spirit, different execution → Narrative encoding + cultural schema building.

**Timeline projection:** "Standard estimate for English speakers: ~2,200 hours to JLPT N2. Korean speakers with conventional study: ~1,000 hours. Korean speakers with Memory Architecture: ~600–700 hours. Why? Because you eliminate ~60% of re-study time by encoding correctly the FIRST time."

---

# CHAPTER-BY-CHAPTER SPECIFICATIONS

---

## Chapter 00: How Your Memory Works — The Science Behind This Book

**Purpose:** Teach the reader HOW they will learn, not just WHAT they will learn. This is the most important chapter for long-term success. Metamemory research shows that learners who understand the science behind techniques use them more consistently and achieve 30–40% better outcomes (Dunlosky et al., 2013).

**Memory Technique Spotlight:** Metamemory — knowing HOW your memory works so you can use it strategically.

### Section 0A: The Forgetting Curve — Your Enemy

**Interactive SVG Diagram:** Ebbinghaus forgetting curve.
- X-axis: time (1 hour, 1 day, 1 week, 1 month)
- Y-axis: retention %
- Curve 1 (red): no review — drops to ~20% after 1 month
- Curve 2 (yellow): single review at 1 day — drops slower
- Curve 3 (green): spaced reviews at 1, 3, 7, 21 days — stays above 90%

**Key message:** "Without a system, you will forget 80% of what you study. This is not a personal failing — it's how EVERY human brain works. The solution is not 'study harder.' The solution is 'study smarter.' This book is the smarter system."

### Section 0B: The Twelve Pillars (Simplified for the Learner)

Present each pillar as a simple, memorable rule with an analogy:

| Pillar | Rule | Analogy |
|--------|------|---------|
| Retrieval Practice | Test yourself, don't re-read | "Lifting weights, not watching fitness videos" |
| Spaced Repetition | Review at expanding intervals | "Watering a plant — regular but not constant" |
| Method of Loci | Place memories in familiar locations | "Hanging coats on hooks in your house" |
| Keyword Mnemonics | Link sounds to vivid images | "Building a bridge with a funny picture on it" |
| Dual Coding | See it AND say it | "A movie with subtitles — two channels" |
| Elaborative Interrogation | Ask WHY before learning WHAT | "Being a curious child — 'But why?'" |
| Interleaving | Mix different topics in practice | "Training for a decathlon, not a sprint" |
| Generation Effect | Produce, don't just consume | "Cooking a meal vs. ordering delivery" |
| Desirable Difficulty | Struggle a little — it's good | "Muscles grow from resistance, not rest" |
| Context-Dependent Memory | Learn in the situation you'll use it | "Practice swimming in water, not on land" |
| Self-Reference Effect | Connect new info to YOUR life | "It's always about YOU" |
| Sleep Consolidation | Review before bed | "Your brain files memories while you sleep" |

### Section 0C: Building Your First Memory Palace

**Step-by-step guided exercise:**

1. **Choose your palace:** "Close your eyes. Visualize your home in Korea — the apartment or house where you grew up, or where you live now. This is your 첫 번째 기억의 궁전 (first memory palace)."

2. **Establish the route:** Walk through in a fixed order. ALWAYS the same order.
   - Front door (현관)
   - Shoe area (신발장)
   - Kitchen (부엌) — this will hold hiragana (Ch02)
   - Dining table (식탁)
   - Living room (거실) — this will hold katakana (Ch03)
   - Sofa (소파)
   - TV area (TV 앞)
   - Bathroom (화장실) — this will hold particles (Ch06)
   - Bedroom (침실) — this will hold kanji radicals (Ch10)
   - Desk (책상)
   - Window (창문)
   - Balcony (베란다)

3. **Practice the route:** Walk through mentally 3 times. It should feel automatic.

4. **Test placement:** Place 5 random objects at 5 locations and recall them. This is a warm-up, not Japanese content.

**Interactive SVG:** Floor plan of a typical Korean apartment with 12 numbered loci. Clickable — click a location to see what content will eventually be placed there.

**🧪 Quiz (Type 8: Memory Palace Walker):** Practice walking the empty palace. Click each location in order. System checks sequence.

### Section 0D: The Daily Routine

**Recommended daily study structure (30–60 min/day):**

| Time | Activity | Duration | Pillar |
|------|----------|----------|--------|
| Morning | New material (1 new section) | 20–30 min | Encoding |
| Morning | Generate: practice producing new items | 5–10 min | Generation Effect |
| Evening | Daily Review (SM-2 due items) | 10–15 min | Spaced Repetition |
| Before bed | Palace Walk (mentally walk through today's palace additions) | 5 min | Method of Loci + Sleep Consolidation |

**Streak system:** "Complete at least ONE Daily Review or Palace Walk per day to maintain your streak. The streak is your most important metric — consistency beats intensity."

---

## Chapter 01: Your Korean Advantage — What Transfers and What Doesn't

**Purpose:** Map what the reader already knows and what they need to learn. Set expectations, build motivation, and activate the Korean grammar SCHEMA so it's primed for transfer.

**Memory Technique Spotlight:** Schema Activation — activating existing knowledge structures so new information can be attached to them, not learned in isolation.

**🧪 Pre-test (Elaborative Interrogation):** "Before reading anything, try to answer: What do you think Korean and Japanese have in common? Write down 5 guesses. We'll check them at the end."

### Grammar Transfer Map

| Concept | Korean | Japanese | Transfer | Memory Note |
|---------|--------|----------|---------|-------------|
| Word order (SOV) | 나는 사과를 먹는다 | 私はりんごを食べる | 100% — FREE | No memorization needed — just use Korean order |
| Topic marker | 은/는 | は (wa) | 100% — FREE | Place at "front door" of palace: は = 은/는 |
| Subject marker | 이/가 | が (ga) | 100% — FREE | Place at "shoe area": が GRABS like a shoe hook |
| Object marker | 을/를 | を (wo) | 100% — FREE | "を WRAPS the object" |
| Location (static) | 에 | に (ni) | ~90% | に NEEDLES into a pinpoint location |
| Location (action) | 에서 | で (de) | ~90% | で is the DOING spot |
| Direction | 으로/로 | へ (e) | ~85% | へ looks like a hill going TOWARD |
| Possessive | 의 | の (no) | 100% — FREE | の spirals connecting two things |
| Verb-final | Always | Always | 100% — FREE | No memorization needed |
| Pro-drop | Constant | Constant | 100% — FREE | No memorization needed |
| Agglutinative conjugation | 먹다→먹습니다 | 食べる→食べます | System ✓, forms differ | SYSTEM is free. Forms need memorization — handled in Ch07 |
| Honorifics | 존댓말/반말 | 敬語 (keigo) | Concept 100%, details ~60% | Concept is free. Specific forms — Ch13 |
| Sino-vocabulary | 한자어 (학생, 경제) | 漢語 (学生, 経済) | ~40-60% cognate | BIGGEST SHORTCUT — exploited in Ch10-11 |
| Demonstratives | 이것/그것/저것 | これ/それ/あれ | 100% — FREE | Same 3-way near/mid/far system |
| Counters | 개, 명, 마리 | 個, 人, 匹 | System ✓, specifics differ | System is free. Specific counters need memorization |

**Elaborative Interrogation:** "WHY do Korean and Japanese share these structures but have completely different basic vocabulary? Think for 30 seconds."

**Answer (click to reveal):** "Korean and Japanese are structurally similar (SOV, agglutinative, particles, topic/subject marking, honorifics) but are NOT proven to be genetically related languages. The structural similarity may come from long contact, geographic proximity, and shared East Asian cultural sphere (especially Chinese influence via 한자/漢字). But the core native vocabulary evolved independently — which is why 물 (water) and 水(みず, mizu) sound completely different despite meaning the same thing. Your advantage is STRUCTURAL, not LEXICAL — which means grammar is nearly free, but vocabulary is the main investment."

**Doesn't transfer (with difficulty ratings and memory strategy):**

| Area | Difficulty | Memory Strategy |
|------|-----------|----------------|
| Writing system | ★★★★ | Method of Loci (palace) + keyword mnemonics (Ch02-03) |
| Pronunciation | ★★ | Motor encoding + discrimination drills (Ch04) |
| Core vocabulary (和語) | ★★★★★ | Keyword method + vivid imagery + spaced repetition (Ch12) |
| Verb conjugation forms | ★★★ | Procedural drilling + pattern songs (Ch07) |
| Cultural pragmatics | ★★ | Narrative encoding + schema building (Ch17) |
| Adjective system | ★★ | Two-bucket categorization (Ch07) |
| Copula | ★★ | Mapping exercise (Ch06) |
| Native numbers | ★★ | Keyword chain (Ch05) |

**Timeline (SVG):** Overlapping circles showing what's already known vs. what needs to be learned. "Starting from ~40%. English speakers: ~2,200 hours to JLPT N2. You: ~600-700 with this system."

**🧪 Interactive Exercise (Type 5: Sentence Builder):** Korean sentence → predict Japanese structure → reveal 1:1 particle alignment.
- 나는 학교에서 일본어를 공부한다 → 私は学校で日本語を勉強する
- Particle-by-particle color-coded alignment

**🧪 Post-test:** "Look at your 5 guesses from the beginning. How many were right? What surprised you?"

**Palace Placement:** This chapter doesn't add items to the palace — it ACTIVATES the schema. The transfer map itself should be visualized as a "blueprint" overlaid on the palace.

---

## Chapter 02: Hiragana — Your First Script (ひらがな)

**Purpose:** All 46 basic hiragana + dakuten + yōon. Target: 3–7 days with the memory palace.

**Memory Technique Spotlight:** Method of Loci — placing each hiragana character at a specific location in your kitchen, creating an unbreakable spatial-visual memory chain.

**CRITICAL: Every character gets ALL of the following:**
1. Visual mnemonic SVG showing the character as a recognizable image
2. Story sentence linking the image to the sound
3. Korean sound approximation
4. Keyword bridge word (a real word that sounds like the character)
5. Memory palace placement (specific spot in the kitchen)
6. Stroke order with numbered steps
7. Practice word containing the character
8. SM-2 registration for spaced review

### Palace Assignment: The Kitchen (부엌)

**SVG diagram:** Korean kitchen with 46+ marked positions:
- Refrigerator (냉장고) surface: vowels あいうえお (5 positions across the front)
- Refrigerator handle: か
- Kitchen counter (조리대): ka-row か き く け こ
- Sink (싱크대): sa-row さ し す せ そ
- Stove/range (가스레인지): ta-row た ち つ て と
- Pots hanging above: na-row な に ぬ ね の
- Rice cooker (밥솥): ha-row は ひ ふ へ ほ
- Microwave (전자레인지): ma-row ま み む め も
- Kitchen window (부엌 창문): ya-row や ゆ よ
- Kitchen table (식탁): ra-row ら り る れ ろ
- Kitchen door (부엌 문): wa-row わ を ん

### Vowel Row with Full Mnemonic Architecture

**あ (a) — Refrigerator, left side:**
- SVG: The character あ looks like a person doing a martial arts kick and shouting "Ahhh!"
- Story: "A martial artist kicks the refrigerator door open, shouting あ!"
- Korean approximation: 아
- Keyword: "Ah!" (the exclamation)
- Palace scene: Imagine a martial artist kicking YOUR refrigerator, food flying everywhere, shouting "あ!"
- Stroke order: 1. horizontal, 2. vertical curve, 3. loop
- Practice word: あめ (ame) = rain, candy

**い (i) — Refrigerator, center-left:**
- SVG: Two eels (ee-ls) standing upright = い
- Story: "Two eels standing inside the refrigerator say 'eeee!'"
- Korean approximation: 이
- Keyword: "eels" (ee = い)
- Palace scene: Open the refrigerator, two live eels standing upright, squealing
- Practice word: いぬ (inu) = dog

**う (u) — Refrigerator, center:**
- SVG: A winding trail going up, like a person leaning forward saying "oooo"
- Story: "You're reaching deep into the refrigerator, leaning forward, going 'uuuuu' trying to reach that thing in the back"
- Korean approximation: 우 — BUT ⚠️ UNROUNDED! Do NOT pucker your lips like Korean 우. Keep lips relaxed.
- Keyword: "ooze" (something oozing in the back of the fridge)
- Palace scene: Something is oozing at the back of the fridge. You lean in: "uuuu, gross!"
- Practice word: うみ (umi) = sea

**え (e) — Refrigerator, center-right:**
- SVG: An energetic person with arms spread, looks like え
- Story: "An energetic chef throws open the fridge: 'えっ! We're out of eggs!'"
- Korean approximation: 에
- Keyword: "energy" / "eh?!"
- Palace scene: A chef dramatically discovering the fridge is empty
- Practice word: えき (eki) = station

**お (o) — Refrigerator, right side:**
- SVG: A person praying/bowing, with a halo (the loop in お)
- Story: "Oh! The person prays to the refrigerator god for more food"
- Korean approximation: 오
- Keyword: "Oh!" (surprise)
- Palace scene: Someone bowing to the refrigerator in prayer
- ⚠️ WARNING: Don't confuse with あ. Mnemonic: お has a tiny halo (loop) = Oh my God! あ has no halo = just "Ah."
- Practice word: おかね (okane) = money

**🧪 Checkpoint Quiz (Type 1: Flashcard) after vowels:** Show each character → 3-second pause → flip → self-rate.

**🧪 Timed Sprint (Type 4) after vowels:** 5 characters, 15 seconds. Beat your time.

### Remaining Rows (Same Full Treatment)

**Ka-row: か き く け こ — Kitchen Counter (조리대)**

**か (ka) — Counter, left end:**
- SVG: A CUTTER (ka-tter) slicing on the counter
- Story: "Someone's CUTting vegetables on the counter — ka, ka, ka!"
- Korean: 카
- Keyword: "CUT" (ka-t)
- Palace: Imagine a chef violently chopping, knife going KA KA KA on YOUR counter
- Practice word: かわ (kawa) = river

**き (ki) — Counter, center-left:**
- SVG: A KEY standing upright on the counter
- Story: "You left your KEY on the kitchen counter again"
- Korean: 키
- Keyword: "KEY" (ki)
- Palace: A giant golden KEY sitting on the counter
- Practice word: きく (kiku) = to listen/chrysanthemum

**く (ku) — Counter, center:**
- SVG: The character く looks like a bird's beak (coo-coo!)
- Story: "A cuckoo bird is sitting on the counter going 'KOO KOO!'"
- Korean: 쿠
- Keyword: "COO" (cuckoo)
- Palace: A cuckoo bird pecking at crumbs on your counter
- Practice word: くるま (kuruma) = car

**け (ke) — Counter, center-right:**
- SVG: A keg lying on its side
- Story: "A KEG of beer is rolling across the counter!"
- Korean: 케
- Keyword: "KEG"
- Palace: A beer keg rolling off your counter, beer spraying everywhere
- Practice word: けいたい (keitai) = cellphone

**こ (ko) — Counter, right end:**
- SVG: Two horizontal lines, like a compact box or container
- Story: "Two COrners of a box on the counter"
- Korean: 코
- Keyword: "corner" / "compact"
- Palace: A small compact box sitting at the end of your counter
- Practice word: ここ (koko) = here

*[Continue this exact pattern for ALL remaining rows: sa さしすせそ at the sink, ta たちつてと on the stove, na なにぬねの hanging with the pots, ha はひふへほ at the rice cooker, ma まみむめも at the microwave, ya やゆよ at the kitchen window, ra らりるれろ at the kitchen table, wa わをん at the kitchen door.]*

*[EVERY character gets: SVG + story + Korean approximation + keyword + palace scene + stroke order + practice word. No exceptions. This is the most important chapter for building the memory foundation.]*

### Special Characters Requiring Extra Attention

**し (shi) — Sink, center-left:**
- ⚠️ Korean speakers often say "si" — must be "SHI"
- SVG: A fishing hook in the sink
- Story: "SHE dropped her fishing hook in the sink!"
- Keyword: "SHE" (not "see")
- Palace: A giant fishhook tangled in your sink drain. SHE can't get it out.

**つ (tsu) — Stove, center:**
- ⚠️ This sound doesn't exist in Korean. See Ch04 for detailed pronunciation.
- SVG: A tsunami wave
- Story: "A TSUnami comes out of the pot on the stove!"
- Keyword: "TSUnami"
- Palace: A miniature tsunami erupting from a boiling pot on your stove

**ふ (fu) — Rice cooker, center:**
- ⚠️ Between Korean ㅎ and ㅍ — blow through both lips, not teeth
- SVG: Mount Fuji
- Story: "FUji-san appears as steam from the rice cooker!"
- Keyword: "FUji"
- Palace: Steam from the rice cooker forms the shape of Mount Fuji

### Dakuten (゛) and Handakuten (゜)

**System mnemonic:**
- ゛(dakuten) = "voice marks" — adding voice/vibration to the consonant
  - Mnemonic: ゛= quotation marks = someone SPEAKING UP louder
  - k→g, s→z, t→d, h→b
- ゜(handakuten) = "half voice" — only for h→p
  - Mnemonic: ゜= a bubble that POPS = p-sound

**Mapping to Korean:**
- か(ka)→が(ga) like 카→가 — just remove aspiration and add voice
- さ(sa)→ざ(za) like 사→자
- た(ta)→だ(da) like 타→다
- は(ha)→ば(ba) like 하→바

**Palace placement:** Dakuten versions go at the SAME location as their base character, but imagine the scene getting LOUDER and more chaotic.

### Yōon (拗音): Compound Sounds

**Grid format:**
きゃ(kya), きゅ(kyu), きょ(kyo) — き + small ゃゅょ

**Korean parallel:** Like compound vowels 갸, 규, 교 — but applied to the CONSONANT + ya/yu/yo.

**Mnemonic:** "The small ゃゅょ RIDES on the back of the big character — it's a piggyback sound."

### Long Vowels and Double Consonants

**Long vowels:**
- おばさん (obasan) = aunt/middle-aged woman
- おばあさん (obaasan) = grandmother
- Mnemonic: "Longer vowel = OLDER person. The grandmother stretches the sound because she's been around LONGER."

**Double consonants (促音 — small っ):**
- きて (kite) = come → きって (kitte) = stamp/ticket
- Mnemonic: "The small っ is a speed bump — you STOP for a beat, then continue."
- Korean parallel: 받침 → consonant stopping, similar feel

### 🧪 Chapter 02 Quizzes

1. **Flashcard Sprint (Type 1):** All 46 basic hiragana. Self-rate each. SM-2 tracks initial ratings.
2. **Drag-and-Drop (Type 2):** Match hiragana to romaji. 10 items, shuffled.
3. **Fill-in-the-Blank (Type 3):** Show romaji → type hiragana (if input supports) or type romaji for shown hiragana.
4. **Timed Recognition Sprint (Type 4):** 46 characters, 90 seconds. Personal best tracking.
5. **Memory Palace Walker (Type 8):** Walk through the kitchen. At each spot, recall the character(s) placed there. System checks.
6. **Boss Level — Read Real Words (Type 3):** 20 real Japanese words in hiragana only → type the romaji:
   - さくら (sakura), たべる (taberu), がっこう (gakkou), せんせい (sensei), ありがとう (arigatou)...

### 🧪 Recall Check: None (this is Ch02, first content chapter after Ch00)

---

## Chapter 03: Katakana — The Foreign Word Script (カタカナ)

**Purpose:** All 46 katakana. Same sounds as hiragana, different shapes. Used primarily for foreign loanwords, emphasis, and scientific terms.

**Memory Technique Spotlight:** Dual Coding + Contrastive Encoding — learning katakana BY CONTRAST with the already-known hiragana, creating a "this vs. that" memory structure that strengthens BOTH.

**Palace Assignment: The Living Room (거실)**

**Key insight for Korean speakers:** "Katakana will feel familiar — angular, sharp strokes, like the ㄱㄴㄷ family of hangul. Hiragana was curvy like a flowing river. Katakana is sharp like cut glass. Use this visual contrast."

### Contrastive Encoding System

Every katakana character is taught in a PAIR with its hiragana counterpart:

| Hiragana | Katakana | Sound | Contrast Mnemonic | Loanword Example |
|----------|----------|-------|-------------------|------------------|
| あ | ア | a | あ is a person doing a kick. ア is just the FIRST stroke — sharper, quicker, modern | アメリカ (Amerika) |
| い | イ | i | い is two eels. イ is just ONE eel — more efficient, modern | イタリア (Itaria) |
| う | ウ | u | う is curvy ooze. ウ is a squared-off container — boxier | ウイルス (uirusu = virus) |
| え | エ | e | え is an energetic person. エ is a steel I-beam — industrial | エレベーター (erebeetaa = elevator) |
| お | オ | o | お has a halo loop. オ slashes — like cutting with a sword "OH!" | オレンジ (orenji = orange) |

*[Continue for ALL 46 characters with this contrastive format]*

### Loanword Bridge: Korean ↔ Japanese Cognate Loanwords

**50 loanwords that Korean and Japanese BOTH borrowed from English/European languages — same source word, slightly different adaptation:**

| English | Korean (외래어) | Japanese (カタカナ) | Similarity |
|---------|--------------|-------------------|-----------|
| coffee | 커피 (keopi) | コーヒー (koohii) | ★★★ |
| computer | 컴퓨터 (keompyuteo) | コンピューター (konpyuutaa) | ★★★★ |
| taxi | 택시 (taeksi) | タクシー (takushii) | ★★★★ |
| hotel | 호텔 (hotel) | ホテル (hoteru) | ★★★★★ |
| restaurant | 레스토랑 (reseutorang) | レストラン (resutoran) | ★★★★★ |
| internet | 인터넷 (inteonet) | インターネット (intaanetto) | ★★★★ |
| camera | 카메라 (kamera) | カメラ (kamera) | ★★★★★ |
| bus | 버스 (beoseu) | バス (basu) | ★★★★ |
| supermarket | 슈퍼마켓 (syupeomakes) | スーパーマーケット (suupaamaaketto) | ★★★ |
| energy | 에너지 (eneoji) | エネルギー (enerugii) | ★★★ |
| news | 뉴스 (nyuseu) | ニュース (nyuusu) | ★★★★★ |
| drama | 드라마 (deurama) | ドラマ (dorama) | ★★★★★ |
| data | 데이터 (deiteo) | データ (deeta) | ★★★★ |
| system | 시스템 (siseutem) | システム (shisutemu) | ★★★★ |
| design | 디자인 (dijain) | デザイン (dezain) | ★★★★★ |
| table | 테이블 (teibeul) | テーブル (teeburu) | ★★★★ |
| test | 테스트 (teseuteu) | テスト (tesuto) | ★★★★★ |
| stress | 스트레스 (seutreoseu) | ストレス (sutoresu) | ★★★★ |
| party | 파티 (pati) | パーティー (paatii) | ★★★★ |
| vitamin | 비타민 (bitamin) | ビタミン (bitamin) | ★★★★★ |

*[Expand to 50 total]*

**Generation Exercise:** "Given the Korean loanword, PREDICT the Japanese katakana before looking. You'll be right ~60% of the time. The prediction itself helps you remember even when you're wrong (generation effect)."

### Confusable Katakana Pairs (Interleaved Discrimination Drill)

| Pair | How to tell apart |
|------|-------------------|
| シ (shi) vs ツ (tsu) | シ: strokes go LEFT↗. ツ: strokes go DOWN↘. Mnemonic: "SHI SHIfts left. TSU Tsunamis down." |
| ソ (so) vs ン (n) | ソ: starts TOP, sweeps down. ン: starts BOTTOM, sweeps up. |
| ノ (no) vs メ (me) | メ has a cross-stroke. ノ is just one stroke. |
| ウ (u) vs フ (fu) | ウ has a top bar. フ doesn't. |

**🧪 Confusion Pair Drill (Type 6):** Rapid-fire シvsツ, ソvsン discrimination. Must get 20 in a row correct.

### 🧪 Chapter 03 Quizzes

1. **Contrastive Flashcard (Type 1):** Show hiragana → produce katakana equivalent. Then reverse.
2. **Loanword Reading (Type 3):** Show katakana word → type the English/Korean meaning.
3. **"Read the Menu" (Type 3):** A Japanese restaurant menu with katakana items → identify each.
4. **Palace Walker (Type 8):** Walk the living room. Recall katakana at each position.
5. **Boss Level — Mixed Script (Type 4):** Flash hiragana AND katakana randomly. Must identify reading AND script type.

### 🧪 Recall Check (Ch02): 5 hiragana characters pulled from SM-2 schedule.

---

## Chapter 04: Pronunciation — Where Korean Habits Help and Hurt

**Purpose:** Japanese phonetics from the Korean speaker's specific perspective. Address the EXACT interference patterns that Korean creates.

**Memory Technique Spotlight:** Motor Encoding + Perceptual Training — pronunciation is a physical skill stored in PROCEDURAL memory (different from declarative memory for vocabulary/grammar). It requires repetition, feedback, and deliberate practice of specific motor patterns.

### What's EASIER Than Korean (Good News First)

"Japanese pronunciation is SIMPLER than Korean. You are DOWNSHIFTING."

| Feature | Korean | Japanese | Implication |
|---------|--------|----------|-------------|
| Consonant types | 3-way (ㄱ/ㅋ/ㄲ) | 2-way (k/g) | Fewer distinctions to maintain |
| Syllable structure | Complex 받침 (CVC, CVCC) | Always CV or N | Simpler, no final consonant clusters |
| Vowel system | 10 monophthongs | 5 vowels (a, i, u, e, o) | Fewer to keep distinct |
| Consonant clusters | 겹받침 (ㄺ, ㅄ...) | None | Nothing to untangle |

**Mnemonic:** "Japanese pronunciation is like going from a 10-speed bike to a 5-speed. Fewer gears, smoother ride."

### The Six Traps (Where Korean Habits HURT)

**Trap 1: Over-Aspiration (★★★)**
- **Problem:** Korean has 3-way consonant distinction (plain/aspirated/tense: ㄱ/ㅋ/ㄲ). Japanese has 2-way (voiceless/voiced: k/g). Korean speakers apply Korean aspiration to Japanese voiceless consonants.
- **What it sounds like:** か sounds like 카 instead of a softer 가~카 blend
- **Fix:** Japanese voiceless consonants are BETWEEN Korean plain and aspirated. か is between 가 and 카.
- **Mnemonic:** "Think of the volume dial. Korean ㅋ = volume 10, Korean ㄱ = volume 3. Japanese k = volume 5-6. Turn it DOWN from 카, not up from 가."
- **Drill:** Practice pairs: かく (kaku, to write) — say it with 카쿠 energy → reduce → find the middle

**Trap 2: Rounded う (★★)**
- **Problem:** Korean 우 is strongly rounded (lips pushed forward). Japanese う is UNROUNDED — lips relaxed, barely parted.
- **What it sounds like:** すし sounds like "sooshi" with pursed lips
- **Fix:** Say Korean 으 (unrounded) but slightly higher. That's closer.
- **Mnemonic:** "Japanese う = lazy 우. Don't pucker — just be lazy."
- **Drill:** Mirror practice: watch your lips. If they pucker, you're doing Korean 우, not Japanese う.

**Trap 3: Long Vowel Confusion (★★★★)**
- **Problem:** Korean doesn't have phonemically contrastive vowel length (modern Seoul dialect). Japanese does. おばさん ≠ おばあさん.
- **Fix:** Think of long vowels as TWO beats, not one stretched. Count: お・ば・さ・ん (4 beats) vs. お・ば・あ・さ・ん (5 beats).
- **Mnemonic:** "Japanese is MUSICAL. Each kana = one beat of a metronome. Long vowel = two beats."
- **Drill — Minimal Pairs:**
  - おばさん (obasan, aunt) vs. おばあさん (obaasan, grandmother)
  - おじさん (ojisan, uncle) vs. おじいさん (ojiisan, grandfather)
  - ビル (biru, building) vs. ビール (biiru, beer)
  - Here is the pattern: longer sound = bigger/older/more

**Trap 4: The つ Sound (★★)**
- **Problem:** Korean has no "tsu" — only ㅊ (ch) and ㅅ (s). Korean speakers say ちゅ or す instead of つ.
- **Fix:** Start with ㅊ but place tongue at the BACK of the top teeth (alveolar ridge), then release with a hissing "s" airflow. It's ㅌ + ㅅ compressed.
- **Mnemonic:** "TSUnami — the wave BURSTS then HISSES."
- **Drill:** す→つ→ちゅ — practice the progression. つ is in the MIDDLE.

**Trap 5: The ふ Sound (★)**
- **Problem:** Korean has ㅎ (glottal) and ㅍ (bilabial stop). Japanese ふ is a bilabial FRICATIVE — blow gently through both lips.
- **Fix:** Blow out a candle gently. That lip position + voicing = ふ.
- **Mnemonic:** "ふ = gently blowing on hot 후 (Korean blow) — but softer."

**Trap 6: Pitch Accent (★★★★★)**
- **Problem:** Korean has intonation but not lexical pitch accent. Japanese has pitch accent — the PITCH PATTERN of a word changes its meaning or marks its naturalness.
- **Pitch patterns (Tokyo dialect):**
  - 箸 (はし, ha↑shi↓) = chopsticks — HIGH-LOW
  - 橋 (はし, ha↓shi↑) = bridge — LOW-HIGH
  - 端 (はし, ha↑shi→) = edge — HIGH-HIGH (then drops)
- **Fix:** Don't panic. Pitch accent errors rarely cause real misunderstanding. Focus on AWARENESS, not perfection.
- **Mnemonic:** "Pitch accent is like 사투리 — it marks you as a native or non-native. People will still understand you. Improve it gradually."

**Diagrams (SVG):**
1. Consonant mapping: Korean 3-way → Japanese 2-way (color-coded)
2. Vowel comparison: Korean 10 vs. Japanese 5 (overlapping circles)
3. Pitch accent contour patterns: 4 Tokyo patterns shown as line graphs

### 🧪 Chapter 04 Quizzes

1. **Discrimination Quiz (Type 6):** Long vs. short vowels — visual waveform representation.
2. **Minimal Pair Matching (Type 2):** Drag meanings to correct pronunciation pattern.
3. **Pitch Pattern Quiz (Type 6):** Given a word, select the correct pitch contour.
4. **Boss Level — "Say It Right" (Type 3):** Given a word with a pronunciation trap, identify which trap applies and the correct production.

### 🧪 Recall Check (Ch02-03): 5 hiragana + 3 katakana from SM-2 schedule.

---

## Chapter 05: Survival Japanese — Restaurants, Shopping, and Getting Around

**Purpose:** Immediately usable Japanese for real daily situations. The reader can now read kana and pronounce correctly — this chapter puts those skills to work. No grammar theory yet. Just learn complete phrases as functional units, with Korean parallels showing why they make structural sense.

**Memory Technique Spotlight:** Context-Dependent Memory + Situational Encoding — every phrase is learned INSIDE a vivid situational narrative. When the reader is actually in a Japanese restaurant, the memory of the learning context will trigger recall of the phrase.

**Palace Assignment: The Street (집에서 역까지 가는 길)**
- Build a new memory palace: the route from your home to the nearest subway/train station
- Each SECTION of this chapter gets a STRETCH of the route:
  - 5A Restaurant → The restaurant/식당 you pass on the way
  - 5B Shopping → The convenience store/편의점 on the route
  - 5C Directions → The intersection/교차로 where you decide which way
  - 5D Transportation → The station/역 itself
  - 5E Polite phrases → Your front door (where you greet/say goodbye)
  - 5F Emergency → The hospital/병원 sign you can see from the route
  - 5G Numbers → The price signs on shops along the route

**Design philosophy:** "You don't need to understand WHY a sentence works to USE it. You say 'すみません' (sumimasen) the same way you started saying '실례합니다' as a child — you learn the whole phrase, use it, and the grammar understanding comes later (Ch06-09). This chapter gives you 100+ phrases you can use TODAY."

**CRITICAL: Every phrase in this chapter must include:**
1. The Japanese (kana + kanji where standard)
2. Romaji (still in romaji-included chapters)
3. Literal word-by-word breakdown
4. The Korean equivalent phrase
5. A keyword mnemonic for the Japanese phrase (vivid, memorable)
6. Context note: when/where to use it
7. Palace placement: specific spot on the home-to-station route
8. SM-2 registration for spaced review

---

### Section 5A: Restaurant Japanese (レストラン)

**Scene Setting:** "Imagine you've just landed in Tokyo. It's your first evening. You're hungry. You walk into a busy 居酒屋 near your hotel. Warm light, steam, the sound of 'いらっしゃいませ!' as the door opens. Here's how to navigate the entire experience."

**Palace Placement:** The restaurant/식당 you pass on the way to the station.

**Entering:**

| # | Situation | Japanese | Romaji | Korean Equivalent | Keyword Mnemonic | Palace Spot |
|---|-----------|----------|--------|------------------|-----------------|-------------|
| 1 | Getting attention | すみません | sumimasen | 저기요 / 실례합니다 | "SUE ME, MA'am, SEN(d) help" — imagine suing the restaurant owner for attention | Restaurant entrance door |
| 2 | "Table for 2" | 二人です | futari desu | 두 명이요 | "Who's TALL-ree? TWO of us" — two tall people walking in | Hostess stand |
| 3 | "Do you have a table?" | 席はありますか？ | seki wa arimasu ka? | 자리 있어요? | "SEEK-ee a seat — SEEKing!" — desperately looking around | Waiting area |
| 4 | "Non-smoking, please" | 禁煙でお願いします | kin'en de onegai shimasu | 금연으로 부탁합니다 | Korean 금연 = 禁煙 = KIN'EN — COGNATE! FREE MEMORY! | No-smoking sign |

**Ordering:**

| # | Situation | Japanese | Romaji | Korean Equivalent | Keyword Mnemonic | Palace Spot |
|---|-----------|----------|--------|------------------|-----------------|-------------|
| 5 | "This one, please" | これをお願いします | kore wo onegai shimasu | 이거 주세요 | "KORE = 이거 (this). Oh-NEG-EYE = begging, NEGating my pride" | Menu on the table |
| 6 | "What do you recommend?" | おすすめは何ですか？ | osusume wa nan desu ka? | 추천 메뉴가 뭐예요? | "Oh SUSU-MAY — the chef's SUSHI SOUFFLÉ is recommended!" | Chef's counter |
| 7 | "I'll have this" | これにします | kore ni shimasu | 이걸로 할게요 | "KORE NI = I COMMIT to THIS. NI cements the decision" | Pointing finger at menu |
| 8 | "Water, please" | お水をお願いします | omizu wo onegai shimasu | 물 주세요 | "Oh-MIZU = 미즈 — water MISTing from the glass" | Water pitcher |
| 9 | "One more beer" | ビールもう一杯 | biiru mou ippai | 맥주 한 잔 더 | "BEER + MOH-EE-PIE — one more pie-sized glass!" | Beer tap |
| 10 | "Without [X], please" | [X]抜きでお願いします | [X] nuki de onegai shimasu | [X] 빼고 주세요 | "NUKE it! — NUKI = remove = NUKE it from the dish!" | Kitchen window |
| 11 | "Is this spicy?" | これは辛いですか？ | kore wa karai desu ka? | 이거 매워요? | "KARA-EE — the KARate chop makes it SPICY HOT!" ⚠️ Not Korean 가라 | Red pepper on the table |
| 12 | "Delicious!" | 美味しい！ | oishii! | 맛있다! | "Oh-ISH-ee! Oh SHE made it so delicious!" | Plate of food |
| 13 | "I'm allergic to [X]" | [X]アレルギーがあります | [X] arerugi ga arimasu | [X] 알레르기가 있어요 | Korean 알레르기 = アレルギー — COGNATE! Same word! | Allergy warning sign |

**Paying:**

| # | Situation | Japanese | Romaji | Korean Equivalent | Keyword Mnemonic | Palace Spot |
|---|-----------|----------|--------|------------------|-----------------|-------------|
| 14 | "Check, please" | お会計お願いします | okaikei onegai shimasu | 계산해 주세요 | "Oh-KAI-KAY = 회계 (accounting) — COGNATE! Oh KAI, 'KAY, I'll pay!" | Cash register |
| 15 | "Can I pay by card?" | カードで払えますか？ | kaado de haraemasu ka? | 카드로 계산돼요? | "CARD + HARA-eh = CARD HARANGUE — haggling over payment" | Card reader |
| 16 | "Together / Separate" | 一緒に / 別々に | issho ni / betsubetsu ni | 같이 / 따로따로 | "ISSHO = togISHer. BETSU-BETSU = SPLIT-SPLIT" | The bill |
| 17 | "Thank you (after meal)" | ごちそうさまでした | gochisousama deshita | 잘 먹었습니다 | "Go-CHEE-SO-SAH-MAH — I GO home CHEEry, SO SATisfied, MAH belly full" | Restaurant exit |

**🧪 Mini-Quiz 1 (Type 2: Drag-and-Drop):** Match situations to Japanese phrases.
**🧪 Mini-Quiz 2 (Type 5: Sentence Builder):** Build restaurant orders from scrambled words.

---

### Section 5B: Shopping Japanese (買い物)

**Scene Setting:** "The next morning. You need a few things — a phone charger, some snacks, maybe a souvenir. You walk into a ドン・キホーテ (Don Quijote). The aisles are packed floor to ceiling. Here's how to navigate."

**Palace Placement:** The convenience store/편의점 on your route.

| # | Situation | Japanese | Romaji | Korean Equivalent | Keyword Mnemonic | Palace Spot |
|---|-----------|----------|--------|------------------|-----------------|-------------|
| 18 | "How much?" | いくらですか？ | ikura desu ka? | 얼마예요? | "EE-KOO-RAH — 'it'll CURE ya' to know the price" | Price tag on shelf |
| 19 | "I'm just looking" | 見ているだけです | mite iru dake desu | 그냥 구경하고 있어요 | "ME-tay (I'm SEEing) + DAKE (ONLY)" | Browsing aisle |
| 20 | "Do you have a bigger size?" | もっと大きいサイズはありますか？ | motto ookii saizu wa arimasu ka? | 더 큰 사이즈 있어요? | "MOTTO = MOre TO. OOKII = OOh KEY! So big!" | Clothing rack |
| 21 | "I'll take this" | これをください | kore wo kudasai | 이거 주세요 | "KORE + KUDA-SIGH — please give, with a SIGH of relief" | Checkout counter |
| 22 | "Can I try it on?" | 試着できますか？ | shichaku dekimasu ka? | 시착할 수 있어요? | "시착/試着 — COGNATE! EXACT same word! FREE!" | Fitting room |
| 23 | "Too expensive" | ちょっと高いですね | chotto takai desu ne | 좀 비싸네요 | "CHOTTO = 좀. TAKAI = 'take-EYE' — takes your eye out with the price" | Expensive item |
| 24 | "Tax-free?" | 免税ですか？ | menzei desu ka? | 면세예요? | "면세/免税 — COGNATE! MEN-ZEI = 면세! FREE!" | Tax-free counter |
| 25 | "Bag, please" | 袋をお願いします | fukuro wo onegai shimasu | 봉투 주세요 | "FUKU-ROH — a bag FULL of CROWs (not a cognate — make it weird to remember)" | Bag dispenser |

---

### Section 5C: Getting Around (道案内)

**Scene Setting:** "You need to get to 浅草 (Asakusa). You've exited the wrong station exit. The GPS is spinning. Time to ask a real human being for help."

**Palace Placement:** The intersection/교차로 on your route.

| # | Situation | Japanese | Romaji | Korean Equivalent | Keyword Mnemonic |
|---|-----------|----------|--------|------------------|-----------------|
| 26 | "Where is [X]?" | [X]はどこですか？ | [X] wa doko desu ka? | [X]는 어디예요? | "DOKO = where. DOCK-OH — where do I DOCK my ship?" |
| 27 | "Station?" | すみません、駅はどこですか？ | sumimasen, eki wa doko desu ka? | 실례합니다, 역이 어디예요? | "역/駅 = EKI — COGNATE!" |
| 28 | "Straight ahead" | まっすぐ | massugu | 직진 | "MASS-SUU-GOO — a MASS of people going straight" |
| 29 | "Turn right/left" | 右/左に曲がってください | migi/hidari ni magatte kudasai | 오른쪽/왼쪽으로 가세요 | "ME-GEE = right (like a GEE-tar in your right hand). HE-DAH-REE = left (HE DAREs to go left)" |
| 30 | "How far?" | どのくらいかかりますか？ | dono kurai kakarimasu ka? | 얼마나 걸려요? | "DONO KURAI = how much? DONNO the QUANTITY!" |
| 31 | "I'm lost" | 道に迷いました | michi ni mayoimashita | 길을 잃었어요 | "ME-CHEE NI MAYO — I'm in a MAYO MAZE on the MICHI road!" |
| 32 | "[X] Station, please" (taxi) | [X]駅までお願いします | [X] eki made onegai shimasu | [X]역까지 가주세요 | "EKI MADE = station until = 역까지. Perfect structural match!" |
| 33 | "Stop here, please" | ここで止めてください | koko de tomete kudasai | 여기서 세워주세요 | "KOKO = here. TOMETE = TOMATO — throw a tomato to make them STOP!" |

**Direction Words with Full Mnemonic Architecture:**

| Japanese | Reading | Meaning | Keyword Mnemonic | Palace Spot |
|----------|---------|---------|-----------------|------------|
| 右 | migi | right | "ME-GEE — your right hand plays guitar: GEE-tar" | Right turn sign |
| 左 | hidari | left | "HE-DAH-REE — HE DAREs to go LEFT (the daring direction)" | Left turn sign |
| まっすぐ | massugu | straight | "MASS of people surging straight ahead" | Straight road |
| 近い | chikai | near | "CHEE-KAI — cheek-to-cheek, so CLOSE" | Nearby shop |
| 遠い | tooi | far | "TOO-EE — it's TOO far to walk!" | Distant mountain |
| 上 | ue | up/above | "OO-EH — going UP makes you go 'WHOA!'" | Overpass |
| 下 | shita | down/below | "SHEE-TAH — sit your SEAT-AH down below" | Underground passage |
| 中 | naka | inside | "NAH-KAH — inside the NOOK-AH" | Inside the station |

---

### Section 5D: Transportation (交通)

**Palace Placement:** The station/역 at the end of your route.

| # | Situation | Japanese | Romaji | Korean Equivalent | Keyword Mnemonic |
|---|-----------|----------|--------|------------------|-----------------|
| 34 | "One ticket to [X]" | [X]まで一枚 | [X] made ichimai | [X]까지 한 장 | "MADE = 까지. ICHI-MAI = one-flat-thing (ticket)" |
| 35 | "Which platform?" | 何番ホームですか？ | nanban hoomu desu ka? | 몇 번 홈이에요? | "NAN-BAN = what number. HOOMU = home/platform" |
| 36 | "Does this go to [X]?" | これは[X]に行きますか？ | kore wa [X] ni ikimasu ka? | 이거 [X]에 가요? | "Direct Korean structure mapping — just translate particle by particle!" |
| 37 | "Last train" | 終電 | shuuden | 막차 | "SHUU-DEN — 종전(終電) — COGNATE!" |
| 38 | "Transfer" | 乗り換え | norikae | 환승 | "NORI-KAE = ride-change. NORImal ride, KAE(change)!" |

---

### Section 5E: Essential Polite Phrases (基本フレーズ)

**Palace Placement:** Your front door/현관 (where you greet and say goodbye).

| # | Situation | Japanese | Romaji | Korean Equivalent | Keyword Mnemonic |
|---|-----------|----------|--------|------------------|-----------------|
| 39 | Thank you (formal) | ありがとうございます | arigatou gozaimasu | 감사합니다 | "Ah-REE-GAH-TOE — you're GRATEFUL, touching your toes in a bow" |
| 40 | Thank you (casual) | ありがとう | arigatou | 고마워 | Shorter = more casual, same as Korean pattern |
| 41 | Sorry / Excuse me | すみません | sumimasen | 죄송합니다/실례합니다 | "Sue me, Ma'am, SEN(d) apologies" |
| 42 | Sorry (casual) | ごめん(なさい) | gomen (nasai) | 미안(해) | "GO-MEN — 'I'll GO, MEN, I'm sorry'" |
| 43 | Yes | はい | hai | 네 | "HIGH = yes. Nod your head HIGH" |
| 44 | No | いいえ | iie | 아니요 | "EE-EH — shake head, 'EE-EH, no!'" |
| 45 | I don't understand | わかりません | wakarimasen | 모르겠어요 | "WALK-A-RE-MASEN — I can't even WALK through this confusion" |
| 46 | Say it again | もう一度お願いします | mou ichido onegai shimasu | 한 번 더 말씀해주세요 | "MOH ICHI-DOH = one MORE time. MOre, ITCHY to hear again" |
| 47 | Do you speak English? | 英語を話せますか？ | eigo wo hanasemasu ka? | 영어 하세요? | "영어/英語 = EIGO — COGNATE!" |
| 48 | A little Japanese | 日本語が少し話せます | nihongo ga sukoshi hanasemasu | 일본어 조금 해요 | "SUKOSHI = a little. 'So COZY' — just a cozy small amount" |
| 49 | It's okay | 大丈夫です | daijoubu desu | 괜찮아요 | "DIE-JOE-BOO — ⚠️ FALSE FRIEND with Korean 대장부! In Japanese = 'it's fine,' NOT 'great man'" |
| 50 | Please (requesting) | お願いします | onegai shimasu | 부탁합니다 | "Oh-NEG-EYE — NEGating my pride to beg for your help" |
| 51 | Goodbye (formal) | さようなら | sayounara | 안녕히 가세요 | "SAY-YOU-NAH-RAH — I SAY to YOU, 'NAH, I'm going'" |
| 52 | Goodbye (casual) | じゃあね | jaa ne | 잘 가 / 바이 | "JAH-NEH — casual JAB goodbye" |
| 53 | Good morning | おはようございます | ohayou gozaimasu | 안녕하세요 (아침) | "'Oh HI, YO!' — casual morning greeting" |
| 54 | Hello (daytime) | こんにちは | konnichiwa | 안녕하세요 (낮) | "KON-NICHI-WA — 'today is' greeting" |
| 55 | Good evening | こんばんは | konbanwa | 안녕하세요 (저녁) | "KON-BAN-WA — 'this evening' greeting" |
| 56 | Goodnight | おやすみなさい | oyasumi nasai | 안녕히 주무세요 | "Oh-YAH-SOO-ME — 'oh yes, let me ZOOM into sleep'" |

---

### Section 5F: Emergency and Help Phrases

**Palace Placement:** The hospital/병원 sign visible from your route.

| # | Situation | Japanese | Korean Equivalent | Keyword Mnemonic |
|---|-----------|---------|------------------|-----------------|
| 57 | Help! | 助けて！(tasukete!) | 도와주세요! | "TA-SUE-KET-EH — I'm gonna SUE if you don't help!" |
| 58 | Call an ambulance | 救急車を呼んでください (kyuukyuusha wo yonde kudasai) | 구급차 불러주세요 | "구급차/救急車 = KYUUKYUUSHA — COGNATE!" |
| 59 | Where is the hospital? | 病院はどこですか？(byouin wa doko desu ka?) | 병원이 어디예요? | "병원/病院 = BYOUIN — COGNATE!" |
| 60 | I'm sick | 気分が悪いです (kibun ga warui desu) | 기분이 안 좋아요 | "기분/気分 = KIBUN — COGNATE! WARUI = bad" |
| 61 | Lost passport | パスポートをなくしました (pasupooto wo nakushimashita) | 여권을 잃어버렸어요 | "NAKUSHIMASHITA = made-disappear. NAKU = cry. Lost it, now crying!" |

---

### Section 5G: Numbers and Counting for Daily Use

**Palace Placement:** Price signs on shops along your route.

**Two number systems:** Sino-Japanese (いち, に, さん...) and Native Japanese (ひとつ, ふたつ...).

**Sino-Japanese Numbers with Korean Hanja Bridge:**

| Number | Japanese | Korean 한자 reading | Bridge Mnemonic | Similarity |
|--------|---------|-------------------|----------------|-----------|
| 1 | いち (ichi) | 일 (il) | "ICHI is ONE ITCHY finger" | Different sound, same 一 |
| 2 | に (ni) | 이 (i) | "NI = KNEE — you have TWO knees" | Different |
| 3 | さん (san) | 삼 (sam) | "SAN = SAM = CLOSE! SAN-sam, SAN-sam" | ★★★ Close! |
| 4 | よん/し (yon/shi) | 사 (sa) | "SHI/사 are close! SHI sounds like SA in fast speech" | ★★★★ Close! |
| 5 | ご (go) | 오 (o) | "GO get FIVE — GO!" | Different |
| 6 | ろく (roku) | 육 (yuk) | "ROKU = ROCK — SIX rocks stacked" | Different |
| 7 | なな/しち (nana/shichi) | 칠 (chil) | "SHICHI/칠 — both have CHI!" | ★★★ Close! |
| 8 | はち (hachi) | 팔 (pal) | "HACHI = HATCHET — EIGHT hatchets" | Different |
| 9 | きゅう/く (kyuu/ku) | 구 (gu) | "KU/구 = ★★★★ Almost identical!" | ★★★★ Close! |
| 10 | じゅう (juu) | 십 (sip) | "JUU = JUICE — TEN glasses of juice" | Different |
| 100 | ひゃく (hyaku) | 백 (baek) | "HYAKU — sounds like hundred in HYAKU speed" | ★★★ Related |
| 1000 | せん (sen) | 천 (cheon) | "SEN/천 — both start with 'S/Ch' sound!" | ★★★ Related |

**Practical number use (drills):**
- Prices: ３８０円 = さんびゃくはちじゅうえん (380 yen)
- Time: ３時１５分 = さんじじゅうごふん (3:15)
- People at a restaurant: 一人 (hitori), 二人 (futari), 三人 (sannin)...

**🧪 Quiz (Type 3):** "You see a price tag: ¥1,250. Say it in Japanese." → せんにひゃくごじゅうえん

---

### 🧪 Comprehensive Boss Level — "Tokyo Day Simulation"

**The most important exercise in this chapter.** This is a full-day narrative simulation (Type 3 + Type 5, interleaved) that proves the reader can survive a real day in Japan:

1. **7:00 AM — Hotel lobby:** Greet the staff → おはようございます
2. **7:30 AM — Cafe breakfast:** Order → コーヒーとパンをお願いします
3. **8:30 AM — Finding the station:** Ask where Shibuya station is → すみません、渋谷駅はどこですか？
4. **9:00 AM — Buying a ticket:** One ticket to Shibuya → 渋谷まで一枚
5. **10:00 AM — Shopping in Harajuku:** Ask the price → いくらですか？ / Buy something → これをください
6. **12:00 PM — Lunch at an izakaya:** Full flow → entering → おすすめは何ですか？ → これにします → 美味しい！
7. **1:00 PM — Paying:** Check → お会計お願いします → Card? → カードで払えますか？ → ごちそうさまでした
8. **2:00 PM — Getting lost:** 道に迷いました → ask directions → まっすぐ → 右に曲がってください
9. **4:00 PM — Taking a taxi:** [X]までお願いします → ここで止めてください
10. **7:00 PM — Dinner:** Complete restaurant flow from entering to leaving
11. **10:00 PM — Return to hotel:** おやすみなさい

Each step: prompt (situation) → reader produces Japanese → check → next step. Wrong answers get hints, not immediate answers (desirable difficulty).

### 🧪 Recall Check (Ch02-04): 5 hiragana + 3 katakana + 2 pronunciation tasks from SM-2 schedule.

### 🧪 Memory Palace Walker: Walk the home-to-station route. At each location, recall the phrases placed there.

---

## Chapter 06: Particles — The 1:1 Map (助詞/조사)

**Purpose:** The reader has been USING particles in Ch05 phrases without thinking about it. This chapter explains WHY those phrases work and builds conscious understanding.

**Memory Technique Spotlight:** Analogical Transfer + Elaborative Interrogation — the reader already knows Korean particles perfectly. This chapter creates explicit analogical bridges so the Japanese particles can be stored as "Korean particle + modifications" rather than as entirely new items.

**Palace Assignment: The Bathroom (화장실)**
- Small, contained space — perfect for the 11 core particles
- Each particle gets a specific bathroom fixture

**Retroactive Understanding (Before New Content):**

"In Chapter 05, you said these phrases. Let's find the particles hiding inside them:
- これ**を**お願いします — を marks the object (like 을/를)
- 駅**は**どこですか — は marks the topic (like 은/는)
- 駅**まで**一枚 — まで marks the endpoint (like 까지)
- ここ**で**止めてください — で marks the location of action (like 에서)

You were already using particles. Now let's understand them."

### Core Particle Map with Full Memory Architecture

| # | Function | Korean | Japanese | Keyword Mnemonic | Palace Spot (Bathroom) | Elaborative Interrogation |
|---|----------|--------|----------|-----------------|----------------------|--------------------------|
| 1 | Topic | 은/는 | は (wa) | "HA! — THIS is what we're talking about!" は = 'HA!' announcement | Mirror (you look at yourself — YOU are the topic) | WHY does Japanese use は instead of a sound like 은? |
| 2 | Subject | 이/가 | が (ga) | "が GRABS the subject — the subject is GRABBED by が" | Towel hook (it GRABS the towel) | WHY does Japanese need BOTH は and が when Korean uses them identically? |
| 3 | Object | 을/를 | を (wo) | "を WRAPS the object — the object is WRAPPED up for the verb to act on" | Toilet paper roll (WRAPPED around the tube) | Why does を exist separately from は? |
| 4 | Location (exist) | 에 | に (ni) | "に NEEDLES into an exact point — pinpoint location" | Tile grout (the NEEDLE-thin lines between tiles) | WHY does Japanese use different particles for 에 (exist) and 에서 (action)? |
| 5 | Location (action) | 에서 | で (de) | "で is the DOING particle — things happen at で" | Shower (where you DO the action of washing) | How does で differ from に in practice? |
| 6 | Direction | 으로/로 | へ (e) | "へ looks like a hill — going TOWARD the hill" | Door (going TOWARD the exit) | When do you use へ vs に for direction? |
| 7 | Possessive | 의 | の (no) | "の spirals — connecting owner to owned, spiraling together" | Bath drain (spiral connecting water to pipe) | Why is の used SO much more than Korean 의? |
| 8 | From | 에서 | から (kara) | "から CUTs away — KARA-te CHOP away from the origin" | Faucet (water COMES FROM here) | How does から relate to 에서 vs 부터? |
| 9 | Until | 까지 | まで (made) | "MAkes the DEadline — you've MADE it to the end" | Bathtub (fill it up to the line — UNTIL the line) | Is まで always = 까지? |
| 10 | Also | 도 | も (mo) | "MOre — me TOO! も = MOre!" | Toothbrush holder (another one, and MOre!) | Does も work exactly like 도? |
| 11 | And (listing) | 와/과 | と (to) | "と TIES together — TYING two things with a knot" | Double sink (two sinks TIED together by the counter) | How does と differ from や? |

### は vs が: The One Tricky Part

"This is the ONE place where Korean gives you a false sense of security."

Korean은/는 and 이/가 map to Japanese は and が in MOST cases — but Japanese has subtle differences in usage that Korean doesn't:

| Pattern | Japanese | Korean | Match? |
|---------|----------|--------|--------|
| Topic (known info) | 東京**は**大きいです | 도쿄**는** 커요 | ✅ Perfect |
| Subject (new info) | 誰**が**来た？ | 누**가** 왔어? | ✅ Perfect |
| Contrast | 魚**は**好き。肉**は**嫌い。 | 생선**은** 좋아. 고기**는** 싫어. | ✅ Perfect |
| Exhaustive listing | 田中さん**が**来た (= it was Tanaka who came) | 다나카 씨**가** 왔어 | ✅ Perfect |
| Subordinate clause | [雨**が**降る]日 (が inside relative clause) | [비**가** 오는] 날 | ✅ Perfect |

**Good news:** "For 95% of cases, just use は where you'd use 는/은 and が where you'd use 가/이. The remaining 5% is advanced and you'll absorb it naturally through exposure."

### Confusion Zones (Where Korean Coverage Differs)

"Japanese often uses ONE particle where Korean uses TWO or more:"

| Japanese | Covers Korean... | Example |
|----------|-----------------|---------|
| に | 에, 에게, 한테 | 友達に会う = 친구에게 만나다 / 東京に行く = 도쿄에 가다 |
| で | 에서, (으)로 (some) | 学校で勉強する = 학교에서 공부하다 / バスで行く = 버스로 가다 |
| から | 에서 (from), 부터 | 韓国から来た = 한국에서 왔다 / 明日から = 내일부터 |

**Elaborative Interrogation:** "WHY does Japanese merge particles that Korean keeps separate? Think for 15 seconds."

**Answer:** "Japanese particles evolved in a different historical context. に absorbed functions from multiple Old Japanese particles. で was originally にて (ni + te). The result: fewer particles in Japanese, but each one covers more ground. This means you need to think about CONTEXT to choose the right Japanese particle — the function determines the choice, not a 1:1 Korean mapping."

### 🧪 Chapter 06 Quizzes

1. **Drag-and-Drop (Type 2):** Match Korean particles to Japanese equivalents. 11 pairs.
2. **Fill-in-the-Blank (Type 3):** Japanese sentence with particle blank → produce correct particle. Korean parallel shown as hint.
3. **Sentence Builder (Type 5):** Given Korean sentence → build Japanese with correct particles.
4. **Confusion Zone Quiz (Type 3):** Korean 에서 → is it で or から in THIS context? Requires context analysis.
5. **Boss Level — Retroactive Analysis:** Go back to 10 Ch05 phrases → identify and label every particle used.
6. **Palace Walker (Type 8):** Walk the bathroom. At each fixture, recall the particle and its function.

### 🧪 Recall Check (Ch05): 5 survival phrases from SM-2 schedule.

---

## Chapter 07: Verb Conjugation — Same System, Different Clothes (動詞/동사)

**Purpose:** Korean and Japanese share the same AGGLUTINATIVE conjugation system — the reader already understands the CONCEPT. This chapter teaches the Japanese-specific FORMS.

**Memory Technique Spotlight:** Procedural Memory + Pattern Completion — verb conjugation is a SKILL, not a fact. It belongs in procedural memory (like riding a bicycle), built through patterned repetition and drill, not through memorization of rules.

**Opening analogy:** "You know how to drive. Now the controls are in different positions — but it's still a car. The steering wheel, the brake, the gas — they all exist. They're just labeled differently."

### The Anchor Verb: 食べる (taberu) — Full Conjugation Mapped to Korean 먹다

| Form | Korean | Japanese | Pattern |
|------|--------|----------|---------|
| Dictionary | 먹다 | 食べる (taberu) | Base form |
| Polite present | 먹습니다/먹어요 | 食べます (tabemasu) | -ru → -masu |
| Polite past | 먹었습니다 | 食べました (tabemashita) | -masu → -mashita |
| Polite negative | 안 먹습니다 | 食べません (tabemasen) | -masu → -masen |
| Polite neg past | 안 먹었습니다 | 食べませんでした (tabemasen deshita) | -masen + deshita |
| Te-form | 먹어(서) | 食べて (tabete) | -ru → -te |
| Casual past | 먹었어 | 食べた (tabeta) | -ru → -ta |
| Negative | 안 먹어/먹지 않아 | 食べない (tabenai) | -ru → -nai |
| Want to | 먹고 싶다 | 食べたい (tabetai) | -ru → -tai |
| Can | 먹을 수 있다 | 食べられる (taberareru) | -ru → -rareru |
| Volitional | 먹자 | 食べよう (tabeyou) | -ru → -you |
| Conditional | 먹으면 | 食べれば (tabereba) | -ru → -reba |
| Command | 먹어(라) | 食べろ (tabero) | -ru → -ro |

**Key insight:** "The SYSTEM is identical: start with a stem, add endings to change meaning. Korean: 먹 + 습니다/어요/었어/고 싶다. Japanese: 食べ + ます/て/た/たい. Same architecture, different parts."

### Verb Groups: The Three Families

**Group 2 (Ichidan / 一段 — "One Step"):**
- End in -いる or -える
- Conjugation: just drop -る and add the ending
- Mnemonic: "ONE step — drop る, done. EASY."
- Examples: 食べる(taberu), 見る(miru), 寝る(neru), 起きる(okiru)

**Group 1 (Godan / 五段 — "Five Steps"):**
- End in -う, -く, -す, -つ, -ぬ, -ぶ, -む, -る (consonant + u)
- Conjugation: the final vowel CHANGES through the 5 vowel steps (a-i-u-e-o)
- Mnemonic: "FIVE steps — the ending vowel walks through あいうえお."
- Examples: 書く(kaku), 話す(hanasu), 読む(yomu), 飲む(nomu)

**Group 3 (Irregular — just TWO verbs):**
- する (suru, to do) — Korean 하다
- 来る (kuru, to come) — Korean 오다
- Mnemonic: "Only TWO troublemakers. Memorize them cold."

### Te-form: The Most Important Conjugation

**Te-form mnemonic song (to the tune of any familiar song):**

```
U-TSU-RU → って (tte)
MU-BU-NU → んで (nde)
KU → いて (ite)
GU → いで (ide)
SU → して (shite)
```

**Mnemonic:** "The te-form groups rhyme! UTsURU-tte, MuBuNu-nde, K-ite, G-ide, S-shite"

| Dictionary | Te-form | Rule | Example |
|-----------|---------|------|---------|
| 買う (kau) | 買って (katte) | u→って | Buy → bought |
| 待つ (matsu) | 待って (matte) | tsu→って | Wait → waited |
| 帰る (kaeru) | 帰って (kaette) | ru→って | Return → returned |
| 読む (yomu) | 読んで (yonde) | mu→んで | Read → read(past) |
| 遊ぶ (asobu) | 遊んで (asonde) | bu→んで | Play → played |
| 死ぬ (shinu) | 死んで (shinde) | nu→んで | Die → died |
| 書く (kaku) | 書いて (kaite) | ku→いて | Write → wrote |
| 泳ぐ (oyogu) | 泳いで (oyoide) | gu→いで | Swim → swam |
| 話す (hanasu) | 話して (hanashite) | su→して | Speak → spoke |

**Practical retroactive connection:** "In Ch05 you said 止めてください (stop please). Now you know WHY: 止める → 止めて (te-form) + ください (please give). Every ください phrase in Ch05 was te-form + ください!"

### Adjective System

**Two types:**
- **い-adjectives:** End in い. Conjugate like verbs.
  - Mnemonic: "い-adj HAVE the い built in. They're self-contained."
  - 高い (takai, expensive) → 高くない (takakunai, not expensive) → 高かった (takakatta, was expensive)

- **な-adjectives:** Need な before nouns. Conjugate with です/じゃない.
  - Mnemonic: "な-adj NEED な — they need HELP to connect."
  - 静か (shizuka, quiet) → 静かな部屋 (shizuka na heya, quiet room) → 静かじゃない (shizuka ja nai, not quiet)

**Korean parallel:** Korean adjectives = verbs (descriptive verbs). Japanese い-adjectives conjugate SIMILARLY. な-adjectives are more like Korean 명사+하다 patterns.

### 🧪 Chapter 07 Quizzes

1. **Conjugation Drill (Type 3):** Dictionary form → produce masu-form, te-form, nai-form. Timed.
2. **Te-form Song Quiz (Type 3):** Dictionary form → produce te-form using the song rules.
3. **Group Classification (Type 2):** Drag verbs into Group 1, 2, or 3.
4. **Sentence Builder (Type 5):** Korean conjugated sentence → build Japanese equivalent.
5. **Boss Level — Ch05 Retroactive Analysis:** Take 10 Ch05 phrases containing verbs → identify the conjugation form used and explain WHY.

### 🧪 Recall Check (Ch05-06): 3 survival phrases + 2 particle tasks from SM-2 schedule.

---

## Chapter 08: Daily Conversations — Phrases That Get You Through the Day

**Purpose:** Extend Ch05 survival phrases into full conversational patterns. Now that Ch06-07 gave grammar foundations, this chapter teaches LONGER interactions.

**Memory Technique Spotlight:** Episode Encoding + Social Simulation — conversations are stored in EPISODIC memory (memory for events/experiences). By simulating real social episodes (self-introductions, small talk, making plans), the phrases become part of "lived experience" memory, which is extremely durable.

### Self-Introduction (自己紹介) — The Script You'll Use 100 Times

**Full scripted intro with Korean parallel and palace encoding:**

| Line | Japanese | Korean | Function |
|------|----------|--------|----------|
| 1 | 初めまして。 | 처음 뵙겠습니다. | Opening ritual |
| 2 | [Name]と申します。 | [Name]라고 합니다. | Name (humble form) |
| 3 | 韓国から来ました。 | 한국에서 왔습니다. | Origin |
| 4 | [Occupation]をしています。 | [직업]을 하고 있습니다. | Job |
| 5 | 日本語を勉強しています。 | 일본어를 공부하고 있습니다. | Current activity |
| 6 | どうぞよろしくお願いします。 | 잘 부탁드립니다. | Closing ritual |

**Self-Reference Effect exercise:** "Fill in YOUR actual information. Practice YOUR actual self-introduction. This becomes YOUR memory, not a textbook example."

**Mnemonic for どうぞよろしくお願いします:** "DOH-ZO YORO-SHIKU — 'DOZE off if you want, but YOROSHIKU (I'm counting on you)' — imagine DOZING off while shaking someone's hand"

### Small Talk Patterns

| Pattern | Japanese | Korean | Keyword Mnemonic |
|---------|----------|--------|-----------------|
| Weather comment | 今日は暑いですね | 오늘 덥네요 | "ATSUI = hot. AT-SU-EE — the ATTIC is SO hEATy!" |
| Compliment response | 日本語がお上手ですね | 일본어 잘하시네요 | "JOUZU = skilled. JOE'S-ZOO — Joe's zoo is skillfully run!" |
| Hobby question | 趣味は何ですか？ | 취미가 뭐예요? | "SHUMI = hobby. 취미/趣味 — COGNATE!" |
| Weekend plans | 週末は何をしますか？ | 주말에 뭐 해요? | "SHUUMATSU = weekend. 주말/週末 — COGNATE!" |

### Making Plans

| Pattern | Japanese | Korean | Structure Note |
|---------|----------|--------|---------------|
| "Are you free Saturday?" | 土曜日、暇ですか？ | 토요일 시간 있어요? | HIMA = free time, not a cognate |
| "Let's go together" | 一緒に行きましょう | 같이 가요 | ISSHO NI = together, -MASHOU = let's |
| "What time?" | 何時にしましょうか？ | 몇 시로 할까요? | NANJI = what time |
| "Sounds good" | いいですね | 좋네요 | II = good, DESU NE = isn't it |
| "I can't that day" | その日はちょっと… | 그 날은 좀… | Trailing off = polite refusal (same as Korean!) |

### Expressing Opinions

| Pattern | Japanese | Korean | Mnemonic |
|---------|----------|--------|---------|
| "I think..." | 〜と思います | 〜(이)라고 생각해요 | OMOIMASU = think. "Oh-MOI = my THOUGHT" |
| "I like..." | 好きです | 좋아해요 | SUKI = like. "She's SKI-ing because she LIKES it" |
| "I don't like..." | 好きじゃないです | 안 좋아해요 | SUKI JA NAI = not like |
| "It's interesting" | 面白いですね | 재미있네요 | OMOSHIROI = interesting. "Oh MOSHI-ROI — it ROIls with fun" |

### Apology Escalation (Mapped to Korean Levels)

| Level | Japanese | Korean | Context |
|-------|----------|--------|---------|
| 1 (Casual) | ごめん | 미안 | Friends, very casual |
| 2 (Normal casual) | ごめんなさい | 미안해요 | Casual but polite |
| 3 (Polite) | すみません | 죄송해요 | Standard polite |
| 4 (Formal) | 申し訳ございません | 대단히 죄송합니다 | Business, very serious |

**Korean parallel insight:** "Exact same escalation system! Same number of levels, same social logic. The only difference is the Japanese words."

### Filler Words — What Makes You Sound Natural

| Korean | Japanese | Usage |
|--------|----------|-------|
| 음.../그... | えーと/あの... | Thinking pause |
| 그래서 | だから/それで | "So/therefore" |
| 근데 | でも/けど | "But/however" |
| 그리고 | それから/あと | "And then" |
| 진짜?/정말? | 本当に？(ほんとうに？)/ マジで？ | "Really?!" |
| 그렇구나 | そうなんだ | "I see" |
| 맞아 | そうそう | "That's right" |

**Mnemonic for 本当に (hontou ni):** "HON-TOH-NI — 'HONestly TOtally?' — really?!"
**Mnemonic for マジで (maji de):** "MAJI = MAGIC — 'no way, that's MAGIC?!' = really?!"

### 🧪 Chapter 08 Quizzes

1. **Self-Introduction Production (Type 3):** Fill in YOUR self-introduction. Then reproduce the full script from memory.
2. **Situation Role-Play (Type 3):** Interactive conversation simulation — system gives a prompt, reader produces response.
3. **Filler Word Matching (Type 2):** Korean filler → Japanese filler.
4. **Apology Level Quiz (Type 3):** Given a situation, choose the correct apology level.
5. **Boss Level — Full Conversation:** Simulate meeting someone new: greeting → self-intro → small talk → making plans → goodbye. Reader produces each line.

### 🧪 Recall Check (Ch05-07): Mixed survival phrases + particles + conjugation from SM-2.

---

## Chapter 09: Sentence Patterns — Thinking in Japanese (文型/문형)

**Purpose:** Structural patterns with Korean parallels. The reader has been USING patterns — now formalize and internalize them.

**Memory Technique Spotlight:** Chunking + Schema Construction — instead of memorizing individual words and rules, the reader builds pre-assembled CHUNKS (sentence patterns) that can be deployed as units. This is how native speakers actually produce language — in chunks, not word-by-word.

### Pattern 1: Existence — いる/ある

**Korean parallel:** 있다 handles BOTH animate and inanimate. Japanese SPLITS it.

| | Animate (people, animals) | Inanimate (objects, plants) |
|---|---|---|
| Korean | 있다 | 있다 |
| Japanese | いる (iru) | ある (aru) |

**Mnemonics:**
- いる = "EEL (alive!) — EELs are alive, so いる is for living things"
- ある = "R is for ROCKS — rocks are dead objects, so ある is for non-living things"

**Tricky edge cases:**
- Robots → ある (not alive, despite moving)
- Plants → ある (alive but stationary — Japanese categorizes by MOVEMENT)
- Ghosts → いる (because they MOVE like living things!)
- Taxi → いる when waiting (personified as "ready to go")

**Elaborative Interrogation:** "WHY does Japanese split 있다 into two verbs? Think about it."
**Answer:** "Japanese categorizes by AUTONOMOUS MOVEMENT, not by life/death. Things that move under their own power → いる. Things that stay put → ある. This is why fish → いる but trees → ある, even though both are alive."

### Pattern 2: Desire — -たい (tai)

| Korean | Japanese | Structure |
|--------|----------|-----------|
| 먹고 싶다 | 食べたい (tabetai) | Verb stem + たい |
| 가고 싶다 | 行きたい (ikitai) | Verb stem + たい |
| 보고 싶다 | 見たい (mitai) | Verb stem + たい |

**Mnemonic:** "たい = TIE — you're TIED to your desire, can't let go!"

**Warning:** たい is for YOUR desires only. For others: 〜たがっている.
Korean parallel: 먹고 싶어 (own desire) vs. 먹고 싶어하다 (other's desire). Same logic!

### Pattern 3: Giving/Receiving — あげる/もらう/くれる (THE HARDEST PATTERN)

**⚠️ "This is the ONE grammar point where Korean gives you ZERO advantage."**

Korean 주다 covers giving regardless of direction. Japanese has THREE verbs based on social direction:

| Verb | Direction | Mnemonic |
|------|-----------|---------|
| あげる (ageru) | I/in-group → other | "あげる = AGE-ru — give AWAY, things AGE as they leave you" |
| くれる (kureru) | Other → I/in-group | "くれる = CREW-ru — my CREW gives TO me" |
| もらう (morau) | I receive ← from other | "もらう = MORE-ow — I get MORE from others" |

**Visual (SVG):** River diagram.
- あげる: arrow flowing AWAY from "me" → downstream to "other"
- くれる: arrow flowing TOWARD "me" ← upstream from "other"
- もらう: "me" with a bucket, scooping FROM the river

**Why this is hard:** "In Korean, 주다 doesn't care about direction. 나한테 줬어 (gave to me) and 친구한테 줬어 (gave to friend) both use 주다. Japanese FORCES you to mark the social direction. This is a genuinely new concept — invest extra time here."

### Pattern 4: Relative Clauses — FREE!

| Korean | Japanese | Note |
|--------|----------|------|
| [어제 내가 읽은] 책 | [昨日私が読んだ] 本 | Pre-nominal modification — IDENTICAL structure |
| [일본에서 산] 가방 | [日本で買った] かばん | Same: modifier before noun |

**Mnemonic:** "Korean and Japanese relative clauses work EXACTLY the same. The modifier clause goes BEFORE the noun. Zero new learning needed."

### Pattern 5: Reported Speech — ~と

| Korean | Japanese | Structure |
|--------|----------|-----------|
| ~라고 하다 | ~と言う | Quote + と + verb of saying |
| ~라고 생각하다 | ~と思う | Quote + と + verb of thinking |

**Mnemonic:** "と = 라고. Both mean 'that/thus.' Direct mapping."

### Pattern 6: Conditional — ~ば/~たら/~と/~なら

| Japanese | Korean Equivalent | When to Use |
|----------|------------------|-------------|
| ~ば (ba) | ~(으)면 | General conditional |
| ~たら (tara) | ~(으)면 / ~했더니 | "When/if [completed]" |
| ~と (to) | ~(으)면 (automatic result) | "Whenever X, always Y" |
| ~なら (nara) | ~라면 / ~다면 | "If it's the case that..." |

**Mnemonic:** "Korean mostly uses ~면 for everything. Japanese splits it four ways. Think of it as FOUR flavors of ~면."

### 🧪 Chapter 09 Quizzes

1. **いる vs ある Sorting (Type 2):** Drag items into いる or ある columns. Include tricky cases.
2. **Desire Construction (Type 3):** Korean desire sentence → produce Japanese ~たい sentence.
3. **Giving/Receiving Scenario (Type 3):** Situation described → choose あげる/もらう/くれる.
4. **Pattern Mixing (Type 5):** Sentences using ALL patterns interleaved. Reader identifies which pattern and produces the correct form.
5. **Boss Level — Translation Challenge:** 10 Korean sentences covering all patterns → produce Japanese. No hints.

### 🧪 Recall Check (Ch06-08): Mixed particles + conjugation + conversation from SM-2.

---

## Chapter 10: Kanji — The Long Game (漢字/한자)

**Purpose:** Kanji strategy leveraging hanja. Delayed to Ch10 because the reader has been functioning with kana through Ch05-09 and is now motivated to read faster.

**Memory Technique Spotlight:** Morphological Decomposition + Hanja Bridge — break every kanji into radicals (components) and use Korean hanja knowledge to predict readings. This turns kanji from an impossible memorization task into a PUZZLE the reader can SOLVE.

**Palace Assignment: The Bedroom (침실)**
- 30 most important radicals placed at positions around the bedroom
- These become building blocks for hundreds of kanji

### The Korean Speaker's Triple Advantage in Kanji

**Layer 1 — Conceptual:** You already know 한자 CONCEPTS. 學 = 학 = learning. The meaning transfers.

**Layer 2 — Recognition:** Many kanji look similar or identical to 한자 you've seen (even if you can't write them all):
| 한자 | 日本漢字 | Meaning | Same? |
|------|---------|---------|-------|
| 學 | 学 | learn | Simplified but recognizable |
| 韓 | 韓 | Korea | Identical |
| 國 | 国 | country | Simplified |
| 時 | 時 | time | Identical |
| 人 | 人 | person | Identical |
| 大 | 大 | big | Identical |

**Layer 3 — Reading (Sound):** Korean hanja readings (음독) CORRESPOND to Japanese on'yomi through systematic sound rules. This is your SUPERPOWER.

### Sound Correspondence Rules (The Rosetta Stone)

**These rules let you PREDICT Japanese on'yomi from Korean readings:**

| Korean Initial | → Japanese | Examples | Rule Mnemonic |
|---------------|-----------|---------|---------------|
| ㅎ (h) | → k | 학(hak)→ガク(gaku), 한(han)→カン(kan), 화(hwa)→カ(ka) | "H to K — HACK becomes KACK" |
| ㅂ (b/p) | → h | 발(bal)→ハツ(hatsu), 반(ban)→ハン(han), 병(byeong)→ビョウ(byou) | "B to H — BALL becomes HALL" |
| ㅈ (j) | → s/sh | 자(ja)→シャ(sha), 전(jeon)→セン(sen), 정(jeong)→セイ(sei) | "J to S — JAM becomes SAM" |
| ㅁ (m) | → m/b | 문(mun)→モン(mon)/ブン(bun), 명(myeong)→メイ(mei) | "M stays M (mostly)" |
| ㄴ (n) | → n | 남(nam)→ナン(nan), 년(nyeon)→ネン(nen) | "N stays N" |
| ㄹ (r/l) | → r | 력(ryeok)→リョク(ryoku), 류(ryu)→リュウ(ryuu) | "L/R stays R" |
| ㄱ (g/k) | → k/g | 국(guk)→コク(koku), 금(geum)→キン(kin) | "G to K — GUM becomes KIN" |
| ㅅ (s) | → s/sh | 산(san)→サン(san), 신(sin)→シン(shin) | "S stays S" |
| ㅇ (silent/ng) | → vowel start | 안(an)→アン(an), 원(won)→エン(en) | "Silent ㅇ stays silent" |

**Generation Exercise (Type 9: Predict-and-Verify):** "Using the sound rules, PREDICT the Japanese reading before looking."

| 한자 | Korean | Your Prediction | Actual Japanese | Match? |
|------|--------|----------------|----------------|--------|
| 学生 | 학생 (haksaeng) | → ?ガクセイ? | ガクセイ (gakusei) | ✅ ㅎ→k, ㅅ→s |
| 経済 | 경제 (gyeongje) | → ?ケイザイ? | ケイザイ (keizai) | ✅ ㄱ→k, ㅈ→z |
| 図書館 | 도서관 (dosogwan) | → ?トショカン? | トショカン (toshokan) | ✅ |
| 電話 | 전화 (jeonhwa) | → ?デンワ? | デンワ (denwa) | ✅ ㅈ→d, ㅎ→w |
| 大学 | 대학 (daehak) | → ?ダイガク? | ダイガク (daigaku) | ✅ |

*[Expand to 100+ entries across domains: education, economics, medicine, law, daily life]*

### Cognate Accelerator: 100 Sino-Japanese Words by Domain

**Education (教育/교육):**
| 한자어 | Korean | Japanese | Meaning |
|--------|--------|----------|---------|
| 학교 | hakgyo | ガッコウ (gakkou) | school |
| 학생 | haksaeng | ガクセイ (gakusei) | student |
| 선생 | seonsaeng | センセイ (sensei) | teacher |
| 교육 | gyoyuk | キョウイク (kyouiku) | education |
| 시험 | siheom | シケン (shiken) | exam |
| 수업 | sueop | ジュギョウ (jugyou) | class/lesson |
| 대학 | daehak | ダイガク (daigaku) | university |

*[Continue with 10+ domains: Medicine, Transportation, Business, Law, Science, Daily life, Food, Technology, Society, Nature — 10 words each = 100+ total]*

### 30 Most Useful Radicals (Bedroom Palace Placement)

| # | Radical | Meaning | Mnemonic | Palace Spot (Bedroom) |
|---|---------|---------|---------|---------------------|
| 1 | 人 (亻) | person | A person standing | Bed (a person lies here) |
| 2 | 口 | mouth | Open mouth | Pillow (you put your mouth here... snoring) |
| 3 | 日 | sun/day | Window to the sun | Window |
| 4 | 月 | moon/month | Crescent moon | Curtain |
| 5 | 水 (氵) | water | Three drops | Bedside water glass |
| 6 | 木 | tree | A tree trunk | Wooden bed frame |
| 7 | 火 (灬) | fire | Flames at the bottom | Lamp (warm light = fire) |
| 8 | 金 | metal/gold | Gold bar | Alarm clock (metal) |
| 9 | 土 | earth/ground | Ground level | Floor |
| 10 | 手 (扌) | hand | Open hand | Nightstand (where you put things by hand) |

*[Continue to 30 radicals with same format]*

### Practical Connection to Previous Chapters

"Remember these words from Ch05? They were kanji all along:
- 駅 (eki, station) = 역 in Korean
- 禁煙 (kin'en, no smoking) = 금연
- 病院 (byouin, hospital) = 병원
- 会計 (kaikei, check/bill) = 회계
- 免税 (menzei, tax-free) = 면세

You've been seeing kanji COGNATES since Chapter 05. Now you'll learn to systematically exploit them."

### 🧪 Chapter 10 Quizzes

1. **Predict the Reading (Type 9):** 20 한자어 → predict Japanese on'yomi using sound rules → verify.
2. **Radical Identification (Type 2):** Given a kanji, identify its radicals.
3. **Cognate Matching (Type 2):** Korean 한자어 ↔ Japanese 漢語 matching.
4. **Palace Walker (Type 8):** Walk the bedroom, recall radicals at each position.
5. **Boss Level — Read Real Kanji Compounds:** 20 compounds from news headlines → read using sound rules + radical knowledge.

### 🧪 Recall Check (Ch05-08): Mixed content from SM-2 schedule.

---

## Chapter 11: Sino-Vocabulary Turbocharger (漢語/한자어)

**Purpose:** Systematically exploit the 40-60% Sino-vocabulary overlap between Korean and Japanese.

**Memory Technique Spotlight:** Sound Correspondence Rules + Generation Effect — the reader PREDICTS Japanese readings from Korean knowledge, then verifies. The act of prediction (even incorrect) strengthens memory dramatically.

### Expanded Sound Rules with 10+ Examples Each

*[Expand every sound correspondence rule from Ch10 with 10+ examples, organized by initial consonant. Include irregular exceptions and frequency notes.]*

### Domain-Specific Cognate Lists (50-100 per domain)

*[10 domains, 50-100 entries each: Business, Law, Medicine, Technology, Politics, Education, Daily Life, Science, Arts, Sports]*

### False Friends (同形異義語) — Words That LOOK the Same But DIFFER

**These are DANGEROUS. You think you know them because the kanji match Korean, but the meaning has shifted:**

| Kanji | Korean Meaning | Japanese Meaning | Danger | Example |
|-------|---------------|-----------------|--------|---------|
| 大丈夫 | 대장부 = great man | daijoubu = it's okay/fine | ★★★★★ | "He's daijoubu" ≠ "He's a great man" |
| 人参 | 인삼 = ginseng | ninjin = carrot | ★★★★★ | Ordering 人参 in Japan gets you CARROT |
| 愛人 | 애인 = lover/partner | aijin = mistress/affair | ★★★★★ | NEVER use this in polite company in Japan |
| 工夫 | 공부 = study | kufuu = creative solution | ★★★★ | "工夫する" = devise, NOT study |
| 手紙 | 수건 = towel | tegami = letter | ★★★★ | Asking for 手紙 at a hotel = asking for paper |
| 丈夫 | 장부 = ledger/robust | joubu = sturdy/durable | ★★★ | Close but different nuance |
| 新聞 | 신문 = newspaper (same!) | shinbun = newspaper | ✅ | Rare — actually matches! |
| 約束 | 약속 = promise | yakusoku = promise | ✅ | Also matches! |

*[Expand to 50+ false friends with vivid "what could go wrong" scenarios]*

### 🧪 Chapter 11 Quizzes

1. **Predict and Verify Marathon (Type 9):** 50 words. Reader predicts Japanese from Korean. Tracks accuracy %.
2. **False Friends Alert (Type 3):** Given a kanji compound in context → is this a true cognate or a false friend?
3. **Domain Quiz (Type 3):** Reader chooses a domain → gets 20 cognate tests from that domain.
4. **Boss Level — News Headline Translation:** Real NHK headlines → reader translates using cognate knowledge.

### 🧪 Recall Check (Ch10): Kanji radicals + sound rules from SM-2.

---

## Chapter 12: Native Japanese Vocabulary — Words Korean Can't Help With (和語)

**Purpose:** Core everyday native Japanese vocabulary (和語, wago). These are the words where Korean gives NO help — completely different roots. This is where keyword mnemonics with vivid imagery pay off the most.

**Memory Technique Spotlight:** Keyword Method + Vivid Imagery — every word gets a Korean→keyword→vivid image→Japanese chain. The weirder, more emotional, more exaggerated the image, the better the retention.

**Palace Assignment: A Familiar Park (공원)**

### 200+ Core Wago with Full Mnemonic Architecture

**Format for each word:**
```
Japanese: 食べる (taberu) — to eat
Korean: 먹다 (meokda)
Keyword bridge: TABLE (sounds like "tabe-")
Vivid image: You're eating directly off a TABLE — food flying, sauce dripping, dogs fighting for scraps under the table. You SMASH your face into the table to eat. Chaos.
Palace spot: Park bench (you eat lunch on the bench)
SM-2: registered
```

**Body and Health:**

| Japanese | Reading | Meaning | Korean | Keyword | Vivid Image |
|----------|---------|---------|--------|---------|-------------|
| 食べる | taberu | eat | 먹다 | TABLE | Smashing face into a TABLE to eat |
| 飲む | nomu | drink | 마시다 | NOM | NOM NOM NOM — drinking so loudly everyone stares |
| 見る | miru | see | 보다 | MIRROR | Staring into a MIRROR so hard it cracks |
| 聞く | kiku | hear | 듣다 | KICK | Someone KICKs a drum next to your ear — you HEAR it too well |
| 話す | hanasu | speak | 말하다 | HONEY | Speaking with a mouth full of HONEY — words dripping out |
| 走る | hashiru | run | 달리다 | HASH (brown) | Running while carrying giant HASH browns — they're flying everywhere |
| 歩く | aruku | walk | 걷다 | ARK | Walking slowly onto Noah's ARK with all the animals |
| 寝る | neru | sleep | 자다 | NARROW | Sleeping in a NARROW bed, falling off both sides |
| 起きる | okiru | wake up | 일어나다 | OKAY | Waking up and shouting "OKAY! I'm up!" while falling out of bed |
| 死ぬ | shinu | die | 죽다 | SHIN | Stubbing your SHIN so hard you dramatically die |

**Nature and Weather:**

| Japanese | Reading | Meaning | Korean | Keyword | Vivid Image |
|----------|---------|---------|--------|---------|-------------|
| 水 | mizu | water | 물 | MISTY | MISTy water spraying from a broken fountain in the park |
| 空 | sora | sky | 하늘 | SORE (muscle) | The sky is SO wide it makes your neck SORE looking up |
| 雨 | ame | rain | 비 | AMETHYST | AMETHYST crystals falling from the sky instead of rain |
| 風 | kaze | wind | 바람 | CRAZY | CRAZY wind blowing everything sideways in the park |
| 山 | yama | mountain | 산 | YAMMER | YAMMERING about how tall the mountain is |
| 川 | kawa | river | 강 | COW | A COW standing in the river, refusing to move |
| 花 | hana | flower | 꽃 | HONEY | Flowers dripping HONEY onto your shoes |
| 木 | ki | tree | 나무 | KEY | A giant KEY growing from the ground like a tree |

**Emotions and States:**

| Japanese | Reading | Meaning | Korean | Keyword | Vivid Image |
|----------|---------|---------|--------|---------|-------------|
| 美味しい | oishii | delicious | 맛있다 | OH SHE | "OH, SHE made it SO delicious" — fainting from taste |
| 高い | takai | expensive/tall | 비싼/높은 | TACKY | TACKY expensive jewelry — so expensive it's TACKY |
| 安い | yasui | cheap | 싼 | YEAH, SUIT | "YEAH, this SUIT was cheap!" — showing off a terrible suit |
| 大きい | ookii | big | 큰 | OKAY | "OKAY, that's BIG" — jaw dropping at something enormous |
| 小さい | chiisai | small | 작은 | CHEESE | A CHEESE wheel the size of a grain of sand — hilariously SMALL |
| 新しい | atarashii | new | 새로운 | A TARASHI(ng) | A THRASHING new car — just unwrapped, being THRASHED around the lot |
| 古い | furui | old | 오래된 | FURY | An OLD man in a FURY — shaking his cane at kids |
| 嬉しい | ureshii | happy | 기쁜 | YOU'RE A SHE | "YOU'RE A SHE-ro (hero)!" — so HAPPY to be a hero |
| 悲しい | kanashii | sad | 슬픈 | CANNOT SEE | CANNOT SEE through tears — crying so SAD |
| 怖い | kowai | scary | 무서운 | COW-WHY | "COW, WHY are you so SCARY?!" — a demon cow |

*[Continue to 200+ words across categories: actions, home items, time words, colors, family terms, body parts, food items, daily objects, descriptors, social words]*

**Onomatopoeia / 擬態語 / 의성어·의태어 (40+ entries):**

| Japanese | Meaning | Korean Equivalent | Vivid Mnemonic |
|----------|---------|------------------|---------------|
| ドキドキ | heart pounding | 두근두근 | DOKI-DOKI — my heart is like a DOCKing ship, THUMP THUMP |
| キラキラ | sparkling | 반짝반짝 | KIRA-KIRA — like a KILLER diamond, blinding sparkle |
| ペラペラ | fluently | 유창하게 | PERA-PERA — pages PEELING off as you speak so fast |
| ゴロゴロ | rumbling/lounging | 우르르/뒹굴뒹굴 | GORO-GORO — rolling around like a GORILLA on the floor |
| ワクワク | excited | 설레설레 | WAKU-WAKU — WAKing up excited for Christmas |
| ニコニコ | smiling | 방글방글 | NIKO-NIKO — NICK is always smiling |

*[Expand to 40 total]*

### 🧪 Chapter 12 Quizzes

1. **Keyword Flashcard (Type 1):** Show Japanese → recall keyword → recall meaning → self-rate.
2. **Image Recall (Type 3):** Show the vivid image description → produce the Japanese word.
3. **Timed Sprint (Type 4):** 50 wago in 3 minutes. Personal best tracking.
4. **Interleaved Mix (Type 3):** Mix wago + Sino-vocab + particles + conjugation.
5. **Palace Walker (Type 8):** Walk the park, recall words at each location.
6. **Boss Level — Story Writing:** Write a short story using 20+ wago. Generation effect at maximum.

### 🧪 Recall Check (Ch10-11): Kanji + Sino-vocabulary from SM-2.

---

## Chapter 13: Honorifics and Politeness — Mapping 존댓말 to 敬語

**Purpose:** The Japanese keigo system for someone who ALREADY navigates Korean honorifics intuitively.

**Memory Technique Spotlight:** Pragmatic Schema + Role-Play Encoding — honorifics are best learned through ROLE-PLAY in specific social scenarios, building pragmatic schemas (social scripts) that trigger the correct forms.

**Opening:** "In Ch05, you used ください and お願いします without knowing these are keigo. In Ch08, you used 申します in your self-introduction. You've been using honorifics — now let's understand the full system."

### Structural Comparison

| Level | Korean Term | Japanese Term | Function |
|-------|-----------|-------------|---------|
| Polite (basic) | 해요체 / -습니다체 | 丁寧語 (teineigo) | -ます/-です endings |
| Honorific (elevating other) | 높임말 (-시-) | 尊敬語 (sonkeigo) | お/ご- prefix, -られる |
| Humble (lowering self) | 겸양어 | 謙譲語 (kenjougo) | Special humble verbs |

**Korean speaker's advantage:** "You already UNDERSTAND why honorifics exist and when to switch levels. The CONCEPT transfers 100%. You just need the Japanese-specific forms."

### Special Verb Pairs

| Meaning | Plain | Sonkeigo (Honorific) | Kenjougo (Humble) | Korean |
|---------|-------|---------------------|-------------------|--------|
| go | 行く (iku) | いらっしゃる (irassharu) | 参る (mairu) | 가다/가시다/가겠습니다 |
| come | 来る (kuru) | いらっしゃる | 参る | 오다/오시다 |
| be (exist) | いる | いらっしゃる | おる (oru) | 있다/계시다 |
| eat | 食べる | 召し上がる (meshiagaru) | いただく (itadaku) | 먹다/드시다/먹겠습니다 |
| say | 言う (iu) | おっしゃる (ossharu) | 申す (mousu) | 말하다/말씀하시다/말씀드리다 |
| see | 見る (miru) | ご覧になる (goran ni naru) | 拝見する (haiken suru) | 보다/보시다/뵙다 |
| know | 知る (shiru) | ご存じ (gozonji) | 存じる (zonjiru) | 알다/아시다 |
| give | あげる | — | 差し上げる (sashiageru) | 주다/드리다 |
| receive | もらう | — | いただく (itadaku) | 받다/받으시다 |

**Mnemonic for いらっしゃる:** "IRASSHARU — 'I RUSH to serve you, SIR!' — the ultimate respectful welcome"

**Mnemonic for いただく:** "ITADAKU — 'ITADAKIMASU' before eating = 'I humbly receive this food'"

### Scenario-Based Practice

**Scenario 1: Meeting your Japanese boss's boss (사장님의 상사)**
- Reader must choose correct keigo level for each action

**Scenario 2: A customer calls your company**
- Phone reception keigo script with Korean parallel

**Scenario 3: Casual → polite register switching**
- Same sentence in 4 registers: casual → polite → honorific → humble

### 🧪 Chapter 13 Quizzes

1. **Register Selection (Type 3):** Situation → choose correct keigo level + form.
2. **Verb Form Drill (Type 3):** Given plain verb → produce sonkeigo AND kenjougo forms.
3. **Role-Play Simulation (Type 3):** Interactive scenario — system describes social context, reader produces appropriately polite Japanese.
4. **Boss Level — Business Email:** Write a short keigo-appropriate email. System checks for correct forms.

### 🧪 Recall Check (Ch08-12): Mixed conversation + vocabulary from SM-2.

---

## Chapters 14-18: Summary Specifications

*[These chapters follow the same deep memory architecture format. Key specifications:]*

### Chapter 14: Reading Real Japanese
- Color-coded mixed-script analysis (hiragana=blue, katakana=green, kanji=red)
- Korean "meaning-first" strategy: scan kanji cognates to get 40-60% meaning before reading
- Progressive text difficulty: children's stories → NHK Easy → full news → manga
- **Memory focus:** Extensive reading builds incidental vocabulary acquisition

### Chapter 15: Writing
- LINE/texting style, formal emails, business documents
- Korean internet shorthand parallels: ㅋㅋㅋ → www (笑), ㅠㅠ → (T_T)
- Full business email template with Korean parallel
- **Memory focus:** Production effect — writing strengthens memory more than reading

### Chapter 16: Listening
- Korean speaker's structural prediction advantage (SOV = you know the verb is coming last)
- Extensive → intensive → shadowing progression
- Speed adaptation: Japanese spoken rate vs. Korean spoken rate
- Resource list by level
- **Memory focus:** Perceptual learning + shadowing as motor memory training

### Chapter 17: Cultural Pragmatics
- 空気を読む ↔ 눈치, 本音と建前 ↔ 겉과 속
- 迷惑 concept, business card exchange, ビジネスマナー
- Regional variation awareness
- **Memory focus:** Cultural schema building through narrative encoding

### Chapter 18: JLPT and Beyond
- JLPT structure + Korean speaker advantage per section
- N3 plan (6-9 months) + N2 plan (12-18 months)
- Study schedule integrating Memory Architecture
- Immersion environment setup
- **Memory focus:** Metacognitive strategy + self-regulated learning protocols

---

## Chapter 19: Your Memory Palace — Building the Permanent Architecture

**Purpose:** Consolidation chapter. The reader now has content in multiple palaces. This chapter teaches how to LINK them, AUDIT them, and EXPAND them for lifelong use.

**Memory Technique Spotlight:** Method of Loci Mastery — advanced techniques for palace management, including palace linking, palace expansion, and palace maintenance schedules.

### Palace Inventory Audit

Interactive exercise: Walk through EVERY palace built during the course:
1. **Kitchen (부엌):** 46 hiragana — recall test
2. **Living Room (거실):** 46 katakana — recall test
3. **Street Route (집→역):** 60+ survival phrases — recall test
4. **Bathroom (화장실):** 11 particles — recall test
5. **Bedroom (침실):** 30 radicals — recall test
6. **Park (공원):** 200+ wago — recall test

### Palace Linking: The Grand Tour

"Connect all your palaces into ONE continuous route: Home (front door) → Kitchen → Living Room → Bathroom → Bedroom → Out the front door → Street to Station → Park."

This creates a single walkable path through ALL learned content.

### Building New Palaces

Teach the reader to create new palaces for future vocabulary:
- Workplace for business vocabulary
- School/university for academic terms
- Gym for body/health vocabulary
- Restaurant (real one from their life) for advanced food vocabulary

### Maintenance Schedule

| Interval | Activity | Duration |
|----------|---------|----------|
| Daily | SM-2 review of due items | 10-15 min |
| Weekly | Walk ONE palace completely | 10 min |
| Monthly | Walk ALL palaces | 30-60 min |
| Quarterly | "Grand Tour" — all palaces linked | 45 min |

---

## Chapter 20: The 90-Day Sprint — Putting It All Together

**Purpose:** A structured 90-day intensive plan that integrates all Memory Architecture techniques into a daily routine.

**Memory Technique Spotlight:** Distributed Practice Schedule + Habit Stacking — attach study habits to existing habits (after coffee, after commute, before bed) for automatic consistency.

### The 90-Day Calendar

**Phase 1: Foundation (Days 1-30)**
- Week 1: Ch00-02 (Memory science + Hiragana) — 45 min/day
- Week 2: Ch03-04 (Katakana + Pronunciation) — 45 min/day
- Week 3: Ch05 (Survival Japanese) — 45 min/day + start using phrases
- Week 4: Ch06-07 (Particles + Verbs) — 45 min/day

**Phase 2: Expansion (Days 31-60)**
- Week 5-6: Ch08-09 (Conversations + Patterns) — 45 min/day
- Week 7-8: Ch10-11 (Kanji + Sino-vocabulary) — 60 min/day (kanji needs extra time)

**Phase 3: Depth (Days 61-90)**
- Week 9-10: Ch12-13 (Native vocab + Honorifics) — 45 min/day
- Week 11-12: Ch14-18 (Skills + JLPT prep) — 45 min/day
- Day 90: Palace Grand Tour + Comprehensive self-assessment

### Daily Structure (Habit Stacking)

| Existing Habit | Attach This | Duration | Pillar |
|---------------|------------|----------|--------|
| After waking up | Morning Review (SM-2 due items) | 5 min | Spaced Repetition |
| During commute | Listen to NHK Easy / podcast | 20-30 min | Listening |
| During lunch | New chapter section | 15-20 min | Encoding |
| After dinner | Practice exercises | 15-20 min | Generation |
| Before bed | Palace Walk + hard items review | 5-10 min | Method of Loci + Sleep Consolidation |

### Progress Metrics

Self-assessment at Day 30, 60, 90:
- Hiragana/Katakana speed test (target: <2 sec per character)
- Survival phrase recall (target: 80%+ from Ch05)
- Particle accuracy (target: 90%+)
- Vocabulary count (target: 500+ at Day 60, 1000+ at Day 90)
- Kanji recognition (target: 200+ at Day 90)
- Conversation ability (can you do a self-introduction? Small talk? Restaurant ordering?)

### Closing Message

"한국어를 모국어로 하는 당신은 일본어를 배울 때 세계에서 가장 유리한 위치에 있습니다. 영어 화자가 2,200시간이 걸리는 것을, 당신은 올바른 기억술과 체계적인 학습으로 700시간 이내에 해낼 수 있습니다. 이 책에서 배운 기억의 궁전, 간격 반복, 키워드 연상법은 일본어뿐만 아니라 앞으로 어떤 것을 배우든 평생 사용할 수 있는 도구입니다. 이미 절반은 알고 있었습니다. 나머지 절반은 이제 기억의 건축물 안에 안전하게 자리 잡았습니다. ゼロからヒーローへ — おめでとうございます。"

("As a native Korean speaker, you are in the most advantageous position in the world for learning Japanese. What takes English speakers 2,200 hours, you can achieve in under 700 with the right memory techniques and systematic study. The memory palaces, spaced repetition, and keyword mnemonics you learned in this book are tools you can use for ANYTHING you learn for the rest of your life. You already knew half. The other half is now safely placed inside your memory architecture. From zero to hero — congratulations.")

---

# DOCUMENT-WIDE REQUIREMENTS

## Language Display Convention
- Chapters 00-09: kanji/kana + (romaji) + Korean equivalent
- Chapters 10-20: drop romaji — reader should be reading kana independently by now

## Interactive Exercise Minimums

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

## SM-2 Spaced Repetition Engine Specification

```javascript
// SM-2 Algorithm (simplified for browser)
function calculateNextReview(quality, previousInterval, easeFactor) {
  // quality: 0-5 (0=complete blank, 5=perfect instant recall)
  // Returns: { interval: days, easeFactor: number }

  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval;
  if (quality < 3) {
    newInterval = 1; // Reset to 1 day
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

**Item data structure:**
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

## Daily Review Engine

Landing page "Daily Review" button:
1. Query all items where `today >= last_review + interval_days`
2. Sort by: overdue items first, then lowest ease_factor (hardest items first)
3. Present 15-25 items per session
4. After session: show accuracy %, items mastered (interval > 30 days), items to re-review, streak count
5. Update streak counter: streak++ if ≥1 review session today, streak=0 if missed a day

## Memory Streak System

- Counter on landing page: "🔥 X-day streak"
- Condition: complete ≥1 Daily Review OR ≥1 Palace Walk per day
- Milestone celebrations: 7 days, 14 days, 30 days, 60 days, 90 days
- Stored via `window.storage.set('streak_count', X)` and `window.storage.set('last_review_date', date)`

## Chapter Completion System
- "Mark as Complete ✅" button at bottom of each chapter
- Sidebar: 20 chapters with checkboxes, ✅ + green accent on complete
- Landing page: full checklist + progress bar ("X/20 complete") + memory streak
- Persistence: `window.storage` API

## Design System Adaptation
- Hero: torii gate or ink brush stroke SVG with memory palace motif (palace gate)
- Badge: "Zero to Hero — 日本語 Memory Architecture Edition"
- Title: "From 한국어 to 日本語 — The Memory Architect's Guide"
- Subtitle: "Not a standard textbook — a systematic exploitation of everything you already know, powered by the science of memory."
- Sidebar: flat list of 20 chapters with checkboxes + streak counter
- Font: Noto Sans JP + Noto Sans KR
- `<meta charset="UTF-8">` + CJK verification
- Color coding: blue = Japanese text, green = Korean parallel, orange = mnemonic bridge, purple = memory technique callout

## Appendices

### Appendix A: Glossary
Scripts, Grammar (Korean equiv.), Vocabulary Domains, Cultural Concepts, JLPT Levels, Memory Technique Terms.

### Appendix B: Cognate Reference
500+ Korean→Japanese Sino-vocabulary. Each: kanji, Korean reading, Japanese reading, meaning, similarity ★-★★★★★, sound rule applied.

### Appendix C: Sound Correspondence Cheat Sheet
One-page reference. All 9 initial consonant rules, 10+ examples each, exceptions noted.

### Appendix D: False Friends
50+ 同形異義語. Each: kanji, Korean meaning, Japanese meaning, danger level ★-★★★★★, example sentence showing the difference, "what could go wrong" scenario.

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
- New items introduced per day (recommended 10-20)
- Review items due per day (calculated from SM-2)
- Projected total items mastered at each checkpoint
- Daily time estimate (15-60 min depending on review load)

### Appendix G: Mnemonic Image Bank
200+ keyword mnemonic images, organized alphabetically by Japanese word:
- Each entry: Japanese word, keyword, image description, SVG reference
- Cross-referenced to chapter and palace location

## Estimated Scale
- 20 chapters + 7 appendices = 27 sections
- Each chapter: 3,000-8,000 words + tables + mnemonics + quizzes + palace maps
- Total: ~100,000-130,000 words
- Quiz widgets: ~120+
- Mnemonic SVGs: ~200+
- Palace map SVGs: ~6 major palaces
- SM-2 tracked items: ~800+
- Memory palace locations: ~200+
