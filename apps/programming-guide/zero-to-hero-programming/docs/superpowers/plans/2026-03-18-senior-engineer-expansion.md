# Senior Engineer Expansion — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Zero-to-Hero curriculum from 6 phases / 28 chapters to 10 phases / 47 chapters by adding four new phases of professional engineering content.

**Architecture:** Four new HTML phase files (phase-5 through phase-8) inserted between existing Phase 4 and the AI phases. Existing phase-5/6 renamed to phase-9/10 with all chapters renumbered. All cross-references, sidebar, progress tracking, and appendices updated.

**Tech Stack:** HTML, CSS (design-system.css), vanilla JavaScript (IIFE ES5), Pyodide (CDN), Ace Editor (CDN)

**Spec:** `docs/superpowers/specs/2026-03-18-senior-engineer-expansion-design.md`

---

## Shared References

### A. New Sidebar HTML (used by ALL 12 HTML files)

```html
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo"><span>Zero to Hero</span>Programming &rarr; Multi-Agent AI</div>
  <div class="toc-group">
    <div class="toc-group-title">Foundations</div>
    <a href="phase-1.html#ch01" class="toc-link"><span class="toc-num">01</span>What Programming Actually Is</a>
    <a href="phase-1.html#ch02" class="toc-link"><span class="toc-num">02</span>How Computers Execute Code</a>
    <a href="phase-1.html#ch03" class="toc-link"><span class="toc-num">03</span>Setting Up Your Environment</a>
    <a href="phase-1.html#ch04" class="toc-link"><span class="toc-num">04</span>Reading Code Before Writing It</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">Python</div>
    <a href="phase-2.html#ch05" class="toc-link"><span class="toc-num">05</span>Functions, Logic &amp; Control Flow</a>
    <a href="phase-2.html#ch06" class="toc-link"><span class="toc-num">06</span>Data Structures</a>
    <a href="phase-2.html#ch07" class="toc-link"><span class="toc-num">07</span>Classes &amp; OOP Basics</a>
    <a href="phase-2.html#ch08" class="toc-link"><span class="toc-num">08</span>Files, Modules &amp; Standard Library</a>
    <a href="phase-2.html#ch09" class="toc-link"><span class="toc-num">09</span>Error Handling, Debugging &amp; Testing</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">Development Tools</div>
    <a href="phase-3.html#ch10" class="toc-link"><span class="toc-num">10</span>The Terminal &amp; Shell</a>
    <a href="phase-3.html#ch11" class="toc-link"><span class="toc-num">11</span>Git Fundamentals</a>
    <a href="phase-3.html#ch12" class="toc-link"><span class="toc-num">12</span>Git Remote &amp; GitHub</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">Building &amp; Deploying</div>
    <a href="phase-4.html#ch13" class="toc-link"><span class="toc-num">13</span>APIs &amp; HTTP</a>
    <a href="phase-4.html#ch14" class="toc-link"><span class="toc-num">14</span>Building APIs with Flask</a>
    <a href="phase-4.html#ch15" class="toc-link"><span class="toc-num">15</span>Database Basics</a>
    <a href="phase-4.html#ch16" class="toc-link"><span class="toc-num">16</span>Docker &amp; Containers</a>
    <a href="phase-4.html#ch17" class="toc-link"><span class="toc-num">17</span>CI/CD &amp; GitHub Actions</a>
    <a href="phase-4.html#ch18" class="toc-link"><span class="toc-num">18</span>Project Architecture</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">Data Structures</div>
    <a href="phase-5.html#ch19" class="toc-link"><span class="toc-num">19</span>Complexity Analysis</a>
    <a href="phase-5.html#ch20" class="toc-link"><span class="toc-num">20</span>Linear Structures</a>
    <a href="phase-5.html#ch21" class="toc-link"><span class="toc-num">21</span>Hash Tables &amp; Maps</a>
    <a href="phase-5.html#ch22" class="toc-link"><span class="toc-num">22</span>Trees</a>
    <a href="phase-5.html#ch23" class="toc-link"><span class="toc-num">23</span>Graphs</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">Algorithms</div>
    <a href="phase-6.html#ch24" class="toc-link"><span class="toc-num">24</span>Searching &amp; Sorting</a>
    <a href="phase-6.html#ch25" class="toc-link"><span class="toc-num">25</span>Recursion &amp; DP</a>
    <a href="phase-6.html#ch26" class="toc-link"><span class="toc-num">26</span>Algorithm Patterns</a>
    <a href="phase-6.html#ch27" class="toc-link"><span class="toc-num">27</span>Graph Algorithms</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">Engineering Craft</div>
    <a href="phase-7.html#ch28" class="toc-link"><span class="toc-num">28</span>Design Patterns &amp; SOLID</a>
    <a href="phase-7.html#ch29" class="toc-link"><span class="toc-num">29</span>SQL &amp; Query Mastery</a>
    <a href="phase-7.html#ch30" class="toc-link"><span class="toc-num">30</span>Transactions &amp; NoSQL</a>
    <a href="phase-7.html#ch31" class="toc-link"><span class="toc-num">31</span>Networking &amp; the Internet</a>
    <a href="phase-7.html#ch32" class="toc-link"><span class="toc-num">32</span>Concurrency &amp; Parallelism</a>
    <a href="phase-7.html#ch33" class="toc-link"><span class="toc-num">33</span>Security Engineering</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">Systems &amp; Scale</div>
    <a href="phase-8.html#ch34" class="toc-link"><span class="toc-num">34</span>System Design</a>
    <a href="phase-8.html#ch35" class="toc-link"><span class="toc-num">35</span>Distributed Systems</a>
    <a href="phase-8.html#ch36" class="toc-link"><span class="toc-num">36</span>Performance &amp; Observability</a>
    <a href="phase-8.html#ch37" class="toc-link"><span class="toc-num">37</span>Navigating Large Codebases</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">AI Levels 1&ndash;5</div>
    <a href="phase-9.html#ch38" class="toc-link"><span class="toc-num">38</span>Evaluating &amp; Directing AI Code</a>
    <a href="phase-9.html#ch39" class="toc-link"><span class="toc-num">39</span>Levels 1 &amp; 2 &mdash; Tab Complete &amp; Agent IDE</a>
    <a href="phase-9.html#ch40" class="toc-link"><span class="toc-num">40</span>Level 3 &mdash; Context Engineering</a>
    <a href="phase-9.html#ch41" class="toc-link"><span class="toc-num">41</span>Level 4 &mdash; Compounding Engineering</a>
    <a href="phase-9.html#ch42" class="toc-link"><span class="toc-num">42</span>Level 5 &mdash; MCP, Skills &amp; Capabilities</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">AI Levels 6&ndash;8</div>
    <a href="phase-10.html#ch43" class="toc-link"><span class="toc-num">43</span>Level 6 &mdash; Harness Engineering</a>
    <a href="phase-10.html#ch44" class="toc-link"><span class="toc-num">44</span>Level 7 &mdash; Background Agents</a>
    <a href="phase-10.html#ch45" class="toc-link"><span class="toc-num">45</span>Claude Code in Docker</a>
    <a href="phase-10.html#ch46" class="toc-link"><span class="toc-num">46</span>Level 8 &mdash; Autonomous Agent Teams</a>
    <a href="phase-10.html#ch47" class="toc-link"><span class="toc-num">47</span>The Multiplayer Effect</a>
  </div>
  <div class="toc-group">
    <div class="toc-group-title">Reference</div>
    <a href="appendices.html#glossary" class="toc-link"><span class="toc-num">&oplus;</span>Glossary</a>
    <a href="appendices.html#prompt-library" class="toc-link"><span class="toc-num">&oplus;</span>Prompt Library</a>
    <a href="appendices.html#self-assessment" class="toc-link"><span class="toc-num">&oplus;</span>Self-Assessment</a>
    <a href="appendices.html#common-mistakes" class="toc-link"><span class="toc-num">&oplus;</span>Common Mistakes</a>
    <a href="appendices.html#appendix-d" class="toc-link"><span class="toc-num">&oplus;</span>Troubleshooting</a>
    <a href="appendices.html#appendix-e" class="toc-link"><span class="toc-num">&oplus;</span>Resources</a>
  </div>
</aside>
```

