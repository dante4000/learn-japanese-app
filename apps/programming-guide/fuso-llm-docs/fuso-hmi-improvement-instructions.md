# FUSO HMI Expert Reference — Improvement Instructions

> **How to use:** Each section below is a standalone instruction you can paste into an LLM along with the existing HTML file. Execute them in order (1→8, then minor polish). Each instruction tells the LLM exactly what to change, where, and in what style — matching the existing design system.

---

## Improvement 1: Add "Try This Now" Interactive Exercises

### What to do
Add a new component type called a **Try Box** to every content chapter (Ch01–Ch12). Each Try Box is a copy-paste-ready prompt with fill-in-the-blank placeholders the reader swaps with their own project context. Place one at the END of each chapter, before the next chapter's section break.

### Where to insert
At the bottom of each `<section id="chXX">`, after the last existing content element and before the closing `</section>` tag.

### Component HTML pattern
```html
<div class="callout ok">
  <div class="callout-title">Try This Now</div>
  <p>[1-2 sentence setup explaining what this exercise practices]</p>
  <div class="prompt-block">
    <span class="label">Copy → Paste → Replace Brackets</span>
    [The actual prompt template with [BRACKETED_PLACEHOLDERS] the reader fills in]
  </div>
  <p style="font-size:.85rem;color:var(--text-muted);margin-top:.6rem"><strong>What to check:</strong> [1-2 sentences telling them how to verify the output is good]</p>
</div>
```

### Content for each chapter

**Ch01 (FUSO Product Landscape):**
- Setup: "Test whether your LLM knows the basics of the FUSO product line."
- Prompt: `What are the current Mitsubishi Fuso truck models in production as of [CURRENT YEAR]? For each, list: vehicle class (light/medium/heavy), powertrain type, and primary market. Flag anything you're uncertain about.`
- What to check: "Compare the output against this chapter. Note which facts the LLM gets right, which it hedges on, and which it gets wrong — this calibrates your trust level."

**Ch02 (Regulations & Safety):**
- Setup: "Have the LLM draft a regulatory compliance matrix for a display element you're currently working on."
- Prompt: `I'm designing [YOUR DISPLAY ELEMENT] for the [VEHICLE MODEL] instrument cluster. Create a compliance checklist covering: ISO 15005 (glance time), ISO 26262 ASIL B (latency), ISO 2575 (colors/symbols), and UNECE R121 (telltale requirements). For each standard, state the specific requirement and whether my element is likely affected. Flag any requirements you cannot verify.`
- What to check: "Cross-reference every ISO clause number the LLM cites against the actual standard documents. Fabricated clause numbers are a common hallucination."

**Ch03 (ADAS & Telltale Design):**
- Setup: "Generate a warning escalation specification for an ADAS system."
- Prompt: `Design a [NUMBER]-stage warning escalation for [ADAS SYSTEM NAME] on the Fuso Super Great cluster. For each stage, define: trigger condition, telltale color (per ISO 2575), animation behavior (static/pulse rate/flash rate), text string (max 24 characters), audio alert type, and what causes escalation to the next stage. Format as a markdown table.`
- What to check: "Verify the color assignments match ISO 2575 conventions (green=normal, amber=caution, red=danger). Check that text strings are actually under 24 characters — count them."

**Ch04 (What LLMs Are):**
- Setup: "Test the practical limits described in this chapter with a real task."
- Prompt: `Explain the difference between the [FUSO TERM 1] and [FUSO TERM 2] systems on the Mitsubishi Fuso Super Great. Then tell me: how confident are you in this answer, and what's your source? If you're uncertain, say so explicitly rather than guessing.`
- What to check: "Did the model express appropriate uncertainty, or did it state everything with full confidence? This tests the hallucination and sycophancy risks from this chapter."

