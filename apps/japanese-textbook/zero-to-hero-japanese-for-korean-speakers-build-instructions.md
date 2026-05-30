# Zero to Hero: Japanese for Korean Speakers
## Complete Build Instructions for an LLM

> **What this is:** Complete instructions to hand to an LLM (with the FUSO HMI HTML file as a design reference) to build a comprehensive, interactive HTML reference document that takes a highly proficient Korean speaker from zero Japanese to functional fluency — reading, writing, speaking, and listening — by systematically leveraging the massive structural overlap between Korean and Japanese.
>
> **Target reader:** An adult with high-level Korean proficiency (한국어 고급). They understand 존댓말/반말 systems, are comfortable with particles (조사), SOV word order, topic/subject marking (은/는 vs 이/가), agglutinative verb conjugation, and hanja-based vocabulary. They do NOT know any Japanese — no hiragana, no kanji, no vocabulary. But their Korean gives them an enormous head start that most Japanese learning resources waste by teaching from an English-speaker baseline.
>
> **Language of instruction:** English. Korean is used for direct comparisons. Japanese content presented in all three scripts with romaji for Chapters 01-09, dropping romaji from Chapter 10 onward.
>
> **Design system:** Identical to the FUSO HMI Expert Reference. Same fonts, colors, components, dark/light theme, sidebar, responsive layout. Rebrand with Japanese aesthetic — torii gate or ink brush stroke SVG silhouette. Badge: "Zero to Hero — 日本語 for Korean Speakers."
>
> **The endgame:** By the final chapter, the reader should be able to: (1) read and write all three Japanese scripts including ~1,200 kanji, (2) hold everyday conversations in both polite and casual registers, (3) consume native Japanese media (news, manga, YouTube) with reasonable comprehension, (4) understand the keigo (敬語) system by mapping it against Korean 존댓말, (5) pass JLPT N3 with preparation toward N2, (6) leverage their Korean hanja knowledge to rapidly expand vocabulary.
>
> **Document version:** v4.0 — Survival-first chapter order. Daily-use Japanese (restaurants, shopping, directions, travel) taught immediately after scripts, before grammar theory. Pedagogically enhanced with evidence-based learning science, interactive quizzes, mnemonics, and completion checkboxes.

---

# TABLE OF CONTENTS — INTERACTIVE CHECKLIST

The sidebar and landing page render this as an interactive checklist. Each chapter has a clickable checkbox that persists via `window.storage`. A progress bar at the top shows "X/18 complete."

| ☐ | Ch | Title |
|---|-----|-------|
| ☐ | 01 | Your Korean Advantage — What Transfers and What Doesn't |
| ☐ | 02 | Hiragana — Your First Script (ひらがな) |
| ☐ | 03 | Katakana — The Foreign Word Script (カタカナ) |
| ☐ | 04 | Pronunciation — Where Korean Habits Help and Hurt |
| ☐ | 05 | Survival Japanese — Restaurants, Shopping, and Getting Around |
| ☐ | 06 | Particles — The 1:1 Map (助詞/조사) |
| ☐ | 07 | Verb Conjugation — Same System, Different Clothes (動詞/동사) |
| ☐ | 08 | Daily Conversations — Phrases That Get You Through the Day |
| ☐ | 09 | Sentence Patterns — Thinking in Japanese (文型/문형) |
| ☐ | 10 | Kanji — The Long Game (漢字/한자) |
| ☐ | 11 | Sino-Vocabulary Turbocharger (漢語/한자어) |
| ☐ | 12 | Native Japanese Vocabulary — Words Korean Can't Help With (和語) |
| ☐ | 13 | Honorifics and Politeness — Mapping 존댓말 to 敬語 |
| ☐ | 14 | Reading Real Japanese — Newspapers, Manga, and the Web |
| ☐ | 15 | Writing — From Texts to Business Emails |
| ☐ | 16 | Listening — Training Your Ear for Japanese |
| ☐ | 17 | Cultural Pragmatics — What the Textbook Won't Teach You |
| ☐ | 18 | JLPT and Beyond — The Path to True Fluency |

**Appendices** (no checkbox — reference material):
- Glossary
- Cognate Reference (500+ Sino-vocabulary words)
- Sound Correspondence Cheat Sheet
- False Friends (50+ entries)

**Design rationale for chapter order:** The reader can read scripts (Ch02-03) and pronounce correctly (Ch04) by end of the first week. Chapter 05 immediately puts those skills to use in real situations — ordering food, buying things, asking directions. This gives the reader an instant payoff and a reason to keep going before diving into grammar theory (Ch06-09). Kanji (Ch10) is delayed because the reader can function in daily life using kana alone, and kanji requires sustained effort that's better motivated after the reader has tasted practical success.

**Implementation notes for the table of contents:**
- Sidebar: persistent navigation with checkboxes, flat list (no grouping)
- Landing page: large visual checklist with chapter descriptions + global progress bar
- Checkbox state via `window.storage.set('ch-XX-complete', 'true')` / `window.storage.get('ch-XX-complete')`
- Completed: ✅ icon + subtle green left-border accent
- Progress bar: 18 segments, "X/18 complete"
- Each chapter page: "Mark as Complete ✅" button at bottom

---

# PEDAGOGICAL FRAMEWORK — READ THIS FIRST

This document is not just a reference — it is an interactive learning system. Every chapter must implement these evidence-based techniques. Non-negotiable.

## The Six Pillars

### 1. Retrieval Practice (Active Recall)
Interactive quizzes after every major concept. Reader must PRODUCE the answer before seeing it. 50-100% better retention vs re-reading (Roediger & Karpicke, 2006).

### 2. Spaced Repetition Cues
Each chapter includes a "Recall Check" sidebar quizzing 3-5 items from 2-3 chapters ago. 200% retention improvement vs massed practice (Cepeda et al., 2006).

