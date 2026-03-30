# Audit Round 5 — Post iTerm2/tmux/Hotkeys Additions

## Overall Rating: 9.6 / 10

The curriculum is comprehensive, pedagogically sound, technically accurate, and well-structured. The iTerm2, tmux, and hotkeys additions are detailed, correctly placed (iTerm2 in Ch03 environment setup, tmux in Ch09 advanced terminal), and technically accurate. All 21 chapters have required elements. Six specific issues remain.

---

## Verification Summary

| Check | Status | Count |
|-------|--------|-------|
| "Why This Matters Now" callouts | PASS | 21/21 chapters |
| Phase bridges | PASS | 4/4 + LLM bridge + multi-agent bridge |
| Phase recaps ("What You Can Now Do") | PASS | 5/5 gates |
| TaskForge references | PASS | 21/21 chapters (18 "TaskForge Connection" + 3 inline) |
| Diagrams per chapter | PASS | 21/21 (all have at least 1) |
| Exercises per chapter | PASS | 21/21 |
| "Try This Now" exercises | PASS | 21/21 |
| Div tag balance | PASS | All 7 files: 0 imbalance |
| No inline styles outside SVG | PASS | Clean |
| Footer dates consistent | PASS | All "March 2026" |
| Sidebar links complete | PASS | All 21 chapters + 3 appendix links in every file |

---

## Issues Found

### 1. HTML Bug: Unclosed `<p>` tag (phase-3.html:480)
**Severity:** Medium (invalid HTML)
**File:** `phase-3.html` line 480
**Problem:** The paragraph describing APIs is missing its closing `</p>` before the next `<div>` block.
```html
<!-- CURRENT (broken) -->
<p>An <strong>API</strong>...the API handles the communication.

<div class="callout info">

<!-- SHOULD BE -->
<p>An <strong>API</strong>...the API handles the communication.</p>

<div class="callout info">
```
**Fix:** Add `</p>` at end of line 480.

### 2. Missing micro-win pull quotes (6 chapters)
**Severity:** Low-Medium (pedagogical consistency gap)
**Chapters missing:** Ch04, Ch14, Ch15, Ch16, Ch17, Ch20
**Problem:** These chapters have "Try This Now" exercises but no micro-win `<div class="pq">` after them. The 15-improvement spec called for micro-wins after all exercises. 15/21 chapters have them; 6 don't.
**Fix:** Add pull quotes after each chapter's closing `</div>` of the "Try This Now" callout.

### 3. Sidebar formatting inconsistency (cosmetic)
**Severity:** Low (renders identically, violates CLAUDE.md rule #11)
**Files:** phase-3.html and phase-4.html use compressed single-line formatting; other files use expanded formatting with indentation.
**Fix:** Not critical. Flag only — fixing would be a large diff for zero visual change.

### 4. iTerm2 section missing "Current Tool" date marker
**Severity:** Low (inconsistency with tool reference pattern)
**File:** `phase-1.html` Ch03 iTerm2 section
**Problem:** Other tool introductions use the two-layer pattern with a "Current Tool (March 2026)" callout. iTerm2 has a "Why Bother?" callout but no date marker.
**Fix:** Add a `callout info` with "Current Tool (March 2026)" marker for iTerm2.

### 5. tmux section missing "Current Tool" date marker
**Severity:** Low (same pattern inconsistency)
**File:** `phase-3.html` Ch09 tmux section
**Problem:** Same as #4 — tmux introduction lacks the "Current Tool (March 2026)" marker.
**Fix:** Add a `callout info` with "Current Tool (March 2026)" marker for tmux.

### 6. Ch04 "Try This Now" lacks troubleshooting for common error
**Severity:** Very Low (minor completeness)
**File:** `phase-1.html` Ch04 exercise
**Problem:** The exercise asks users to analyze TaskForge code but doesn't mention they can run `python3 taskforge.py` to verify their analysis. The exercise is "read and analyze" only, which is appropriate for Ch04, but a note about running the code to verify predictions would strengthen verifiability.
**Fix:** Not strictly necessary — the exercise is analysis-focused by design. Skip.

---

## Improvements to Execute

1. Fix unclosed `<p>` tag in phase-3.html line 480
2. Add 6 missing micro-win pull quotes (Ch04, Ch14, Ch15, Ch16, Ch17, Ch20)
3. Add "Current Tool" date markers for iTerm2 (phase-1.html) and tmux (phase-3.html)
4. Skip sidebar formatting fix (cosmetic only)
5. Skip Ch04 exercise note (intentional design)