**Ch05 (How LLMs Work):**
- Setup: "Experiment with temperature's effect on output consistency."
- Prompt: `Generate 3 alternative text strings for a [WARNING TYPE] alert on a truck instrument cluster. Each must be under 20 characters and clearly communicate [THE CORE MESSAGE]. Rate each for clarity at highway-speed glance time (1-5 scale).`
- What to check: "Run this exact prompt 3 times. If using an API, try temperature 0 and temperature 0.8. Compare how much the outputs vary — this demonstrates the consistency concepts from this chapter."

**Ch06 (Models & Tiers):**
- Setup: "Compare model tiers on the same task to build intuition for when to use which."
- Prompt: `Create a state transition matrix for the [SYSTEM NAME] with these states: [LIST YOUR STATES]. Include: trigger condition for each transition, display changes, priority level, and fallback if the CAN signal is lost.`
- What to check: "Run this on a small model (Haiku/GPT-3.5) and a flagship model (Opus/GPT-4). Compare: did the small model miss edge cases? Did it handle the signal-lost fallback? This calibrates your model selection."

**Ch07 (Prompt Engineering):**
- Setup: "Transform a vague prompt into a specific one using the skeleton from this chapter."
- Prompt: Take your weakest recent LLM interaction — one where the output was too generic. Rewrite it using the skeleton: `Role: [WHO] / Context: [VEHICLE, DISPLAY, STANDARDS] / Task: [SPECIFIC OUTPUT] / Format: [TABLE/JSON/PROSE] / Constraints: [GLANCE TIME, ASIL, RHD, CHAR LIMITS]`. Run both versions and compare.
- What to check: "The strong version should produce output you can use with minimal editing. If it still requires heavy rework, your context or constraints need more specificity."

**Ch08 (Advanced Techniques):**
- Setup: "Use the reflection pattern to catch errors in a previous LLM output."
- Prompt: `Review the specification you just generated. Check for: (1) any ISO 2575 color violations, (2) any text strings exceeding [YOUR CHARACTER LIMIT] characters, (3) any state transitions that could leave the display in an undefined state, (4) any conflicts between simultaneous warning priorities. List every issue found, then provide a corrected version.`
- What to check: "Did the reflection actually catch real issues, or did it just say 'looks good'? If it found nothing, deliberately introduce an error and re-run to verify the technique works."

**Ch09 (Claude Cowork):**
- Setup: "Delegate a research task that would take you 30+ minutes manually."
- Prompt: `Research the instrument cluster designs of [COMPETITOR 1], [COMPETITOR 2], and [COMPETITOR 3] heavy-duty trucks (2024-2025 models). For each, find: display type (analog/digital/hybrid), approximate display size, ADAS visualization approach, and night mode implementation. Compile into a comparison table. Cite your sources.`
- What to check: "Verify at least 3 specific claims against manufacturer press materials or automotive press reviews. Cowork research is a starting point — not a finished deliverable."

**Ch10 (Verification & Safety):**
- Setup: "Stress-test the verification checklist on a real LLM output."
- Prompt: Take any LLM-generated specification from your recent work. Run it through every row of the Verification Checklist table in this chapter. For each check, record: Pass / Fail / Unable to verify. The items you mark "unable to verify" are your highest risk.
- What to check: "This is a meta-exercise — you're verifying your own verification process. If most items are 'unable to verify,' you need better access to primary source documents."

**Ch11 (ARCHION & SDV):**
- Setup: "Use an LLM to research a fast-moving industry development."
- Prompt: `What is the latest publicly available information about [ARCHION Corporation / Coretura AB] as of [CURRENT MONTH AND YEAR]? Focus on: timeline updates, organizational structure decisions, and any announced implications for vehicle HMI or instrument cluster design. Cite specific sources and dates.`
- What to check: "Cross-reference against Daimler Truck and Toyota investor relations pages. Industry mergers generate speculation — only trust claims linked to official corporate communications."