### 3. Mnemonics and Dual Coding
Every character gets a visual mnemonic SVG + story sentence + Korean bridge. Keyword mnemonics double vocabulary acquisition speed (Atkinson, 1975).

### 4. Interleaving
Exercises mix old and new material. Improves discrimination (Rohrer, 2012).

### 5. Elaborative Interrogation
"WHY does this work?" prompts before explanations. Better retention than reading facts (Dunlosky et al., 2013).

### 6. Desirable Difficulty
Three tiers per chapter: Warm-Up (recognition), Challenge (production), Boss Level (application in context).

---

## Interactive Component Specifications

7 reusable quiz components in `quiz-engine.js`:

1. **Click-to-Reveal Flashcard** — prompt → mental answer → flip → self-rate (Easy/Hard/Again)
2. **Drag-and-Drop Matching** — two columns, drag to match, color feedback
3. **Fill-in-the-Blank** — type answer, submit, check, explanation + Korean parallel
4. **Timed Recognition Sprint** — rapid-fire ID, tracks speed + accuracy
5. **Sentence Builder** — arrange scrambled words into correct sentence
6. **Audio Discrimination (Visual)** — minimal pairs with pitch/length indicators
7. **Spaced Recall Check** — sidebar widget, random items from earlier chapters

**Storage:** `window.storage` API for persistence. In-memory fallback.

---

# === META-INSTRUCTIONS ===

## Step 0: Project Scaffold

```
zero-to-hero-japanese/
├── CLAUDE.md
├── docs/
│   ├── BUILD-INSTRUCTIONS.md
│   ├── PROGRESS.md
│   ├── DECISIONS.md
│   ├── QA-CHECKLIST.md
│   ├── PEDAGOGY-REVIEW.md
│   └── COMPONENT-REGISTRY.md
├── src/
│   ├── index.html                  # Landing: hero + chapter checklist + progress bar
│   ├── ch-01.html through ch-18.html   # One file per chapter
│   ├── appendices.html
│   ├── css/design-system.css       # ALL CSS from FUSO ref
│   ├── js/
│   │   ├── theme.js
│   │   ├── sidebar.js              # Includes chapter checkboxes
│   │   ├── quiz-engine.js          # All 7 quiz types
│   │   └── shared.js
│   ├── assets/
│   └── drafts/
├── reference/fuso-hmi-reference.html
└── output/
```

## Step 1: CLAUDE.md

```markdown
# Japanese Zero-to-Hero Build

## Project Overview
18-chapter interactive HTML reference. One HTML file per chapter. Survival-first order: scripts → daily use → grammar → depth. Interactive TOC with completion checkboxes and progress bar.

## Build Rules
1. NEVER modify reference/fuso-hmi-reference.html
2. Build ONE chapter at a time, in order
3. Every chapter MUST include: ≥3 quiz widgets, ≥1 mnemonic SVG, ≥1 Recall Check (after Ch01), exercises at 3 difficulty tiers, "Mark as Complete ✅" button
4. Update PROGRESS.md after each chapter

## Pedagogical Non-Negotiables
- NO concept without a concrete example
- NO character without a visual mnemonic
- NO grammar rule without a Korean parallel AND interactive exercise
- NO chapter ends without retrieval practice quiz
- NO chapter (after Ch01) starts without Recall Check
- Every comparison table followed by elaborative interrogation prompt

## Font: Noto Sans JP + Noto Sans KR. <meta charset="UTF-8">. Verify CJK rendering.
```

## Step 2: PROGRESS.md

```markdown
# Build Progress Tracker

## Infrastructure
- [ ] CSS extracted | - [ ] Theme toggle | - [ ] Sidebar + checkboxes | - [ ] Progress bar
- [ ] Quiz engine | - [ ] Fonts | - [ ] CJK rendering | - [ ] Landing page

## Chapters
| Ch | Title | Status | Quizzes | Mnemonics | Recall | QA | Pedagogy |
|----|-------|--------|---------|-----------|--------|-----|----------|
| 01 | Korean Advantage | ⬜ | ⬜ | ⬜ | N/A | ⬜ | ⬜ |
| 02 | Hiragana | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 03 | Katakana | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 04 | Pronunciation | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 05 | Survival Japanese | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 06 | Particles | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 07 | Verb Conjugation | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 08 | Daily Conversations | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 09 | Sentence Patterns | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 10 | Kanji | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 11 | Sino-Vocabulary | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 12 | Native Vocabulary | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 13 | Honorifics | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 14 | Reading | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 15 | Writing | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 16 | Listening | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 17 | Cultural Pragmatics | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 18 | JLPT and Beyond | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## Appendices
- [ ] Glossary | - [ ] Cognate Ref (500+) | - [ ] Sound Cheat Sheet | - [ ] False Friends (50+)
```

## Execution Sequence
**Infrastructure:** Quiz engine → CSS/JS from FUSO → index.html with checklist + progress bar → sidebar with checkboxes → fonts → CJK rendering.
**Content:** Chapters 01-18 in order. Per chapter: spec → draft → mnemonic SVGs → quiz widgets → ch-XX.html → QA → PROGRESS.md.
**Appendices → Final QA.**

---

# THE CORE THESIS

**The Korean speaker's unfair advantage is MASSIVE — but almost every Japanese textbook ignores it.**

Standard textbooks (Genki, Minna no Nihongo) are designed for English speakers. They waste weeks explaining SOV order, particles, topic vs. subject, verb-final sentences, honorifics, subject omission. A Korean speaker already knows ALL of this.

This document exploits the transfer ruthlessly AND gets you using Japanese in real situations as fast as possible. By Chapter 05, you're ordering food, buying things, and navigating a Japanese city. Grammar theory comes AFTER you've tasted practical success.

