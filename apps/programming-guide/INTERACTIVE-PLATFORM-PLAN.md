# Interactive Platform Plan

Transform the static HTML guide into a full interactive learning platform with in-browser code execution, automated test verification, design challenges, progress tracking, and knowledge checks.

---

## 1. Executive Summary

**Problem:** The guide has 64 exercises across 28 chapters, all with verification criteria and copy-paste code. But there is zero automated feedback, zero starter code, zero design-from-scratch challenges, and zero progress tracking. A reader can "complete" the entire guide without writing a single line of code.

**Solution:** Embed an interactive exercise platform directly into the existing HTML files using:
- **Ace Editor** for syntax-highlighted code editing in the browser
- **Pyodide** (Python in WebAssembly) for in-browser code execution with full stdlib including sqlite3
- **Automated test suites** that give pass/fail feedback per exercise
- **Design challenges** (no starter code, hidden tests, progressive hints) in every chapter
- **Knowledge checks** (multiple choice / command validation) for non-codeable chapters
- **localStorage progress tracking** with a dashboard on the landing page

**Scope:** Every chapter gets at least one new interactive element. Chapters covering pure Python (1-2, 4-9, 15) get full Pyodide-powered exercises. Chapters covering tools (3, 10-12, 16-17) and AI (19-28) get knowledge checks and structured verification. All chapters get a design challenge where feasible.

---

## 2. Architecture & Tech Stack

### External Dependencies (loaded from CDN)

| Dependency | Purpose | Size | Loading |
|---|---|---|---|
| Ace Editor | Code editing with syntax highlighting, line numbers, auto-indent | ~300KB | Loaded on page load (deferred) |
| Pyodide | Python 3.12 in WebAssembly | ~10MB | Lazy-loaded on first Run click |

### New JS Files

| File | Purpose | Pattern |
|---|---|---|
| `src/js/ace-init.js` | Initialize Ace editors, sync dark/light theme | IIFE (ES5) |
| `src/js/pyodide-runner.js` | Pyodide lazy-load, code execution, stdout/stderr capture | IIFE (ES5) |
| `src/js/exercise-runner.js` | Test execution, result display, hint toggling, reset | IIFE (ES5) |
| `src/js/progress.js` | localStorage read/write, progress bar updates, dashboard | IIFE (ES5) |
| `src/js/quiz.js` | Multiple choice and command-validation knowledge checks | IIFE (ES5) |

### CSS Additions

New utility classes appended to `src/css/design-system.css` (per D005 exception):
- `.exercise` — exercise container
- `.exercise-editor` — Ace editor wrapper
- `.exercise-controls` — button row (Run, Check, Hint, Reset)
- `.exercise-output` — stdout/stderr display
- `.exercise-tests` — test result panel (pass/fail items)
- `.exercise-hints` — progressive hint container
- `.quiz` — knowledge check container
- `.quiz-option` — clickable option
- `.quiz-feedback` — correct/incorrect feedback
- `.progress-bar` — phase/chapter progress indicator
- `.progress-ring` — circular progress on landing page
- `.exercise-status` — green check / empty circle per exercise

### HTML Template (per exercise)

```html
<div class="exercise" data-ch="05" data-ex="challenge-1" data-type="pyodide">
  <div class="exercise-header">
    <h4>Design Challenge: Temperature Converter</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt">Write a function <code>convert_temp(value, from_unit, to_unit)</code> that converts between Celsius, Fahrenheit, and Kelvin. Raise <code>ValueError</code> for unknown units.</p>
  <div class="exercise-editor" data-starter="" data-solution-hash="..."
       data-tests="assert convert_temp(100, 'C', 'F') == 212.0&#10;assert convert_temp(32, 'F', 'C') == 0.0&#10;assert convert_temp(0, 'C', 'K') == 273.15">
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
    <p class="hint" hidden>C to F: multiply by 9/5, add 32. C to K: add 273.15.</p>
    <p class="hint" hidden>Convert to Celsius first, then from Celsius to target.</p>
    <p class="hint" hidden>Use a dict mapping unit pairs to conversion functions.</p>
  </div>
</div>
```

### Knowledge Check Template (non-Pyodide chapters)