**Ch12 (Expert Workflow):**
- Setup: "Build your personal system prompt."
- Prompt: Using the template from Chapter 08, write a system prompt customized for your specific role. Include: your vehicle model(s), your market, your applicable standards, your display constraints, and your CAN protocol details. Save it as a text file and use it to start every new LLM session this week.
- What to check: "After a week of using your system prompt, note which instructions the LLM follows consistently and which it ignores. Refine accordingly."

---

## Improvement 2: Compress Chapters 4 and 5

### What to do
Merge Ch04 and Ch05 into a single chapter called **"What LLMs Are & How They Work"**. Cut total length to approximately 40% of the current combined content. Keep the following; cut or heavily summarize everything else.

### What to KEEP (these are actionable for a designer)
- The opening "what is an LLM" paragraph (2-3 sentences, no more)
- The "brilliant colleague who has never worked at your company" mental model — this one sentence is worth more than the entire attention mechanism explanation
- The timeline (`.tl` component) — compress each entry to 1 line of description max, cut entries for RNNs and LSTMs entirely (not actionable), keep Transformer, GPT-3, ChatGPT, Multimodal, Agents
- The temperature table — keep exactly as-is, it's directly useful
- The limitations list — keep exactly as-is, but rewrite as a compact table instead of bullet list (columns: Limitation | What It Means For Your Work | How To Mitigate)
- The tokenization diagram — keep but move it into a collapsible "How It Works Under the Hood" section (use a `<details><summary>` element) for curious readers

### What to CUT or heavily reduce
- The entire embeddings subsection (Step 2) — cut entirely
- The attention mechanism / Q-K-V explanation including the "library" metaphor and the attention scores SVG diagram — move into the collapsible section
- The training pipeline (3-stage SVG diagram) — move into the collapsible section
- The feed-forward networks, residual connections, positional encoding paragraph — cut entirely

### Collapsible section pattern
```html
<details style="margin:1.5rem 0">
  <summary style="cursor:pointer;font-weight:600;color:var(--heading);font-size:1rem;padding:.5rem 0">
    ▸ Under the Hood: How LLMs Actually Work (Optional Deep Dive)
  </summary>
  <div style="padding:1rem 0 0 1rem;border-left:2px solid var(--border)">
    [Moved content: tokenization diagram, attention explanation, training pipeline]
  </div>
</details>
```

### Renumber
After merging, the old Ch05 disappears. Renumber all subsequent chapters (old Ch06 becomes Ch05, etc.). Update all `id`, `data-ch`, `.ch-label`, sidebar TOC links, and the hero meta (now "11 chapters" instead of "12").

---

## Improvement 3: Add Worked End-to-End Example

### What to do
Add a new chapter called **"Worked Example: eCanter Charging Status Display"** immediately after the Prompt Engineering chapter (after the renumbering from Improvement 2, this goes after the prompt engineering chapter). This chapter walks through ONE complete task from start to finish: prompt → output → verification → iteration → final spec.

### Structure
Use the following flow, building each step as a visible component:

**1. The Brief** (1 paragraph in a `.card`)
"You need to design the charging status display for the eCanter's digital cluster. The display must show: charging state (not connected, AC charging, DC fast charging), current SOC percentage, estimated time to full charge, and charging power in kW. It must work for all three battery configurations (S/M/L)."

**2. First Prompt Attempt** (`.pe` with `.pg` wrapper — "strong prompt" style)
Show a well-constructed prompt using the skeleton from Ch07. Include role, context, task, format, and constraints. This should be good but not perfect — a realistic first attempt.

**3. Raw LLM Output** (`.prompt-block`)
Show a realistic model response — a markdown table with the charging states, display specs, colors, text strings. Include 2-3 subtle errors that a designer would need to catch:
- One ISO 2575 color violation (e.g., using blue instead of green for "fully charged")
- One text string that's too long for the glance budget
- One missing edge case (e.g., no "charging interrupted — check connection" state)

**4. Verification Pass** (`.callout warn`)
Walk through the verification checklist from Ch10 applied to this specific output. Call out the 3 errors explicitly. Show the mental process: "Checking color assignments against ISO 2575... the 'fully charged' state uses blue, but ISO 2575 mandates green for normal/OK states."