**Note on local vs cross-file links:** When this sidebar appears in a phase file, links to chapters WITHIN that file use `#chXX` anchors (no filename prefix). Links to chapters in OTHER files use `phase-X.html#chXX`. Each phase file must adjust accordingly. For example, in `phase-5.html`, the Data Structures group uses `#ch19`, `#ch20`, etc. but all other groups use `phase-X.html#chXX`.

### B. Phase File Boilerplate

Every phase file follows this exact structure (substitute phase-specific values):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="{{PHASE_DESCRIPTION}}">
<title>{{PHASE_TITLE}} — Zero to Hero</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/design-system.css">
<script>try{if(localStorage.getItem('zth-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}</script>
<script>try{var z=localStorage.getItem('zth-zoom');if(z&&+z>=50&&+z<=200)document.documentElement.style.zoom=+z/100}catch(e){}</script>
</head>
<body>

<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0"><defs>
<marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--accent)"/></marker>
<marker id="arrowhead-muted" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--a5)"/></marker>
</defs></svg>

<button class="hamburger" id="hamburger"><span></span><span></span><span></span></button>
<div class="sidebar-overlay" id="sidebar-overlay"></div>
<button class="toggle" id="themeToggle" aria-label="Toggle theme">
<svg class="is" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
<svg class="im" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
</button>

<!-- SIDEBAR — see Shared Reference A (adjust local anchors for this phase) -->
{{SIDEBAR}}

<div class="main">
<section class="hero hero-sm">
  <div class="hero-badge">{{HERO_BADGE}}</div>
  <h1>{{HERO_TITLE}}</h1>
  <p class="hero-sub">{{HERO_SUB}}</p>
  <div class="hero-meta"><span>{{CHAPTER_RANGE}}</span><span>Phase Gate + TaskForge</span></div>
</section>
<div class="content-wrap">

<div class="callout info">
<div class="callout-title">Before You Begin {{PHASE_NAME}}</div>
<p>{{PREREQ_TEXT}}</p>
</div>

<!-- ===== CHAPTERS GO HERE ===== -->

<!-- ===== PHASE GATE ===== -->

<nav class="phase-nav">
  <a href="{{PREV_PHASE_FILE}}" class="phase-nav-link prev"><span class="phase-nav-label">Previous Phase</span>&larr; {{PREV_PHASE_TITLE}}</a>
  <a href="{{NEXT_PHASE_FILE}}" class="phase-nav-link next"><span class="phase-nav-label">Next Phase</span>{{NEXT_PHASE_TITLE}} &rarr;</a>
</nav>

</div>
</div>

<footer>
<p>Zero to Hero: Programming to Multi-Agent Claude Code &middot; March 2026</p>
</footer>

<script src="js/progress.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ace-builds@1.36.5/src-min-noconflict/ace.js"></script>
<script src="js/theme.js"></script>
<script src="js/sidebar.js"></script>
<script src="js/shared.js"></script>
<script src="js/ace-init.js"></script>
<script src="js/pyodide-runner.js"></script>
<script src="js/quiz.js"></script>
<script src="js/exercise-runner.js"></script>
</body>
</html>
```

### C. Chapter HTML Pattern

```html
<!-- ===== CH XX ===== -->
<section id="chXX" data-ch="XX">
<h2><span class="ch-label">Chapter XX</span> Title &mdash; Subtitle</h2>

<div class="callout info">
<div class="callout-title">Why This Matters Now</div>
<p>Motivation text connecting to what comes next and what AI tools do with this concept.</p>
</div>

<!-- Content sections with <h3> subsections -->

<!-- SVG diagram (at least 1 per chapter, must teach a non-obvious concept) -->
<svg class="diagram" viewBox="..." xmlns="http://www.w3.org/2000/svg" aria-label="Description">
  <!-- Uses design system classes: node-fill, node-accent, label-text, sub-text, arrow -->
</svg>

<!-- Engineering angle callout -->
<div class="callout warn">
<div class="callout-title">Engineering Angle</div>
<p>Real-world application text.</p>
</div>

<!-- TaskForge connection -->
<div class="callout info">
<div class="callout-title">TaskForge Connection</div>
<p>How this concept applies to TaskForge.</p>
</div>

<!-- Interactive exercises (Pyodide or Quiz — at least 1 per chapter) -->
</section>
```

### D. Exercise Patterns

**Pyodide exercise:**
```html
<div class="exercise" data-type="pyodide" data-ch="XX" data-ex="name">
  <div class="exercise-header">
    <h4>Exercise: Title</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt">Instructions.</p>
  <div class="exercise-editor">
    <script type="text/plain" class="starter-code">
# Starter code
def solution():
    pass
    </script>
    <script type="text/plain" class="check-code">
# Validation code — runs after student code
assert solution() == expected, "Error message"
print("All tests passed!")
    </script>
  </div>
  <div class="exercise-hints">
    <button class="hint-toggle">Hint 1</button>
    <div class="hint-content"><p>Hint text.</p></div>
  </div>
</div>
```

**Quiz:**
```html
<div class="quiz" data-ch="XX" data-ex="quiz-name">
  <p class="quiz-question">Question text?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-correct="false">Wrong answer</button>
    <button class="quiz-option" data-correct="true">Correct answer</button>
    <button class="quiz-option" data-correct="false">Wrong answer</button>
    <button class="quiz-option" data-correct="false">Wrong answer</button>
  </div>
  <div class="quiz-feedback"></div>
</div>
```

### E. Quality Requirements Per Chapter

From CLAUDE.md and the spec:
- Minimum 1 SVG diagram (must teach a non-obvious concept, use design system CSS vars, include `aria-label`)
- Minimum 1 static exercise (code example to read/trace)
- Minimum 1 interactive exercise (Pyodide, quiz, or checklist)
- Max 5 new technical terms
- No forward references
- TaskForge reference
- Two-layer tool references (enduring concept + current example)
- WCAG 2.1 AA (4.5:1 contrast, keyboard navigable)

---

## Task Group 0: Prerequisites

### Task 0.1: Rename Existing Phase Files

**Files:**
- Rename: `src/phase-5.html` -> `src/phase-9.html`
- Rename: `src/phase-6.html` -> `src/phase-10.html`

- [ ] **Step 1: Rename phase-5.html to phase-9.html**

```bash
mv "src/phase-5.html" "src/phase-9.html"
```

- [ ] **Step 2: Rename phase-6.html to phase-10.html**

```bash
mv "src/phase-6.html" "src/phase-10.html"
```

- [ ] **Step 3: Verify renames**

```bash
ls src/phase-*.html
```

Expected: phase-1.html through phase-4.html, phase-9.html, phase-10.html (no phase-5 through phase-8 yet).

---

### Task 0.2: Renumber phase-9.html (was Phase 5)

**Files:**
- Modify: `src/phase-9.html`

This file currently has chapters 19–23 which become chapters 38–42. The phase number changes from 5 to 9.

- [ ] **Step 1: Update `<title>` tag**

Change: `Phase 5: Levels 1-5 of Agentic Engineering` -> `Phase 9: AI-Assisted Development`

- [ ] **Step 2: Update `<meta name="description">`**

Change chapter range from `19-23` to `38-42`, phase from `5` to `9`.

- [ ] **Step 3: Update hero section**

Change: `hero-badge` to `Phase 9`, `hero-meta` chapter range to `Chapters 38–42`.

- [ ] **Step 4: Renumber all chapter section IDs and data-ch attributes**

Find and replace throughout the file:
| Find | Replace |
|------|---------|
| `id="ch19"` | `id="ch38"` |
| `id="ch20"` | `id="ch39"` |
| `id="ch21"` | `id="ch40"` |
| `id="ch22"` | `id="ch41"` |
| `id="ch23"` | `id="ch42"` |
| `id="gate5"` | `id="gate9"` |
| `data-ch="19"` | `data-ch="38"` |
| `data-ch="20"` | `data-ch="39"` |
| `data-ch="21"` | `data-ch="40"` |
| `data-ch="22"` | `data-ch="41"` |
| `data-ch="23"` | `data-ch="42"` |
| `Chapter 19` | `Chapter 38` |
| `Chapter 20` | `Chapter 39` |
| `Chapter 21` | `Chapter 40` |
| `Chapter 22` | `Chapter 41` |
| `Chapter 23` | `Chapter 42` |

- [ ] **Step 5: Update body text cross-references**

Search for patterns like `Ch 19`, `Ch 20`, `Ch 24`, etc. in prose text and update. Also update references like `(Ch 20-23)` to `(Ch 39-42)`.

- [ ] **Step 6: Update phase-nav links**

Change:
```html
<a href="phase-4.html" class="phase-nav-link prev">... Phase 4: Building &amp; Deploying</a>
<a href="phase-6.html" class="phase-nav-link next">... Phase 6: Levels 6–8 ...</a>
```
To:
```html
<a href="phase-8.html" class="phase-nav-link prev"><span class="phase-nav-label">Previous Phase</span>&larr; Phase 8: Systems &amp; Scale</a>
<a href="phase-10.html" class="phase-nav-link next"><span class="phase-nav-label">Next Phase</span>Phase 10: AI Orchestration &rarr;</a>
```

- [ ] **Step 7: Update prereq callout**

The "Before You Begin" callout currently references Phase 4 capabilities. Update to note that Phases 5–8 provide the engineering foundations that make AI evaluation possible, and that learners should be comfortable with data structures, algorithms, design patterns, and system design before starting this phase.

- [ ] **Step 8: Update footer text**

Remove or update "Structured around the 8 Levels of Agentic Engineering" if present. Use: "Zero to Hero: Programming to Multi-Agent Claude Code &middot; March 2026"

- [ ] **Step 9: Verify — search for any remaining "19" through "23" chapter references**

Search the file for orphaned old chapter numbers. Every occurrence of `ch19`, `ch20`, `ch21`, `ch22`, `ch23`, `Ch 19`, `Ch 20`, `Ch 21`, `Ch 22`, `Ch 23` should now be gone (replaced with 38-42). Also verify `gate5` has been renamed to `gate9`.

---

### Task 0.3: Renumber phase-10.html (was Phase 6)

**Files:**
- Modify: `src/phase-10.html`

Chapters 24–28 become 43–47. Phase 6 becomes Phase 10.

- [ ] **Step 1: Update `<title>` and `<meta>`**

Phase 6 -> Phase 10. Chapters 24-28 -> 43-47.

- [ ] **Step 2: Update hero section**

`hero-badge` to `Phase 10`, `hero-meta` to `Chapters 43–47`.

- [ ] **Step 3: Renumber all chapter IDs, data-ch, and labels**

| Find | Replace |
|------|---------|
| `id="ch24"` | `id="ch43"` |
| `id="ch25"` | `id="ch44"` |
| `id="ch26"` | `id="ch45"` |
| `id="ch27"` | `id="ch46"` |
| `id="ch28"` | `id="ch47"` |
| `id="gate6"` | `id="gate10"` |
| `data-ch="24"` | `data-ch="43"` |
| `data-ch="25"` | `data-ch="44"` |
| `data-ch="26"` | `data-ch="45"` |
| `data-ch="27"` | `data-ch="46"` |
| `data-ch="28"` | `data-ch="47"` |
| `Chapter 24` | `Chapter 43` |
| `Chapter 25` | `Chapter 44` |
| `Chapter 26` | `Chapter 45` |
| `Chapter 27` | `Chapter 46` |
| `Chapter 28` | `Chapter 47` |

- [ ] **Step 4: Update body text cross-references**

Search for `Ch 24`, `Ch 25`, etc. and references to chapters in phase-9 (e.g., `Ch 19` -> `Ch 38`).

- [ ] **Step 5: Update phase-nav links**

```html
<a href="phase-9.html" class="phase-nav-link prev"><span class="phase-nav-label">Previous Phase</span>&larr; Phase 9: AI-Assisted Development</a>
<a href="appendices.html" class="phase-nav-link next"><span class="phase-nav-label">Next</span>Appendices &rarr;</a>
```

- [ ] **Step 6: Update footer text**

Remove or update "Structured around the 8 Levels of Agentic Engineering" in the footer if present. Use the standard footer: "Zero to Hero: Programming to Multi-Agent Claude Code &middot; March 2026"

- [ ] **Step 7: Verify — no orphaned old chapter numbers remain**

---

### Task 0.4: Update Appendices

**Files:**
- Modify: `src/appendices.html`

- [ ] **Step 1: Remove Appendix F tab button**

Delete: `<button class="app-tab" data-tab="appendix-f">Data Structures</button>`

- [ ] **Step 2: Remove Appendix G tab button**

Delete: `<button class="app-tab" data-tab="appendix-g">Algorithms</button>`

- [ ] **Step 3: Remove Appendix F panel content**

Delete the entire `<div class="app-tab-panel" id="appendix-f">` through its closing `</div><!-- /appendix-f panel -->`.

- [ ] **Step 4: Remove Appendix G panel content**

Delete the entire `<div class="app-tab-panel" id="appendix-g">` through its closing `</div><!-- /appendix-g panel -->`.

- [ ] **Step 5: Update glossary chapter references**

Search the glossary for all terms that reference Ch 19–28 and update to Ch 38–47. Use the renumbering map from the spec. Examples:
- "Ch 19" -> "Ch 38"
- "Ch 20" -> "Ch 39"
- etc.

- [ ] **Step 6: Remove internal Appendix F/G cross-references**

Search for `Appendix F` and `Appendix G` within appendices.html. Remove or update references (e.g., in book recommendations that say "Complements Appendix G" — update to "Complements Phase 6: Algorithms").

- [ ] **Step 7: Update Prompt Library chapter/phase references**

The Prompt Library section has sub-tabs `data-subtab="pl-p5"` and `data-subtab="pl-p6"` with headers "Phase 5 — Levels 1-5" and "Phase 6 — Levels 6-8". Rename:
- `pl-p5` -> `pl-p9`, header to "Phase 9 — AI-Assisted Development (Levels 1-5)"
- `pl-p6` -> `pl-p10`, header to "Phase 10 — AI Orchestration (Levels 6-8)"
- Update all chapter references within these sections: "Ch 19:" -> "Ch 38:", "Ch 20:" -> "Ch 39:", etc. through "Ch 28:" -> "Ch 47:"

- [ ] **Step 8: Update Common Mistakes / Troubleshooting chapter references**

Search for "Phase 5 Issues", "Phase 6 Issues" and rename to "Phase 9 Issues", "Phase 10 Issues". Update chapter number references within (e.g., "Ch 27" -> "Ch 46").

- [ ] **Step 9: Update Self-Assessment references**

Change "After Phase 5" -> "After Phase 9", "After Phase 6" -> "After Phase 10".

- [ ] **Step 10: Update phase-nav back link**

Change from "Phase 6: Levels 6-8" to "Phase 10: AI Orchestration".

- [ ] **Step 11: Verify — no references to appendix-f, appendix-g, or old chapter numbers (19-28) remain**

Note: `appendix-tabs.js` does NOT need modification — it dynamically reads whatever tabs exist in the HTML.

---

### Task 0.5: Update progress.js

**Files:**
- Modify: `src/js/progress.js`

- [ ] **Step 1: Update getChapterMap()**

Replace the existing function body:

```javascript
function getChapterMap() {
    return {
      1: ['01','02','03','04'],
      2: ['05','06','07','08','09'],
      3: ['10','11','12'],
      4: ['13','14','15','16','17','18'],
      5: ['19','20','21','22','23'],
      6: ['24','25','26','27'],
      7: ['28','29','30','31','32','33'],
      8: ['34','35','36','37'],
      9: ['38','39','40','41','42'],
      10: ['43','44','45','46','47']
    };
}
```

- [ ] **Step 2: Add localStorage migration**

Add this function before the `window.ZTH` assignment:

```javascript
/* One-time migration: renumber old ch19-28 progress to ch38-47 */
function migrateProgress() {
    var MIGRATED_KEY = 'zth-progress-v2-migrated';
    try {
        if (localStorage.getItem(MIGRATED_KEY)) return;
        var data = load();
        var renumberMap = {
            '19':'38','20':'39','21':'40','22':'41','23':'42',
            '24':'43','25':'44','26':'45','27':'46','28':'47'
        };
        /* Note: Appendix F/G exercise progress (data-ch="F"/"G") is intentionally
           NOT migrated. Those exercises are being rewritten and expanded into the
           new Phase 5/6 chapters — the content is different enough that old
           completion status is not meaningful. */
        var changed = false;
        Object.keys(renumberMap).forEach(function(oldCh) {
            if (data[oldCh]) {
                var newCh = renumberMap[oldCh];
                data[newCh] = data[oldCh];
                delete data[oldCh];
                changed = true;
            }
        });
        if (changed) save(data);
        localStorage.setItem(MIGRATED_KEY, '1');
    } catch (e) {}
}
```

Call `migrateProgress()` at the top of `restoreAll()`:

```javascript
function restoreAll() {
    migrateProgress();
    var data = load();
    // ... rest unchanged
}
```

- [ ] **Step 3: Verify file parses without syntax errors**

Open any HTML file in browser, check console for JS errors.

---

### Task 0.6: Update index.html

**Files:**
- Modify: `src/index.html`

- [ ] **Step 1: Update hero-meta counts**

Change `28 chapters` to `47 chapters`, `6 phases` to `10 phases`, and `85+ exercises` to `120+ exercises` (both in hero-meta spans and in the `<meta name="description">` tag).

- [ ] **Step 2: Add 4 new phase cards after Phase 4 card**

Insert after the Phase 4 `</a>` and before the current Phase 5 card:

```html
<a href="phase-5.html" class="phase-card">
  <div class="phase-num">Phase 5</div>
  <h3>Data Structures &amp; Complexity</h3>
  <p>How data lives in memory, how to measure performance, and which structure to pick for which problem. The foundation for every engineering decision.</p>
  <div class="phase-chapters">Chapters 19–23 &middot; Data Structures</div>
  <div class="progress-bar"><div class="progress-fill" data-phase="5" style="width:0%"></div></div>
</a>

<a href="phase-6.html" class="phase-card">
  <div class="phase-num">Phase 6</div>
  <h3>Algorithms</h3>
  <p>Searching, sorting, recursion, dynamic programming, and the problem-solving patterns that separate engineers who can evaluate AI solutions from those who can't.</p>
  <div class="phase-chapters">Chapters 24–27 &middot; Algorithms</div>
  <div class="progress-bar"><div class="progress-fill" data-phase="6" style="width:0%"></div></div>
</a>

<a href="phase-7.html" class="phase-card">
  <div class="phase-num">Phase 7</div>
  <h3>Engineering Craft</h3>
  <p>Design patterns, database mastery, networking, concurrency, and security. The skills that make the difference between code that works and code that works in production.</p>
  <div class="phase-chapters">Chapters 28–33 &middot; Engineering Craft</div>
  <div class="progress-bar"><div class="progress-fill" data-phase="7" style="width:0%"></div></div>
</a>

<a href="phase-8.html" class="phase-card">
  <div class="phase-num">Phase 8</div>
  <h3>Systems &amp; Scale</h3>
  <p>System design, distributed architecture, performance, observability, and navigating large codebases. Think like a senior engineer.</p>
  <div class="phase-chapters">Chapters 34–37 &middot; Systems &amp; Scale</div>
  <div class="progress-bar"><div class="progress-fill" data-phase="8" style="width:0%"></div></div>
</a>
```

- [ ] **Step 3: Update existing Phase 5/6 cards to Phase 9/10**

Phase 5 card -> Phase 9: change `phase-num` to "Phase 9", `href` to `phase-9.html`, chapters to "Chapters 38–42", `data-phase="9"`, title to "AI-Assisted Development (Levels 1–5)".

Phase 6 card -> Phase 10: change `phase-num` to "Phase 10", `href` to `phase-10.html`, chapters to "Chapters 43–47", `data-phase="10"`, title to "AI Orchestration (Levels 6–8)".

- [ ] **Step 4: Update inline JS chapter-to-phase maps**

Replace the `chapterPhase` object (~line 231):

```javascript
var chapterPhase = {
    '01':1,'02':1,'03':1,'04':1,
    '05':2,'06':2,'07':2,'08':2,'09':2,
    '10':3,'11':3,'12':3,
    '13':4,'14':4,'15':4,'16':4,'17':4,'18':4,
    '19':5,'20':5,'21':5,'22':5,'23':5,
    '24':6,'25':6,'26':6,'27':6,
    '28':7,'29':7,'30':7,'31':7,'32':7,'33':7,
    '34':8,'35':8,'36':8,'37':8,
    '38':9,'39':9,'40':9,'41':9,'42':9,
    '43':10,'44':10,'45':10,'46':10,'47':10,
    'gate4':4,'gate5':5,'gate6':6,'gate7':7,'gate8':8,'gate9':9,'gate10':10
};
```

Replace the `phaseFiles` object:

```javascript
var phaseFiles = {1:'phase-1.html',2:'phase-2.html',3:'phase-3.html',4:'phase-4.html',5:'phase-5.html',6:'phase-6.html',7:'phase-7.html',8:'phase-8.html',9:'phase-9.html',10:'phase-10.html'};
```

Replace the `chapterOrder` array:

```javascript
var chapterOrder = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','gate4','19','20','21','22','23','gate5','24','25','26','27','gate6','28','29','30','31','32','33','gate7','34','35','36','37','gate8','38','39','40','41','42','gate9','43','44','45','46','47','gate10'];
```

- [ ] **Step 5: Update the blockquote text**

Change "Every chapter in Phases 1–4 exists to make Phases 5–6 possible" to reflect the new 10-phase structure. Update to explain that Phases 1–4 build foundational skills, Phases 5–8 develop engineering mastery, and Phases 9–10 apply it all with AI tools.

- [ ] **Step 6: Verify index.html renders correctly with all 10 phase cards**

---

---

## Task Group 1: Build New Phase 5 — Data Structures & Complexity (Ch 19–23)

### Task 1.1: Create phase-5.html with Ch 19 — Complexity Analysis

**Files:**
- Create: `src/phase-5.html`

- [ ] **Step 1: Create phase-5.html with boilerplate**

Use Shared Reference B with these values:
- `PHASE_DESCRIPTION`: "Phase 5: Data Structures and Complexity — complexity analysis, arrays, linked lists, hash tables, trees, and graphs. Build the CS foundations for engineering judgment. Chapters 19–23."
- `PHASE_TITLE`: "Phase 5: Data Structures &amp; Complexity"
- `HERO_BADGE`: "Phase 5 &mdash; Data Structures"
- `HERO_TITLE`: "Data Structures &amp; <em>Complexity</em>"
- `HERO_SUB`: "How data lives in memory, how to measure performance, and which structure to pick for which problem. Every engineering decision starts here."
- `CHAPTER_RANGE`: "Chapters 19–23"
- `PREREQ_TEXT`: "This phase assumes you can: write Python functions with tests (Ch 05, 09), use lists, dicts, and sets for everyday tasks (Ch 06), and build a Flask API with a database (Ch 14-15). If any of these feel shaky, revisit the relevant chapter first."
- `PREV_PHASE`: phase-4.html, "Phase 4: Building &amp; Deploying"
- `NEXT_PHASE`: phase-6.html, "Phase 6: Algorithms"
- Sidebar: Use Shared Reference A with local `#ch19`-`#ch23` anchors for the Data Structures group.

- [ ] **Step 2: Write Ch 19 — Complexity Analysis**

Content outline from spec:
- **Why This Matters Now** callout: You need to predict how code performs before running it. When AI generates a nested loop over 10 million records, can you tell it'll take hours? Big-O gives you the vocabulary.
- **Section: What Is Big-O?** — Counting operations, dropping constants, dominant terms
- **Section: Common Complexity Classes** — O(1) through O(2^n) with concrete Python examples (dict lookup vs list search vs nested loop)
- **Section: Analyzing Your Own Code** — How to look at a loop and determine its complexity. Nested loops, sequential blocks, recursive calls.
- **Section: Space Complexity** — When memory is the bottleneck. In-place vs creating new collections.
- **Section: Amortized Analysis** — Dynamic array doubling as the canonical example. Why `list.append()` is O(1) amortized.
- **Section: When Big-O Lies** — Constant factors, cache locality, small n. A O(n^2) insertion sort beats O(n log n) merge sort for n < 50.
- **Engineering Angle callout:** Profiling real code often contradicts theoretical analysis. `timeit` and `cProfile` tell the truth. Know when to trust theory and when to measure.
- **TaskForge Connection callout:** Analyze TaskForge's current operations — adding a task is O(1), searching by title is O(n), sorting by priority is O(n log n). Which becomes the bottleneck as the task list grows?
- **SVG Diagram:** "Complexity Growth" — visual chart showing how O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n) diverge as n grows. X-axis: input size. Y-axis: operations. Must include `aria-label`.
- **Pyodide Exercise:** `data-ch="19" data-ex="complexity"` — Given 3 Python functions, predict their Big-O complexity, then verify by timing them with increasing input sizes.
- **Quiz:** `data-ch="19" data-ex="quiz-bigo"` — "What is the time complexity of searching for an element in an unsorted list?" (O(n) correct)