**What does NOT transfer (where to invest time):**
1. **Writing system** (★★★★): Three scripts. Hiragana/katakana = days. Kanji = long game.
2. **Pronunciation** (★★): Simpler than Korean, but pitch accent is new.
3. **Vocabulary** (★★★★★): Core everyday words (和語) are completely different. Biggest investment.
4. **Verb conjugation forms** (★★★): Same system, different endings.
5. **Cultural pragmatics** (★★): Similar spirit, different execution.

---

# CHAPTER-BY-CHAPTER SPECIFICATIONS

---

## Chapter 01: Your Korean Advantage — What Transfers and What Doesn't

**Purpose:** Map what the reader already knows and what they need to learn. Set expectations and motivation.

**Grammar transfer map:**

| Concept | Korean | Japanese | Transfer |
|---------|--------|----------|---------|
| Word order (SOV) | 나는 사과를 먹는다 | 私はりんごを食べる | 100% |
| Topic marker | 은/는 | は (wa) | 100% |
| Subject marker | 이/가 | が (ga) | 100% |
| Object marker | 을/를 | を (wo) | 100% |
| Location (static) | 에 | に (ni) | ~90% |
| Location (action) | 에서 | で (de) | ~90% |
| Direction | 으로/로 | へ (e) | ~85% |
| Possessive | 의 | の (no) | 100% |
| Verb-final | Always | Always | 100% |
| Pro-drop | Constant | Constant | 100% |
| Agglutinative conjugation | 먹다→먹습니다 | 食べる→食べます | System ✓, forms different |
| Honorifics | 존댓말/반말 | 敬語 (keigo) | Concept 100%, specifics ~60% |
| Sino-vocabulary | 한자어 (학생, 경제) | 漢語 (学生, 経済) | ~40-60% cognate |
| Demonstratives | 이것/그것/저것 | これ/それ/あれ | 100% |
| Counters | 개, 명, 마리 | 個, 人, 匹 | System ✓, specifics differ |

**Doesn't transfer (with difficulty ratings):**
- Writing system (★★★★), Pronunciation (★★), Core vocabulary (★★★★★), Adjective system (★★), Copula (★★), Native numbers (★★)

**Timeline:** "Starting from ~40%. English speakers: ~2,200 hours. You: ~800-1,000."

**Diagram (SVG):** Transfer Map — overlapping circles.

**Interactive Exercise (Type 5):** Korean sentence → predict Japanese structure → reveal 1:1 particle alignment.

**Elaborative Interrogation:** "WHY similar grammar but different vocabulary?"

---

## Chapter 02: Hiragana — Your First Script (ひらがな)

**Purpose:** All 46 basic hiragana + dakuten + yōon. Target: 3-7 days.

**CRITICAL: Every character gets a visual mnemonic SVG + story + Korean approximation + stroke order + practice word.**

**Vowel row standard (apply to all 46):**
- あ(a): SVG: "A" in cross-strokes. Korean: 아. Story: "A acrobat flipping."
- い(i): SVG: two eels. Korean: 이. Story: "Two eels = ee."
- う(u): SVG: winding path. Korean: 우 BUT UNROUNDED.
- え(e): SVG: energetic person. Korean: 에.
- お(o): SVG: person saying "oh!" Korean: 오. Warning: don't mix with あ.

**🧪 Timed Sprint after vowels.** Continue all rows with full mnemonics. See v3 spec for complete mnemonic list per row.

**Dakuten/Handakuten:** Mnemonic: ゛= "speaking up." ゜= "POP! p-sound."
**Yōon:** Grid + Korean compound vowel parallel.
**Long vowels:** おばさん vs おばあさん. Mnemonic: "Longer vowel = older person."

**🧪 Quizzes:** Drag-and-Drop, Fill-in-the-Blank (type hiragana), Audio Discrimination (long/short), Boss Level Timed Sprint (90 sec).

---

## Chapter 03: Katakana — The Foreign Word Script (カタカナ)

**Purpose:** All 46 katakana. Same sounds, different shapes. For loanwords.

**Each character:** hiragana pair + visual mnemonic SVG + loanword example.
**Loanword Bridge:** ~50 Korean↔Japanese cognate loanwords.

**🧪 Flashcard, "Read the Menu" fill-in, Recall Check (Ch02 hiragana).**

---

## Chapter 04: Pronunciation — Where Korean Habits Help and Hurt

**Purpose:** Japanese phonetics from the Korean speaker's perspective.

**What's EASIER:** Fewer consonants, simpler syllables, no 받침. "You're downshifting."

**Six Traps:** Over-aspiration (★★★), Rounded う (★★), Long vowels (★★★★), つ (★★), ふ (★), Pitch accent (★★★★★).

Each trap: problem, what it sounds like, fix, mnemonic, practice exercise.

**Diagrams (SVG):** Consonant mapping (3-way→2-way), Pitch accent contour patterns.
**🧪 Discrimination quiz, Recall Check (Ch02-03).**

---

## Chapter 05: Survival Japanese — Restaurants, Shopping, and Getting Around

**Purpose:** Immediately usable Japanese for real daily situations. The reader can now read kana and pronounce correctly — this chapter puts those skills to work. No grammar theory yet. Just learn complete phrases as functional units, with Korean parallels showing why they make structural sense.

**Design philosophy:** "You don't need to understand WHY a sentence works to USE it. You say 'すみません' (sumimasen) the same way you started saying '실례합니다' as a child — you learn the whole phrase, use it, and the grammar understanding comes later. This chapter gives you 100+ phrases you can use TODAY."