**5. Iteration Prompt** (`.pe` with `.pg` wrapper)
Show the follow-up prompt that corrects the errors: "Three issues with your specification: [list them]. Also add a 'Charging Interrupted — Check Connection' state with amber warning. Regenerate the full table with these corrections."

**6. Corrected Output** (`.prompt-block`)
Show the fixed specification table.

**7. Devil's Advocate** (`.prompt-block`)
Show a devil's advocate prompt and the model's response arguing against one of its own design choices.

**8. Final Spec** (`.card` with accent left border)
The polished, verified specification table ready to go into a design document.

**9. Takeaway** (`.pq` blockquote)
"Total time: ~15 minutes. Without LLM: ~2-3 hours of manual specification writing and standards cross-referencing. The LLM didn't produce a perfect first draft — it produced a strong starting point that expert review refined into a usable specification."

---

## Improvement 4: Add Image/Screenshot Workflow Section

### What to do
Add a new H3 subsection called **"Screenshot & Image Workflows"** to the Models & Capabilities chapter (Ch06 after renumbering). Place it after the existing "Multimodal Capabilities" bullet list, which currently mentions these workflows but doesn't show how to do them.

### Content to add

**Opening paragraph:** "For a UI/UX designer, pasting screenshots directly into the LLM is the single highest-ROI multimodal workflow. You can get design feedback, compliance checks, and competitor analysis from images alone — no specification documents needed."

**Three concrete workflows, each as a numbered step row (`.pr`):**

**Workflow 1: Cluster Layout Review**
- Title: "Figma Screenshot → Layout Feedback"
- Content: "Take a screenshot of your current cluster layout in Figma. Paste it into Claude or ChatGPT with this prompt:"
- Include a `.prompt-block` with: `I've attached a screenshot of my instrument cluster layout for the [VEHICLE MODEL]. This is a [RIGHT/LEFT]-hand drive vehicle for the [MARKET] market. Review this layout for: (1) ISO 15005 glance-time compliance — can each information group be read in ≤1.5 seconds? (2) Information hierarchy — is the most critical data (speed, active warnings) the most visually prominent? (3) Zone balance — is the layout optimized for the driver's primary viewing angle? Give specific, actionable feedback on what to change and why.`

**Workflow 2: Competitor Benchmarking from Photos**
- Title: "Press Photos → Structured Comparison"
- Content: "Download press photos of competitor clusters (Actros, Volvo FH, etc. from manufacturer press kits). Paste 2-3 images into a single prompt:"
- Include a `.prompt-block` with: `I've attached [NUMBER] instrument cluster photos from these trucks: [LIST MODELS]. Create a structured comparison table with columns: Feature, [Model 1] Approach, [Model 2] Approach, [Model 3] Approach, Best Practice Winner. Compare: information hierarchy, color usage, ADAS visualization method, typography/readability approach, and night mode design (if visible).`

**Workflow 3: Icon Legibility Testing**
- Title: "Telltale Icon Set → Legibility Assessment"
- Content: "Export your telltale icon set from Figma as a single image. Paste and ask:"
- Include a `.prompt-block` with: `These are telltale icons for a truck instrument cluster viewed at ~800mm distance. At 1.5-second glance time: (1) Which icons could be confused with each other? (2) Which icons lack sufficient contrast for night driving? (3) Which icons might not be recognized by a driver unfamiliar with the specific system? For each issue, suggest a specific fix.`

**End with a `.callout warn`:**
- Title: "Limitations of Image Analysis"
- Content: "LLMs cannot measure actual pixel dimensions, calculate true contrast ratios, or simulate peripheral vision. Image-based feedback is qualitative, not quantitative. Use it for early-stage review and brainstorming, not as a substitute for proper usability testing or instrument-grade photometric analysis."

---

## Improvement 5: Add Cowork Reality Check

