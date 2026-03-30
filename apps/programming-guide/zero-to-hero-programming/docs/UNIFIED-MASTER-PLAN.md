# Unified Master Plan: Combined Implementation of All Three Plans

> **Purpose:** This document is the single source of truth for implementing all changes across Plan 1 (Appendix Overhaul), Plan 2 (Eval-Driven Fixes), and Plan 3 (Deep CS Foundations). It resolves collisions, establishes execution order, and persists across sessions.
>
> **High-Level Goal:** Transform the Zero-to-Hero curriculum from a strong 4.23/5 score to an exceptional 4.5+ score while adding deep CS foundations, interactive demos, improved navigation, and expanded resources. The end-state learner can spec, design, and build complex software systems with AI assistance — and understands what's happening under the hood.

---

## COLLISION RESOLUTIONS

### 1. appendices.html — All 3 Plans Touch This File

**Problem:** Plan 1 restructures the entire file into a tabbed navigation system. Plans 2 and 3 assume the OLD structure when describing insertion points.

**Resolution:** Execute Plan 1's restructuring FIRST. All subsequent changes to appendices.html must work within the new tabbed structure:
- Glossary is now `<div class="app-tab-panel" id="glossary">` with letter bar + search
- Prompt Library is now `<div class="app-tab-panel" id="prompt-library">` with phase sub-tabs
- Troubleshooting is now `<div class="app-tab-panel" id="appendix-d">` with accordion cards
- Resources is now `<div class="app-tab-panel" id="appendix-e">`
- New appendices F and G from Plan 3 need new tab buttons + tab panels

### 2. File Size Limits

**Problem:** Plan 2 follows the 1200-line CLAUDE.md limit. Plan 3 removes it.

**Resolution:** The 1200-line limit is removed for this implementation. If a phase file exceeds ~2000 lines after all additions, split it (e.g., `phase-2a.html`, `phase-2b.html`) and update ALL sidebars. Content goes where it pedagogically belongs.

### 3. design-system.css

**Problem:** CLAUDE.md says CSS is immutable. Plan 1 adds CSS classes.

**Resolution:** Plan 1's CSS additions are explicitly covered by Decision D005 (utility classes exception). This is the ONLY CSS change across all 3 plans. Plans 2 and 3 add HTML content only.

### 4. New JS Files

**Problem:** CLAUDE.md says shared JS lives in `src/js/`. Plan 1 creates `api-demo.js` and `appendix-tabs.js`.

**Resolution:** These are shared JS files in `src/js/`, not phase-specific JS. This is consistent with existing files like `quiz.js` and `exercise-runner.js`.

### 5. Sidebar Updates

**Problem:** Plan 3 adds Appendix F and G, requiring sidebar updates across ALL 8 HTML files. Plan 1's tab restructuring also requires sidebar links to point to tab IDs.

**Resolution:** Sidebar updates are a Phase D cross-cutting concern, done once after all content is added.

### 6. Glossary Terms

**Problem:** Plan 1 restructures glossary into alphabetical with letter bar. Plan 3 adds ~40 new terms.

**Resolution:** Plan 1's alphabetical restructuring goes first. Plan 3's new terms are inserted into the correct alphabetical positions within the letter-group structure.

---

## EXECUTION ORDER — FOUR PHASES

### Phase A: Infrastructure & Navigation Overhaul (Plan 1)

All of Plan 1 executes first because it restructures appendices.html and adds CSS/JS infrastructure that later changes depend on.

| Step | Source | Task | Files Modified |
|------|--------|------|----------------|
| A1 | P1-T1 | Add D005 utility CSS classes | design-system.css |
| A2 | P1-T2 | Create api-demo.js | src/js/api-demo.js (new) |
| A3 | P1-T3 | Add "Try it Live" buttons to phase-4 | phase-4.html |
| A4 | P1-T4 | Create appendix-tabs.js | src/js/appendix-tabs.js (new) |
| A5 | P1-T5 | Restructure glossary (alphabetical + letter bar) | appendices.html |
| A6 | P1-T6 | Restructure prompt library (phase sub-tabs) | appendices.html |
| A7 | P1-T7 | Wrap remaining sections as tab panels + troubleshooting accordions | appendices.html |
| A8 | P1-T8 | Integration check | All files (read-only) |

### Phase B: Eval-Driven Content Fixes (Plan 2)

All of Plan 2 executes second, adding content into the structures Plan 1 created.