**CRITICAL: Every phrase in this chapter must include:**
1. The Japanese (kana + kanji where standard)
2. Romaji (still in romaji-included chapters)
3. Literal word-by-word breakdown
4. The Korean equivalent phrase
5. A mnemonic for the Japanese phrase where useful
6. Context note: when/where to use it

---

### Section 5A: Restaurant Japanese (レストラン)

**The complete restaurant flow — from walking in to paying the bill:**

**Entering:**

| Situation | Japanese | Romaji | Korean Equivalent | Mnemonic |
|-----------|----------|--------|------------------|----------|
| Getting attention | すみません | sumimasen | 저기요 / 실례합니다 | "Sue me, Ma'am, SEN(d) help" |
| "Table for 2" | 二人です | futari desu | 두 명이요 | "Who's the TALL-ree? Two of us" |
| "Do you have a table?" | 席はありますか？ | seki wa arimasu ka? | 자리 있어요? | "SEEK-ee a seat — is there one?" |
| "Non-smoking, please" | 禁煙でお願いします | kin'en de onegai shimasu | 금연으로 부탁합니다 | Korean 금연 = 禁煙 — COGNATE! |

**Ordering:**

| Situation | Japanese | Romaji | Korean Equivalent | Mnemonic |
|-----------|----------|--------|------------------|----------|
| "This one, please" | これをお願いします | kore wo onegai shimasu | 이거 주세요 | "KORE = 이거 (this). Oh-NEG-eye = please" |
| "What do you recommend?" | おすすめは何ですか？ | osusume wa nan desu ka? | 추천 메뉴가 뭐예요? | "Oh SUSU-may = recommend" |
| "I'll have this" | これにします | kore ni shimasu | 이걸로 할게요 | "KORE NI = 이것으로 (this one, decided)" |
| "Water, please" | お水をお願いします | omizu wo onegai shimasu | 물 주세요 | "Oh-MIZU = water. MIZU sounds like 미즈 — remember it" |
| "One more beer" | ビールもう一杯 | biiru mou ippai | 맥주 한 잔 더 | "BEER + MOH-EE-PIE (one more cup)" |
| "Without [X], please" | [X]抜きでお願いします | [X] nuki de onegai shimasu | [X] 빼고 주세요 | "NUKE it — take it out!" |
| "Is this spicy?" | これは辛いですか？ | kore wa karai desu ka? | 이거 매워요? | "KARA-ee = 辛い. Not Korean 가라 — false friend!" |
| "Delicious!" | 美味しい！ | oishii! | 맛있다! | "Oh-ISH-ee! She made it delicious!" |
| "I'm allergic to [X]" | [X]アレルギーがあります | [X] arerugi ga arimasu | [X] 알레르기가 있어요 | Korean 알레르기 = アレルギー — COGNATE! |

**Paying:**

| Situation | Japanese | Romaji | Korean Equivalent | Mnemonic |
|-----------|----------|--------|------------------|----------|
| "Check, please" | お会計お願いします | okaikei onegai shimasu | 계산해 주세요 | "Oh-KAI-KAY = 회계 (accounting) — COGNATE!" |
| "Can I pay by card?" | カードで払えますか？ | kaado de haraemasu ka? | 카드로 계산돼요? | "CARD + HARA-eh = pay" |
| "Together / Separate" | 一緒に / 別々に | issho ni / betsubetsu ni | 같이 / 따로따로 | "ISSHO = together. BETSU-BETSU = split-split" |
| "Thank you (after meal)" | ごちそうさまでした | gochisousama deshita | 잘 먹었습니다 | "Go-CHEE-SO-SAH-MAH — like bowing after a feast" |

**🧪 Mini-Quiz 1 (Type 2: Drag-and-Drop):** Match situations to Japanese phrases. "You want the check" → お会計お願いします.

**🧪 Mini-Quiz 2 (Type 5: Sentence Builder):** Build restaurant orders. Given: これ, を, お願いします → これをお願いします.

---

### Section 5B: Shopping Japanese (買い物)

| Situation | Japanese | Romaji | Korean Equivalent | Mnemonic |
|-----------|----------|--------|------------------|----------|
| "How much?" | いくらですか？ | ikura desu ka? | 얼마예요? | "EE-KOO-RAH — sounds like 'it'll CURE ya' to know the price" |
| "I'm just looking" | 見ているだけです | mite iru dake desu | 그냥 구경하고 있어요 | "ME-tay (seeing) + DAKE (only)" |
| "Do you have a bigger size?" | もっと大きいサイズはありますか？ | motto ookii saizu wa arimasu ka? | 더 큰 사이즈 있어요? | "MOTTO = more. OOKII = big" |
| "I'll take this" | これをください | kore wo kudasai | 이거 주세요 | "KORE + KUDA-SIGH (please give)" |
| "Can I try it on?" | 試着できますか？ | shichaku dekimasu ka? | 시착할 수 있어요? | "시착/試着 — COGNATE! Exact same word!" |
| "Too expensive" | ちょっと高いですね | chotto takai desu ne | 좀 비싸네요 | "CHOTTO = 좀 (a little). TAKAI = expensive" |
| "Tax-free?" | 免税ですか？ | menzei desu ka? | 면세예요? | "면세/免税 — COGNATE! Same word!" |
| "Bag, please" | 袋をお願いします | fukuro wo onegai shimasu | 봉투 주세요 | "FUKU-ROH = bag (not a cognate — memorize)" |

---

### Section 5C: Getting Around (道案内)