### What to do
Add an H3 subsection called **"What Cowork Can and Can't Access"** to Ch09 (Cowork). Place it immediately after the opening description and autonomy slider diagram, BEFORE the seven use cases.

### Content

Use a two-column comparison grid (`.cg`):

**Left card (`.cc`):**
- Title: "Cowork CAN"
- Content as a compact list: Browse public websites and press archives. Read files you upload or paste into the conversation. Write new files (specs, reports, tables). Execute multi-step web research with source citations. Cross-reference documents you provide against each other. Generate and iterate on text, tables, and structured data.

**Right card (`.cc`):**
- Title: "Cowork CANNOT"
- Content as a compact list: Access your Figma files (unless you export and upload screenshots/SVGs). Read your company Confluence, SharePoint, or internal wikis. Open your proprietary DBC/CAN database files (unless you paste the relevant sections). Access your email, Slack, or internal tools. Remember context from previous conversations (unless you re-provide it). Verify information against paywalled standards documents it can't access.

**After the grid, add a `.callout info`:**
- Title: "The Upload Bridge"
- Content: "The gap between 'can' and 'cannot' is bridged by you uploading or pasting the relevant data. Cowork becomes dramatically more useful when you provide it with: exported Figma frames as PNGs, relevant CAN signal excerpts from your DBC file, specific ISO standard sections (copy-paste the relevant clauses), and your internal design system documentation. Think of Cowork as a powerful analyst who just started at your company — brilliant but needs onboarding materials."

**Then update the seven use cases** to add realistic "(requires: ...)" annotations. For example:
- "ISO Standard Cross-Reference" → add "(requires: upload your spec file AND paste the relevant ISO clauses)"
- "Design System Audit" → add "(requires: upload all telltale spec files to the conversation)"
- "CAN Signal Mapping" → add "(requires: upload or paste your DBC file)"

---

## Improvement 6: Add Prompt Library Appendix

### What to do
Add a new section at the very end of the document (after Ch12, before the footer) called **"Appendix: Prompt Library"**. This collects ALL prompt templates from across the document into one scannable reference, formatted for easy copy-paste.

### Structure

Don't use the chapter section styling (no `id="ch"` prefix, no gradient divider, no ghost number). Instead, use a simple heading and compact layout:

```html
<section id="appendix-prompts" style="padding:3rem 0">
  <h2 style="font-family:var(--serif);font-size:1.6rem;color:var(--heading);margin-bottom:1.5rem">
    Appendix: Prompt Library
  </h2>
  <p>Every reusable prompt template from this reference, collected for quick access. Replace <code>[BRACKETED TERMS]</code> with your project specifics.</p>
```

**For each prompt, use this compact format:**

```html
<div class="prompt-block" style="margin:.8rem 0">
  <span class="label">[Category]: [Prompt Name]</span>
  [The complete prompt template with [PLACEHOLDERS]]
</div>
```

**Categories and prompts to include (pulled from all chapters):**

1. **Spec Generation:** The Spec Generator pattern (from Ch07)
2. **Compliance:** The Compliance Checker pattern (from Ch07)
3. **State Machines:** The State Matrix Builder pattern (from Ch07)
4. **Copywriting:** The Copywriter pattern (from Ch07)
5. **Layout Analysis:** The Layout Analyst pattern (from Ch07)
6. **Competitor Analysis:** The Competitor Benchmarker pattern (from Ch07)
7. **System Prompt:** The full system prompt template (from Ch08)
8. **Reflection:** The reflection/self-review pattern (from Ch08)
9. **Devil's Advocate:** The counterargument pattern (from Ch08)
10. **Screenshot Review:** The Figma screenshot prompt (from the new Improvement 4 section)
11. **Competitor Photos:** The photo comparison prompt (from Improvement 4)
12. **Icon Legibility:** The telltale icon review prompt (from Improvement 4)
13. **Each "Try This Now" prompt** (from Improvement 1) — all 12