- [ ] **Step 3: Verify Ch 19 renders, diagram displays, exercise runs**

---

### Task 1.2: Write Ch 20 — Linear Structures

**Files:**
- Modify: `src/phase-5.html`

- [ ] **Step 1: Add Ch 20 section after Ch 19**

Content from spec:
- How arrays work in memory (contiguous allocation, cache locality)
- Dynamic arrays — amortized doubling (reference Ch 19 analysis)
- Linked lists — singly/doubly linked, node structure, insertion/deletion at head O(1), access O(n)
- When linked lists beat arrays and when they don't (cache misses in practice)
- Stacks (LIFO) — call stack visualization, undo systems, expression evaluation, parentheses matching
- Queues & Deques (FIFO) — BFS preview, task scheduling, `collections.deque`
- **SVG Diagram:** Memory layout comparison — array (contiguous blocks) vs linked list (scattered nodes with pointers). Must show why arrays are cache-friendly. `aria-label` required.
- **Engineering Angle:** Why linked lists are textbook favorites but rarely the right choice in modern code. Cache locality matters more than Big-O for small n. Python's `list` (dynamic array) beats linked lists in almost every practical scenario.
- **TaskForge exercise:** `data-ch="20" data-ex="undo-stack"` — Implement an undo stack for TaskForge. Push task operations (add, delete, update) onto a stack, support undo() that reverses the last operation.
- **Migrate** relevant Appendix F exercises (F.1, F.2, F.3) — update `data-ch` from `"F"` to `"20"`, keep exercise IDs.

