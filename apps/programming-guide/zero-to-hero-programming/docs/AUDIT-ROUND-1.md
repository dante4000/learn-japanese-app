# Audit Round 1 — Full Cross-Check

## Overall Rating: 8.2 / 10

Strong pedagogical content across all 21 chapters. Every chapter has diagrams, exercises, Try This Now sections with verification/troubleshooting, and TaskForge references. The main gaps are CSS rule violations (inline styles) and some missing spec content in Phase 3.

---

## CRITICAL: Must Fix

### C1. Inline styles outside SVG (ALL FILES)
**Rule violated:** CLAUDE.md #10 — "No inline styles except inside SVG diagrams"
- `style="min-height:40vh"` on `.hero` section in all 6 phase/appendix files
- `style="margin-top:.4rem;opacity:.5"` on footer `<p>` in all 7 files
- `style="font-family:...;font-size:...;color:...;margin:...;font-weight:..."` on `<h2>` in index.html
- `style="margin:3rem 0"` on `.pq` in index.html
**Fix:** Add CSS rules to design-system.css, remove all inline styles from HTML

### C2. Chapter 21 has only 1 exercise (needs 2+)
**Rule violated:** Quality Bar — "Every chapter has at least 1 diagram and 1 exercise" (and spec shows 2 micro-exercises per chapter)
**Fix:** Add a second micro-exercise to Ch21

---

## HIGH: Should Fix

### H1. Phase 3 missing content vs spec
- **Ch09:** Missing `head`/`tail` in essential commands table; missing shell scripting basics (shebang `#!/bin/bash`); missing SSH basics
- **Ch11:** Missing Anthropic API explanation ("This is what Claude Code does under the hood" — critical for Phase 4 context)
- **Ch12:** Missing databases conceptual section (SQL vs NoSQL, ORMs); missing Python vs Node.js project comparison

### H2. Technical term count exceeds 5 per chapter
- Ch02: ~11 terms (data types grouped in table)
- Ch10: ~9 terms
- Ch11: ~8 terms
- Ch12: ~11 terms
- Ch13: ~8 terms
- Ch19: ~6 terms
**Assessment:** Many are unavoidable for foundational chapters. Not fixable without removing essential content. Accept and note in pedagogy docs.

### H3. Two-layer tool reference pattern missing in Phase 3
- Ch09-12 discuss tools (git, requests, Flask) without clear Layer 1 (enduring concept) / Layer 2 (current tool) separation
**Fix:** Add `.callout.info` boxes with "Current Tool (March 2026)" markers where tools are introduced

---

## LOW: Nice to Have

### L1. Sidebar formatting inconsistency
- Phase-4 sidebar HTML is minified (single line per group)
- Other files use multi-line formatting
**Assessment:** Cosmetic only, no functional impact. Skip.

### L2. SVG inline styles (font-weight, font-size)
- Multiple SVGs use inline `style="font-size:10px"` etc.
- Technically permitted (inside SVG) but inconsistent
**Assessment:** Accept as SVG exception per build rules.

---

## Execution Plan

1. [x] Add CSS rules to design-system.css for hero min-height, footer meta, index h2, pq margin
2. [x] Remove inline styles from ALL 7 HTML files
3. [x] Add second micro-exercise to Ch21
4. [x] Add missing content to Ch09 (head/tail, shell scripting basics)
5. [x] Add Anthropic API paragraph to Ch11
6. [x] Add databases conceptual paragraph to Ch12
7. [x] Add two-layer tool callouts to Phase 3 chapters (git, requests, Flask)
