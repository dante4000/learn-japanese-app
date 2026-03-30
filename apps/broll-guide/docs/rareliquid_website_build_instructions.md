# Build Instructions: rareliquid B-Roll Guidelines Website

## What You Are Building

A single-page internal reference website for rareliquid's B-roll research team. These people receive a video script and need to find all the video clips, still images, and flag where custom visuals are needed. The site tells them exactly how much to find, what types of assets exist, how to annotate them, and what mistakes to avoid.

---

## The Problem This Solves

Every production has required a second round of sourcing because the first pass came back 40-50% short. The editor's perspective: "I need a massive pile of accurate, relevant B-roll and images to cut with. Give me too much and I'll pick the best. Give me too little and the whole timeline stalls."

The site should make the sheer volume required impossible to ignore.

---

## Tech Stack

- **Single static HTML file** — this will be hosted on GitHub Pages. No build step, no React, no bundler. One `index.html` file with inline CSS (Tailwind CDN is fine) and minimal inline JS for the collapsible appendix.
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Dark theme: navy `#1B2A4A` backgrounds, white/light gray text
- Red `#C0392B` for warnings and mistakes
- Green `#27AE60` for correct examples
- Clean sans-serif font (Inter via Google Fonts CDN, or system-ui fallback)
- Responsive (desktop + tablet)
- Keep total file size under 50KB — no images, no external dependencies beyond CDN links

---

## Exact Site Structure

Build exactly these 4 sections as one scrollable page with a sticky nav bar at the top showing: `75-90 B-roll | 55-70 images | 1-3 custom visuals | 0 gaps allowed`

---

### SECTION 1: "The Numbers" (Hero Section — 40% of visual weight)

This is the most important part of the entire site. Make it huge, bold, and impossible to scroll past without absorbing the numbers.

#### Build a row of 4 large stat cards:

**Card 1** — Large number "75–90" with label "Unique B-Roll Video Clips" and subtext "YouTube interviews, news coverage, documentaries"

**Card 2** — Large number "55–70" with label "Unique Still Images" and subtext "Article screenshots, photos, documents, charts"

**Card 3** — Large number "1–3" with label "Custom Visual HTML Files" and subtext "Timelines, data charts — very rare"

**Card 4** — Large number "~148" with label "Total Unique Visual Assets" and subtext "For a 15-minute video" — style this card differently (accent border or highlight) since it's the sum

#### Below the cards, add this exact text in a callout box:

> "These are real numbers from our published videos. The JPM doc used 91 B-roll sources and 57 images. The Solomon doc used 74 B-roll sources and 68 images. Hit these targets or go back and find more."

#### Below that, 3 small rule badges:

- "Stock footage: under 10% of total B-roll"
- "Gaps allowed: zero — every script line needs a visual"
- "Reuse OK after hitting unique minimums"

#### Below that, a "Reference Videos" section with two embedded YouTube players side by side:

**Left embed**: JPM Documentary
- YouTube embed URL: `https://www.youtube.com/embed/hQSpro7pNws`
- Label below: "Why J.P. Morgan Always Wins (12:31)"

**Right embed**: Solomon Documentary
- YouTube embed URL: `https://www.youtube.com/embed/SfIjrEJt3SQ`
- Label below: "The Bully Running Goldman Sachs (18:22)"

Below the embeds, one line of text: **"Watch both of these in full before starting any script. These are the benchmark."**

Use standard YouTube iframe embeds:
```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/hQSpro7pNws" frameborder="0" allowfullscreen></iframe>
<iframe width="560" height="315" src="https://www.youtube.com/embed/SfIjrEJt3SQ" frameborder="0" allowfullscreen></iframe>
```

---

### SECTION 2: "What Counts as What" (Asset Type Cards)

4 cards in a grid layout. Two larger cards (B-Roll Video and Still Image are the main types) and two smaller cards (B-Roll with Audio and Custom Visual are rare).

#### Card 1: B-Roll Video (green left border, larger card)

```
WHAT IT IS
Video footage that plays over the host's voiceover. The viewer sees the footage
but hears Ben narrating.

BEST SOURCES
Bloomberg, CNBC, Fox Business interviews. News coverage. Company event footage.
Conference keynotes. Existing documentaries.

RULES
• 3-10 seconds per clip (ideal: 4-7 seconds)
• Must match the era discussed in the script — no 2024 footage for 1986 events
• Always pick the more interesting clip when you have two options
• Stock footage is a last resort (under 10% of total)

HOW TO ANNOTATE
[https://www.youtube.com/watch?v=QZ85VPgCOCM, 0:18 - 0:29]
```

#### Card 2: Still Image (blue left border, larger card)