---

### Task 1.3: Write Ch 21 — Hash Tables, Sets & Maps

**Files:**
- Modify: `src/phase-5.html`

- [ ] **Step 1: Add Ch 21 section**

Content from spec:
- How hashing works — hash functions, modulo bucketing, collision resolution (chaining with linked lists, open addressing with linear probing)
- Load factors — when to resize, amortized O(1) insert
- Python dict internals — compact dict layout, insertion-ordered since 3.7
- Sets — O(1) membership testing, deduplication, union/intersection/difference
- When hashing breaks — mutable keys (unhashable), hash collision attacks, worst-case O(n)
- **SVG Diagram:** Hash table with chaining — show keys being hashed to bucket indices, with a collision chain at one bucket. `aria-label` required.
- **Engineering Angle:** When to use dict vs set vs list for lookups. How databases use hash indexes for equality queries.
- **TaskForge exercise:** `data-ch="21" data-ex="tag-index"` — Build a tag-based index for TaskForge tasks. Given a list of tasks with tags, build a hash map from tag -> list of task IDs. Support `tasks_by_tag("urgent")` in O(1).
- **Migrate** Appendix F.4 exercise — update `data-ch` to `"21"`.

---

### Task 1.4: Write Ch 22 — Trees

**Files:**
- Modify: `src/phase-5.html`