| Situation | Japanese | Romaji | Korean Equivalent | Mnemonic |
|-----------|----------|--------|------------------|----------|
| "Where is [X]?" | [X]はどこですか？ | [X] wa doko desu ka? | [X]는 어디예요? | "DOKO = where (DOCKs — where do I DOCK?)" |
| "Excuse me, the station?" | すみません、駅はどこですか？ | sumimasen, eki wa doko desu ka? | 실례합니다, 역이 어디예요? | "역/駅 = EKI — COGNATE!" |
| "Straight ahead" | まっすぐ | massugu | 직진 | "MASS-SUU-GOO — go straight like a MASS of people" |
| "Turn right/left" | 右/左に曲がってください | migi/hidari ni magatte kudasai | 오른쪽/왼쪽으로 가세요 | "ME-GEE = right. HE-DAH-REE = left" |
| "How far is it?" | どのくらいかかりますか？ | dono kurai kakarimasu ka? | 얼마나 걸려요? | "DONO KURAI = how much (time/distance)" |
| "I'm lost" | 道に迷いました | michi ni mayoimashita | 길을 잃었어요 | "ME-CHEE NI MAYO — I'm in a MAZE on the MICHI (road)" |
| "[X] Station, please" (taxi) | [X]駅までお願いします | [X] eki made onegai shimasu | [X]역까지 가주세요 | "EKI MADE = 역까지 (station until)" |
| "Stop here, please" | ここで止めてください | koko de tomete kudasai | 여기서 세워주세요 | "KOKO DE = here-at. TOMETE = stop" |

**Direction words with mnemonics:**

| Japanese | Reading | Meaning | Mnemonic |
|----------|---------|---------|----------|
| 右 | migi | right | "ME-GEE — your right hand makes a GEE shape" |
| 左 | hidari | left | "HE-DAH-REE — HE DAREs to go left" |
| まっすぐ | massugu | straight | "MASS of people going straight" |
| 近い | chikai | near/close | "CHEE-KAI — it's close, cheek-to-cheek" |
| 遠い | tooi | far | "TOO-EE — it's TOO far!" |
| 上 | ue | up/above | "OO-EH — going up makes you go 'WHOA'" |
| 下 | shita | down/below | "SHEE-TAH — sit your SEAT-AH down below" |
| 中 | naka | inside | "NAH-KAH — you're in the NOOK-AH" |

---

### Section 5D: Transportation (交通)

| Situation | Japanese | Romaji | Korean Equivalent | Mnemonic |
|-----------|----------|--------|------------------|----------|
| "One ticket to [X]" | [X]まで一枚 | [X] made ichimai | [X]까지 한 장 | "MADE = 까지 (until). ICHI-MAI = one flat thing" |
| "Which platform?" | 何番ホームですか？ | nanban hoomu desu ka? | 몇 번 홈이에요? | "NAN-BAN = what number. HOOMU = home/platform" |
| "Does this go to [X]?" | これは[X]に行きますか？ | kore wa [X] ni ikimasu ka? | 이거 [X]에 가요? | Direct Korean structure mapping |
| "Last train" | 終電 | shuuden | 막차 | "SHUU-DEN = 종전(終電) — COGNATE-ish!" |
| "Transfer" | 乗り換え | norikae | 환승 | "NORI-KAE = ride-change" |

---

### Section 5E: Essential Polite Phrases (基本フレーズ)

| Situation | Japanese | Romaji | Korean Equivalent | Mnemonic |
|-----------|----------|--------|------------------|----------|
| Thank you | ありがとうございます | arigatou gozaimasu | 감사합니다 | "Ah-REE-GAH-TOE — you're GRATEFUL" |
| Thank you (casual) | ありがとう | arigatou | 고마워 | Shorter = more casual, same as Korean |
| Sorry / Excuse me | すみません | sumimasen | 죄송합니다/실례합니다 | "Sue me, Ma'am, SEN" |
| Sorry (casual) | ごめん(なさい) | gomen (nasai) | 미안(해) | "GO-MEN — I'll GO apologize, MEN" |
| Yes | はい | hai | 네 | "HIGH = yes" |
| No | いいえ | iie | 아니요 | "EE-EH — it's NOT" |
| I don't understand | わかりません | wakarimasen | 모르겠어요 | "WALK-A-RE-MASEN — I can't WALK through this" |
| Please say it again | もう一度お願いします | mou ichido onegai shimasu | 한 번 더 말씀해주세요 | "MOH ICHI-DOH = one more time" |
| Do you speak English? | 英語を話せますか？ | eigo wo hanasemasu ka? | 영어 하세요? | "영어/英語 = EIGO — COGNATE!" |
| I speak a little Japanese | 日本語が少し話せます | nihongo ga sukoshi hanasemasu | 일본어 조금 해요 | "SUKOSHI = a little. SU-KO-SHE, 'so cozy' amount" |
| It's okay / No problem | 大丈夫です | daijoubu desu | 괜찮아요 | "DIE-JOE-BOO — ⚠️ FALSE FRIEND with Korean 대장부!" |
| Please (requesting) | お願いします | onegai shimasu | 부탁합니다 | "Oh-NEG-EYE — I'm begging, NEGATING my pride" |
| Goodbye | さようなら | sayounara | 안녕히 가세요 | "SAY-YOU-NAH-RAH — formal. Use じゃあね for casual" |
| Goodbye (casual) | じゃあね | jaa ne | 잘 가 / 바이 | "JAH-NEH — see ya!" |
| Good morning | おはようございます | ohayou gozaimasu | 안녕하세요 (아침) | "Oh-HI-YO — 'Oh hi yo!' in the morning" |
| Hello (daytime) | こんにちは | konnichiwa | 안녕하세요 (낮) | "KON-NICHI-WA — 'today' greeting" |
| Good evening | こんばんは | konbanwa | 안녕하세요 (저녁) | "KON-BAN-WA — 'this evening' greeting" |
| Goodnight | おやすみなさい | oyasumi nasai | 안녕히 주무세요 | "Oh-YAH-SOO-ME — 'oh yes, ZOOM into sleep'" |

