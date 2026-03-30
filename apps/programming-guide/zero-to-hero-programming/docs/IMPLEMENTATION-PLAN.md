# Implementation Plan: Review Suggestions

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 6 content improvements and 1 bug fix identified in `REVIEW-AND-SUGGESTIONS.md`, after validating each against the actual codebase.

**Architecture:** Each task edits a single HTML file by inserting new content blocks that follow the project's existing patterns exactly. No CSS, JS, or structural changes. All insertions use the same `<div class="exercise">`, `<div class="callout ok">`, `<div class="pq">`, and `<section>` patterns already established.

**Tech Stack:** HTML only. Pyodide exercises use `<script type="text/plain">` blocks with `.starter-code` and `.test-code` classes. Ace Editor auto-initializes via `data-type="pyodide"` attribute. No build step.

---

## Review Corrections (Do NOT Implement)

Before implementing, note that **7 of the 11 items** from the review's "Unresolved Items" table were verified as **already resolved or incorrect**:

| Review Claim | Actual Status | Evidence |
|---|---|---|
| Ch02 covers comparison/boolean operators (defer to Ch05) | **Already in Ch05.** Ch02 covers only variables, types, arithmetic, errors. | `phase-2.html:114-146` has the operators table inside Ch05 |
| Ch02 has temperature converter exercise (replace it) | **Does not exist.** Ch02 exercise is "Predict Then Verify" (variables + arithmetic). | `phase-1.html:398-428` |
| 6 missing micro-win pull quotes (Ch04, Ch14-17, Ch20) | **All exist.** | Ch04: `phase-1.html:948`, Ch14: `phase-4.html:710`, Ch15: `phase-4.html:1107`, Ch16: `phase-4.html:1419`, Ch17: `phase-4.html:1710`, Ch20: `phase-5.html:357` |
| Unclosed `<p>` tag at phase-3.html:480 | **No issue found.** Line 480 is inside a clean `<table>` block. | `phase-3.html:478-490` — all tags properly closed |
| No `<meta name="description">` tags on any page | **All 8 files have them.** | e.g. `phase-4.html:6` |
| Ch27 has no "when not to" content | **Partially exists.** Lines 720, 749, 837, and quiz at 872-874 address this. | Needs formalization, not creation from scratch |

**The review document (`REVIEW-AND-SUGGESTIONS.md`) should be updated** after implementation to correct these inaccuracies.

---

## Validated Implementation Items

| # | Task | File | Insertion Point | Est. Lines Added |
|---|---|---|---|---|
| 1 | "Evaluate AI Code" exercise in Ch09 | `phase-2.html` | After line 1345 (after existing "Debug Challenge" exercise) | ~45 |
| 2 | "Read an AI Agent's Git Diff" exercise in Ch12 | `phase-3.html` | After line 832 (after Ch12 "Try This Now") | ~50 |
| 3 | "Test Your API" exercise in Ch14 | `phase-4.html` | After line 736 (after Ch14 quizzes, before Pyodide exercise) | ~45 |
| 4 | Fix Phase-4 sidebar (add Troubleshooting/Resources links) | `phase-4.html` | After line 79 (inside Reference toc-group) | 2 |
| 5 | Add 2 more graduated "bad AI output" exercises in Ch19 | `phase-5.html` | After line 247 (after existing "Find the AI's Bugs") | ~80 |
| 6 | Formalize "When NOT to Multi-Agent" section in Ch27 | `phase-6.html` | After line 834 (after decision tree diagram) | ~40 |
| 7 | Add "Common Mistakes by Level" appendix + update all sidebars | `appendices.html` + all 7 HTML files | After line 708 (after Self-Assessment) | ~90 + 7 lines across files |

---

## Chunk 1: Phase 2 — Ch09 AI Code Evaluation Exercise

### Task 1: Add "Evaluate AI-Generated Code" Pyodide exercise to Ch09

**Context:** Ch09 teaches error handling, debugging, and testing. It already has a "Debug Challenge" exercise (lines 1302-1345) where the reader fixes bugs in a function. The new exercise reframes the same skill as "evaluating AI output" — the reader receives deliberately flawed AI-generated code and must identify the issues. This bridges Phase 2's writing skills directly to Phase 5's evaluation skills.

**Files:**
- Modify: `src/phase-2.html:1345` (insert after the closing `</div>` of the "Debug Challenge" exercise)

**Constraint check:** Phase-2 is already ~1450 lines. Adding ~45 lines brings it to ~1495. This exceeds the 1200-line guideline in CLAUDE.md but is consistent with the file's existing state (it was already over before this change).

- [ ] **Step 1: Read `phase-2.html` lines 1340-1400 to confirm exact insertion point**

Run: Read `src/phase-2.html` lines 1340-1400.

Expected: Line 1345 is the closing `</div>` of the "Debug Challenge: Fix the Test Suite" exercise. The "Retry Decorator" exercise follows at line 1347.

Insertion point: **After line 1345** (between the two existing exercises).

- [ ] **Step 2: Insert the new Pyodide exercise**

Insert the following HTML after line 1345 in `src/phase-2.html`:

```html

<div class="exercise" data-type="pyodide" data-ch="09" data-ex="ai-eval">
  <div class="exercise-header">
    <h4>Evaluate AI-Generated Code</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt">An AI was asked: "Write a function to calculate the average of a list of numbers." Below is what it generated. It has 3 problems: a crash on empty input, an incorrect return type, and an unnecessary import. Find and fix all three.</p>
  <div class="exercise-editor">
    <script type="text/plain" class="starter-code">
import math

def calculate_average(numbers):
    """AI-generated: Calculate the average of a list of numbers."""
    total = math.fsum(numbers)
    average = total / len(numbers)
    return str(round(average, 2))

# Test it:
print(calculate_average([10, 20, 30]))  # Should print 20.0
print(calculate_average([]))             # Should handle empty list
</script>
    <script type="text/plain" class="test-code">
assert calculate_average([10, 20, 30]) == 20.0, "Basic average"
assert calculate_average([]) is None, "Empty list returns None"
assert calculate_average([7]) == 7.0, "Single element"
assert isinstance(calculate_average([1, 2]), float), "Must return float, not string"
</script>
  </div>
  <div class="exercise-controls">
    <button class="ex-run">Run</button>
    <button class="ex-check">Check</button>
    <button class="ex-hint" data-level="0">Hint</button>
    <button class="ex-reset">Reset</button>
  </div>
  <div class="exercise-output"></div>
  <div class="exercise-tests"></div>
  <div class="exercise-hints">
    <p class="hint">What happens when <code>numbers</code> is empty? <code>len(numbers)</code> is 0, and dividing by 0 crashes.</p>
    <p class="hint">The function returns <code>str(...)</code> but the tests expect a <code>float</code>. Remove the <code>str()</code> wrapper.</p>
    <p class="hint"><code>math.fsum</code> works but <code>sum()</code> is simpler and doesn't require an import. The AI over-engineered this.</p>
  </div>
</div>
```

- [ ] **Step 3: Verify the insertion**

Run: Read `src/phase-2.html` around the insertion point.

Verify:
1. The new exercise appears between "Debug Challenge" and "Retry Decorator"
2. `data-ch="09"` and `data-ex="ai-eval"` are unique (no other exercise in the file uses `data-ex="ai-eval"`)
3. The `<script type="text/plain">` blocks are intact (no HTML entity encoding issues with `<`, `>`, or `&`)
4. Opening the file in a browser shows the exercise with editor, Run/Check/Hint/Reset buttons

- [ ] **Step 4: Browser test**

Open `src/phase-2.html` in a browser. Scroll to Ch09 Interactive Exercises.

Verify:
1. "Evaluate AI-Generated Code" exercise appears with Ace Editor
2. Clicking "Run" shows output (including the ZeroDivisionError for the empty list)
3. Clicking "Check" shows failing tests until bugs are fixed
4. Clicking "Hint" reveals hints progressively
5. After fixing all 3 bugs, clicking "Check" shows all tests pass

---

## Chunk 2: Phase 3 — Ch12 Git Diff Reading Exercise

### Task 2: Add "Read an AI Agent's Git Diff" exercise to Ch12

**Context:** Ch12 teaches Git remotes, PRs, and collaboration. The existing exercises are standard Git practice (fork, clone, push, PR). The new exercise teaches diff-reading — a specific form of code reading that the reader will need in Phase 5 when reviewing AI agent output. The exercise presents a `git diff` from an AI agent and asks the reader to identify correct changes, unrelated changes, and how to revert.

**Files:**
- Modify: `src/phase-3.html:832` (insert after Ch12 "Try This Now" closing `</div>`)

**Note:** Phase-3 is ~950 lines. Adding ~50 lines brings it to ~1000, within the 1200-line limit.

- [ ] **Step 1: Read `phase-3.html` lines 828-845 to confirm exact insertion point**

Run: Read `src/phase-3.html` lines 828-845.

Expected: Line 832 is the closing `</div>` of Ch12's "Try This Now" exercise. A `<div class="pq">` micro-win pull quote should follow.

Insertion point: **After the micro-win pull quote that follows the "Try This Now"** (find the `<div class="pq">` after line 832 and insert after its closing `</div>`). If no pull quote exists after this "Try This Now", insert directly after line 832.

- [ ] **Step 2: Insert the new exercise**

Insert the following HTML at the identified insertion point (after the pull quote or after line 832):