- [ ] **Step 1: Add Ch 22 section**

Content from spec:
- Binary tree structure — nodes with left/right children
- Traversals: inorder (sorted order for BST), preorder (copy structure), postorder (delete), level-order (BFS)
- BSTs — insert, search, delete. Why balance matters (degenerate case = linked list, O(n))
- Heaps & priority queues — min-heap property, `heapq` module, top-K problems
- Tries — prefix trees for autocomplete, word search
- B-trees (conceptual) — why databases use wide, shallow trees instead of BSTs. Disk I/O optimization.
- **SVG Diagram:** BST with balanced vs degenerate comparison. Show same data inserted in sorted order (degenerate) vs random order (balanced). `aria-label` required.
- **Engineering Angle:** You almost never implement trees yourself. But you need to understand them because database indexes are B-trees, file systems are tree-structured, and `heapq` is the right tool for "give me the top 10."
- **TaskForge exercise:** `data-ch="22" data-ex="priority-queue"` — Implement priority-based task scheduling using `heapq`. Tasks with lower priority numbers get processed first. Support add_task() and next_task().
- **Migrate** Appendix F.5 exercise — update `data-ch` to `"22"`.

---

### Task 1.5: Write Ch 23 — Graphs

**Files:**
- Modify: `src/phase-5.html`

- [ ] **Step 1: Add Ch 23 section**

Content from spec:
- Graph vocabulary: nodes/vertices, edges, directed/undirected, weighted/unweighted, cycles, paths
- Representations: adjacency list (dict of lists) vs adjacency matrix (2D array). Trade-offs: space, lookup time, iteration
- Modeling real problems as graphs — dependency trees, social networks, route maps
- Building a Graph class from scratch
- When graphs show up: package manager dependency resolution, network topology, recommendation engines, build systems
- **SVG Diagram:** Adjacency list vs adjacency matrix for the same small graph. Show the graph visually, then both representations side by side. `aria-label` required.
- **Engineering Angle:** How package managers like pip resolve dependencies (topological sort, covered in Ch 27). How routing algorithms find shortest paths.
- **TaskForge exercise:** `data-ch="23" data-ex="task-dag"` — Model TaskForge task dependencies as a directed acyclic graph. Build a Graph class, add tasks as nodes and dependencies as edges. Implement has_cycle() to validate the DAG.
- **Migrate** Appendix F.6 exercise — update `data-ch` to `"23"`.

---

### Task 1.6: Write Phase 5 Gate

**Files:**
- Modify: `src/phase-5.html`

- [ ] **Step 1: Add Phase 5 Gate section after Ch 23**

Follow the pattern of existing phase gates. Include:
- Summary of what the learner can now do
- TaskForge checkpoint: "Implement a task dependency system for TaskForge using a DAG (Ch 23) with priority queue scheduling (Ch 22) and undo support (Ch 20). Given a set of tasks with dependencies, your system should: detect invalid circular dependencies, schedule tasks in dependency order, and support undoing the last scheduling decision."
- Bridge callout to Phase 6 (Algorithms)

---

## Task Group 2: Build New Phase 6 — Algorithms (Ch 24–27)

### Task 2.1: Create phase-6.html with Ch 24 — Searching & Sorting

**Files:**
- Create: `src/phase-6.html`

- [ ] **Step 1: Create phase-6.html with boilerplate**

Use Shared Reference B:
- `PHASE_DESCRIPTION`: "Phase 6: Algorithms — searching, sorting, recursion, dynamic programming, and problem-solving patterns. Chapters 24–27."
- `PHASE_TITLE`: "Phase 6: Algorithms"
- `HERO_BADGE`: "Phase 6 &mdash; Algorithms"
- `HERO_TITLE`: "<em>Algorithms</em>"
- `HERO_SUB`: "Searching, sorting, recursion, dynamic programming, and the problem-solving patterns that let you evaluate any solution — human or AI-generated."
- `CHAPTER_RANGE`: "Chapters 24–27"
- `PREREQ_TEXT`: "This phase assumes you can: analyze the time and space complexity of code (Ch 19), implement and use stacks, queues, hash tables, trees, and graphs (Ch 20-23), and reason about when one data structure is better than another."
- `PREV_PHASE`: phase-5.html, "Phase 5: Data Structures"
- `NEXT_PHASE`: phase-7.html, "Phase 7: Engineering Craft"

- [ ] **Step 2: Write Ch 24 — Searching & Sorting**

Content from spec. Include:
- Linear search, binary search (implementation + off-by-one pitfalls + search space problems)
- Sorting: insertion sort, merge sort, quicksort, heapsort
- Non-comparison sorts: counting sort, radix sort
- Stability, adaptivity, Timsort
- **SVG Diagram:** Merge sort divide-and-conquer visualization — show an array being split and merged back together. `aria-label` required.
- **Pyodide exercise:** `data-ch="24" data-ex="binary-search"` — Implement binary search. Then implement it for a "search space" problem: find the minimum speed to finish tasks in time.
- **Migrate** Appendix G.1 and G.2 exercises — update `data-ch` to `"24"`.