```html
<div class="quiz" data-ch="10" data-ex="quiz-1">
  <h4>Knowledge Check: Pipe Operator</h4>
  <p>Which command counts the number of Python files containing "import"?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-correct="false">find . -name "*.py" | grep import | count</button>
    <button class="quiz-option" data-correct="true">grep -rl 'import' --include='*.py' . | wc -l</button>
    <button class="quiz-option" data-correct="false">ls *.py | grep -c import</button>
    <button class="quiz-option" data-correct="false">cat *.py | grep import | wc -l</button>
  </div>
  <div class="quiz-feedback"></div>
</div>
```

---

## 3. Exercise Types

### Type A: Pyodide Code Exercise
**Used in:** Ch 01-02, 04-09, 13 (partial), 15, 18 (partial)

Full interactive: Ace editor + Run button (stdout) + Check button (test assertions). Tests embedded in `data-tests` attribute. Pyodide executes user code, then runs test code, captures results.

**Subtypes:**
- **Guided exercise:** Starter code provided in editor, reader modifies/extends it
- **Design challenge:** Editor starts blank, reader designs solution from scratch
- **Debug challenge:** Starter code has bugs, reader must find and fix them

### Type B: Knowledge Check (Quiz)
**Used in:** Ch 03, 10-12, 16-17, 19-28

Multiple choice questions about concepts, commands, or outputs. Immediate feedback on click. Stored in localStorage.

**Subtypes:**
- **Concept quiz:** "What does X do?"
- **Output prediction:** "What will this code print?"
- **Command selection:** "Which command achieves Y?"

### Type C: Verification Checklist
**Used in:** Ch 03, 10-12, 16-17, 19-28

Self-report checkboxes for exercises that require real tools (git, Docker, Claude Code). Reader checks off items as they complete them locally. Stored in localStorage.

```html
<div class="exercise" data-ch="11" data-ex="verify-1" data-type="checklist">
  <h4>Verify: Merge Conflict Resolution</h4>
  <label><input type="checkbox"> I created a merge conflict between two branches</label>
  <label><input type="checkbox"> I opened the file and saw conflict markers</label>
  <label><input type="checkbox"> I resolved the conflict and committed</label>
  <label><input type="checkbox"> git log --oneline shows 4+ commits</label>
</div>
```

### Type D: Output Match
**Used in:** Ch 10-12, 16-17

Reader pastes their terminal output; JS checks for expected patterns (regex match).

```html
<div class="exercise" data-ch="11" data-ex="output-1" data-type="output-match">
  <h4>Paste Your Git Log</h4>
  <p>Run <code>git log --oneline</code> and paste the output below.</p>
  <textarea class="exercise-paste"></textarea>
  <button class="ex-verify">Verify</button>
  <div class="exercise-feedback"></div>
</div>
```
Pattern check: at least 4 lines, each starting with a short hash.

---

## 4. Per-Chapter Exercise Specifications

### Phase 1: Foundations

#### Chapter 01 — What Programming Actually Is
- **Type A (Guided):** Browser console is already covered. Add a Pyodide exercise: "Type `print(2 + 2)` and click Run. Then try `print('Hello, ' + 'world!')`."
  - Tests: output contains "4" and "Hello, world!"
  - Purpose: First interaction with in-browser Python. Zero friction.
- **Type B (Quiz):** "Which of these is NOT a programming language?" (Python / HTML / JavaScript / C++) — Answer: HTML

#### Chapter 02 — How Computers Execute Code
- **Type A (Guided):** Predict-and-run exercises already exist. Make them interactive — reader types prediction, clicks Run, compares.
  - Exercise 1: Variable reassignment prediction
  - Exercise 2: String concatenation prediction
  - Exercise 3: ZeroDivisionError prediction
- **Type A (Design Challenge):** `convert_temp(value, from_unit, to_unit)` — convert between C, F, K.
  - Tests: 6 assertions covering all 6 conversion directions + ValueError for bad unit
  - Hints: (1) formulas, (2) convert-to-C-first strategy, (3) dict-based dispatch
- **Type B (Quiz):** "What is the value of `b` after: `a = 3; b = a; a = 7`?" — Answer: 3

#### Chapter 03 — Setting Up Your Environment
- **Type C (Checklist):** Python installed, VS Code installed, terminal opens, `python3 --version` works, virtual env created
- **Type B (Quiz):** "What does `source venv/bin/activate` do?" — 4 options