```
WHAT IT IS
A static image displayed on screen. The editor applies zoom/pan (Ken Burns effect)
to 91-93% of them — that's the default, you don't need to worry about it.

BEST TYPES (in order)
1. News article screenshots with key phrases visible
2. Official documents, SEC filings, court docs
3. Data charts from Bloomberg, WSJ, company filings
4. High-res photographs (headshots, events, buildings)
5. Social media screenshots (only when directly relevant)

RULES
• Minimum 1280x720 resolution
• No watermarks. Crop to relevant content only.
• Name files sequentially: 1.png, 2.png, 3.png
• Upload entire folder to Slack as a batch
• If a phrase needs highlighting, note it in the annotation

HOW TO ANNOTATE
[pic 1]
[pic 7, highlight "specific text to underline"]
[pic 12, zoom]
```

#### Card 3: B-Roll with Audio (yellow left border, smaller card)

```
WHAT IT IS
Same as B-roll, but the ORIGINAL AUDIO plays instead of Ben's voiceover.

HOW RARE
~2% of total video. Only 3-5 uses per 15-minute video.

WHEN TO USE
Only for high-impact moments: a CEO making a key statement,
a news anchor breaking a story, a dramatic quote on camera.

⚠️  Using this everywhere dilutes its power. Save it for moments
    that give the viewer chills.

HOW TO ANNOTATE
[https://www.youtube.com/watch?v=xyz, 4:05 - 4:09, WITH AUDIO]
```

#### Card 4: Custom Visual (purple left border, smaller card)

```
WHAT IT IS
An HTML-generated graphic: career timeline, data chart, comparison table,
financial breakdown. Created with Claude/LLM.

HOW RARE
Only 1-3 per entire video. Do not overuse.

WHEN TO FLAG
Career paths, stock performance comparisons, company merger diagrams,
revenue/profit breakdowns — anything where a clean graphic beats a screenshot.

HOW TO ANNOTATE
[custom visual: Solomon career timeline Irving → Drexel → Bear → Goldman]
[custom visual: Goldman stock vs JPM vs MS since 2018]
```

---

### SECTION 3: "Annotation Cheat Sheet"

A compact, dark-background code-block style section. Make every format copy-pasteable (click to copy if possible).

#### Correct Formats (green border):

```
B-Roll:
[https://www.youtube.com/watch?v=QZ85VPgCOCM, 0:18 - 0:29]

B-Roll with Audio:
[https://www.youtube.com/watch?v=xyz, 4:05 - 4:09, WITH AUDIO]

Still Image:
[pic 1]
[pic 7, highlight "specific text"]
[pic 12, zoom]
[pic 15, pan left-to-right]

Overlay:
[show Goldman Sachs logo when host says "Goldman"]
[arrow pointing to player A labeled "Solomon", player B labeled "Goldman Sachs"]

Alternate Options (let editor choose):
[https://youtube.com/watch?v=abc, 4:05 - 4:09] OR [https://youtube.com/watch?v=xyz, 16:10 - 16:42]

Can't Find Anything:
[NO B-ROLL FOUND - need alternative]
```

#### Wrong Formats (red border, strikethrough text):

```
❌ [Goldman Sachs CEO Interview, 0:18 - 0:29]
   → Use raw URLs, not video titles

❌ [https://youtube.com/watch?v=abc, around the 3 minute mark]
   → Exact timestamps only, no vague references

❌ [https://youtube.com/watch?v=abc]
   → Never omit start and end timestamps
```

---

### SECTION 4: "Don't Do This"

A grid of 6 mistake cards. Red left border on each. Keep each card to exactly 3 lines: the mistake name (bold), why it's wrong (1 sentence), and the fix (1 sentence).

**Card 1: Wrong Era**
Don't use 2024 footage when the script is about 1986.
Search for archival footage or use a period-appropriate still image.

**Card 2: Boring Option**
If you found two clips for the same line, you used the wrong one.
Always pick the more visually interesting option — a strong image beats a weak video.

**Card 3: Not Enough Material**
If you're under 75 B-roll clips and 55 images, you're not done.
Go back and search more before submitting. The editor cannot work with gaps.

**Card 4: Stock Footage**
Generic "people in suits walking" adds zero value.
Search "[person name] interview" or "[person] CNBC" before resorting to stock.

**Card 5: Silent Gaps**
Never silently skip a line that has no visual — the editor won't know it's missing.
Flag it explicitly: `[NO B-ROLL FOUND - need alternative]`

**Card 6: Titles Instead of URLs**
The editor needs to find the exact clip in 5 seconds, not guess which video you mean.
Always use the raw YouTube URL with exact start and end timestamps.

---

---

### SECTION 5: "Resources & Appendix" (Collapsible — Collapsed by Default)

