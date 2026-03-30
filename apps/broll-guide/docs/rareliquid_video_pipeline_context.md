# rareliquid Video Production Pipeline — Full Context

## What This Document Is

This document captures the full context from a conversation where we built comprehensive B-roll, still image, and custom visual guidelines for rareliquid's documentary-style finance YouTube videos. It includes the raw data, analysis methodology, ground-truth findings, and all the rules we established. Use this as context when building tools or websites to support this pipeline.

---

## 1. About rareliquid

- **Channel**: rareliquid (always lowercase, no caps)
- **Host**: Ben (former JP Morgan investment banker)
- **Content**: Documentary-style videos about finance personalities and institutions
- **Style**: High visual density, rapid cuts, minimal host face time
- **Reference Videos**:
  - JP Morgan Documentary: https://www.youtube.com/watch?v=hQSpro7pNws (12:31)
  - David Solomon Documentary: https://www.youtube.com/watch?v=SfIjrEJt3SQ (18:22)

---

## 2. The Problem We Solved

When scripts were sent to the B-roll research team, the initial pass only covered ~50-60% of what was needed. Common issues:

- Not enough total clips
- Clips loosely related but not specific to the sentence being spoken
- Generic stock footage used when real interview/news clips existed
- Present-day footage used for historical events (e.g., showing 2024 Solomon during a 1986 Drexel section)
- Boring/plain clips chosen when more interesting alternatives existed
- Zoomed/panned still images miscounted as B-roll
- Article screenshots on dark backgrounds miscounted as custom visuals
- Host zoom-in/zoom-out causing the host to be fragmented into tiny segments

---

## 3. Ground Truth Data (from DaVinci Resolve Timeline Exports)

We exported the actual DaVinci Resolve timelines for both published documentaries and parsed every clip across all tracks. This is the definitive data.

### JPM Documentary (12:31, 14 tracks, 567 total clips)

| Asset Type | Unique Sources | Total Placements | Avg Duration | Notes |
|---|---|---|---|---|
| B-Roll Video | 91 | 109 | 5.5s | 47% have zoom/pan, 11 sources reused |
| Still Images | 57 | 67 | 3.5s | 93% have zoom/pan (Ken Burns), 6 sources reused |
| Custom Visuals | 1 | 1 | 8.0s | Single HTML-generated graphic |
| Host (A-Roll) | 59 | 67 | 9.5s | 97% have zoom/pan applied by editor |

### Solomon Documentary (18:22, 11 tracks, 621 total clips)

| Asset Type | Unique Sources | Total Placements | Avg Duration | Notes |
|---|---|---|---|---|
| B-Roll Video | 74 | 96 | 6.4s | 36% have zoom/pan, 11 sources reused |
| Still Images | 68 | 96 | 4.7s | 91% have zoom/pan (Ken Burns), 23 sources reused |
| Custom Visuals | 3 | 26 | 9.4s | 3 HTML files reused across 26 placements |
| Host (A-Roll) | 68 | 71 | 11.9s | 99% have zoom/pan applied by editor |

### Per-Minute Targets (derived from ground truth)

For a 15-minute script, you need approximately:

- **75-90 unique B-roll video sources** (~5-7 per minute)
- **55-70 unique still images** (~4-5 per minute)
- **1-3 custom visual HTML files** (rare, only for data/timelines)
- **~148 total unique visual assets**

---

## 4. Frame-by-Frame Analysis Results (4fps, 7,411 frames)

We extracted frames at 4fps from both videos and ran pixel-difference analysis to classify every quarter-second.

### Visual Composition (% of screen time)

| Visual Type | JPM | Solomon | Average |
|---|---|---|---|
| B-Roll Video | 66.6% | 51.0% | 58.8% |
| Still Images (incl. zoom) | 17.7% | 27.2% | 22.4% |
| Custom Visuals | 6.5% | 5.4% | 6.0% |
| Host On Screen | 9.3% | 16.4% | 12.8% |

### Cutting & Pacing

| Metric | JPM | Solomon | Average |
|---|---|---|---|
| Cuts per Minute | 16.0 | 16.2 | 16.1 |
| Average Segment Duration | 3.0s | 2.5s | 2.8s |
| Total Segments | 222 | 321 | 272 |

### Host Streak Analysis

| Metric | JPM | Solomon |
|---|---|---|
| Total Host Segments | 28 | 40 |
| Average Streak | 2.5s | 4.5s |
| Top 5 Longest | 9.5s, 5.2s, 4.8s, 3.8s, 3.8s | 16.2s, 14.2s, 12.2s, 10.5s, 8.5s |
| Streaks Over 5s | 2 (7%) | 12 (30%) |
| Streaks Over 3s | 6 (21%) | 22 (55%) |