#### Chapter 04 — Reading Code Before Writing It
- **Type A (Debug Challenge):** Present a 20-line function with 3 bugs (off-by-one, wrong variable name, missing return). Reader must fix all 3.
  - Tests: function works correctly after fixes
  - Hints: (1) check the loop bounds, (2) check variable names in the conditional, (3) what does the function return when the list is empty?
- **Type B (Quiz):** Given TaskForge v0.1 snippet, "What data structure stores the tasks?" — Answer: list of dicts

### Phase 2: Python

#### Chapter 05 — Functions, Logic & Control Flow
- **Type A (Guided):** The `analyze_signal` exercise already exists. Make it interactive.
- **Type A (Design Challenge):** `fizzbuzz(n)` — return list of strings 1 to n with Fizz/Buzz/FizzBuzz rules.
  - Tests: fizzbuzz(15) checked element-by-element, fizzbuzz(1) == ['1'], fizzbuzz(0) == []
  - Hints: (1) modulo operator, (2) check 15 before 3 or 5, (3) list comprehension or loop
- **Type A (Design Challenge):** `is_palindrome(s)` — case-insensitive, ignore spaces/punctuation.
  - Tests: "racecar", "A man a plan a canal Panama", "hello", "", single char
  - Hints: (1) normalize first, (2) string slicing [::-1], (3) filter with isalnum()

#### Chapter 06 — Data Structures
- **Type A (Guided):** Nested dict access exercise already exists. Make interactive.
- **Type A (Design Challenge):** `group_by(items, key_fn)` — group list items by key function result, return dict of lists.
  - Tests: group words by length, group numbers by even/odd, empty list
  - Hints: (1) defaultdict or setdefault, (2) iterate and append, (3) return regular dict
- **Type A (Design Challenge):** `flatten(nested)` — flatten arbitrarily nested lists.
  - Tests: [1,[2,[3,4],5],6] → [1,2,3,4,5,6], already flat, empty, deeply nested
  - Hints: (1) recursion, (2) isinstance check for list, (3) base case is non-list

#### Chapter 07 — Classes & OOP Basics
- **Type A (Guided):** Task class refactor exercise already exists. Make interactive.
- **Type A (Design Challenge):** `BankAccount` class — deposit, withdraw (no overdraft), transfer (atomic), balance property.
  - Tests: deposit increases balance, withdraw decreases, overdraft raises ValueError, transfer moves money atomically (if receiver fails, sender unchanged)
  - Hints: (1) raise ValueError on overdraft, (2) check balance before withdrawing, (3) for transfer: withdraw first, try deposit, if deposit fails re-deposit to sender
- **Type B (Quiz):** "What does `self` refer to in a method?" — 4 options

#### Chapter 08 — Files, Modules & Standard Library
- **Type A (Guided):** JSON read/write exercise. Pyodide supports virtual filesystem.
  - Pre-populate `/tmp/config.json` in Pyodide FS, reader writes code to modify it
- **Type A (Design Challenge):** `parse_csv(text)` — parse CSV string into list of dicts (first row = headers).
  - Tests: basic CSV, quoted fields with commas, empty fields, single row (headers only)
  - Hints: (1) split by newlines then by commas, (2) zip headers with each row, (3) handle edge case of trailing newline

#### Chapter 09 — Error Handling, Debugging & Testing
- **Type A (Debug Challenge):** Present function with 4 bugs (wrong exception type, bare except, missing edge case, assertion that tests wrong thing). Reader fixes all.
  - Tests: all 4 bugs must be fixed
- **Type A (Design Challenge):** Given a mystery function (obfuscated name, no docstring), write 5 test assertions that fully characterize its behavior. Then write a clean version.
  - Tests: reader's assertions must cover: normal case, edge case, error case, boundary, type check
  - Hints: (1) call it with simple inputs first, (2) what happens with 0, empty, None?, (3) what exception does it raise?

### Phase 3: Development Tools

#### Chapter 10 — The Terminal & Shell
- **Type B (Quiz × 3):**
  1. "Which command shows only the first 10 lines of a file?" — head
  2. "What does `|` do in `cat file.txt | grep error`?" — pipes stdout to next command's stdin
  3. "Which flag makes `grep` case-insensitive?" — `-i`
- **Type D (Output Match):** Paste output of `ls -la` from TaskForge directory. Pattern: at least 5 lines, contains "taskforge" or ".py"
- **Type C (Checklist):** tmux session created, 3 panes, detach/reattach successful