```html

<div class="callout info">
<div class="callout-title">Reading Diffs: A Preview of AI Supervision</div>
<p>In Phase 5, you'll review <code>git diff</code> output from AI agents every day. The format below is the same one Git uses when you run <code>git diff</code>. Lines starting with <code>+</code> were added. Lines starting with <code>-</code> were removed. The <code>@@</code> line shows where in the file the change happened. Practice reading this now&mdash;it's the same skill, just a different context.</p>
</div>

<div class="exercise" data-type="pyodide" data-ch="12" data-ex="diff-review">
  <div class="exercise-header">
    <h4>Review an AI Agent's Diff</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt">An AI agent was asked: "Add error handling to the <code>delete_task</code> function." Below is the diff it produced. Read it carefully, then write a function <code>evaluate_diff()</code> that returns a dict with three keys: <code>"correct_changes"</code> (list of line numbers with valid error-handling additions), <code>"unrelated_change"</code> (the line number of a change that wasn't requested), and <code>"missing"</code> (a string describing what the agent forgot to handle).</p>
  <div class="exercise-editor">
    <script type="text/plain" class="starter-code">
# The AI's diff output:
DIFF = """
@@ -10,12 +10,14 @@ def delete_task(task_id, tasks):
-def delete_task(task_id, tasks):
-    for i, task in enumerate(tasks):
-        if task["id"] == task_id:
-            return tasks.pop(i)
-    return None
+def delete_task(task_id, tasks):
+    if not isinstance(task_id, int):
+        raise TypeError("task_id must be an integer")
+    for i, task in enumerate(tasks):
+        if task["id"] == task_id:
+            return tasks.pop(i)
+    return None

-def list_tasks(tasks):
+def list_tasks(tasks, verbose=False):
     return [t["title"] for t in tasks]
"""

def evaluate_diff():
    return {
        "correct_changes": [],       # Line numbers of valid error-handling additions
        "unrelated_change": 0,       # Line number of the change that wasn't asked for
        "missing": ""                # What error case did the agent forget?
    }

print(evaluate_diff())
</script>
    <script type="text/plain" class="test-code">
result = evaluate_diff()
assert isinstance(result, dict), "Must return a dict"
assert 12 in result["correct_changes"] or 13 in result["correct_changes"], "The TypeError check IS valid error handling"
assert result["unrelated_change"] == 19 or result["unrelated_change"] == 20, "list_tasks signature change was not requested"
assert "empty" in result["missing"].lower() or "none" in result["missing"].lower() or "list" in result["missing"].lower(), "Agent didn't handle empty tasks list"
</script>
  </div>
  <div class="exercise-controls">
    <button class="ex-run">Run</button>
    <button class="ex-check">Check</button>
    <button class="ex-hint" data-level="0">Hint</button>
    <button class="ex-reset">Reset</button>
  </div>
  <div class="exercise-output"></div>
  <div class="exercise-tests"></div>
  <div class="exercise-hints">
    <p class="hint">Lines with <code>+</code> are additions. The <code>isinstance</code> check is relevant error handling. But what about the <code>list_tasks</code> change?</p>
    <p class="hint">The agent was only asked to add error handling to <code>delete_task</code>. Changing <code>list_tasks</code> is scope creep&mdash;an unrelated change.</p>
    <p class="hint">What happens if <code>tasks</code> is <code>None</code> or not a list? The agent added a type check for <code>task_id</code> but forgot to validate <code>tasks</code> itself.</p>
  </div>
</div>
```

- [ ] **Step 3: Verify the insertion**

Run: Read `src/phase-3.html` around the insertion point.

Verify:
1. The new exercise appears in Ch12's section (between the "Try This Now" block and the Interactive Exercises `<h3>`)
2. `data-ch="12"` and `data-ex="diff-review"` are unique
3. The diff string inside the `<script>` block is not HTML-encoded (triple-quoted Python string should be preserved as-is inside `type="text/plain"`)
4. The info callout appears before the exercise as a pedagogical bridge

- [ ] **Step 4: Browser test**

Open `src/phase-3.html` in a browser. Scroll to Ch12.

Verify:
1. The info callout "Reading Diffs: A Preview of AI Supervision" appears
2. The Pyodide exercise renders with the diff string visible in the editor
3. Clicking "Run" executes without errors
4. Clicking "Check" validates the answer

---

## Chunk 3: Phase 4 — Ch14 API Testing Exercise + Sidebar Fix

### Task 3: Add "Test Your API" Pyodide exercise to Ch14

**Context:** Ch14 builds a Flask API. Ch09 taught pytest. But no exercise connects the two. This exercise has the reader write test assertions for API endpoint behavior, reinforcing testing habits before Phase 5.