### Key Insight

The host is on screen only ~12.8% of the time. ~87% of the video is B-roll, still images, or custom visuals. Most host streaks are 2-5 seconds. Stretches of 10-15 seconds happen during key narrative moments. Hard ceiling: ~15 seconds.

---

## 5. Visual Types — Definitions and Rules

### 5.1 B-Roll Video

**Definition**: Video footage that plays over the host's voiceover. The viewer sees the footage but hears the host narrating.

**Source Priority (best to worst)**:
1. TV interviews & news coverage of the subject (Bloomberg, CNBC, Fox Business)
2. Official company footage or event recordings (earnings calls, conferences)
3. High-quality documentary or biographical clips
4. General financial/business news footage
5. Stock footage (last resort, max 10% of total)

**Rules**:
- Minimum clip duration: 3 seconds (no isolated clips under 3s)
- Maximum single clip: 10 seconds before a cut
- Ideal clip length: 4-7 seconds
- Must be historically accurate (no 2024 footage for 1986 events)
- Must pass relevance test: if watched on mute, could you guess the topic?
- Always pick the more visually interesting option when two exist
- Never reuse the same clip for two different script lines (unless revisiting a topic)

**Annotation format**: `[raw YouTube URL, start timestamp - end timestamp]`
- Example: `[https://www.youtube.com/watch?v=QZ85VPgCOCM, 0:18 - 0:29]`

### 5.2 B-Roll with Original Audio

**Definition**: Same as B-roll, but the original audio from the clip plays instead of the host voiceover. Very rare (~2% of total video).

**When to use**: Only for high-impact moments — a CEO making a key statement, a news anchor breaking a story, a dramatic quote delivered by the speaker.

**Annotation format**: `[URL, timestamp, WITH AUDIO]`

### 5.3 Still Images

**Definition**: A static image shown on screen. Almost always (91-93%) with a zoom/pan (Ken Burns effect) applied by the editor.

**Types (best to worst)**:
1. News article screenshots with key phrases highlighted (signature rareliquid look)
2. Official documents and filings (SEC filings, court docs, press releases)
3. Data charts and graphs from reputable sources
4. High-resolution photographs (headshots, event photos, campus shots)
5. Social media screenshots (only when directly relevant)

**Rules**:
- Minimum resolution: 1280x720
- No watermarks, no compression artifacts
- Crop to relevant content (no browser chrome)
- When a highlight is needed, note it: `[pic 7, highlight "specific phrase"]`
- Search "person name young" or "person name college" for era-appropriate photos
- Never stack 3+ consecutive still images without a video clip to break it up

**Annotation format**: `[pic N]` or `[pic N, highlight "text"]` or `[pic N, zoom]`

### 5.4 Picture Zoom (Ken Burns Effect)

91-93% of still images in our documentaries have zoom/pan applied. This is the default — the editor applies it. When you want a specific zoom direction, annotate it:
- `[pic N, zoom]` — default zoom
- `[pic N, pan left-to-right]` — specific direction
- `[pic N, zoom into "key phrase"]` — zoom to highlight area

### 5.5 Custom Visuals (HTML Charts/Graphics)

**Definition**: Custom-built HTML files rendered as graphics. Timelines, data charts, comparison tables, financial breakdowns. Very rare: only 1-3 per video.

**When to use**:
- Career timelines (e.g., Irving Trust → Drexel → Bear Stearns → Goldman)
- Financial data: revenue, profit margins, stock price comparisons
- Comparison tables: two candidates side by side
- Company splits, mergers, organizational changes