---

### Section 5F: Emergency and Help Phrases

| Situation | Japanese | Korean Equivalent |
|-----------|---------|------------------|
| Help! | 助けて！(tasukete!) | 도와주세요! |
| Call an ambulance | 救急車を呼んでください (kyuukyuusha wo yonde kudasai) | 구급차 불러주세요 — 구급차/救急車 COGNATE! |
| Where is the hospital? | 病院はどこですか？(byouin wa doko desu ka?) | 병원이 어디예요? — 병원/病院 COGNATE! |
| I'm sick | 気分が悪いです (kibun ga warui desu) | 기분이 안 좋아요 — 기분/気分 COGNATE! |
| I lost my passport | パスポートをなくしました (pasupooto wo nakushimashita) | 여권을 잃어버렸어요 |

---

### Section 5G: Numbers and Counting for Daily Use

**Two number systems:** Sino-Japanese (いち, に, さん...) and Native Japanese (ひとつ, ふたつ...). For daily survival, focus on Sino-Japanese:

| Number | Japanese | Korean 한자 reading | Same? |
|--------|---------|-------------------|-------|
| 1 | いち (ichi) | 일 (il) | Different sound, same kanji 一 |
| 2 | に (ni) | 이 (i) | Different |
| 3 | さん (san) | 삼 (sam) | ★★★ Close! |
| 4 | よん/し (yon/shi) | 사 (sa) | し/사 ★★★★ Close! |
| 5 | ご (go) | 오 (o) | Different |
| 6 | ろく (roku) | 육 (yuk) | Different |
| 7 | なな/しち (nana/shichi) | 칠 (chil) | しち/칠 ★★★ Close! |
| 8 | はち (hachi) | 팔 (pal) | Different |
| 9 | きゅう/く (kyuu/ku) | 구 (gu) | く/구 ★★★★ Close! |
| 10 | じゅう (juu) | 십 (sip) | Different |
| 100 | ひゃく (hyaku) | 백 (baek) | ★★★ Related |
| 1000 | せん (sen) | 천 (cheon) | ★★★ Related |

**Practical number use:**
- Prices: ３８０円 = さんびゃくはちじゅうえん (380 yen)
- Time: ３時１５分 = さんじじゅうごふん (3:15)
- Counting people at a restaurant: 一人 (hitori), 二人 (futari), 三人 (sannin)...

**🧪 Quiz (Type 3):** "You see a price tag: ¥1,250. Say it in Japanese." → せんにひゃくごじゅうえん

---

**🧪 Comprehensive Chapter Quiz — "Tokyo Day Simulation" (Type 3 + Type 5, interleaved):**
Walk the reader through a full day in Tokyo using the phrases they just learned:
1. Morning: Greet the hotel staff → おはようございます
2. Breakfast: Order at a café → コーヒーとパンをお願いします
3. Navigate: Ask where Shibuya station is → すみません、渋谷駅はどこですか？
4. Shopping: Ask the price → いくらですか？ / Buy something → これをください
5. Lunch: Order at an izakaya → おすすめは何ですか？ / これにします
6. Afternoon: Take a taxi → [X]までお願いします / ここで止めてください
7. Dinner: Full restaurant flow → entering → ordering → 美味しい！→ お会計お願いします → ごちそうさまでした
8. Night: Say goodnight → おやすみなさい

This simulation quiz is the most important exercise in the chapter. It proves the reader can survive a real day in Japan.

**🧪 Recall Check (Ch02-04):** 5 hiragana/katakana recognition + 2 pronunciation tasks.

---

## Chapter 06: Particles — The 1:1 Map (助詞/조사)

**Purpose:** Now that the reader has used particles in Ch05 phrases without thinking about it, this chapter explains WHY those phrases work.

"In Chapter 05, you said これをお願いします — 'this-を, please.' You said 駅はどこですか — 'station-は, where?' You were already using particles. Now let's understand what they are and how perfectly they map to Korean."

**Core map with mnemonics:**

| Function | Korean | Japanese | Mnemonic |
|----------|--------|----------|----------|
| Topic | 은/는 | は (wa) | "'HA!' — THIS is the topic!" |
| Subject | 이/가 | が (ga) | "が GRABS the subject" |
| Object | 을/를 | を (wo) | "を WRAPS the object" |
| Location (exist) | 에 | に (ni) | "に NEEDLES into a point" |
| Location (action) | 에서 | で (de) | "で = DOING particle" |
| Direction | 으로/로 | へ (e) | "へ = hill going toward" |
| Possessive | 의 | の (no) | "の spirals connecting" |
| From | 에서 | から (kara) | "から CUTS away" |
| Until | 까지 | まで (made) | "MAkes the DEadline" |
| Also | 도 | も (mo) | "MOre — me too!" |
| And | 와/과 | と (to) | "と TIES together" |

**Retroactive understanding exercise:** "Go back to Ch05 phrases and identify every particle. You'll find you already used は, を, に, で, まで, and か correctly without knowing the rules."

**Confusion Zones:** に covers 에+에게+한테. で covers 에서+으로. から covers 에서+부터.

**🧪 Quizzes:** Drag-and-Drop matching, Sentence Builder, Boss Level fill-in-the-blank with Korean hints.
**🧪 Recall Check (Ch05):** 5 survival phrase recall tasks.

---

## Chapter 07: Verb Conjugation — Same System, Different Clothes (動詞/동사)

**Purpose:** Same system, different forms.

**Analogy:** "You know how to drive. Now the controls are rearranged."

**Anchor verb 食べる:** Full conjugation table mapped to Korean 먹다.

**Verb groups:** Group 2 (ichidan: "one step"), Group 1 (godan: "five steps"), Group 3 (just する and 来る).