**Files:**
- Modify: `src/phase-4.html:736` (insert after Ch14's second quiz, before the "Request Validator" Pyodide exercise at line 738)

- [ ] **Step 1: Read `phase-4.html` lines 732-745 to confirm exact insertion point**

Run: Read `src/phase-4.html` lines 732-745.

Expected: Line 736 is the closing `</div>` of the second quiz. Line 738 begins the "Request Validator" exercise.

Insertion point: **After line 736** (between the quiz and the existing Pyodide exercise).

- [ ] **Step 2: Insert the new Pyodide exercise**

Insert the following HTML after line 736 in `src/phase-4.html`:

```html

<div class="exercise" data-type="pyodide" data-ch="14" data-ex="test-api">
  <div class="exercise-header">
    <h4>Test Your API Endpoints</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt">Below is a simplified TaskForge API with <code>get_tasks()</code> and <code>add_task()</code>. Write 4 test functions that verify: (1) GET returns an empty list initially, (2) POST adds a task and returns 201, (3) POST without a title returns 400, (4) GET after adding returns the task. The test helpers <code>get(path)</code> and <code>post(path, data)</code> are provided.</p>
  <div class="exercise-editor">
    <script type="text/plain" class="starter-code">
# Simulated API (no Flask needed in browser)
tasks = []

def get(path):
    if path == "/tasks":
        return {"status": 200, "json": list(tasks)}
    return {"status": 404, "json": {"error": "not found"}}

def post(path, data=None):
    if path == "/tasks":
        if not data or not data.get("title"):
            return {"status": 400, "json": {"error": "title required"}}
        task = {"id": len(tasks) + 1, "title": data["title"], "status": "pending"}
        tasks.append(task)
        return {"status": 201, "json": task}
    return {"status": 404, "json": {"error": "not found"}}

# Write your tests below:
def test_get_empty():
    tasks.clear()
    pass  # Your assertion here

def test_add_task():
    tasks.clear()
    pass  # Your assertion here

def test_add_without_title():
    tasks.clear()
    pass  # Your assertion here

def test_get_after_add():
    tasks.clear()
    pass  # Your assertion here
</script>
    <script type="text/plain" class="test-code">
tasks.clear()
test_get_empty()
tasks.clear()
test_add_task()
tasks.clear()
test_add_without_title()
tasks.clear()
test_get_after_add()
</script>
  </div>
  <div class="exercise-controls">
    <button class="ex-run">Run</button>
    <button class="ex-check">Check</button>
    <button class="ex-hint" data-level="0">Hint</button>
    <button class="ex-reset">Reset</button>
  </div>
  <div class="exercise-output"></div>
  <div class="exercise-tests"></div>
  <div class="exercise-hints">
    <p class="hint"><code>test_get_empty</code>: call <code>get("/tasks")</code> and assert the status is 200 and the json is <code>[]</code>.</p>
    <p class="hint"><code>test_add_task</code>: call <code>post("/tasks", {"title": "Test"})</code> and assert status is 201 and the returned json has the title.</p>
    <p class="hint"><code>test_add_without_title</code>: call <code>post("/tasks", {})</code> and assert status is 400.</p>
  </div>
</div>
```

- [ ] **Step 3: Verify the insertion**

Run: Read `src/phase-4.html` around the insertion point.

Verify:
1. The new exercise appears between the quizzes and "Request Validator"
2. `data-ch="14"` and `data-ex="test-api"` are unique (no conflict with existing `data-ex="validate"`)
3. The simulated API functions work as pure Python (no Flask dependency — this runs in Pyodide)

- [ ] **Step 4: Browser test**

Verify in browser:
1. Exercise renders with starter code visible
2. Clicking "Run" works (no import errors since there's no Flask dependency)
3. Completing the 4 test functions and clicking "Check" passes all assertions

---

### Task 4: Fix Phase-4 sidebar — add missing Troubleshooting/Resources links

**Context:** All other phase files have 5 items in the Reference sidebar group: Glossary, Prompt Library, Self-Assessment, Troubleshooting, Resources. Phase-4 only has 3 (missing the last two).

**Files:**
- Modify: `src/phase-4.html:79` (inside the Reference `<div class="toc-group">`)

- [ ] **Step 1: Read `phase-4.html` lines 74-82 to confirm the sidebar structure**

Run: Read `src/phase-4.html` lines 74-82.

Expected: The Reference toc-group contains only Glossary, Prompt Library, and Self-Assessment links, then closes with `</div>`.

- [ ] **Step 2: Insert the two missing sidebar links**

Add the following two lines before the closing `</div>` of the Reference toc-group (after the Self-Assessment link, before the `</div>`):

```html
    <a href="appendices.html#appendix-d" class="toc-link"><span class="toc-num">&oplus;</span>Troubleshooting</a>
    <a href="appendices.html#appendix-e" class="toc-link"><span class="toc-num">&oplus;</span>Resources</a>
```

- [ ] **Step 3: Verify sidebar matches other files**

Run: Read `src/phase-3.html` lines 75-83 and compare with `src/phase-4.html` lines 75-85.

Expected: Both files now have identical Reference toc-group content: Glossary, Prompt Library, Self-Assessment, Troubleshooting, Resources.

---

## Chunk 4: Phase 5 — Ch19 Additional AI Bug Exercises

### Task 5: Add 2 more graduated "bad AI output" Pyodide exercises to Ch19

**Context:** Ch19 is the chapter that teaches evaluation of AI-generated code. It has a "Recognizing AI Failures" table listing 5 failure types (hallucinated imports, stale patterns, over-engineering, happy-path-only, confident wrongness) but only one interactive exercise (the `remove_duplicates` indentation bug at lines 210-247). Two more exercises will cover different failure types from the table.

**Files:**
- Modify: `src/phase-5.html:247` (insert after the existing "Find the AI's Bugs" exercise)

**Note:** Phase-5 is ~700-800 lines. Adding ~80 lines keeps it well under 1200.

- [ ] **Step 1: Read `phase-5.html` lines 244-270 to confirm exact insertion point**

Run: Read `src/phase-5.html` lines 244-270.

Expected: Line 247 is the closing `</div>` of the "Find the AI's Bugs" exercise. Lines 249+ begin the Knowledge Check quizzes.

Insertion point: **After line 247** (between the existing Pyodide exercise and the quizzes).

- [ ] **Step 2: Insert Exercise A — "Spot the Over-Engineering"**

This maps to the "Over-engineering" row in the Recognizing AI Failures table.

Insert after line 247:

```html

<div class="exercise" data-type="pyodide" data-ch="19" data-ex="over-engineered">
  <div class="exercise-header">
    <h4>Spot the Over-Engineering</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt">An AI was asked: "Write a function that checks if a string is a palindrome." It produced 25 lines. Write a simpler version called <code>is_palindrome_simple(s)</code> that does the same thing correctly in 3 lines or fewer (not counting the <code>def</code> line). Then write <code>evaluate()</code> returning a dict with <code>"problem"</code> (string describing what's wrong with the AI version) and <code>"lines_saved"</code> (integer).</p>
  <div class="exercise-editor">
    <script type="text/plain" class="starter-code">
# AI-generated version (25 lines):
import re
from functools import lru_cache

def is_palindrome_ai(s):
    """Check if string is palindrome with full Unicode support."""
    if not isinstance(s, str):
        raise TypeError(f"Expected str, got {type(s).__name__}")
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', s)
    cleaned = cleaned.lower()
    @lru_cache(maxsize=None)
    def _check(left, right):
        if left >= right:
            return True
        if cleaned[left] != cleaned[right]:
            return False
        return _check(left + 1, right - 1)
    if len(cleaned) == 0:
        return True
    return _check(0, len(cleaned) - 1)

# Your simpler version:
def is_palindrome_simple(s):
    pass

def evaluate():
    return {"problem": "", "lines_saved": 0}
</script>
    <script type="text/plain" class="test-code">
assert is_palindrome_simple("racecar") == True, "Basic palindrome"
assert is_palindrome_simple("hello") == False, "Not a palindrome"
assert is_palindrome_simple("A man a plan a canal Panama".replace(" ", "").lower()) == True, "Classic"
assert is_palindrome_simple("") == True, "Empty string is palindrome"
e = evaluate()
assert "over" in e["problem"].lower() or "complex" in e["problem"].lower() or "simple" in e["problem"].lower(), "Identify the over-engineering"
assert e["lines_saved"] >= 10, "Simple version saves significant lines"
</script>
  </div>
  <div class="exercise-controls">
    <button class="ex-run">Run</button>
    <button class="ex-check">Check</button>
    <button class="ex-hint" data-level="0">Hint</button>
    <button class="ex-reset">Reset</button>
  </div>
  <div class="exercise-output"></div>
  <div class="exercise-tests"></div>
  <div class="exercise-hints">
    <p class="hint">A palindrome reads the same forwards and backwards. Python can reverse a string with <code>s[::-1]</code>.</p>
    <p class="hint">The entire function can be: clean the string, lowercase it, compare to its reverse.</p>
    <p class="hint">The AI imported <code>re</code>, <code>functools</code>, used recursion with memoization, and added type checking&mdash;none of which were needed for a simple palindrome check.</p>
  </div>
</div>
```

- [ ] **Step 3: Insert Exercise B — "Happy Path Only"**

This maps to the "Happy path only" row in the Recognizing AI Failures table.

Insert immediately after Exercise A:

```html

<div class="exercise" data-type="pyodide" data-ch="19" data-ex="happy-path">
  <div class="exercise-header">
    <h4>Find the Missing Edge Cases</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt">An AI wrote <code>parse_config(text)</code> to parse <code>KEY=VALUE</code> config files. It works for valid input but crashes on 3 common edge cases. Write <code>test_edge_cases()</code> that calls <code>parse_config</code> with 3 different bad inputs and catches the failures. Then fix the function so all edge cases return sensible results instead of crashing.</p>
  <div class="exercise-editor">
    <script type="text/plain" class="starter-code">
# AI-generated:
def parse_config(text):
    """Parse KEY=VALUE config into a dict."""
    result = {}
    for line in text.split("\n"):
        key, value = line.split("=")
        result[key.strip()] = value.strip()
    return result

# Works fine for valid input:
print(parse_config("host=localhost\nport=8080"))

# TODO: Write test_edge_cases() that exposes 3 crashes,
# then fix parse_config to handle them.
def test_edge_cases():
    pass  # Test with: empty string, comment lines, lines without =
</script>
    <script type="text/plain" class="test-code">
assert parse_config("host=localhost\nport=8080") == {"host": "localhost", "port": "8080"}, "Valid input still works"
assert parse_config("") == {}, "Empty string returns empty dict"
assert parse_config("# comment\nhost=localhost") == {"host": "localhost"}, "Comment lines skipped"
assert parse_config("host=localhost\n\nport=8080") == {"host": "localhost", "port": "8080"}, "Blank lines skipped"
assert parse_config("host=local=host") == {"host": "local=host"}, "Values can contain ="
test_edge_cases()
</script>
  </div>
  <div class="exercise-controls">
    <button class="ex-run">Run</button>
    <button class="ex-check">Check</button>
    <button class="ex-hint" data-level="0">Hint</button>
    <button class="ex-reset">Reset</button>
  </div>
  <div class="exercise-output"></div>
  <div class="exercise-tests"></div>
  <div class="exercise-hints">
    <p class="hint">Try <code>parse_config("")</code>&mdash;it tries to split <code>""</code> on <code>=</code> and gets <code>[""]</code>, not <code>["key", "value"]</code>.</p>
    <p class="hint">Skip empty lines and lines starting with <code>#</code> before splitting on <code>=</code>.</p>
    <p class="hint">Use <code>line.split("=", 1)</code> to split on only the first <code>=</code>, so values containing <code>=</code> aren't broken.</p>
  </div>
</div>
```

- [ ] **Step 4: Verify both insertions**

Run: Read `src/phase-5.html` from the original exercise through the new ones and into the quizzes.

Verify:
1. Three Pyodide exercises now appear in sequence: "Find the AI's Bugs" (original), "Spot the Over-Engineering" (new), "Find the Missing Edge Cases" (new)
2. All three have unique `data-ex` values: `ai-bugs`, `over-engineered`, `happy-path`
3. All three use `data-ch="19"`
4. The Knowledge Check quizzes follow after all three exercises

- [ ] **Step 5: Browser test**

Open `src/phase-5.html` in a browser. Scroll to Ch19 Interactive Exercises.

Verify all three exercises:
1. Each renders with Ace Editor and all 4 buttons
2. "Spot the Over-Engineering": running the starter code works (AI version is functional), Check fails until reader writes simpler version
3. "Find the Missing Edge Cases": running the starter code shows valid output for the first call but crashes on edge cases, Check fails until reader fixes the function

---

## Chunk 5: Phase 6 — Ch27 "When NOT to Multi-Agent" Section

### Task 6: Add formalized "When NOT to Use Multiple Agents" section to Ch27

**Context:** Ch27 already has scattered mentions (lines 720, 749, 837) and a quiz option (line 872-874) about when single-agent is the right choice. This task formalizes those scattered references into a dedicated subsection with a concrete decision framework the reader can reference.

**Files:**
- Modify: `src/phase-6.html:834` (insert after the decision tree diagram's closing `</div>`)

- [ ] **Step 1: Read `phase-6.html` lines 830-845 to confirm insertion point**

Run: Read `src/phase-6.html` lines 830-845.

Expected: Line 834 is the closing `</div>` of the decision tree diagram section. The next content should be micro-exercises or another subsection.

- [ ] **Step 2: Insert the new section**

Insert the following HTML after line 834:

```html

<h3>When NOT to Use Multiple Agents</h3>
<p>The decision tree above starts with "Simple, one-file" routing to a single session. But that category is larger than it looks. Most tasks fit a single agent. Here's the concrete decision framework:</p>

<div class="callout warn">
<div class="callout-title">Default to Single Agent</div>
<p><strong>Use a single well-configured agent when:</strong></p>
<ul>
<li>The task fits in one context window (roughly &lt;20 files touched)</li>
<li>The feature touches fewer than 5 files</li>
<li>There are no independent subtasks that could run in parallel</li>
<li>You can describe the entire change in one prompt</li>
</ul>
<p><strong>Escalate to multi-agent when:</strong></p>
<ul>
<li>Independent features can genuinely be parallelized (not just "it would be nice")</li>
<li>Implementation and review should be separated (builder-validator pattern)</li>
<li>The task exceeds one context window and has natural split points</li>
<li>You need different tool configurations for different subtasks</li>
</ul>
<p>TaskForge at its current size? Single agent. A full-stack app with separate frontend, backend, and infrastructure changes? Consider dispatch. If you find yourself writing more orchestration code than feature code, step back to a simpler pattern.</p>
</div>
```

- [ ] **Step 3: Verify the insertion**

Run: Read `src/phase-6.html` around the insertion point.

Verify:
1. The new section appears after the decision tree diagram and before the next subsection
2. The `<h3>` heading is consistent with other subsection headings in Ch27
3. The `callout warn` class matches the project pattern (amber left border)
4. HTML entities are correct: `&lt;` for `<`

- [ ] **Step 4: Browser test**

Open `src/phase-6.html`. Scroll to Ch27.

Verify:
1. "When NOT to Use Multiple Agents" heading appears after the decision tree
2. The warning callout renders with amber styling
3. Bullet lists are properly formatted
4. Content flows naturally from the decision tree into this section

---

## Chunk 6: Appendices — "Common Mistakes by Level" + Sidebar Updates

### Task 7: Add "Common Mistakes by Level" appendix

**Context:** The curriculum mentions common mistakes throughout (bare except, hallucinated imports, scope bugs, over-engineering) but has no single reference. This appendix provides a quick diagnostic table organized by the 8 levels.

**Files:**
- Modify: `src/appendices.html:708` (insert after Appendix C Self-Assessment, before Appendix D Troubleshooting)

**Important:** After this insertion, Appendix D (Troubleshooting) becomes the 5th section and Appendix E (Resources) becomes the 6th. Their labels don't need renaming (they use `id="appendix-d"` and `id="appendix-e"` which are anchor targets from sidebars — changing IDs would break links). The new appendix gets its own unique ID.

- [ ] **Step 1: Read `appendices.html` lines 705-715 to confirm insertion point**

Run: Read `src/appendices.html` lines 705-715.

Expected: Line 708 is the closing `</section>` of the Self-Assessment section. Lines 710-711 begin the Troubleshooting section comment and opening tag.

Insertion point: **After line 708** (between Self-Assessment `</section>` and the Troubleshooting `<!-- ===== -->` comment).

- [ ] **Step 2: Insert the new appendix section**

Insert the following HTML after line 708:

```html

<!-- ===== COMMON MISTAKES BY LEVEL ===== -->
<section id="common-mistakes">
<h2><span class="ch-label">Appendix C.5</span>Common Mistakes by Level</h2>
<p>A quick-reference table of the most common mistakes at each level, how to catch them, and where the curriculum covers them. Consult this when you hit a problem and want to know if it's a known pattern.</p>

<table>
<tr><th>Level</th><th>Common Mistake</th><th>How to Catch</th><th>Chapter</th></tr>
<tr><td><strong>0 (Foundations)</strong></td><td>Using <code>=</code> instead of <code>==</code></td><td>Python raises <code>SyntaxError</code> in conditionals</td><td>Ch05</td></tr>
<tr><td><strong>0</strong></td><td>Indentation errors after <code>if</code>/<code>for</code></td><td>Read the traceback&mdash;it points to the exact line</td><td>Ch02</td></tr>
<tr><td><strong>1 (Tab Complete)</strong></td><td>Accepting suggestions without reading them</td><td>Predict the output before running; if you can't, you didn't read it</td><td>Ch19</td></tr>
<tr><td><strong>2 (Agent IDE)</strong></td><td>Giving vague prompts ("make it better")</td><td>If the prompt doesn't specify inputs, outputs, and constraints, it's too vague</td><td>Ch20</td></tr>
<tr><td><strong>3 (Context)</strong></td><td>No CLAUDE.md or stale CLAUDE.md</td><td>Agent produces code that violates project conventions</td><td>Ch21</td></tr>
<tr><td><strong>3</strong></td><td>Overloading a single prompt with multiple unrelated tasks</td><td>If the prompt has "and" more than twice, split it</td><td>Ch21</td></tr>
<tr><td><strong>4 (Compounding)</strong></td><td>No tests before asking AI to modify code</td><td>AI change breaks something and you have no way to detect it</td><td>Ch22</td></tr>
<tr><td><strong>4</strong></td><td>Bare <code>except:</code> clauses hiding real errors</td><td>Linter or <code>flake8 --select=E722</code></td><td>Ch09</td></tr>
<tr><td><strong>5 (MCP/Skills)</strong></td><td>Hallucinated package names in AI output</td><td><code>pip install</code> fails with 404</td><td>Ch19</td></tr>
<tr><td><strong>5</strong></td><td>Over-engineered AI solutions</td><td>Ask: "Could this be done in half the lines?"</td><td>Ch19</td></tr>
<tr><td><strong>6 (Harness)</strong></td><td>Constraints too loose (agent makes sweeping changes)</td><td>Review <code>git diff --stat</code>&mdash;if it touches &gt;10 files, constraints were too broad</td><td>Ch24</td></tr>
<tr><td><strong>7 (Background)</strong></td><td>No iteration limit on agent loops</td><td>Agent runs indefinitely; always set <code>max_iterations</code></td><td>Ch25</td></tr>
<tr><td><strong>8 (Teams)</strong></td><td>Using multi-agent for tasks a single agent handles fine</td><td>If there are no independent subtasks, use one agent</td><td>Ch27</td></tr>
</table>

<div class="callout info">
<div class="callout-title">Using This Table</div>
<p>When something goes wrong, find your current level in the left column. The most likely mistake is listed next to it. If the fix isn't clear, follow the chapter reference for the full explanation.</p>
</div>
</section>
```

- [ ] **Step 3: Verify the insertion**

Run: Read `src/appendices.html` around the insertion point.

Verify:
1. The new section appears between Self-Assessment and Troubleshooting
2. `id="common-mistakes"` is unique (not used elsewhere)
3. The table has consistent column structure: Level | Mistake | Catch | Chapter
4. HTML entities are correct: `&gt;` for `>`, `&mdash;` for em-dash
5. Chapter references (Ch05, Ch02, Ch19, etc.) match actual chapter content

- [ ] **Step 4: Browser test**

Open `src/appendices.html`. Scroll to the new section.

Verify:
1. "Common Mistakes by Level" heading renders with the "Appendix C.5" label
2. Table renders with proper styling (hover highlight, header formatting)
3. Info callout appears below the table
4. Navigation from Self-Assessment to Troubleshooting still works

---

### Task 8: Update all 7 HTML file sidebars with new appendix link

**Context:** The sidebar is "identical across all files" per CLAUDE.md rule 11. Every file's Reference toc-group needs a link to the new "Common Mistakes by Level" section.

**Files (all in `src/`):**
- `index.html`
- `phase-1.html`
- `phase-2.html`
- `phase-3.html`
- `phase-4.html` (also getting the Troubleshooting/Resources fix in Task 4)
- `phase-5.html`
- `phase-6.html`
- `appendices.html`

- [ ] **Step 1: Identify the exact sidebar line in each file**

For each file, find the Reference toc-group and identify the line containing the Self-Assessment link. The new link goes **after** Self-Assessment and **before** Troubleshooting.

Run: Search all HTML files for `Self-Assessment</a>` to find the exact line in each.

- [ ] **Step 2: Insert the new sidebar link in each file**

In each file, add the following line after the Self-Assessment link:

```html
    <a href="appendices.html#common-mistakes" class="toc-link"><span class="toc-num">&oplus;</span>Common Mistakes</a>
```

**Insert in this order** (to avoid line-number drift affecting other files):
1. `appendices.html` — the link uses `href="#common-mistakes"` (same-page anchor)
2. `index.html` — uses `href="appendices.html#common-mistakes"`
3. `phase-1.html`
4. `phase-2.html`
5. `phase-3.html`
6. `phase-4.html` (this file also gets the Troubleshooting/Resources links from Task 4 — do both in one edit)
7. `phase-5.html`
8. `phase-6.html`

**Special case for `appendices.html`:** The link should use `#common-mistakes` (relative anchor) instead of `appendices.html#common-mistakes`:

```html
    <a href="#common-mistakes" class="toc-link"><span class="toc-num">&oplus;</span>Common Mistakes</a>
```

- [ ] **Step 3: Verify all sidebars are identical**

Run: Extract the Reference toc-group from every HTML file and compare.

All 8 files should now have this Reference section (except `appendices.html` uses `#` anchors for same-page links):

```html
<div class="toc-group">
  <div class="toc-group-title">Reference</div>
  <a href="appendices.html#glossary" class="toc-link"><span class="toc-num">&oplus;</span>Glossary</a>
  <a href="appendices.html#prompt-library" class="toc-link"><span class="toc-num">&oplus;</span>Prompt Library</a>
  <a href="appendices.html#self-assessment" class="toc-link"><span class="toc-num">&oplus;</span>Self-Assessment</a>
  <a href="appendices.html#common-mistakes" class="toc-link"><span class="toc-num">&oplus;</span>Common Mistakes</a>
  <a href="appendices.html#appendix-d" class="toc-link"><span class="toc-num">&oplus;</span>Troubleshooting</a>
  <a href="appendices.html#appendix-e" class="toc-link"><span class="toc-num">&oplus;</span>Resources</a>
</div>
```

- [ ] **Step 4: Cross-file browser test**

Open each file and click the "Common Mistakes" sidebar link.

Verify: Every file navigates to `appendices.html#common-mistakes` and the section scrolls into view.

---

## Post-Implementation Checklist

After all 8 tasks are complete:

- [ ] **File size check:** Run `wc -l src/*.html` and verify no file exceeds 1200 lines by more than what it already exceeded before these changes
- [ ] **Sidebar consistency:** Run `grep -c "common-mistakes" src/*.html` — should return `8` (one match per file, or 2 for appendices.html if both sidebar and section are counted)
- [ ] **Exercise ID uniqueness:** Run `grep -oP 'data-ex="[^"]*"' src/*.html | sort | uniq -d` — should return nothing (no duplicate exercise IDs within the same chapter)
- [ ] **HTML validation:** Open each modified file in a browser, open DevTools Console, check for HTML parsing errors
- [ ] **Dark/light theme:** Toggle theme on each modified file and verify new content renders correctly in both themes
- [ ] **Update `REVIEW-AND-SUGGESTIONS.md`:** Correct the 7 inaccurate claims identified in the "Review Corrections" table at the top of this document
- [ ] **Update `docs/PROGRESS.md`:** Log the implementation of review suggestions

---

## Summary

| Task | File | What | Lines Added |
|------|------|------|-------------|
| 1 | `phase-2.html` | "Evaluate AI Code" exercise in Ch09 | ~40 |
| 2 | `phase-3.html` | "Read an AI Diff" exercise in Ch12 | ~55 |
| 3 | `phase-4.html` | "Test Your API" exercise in Ch14 | ~45 |
| 4 | `phase-4.html` | Sidebar fix (Troubleshooting/Resources) | 2 |
| 5 | `phase-5.html` | 2 more Ch19 exercises (over-engineering + happy-path) | ~80 |
| 6 | `phase-6.html` | "When NOT to Multi-Agent" section in Ch27 | ~25 |
| 7 | `appendices.html` | "Common Mistakes by Level" appendix | ~50 |
| 8 | All 8 HTML files | New sidebar link for Common Mistakes appendix | 8 |

**Total lines added across all files:** ~305

**No files created.** All changes are insertions into existing files.

**No CSS or JS changes.** All new content uses existing design system classes and exercise patterns.