---

### Task 2.2: Write Ch 25 — Recursion & Dynamic Programming

**Files:**
- Modify: `src/phase-6.html`

- [ ] **Step 1: Add Ch 25 section**

Content from spec:
- Recursive thinking, base cases, the call stack
- Stack overflow, Python's recursion limit
- Memoization with `@functools.lru_cache`
- Bottom-up tabulation
- Classic DP: Fibonacci, coin change, LCS, knapsack
- Recognizing DP problems
- **SVG Diagram:** Recursive call tree for Fibonacci — show the repeated subproblems, then show memoized version with cache hits highlighted. `aria-label` required.
- **Pyodide exercise:** `data-ch="25" data-ex="coin-change"` — Solve the coin change problem: given denominations and a target, find the minimum number of coins. First recursive, then memoized, then bottom-up.
- **Migrate** Appendix G.3 exercises — update `data-ch` to `"25"`.

---

### Task 2.3: Write Ch 26 — Algorithm Patterns

**Files:**
- Modify: `src/phase-6.html`

- [ ] **Step 1: Add Ch 26 section**

Content from spec:
- Two pointers, sliding window, greedy, divide and conquer, backtracking
- Decision framework: problem shape -> pattern
- **SVG Diagram:** Sliding window visualization — show a window moving across an array, tracking the current sum/max. `aria-label` required.
- **Pyodide exercise:** `data-ch="26" data-ex="sliding-window"` — Implement sliding window to find the maximum sum of any k consecutive elements. Then: longest substring without repeating characters.
- **Quiz:** `data-ch="26" data-ex="quiz-pattern"` — "A problem asks for the shortest subarray with sum >= target. Which pattern fits best?" (Sliding window correct)

---

### Task 2.4: Write Ch 27 — Graph Algorithms & Problem Solving

**Files:**
- Modify: `src/phase-6.html`

- [ ] **Step 1: Add Ch 27 section**

Content from spec:
- Recall callout referencing Ch 23 Graph class
- BFS, DFS, Dijkstra's, topological sort, Union-Find
- Problem-solving framework
- **SVG Diagram:** BFS vs DFS traversal order on the same graph — show numbered order of node visits for each. `aria-label` required.
- **Pyodide exercise:** `data-ch="27" data-ex="topo-sort"` — Implement topological sort on a DAG of TaskForge tasks. Given task dependencies, return a valid execution order. Detect if no valid order exists (cycle).
- **Migrate** Appendix G.4 and G.5 content — update `data-ch` to `"27"`.

---

### Task 2.5: Write Phase 6 Gate

**Files:**
- Modify: `src/phase-6.html`

- [ ] **Step 1: Add Phase 6 Gate**

TaskForge checkpoint: "Given a set of TaskForge tasks with dependencies, priorities, and time estimates, find the optimal execution order. Use topological sort (Ch 27) to respect dependencies, then apply the knapsack variant (Ch 25) to maximize completed priority within a time budget."

---

## Task Group 3: Build New Phase 7 — Engineering Craft (Ch 28–33)

### Task 3.1: Create phase-7.html with Ch 28 — Design Patterns & Clean Architecture

**Files:**
- Create: `src/phase-7.html`

- [ ] **Step 1: Create phase-7.html with boilerplate**

Use Shared Reference B:
- `PHASE_TITLE`: "Phase 7: Engineering Craft"
- `HERO_BADGE`: "Phase 7 &mdash; Engineering Craft"
- `HERO_TITLE`: "Engineering <em>Craft</em>"
- `HERO_SUB`: "Design patterns, database mastery, networking, concurrency, and security. The skills that separate code that works from code that works in production."
- `CHAPTER_RANGE`: "Chapters 28–33"
- `PREREQ_TEXT`: "This phase assumes you can: analyze algorithmic complexity (Ch 19), implement common data structures (Ch 20-23), apply algorithm patterns to solve problems (Ch 24-27), and build a full-stack web application with Flask and SQLite (Ch 14-15)."
- `PREV_PHASE`: phase-6.html, "Phase 6: Algorithms"
- `NEXT_PHASE`: phase-8.html, "Phase 8: Systems &amp; Scale"

- [ ] **Step 2: Write Ch 28 — Design Patterns & Clean Architecture**

Content from spec:
- SOLID principles with real violation/fix examples
- Creational: Factory, Builder, Singleton (anti-pattern warning)
- Structural: Adapter, Decorator, Facade
- Behavioral: Observer, Strategy, Command
- DI, refactoring patterns, code smells
- **SVG Diagram:** Strategy pattern UML-style — show how swapping storage backends (file, SQLite, API) works through a common interface without changing the caller. `aria-label` required.
- **Pyodide exercise:** `data-ch="28" data-ex="strategy"` — Refactor a TaskForge storage class from if/else branching to Strategy pattern. Start with a monolithic save() that checks `self.backend` and has separate code paths. Refactor to a `StorageStrategy` interface with `FileStorage` and `SQLiteStorage` implementations.
- **Quiz:** `data-ch="28" data-ex="quiz-solid"` — "A class handles user authentication, database queries, AND email sending. Which SOLID principle does it violate?" (Single Responsibility correct)

---

### Task 3.2: Write Ch 29 — SQL & Query Mastery

**Files:**
- Modify: `src/phase-7.html`

- [ ] **Step 1: Add Ch 29 section**

Content from spec:
- JOINs (inner, outer, cross, self), subqueries, CTEs, window functions
- Indexing (B-tree, composite, covering), when indexes hurt
- EXPLAIN plans, N+1 problem
- Normalization 1NF-3NF, when to denormalize
- **SVG Diagram:** B-tree index structure — show how a B-tree index enables O(log n) lookups on a database table vs O(n) full scan. `aria-label` required.
- **Pyodide exercise:** `data-ch="29" data-ex="query-optimize"` — Given a slow query that does a full table scan, add the right index and rewrite with a CTE to make it efficient. (Use Python sqlite3 module which works in Pyodide.)
- **Quiz:** `data-ch="29" data-ex="quiz-index"` — "Adding an index on column X speeds up SELECT queries that filter on X but slows down what?" (INSERT/UPDATE correct)

---

### Task 3.3: Write Ch 30 — Transactions, NoSQL & Data Evolution

**Files:**
- Modify: `src/phase-7.html`

- [ ] **Step 1: Add Ch 30 section**

Content from spec:
- ACID properties, isolation levels, deadlocks, optimistic vs pessimistic locking
- Connection pooling
- NoSQL landscape with when-to-use guidance
- Migrations, schema evolution
- **SVG Diagram:** Isolation levels spectrum — show read uncommitted through serializable with what anomalies each allows (dirty reads, phantom reads, etc.). `aria-label` required.
- **Pyodide exercise:** `data-ch="30" data-ex="transaction"` — Demonstrate a race condition with concurrent TaskForge updates using sqlite3 transactions. Show how proper transaction isolation prevents the bug.
- **Quiz:** `data-ch="30" data-ex="quiz-nosql"` — "Your application needs flexible schemas, nested documents, and horizontal scaling. Which database type fits best?" (Document store correct)

---

### Task 3.4: Write Ch 31 — Networking & the Internet

**Files:**
- Modify: `src/phase-7.html`

Note: Pyodide cannot do real network I/O. Use quiz/checklist format for interactive exercises.

- [ ] **Step 1: Add Ch 31 section**

Content from spec:
- TCP/IP stack, DNS, TCP vs UDP, HTTP deep dive, TLS/HTTPS, WebSockets
- Debugging tools: curl, dig, traceroute
- **SVG Diagram:** TCP/IP layer model — show the 5 layers with example protocols at each level, and trace a web request from application layer down through physical and back up. `aria-label` required.
- **Quiz 1:** `data-ch="31" data-ex="quiz-http"` — "What HTTP status code means 'the resource was created successfully'?" (201 correct)
- **Quiz 2:** `data-ch="31" data-ex="quiz-dns"` — "Put these steps in order: browser checks DNS cache, OS resolver queries root server, recursive resolver contacts authoritative server, IP address returned" (checklist-style)
- **Static exercise:** Trace a failing API call step by step through DNS -> TCP -> TLS -> HTTP. Given symptoms (connection refused, SSL error, 403), identify which layer failed.