#### Chapter 11 — Git Fundamentals
- **Type B (Quiz × 3):**
  1. "What is the staging area?" — 4 options
  2. "What does `git diff --staged` show?" — changes staged for next commit
  3. "After a merge conflict, which markers show YOUR changes?" — `<<<<<<< HEAD`
- **Type C (Checklist):** init repo, 3 commits, create branch, merge, resolve conflict
- **Type D (Output Match):** Paste `git log --oneline` — pattern: 4+ lines, each starting with hex hash

#### Chapter 12 — Git Remote & GitHub
- **Type B (Quiz × 2):**
  1. "What does `git push -u origin main` do?" — 4 options
  2. "What is a pull request?" — 4 options
- **Type C (Checklist):** Push to GitHub, create branch, open PR, PR visible on GitHub

### Phase 4: Building & Deploying

#### Chapter 13 — APIs & HTTP
- **Type A (Guided):** Simulate API responses in Pyodide (mock `requests.get` to return pre-built JSON). Reader parses response.
  - Exercise: Given mock GitHub API response, extract repo names and star counts
  - Tests: correct names extracted, sorted by stars, handles empty response
- **Type B (Quiz × 2):**
  1. "What HTTP method is used to create a new resource?" — POST
  2. "What does a 404 status code mean?" — Resource not found
- **Type A (Design Challenge):** `parse_api_response(json_str)` — parse a weather API JSON response, extract temperature, conditions, and wind speed. Handle missing fields gracefully.
  - Tests: complete response, partial response (missing wind), malformed JSON raises ValueError
  - Hints: (1) json.loads, (2) dict.get with defaults, (3) try/except for JSONDecodeError

#### Chapter 14 — Building APIs with Flask
- **Type B (Quiz × 3):**
  1. "What decorator makes a function handle GET /tasks?" — `@app.route('/tasks', methods=['GET'])`
  2. "How do you return JSON from a Flask route?" — `jsonify()`
  3. "What status code should POST /tasks return on success?" — 201
- **Type C (Checklist):** Flask app running, curl GET returns JSON, curl POST creates task, curl PUT marks complete
- **Type A (Design Challenge):** Write a `validate_task(data)` function that validates POST body: title required (non-empty string), priority optional (must be high/medium/low), due_date optional (must be YYYY-MM-DD format).
  - Tests: valid task, missing title, empty title, bad priority, bad date format, extra fields ignored
  - Hints: (1) check 'title' key exists and is truthy, (2) use `in` for priority validation, (3) regex or datetime.strptime for date

#### Chapter 15 — Database Basics
- **Type A (Guided):** Full SQLite in Pyodide! Create tables, insert, query.
  - Exercise: Create tasks table, insert 3 tasks, SELECT incomplete tasks
  - Tests: table exists, 3 rows inserted, query returns only incomplete
- **Type A (Design Challenge):** Implement `TaskDB` class with `add(title)`, `complete(id)`, `search(keyword)`, `stats()` — all backed by SQLite in-memory.
  - Tests: add returns ID, complete changes status, search finds by title substring, stats returns dict with total/completed/pending counts
  - Hints: (1) use `:memory:` connection, (2) parameterized queries prevent SQL injection, (3) stats uses COUNT with WHERE

#### Chapter 16 — Docker & Containers
- **Type B (Quiz × 3):**
  1. "What does `FROM python:3.12` do in a Dockerfile?" — sets base image
  2. "What is the difference between `COPY` and `ADD`?" — 4 options
  3. "What does `-v $(pwd):/app` do in `docker run`?" — mounts current directory as /app
- **Type C (Checklist):** Docker installed, pulled python image, built TaskForge image, ran container, verified output
- **Type D (Output Match):** Paste `docker images` output — pattern: contains "taskforge" and a size

#### Chapter 17 — CI/CD & GitHub Actions
- **Type B (Quiz × 2):**
  1. "What triggers a workflow with `on: push`?" — every push to any branch
  2. "What does `runs-on: ubuntu-latest` specify?" — the CI runner OS
