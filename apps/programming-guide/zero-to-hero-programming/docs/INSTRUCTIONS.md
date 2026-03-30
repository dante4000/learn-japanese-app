# Instructions: Changes Required from Comprehensive Review

> **Status: ALL CHANGES APPLIED** (2026-03-18)

Based on the comprehensive review conducted on 2026-03-18, the following changes have been applied. Tasks are organized by priority.

---

## Priority 1: Must Fix (Blocking)

### 1.1 Update `README.md`

- Change all references from "28 chapters, 6 phases" to **"47 chapters, 10 phases"**
- Add phases 7-10 to the structure/table-of-contents listing:
  - Phase 7: Engineering Craft (Ch 28-33)
  - Phase 8: Systems & Scale (Ch 34-37)
  - Phase 9: AI Levels 1-5 (Ch 38-42)
  - Phase 10: AI Levels 6-8 (Ch 43-47)
- Update the "What This Is" section and project description to reflect the full scope
- Replace the license placeholder on line 64 (`[Add your license here]`) with an actual license (recommend MIT or CC BY 4.0 for educational content)

### 1.2 Update `CHANGELOG.md`

- Add a new version entry (e.g., `[2.0.0]`) documenting the expansion from 28 chapters / 6 phases to 47 chapters / 10 phases. This is the single largest change in the project's history and is currently undocumented.
- Fix version ordering. Current incorrect order:
  ```
  [1.0.0] - 2026-03-15
  [1.2.0] - 2026-03-17
  [1.1.0] - 2026-03-17
  ```
  Correct order (newest-first):
  ```
  [2.0.0] - 2026-03-18
  [1.2.0] - 2026-03-17
  [1.1.0] - 2026-03-17
  [1.0.0] - 2026-03-15
  ```

### 1.3 Update `docs/PROGRESS.md`

- Add tracking rows for chapters 29-47
- Update the "Overall Status" section to reflect 47 total chapters
- Resolve Phase D task statuses (mark as complete where applicable)

### 1.4 Add a License

- Choose and apply a license in `README.md` (and optionally add a `LICENSE` file)
- Recommended: MIT for code, CC BY 4.0 for educational content

---

## Priority 2: Should Fix (Important)

### 2.1 Archive `zero-to-hero-programming-PRODUCTION.md`

- This is the earliest spec (21 chapters / 5 phases) and is fully obsolete
- Either move it to `docs/archive/` with a deprecation header at the top, or delete it entirely

### 2.2 Update `docs/EVAL-RESULTS.md`

- Add a disclaimer at the top stating that the 4.23/5 score was evaluated against the 28-chapter version only
- Note that phases 7-10 (chapters 28-47) have not been formally evaluated
- Optionally, conduct a new evaluation covering all 47 chapters

### 2.3 Audit Phases 7-10

- The 5 existing audit rounds only covered phases 1-6
- Chapters 28-47 need auditing for: quality, accuracy, accessibility, and completeness
- Consider conducting an AUDIT-ROUND-6 covering phases 7-10

### 2.4 Add Missing SVG `aria-label` Attributes

- Several SVG diagrams (particularly in `phase-1.html` and `phase-2.html`) lack descriptive `aria-label` attributes
- Review all SVG elements across all phase files and ensure each has a meaningful `aria-label`

### 2.5 Add Error Handling in `exercise-runner.js`

- At line 174, wrap `new RegExp(pattern, 'm')` in a try-catch block
- If the regex is invalid, display a user-friendly error instead of throwing an uncaught exception

---

## Priority 3: Nice to Have (Polish)

### 3.1 Accessibility Improvements

- Add `<caption>` elements to all data tables for screen reader support
- Add `role="note"` to `.callout` div elements

### 3.2 JavaScript Resilience

- Add user-facing error messages when Ace Editor or Pyodide CDNs fail to load (currently fails silently)
- Add a fetch timeout to `api-demo.js` to prevent hanging on slow connections
- Add debounce to the glossary search in `appendix-tabs.js` (currently iterates all entries per keystroke)

### 3.3 Documentation Cleanup

- Update `docs/DECISIONS.md` with entries beyond D010 to document decisions made during the phases 7-10 expansion
- Mark `docs/QA-CHECKLIST.md` as obsolete (superseded by audit rounds) or delete it
- Review `docs/REVIEW-AND-SUGGESTIONS.md` for factual errors and correct or remove them
- Update `CONTRIBUTING.md` to reference the correct 47-chapter / 10-phase scope
- Update `docs/PEDAGOGY-REVIEW.md` to cover phases 7-10
- Update `docs/COMPONENT-REGISTRY.md` to cover phases 7-10
- Update `docs/STRESS-TEST-RESULTS.md` to cover phases 7-10

### 3.4 Content Refinements

- Document the TaskForge version roadmap across phases (v0.1 progression to later versions)
- Add "Before You Begin" prerequisite callouts to phases 1 and 2 (currently inconsistent)
- Add a caveat to Phase 3, Ch 10 that shell hotkeys may differ in fish/PowerShell
- Clarify HTTP 4xx description in Phase 4, Ch 13 (401/403/429 are not always "you made a mistake")
- Add real-world motivation before introducing Big-O notation in Phase 5, Ch 19

---

## Summary

| Priority | Items | Impact |
|----------|-------|--------|
| Must Fix | 4 items | Brings documentation in sync with the actual project |
| Should Fix | 5 items | Improves accessibility, robustness, and audit coverage |
| Nice to Have | 13 items | Polish, resilience, and completeness |

The single most important takeaway: **the project itself is excellent (9/10 content quality), but the documentation is stuck at an earlier 28-chapter version**. Fixing Priority 1 items resolves this mismatch and brings the repository score from 7.5/10 to 9+/10.
