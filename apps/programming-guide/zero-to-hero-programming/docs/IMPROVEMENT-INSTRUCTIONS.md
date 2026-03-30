# Improvement Instructions — Iteration 2

> **Generated:** 2026-03-17
> **Source:** Comprehensive content quality analysis of Phases A-D additions
> **Total fixes:** 20 (6 high priority, 6 medium priority, 8 low priority)

---

## High Priority (accuracy/confusion risks)

### Fix 1: Forward reference in decorators section
**File:** phase-2.html, ~line 1306
**Issue:** Text says "You've already seen decorators -- @app.route() in Flask, @staticmethod in classes, @pytest.fixture in tests." None of these have been introduced yet.
**Fix:** Change to "You'll see decorators constantly in later chapters -- @app.route() in Flask, @staticmethod in classes, @pytest.fixture in tests. Here's how they work under the hood."

### Fix 2: Hash table collision strategy contradiction
**File:** appendices.html, Appendix F section F.4
**Issue:** Text says "Python handles this with open addressing" but exercise implements chaining. No explanation of the difference.
**Fix:** Add after the open addressing sentence: "For simplicity, the exercise below uses chaining (each slot holds a list of pairs), which is easier to implement. Python's actual dict uses open addressing, which is more memory-efficient."

### Fix 3: BST glossary entry wrong chapter
**File:** appendices.html, glossary
**Issue:** "Binary search tree" says "App G" but BSTs are covered in Appendix F, section F.5.
**Fix:** Change "App G" to "App F".

### Fix 4: "3 subtle bugs" claim but only 1 bug
**File:** phase-5.html, ~line 247
**Issue:** Exercise prompt says "3 subtle bugs" but the AI-generated code has only 1 bug (indentation).
**Fix:** Change "3 subtle bugs" to "a subtle bug" or add 2 more actual bugs to the starter code.

### Fix 5: Port-in-use troubleshooting in wrong phase
**File:** appendices.html, troubleshooting section
**Issue:** "Port already in use" card is under Phase 3 but references Flask (Phase 4 topic).
**Fix:** Move the ts-card from Phase 3 section to Phase 4 section.

### Fix 6: Phase 4 troubleshooting contains Phase 5 content
**File:** appendices.html, troubleshooting section
**Issue:** "Phase 4 Issues" header but all cards are about Claude Code (Phase 5 topic).
**Fix:** Rename the section header to "Phase 4-5 Issues" or split into separate Phase 4 and Phase 5 sections.

---

## Medium Priority (pedagogy improvements)

### Fix 7: Lambda assigned to variable
**File:** phase-2.html, ~line 433
**Issue:** `square = lambda x: x ** 2` violates PEP 8. Should show lambda used inline.
**Fix:** Add note: "In practice, PEP 8 recommends using def for named functions. Lambda shines as an inline argument: sorted(names, key=lambda n: len(n))."

### Fix 8: Missing functools.wraps mention
**File:** phase-2.html, decorators section (~line 1310)
**Issue:** Timer decorator and exercises don't mention @functools.wraps.
**Fix:** Add brief callout: "Production decorators should also use @functools.wraps(func) to preserve the original function's name and docstring. We skip that for simplicity here."

### Fix 9: Scraping exercise is pre-solved
**File:** phase-4.html, ~line 451-525
**Issue:** The HTMLParser exercise starter code is complete — student just clicks Run.
**Fix:** Remove the handle_starttag body from starter code so students must implement it. Keep handle_data as scaffolding.

### Fix 10: Duplicate flatten exercise
**File:** appendices.html, Appendix G (~line 2060)
**Issue:** Nearly identical to Ch06 Solve & Compare flatten exercise.
**Fix:** Differentiate by adding a depth-limit parameter, or replace with a different recursion exercise (e.g., recursive tree height on a BST).

### Fix 11: Spec-driven section buried after exercises
**File:** phase-5.html, ~line 822
**Issue:** The spec-driven workflow appears after Ch22's exercises. Reader might stop before reaching it.
**Fix:** Add a callout near the top of Ch22 saying "This chapter covers compounding engineering AND the spec-driven workflow for AI-assisted development."

### Fix 12: CSV Solve & Compare clarity
**File:** phase-2.html, ~line 1630-1647
**Issue:** AI solution would fail the mixed-keys test but this isn't explicitly stated.
**Fix:** Add to the evaluation: "Note: the AI's solution would actually fail the mixed-keys test above. That's the point — always run the tests."

---

## Low Priority (polish)

### Fix 13: Inconsistent glossary chapter numbering
**File:** appendices.html, glossary
**Issue:** Mix of "Ch 05" and "Ch 5" formats.
**Fix:** Standardize all to zero-padded "Ch 05" format.

### Fix 14: Awkward hash table definition
**File:** appendices.html, glossary
**Issue:** "data-value storage structure" is unclear.
**Fix:** Change to "A data structure that maps keys to values using hash functions for O(1) average-case lookup."

### Fix 15: Missing space in decorator definition
**File:** appendices.html, glossary
**Issue:** "@syntax" should be "`@` syntax".
**Fix:** Change "applied with the @syntax" to "applied with the @ syntax".

### Fix 16: Duplicate API demo
**File:** phase-4.html, ~line 219 vs 267
**Issue:** Both demos fetch the same endpoint (github users/octocat).
**Fix:** Differentiate the first demo (e.g., show HTTP status code in output) or remove it.

### Fix 17: BeautifulSoup not in dependency policy
**File:** phase-4.html, ~line 429
**Issue:** bs4 not listed in CLAUDE.md dependency policy.
**Fix:** Add a note in the section: "BeautifulSoup (pip install beautifulsoup4) is an optional dependency not required for the curriculum exercises."

### Fix 18: No Phase 6 troubleshooting
**File:** appendices.html, troubleshooting section
**Issue:** No troubleshooting cards for Phase 6 multi-agent topics.
**Fix:** Add 1-2 cards: "Agent teams producing conflicting file changes", "Background agent timeout".

### Fix 19: No TaskForge reference in Appendix G
**File:** appendices.html, Appendix G
**Issue:** Missing required TaskForge connection.
**Fix:** Add: "In TaskForge, sorting tasks by priority or due date uses exactly these algorithms under the hood."

### Fix 20: No CSS mention in frontend section
**File:** phase-4.html, ~line 991
**Issue:** "Connecting a Frontend" section has no CSS mention.
**Fix:** Add a brief paragraph: "CSS controls how your HTML looks. AI generates CSS well — you mainly need to read it, not write it from scratch. The key concept: a CSS file linked via <link> in your HTML applies styles by matching selectors to elements."

---

## Execution Order

Execute fixes 1-6 (high priority) first, then 7-12 (medium), then 13-20 (low). Verify after each batch.