---

### Task 3.5: Write Ch 32 — Concurrency & Parallelism

**Files:**
- Modify: `src/phase-7.html`

Note: Pyodide doesn't support threading or real asyncio. Use quiz format.

- [ ] **Step 1: Add Ch 32 section**

Content from spec:
- Processes vs threads vs async, GIL, threading, async/await, multiprocessing
- Race conditions, deadlocks, starvation, thundering herd
- Patterns: producer/consumer, thread pool, fan-out/fan-in
- **SVG Diagram:** Race condition visualization — two threads reading, incrementing, and writing the same counter, showing interleaved execution that produces wrong result. `aria-label` required.
- **Quiz:** `data-ch="32" data-ex="quiz-race"` — "Two threads both read counter=5, increment to 6, and write. What is the final value?" (6 correct, not 7)
- **Quiz:** `data-ch="32" data-ex="quiz-model"` — "Your task is CPU-bound (image processing). Which Python concurrency model do you use?" (multiprocessing correct, because GIL)
- **Static exercise:** Read a code snippet with a deadlock. Identify the two locks and explain why neither thread can proceed.

---

### Task 3.6: Write Ch 33 — Security Engineering

**Files:**
- Modify: `src/phase-7.html`

- [ ] **Step 1: Add Ch 33 section**

Content from spec:
- Auth (hashing/bcrypt, JWT, OAuth2), authorization (RBAC, ABAC), encryption, OWASP top 5 with examples, secure coding, secrets management
- **SVG Diagram:** OAuth2 authorization code flow — show the redirect dance between client, auth server, and resource server. `aria-label` required.
- **Pyodide exercise:** `data-ch="33" data-ex="sql-injection"` — Given a vulnerable Flask-style function that uses string formatting for SQL queries, exploit it with SQL injection, then fix it with parameterized queries.
- **Quiz:** `data-ch="33" data-ex="quiz-hash"` — "Why is bcrypt preferred over SHA-256 for password hashing?" (bcrypt is deliberately slow + includes salt correct)

---

### Task 3.7: Write Phase 7 Gate

**Files:**
- Modify: `src/phase-7.html`

- [ ] **Step 1: Add Phase 7 Gate**

TaskForge checkpoint: "Refactor TaskForge using the Strategy pattern (Ch 28). Add authentication with bcrypt password hashing (Ch 33). Optimize the task search query with proper indexing (Ch 29). Your refactored TaskForge should demonstrate SOLID principles and handle concurrent requests safely."

---

## Task Group 4: Build New Phase 8 — Systems & Scale (Ch 34–37)

### Task 4.1: Create phase-8.html with Ch 34 — System Design Fundamentals

**Files:**
- Create: `src/phase-8.html`

- [ ] **Step 1: Create phase-8.html with boilerplate**

Use Shared Reference B:
- `PHASE_TITLE`: "Phase 8: Systems &amp; Scale"
- `HERO_BADGE`: "Phase 8 &mdash; Systems &amp; Scale"
- `HERO_TITLE`: "Systems &amp; <em>Scale</em>"
- `HERO_SUB`: "System design, distributed architecture, performance, observability, and navigating large codebases. Think like a senior engineer."
- `CHAPTER_RANGE`: "Chapters 34–37"
- `PREREQ_TEXT`: "This phase assumes you can: apply design patterns and SOLID principles (Ch 28), write optimized SQL queries with proper indexing (Ch 29-30), reason about networking and HTTP at the protocol level (Ch 31), understand concurrency models and their pitfalls (Ch 32), and implement authentication and secure coding practices (Ch 33)."
- `PREV_PHASE`: phase-7.html, "Phase 7: Engineering Craft"
- `NEXT_PHASE`: phase-9.html, "Phase 9: AI-Assisted Development"

- [ ] **Step 2: Write Ch 34 — System Design Fundamentals**

Content from spec:
- Vertical vs horizontal scaling, stateless vs stateful
- Load balancing, caching layers, CDNs, message queues, rate limiting
- Trade-off analysis
- **SVG Diagram:** System architecture for a web app at scale — load balancer, app servers, cache layer, database with read replicas, message queue. Show request flow. `aria-label` required.
- **Quiz:** `data-ch="34" data-ex="quiz-cache"` — "Your cache returns stale data after a database update. Which cache invalidation strategy would prevent this?" (Write-through correct)
- **Static exercise:** "Design TaskForge for 10,000 concurrent users. Draw the architecture. Identify the first bottleneck. Propose a solution. What trade-offs does your solution introduce?"

---

### Task 4.2: Write Ch 35 — Distributed Systems & Architecture

**Files:**
- Modify: `src/phase-8.html`

- [ ] **Step 1: Add Ch 35 section**

Content from spec:
- Monolith vs microservices, CAP theorem, event-driven architecture, API design at scale, service communication, data consistency patterns
- **SVG Diagram:** CAP theorem triangle — show consistency, availability, partition tolerance with real database examples at each vertex/edge (CP: MongoDB in strict mode, AP: Cassandra, CA: single-node PostgreSQL). `aria-label` required.
- **Quiz:** `data-ch="35" data-ex="quiz-cap"` — "During a network partition, your system must stay available. What must you sacrifice?" (Consistency correct)
- **Static exercise:** "Decompose TaskForge into microservices. Draw the service boundaries. Design the API contracts between them. What happens when the Task Service is down but the User Service is up?"

---

### Task 4.3: Write Ch 36 — Performance & Observability

**Files:**
- Modify: `src/phase-8.html`

- [ ] **Step 1: Add Ch 36 section**

Content from spec:
- Profiling (cProfile, memory_profiler, flame graphs), caching in practice, three pillars (logs, metrics, traces), structured logging, monitoring & alerting (golden signals, SLIs/SLOs), distributed tracing, debugging production
- **SVG Diagram:** The three pillars of observability — logs, metrics, traces — show what question each answers and how they connect (a trace ID in a log line, a spike in a metric leading to trace investigation). `aria-label` required.
- **Pyodide exercise:** `data-ch="36" data-ex="profiling"` — Profile a deliberately slow Python function using `cProfile`. Identify the bottleneck, optimize it, and verify the improvement.
- **Quiz:** `data-ch="36" data-ex="quiz-golden"` — "Which of the four golden signals tells you what percentage of requests are failing?" (Error rate correct)

---

### Task 4.4: Write Ch 37 — Navigating & Evolving Large Codebases

**Files:**
- Modify: `src/phase-8.html`

- [ ] **Step 1: Add Ch 37 section**

Content from spec:
- Reading unfamiliar code, understanding legacy systems, safe changes (characterization tests, strangler fig, feature flags), technical debt, code review, working with teams (ADRs, RFCs)
- **SVG Diagram:** Strangler fig pattern — show old monolith being gradually replaced by new services, with a facade routing requests to old or new code. `aria-label` required.
- **Quiz:** `data-ch="37" data-ex="quiz-debt"` — "A team has a working but messy module. They want to rewrite it from scratch. What is the safer alternative?" (Strangler fig / incremental replacement correct)
- **Static exercise:** "You're given a 'legacy' TaskForge codebase with 5 intentional code smells. Identify each smell, write a characterization test that captures current behavior, then safely refactor one smell at a time without breaking the tests."

---

### Task 4.5: Write Phase 8 Gate

**Files:**
- Modify: `src/phase-8.html`

- [ ] **Step 1: Add Phase 8 Gate**

TaskForge checkpoint: "Design TaskForge at scale: write a system design document covering architecture, database choice, caching strategy, and observability. Add structured JSON logging to the Flask app (Ch 36). Then perform the legacy refactoring exercise: given a messy TaskForge variant, write characterization tests and refactor safely (Ch 37)."

---

## Task Group 5: Sidebar Sync & Final Cross-Cutting

### Task 5.1: Sync Sidebar Across All Existing Files

**Files:**
- Modify: `src/index.html`, `src/phase-1.html`, `src/phase-2.html`, `src/phase-3.html`, `src/phase-4.html`, `src/appendices.html`

The new phase-5 through phase-10 files already have the correct sidebar from creation. The existing 6 files (index.html, phase-1 through phase-4, and appendices) need their sidebars replaced.