- **Type C (Checklist):** Workflow file created, pushed, Actions tab shows run, green check or red X visible
- **Type A (Design Challenge):** Write a Python function `parse_workflow(yaml_str)` that extracts job names and step names from a GitHub Actions YAML string (use PyYAML-like dict parsing, not actual YAML — provide pre-parsed dict).
  - Tests: single job workflow, multi-job, job with no steps, empty workflow
  - Hints: (1) iterate jobs dict, (2) each job has 'steps' list, (3) each step has 'name' or 'run'

#### Chapter 18 — Project Architecture
- **Type A (Design Challenge):** Given a flat 80-line script with mixed concerns (CLI parsing, database calls, validation, output formatting), refactor into 4 functions with clear responsibilities. The script is provided as starter code.
  - Tests: each function has single responsibility, no global state, functions compose correctly, original behavior preserved
  - Hints: (1) identify the 4 concerns, (2) extract database logic first, (3) CLI parsing should only parse — not do work
- **Type B (Quiz):** "What is separation of concerns?" — 4 options

### Phase 5: Levels 1-5

#### Chapter 19 — Evaluating & Directing AI Code
- **Type A (Design Challenge):** Given a function with 3 subtle issues (works for basic cases but fails edge cases), write an evaluation: what's correct, what's wrong, verdict (accept/revise/reject).
  - Starter code: the flawed function + test cases that expose bugs
  - Tests: reader identifies at least 2 of 3 issues
  - Hints: (1) try empty input, (2) try negative numbers, (3) try duplicate values
- **Type B (Quiz × 2):**
  1. "What should you do FIRST when receiving AI-generated code?" — Read it before running it
  2. "What is a hallucination in AI context?" — Confidently stated incorrect information
- **Type C (Checklist):** Evaluated one AI output, wrote 3+ sentence assessment, identified specific correct and incorrect elements

#### Chapter 20 — Levels 1 & 2: Tab Complete & Agent IDE
- **Type B (Quiz × 2):**
  1. "What is the difference between Level 1 and Level 2?" — Tab complete vs conversational agent
  2. "Why should you review `git diff` after an agent makes changes?" — 4 options
- **Type C (Checklist):** Claude Code installed, asked it to explain a file, asked it to implement a function, reviewed git diff, ran tests

#### Chapter 21 — Level 3: Context Engineering
- **Type A (Design Challenge):** Write a CLAUDE.md for a hypothetical project (description provided). Must be under 40 lines, include: project purpose, tech stack, testing command, 3 code style rules, 1 gotcha.
  - Tests (text analysis): line count < 40, contains testing command, contains at least 3 rules, no vague instructions ("be careful", "write good code")
  - Hints: (1) start with one-line purpose, (2) rules must be verifiable, (3) gotchas prevent repeated mistakes
- **Type B (Quiz):** "Which CLAUDE.md instruction is better?" — compare vague vs specific rules

#### Chapter 22 — Level 4: Compounding Engineering
- **Type B (Quiz × 2):**
  1. "What makes engineering 'compound' across sessions?" — Persistent rules that improve future outputs
  2. "Where should architecture decisions be documented?" — `docs/` directory referenced from CLAUDE.md
- **Type C (Checklist):** Wrote CLAUDE.md rule from real mistake, tested in new session, verified improvement

#### Chapter 23 — Level 5: MCP, Skills & Capabilities
- **Type B (Quiz × 2):**
  1. "What is an MCP server?" — External tool that extends agent capabilities
  2. "What is the difference between a skill and a subagent?" — 4 options
- **Type C (Checklist):** Created a skill file, created a subagent file, both load without error

### Phase 6: Levels 6-8

#### Chapter 24 — Level 6: Harness Engineering
- **Type A (Design Challenge):** Write a `validate_output(code_str)` function that checks generated code for common issues: no bare excepts, no `import *`, no functions over 50 lines, no TODO comments.
  - Tests: clean code passes, bare except caught, import * caught, long function caught, TODO caught
  - Hints: (1) split into lines, iterate, (2) use string matching for patterns, (3) track function length with indentation
- **Type B (Quiz):** "What is backpressure in agentic engineering?" — Automated constraints that force agent self-correction
- **Type C (Checklist):** Pre-commit hooks installed, linter + pytest running, agent self-corrected through backpressure

#### Chapter 25 — Level 7: Background Agents
- **Type B (Quiz × 2):**
  1. "What is a Ralph Loop?" — Autonomous iteration cycle: implement → test → fix → repeat
  2. "Why set a maximum iteration count?" — Prevent infinite loops of failed attempts