| Step | Source | Task | Files Modified |
|------|--------|------|----------------|
| B1 | P2-T1 | Claude Code preview callout in Ch 03 | phase-1.html |
| B2 | P2-T2 | Claude Code install expected output in Ch 20 | phase-5.html |
| B3 | P2-T3 | Expand troubleshooting (rate limits, network, proxy) | appendices.html (into accordion cards) |
| B4 | P2-T4 | Per-chapter prerequisite callouts (Phases 2-6) | phase-2 thru phase-6.html |
| B5 | P2-T5 | Model selection subsection in Ch 25 | phase-6.html |
| B6 | P2-T6 | Create CHANGELOG.md | CHANGELOG.md (new) |
| B7 | P2-T7 | Create README.md | README.md (new) |
| B8 | P2-T8 | Create CONTRIBUTING.md | CONTRIBUTING.md (new) |

### Phase C: Deep CS Foundations & Expanded Content (Plan 3)

Plan 3's 10 tasks execute in the order specified, with content placed into the tab structure.

| Step | Source | Task | Files Modified |
|------|--------|------|----------------|
| C1 | P3-T1 | Data Structures Deep Dive (Appendix F) | appendices.html, phase-2.html |
| C2 | P3-T2 | Algorithms (Appendix G) | appendices.html, phase-2.html |
| C3 | P3-T3 | Higher-Order Functions + Decorators in Ch05/Ch07 | phase-2.html |
| C4 | P3-T4 | Curated Book Queue in Appendix E | appendices.html |
| C5 | P3-T5 | External Practice Platforms | appendices.html, phase-2/3/4.html |
| C6 | P3-T6 | Spec-Driven Development in Ch22 | phase-5.html, appendices.html |
| C7 | P3-T7 | Community Guides in Appendix E | appendices.html |
| C8 | P3-T8 | HTML/CSS Fundamentals in Ch14 | phase-4.html |
| C9 | P3-T9 | Web Scraping (Optional) in Ch13 | phase-4.html |
| C10 | P3-T10 | "Solve & Compare" exercises in Phase 2 | phase-2.html |

### Phase D: Cross-Cutting Concerns & Finalization

| Step | Task | Files Modified |
|------|------|----------------|
| D1 | Add Appendix F & G tab buttons to appendix-tabs.js tab bar | appendices.html |
| D2 | Sync sidebar across ALL 8 HTML files (add Appendix F, G links) | All HTML files |
| D3 | Add all new glossary terms (alphabetically into letter-group structure) | appendices.html |
| D4 | Update PROGRESS.md with all new sections | docs/PROGRESS.md |
| D5 | Update DECISIONS.md with non-obvious decisions | docs/DECISIONS.md |
| D6 | Update COMPONENT-REGISTRY.md with new components | docs/COMPONENT-REGISTRY.md |
| D7 | Update CHANGELOG.md with all changes | CHANGELOG.md |
| D8 | Full cross-file verification pass | All files |

---

## ITERATION PLAN

After full implementation, run 3 improvement iterations:

### Iteration 1: Stress Test & Validation
- Open every HTML file in browser (check rendering, both themes)
- Click every interactive element (demos, tabs, sub-tabs, accordions, exercises)
- Test all Pyodide exercises (Run + Check on each)
- Verify all internal links resolve
- Mobile responsive check at 700px
- Check console for JS errors

### Iteration 2: Analysis & Improvement Instructions
- Run complete analysis of all content
- Mark spots of improvement
- Generate improvement-instructions.md with actionable fixes
- Execute fixes from that document

### Iteration 3: Final Polish
- Re-run all verification checks
- Final quality pass on prose, formatting, consistency
- Update all documentation and progress tracking
- Generate final status report

---

## CONSTRAINTS THAT APPLY ACROSS ALL PHASES

1. **No new CSS files.** All styles in design-system.css (D005 additions only)
2. **No new JS frameworks.** Vanilla JS, IIFE pattern, ES5
3. **TaskForge referenced** in every new chapter-level section
4. **No forward references** — every concept introduced before use
5. **Max 5 new technical terms per chapter** (appendices exempt)
6. **Two-layer tool references** — enduring concept + current example
7. **Every diagram teaches one non-obvious concept** (no decorative SVGs)
8. **All Pyodide exercises** must run in browser without external imports
9. **WCAG 2.1 AA** compliance on all new content
10. **Reference file NEVER modified** (reference/fuso-hmi-reference.html)

---

## SESSION RECOVERY PROTOCOL

When resuming work in a new session:

1. Read this file (`docs/UNIFIED-MASTER-PLAN.md`) — the overarching plan
2. Read `docs/MASTER-PROGRESS-TRACKER.md` — see what's done and what's next
3. Read `docs/PROGRESS.md` — see build state
4. Read `docs/DECISIONS.md` — see prior decisions
5. Resume from the next uncompleted step in the progress tracker