**Te-form mnemonics:** U-TSU-RU→って, M-B-N→んで, K→いて, G→いで, S→して.

**Adjective system:** い-adj and な-adj. Mnemonic: "い-adj HAVE the い. な-adj NEED な."

**Practical focus:** Immediately apply conjugations to Ch05 survival phrases. "In Ch05 you said 止めてください (stop please). Now you know WHY: 止める→止めて (te-form) + ください (please give)."

**🧪 Conjugation fill-ins, dictionary→te-form matching, sentence building.
**🧪 Recall Check (Ch05-06):** 3 survival phrases + 2 particle tasks.

---

## Chapter 08: Daily Conversations — Phrases That Get You Through the Day

**Purpose:** Extend Ch05 survival phrases into full conversational patterns. Now that Ch06-07 gave grammar foundations, this chapter teaches LONGER interactions — self-introductions, small talk, making plans, expressing opinions, apologies.

**Key sections:**

### Self-Introduction (自己紹介)
Full scripted intro with Korean parallel:
- 初めまして。[Name]と申します。韓国から来ました。[Occupation]をしています。日本語を勉強しています。どうぞよろしくお願いします。
- 처음 뵙겠습니다. [Name]라고 합니다. 한국에서 왔습니다. [직업]을 하고 있습니다. 일본어를 공부하고 있습니다. 잘 부탁드립니다.

### Small Talk Patterns
- Weather: 今日は暑いですね (It's hot today, isn't it) ↔ 오늘 덥네요
- Compliments: 日本語がお上手ですね ↔ 일본어 잘하시네요
- Hobbies: 趣味は何ですか？↔ 취미가 뭐예요?

### Making Plans
- "Are you free Saturday?" → 土曜日、暇ですか？↔ 토요일 시간 있어요?
- "Let's go together" → 一緒に行きましょう ↔ 같이 가요
- "What time?" → 何時にしましょうか？↔ 몇 시로 할까요?

### Expressing Opinions
- "I think..." → 〜と思います ↔ 〜라고 생각해요
- "I like / don't like" → 好きです / 好きじゃないです ↔ 좋아해요 / 안 좋아해요

### Apologies and Requests
- Levels of sorry mapped to Korean: ごめん(미안)→ごめんなさい(미안해요)→すみません(죄송해요)→申し訳ございません(대단히 죄송합니다)

### Filler Words (what makes you sound natural)
- 음/그... → えーと/あの
- 그래서 → だから/それで
- 근데 → でも/けど
- 그리고 → それから/あと
- 진짜? → 本当に？(ほんとうに？)/ マジで？

**🧪 Quizzes:** Sentence production for each situation type. Role-play simulation (quiz walks through a conversation).
**🧪 Recall Check (Ch05-07):** Mixed survival + particles + conjugation.

---

## Chapter 09: Sentence Patterns — Thinking in Japanese (文型/문형)

**Purpose:** Structural patterns with Korean parallels. The reader has been USING patterns in Ch05 and Ch08 — now formalize them.

**Pattern 1: Existence — いる/ある**
Mnemonic: "いる = eel (alive). ある = R for Rocks (dead)."
Tricky: Robots→ある. Plants→ある. Ghosts→いる!

**Pattern 2: Desire — -たい**
먹고 싶다 → 食べたい. Mnemonic: "たい = tie — TIED to desire."

**Pattern 3: Giving/receiving — あげる/もらう/くれる (HARDEST)**
Mnemonic: "River. あげる = away. くれる = toward you. もらう = bucket receiving."
⚠️ "ONE grammar point where Korean = zero advantage."

**Pattern 4: Relative clauses** — [어제 내가 읽은] 책 = [昨日私が読んだ] 本. "Free."

**Pattern 5: Reported speech** — -라고 → と. Same structure.

**🧪 Mixed quiz (all patterns interleaved). Recall Check (Ch06-08).**

---

## Chapter 10: Kanji — The Long Game (漢字/한자)

**Purpose:** Kanji strategy leveraging hanja. Delayed to Ch10 because the reader has been functioning with kana through Ch05-09 and is now motivated to read faster.