- **Type C (Checklist):** Dispatched background task, reviewed output, identified one correction needed

#### Chapter 26 — Claude Code in Docker
- **Type B (Quiz × 2):**
  1. "Why use `--dangerously-skip-permissions` in Docker?" — Container is already isolated
  2. "What does `-v $(pwd):/workspace` do?" — Mounts code into the container
- **Type C (Checklist):** Dockerfile.claude built, container ran Claude Code, output verified

#### Chapter 27 — Level 8: Autonomous Agent Teams
- **Type B (Quiz):** "When should you NOT use agent teams?" — When the project is small enough for one agent
- **Type A (Design Challenge):** Given a list of 6 tasks with dependencies (task A depends on B, etc.), write `plan_execution(tasks)` that returns an ordered execution plan respecting dependencies, with maximum parallelism.
  - Tests: linear chain, diamond dependency, independent tasks (all parallel), circular dependency raises error
  - Hints: (1) topological sort, (2) group by dependency depth, (3) detect cycles with visited set
- **Type C (Checklist):** Dispatched 2 parallel agents, merged results, resolved any conflicts

#### Chapter 28 — The Multiplayer Effect
- **Type C (Checklist):** Self-assessment completed, current level identified, 5-sentence action plan written
- **Type B (Quiz):** "What level do most professional developers operate at?" — Levels 3-6

---

## 5. Progress Tracking System

### localStorage Schema

```javascript
{
  "zth-progress": {
    "ch01": { "ex1": true, "quiz1": false, "challenge1": false },
    "ch02": { "ex1": true, "ex2": true, "challenge1": false, "challenge2": false },
    // ... all 28 chapters
    "gate1": false,
    "gate2": false,
    // ... all 6 gates
  },
  "zth-stats": {
    "totalExercises": 0,     // computed
    "completedExercises": 0, // computed
    "currentLevel": 0,       // from self-assessment
    "lastActive": "2026-03-16"
  }
}
```

### Progress Display

**Landing page (index.html):**
- Each phase card shows a progress bar: "X / Y exercises completed"
- Overall progress ring at the top: "X% complete"
- "Continue where you left off" link to last incomplete exercise

**Phase files (phase-X.html):**
- Each exercise shows a green checkmark (completed) or empty circle (not done)
- Phase gate section shows completion count: "Complete X more exercises to unlock the gate"
- Sidebar links get subtle progress indicators (dot or checkmark)

### Completion Criteria

An exercise is marked complete when:
- **Pyodide exercise:** All test assertions pass
- **Quiz:** Correct answer selected
- **Checklist:** All checkboxes checked
- **Output match:** Pattern validates successfully
- **Design challenge:** All test assertions pass

Progress persists across sessions via localStorage. A "Reset Progress" button in the footer allows starting over.

---

## 6. Phase 4→5 Bridge Enhancement

The gap between "I can build a Flask app with Docker" and "I can evaluate AI-generated code" is the guide's biggest pedagogical weakness. Address with:

### Bridge Exercise (added to Phase 4 Gate)

After the existing Phase 4 Gate content, add a "Bridge to AI" section:

**Exercise:** "You've been building TaskForge by hand for 18 chapters. Now look at this AI-generated version of the same feature you just built (the stats endpoint). Compare it to yours."

Provide a Pyodide exercise where:
1. Reader's implementation is shown (from earlier chapter)
2. An AI-generated version is shown (subtly different — works but has style issues, missing error handling, or over-engineered)
3. Reader must identify 3 differences and assess which version is better for each

This directly previews Ch 19's evaluation skill using the reader's own codebase knowledge.

### Gentler On-Ramp for Chapter 19

Add 2 exercises before the existing "Try This Now" in Ch 19:

1. **Warm-up (Pyodide):** Show 2 implementations of the same function. One is clearly better. Reader selects which and explains why. (Interactive — select + text input)
2. **Intermediate (Pyodide):** Show an AI-generated function with one subtle bug. Reader must find the bug and fix it in the editor. Tests verify the fix.

These build confidence before the existing "evaluate an AI's output in 3-5 sentences" exercise.

---

## 7. Landing Page Dashboard

Update `index.html` to include:

1. **Progress ring** in hero section — circular SVG showing overall completion percentage
2. **Phase cards** enhanced with progress bars below the description
3. **"Continue" button** that links to the first incomplete exercise
4. **Stats footer:** "X exercises completed · Y design challenges solved · Last active: date"