**Rules**:
- Use Claude (Opus 4.6) to generate self-contained HTML files
- Dark backgrounds (#1B2A4A or #111827), clean sans-serif fonts
- Must cite data sources
- Designed for 16:9 aspect ratio, legible at 1080p

---

## 6. The Line-by-Line Process

### Step 1: Watch Reference Documentaries
Watch both the JPM doc and Solomon doc in full. Note the visual rhythm.

### Step 2: Full Script Read-Through
Read the entire script without annotating. Understand the arc.

### Step 3: Entity Extraction
List every person, company, event, data point, quote, and metaphor.

### Step 4: Bulk Search Phase
For each entity, search YouTube and Google Images. Log everything in a spreadsheet with: URL, timestamp range, description, era of footage, which script lines it serves.

Search patterns that work:
- "[person] interview", "[person] Bloomberg", "[person] CNBC"
- "[person] young", "[person] early career", "[person] college"
- "[company] news", "[company] [decade]", "[company] history"
- "[event] news coverage", "[event] [year]"

### Step 5: Line-by-Line Assignment
Assign at least one visual to every line. Zero orphan lines.

### Step 6: Gap Audit
Check for: lines with no visual, host face > 5 seconds without cut, 3+ consecutive stills without video, stock footage, era mismatches, boring clips.

### Step 7: Final Count Check
- B-roll clips: 75-90 unique sources
- Still images: 55-70 unique images
- Custom visuals: 1-3
- Stock footage: under 10%
- Gaps: zero

---

## 7. Script Annotation Format

### B-Roll References
`[raw YouTube URL, start - end]`

Example: `[https://www.youtube.com/watch?v=QZ85VPgCOCM, 0:18 - 0:29]`

**Never** use video titles. Always raw URLs with exact timestamps.

### Still Image References
`[pic N]` — basic placement
`[pic 7, highlight "specific text"]` — with highlight
`[pic 12, zoom]` — with zoom instruction

### Audio Instructions
`[URL, timestamp, WITH AUDIO]` — B-roll plays with original audio

### Overlay Instructions
`[show Goldman Sachs logo when host says "Goldman"]`
`[arrow pointing to player A labeled "Solomon"]`

### Alternate Options
`[option A] OR [option B]` — editor chooses

### Timestamp Anchoring (post rough-cut)
`MMSS - [asset reference]`
Example: `0342 - [https://youtube.com/watch?v=abc, 1:03 - 1:08]`

---

## 8. Naming & Deliverables

### Image Folder
- Named sequentially: `1.png, 2.png, 3.png`
- Upload entire folder to Slack as a batch
- Minimum 1280x720, no watermarks

### Custom Visuals
- Self-contained HTML files, one per visual
- Data sourced and verified
- 16:9, legible at 1080p

### Summary Counts (top of submission)
- Script duration: [X] minutes
- Total unique B-roll sources: [X] (target: 75-90)
- Total unique still images: [X] (target: 55-70)
- Total custom visuals: [X] (target: 1-3)
- Unfilled gaps: [X] (target: 0)
- Stock footage %: [X]% (target: under 10%)

---

## 9. Common Mistakes

| Mistake | Fix |
|---|---|
| Modern footage for historical events | Search archival footage or use period-appropriate stills |
| Boring clip when better exists | Compare options, pick most engaging |
| Stock footage when real footage exists | Search "[person] interview", "[person] CNBC" |
| Video titles instead of URLs | Always raw YouTube URLs with timestamps |
| Host on screen 10+ seconds | Break up every 3-5 seconds |
| Clips under 3 seconds | Find longer clip or extend with still image |
| Silently skipping lines | Flag: [NO B-ROLL FOUND - need alternative] |
| Reusing same clip for different lines | Each line needs unique visual |
| Company logo instead of real footage | Search for office, news, conference clips |
| 3+ stills in a row | Break with at least one video clip |

---

## 10. Quick Reference

| Rule | Standard |
|---|---|
| Host face target | 2-5 seconds per streak, 15s hard ceiling |
| Minimum clip duration | 3 seconds |
| B-roll per video | 75-90 unique sources |
| Still images per video | 55-70 unique images |
| Custom visuals per video | 1-3 HTML files |
| Stock footage ceiling | Under 10% |
| Unfilled gaps | Zero |
| B-roll format | [raw URL, MM:SS - MM:SS] |
| Image format | [pic N] or [pic N, highlight "text"] |
| Audio callout | [URL, timestamp, WITH AUDIO] |
| Source priority | Interviews > Official > Documentary > News > Stock |
| Historical rule | Match the era being discussed |
| Still image zoom | 91-93% should have zoom/pan instructions |

---

## 11. David Solomon Documentary — Script Reference

The Solomon documentary script was the case study used to develop these guidelines. Key B-roll patterns from that production:

### Hook (first 60-90 seconds)
- Rapid-fire clips (2-4 seconds each) from multiple sources
- Almost zero host face time in first 10-15 seconds
- Each question paired with specific visual

### Section Transitions
- "Bridge clips" from interviews (e.g., Blankfein saying "I want to introduce the next CEO")
- Custom timeline visuals or dramatic stills to reset the viewer

### Metaphor Clips
- Basketball block clip = Goldman rejecting Solomon (with arrows labeling players)
- Creative, specific visuals that make the video distinctive

### Article Highlights
- News articles shown on screen with specific phrases highlighted/underlined
- Analyst survey, NYMag hit piece, "go bigger go bigger" quote all shown as highlighted screenshots

### Ad Section
- Treated with same visual density as main content
- Product screenshots, course interfaces, logos
