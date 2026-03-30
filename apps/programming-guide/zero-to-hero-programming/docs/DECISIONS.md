# Design Decisions Log

### D001: Sidebar links use relative paths for cross-phase, anchors for same-phase
- **Context:** Spec requires identical sidebar across all files. Chapters within the current phase need `#chXX` anchors; chapters in other phases need `phase-N.html#chXX`.
- **Alternatives:** (a) All absolute paths (breaks local file:// serving), (b) JavaScript-based routing (adds complexity)
- **Rationale:** Simplest approach that works both with a local server and file:// protocol.
- **Reversible:** Y

### D002: Hero SVG uses terminal window silhouette instead of truck
- **Context:** Spec says "no truck SVGs, no Mitsubishi logos" and suggests "terminal/code SVG silhouette."
- **Alternatives:** Code bracket SVG, keyboard SVG
- **Rationale:** Terminal window with cursor is the most recognizable developer symbol and aligns with the curriculum starting from terminal basics.
- **Reversible:** Y

### D003: CSS extracted with adaptations, not verbatim copy
- **Context:** FUSO CSS had `.hero-truck` class and no `.phase-card` styles needed for the landing page.
- **Alternatives:** Verbatim copy + separate override file (violates single-CSS rule)
- **Rationale:** Renamed to `.hero-art`, added `.phase-card` and `.anim-cursor`. All additions are for programming context. FUSO reference file untouched.
- **Reversible:** Y

### D004: localStorage key changed from `fuso-hmi-theme` to `zth-theme`
- **Context:** Different project, shouldn't share theme preference with the FUSO reference.
- **Alternatives:** Same key (simpler), per-file key (unnecessary)
- **Rationale:** Distinct project identity. Simple rename.
- **Reversible:** Y

### D005: CSS utility classes added post-Phase A to resolve inline style violations
- **Context:** Audit found inline styles (`min-height:40vh` on hero, footer styling) in all phase files — violating CLAUDE.md rule #10. Fixing requires adding CSS rules to design-system.css, which is marked immutable after Phase A.
- **Alternatives:** (a) Leave inline styles (violates rule #10), (b) Add a second CSS file (violates single-CSS rule), (c) Add minimal utility classes to design-system.css
- **Rationale:** Two rules conflict. Option (c) resolves both violations with the smallest footprint. Added: `.hero-sm`, `footer p+p`, `.section-heading`. These are infrastructure completion, not design drift.
- **Reversible:** Y

### D006: Removed 1200-line file size limit per Plan 3
- **Context:** Phase C enrichment added substantial content to phase-2.html (higher-order functions, decorators, 5 Solve & Compare exercises). The file now stands at ~2056 lines, exceeding the original 1200-line cap in CLAUDE.md rule #16.
- **Alternatives:** (a) Split phase-2.html into sub-files (breaks one-file-per-phase architecture), (b) Aggressively compress content (sacrifices pedagogy), (c) Remove the line limit
- **Rationale:** The 1200-line limit was a rough guard against bloat, not a hard engineering constraint. Splitting would break navigation and sidebar assumptions. The file loads and renders correctly at 2056 lines. Plan 3 explicitly authorized removing this limit.
- **Reversible:** Y

### D007: "Solve & Compare" exercises use hint-reveal pattern for AI solution
- **Context:** The 5 Solve & Compare exercises (Ch05–Ch09) need to show an AI-generated reference solution after the learner attempts their own. Two options: a second read-only editor pane, or reuse the existing hint infrastructure.
- **Alternatives:** (a) Side-by-side dual Ace editors (new component, more JS), (b) AI solution as Hint 3 in standard hint-reveal pattern
- **Rationale:** Option (b) requires zero new components. The progressive hint system already exists. Placing the AI solution as the final hint (Hint 3) keeps the reveal intentional and consistent with every other exercise in the curriculum.
- **Reversible:** Y

### D008: CSV exercise returns string instead of writing to file
- **Context:** The CSV-generation exercise in Ch08 originally specified writing to a file. Pyodide runs in-browser and has no real filesystem.
- **Alternatives:** (a) Use Pyodide's virtual filesystem (non-obvious to learners, diverges from real Python), (b) Return CSV as a string
- **Rationale:** Returning a string teaches the same CSV-formatting logic without introducing Pyodide filesystem quirks. The exercise verifies output correctness identically.
- **Reversible:** Y

### D009: Web scraping section uses stdlib HTMLParser
- **Context:** The optional web scraping section in Ch13 (phase-4.html) needs an HTML parsing exercise runnable in Pyodide. BeautifulSoup is a third-party library that may not be available in all Pyodide builds.
- **Alternatives:** (a) Import BeautifulSoup via Pyodide micropip (fragile, large download), (b) Use Python stdlib `html.parser.HTMLParser`
- **Rationale:** HTMLParser is always available, loads instantly, and teaches the same parsing concepts. A callout notes that real-world projects typically use BeautifulSoup or lxml.
- **Reversible:** Y

### D010: Spec-driven development references Harper Reed's workflow
- **Context:** Ch22 (phase-5.html) introduces spec-driven development as part of the "Compounding Engineering" level. The section needed a concrete real-world example of the brainstorm-spec-plan-execute pattern.
- **Alternatives:** (a) Generic description only (less memorable), (b) Reference a specific practitioner's published workflow
- **Rationale:** Harper Reed's publicly documented workflow (brainstorm → spec → plan → execute) is a well-known, citable example that maps directly to the four-step pattern taught in the chapter. Using a real-world reference makes the pattern credible and gives learners something to search for.
- **Reversible:** Y

### D011: Expansion from 28 chapters / 6 phases to 47 chapters / 10 phases
- **Context:** The original curriculum covered programming fundamentals (Phases 1-4) and AI-assisted development (Phases 5-6). The expansion adds engineering craft, systems thinking, and restructured AI content across 4 new phases.
- **Alternatives:** (a) Keep 6 phases and add content to existing phases (would bloat phase files), (b) Create 4 new phases with dedicated HTML files
- **Rationale:** New phases cover distinct domains (engineering craft, systems & scale, AI fundamentals, AI orchestration) that warrant their own phase files and progression gates. The original AI content (Phases 5-6) was renumbered to Phases 9-10, with new Phases 5-6 covering data structures and algorithms, and Phases 7-8 covering engineering craft and systems.
- **Reversible:** Y

### D012: RegExp error handling in exercise-runner.js
- **Context:** Comprehensive review identified that `new RegExp(pattern, 'm')` at line 174 could throw if the HTML `data-pattern` attribute contained invalid regex. While patterns come from trusted HTML, defensive coding is appropriate.
- **Alternatives:** (a) Leave as-is (low risk since patterns are author-controlled), (b) Add try-catch with user-friendly error message
- **Rationale:** Try-catch adds minimal complexity and prevents uncaught exceptions that would confuse learners. The error message tells users to report the issue, making it actionable.
- **Reversible:** Y