The dashboard reads from `zth-progress` in localStorage and renders client-side.

---

## 8. CSS Additions to design-system.css

Approximately 120 lines of new CSS covering:

```
/* === INTERACTIVE EXERCISES === */
.exercise                    — container with card-like styling
.exercise-header             — flex row: title + status indicator
.exercise-status             — green circle (done) or gray circle (not done)
.exercise-prompt             — exercise description text
.exercise-editor             — Ace editor container (fixed height)
.exercise-controls           — button row
.ex-run, .ex-check, .ex-hint, .ex-reset — styled buttons matching design system
.exercise-output             — pre-formatted stdout/stderr panel
.exercise-tests              — test results list
.exercise-tests .pass        — green text
.exercise-tests .fail        — red text
.exercise-hints .hint        — hint text (hidden until revealed)
.exercise-paste              — textarea for output-match exercises

/* === KNOWLEDGE CHECKS === */
.quiz                        — quiz container
.quiz-options                — button group (vertical stack)
.quiz-option                 — option button
.quiz-option.correct         — green highlight
.quiz-option.incorrect       — red highlight
.quiz-feedback               — explanation text

/* === VERIFICATION CHECKLISTS === */
.checklist                   — checklist container
.checklist label             — checkbox + label row
.checklist input:checked + span — strikethrough styling

/* === PROGRESS === */
.progress-bar                — horizontal bar (phase cards)
.progress-fill               — filled portion (accent color)
.progress-ring               — SVG circular progress (landing page)
.progress-text               — percentage text
.exercise-status.done        — green filled circle
.exercise-status.pending     — gray outlined circle

/* === PYODIDE LOADING === */
.pyodide-loading             — loading spinner overlay on editor
.pyodide-ready               — green indicator (Pyodide loaded)
```

All colors use existing CSS variables (--accent, --a3, --a5, etc.).
Dark/light theme compatibility via existing [data-theme="light"] overrides.

---

## 9. Pyodide Integration Details

### Lazy Loading Strategy

1. Page loads normally — no Pyodide download
2. When reader clicks first "Run" or "Check" button on any Pyodide exercise:
   - Show loading overlay on that exercise's editor: "Loading Python runtime... (first time only, ~10MB)"
   - Load Pyodide from CDN: `https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js`
   - Initialize Python interpreter
   - Hide loading overlay, enable all Run/Check buttons on page
3. Subsequent exercises use the already-loaded Pyodide instance
4. Browser caches Pyodide files — subsequent page loads are fast

### Code Execution Model

```
User clicks "Run":
  1. Get code from Ace editor
  2. Execute via pyodide.runPython(code)
  3. Capture stdout → display in .exercise-output
  4. Capture stderr → display in red in .exercise-output

User clicks "Check":
  1. Get code from Ace editor
  2. Execute user code (defines functions/classes)
  3. Execute test assertions (from data-tests attribute)
  4. For each assertion:
     - Pass → green "PASS: description"
     - Fail → red "FAIL: description + actual vs expected"
  5. All pass → mark exercise complete in localStorage
```

### Stdout/Stderr Capture

Pyodide allows redirecting stdout/stderr to JavaScript callbacks. The runner captures all output during execution and displays it in the output panel.

### Virtual Filesystem (for file I/O exercises)

Pyodide includes a virtual filesystem. For Chapter 08 exercises:
- Pre-populate files in Pyodide FS before running user code
- User code reads/writes to virtual files
- Tests verify file contents after execution

### SQLite Support (Chapter 15)

Pyodide includes `sqlite3` in its standard library. Exercises use `:memory:` databases. Full SQL functionality available.

---

## 10. Ace Editor Integration

### Setup

Load from CDN in each phase HTML file:
```html
<script src="https://cdn.jsdelivr.net/npm/ace-builds@1.36.5/src-min-noconflict/ace.js"></script>
```

### Configuration per editor

```javascript
var editor = ace.edit(element);
editor.setTheme("ace/theme/one_dark");  // synced with page theme
editor.session.setMode("ace/mode/python");
editor.setOptions({
  fontSize: "14px",
  showPrintMargin: false,
  maxLines: 25,
  minLines: 6,
  tabSize: 4,
  useSoftTabs: true,
  wrap: true
});
```

