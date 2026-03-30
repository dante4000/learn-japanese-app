# Stress Test Results — Iteration 1

> **Date:** 2026-03-17
> **Scope:** Full cross-file verification of all 8 HTML files after Phase A-D implementation
>
> **Note:** This stress test covers phases 1-6 only (8 HTML files). The project has since been expanded to 10 phases (12 HTML files: phase-1.html through phase-10.html + index.html + appendices.html). Phases 7-10 have not yet been stress tested.

---

## I1.1 — HTML Rendering Verification

**Result: PASS (all 8 files)**

| File | Lines | Div Balance | Tags | Theme | Scripts |
|------|-------|-------------|------|-------|---------|
| index.html | 261 | 50/50 | PASS | PASS | 4 scripts |
| phase-1.html | 1,225 | 216/216 | PASS | PASS | 9 scripts |
| phase-2.html | 2,058 | 355/355 | PASS | PASS | 9 scripts |
| phase-3.html | 1,029 | 232/232 | PASS | PASS | 8 scripts |
| phase-4.html | 2,515 | 413/413 | PASS | PASS | 10 scripts |
| phase-5.html | 1,141 | 273/273 | PASS | PASS | 9 scripts |
| phase-6.html | 1,220 | 228/228 | PASS | PASS | 8 scripts |
| appendices.html | 2,136 | 385/385 | PASS | PASS | 10 scripts |

**Issue found and fixed:** appendices.html was missing Ace Editor CDN, pyodide-runner.js, ace-init.js, quiz.js, and exercise-runner.js script tags. Fixed during this iteration.

---

## I1.2 — Interactive Elements

**Result: PASS**

| File | Pyodide | Quizzes | Accordions | Tabs | API Demos |
|------|---------|---------|------------|------|-----------|
| phase-1.html | 4 | 4 | 1 | 0 | 0 |
| phase-2.html | 18 | 5 | 0 | 0 | 0 |
| phase-3.html | 1 | 9 | 0 | 0 | 0 |
| phase-4.html | 8 | 10 | 0 | 0 | 4 |
| phase-5.html | 5 | 7 | 0 | 0 | 0 |
| phase-6.html | 2 | 5 | 0 | 0 | 0 |
| appendices.html | 9 | 0 | 20+ | 8 | 0 |
| **Total** | **47** | **40** | **21+** | **8** | **4** |

---

## I1.3 — Pyodide Exercise Verification

**Result: PASS (47/47 exercises verified)**

All Phase C exercises (14 new) are fully correct:
- 5 Solve & Compare exercises (phase-2.html): 3+ asserts each, 3 hints, all structural elements
- 6 Appendix F exercises (appendices.html): valid Python, 3+ asserts, 3 hints
- 3 Appendix G exercises (appendices.html): valid Python, 4+ asserts, 3 hints

**Pre-existing notes (not from our changes):**
- `ch15-sql-guided`: Intentional run-only exercise (no test-code) — pedagogically valid
- `ch14-test-api`: Weak test validation (students write their own asserts)
- `ch01-hello`, `ch02-predict`: No hints — appropriate for beginner exercises

**No problematic imports found. No filesystem operations in Pyodide code. All starter code is syntactically valid Python.**

---

## I1.4 — Internal Link Resolution

**Result: PASS (316 links, 0 broken)**

All internal links verified:
- appendices.html#glossary, #prompt-library, #self-assessment, #common-mistakes, #appendix-d, #appendix-e, #appendix-f, #appendix-g — all resolve
- All chapter fragment links (#ch01 through #ch28) — all resolve
- All cross-file phase links — all resolve
- 48 external links to legitimate domains — all valid

---

## I1.5 — Mobile Responsive Check

**Result: PASS**

CSS design system includes:
- `@media (max-width: 900px)` — sidebar collapse
- `@media (max-width: 700px)` — content reflow, table horizontal scroll
- Appendix-specific responsive rules for tabs and sub-tabs
- No fixed pixel font sizes that would break on mobile

---

## I1.6 — JS Error Check

**Result: PASS (structural)**

All script references verified:
- 10 JS files in src/js/ — all referenced correctly
- Ace Editor CDN reference present in all files with exercises
- No orphan script references

---

## I1.7 — Exercise ID Uniqueness

**Result: PASS (106 unique IDs, 0 duplicates)**

All 106 data-ex values across 7 files are unique, both within files and across the project.

---

## Issues Fixed During This Iteration

1. **appendices.html missing script tags** — Added ace-init.js, pyodide-runner.js, quiz.js, exercise-runner.js, and Ace Editor CDN. Without these, the 9 Pyodide exercises in Appendix F and G would not function.

---

## Overall Iteration 1 Status: PASS

All critical checks pass. One issue found and fixed. No regressions from Phase A-D implementation.