**Three-layer advantage:** Conceptual, Recognition, Reading (on'yomi cognate with Korean 음독).

**Cognate accelerator:** 100+ entries by domain.

**Sound Correspondence Rules (5+ examples each):** ㅎ→k, ㅂ→h, ㅈ→s, ㅁ→m, ㄴ→n, ㄹ→r.

**🧪 "Predict the Reading":** Korean hanja → predict Japanese on'yomi → reveal.

**Radicals (30 most useful)** with mnemonics.

**Practical connection:** "Remember 駅 (eki, station) from Ch05? That's 역 in Korean. 禁煙 (kin'en) = 금연. 病院 (byouin) = 병원. You've already been seeing kanji cognates — now you'll learn to systematically exploit them."

**🧪 Recall Check (Ch05-08):** Mixed survival + grammar tasks.

---

## Chapter 11: Sino-Vocabulary Turbocharger (漢語/한자어)

**Purpose:** Exploit the 40-60% overlap. 

**Expanded sound rules, domain-specific cognate lists (50-100 per domain), false friends (30+).**

**🧪 "Predict and Verify" (20 words), False Friends Quiz.**
**🧪 Recall Check (Ch10):** Kanji + sound rules.

---

## Chapter 12: Native Japanese Vocabulary — Words Korean Can't Help With (和語)

**Purpose:** Core everyday vocabulary. Every word gets a keyword mnemonic. 200+ words.

**Connection to Ch05:** "In Ch05, you learned 水 (mizu, water) and 美味しい (oishii, delicious) as survival phrases. Now let's systematically build your wago vocabulary across all categories."

| Japanese | Reading | Meaning | Mnemonic |
|----------|---------|---------|----------|
| 食べる | taberu | eat | "Eat at a TABLE" |
| 飲む | nomu | drink | "NOM-NOM" |
| 見る | miru | see | "MIRROR" |
| 聞く | kiku | hear | "KICK drum" |
| 買う | kau | buy | "Buy a COW" |
| 美味しい | oishii | delicious | "Oh SHE made it delicious!" |

**Onomatopoeia (~40):** ドキドキ, キラキラ, ペラペラ, ゴロゴロ — each with mnemonic.

**🧪 Flashcard, Timed Sprint, Interleaved quiz (wago + kanji + particles).**

---

## Chapter 13: Honorifics and Politeness — Mapping 존댓말 to 敬語

**Purpose:** Keigo for someone who already navigates Korean honorifics.

**Practical framing:** "In Ch05, you used ください and お願いします without knowing these are keigo. In Ch08, you used 申します in your self-introduction. You've been using honorifics — now let's understand the full system."

**Structural comparison (teineigo/sonkeigo/kenjōgo mapped to Korean).**
**Special verb pairs with Korean equivalents.**
**Scenario-based practice.**

**🧪 Scenario quizzes. Recall Check (Ch08-12).**

---

## Chapter 14: Reading Real Japanese — Newspapers, Manga, and the Web

**Purpose:** Mixed-script reading. Color-coded demo sentence. Strategies by media type. Korean "meaning-first" strategy. Tools.

**🧪 NHK Easy News paragraph exercise. Recall Check (Ch10-12).**

---

## Chapter 15: Writing — From Texts to Business Emails

**Purpose:** Writing across registers.

**Practical focus:** Build from the daily conversation patterns (Ch08) into written forms. Casual: LINE/Twitter, ㅋㅋㅋ→www. Formal: email structure, set phrases.

**Full worked business email with Korean parallel.**

---

## Chapter 16: Listening — Training Your Ear

**Purpose:** Speed, contractions, pitch accent, dropped particles.

**Methodology:** extensive → intensive → shadowing. Resources by level. Korean listener's structural prediction advantage.

---

## Chapter 17: Cultural Pragmatics — What the Textbook Won't Teach You

**Purpose:** Unwritten rules.

**Practical framing:** "In Ch05, you learned to say ごちそうさまでした after a meal. But WHY? What happens if you don't? This chapter explains the cultural logic beneath the phrases."

空気を読む↔눈치, 本音と建前↔겉과 속, 迷惑, business culture, regional variation.

---

## Chapter 18: JLPT and Beyond — The Path to True Fluency

**Purpose:** Test prep + lifelong learning combined.

**JLPT structure + Korean advantage map. N3 plan (6-9 months). N2 plan (12-18 months). Study schedule.**
**Immersion environment. Kanji long game. Speaking maintenance.**

**Closing quote:** "한국어를 아는 당신은 일본어를 배울 때 가장 유리한 위치에 있습니다. 영어 화자가 2,200시간이 걸리는 것을, 당신은 절반도 안 되는 시간에 해낼 수 있습니다. 이미 절반은 알고 있으니까요."

---

# DOCUMENT-WIDE REQUIREMENTS

## Language Display Convention
- Chapters 01-09: kanji/kana + (romaji) + Korean equivalent
- Chapters 10-18: drop romaji

## Interactive Exercise Minimums

| Chapter Type | Min Quizzes | Min Mnemonics | Recall Check | Tiers |
|-------------|------------|--------------|-------------|-------|
| Script (02,03) | 5+ (incl sprint) | Every character | From prev ch | Warm-Up, Challenge, Boss |
| Survival/Conversation (05,08) | 5+ (incl simulation) | Key phrases | 2-3 ch ago | Warm-Up, Challenge, Boss |
| Grammar (06,07,09) | 4+ (incl builder) | Key rules | 2-3 ch ago | Warm-Up, Challenge, Boss |
| Vocabulary (11,12) | 4+ (incl flashcard+sprint) | Every word | 2-3 ch ago | Warm-Up, Challenge, Boss |
| Depth (13-17) | 3+ | Key concepts | All prior | Challenge, Boss |
| Capstone (18) | 2+ | — | Comprehensive | Challenge, Boss |

## Chapter Completion System
- "Mark as Complete ✅" button at bottom of each chapter
- Sidebar: 18 chapters with checkboxes, ✅ + green accent on complete
- Landing page: full checklist + progress bar ("X/18 complete")
- Persistence: `window.storage` API

## Design System Adaptation
- Hero: torii gate or ink brush stroke SVG
- Badge: "Zero to Hero — 日本語 for Korean Speakers"
- Title: "From 한국어 to 日本語 — The Bridge Builder's Guide"
- Subtitle: "Not a standard textbook — a systematic exploitation of everything you already know."
- Sidebar: flat list of 18 chapters with checkboxes
- Font: Noto Sans JP + Noto Sans KR
- `<meta charset="UTF-8">` + CJK verification

## Appendices

### Glossary
Scripts, Grammar (Korean equiv.), Vocabulary Domains, Cultural Concepts, JLPT Levels.

### Cognate Reference
500+ Korean→Japanese Sino-vocabulary. Each: kanji, Korean reading, Japanese reading, meaning, similarity ★-★★★★★.

### Sound Correspondence Cheat Sheet
One-page reference. Full rules, 5+ examples each.

### False Friends
50+ 同形異義語. Each: kanji, Korean meaning, Japanese meaning, danger level, example sentence.

## Estimated Scale
- 18 chapters + 4 appendices = 22 sections
- Each chapter: 3,000-6,000 words + tables + mnemonics + quizzes
- Total: ~80,000-100,000 words
- Quiz widgets: ~100+
- Mnemonic SVGs: ~150+
