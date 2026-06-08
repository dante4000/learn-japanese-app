# LLM Foundations Chapter — Design Spec

- Date: 2026-05-03
- Status: Approved (brainstorm), pending user review of this written spec
- Owner: superhackermans
- Scope: Claude Code Quick Start site (`claude-code-quickstart/`)

## 1. Goal

Add a foundational primer on large language models to the Claude Code Quick Start so a complete novice has a working mental model of what an LLM is, how it learns, how it answers, and where it fails — before any "what Claude Code is" or installation content. The primer must build the foundation strong enough that the rest of the guide's "supervise the model, don't trust it blindly" ethos lands as common sense rather than a rule.

The primer lives in two places:

1. A short framing block on `index.html` that hooks the reader and points to the deep chapter.
2. A new full chapter at the top of Part 1 that does the actual teaching.

A glossary section is folded into a consolidated Reference appendix that replaces the existing four separate appendices.

## 2. Files affected

### New content

- `claude-code-quickstart/part-1.html` — new Chapter 1 "How Large Language Models Work" (~3000 words, four inline SVG diagrams) prepended above the existing chapters.
- `claude-code-quickstart/index.html` — new framing section between the hero (`section.hero`) and the existing `#overview` section.
- `claude-code-quickstart/appendices.html` — restructured into a single combined Reference page with five `<h3>` subsections and a new Glossary subsection.

### Renumbering (mechanical)

Existing chapters 1–12 become 2–13:

- Chapter heading text in `part-1.html`, `part-2.html`, `part-3.html`.
- Sidebar TOC `toc-num` values and TOC labels in all five HTML files.
- Anchor IDs: `#ch1` → `#ch2`, `#ch2` → `#ch3`, …, `#ch12` → `#ch13`.
- Any cross-link inside body content that points at the old anchors.

The new chapter takes the freed `#ch1` anchor.

### Appendix restructure

- `#appendix-a` → `#commands`
- `#appendix-b` → `#troubleshooting`
- `#appendix-c` → `#install`
- `#appendix-d` → `#prompts`
- new: `#glossary`

Letter prefixes (`A`/`B`/`C`/`D`) are dropped from the sidebar; Reference entries become plain text labels.

### Docs

- `claude-code-quickstart/docs/SOURCE-LOG.md` — entries for every external source used in Chapter 1 (history claims, training process, model-specific numbers).
- `claude-code-quickstart/docs/PROGRESS.md` — record the addition of the foundations chapter and appendix consolidation, consistent with how the existing log tracks site changes.
- `claude-code-quickstart/docs/superpowers/specs/2026-05-03-llm-foundations-chapter-design.md` — this file.

### Verification before edits

Before renumbering, grep the entire `claude-code-quickstart/` tree for these patterns and produce an exhaustive change list to apply atomically:

- `#ch[0-9]+`
- `#appendix-[a-d]`
- `Chapter [0-9]+` (heading text and prose mentions)
- `Chapters [0-9]+-[0-9]+` (the phase summaries on `index.html`)

## 3. Chapter 1 structure (Part 1)

Target length ~3000 words, plain English, every term defined the first time it appears, in keeping with `claude-code-quickstart/CLAUDE.md` pedagogy rules.

Seven subsections, each with a `chapter-header` (`chapter-label` + `<h2>`) and chapter body in the existing visual pattern:

1. **A short history of language models.**
   Rule-based systems → statistical NLP → RNNs/LSTMs → Transformer (2017) → GPT-3 (2020) → ChatGPT (2022) → frontier era (2023–2026, naming Claude, GPT, Gemini families).
   Diagram 1: timeline strip.
2. **What an LLM actually is.**
   A next-token predictor. Tokens defined here. Why "predict the next word, then the next, then the next" produces apparent reasoning.
   Diagram 2: tokens-in → model → tokens-out flow.
3. **How a model learns.**
   Pretraining on raw text vs. post-training (supervised fine-tuning + RLHF). Alignment defined in passing.
   Diagram 3: two-stage training picture.
4. **A peek inside: attention and transformers.**
   One-page intuition only, no math. "Each token looks at every other token to decide what matters."
5. **What happens when you press Enter.**
   Context window, system prompt, prior turns, inference, temperature, sampling. Concrete numbers: Claude Opus 4.7's 1M-token context window, typical knowledge cutoffs across current frontier models.
   Diagram 4: context-window box (system prompt + your message + prior turns + tool output, with the cutoff line).
6. **Where it breaks.**
   Hallucinations, knowledge cutoff, no real-time facts without tools, sycophancy, prompt sensitivity, model-to-model differences.
7. **Why this matters for supervising Claude Code.**
   The bridge. Connects every limitation in section 6 to the guide's "plan mode → review diff → commit" safe path. Names Claude specifically here.

Verified-date stamp at the top of the chapter: **2026-05-03**.

## 4. `index.html` framing block

Sits directly under the hero, before `#overview`.