**Also add a sidebar TOC link** for this appendix section:
```html
<div class="toc-group">
  <div class="toc-group-title">Reference</div>
  <a href="#appendix-prompts" class="toc-link">
    <span class="toc-num">⊞</span>Prompt Library
  </a>
</div>
```

---

## Improvement 7: Add Glossary

### What to do
Add a glossary section immediately before the Prompt Library appendix. Compact two-column layout using the comparison grid component.

### HTML structure

```html
<section id="glossary" style="padding:3rem 0">
  <h2 style="font-family:var(--serif);font-size:1.6rem;color:var(--heading);margin-bottom:1.5rem">
    Glossary
  </h2>
  <p style="margin-bottom:1.2rem">Terms used throughout this reference. Sorted by category.</p>
```

Use a `<table>` with two columns: **Term** and **Definition**. Group by category using row headers (span full width with a shaded background).

### Terms to include

**Vehicle & Powertrain:**
| Term | Definition |
|------|-----------|
| ADAS | Advanced Driver Assistance Systems — automated safety features like emergency braking, blind spot detection, lane departure warnings |
| AMT | Automated Manual Transmission — clutchless manual gearbox (FUSO uses "SHIFTPILOT" brand name) |
| CAN / CAN FD | Controller Area Network — the communication bus connecting ECUs in the vehicle. CAN FD is the faster variant |
| DBC | Database Container — the file format that defines CAN signal names, IDs, byte positions, and scaling factors. Proprietary per manufacturer |
| DPF | Diesel Particulate Filter — traps soot from diesel exhaust; requires periodic "regeneration" (burning off accumulated soot) |
| ECU | Electronic Control Unit — any embedded computer module in the vehicle (engine ECU, ADAS ECU, body ECU, etc.) |
| J1939 | SAE standard protocol for CAN communication in heavy-duty vehicles. Defines message IDs and data formats |
| RHD / LHD | Right-Hand Drive / Left-Hand Drive — refers to driver position. Japan market = RHD |
| SCR | Selective Catalytic Reduction — exhaust aftertreatment using AdBlue (urea) to reduce NOx emissions |
| SOC | State of Charge — battery level as a percentage (eCanter) |
| V2X | Vehicle-to-Everything communication — wireless data exchange between vehicle and infrastructure, other vehicles, or grid |

**Safety & Standards:**
| Term | Definition |
|------|-----------|
| ASIL | Automotive Safety Integrity Level — ISO 26262 risk classification. ASIL A (lowest) to ASIL D (highest). Instrument clusters are typically ASIL B |
| ISO 2575 | International standard defining telltale symbols and mandated colors for vehicle displays |
| ISO 15005 | Standard for in-vehicle dialogue management — establishes the 1.5-second maximum single-glance time |
| ISO 26262 | Functional safety standard for road vehicles — defines ASIL levels and safety requirements |
| UNECE R121 | UN regulation specifying required telltale symbols and identification rules |
| Telltale | An indicator light/icon on the instrument cluster that communicates a vehicle status or warning to the driver |

**LLM & AI:**
| Term | Definition |
|------|-----------|
| Context window | The maximum amount of text (measured in tokens) an LLM can process in a single conversation |
| Few-shot | Providing the LLM with 1-3 examples of the desired output format before your actual request |
| Hallucination | When an LLM generates plausible-sounding but factually incorrect information |
| RLHF | Reinforcement Learning from Human Feedback — a training technique that aligns model outputs with human preferences |
| Sycophancy | The tendency of LLMs to agree with the user's stated position even when it's incorrect |
| Temperature | A parameter controlling output randomness. Low (0-0.2) = deterministic; High (0.7-1.0) = creative |
| Token | The sub-word unit LLMs process. ~1 token ≈ 0.75 English words. "eCanter" might be 3 tokens |
| Zero-shot | Asking the LLM to perform a task with no examples — just a clear instruction |

**Add a sidebar TOC link** for the glossary, in the same "Reference" group as the prompt library.

---

## Improvement 8: Expand Competitive Landscape with Template