This section holds the detailed reference material. It should NOT take up space on the main page. Implement as a collapsible/accordion section at the bottom with a header like "Resources & Detailed Reference" and a toggle arrow. Collapsed by default so the main 4 sections stay tight.

Use a simple `<details><summary>` HTML element or a small JS toggle. No heavy libraries.

#### Inside the collapsible, include these subsections:

**Source Priority Ranking (detailed)**
A ranked table showing where to search, in order:

| Priority | Source Type | Examples | Quality |
|---|---|---|---|
| 1 (Best) | TV interviews & news coverage | Bloomberg, CNBC, Fox Business interviews | Highest impact |
| 2 | Official company footage | Earnings calls, investor days, conference keynotes | Strong credibility |
| 3 | Documentaries / biographical clips | Existing docs, biography channels | Good depth |
| 4 | General financial news footage | Market floor, trading screens | Filler only |
| 5 (Last) | Stock footage | Generic office, skylines | Under 10% max |

**Search Queries That Work**
Copy-pasteable search templates:

```
YouTube:
  [person] interview
  [person] Bloomberg / CNBC
  [person] documentary
  [company] news / scandal / history
  [company] [decade, e.g. "1980s"]

Google Images:
  [person] young / early career / college
  [person] [year]
  [event] news article
  [company] logo

News Archives:
  WSJ, Bloomberg, NYT, Financial Times — search exact headlines or unique phrases
```

**Historical Accuracy Rules**
- If the script discusses 1986, the footage must be from the 1980s or visually neutral
- Search "[person name] young" or "[person name] early career" for age-appropriate photos
- For defunct companies (Drexel Burnham Lambert, Bear Stearns), look for archival news clips
- When no era-appropriate footage exists, use a still image from that time period instead

**Asset Reuse Policy**
- Some reuse is normal: the Solomon doc reuses 23 image sources and 11 B-roll sources
- A photo of a person can appear multiple times across different sections
- But hit the unique source minimums FIRST (75 B-roll, 55 images) before reusing
- Never reuse the same clip for two completely different narrative points

**Ground Truth Data (from our published videos)**
Show two small tables:

JPM Documentary (12:31):

| Asset | Unique Sources | Placements | Avg Duration |
|---|---|---|---|
| B-Roll Video | 91 | 109 | 5.5s |
| Still Images | 57 | 67 | 3.5s |
| Custom Visuals | 1 | 1 | 8.0s |

Solomon Documentary (18:22):

| Asset | Unique Sources | Placements | Avg Duration |
|---|---|---|---|
| B-Roll Video | 74 | 96 | 6.4s |
| Still Images | 68 | 96 | 4.7s |
| Custom Visuals | 3 | 26 | 9.4s |

**Submission Checklist**
An interactive checklist (checkboxes, state stored in memory only — no localStorage since this is static):

- [ ] Every script line has at least one visual reference
- [ ] All B-roll uses raw YouTube URLs with exact timestamps
- [ ] All still images use [pic N] format
- [ ] Highlight/zoom instructions added where needed
- [ ] WITH AUDIO marked where applicable
- [ ] Gaps flagged with [NO B-ROLL FOUND]
- [ ] Images uploaded to Slack as folder (1.png, 2.png, 3.png)
- [ ] All images minimum 1280x720, no watermarks
- [ ] Custom visual HTML files included (if any)
- [ ] Summary counts filled in:
  - Script duration: ___ minutes
  - Unique B-roll sources: ___ (target: 75-90)
  - Unique still images: ___ (target: 55-70)
  - Custom visuals: ___ (target: 1-3)
  - Unfilled gaps: ___ (target: 0)
  - Stock footage %: ___% (target: <10%)

---

## Design Rules

- The main 4 sections should be scrollable in under 3 minutes
- Section 5 (Appendix) is collapsed by default and does NOT count toward the scroll time
- No paragraph longer than 2 sentences in the main sections
- Section 1 (The Numbers) should dominate — stat cards are the largest elements
- Use monospace font for all annotation examples
- Sticky top nav bar: `75-90 B-roll | 55-70 images | 1-3 custom | 0 gaps`
- YouTube embeds should be responsive (16:9 aspect ratio containers)
- On mobile, stack everything vertically
- **Keep it light** — single HTML file, CDN-only dependencies, under 50KB, GitHub Pages ready

## What NOT to Include in the Main Sections

- No frame analysis methodology or algorithm details
- No step-by-step search tutorials (those go in the appendix)
- No explanation of how the numbers were derived
- No host streak analysis or pacing data
- No DaVinci Resolve details
- Present everything as established fact, not analysis results
- The appendix can have more detail, but even there keep it practical not technical