- Anchor: `#llm-primer`.
- One short paragraph: a 1–2 sentence "before you install anything, here's the 2-minute version of what a large language model is and what it isn't."
- `summary-grid` of three cards using the existing component:
  - **What it is** — a next-token predictor trained on huge amounts of text.
  - **How it learns** — pretraining + human feedback.
  - **Where it fails** — confident-sounding mistakes, no real-time knowledge, drift on long tasks.
- Button styled `button primary`: "Read Chapter 1: How LLMs Work" → `/claude-code-quickstart/part-1.html#ch1`.

The block is teaser only — the chapter is the single source of truth, no duplicated explainer copy.

## 5. Combined Reference page (`appendices.html`)

One top-level page heading. Five `<h3>` subsections in this order:

1. Commands (anchor `#commands`) — verbatim from existing Appendix A.
2. Troubleshooting (anchor `#troubleshooting`) — verbatim from existing Appendix B.
3. Install Matrix (anchor `#install`) — verbatim from existing Appendix C.
4. Prompt Starter Pack (anchor `#prompts`) — verbatim from existing Appendix D.
5. Glossary (anchor `#glossary`) — new content.

Glossary content: alphabetized, each entry one short line, target length 25–35 entries. Required terms (24): alignment, attention, base model, context window, distillation, embedding, fine-tuning, frontier model, hallucination, inference, knowledge cutoff, parameter, post-training, pretraining, prompt, RLHF, sampling, scaling laws, system prompt, temperature, token, tokenizer, tool use, transformer. The implementer chooses an additional 1–11 terms drawn from the chapter body (e.g., chain-of-thought, few-shot, weights, logits, completion, system message, sycophancy) to reach the target.

The four existing appendices keep their copy unchanged; the only structural change is flattening them under one page heading and renaming their anchors.

## 6. Sidebar (all five HTML files)

The "Reference" group in the sidebar replaces its four lettered entries with five plain-text entries:

- Commands → `appendices.html#commands`
- Troubleshooting → `appendices.html#troubleshooting`
- Install Matrix → `appendices.html#install`
- Prompt Starter Pack → `appendices.html#prompts`
- Glossary → `appendices.html#glossary`

The chapter groups update to reflect the renumber (Foundations and Setup now Ch 1–5, First Project and Workflow now Ch 6–10, Big Picture now Ch 11–13). Group names stay; numbering inside `toc-num` updates.

## 7. Visual & build conventions

- Vanilla HTML and existing `css/design-system.css` only — no new CSS files, no JS framework, no build step (per `claude-code-quickstart/CLAUDE.md`).
- Diagrams are inline `<svg>` reusing the existing `arrowhead` marker defined in each page; sized to match other figures on the site; theme-aware via `currentColor` and `var(--accent)`.
- Tone matches existing chapters: plain English, every term defined on first use, short paragraphs.
- Concrete claims (model versions, context-window sizes, knowledge cutoffs) are date-stamped 2026-05-03 on the chapter and have a corresponding entry in `SOURCE-LOG.md`.

## 8. Out of scope

- No new CSS files or build pipeline.
- No content rewrites of existing chapters beyond chapter-number string updates and any cross-link anchor updates.
- No bibliography section inside the chapter body — sources live in `SOURCE-LOG.md`.
- No "Chapter 0" — the renumber is the chosen approach.
- No changes to navigation, theme toggle, or any JS.

## 9. Risks and mitigations

- **Broken anchor links.** Renumbering chapters and renaming appendices touches anchors referenced from multiple files. Mitigation: exhaustive grep for `#ch[0-9]+` and `#appendix-[a-d]` before editing, single atomic pass with each replacement verified.
- **Stale specifics.** Concrete model versions and context-window numbers age. Mitigation: only the chapter and the new framing block carry these claims; both are date-stamped 2026-05-03 and sourced in `SOURCE-LOG.md`. Future maintenance can find every concrete claim by searching for the date stamp.
- **Diagram theme breakage.** Inline SVG must work in both light and dark themes. Mitigation: use `currentColor` for strokes/text and `var(--accent)` only where the existing pages already do, mirroring the existing `arrowhead` marker pattern.
- **Length pressure on Part 1.** A ~3000-word chapter at the top of Part 1 lengthens the page meaningfully. Mitigation: each of the seven subsections stays compact (~400 words avg), diagrams break up text, and the existing `chapter-header` pattern provides skim points.

## 10. Acceptance criteria

- New Chapter 1 renders correctly on `part-1.html` with all four diagrams visible in light and dark themes.
- `index.html` shows the framing block above `#overview` with a working button to `part-1.html#ch1`.
- `appendices.html` is a single page with five subsections, each anchor-addressable.
- Sidebar in every HTML file lists 13 chapters numbered 01–13 plus the five Reference subsections (no letter prefixes).
- All previous cross-links resolve to their renamed targets — no `#ch1`-through-`#ch12` link goes to an unintended chapter, no `#appendix-a` through `#appendix-d` link is broken.
- `SOURCE-LOG.md` lists every external source the chapter relies on for historical or model-specific claims.
- `PROGRESS.md` records the change.

## 11. Next step

After user approval of this spec, invoke the `superpowers:writing-plans` skill to produce a step-by-step implementation plan that includes the exact grep results for anchors, the precise edits per file, and the order of operations.
