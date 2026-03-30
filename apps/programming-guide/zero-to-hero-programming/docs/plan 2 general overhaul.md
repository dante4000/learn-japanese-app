# Improvement Plan: Eval-Driven Fixes

> **For agentic workers:** REQUIRED: Read `CLAUDE.md` (project rules), `docs/EVAL-RESULTS.md` (detailed findings), and `docs/DECISIONS.md` (design log) before starting. Follow all existing patterns exactly. Use subagent-driven-development or executing-plans to implement.

**Goal:** Raise the eval score from **4.23 to 4.5+** ("Exceptional") by addressing the specific gaps identified in `docs/EVAL-RESULTS.md`. Focus on the highest-weighted sections with the most room to improve.

**Architecture:** All changes are HTML insertions into existing phase files. No new files, no CSS changes, no JS changes. Follow the exact patterns already used (callout classes, exercise structure, sidebar format). Read the target file before editing — match indentation, tag nesting, and class usage precisely.

**Constraints from CLAUDE.md (non-negotiable):**
- `src/css/design-system.css` is immutable
- No new CSS or JS files
- No inline styles except inside SVG diagrams
- Sidebar must be identical across all phase files (except same-page anchors for current file)
- Each phase file should stay under 1200 lines / 500KB (some already exceed this — do not make it worse)
- Every chapter references TaskForge at least once
- No forward references (no concept used before it's introduced)
- Maximum 5 new technical terms per chapter

**Priority:** The eval weights sections 2, 3, and 4 at 20% each. Section 1 at 15% is the weakest score (3.5). Fix Section 1 first — it's the highest-impact improvement.

---

## Score Impact Forecast

| Section | Current | Target | Strategy |
|---|---|---|---|
| 1. Onboarding & Setup (15%) | 3.5 | 4.0 | Claude Code preview in Phase 1; expand troubleshooting |
| 2. Curriculum Architecture (20%) | 4.5 | 4.5–5.0 | Add per-chapter prerequisite callouts; model selection subsection |
| 3. Pedagogical Quality (20%) | 4.5 | 4.5 | Hold — already strong |
| 4. Projects & Exercises (20%) | 4.5 | 4.5 | Hold — already strong |
| 5. Claude Code Depth (15%) | 4.5 | 4.5–5.0 | Model selection subsection in Ch 25 |
| 6. Content Quality (5%) | 4.5 | 4.5–5.0 | CHANGELOG.md; fix remaining AUDIT-ROUND-5 items |
| 7. Community & Support (5%) | 2.0 | 3.0 | README, CONTRIBUTING.md, FAQ |
| **Projected TOTAL** | **4.23** | **~4.45** | |

---

## Task List

| # | Task | File(s) | Section Improved | Est. Lines |
|---|---|---|---|---|
| 1 | Claude Code preview callout in Ch 03 | `phase-1.html` | 1c | ~25 |
| 2 | Expected terminal output for Claude Code install in Ch 20 | `phase-5.html` | 1b | ~15 |
| 3 | Expand Appendix D troubleshooting (rate limits, network, proxy) | `appendices.html` | 1d | ~30 |
| 4 | Per-chapter prerequisite callouts (Phases 2–6) | All phase files | 2b | ~5 per phase |
| 5 | Model selection subsection in Ch 25 | `phase-6.html` | 2c, 5a | ~35 |
| 6 | CHANGELOG.md | New file (root) | 6c | ~30 |
| 7 | README.md | New file (root) | 7a, 7b | ~60 |
| 8 | CONTRIBUTING.md | New file (root) | 7c | ~40 |

**Total estimated: ~270 lines of new content + 3 new root-level files.**

---

## Chunk 1: Claude Code Preview in Phase 1 (Highest Impact)

### Task 1: Add "What You're Building Toward" callout in Ch 03

**Problem (from eval):** Claude Code doesn't appear until Chapter 20. The eval framework expects a "first successful interaction" within the first lesson. While the full Claude Code workflow correctly lives in Phase 5, Phase 1 currently has zero mention of what the learner will eventually be using. This creates a motivation gap.

**Solution:** Add a forward-looking callout in Ch 03 (Setting Up Your Environment) — after Node.js is installed — that shows a 5-second preview of what a Claude Code interaction looks like. This is NOT a full lesson; it's a teaser with expected output that validates the Node.js install and gives the learner a taste of what they're working toward.

**Critical constraint:** Do NOT teach Claude Code here. Do NOT explain prompting, context, or any Phase 5 concept. This is purely: "Here's what it looks like when you get there. For now, knowing Node.js works is all you need."

**Files:**
- Modify: `src/phase-1.html`

**Steps:**

- [ ] **Step 1: Find the Node.js install verification section in Ch 03**

Read `src/phase-1.html` and find the line where Node.js installation is verified (should be near `node --version` or similar). The insertion goes immediately after the verification step.

- [ ] **Step 2: Insert the preview callout**

Insert a callout block using the existing `callout info` pattern. Content:

```html
<div class="callout info">
<div class="callout-title">Preview: What You're Building Toward</div>
<p>You just installed Node.js. In Phase 5, you'll use it to run Claude Code — an AI assistant that lives in your terminal. Here's what a Claude Code session looks like:</p>
<pre><code>$ claude
╭──────────────────────────────────────╮
│ Claude Code                          │
│                                      │
│ /home/you/taskforge                  │
╰──────────────────────────────────────╯

> Explain the architecture of this project in one paragraph.

This project is a command-line task manager built in Python...
</code></pre>
<p>You're not ready to use this yet — you need to understand what code is and how to read it first. That's what the next 15 chapters are for. But when you get to Phase 5, setup will be one command: <code>npm install -g @anthropic-ai/claude-code</code>.</p>
</div>
```

- [ ] **Step 3: Verify**

1. The callout appears immediately after the Node.js `node --version` verification
2. No Phase 5 concepts are taught (no mention of prompting, CLAUDE.md, context windows)
3. The `npm install` command matches what Phase 5 Ch 20 uses
4. File stays near the 1200-line limit (currently 1206 — this adds ~18 lines; monitor)

---

## Chunk 2: Claude Code Install Expected Output

### Task 2: Add expected terminal output to Ch 20 Claude Code installation

**Problem (from eval):** "Claude Code installation provided but lacks expected terminal output." The Python install in Ch 03 shows expected output at every step; the Claude Code install in Ch 20 does not.

**Files:**
- Modify: `src/phase-5.html`

**Steps:**

- [ ] **Step 1: Find the `npm install -g @anthropic-ai/claude-code` line in Ch 20**

Read `src/phase-5.html` and locate the Claude Code installation command (around line 479).

- [ ] **Step 2: Add expected output and verification**

After the install command, add a `<pre><code>` block showing expected terminal output and a verification step, following the same pattern used for Python installation in Ch 03. Example:

```html
<p>Install Claude Code globally:</p>
<pre><code>$ npm install -g @anthropic-ai/claude-code

added 1 package in 8s
</code></pre>
<p>Verify the installation:</p>
<pre><code>$ claude --version
claude v1.x.x
</code></pre>
<p>If <code>npm</code> is not found, return to Phase 1 Chapter 3 and install Node.js. If you get a permissions error, try <code>sudo npm install -g @anthropic-ai/claude-code</code> (macOS/Linux) or run your terminal as Administrator (Windows).</p>
```

Note: Use `v1.x.x` as a placeholder version — this follows the two-layer pattern from CLAUDE.md (enduring concept + current example that's easy to update).

- [ ] **Step 3: Verify**

1. Expected output shown after the install command
2. Verification command (`claude --version`) included
3. Failure mode (npm not found, permissions) addressed inline with cross-reference to Ch 03
4. File stays under reasonable limits (currently 998 lines)

---

## Chunk 3: Expanded Troubleshooting

### Task 3: Add rate limit, network, and proxy troubleshooting to Appendix D

**Problem (from eval):** "Missing: rate limit errors, network/proxy issues, firewall blocking."

**Files:**
- Modify: `src/appendices.html`

**Steps:**

- [ ] **Step 1: Find the end of the Phase 4 troubleshooting block in Appendix D**

Read `src/appendices.html` and locate the Claude Code troubleshooting entries (around lines 835-862). The new entries go after the existing Claude Code entries and before the Phase 5 section.

- [ ] **Step 2: Insert new troubleshooting entries**

Add entries for three missing scenarios, using the existing Symptom / Cause / Fix format:

**Rate Limits:**
- Symptom: `429 Too Many Requests` or `RateLimitError` when using Claude Code
- Cause: You've exceeded your API rate limit or your plan's usage cap
- Fix: Wait 60 seconds and retry. If persistent, check your usage at console.anthropic.com. Claude Max subscribers have higher limits than API-key users. If you hit limits during exercises, start a new conversation — shorter context uses fewer tokens.

**Network / Firewall:**
- Symptom: `ECONNREFUSED`, `ETIMEDOUT`, or `fetch failed` when Claude Code tries to connect
- Cause: Your network is blocking outbound HTTPS connections to api.anthropic.com, or you're behind a corporate firewall/VPN
- Fix: Test connectivity with `curl https://api.anthropic.com/v1/messages -I`. If blocked, check your firewall settings or try from a different network. If you're behind a corporate proxy, set the `HTTPS_PROXY` environment variable: `export HTTPS_PROXY=http://your-proxy:port`

**Proxy Configuration:**
- Symptom: Claude Code installs but cannot reach the API; `npm install` itself fails with network errors
- Cause: npm and Claude Code need proxy configuration separately
- Fix: For npm: `npm config set proxy http://your-proxy:port` and `npm config set https-proxy http://your-proxy:port`. For Claude Code: set `HTTPS_PROXY` in your shell config file (`~/.zshrc` or `~/.bashrc`), then run `source ~/.zshrc`.

- [ ] **Step 3: Verify**

1. New entries use the same HTML structure as existing entries in Appendix D
2. Entries appear in the Phase 4 (Claude Code) section, not Phase 5
3. Commands shown are correct (`curl`, `npm config`, `export`)
4. File stays under limits (currently 964 lines + ~30 = ~994)

---

## Chunk 4: Per-Chapter Prerequisite Callouts

### Task 4: Add "Before You Begin" callouts to Phase 2–6 openers

**Problem (from eval):** "No explicit 'Before this lesson, you should be comfortable with X' headers in chapter content. Dependencies are implicit in structure rather than stated per-chapter."

**Solution:** Add a single `callout info` block at the start of each phase (not each chapter — that would be 28 callouts and excessive). Place it after the phase `<h2>` and before Chapter N's `<h3>`. Each callout lists the specific skills from prior phases that the learner needs.

**Files:** All 5 phase files (Phase 1 has no prerequisites, so skip it)

**Steps:**

- [ ] **Step 1: Read the first 120 lines of each phase file to find insertion points**

For each file, find the line after the phase title `<h2>` and before the first chapter `<section id="chXX">`.

- [ ] **Step 2: Insert prerequisite callouts**

Use the `callout info` pattern. Content for each phase:

**phase-2.html** (before Ch 05):
```html
<div class="callout info">
<div class="callout-title">Before You Begin Phase 2</div>
<p>This phase assumes you can: open a terminal and run commands (Ch 03), read a short Python function and predict its output (Ch 04), and explain what variables, types, and basic operators do (Ch 02). If any of these feel shaky, revisit the relevant Phase 1 chapter first.</p>
</div>
```

**phase-3.html** (before Ch 10):
```html
<div class="callout info">
<div class="callout-title">Before You Begin Phase 3</div>
<p>This phase assumes you can: write functions with parameters and return values (Ch 05), use lists and dictionaries (Ch 06), and handle errors with try/except (Ch 09). You'll also need a working Python environment from Ch 03.</p>
</div>
```

**phase-4.html** (before Ch 13):
```html
<div class="callout info">
<div class="callout-title">Before You Begin Phase 4</div>
<p>This phase assumes you can: navigate the terminal and use basic shell commands (Ch 10), create Git repositories, make commits, and push to GitHub (Ch 11-12), and write Python functions with error handling and tests (Ch 05, 09).</p>
</div>
```

**phase-5.html** (before Ch 19 — may already have the BRIDGE callout; insert before it):
```html
<div class="callout info">
<div class="callout-title">Before You Begin Phase 5</div>
<p>This phase assumes you have completed Phases 1–4. Specifically: you can read and write Python confidently (Phase 2), use Git for version control (Phase 3), and build a working web application with Flask, SQLite, and Docker (Phase 4). If you skipped Phase 4, go back — you need hands-on building experience before evaluating AI-generated code.</p>
</div>
```

**phase-6.html** (before Ch 24):
```html
<div class="callout info">
<div class="callout-title">Before You Begin Phase 6</div>
<p>This phase assumes you can: evaluate AI-generated code and identify common failure patterns (Ch 19), write effective CLAUDE.md files and manage context (Ch 21), and use Claude Code for single-task development with tests (Ch 20-23). Phase 6 is reference material — return to it as your projects grow.</p>
</div>
```

- [ ] **Step 3: Verify per file**

For each file:
1. Callout appears after the phase heading and before the first chapter section
2. Referenced chapters are accurate (no forward references — each callout only references earlier chapters)
3. The `callout info` class matches existing usage
4. No file is pushed significantly over the 1200-line limit

---

## Chunk 5: Model Selection Subsection

### Task 5: Add "Choosing the Right Model" subsection to Ch 25

**Problem (from eval):** "Model selection strategies (when to use Opus vs. Sonnet vs. Haiku) touched on briefly in Ch 25 but not deeply explored." This was flagged as a gap in both Section 2c (completeness) and Section 5a (Claude Code depth).

**Context:** Ch 25 already mentions multi-model dispatch (lines 320-329). This task expands that mention into a proper subsection with a decision table.

**Files:**
- Modify: `src/phase-6.html`

**Steps:**

- [ ] **Step 1: Find the multi-model dispatch section in Ch 25**

Read `src/phase-6.html` and locate the existing multi-model dispatch content (around lines 320-329). The new subsection goes immediately after this content.

- [ ] **Step 2: Insert the model selection subsection**

```html
<h3>Choosing the Right Model for the Task</h3>
<p>Not every task needs the most powerful model. Matching model capability to task complexity saves cost and often improves speed without sacrificing quality.</p>

<table>
<tr><th>Task Type</th><th>Recommended Tier</th><th>Why</th><th>Example</th></tr>
<tr>
<td>Architecture decisions, complex refactors, ambiguous specs</td>
<td><strong>Highest capability</strong> (e.g., Opus)</td>
<td>Requires deep reasoning, handling ambiguity, and maintaining coherence across many files</td>
<td>"Redesign TaskForge's storage layer from JSON files to SQLite, maintaining all existing tests"</td>
</tr>
<tr>
<td>Feature implementation, bug fixes, test writing</td>
<td><strong>Mid-tier</strong> (e.g., Sonnet)</td>
<td>Well-defined tasks with clear acceptance criteria; strong capability at lower cost</td>
<td>"Add a <code>--priority</code> flag to the <code>add</code> command with values low/medium/high"</td>
</tr>
<tr>
<td>Documentation, formatting, boilerplate, simple edits</td>
<td><strong>Fast/lightweight</strong> (e.g., Haiku)</td>
<td>Mechanical tasks where speed matters more than deep reasoning</td>
<td>"Add docstrings to all public functions in <code>taskforge/api.py</code>"</td>
</tr>
</table>

<div class="callout info">
<div class="callout-title">The Two-Layer Pattern Applies Here Too</div>
<p>Model names change. "Opus," "Sonnet," and "Haiku" are current as of March 2026. The principle is stable: <strong>match model capability to task complexity.</strong> Use the most capable model for ambiguous or high-stakes work; use faster models for well-defined, mechanical tasks. Check <a href="https://docs.anthropic.com/en/docs/about-claude/models">docs.anthropic.com/models</a> for the current lineup.</p>
</div>

<p><strong>When in doubt, use the mid-tier model.</strong> It handles 80% of development tasks well. Escalate to the highest tier only when the task is ambiguous, touches many files, or requires architectural judgment. Drop to the lightweight tier for bulk operations where you'd review the output regardless.</p>
```

- [ ] **Step 3: Verify**

1. Subsection appears after the existing multi-model dispatch mention in Ch 25
2. Two-layer pattern is used (enduring concept + current example)
3. TaskForge is referenced in examples (maintains spine project rule)
4. No forward references — reader already knows TaskForge, Flask, SQLite, tests from prior phases
5. File stays reasonable (currently 1179 lines + ~35 = ~1214; tight but similar to phase-1 at 1206)

---

## Chunk 6: Infrastructure Files (CHANGELOG, README, CONTRIBUTING)

### Task 6: Create CHANGELOG.md

**Problem (from eval):** "No formal CHANGELOG."

**Files:**
- Create: `CHANGELOG.md` (repository root)

**Steps:**

- [ ] **Step 1: Create the file**

```markdown
# Changelog

All notable changes to this project are documented here.

## [1.0.0] — 2026-03-15

### Added
- Complete 28-chapter curriculum across 6 phases
- Landing page (index.html) with phase overview and terminal hero art
- Phase files: phase-1.html through phase-6.html + appendices.html
- Design system CSS extracted and adapted from reference
- Interactive platform: Pyodide runner, Ace Editor, quiz engine, exercise runner
- Theme toggle (light/dark) with localStorage persistence
- Sidebar navigation with scroll tracking across all files
- TaskForge v0.1 spine project source code
- Appendices: Glossary, Prompt Library, Self-Assessment Quiz, Common Mistakes by Level, Troubleshooting, Resources

### Infrastructure
- Shared JS: theme.js, sidebar.js, shared.js, progress.js, ace-init.js, pyodide-runner.js, quiz.js, exercise-runner.js
- SVG diagrams using design system CSS variables (1+ per chapter)
- WCAG 2.1 AA compliance (contrast, keyboard nav, alt text)
- Responsive design at 700px and 900px breakpoints

## [1.1.0] — 2026-03-17

### Added
- Evaluation framework (docs/eval-framework.md)
- Evaluation results (docs/EVAL-RESULTS.md)
- This improvement plan (docs/EVAL-IMPROVEMENT-PLAN.md)

### Changed
- (Pending: improvements from EVAL-IMPROVEMENT-PLAN.md)
```

---

### Task 7: Create README.md

**Problem (from eval):** No README means no entry point for new visitors. The eval framework's process checklist starts with "Read the README end-to-end."

**Files:**
- Create: `README.md` (repository root)

**Steps:**

- [ ] **Step 1: Create the file**

```markdown
# Zero to Hero: Programming to Multi-Agent Claude Code

A complete programming curriculum that takes learners from zero coding experience to orchestrating AI agent teams with Claude Code.

## What This Is

A multi-file HTML course (28 chapters, 6 phases, appendices) with:
- 85+ interactive exercises (Python runs in the browser via Pyodide)
- A spine project (TaskForge) that grows across all 28 chapters
- An 8-level framework for AI-assisted development mastery
- Built-in quizzes, phase gates, and self-assessment tools

## Who This Is For

People with **zero programming experience** who want to learn programming fundamentals AND AI-assisted development with Claude Code. This is not a "prompt engineering" course — it teaches real programming first (Phases 1–4), then AI tool usage (Phases 5–6).

## What This Is NOT

- Not a quick-start guide for Claude Code (that's Phase 5, Chapter 20)
- Not a prompt engineering tutorial
- Not a course that assumes you already know how to code
- Not dependent on any specific IDE or paid tool (exercises run in your browser)

## Quick Start

1. Clone or download this repository
2. Open `src/index.html` in any modern browser
3. Start with Phase 1, Chapter 1

No build step. No install. No server required. All exercises run client-side via Pyodide.

For the full development environment (Python, Node.js, Claude Code), follow the setup guide in Phase 1, Chapter 3.

## Structure

```
src/
  index.html          — Landing page
  phase-1.html        — Foundations (Ch 01–04)
  phase-2.html        — Python (Ch 05–09)
  phase-3.html        — Dev Tools (Ch 10–12)
  phase-4.html        — Building & Deploying (Ch 13–18)
  phase-5.html        — AI-Assisted Dev, Levels 1–5 (Ch 19–23)
  phase-6.html        — Advanced Orchestration, Levels 6–8 (Ch 24–28)
  appendices.html     — Glossary, Prompt Library, Self-Assessment, Troubleshooting
  css/design-system.css
  js/                 — Theme, sidebar, exercise runners
docs/
  PROGRESS.md         — Build tracker
  DECISIONS.md        — Design decisions log
  EVAL-RESULTS.md     — Course evaluation (scored against eval-framework.md)
```

## Evaluation

This course has been evaluated against a structured framework (see `docs/eval-framework.md`).

**Current score: 4.23 / 5.00** (Strong — "Has gaps but delivers real value")

Top scores: Curriculum Architecture (4.5), Pedagogical Quality (4.5), Projects & Exercises (4.5), Claude Code Depth (4.5). See `docs/EVAL-RESULTS.md` for details.

## License

[Add your license here]
```

---

### Task 8: Create CONTRIBUTING.md

**Problem (from eval):** "No CONTRIBUTING.md or CODE_OF_CONDUCT.md found."

**Files:**
- Create: `CONTRIBUTING.md` (repository root)

**Steps:**

- [ ] **Step 1: Create the file**

```markdown
# Contributing

Contributions are welcome. This document explains how to contribute effectively.

## What We Need Help With

- **Typos and broken links** — always welcome, no discussion needed
- **Troubleshooting entries** — if you hit a setup issue not covered in Appendix D, describe the symptom, cause, and fix
- **Exercise improvements** — better hints, additional test cases, clearer prompts
- **Accessibility fixes** — missing alt text, keyboard nav issues, contrast problems

## How to Contribute

1. Open an issue describing what you'd like to change and why
2. Fork the repository
3. Make your changes in a feature branch
4. Open a pull request referencing the issue

## Constraints

All contributions must follow the rules in `CLAUDE.md`:

- **No new CSS or JS files.** All styles use `src/css/design-system.css`. All scripts use existing files in `src/js/`.
- **No frameworks.** HTML, vanilla CSS, vanilla JS only.
- **No inline styles** except inside SVG diagrams.
- **Sidebar must be identical** across all phase files (except same-page anchors).
- **Every chapter references TaskForge** at least once.
- **No forward references.** Don't use a concept before its introduction chapter.
- **Max 5 new technical terms per chapter.**

## What We Won't Merge

- New JavaScript or CSS frameworks
- AI-generated content that hasn't been manually reviewed and tested
- Changes that break the browser-based exercises (test in Chrome and Firefox before submitting)
- Content that says "just trust the AI" or skips verification steps

## Code of Conduct

Be respectful. This is a learning resource for beginners. Questions are welcome. Condescension is not.
```

---

## Post-Implementation Checklist

After all 8 tasks are complete:

- [ ] **File size check:** Run `wc -l src/*.html` — no file should exceed 1250 lines
- [ ] **Sidebar consistency:** If any sidebar was modified, run `grep -c "toc-group" src/*.html` to verify all files match
- [ ] **Forward reference check:** Read each new callout and verify it only references chapters the learner has already completed at that point
- [ ] **Browser test:** Open each modified HTML file in a browser; verify new content renders correctly in both light and dark themes
- [ ] **Link check:** Verify any cross-file references (e.g., "Ch 03" in the Phase 2 prerequisite callout) point to correct anchors
- [ ] **Update CHANGELOG.md:** Log all changes under `[1.1.0]`
- [ ] **Update PROGRESS.md:** Add a new session entry documenting the eval-driven improvements
- [ ] **Commit:** `eval-improvements: address gaps from eval-framework scoring`

---

## What NOT to Change

The eval identified these as strengths. Do not modify them:

- **Verification-first pedagogy** — the "trust but verify" philosophy throughout Phases 1–5
- **TaskForge spine project** — the compounding project structure
- **Phase gate system** — concrete deliverables between phases
- **Error handling as pedagogy** — intentional bugs in exercises
- **The 8-level framework** — the progression from tab-complete to agent teams
- **Guardrails-first approach** — the non-determinism / constraints philosophy
- **Progressive disclosure** — analogies before jargon, reading before writing
- **Two-layer tool references** — enduring concept + current example pattern

These are what make this course distinctive. Protect them.