### What to do
In Ch03 (ADAS & Telltale Design), replace the thin "Competitive Landscape" paragraph with a proper section that includes a blank comparison matrix template the reader can fill using an LLM.

### Replace the existing paragraph with:

**Keep the opening sentence** listing competitors.

**Add a comparison matrix table** — pre-filled with competitor names but empty cells for the reader to populate:

```html
<h4>Competitor Benchmark Matrix (Template)</h4>
<p>Use an LLM with competitor press photos (see Screenshot Workflows in Chapter [XX]) to fill this matrix. The empty cells are your research task.</p>
<table>
  <tr>
    <th>Feature</th>
    <th>FUSO Super Great</th>
    <th>Hino Profia</th>
    <th>Isuzu Giga</th>
    <th>Actros</th>
    <th>Volvo FH</th>
  </tr>
  <tr><td><strong>Display type</strong></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
  <tr><td><strong>ADAS visualization</strong></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
  <tr><td><strong>Warning escalation style</strong></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
  <tr><td><strong>Information hierarchy</strong></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
  <tr><td><strong>Night mode approach</strong></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
  <tr><td><strong>EV-specific UI (if applicable)</strong></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
</table>
```

**Then add a "Try This Now" prompt** specifically for filling this matrix:

```html
<div class="callout ok">
  <div class="callout-title">Try This Now</div>
  <p>Use image search or manufacturer press kits to find cluster photos for 2-3 competitors. Paste them into your LLM with this prompt:</p>
  <div class="prompt-block">
    <span class="label">Competitor Benchmark Prompt</span>
    I've attached instrument cluster images from [LIST COMPETITOR MODELS]. Fill in this comparison matrix based on what you can observe. For each cell, describe what you see. If something isn't visible in the image, mark it "Not visible." Do not guess.

    Features to compare: display type (analog/digital/hybrid), ADAS visualization approach, warning escalation style, information hierarchy, night mode approach, EV-specific UI elements.

    Format as a markdown table.
  </div>
</div>
```

---

## Minor Polish

### A. Increase three-diamond mark opacity
Find this line:
```html
<path d="M88,110 L95,98 L102,110 L95,104 Z" fill="var(--accent)" opacity=".12"/>
```
Change `opacity=".12"` to `opacity=".25"`.

### B. Fix stakes-grid awkward collapse between 700-900px
Add a new breakpoint in the CSS. Find the `@media(max-width:700px)` rule and add this BEFORE it:
```css
@media(max-width:900px) and (min-width:701px) {
  .stakes-grid { grid-template-columns: 1fr 1fr; }
  .stakes-grid .card:last-child { grid-column: 1 / -1; }
}
```
This makes the stakes grid go 2+1 (two cards on top, one spanning full width below) at tablet sizes instead of awkwardly squishing three columns.

### C. Annotate source links
In the Ch02 sources section, change:
```html
<div class="sources">Sources: <a href="https://www.iso.org/standard/55530.html" target="_blank">ISO 15005</a> · ...
```
To:
```html
<div class="sources">Sources: <a href="https://www.iso.org/standard/55530.html" target="_blank">ISO 15005</a> (catalog page — full text is paywalled) · ...
```
Apply the same "(catalog page — full text is paywalled)" annotation to all ISO links.

---

## Execution Order

1. **Improvement 2 first** (merge Ch04-05, renumber everything) — this changes all chapter numbers downstream
2. **Improvement 3** (add worked example chapter) — depends on new numbering
3. **Improvement 4** (screenshot workflows) — goes into existing chapter
4. **Improvement 5** (Cowork reality check) — goes into existing chapter
5. **Improvement 8** (competitor landscape) — goes into existing chapter
6. **Improvement 1** (Try This Now boxes) — goes into every chapter, needs final numbering
7. **Improvement 7** (glossary) — new appendix section
8. **Improvement 6** (prompt library) — new appendix section, references all prompts including those from steps 1-6
9. **Minor polish** — last pass