- [ ] **Step 1: Replace sidebar in index.html**

Replace the entire `<aside class="sidebar" id="sidebar">...</aside>` block with the new sidebar from Shared Reference A. All links use `phase-X.html#chXX` format (index.html has no local chapter anchors). Appendix links use `appendices.html#ID`.

- [ ] **Step 2: Replace sidebar in phase-1.html**

Replace the entire `<aside class="sidebar" id="sidebar">...</aside>` block with the new sidebar from Shared Reference A. Adjust links: phase-1 chapters use `#chXX` anchors, all others use `phase-X.html#chXX`.

- [ ] **Step 3: Replace sidebar in phase-2.html**

Same as above, with phase-2 chapters using local `#chXX` anchors.

- [ ] **Step 4: Replace sidebar in phase-3.html**

Same pattern.

- [ ] **Step 5: Replace sidebar in phase-4.html**

Same pattern.

- [ ] **Step 6: Replace sidebar in appendices.html**

Appendices sidebar uses `#glossary`, `#prompt-library`, etc. for local links. All phase links use `phase-X.html#chXX`.

- [ ] **Step 7: Verify — check that all 12 HTML files have identical sidebar content (modulo local anchors)**

---

### Task 5.2: Update phase-2.html Bridge Callouts

**Files:**
- Modify: `src/phase-2.html`

- [ ] **Step 1: Update Appendix F bridge callout in Ch 06**

Find the callout with title "Going Deeper: Data Structures Under the Hood" (around line 835-837). Change:
- "Appendix F teaches you how they work internally" -> "Phase 5 teaches you how they work internally"
- Link `appendices.html#appendix-f` -> `phase-5.html#ch20`

- [ ] **Step 2: Update any Appendix G references**

Search for "Appendix G" in phase-2.html and redirect to `phase-6.html`.

- [ ] **Step 3: Verify no appendix-f or appendix-g links remain in phase-2.html**

---

### Task 5.3: Update Phase-Nav Links on Existing Files

**Files:**
- Modify: `src/phase-4.html`

- [ ] **Step 1: Update phase-4.html phase-nav**

Change the "next" link from `phase-5.html` (Levels 1-5) to `phase-5.html` (Data Structures). The href stays the same but the label changes:

```html
<a href="phase-5.html" class="phase-nav-link next"><span class="phase-nav-label">Next Phase</span>Phase 5: Data Structures &rarr;</a>
```

---

### Task 5.4: Add New Glossary Terms

**Files:**
- Modify: `src/appendices.html`

- [ ] **Step 1: Add ~60-80 new glossary terms**

Add terms alphabetically into the existing letter-group structure. Key new terms include:

From Phase 5: adjacency list, adjacency matrix, amortized analysis, Big-O notation, binary search tree, cache locality, collision resolution, complexity class, DAG, deque, dynamic array, graph, hash function, hash table, heap, linked list, load factor, priority queue, queue, space complexity, stack, time complexity, trie

From Phase 6: backtracking, binary search, BFS, DFS, Dijkstra's algorithm, divide and conquer, dynamic programming, greedy algorithm, memoization, merge sort, quicksort, sliding window, tabulation, topological sort, two pointers, Union-Find

From Phase 7: ACID, adapter pattern, authorization, bcrypt, CAP theorem, circuit breaker, connection pooling, CTE, deadlock, decorator pattern, dependency injection, DNS, facade pattern, factory pattern, GIL, HTTP/2, idempotency, isolation level, JWT, mutex, N+1 problem, normalization, OAuth2, observer pattern, OWASP, RBAC, race condition, singleton, SOLID, strategy pattern, TLS, WebSocket, window function

From Phase 8: ADR, cache invalidation, CDN, distributed tracing, event sourcing, flame graph, golden signals, load balancer, message queue, microservices, monolith, observability, postmortem, SLI/SLO, strangler fig, technical debt

Each term follows the existing format: `<dt>` with the term and `<dd>` with the definition. Max one sentence per definition.

- [ ] **Step 2: Verify glossary letter-bar still works with new terms**

---

### Task 5.5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (project root)

- [ ] **Step 1: Update Project Overview**

Change "28 chapters across 6 phases" to "47 chapters across 10 phases".

- [ ] **Step 2: Update or remove Rule 16**

Change "Each phase file must stay under 1200 lines / 500KB" to "No hard line limit. If a phase file exceeds ~3000 lines, consider splitting. Content goes where it pedagogically belongs."

- [ ] **Step 3: Update file references**

Add phase-5 through phase-10 to any file listings.

---

## Task Group 6: Verification

### Task 6.1: Link Verification

- [ ] **Step 1: Check all internal links across all 12 HTML files**

Search every `href` that points to another file or anchor. Verify:
- All `phase-X.html#chXX` links point to existing files and valid IDs
- All appendix links still resolve (no appendix-f or appendix-g references remain anywhere)
- All phase-nav prev/next links form a complete chain: phase-1 -> phase-2 -> ... -> phase-10 -> appendices

- [ ] **Step 2: Check for orphaned old chapter numbers**

Search all files for `ch19` through `ch28` (without the `3` or `4` prefix). These should only exist in phase-9.html (as ch38-42) and phase-10.html (as ch43-47), never as the bare old numbers.

---

### Task 6.2: Rendering Verification

- [ ] **Step 1: Verify each new file renders**

Open phase-5.html through phase-8.html in browser. Check:
- Hero section displays correctly
- Sidebar shows all 10 phases
- All chapters render
- SVG diagrams display
- Both dark and light themes work

- [ ] **Step 2: Verify renamed files render**

Open phase-9.html and phase-10.html. Check:
- All chapter numbers show as 38-42 and 43-47
- No old chapter numbers visible
- Phase-nav links work

- [ ] **Step 3: Verify index.html**

Open index.html. Check:
- Shows "47 chapters" and "10 phases"
- All 10 phase cards display with correct info
- Progress bars render

---

### Task 6.3: Interactive Element Verification

- [ ] **Step 1: Test Pyodide exercises in new phases**

Run each Pyodide exercise in the browser:
- Ch 19: complexity timing exercise
- Ch 20: undo stack exercise
- Ch 21: tag index exercise
- Ch 22: priority queue exercise
- Ch 23: DAG exercise
- Ch 24: binary search exercise
- Ch 25: coin change exercise
- Ch 26: sliding window exercise
- Ch 27: topological sort exercise
- Ch 29: query optimization exercise
- Ch 30: transaction exercise
- Ch 33: SQL injection exercise
- Ch 36: profiling exercise

Verify each: starter code loads, Run button works, Check button validates.

- [ ] **Step 2: Test all quizzes**

Click through all quiz options in new chapters. Verify correct answer shows green, wrong shows red.

- [ ] **Step 3: Verify progress tracking**

Complete an exercise in a new chapter. Refresh the page. Verify the completion persists (progress.js with updated chapter map).

---

### Task 6.4: Mobile Responsiveness Check

- [ ] **Step 1: Check all new phase files at 700px width**

Verify: sidebar collapses to hamburger, content doesn't overflow, diagrams scale, exercises remain usable.

---

### Task 6.5: Console Error Check

- [ ] **Step 1: Open each new phase file and check browser console**

No JavaScript errors should appear. Common issues to watch for: undefined functions, wrong element selectors, malformed exercise data attributes.

---

## Execution Notes

### Parallelization

These task groups can be parallelized:
- **Task Group 0** (Tasks 0.1-0.7) is sequential — must complete first
- **Task Groups 1, 2, 3, 4** (building new phases) are fully independent and can run in parallel after Task Group 0
- **Task Group 5** (cross-cutting) depends on all phase files existing
- **Task Group 6** (verification) depends on everything

### Content Depth

Each chapter should be comprehensive. Target 150-400 lines of HTML content per chapter (comparable to existing chapters). The spec in `docs/superpowers/specs/2026-03-18-senior-engineer-expansion-design.md` has the detailed content outline for each chapter — follow it precisely.

### Exercise Content

For chapters where Pyodide can't demonstrate the concept (Ch 31 Networking, Ch 32 Concurrency, Ch 34-35 System Design, Ch 37 Large Codebases), use quiz and checklist formats for interactive exercises. Code examples in these chapters should be read-and-trace (static `<pre><code>` blocks), not run-in-browser.