### Theme Sync

When the user toggles dark/light mode via the existing theme toggle:
- Dark mode: `ace/theme/one_dark`
- Light mode: `ace/theme/chrome`

The `ace-init.js` file listens for theme changes and updates all editors.

---

## 11. Implementation Order

The work is divided into 5 sequential phases. Each phase is independently deployable.

### Implementation Phase I: Infrastructure (JS + CSS)
1. Add CSS classes to `design-system.css`
2. Create `src/js/ace-init.js`
3. Create `src/js/pyodide-runner.js`
4. Create `src/js/exercise-runner.js`
5. Create `src/js/quiz.js`
6. Create `src/js/progress.js`
7. Test infrastructure with a single exercise on a scratch page

### Implementation Phase II: Phase 1-2 Exercises (Pyodide-heavy)
8. Add exercises to `phase-1.html` (Ch 01-04): 2 Pyodide + 2 quiz + 1 debug challenge + 1 checklist
9. Add exercises to `phase-2.html` (Ch 05-09): 5 guided + 6 design challenges + 2 quiz + 1 debug challenge
10. Add CDN script tags to phase-1.html and phase-2.html

### Implementation Phase III: Phase 3-4 Exercises (Mixed)
11. Add exercises to `phase-3.html` (Ch 10-12): 8 quiz + 3 checklist + 2 output-match
12. Add exercises to `phase-4.html` (Ch 13-18): 3 Pyodide + 7 quiz + 4 checklist + 3 design challenges + 1 output-match + bridge exercise

### Implementation Phase IV: Phase 5-6 Exercises (Quiz/Checklist-heavy)
13. Add exercises to `phase-5.html` (Ch 19-23): 2 Pyodide + 7 quiz + 4 checklist + 1 design challenge
14. Add exercises to `phase-6.html` (Ch 24-28): 2 Pyodide + 6 quiz + 4 checklist + 1 design challenge

### Implementation Phase V: Progress System & Dashboard
15. Integrate progress tracking into all exercise types
16. Update `index.html` with progress dashboard
17. Add progress indicators to sidebar links in all phase files
18. Add "Reset Progress" button to footer

### Total new interactive elements: ~85
- Pyodide exercises (guided + design + debug): ~24
- Knowledge check quizzes: ~32
- Verification checklists: ~18
- Output match exercises: ~4
- Bridge exercise: 1
- Progress dashboard: 1

---

## 12. CLAUDE.md Updates Required

After implementation, update CLAUDE.md to reflect:

1. **New dependencies:** Ace Editor (CDN), Pyodide (CDN) — add to Dependency Policy
2. **New JS files:** ace-init.js, pyodide-runner.js, exercise-runner.js, quiz.js, progress.js
3. **CSS additions:** Note D005 exception was used for ~120 lines of interactive platform CSS
4. **New HTML patterns:** Exercise, quiz, checklist, output-match templates
5. **localStorage keys:** `zth-progress`, `zth-stats` (in addition to existing `zth-theme`)
6. **Exercise count:** ~85 interactive elements across all 8 HTML files

---

## 13. Constraints & Risks

| Risk | Mitigation |
|---|---|
| Pyodide 10MB download discourages users | Lazy-load only on first interaction; show clear loading message; browser caches it |
| Ace Editor adds visual complexity | Match existing design system exactly; subtle, not flashy |
| Exercise data-tests attribute gets unwieldy | Keep tests concise; complex tests can use a helper function defined in the test string |
| localStorage loss (cleared cache) | Progress is supplementary motivation, not gating. All content remains accessible without it. |
| Mobile Ace Editor usability | Set reasonable min-height; mobile users can still read exercises even if editing is harder |
| File:// protocol restrictions | Pyodide requires HTTP server. Add note: "For interactive exercises, serve with `python3 -m http.server`" |

---

## 14. Success Criteria

The platform succeeds when:
1. A reader can complete every Pyodide exercise without leaving the browser
2. Every exercise gives immediate pass/fail feedback (no "check your answer manually")
3. Design challenges require genuine problem-solving (not copy-paste from the chapter text)
4. Progress tracking motivates completion (visible progress bars update in real time)
5. The Phase 4→5 bridge makes the transition feel natural, not jarring
6. A true beginner can complete Phase 1-2 exercises using only the in-browser editor
