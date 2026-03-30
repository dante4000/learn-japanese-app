# Build Progress Tracker

## Status Key
- [ ] Not started
- [~] In progress
- [?] In QA review (rendering + pedagogy)
- [x] Complete
- [!] Needs revision

## Overall Status
- **Current phase:** All 10 phases built; enrichment ongoing
- **Current chapter:** All 47 chapters + appendices built
- **Last updated:** 2026-03-18

---

## Infrastructure
| Component | Status | Notes |
|-----------|--------|-------|
| Project scaffold created | [x] | |
| design-system.css extracted from FUSO ref | [x] | Adapted: removed truck-specific, added phase-card, cursor-blink anim |
| theme.js extracted | [x] | localStorage key: zth-theme |
| sidebar.js extracted | [x] | IntersectionObserver scroll tracking |
| shared.js (copy buttons) | [x] | |
| SVG arrow markers (global defs) — include in each phase file | [x] | arrowhead + arrowhead-muted in all files |
| index.html (landing page with hero + phase links) | [x] | Terminal SVG hero art, 10 phase cards + appendices |
| phase-1.html through phase-10.html + appendices.html | [x] | All with correct section IDs |
| Sidebar in each file (all phases linked, current highlighted) | [x] | Local chapters use #anchors, other phases use relative links |
| TaskForge v0.1 source code written | [x] | Runs: python3 src/assets/taskforge-v01.py |

## Chapters
| # | Phase | Title | Status | Diagrams | Exercise | Pedagogy QA | Notes |
|---|-------|-------|--------|----------|----------|-------------|-------|
| 01 | 1 | What Programming Actually Is | [x] | 2/2 | [x] | [x] | Abstraction Stack + Language Landscape |
| 02 | 1 | How Computers Execute Code | [x] | 2/2 | [x] | [x] | Memory Viz + Error Types |
| 03 | 1 | Setting Up Your Environment | [x] | 1/1 | [x] | [x] | Terminal Anatomy diagram |
| 04 | 1 | Reading Code Before Writing It | [x] | 1/1 | [x] | [x] | Code reading .pe exercises |
| -- | 1 | Phase 1 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader receives TaskForge v0.1 |
| 05 | 2 | Functions, Logic, and Control Flow | [x] | 2/2 | [x] | [x] | Control Flow + Loop Execution |
| 06 | 2 | Data Structures | [x] | 1/1 | [x] | [x] | Data Structure Viz |
| 07 | 2 | Object-Oriented Programming | [x] | 1/1 | [x] | [x] | New chapter |
| 08 | 2 | Files, Modules, Standard Library | [x] | 1/1 | [x] | [x] | File Format Comparison (was Ch 07) |
| 09 | 2 | Error Handling, Debugging, Testing | [x] | 1/1 | [x] | [x] | Test-first pipeline (was Ch 08) |
| -- | 2 | Phase 2 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader extends TaskForge |
| 10 | 3 | The Terminal and Shell Scripting | [x] | 1/1 | [x] | [x] | Pipe Composition (was Ch 09) |
| 11 | 3 | Version Control with Git | [x] | 1/1 | [x] | [x] | Git Branching Model (was Ch 10) |
| 12 | 3 | Git Remote and Collaboration | [x] | 1/1 | [x] | [x] | New chapter |
| -- | 3 | Phase 3 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader gives TaskForge structure |
| 13 | 4 | APIs, HTTP, and Software Communication | [x] | 1/1 | [x] | [x] | HTTP Request/Response flow (was Ch 11) |
| 14 | 4 | Flask Web Applications | [x] | 1/1 | [x] | [x] | New chapter |
| 15 | 4 | Databases with SQLite | [x] | 1/1 | [x] | [x] | New chapter |
| 16 | 4 | Docker and Containers | [x] | 1/1 | [x] | [x] | New chapter |
| 17 | 4 | CI/CD and Automation | [x] | 1/1 | [x] | [x] | New chapter |
| 18 | 4 | Project Architecture | [x] | 1/1 | [x] | [x] | Project Anatomy tree (was Ch 12) |
| -- | 4 | Phase 4 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader builds full-stack TaskForge |
| 19 | 5 | Complexity Analysis | [x] | 1/1 | [x] | [x] | Big-O notation, growth rates |
| 20 | 5 | Linear Structures | [x] | 1/1 | [x] | [x] | Arrays, linked lists, stacks, queues |
| 21 | 5 | Hash Tables & Maps | [x] | 1/1 | [x] | [x] | Hashing, collisions, dictionaries |
| 22 | 5 | Trees | [x] | 1/1 | [x] | [x] | BSTs, traversal, balancing |
| 23 | 5 | Graphs | [x] | 1/1 | [x] | [x] | Representation, traversal |
| -- | 5 | Phase 5 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader analyzes data structure choices |
| 24 | 6 | Searching & Sorting | [x] | 1/1 | [x] | [x] | Binary search, sorting algorithms |
| 25 | 6 | Recursion & DP | [x] | 1/1 | [x] | [x] | Recursive thinking, memoization |
| 26 | 6 | Algorithm Patterns | [x] | 1/1 | [x] | [x] | Sliding window, two pointers |
| 27 | 6 | Graph Algorithms | [x] | 1/1 | [x] | [x] | BFS, DFS, shortest path |
| -- | 6 | Phase 6 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader applies algorithmic thinking |
| 28 | 7 | Design Patterns & Clean Architecture | [x] | 1/1 | [x] | [x] | SOLID principles, refactoring |
| 29 | 7 | SQL & Query Mastery | [x] | 1/1 | [x] | [x] | Relational queries, joins |
| 30 | 7 | Transactions, NoSQL & Data Evolution | [x] | 1/1 | [x] | [x] | ACID, document stores |
| 31 | 7 | Networking & the Internet | [x] | 1/1 | [x] | [x] | TCP/IP, DNS, HTTP deep dive |
| 32 | 7 | Concurrency & Parallelism | [x] | 1/1 | [x] | [x] | Threads, async, race conditions |
| 33 | 7 | Security Engineering | [x] | 1/1 | [x] | [x] | OWASP, auth, encryption |
| -- | 7 | Phase 7 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader applies engineering craft |
| 34 | 8 | System Design Fundamentals | [x] | 1/1 | [x] | [x] | Scaling, load balancing |
| 35 | 8 | Distributed Systems & Architecture | [x] | 1/1 | [x] | [x] | CAP theorem, consensus |
| 36 | 8 | Performance & Observability | [x] | 1/1 | [x] | [x] | Profiling, metrics, logging |
| 37 | 8 | Navigating Large Codebases | [x] | 1/1 | [x] | [x] | Reading, refactoring at scale |
| -- | 8 | Phase 8 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader designs systems at scale |
| 38 | 9 | Evaluating and Directing AI Code (BRIDGE) | [x] | 1/1 | [x] | [x] | AI Evaluation Pipeline |
| 39 | 9 | Levels 1 & 2 — Tab Complete and Agent IDE | [x] | 1/1 | [x] | [x] | 8 Levels Progression |
| 40 | 9 | Level 3 — Context Engineering | [x] | 1/1 | [x] | [x] | Context Window Budget |
| 41 | 9 | Level 4 — Compounding Engineering | [x] | 1/1 | [x] | [x] | Compounding Loop |
| 42 | 9 | Level 5 — MCP, Skills, and Capabilities | [x] | 1/1 | [x] | [x] | Skill Fan-Out |
| -- | 9 | Phase 9 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader uses Claude Code on TaskForge |
| 43 | 10 | Level 6 — Harness Engineering | [x] | 1/1 | [x] | [x] | Harness/Backpressure |
| 44 | 10 | Level 7 — Background Agents | [x] | 1/1 | [x] | [x] | Dispatch Architecture |
| 45 | 10 | Claude Code in Docker | [x] | 1/1 | [x] | [x] | Containerized agents |
| 46 | 10 | Level 8 — Autonomous Agent Teams | [x] | 2/2 | [x] | [x] | Team diagram + Decision Tree |
| 47 | 10 | The Multiplayer Effect and What Comes Next | [x] | 1/1 | [x] | [x] | Team Maturity Matrix |
| -- | 10 | Phase 10 Gate + TaskForge Checkpoint | [x] | -- | -- | [x] | Reader dispatches agents on TaskForge |

## Appendices
| Name | Status | Notes |
|------|--------|-------|
| Glossary | [x] | 6 groups, all terms from document |
| Prompt Library | [x] | All prompts by phase |
| Self-Assessment Quiz | [x] | 8 levels with criteria + next steps |
| Appendix E — Resources | [x] | Curated Book Queue, External Practice Platforms, Community Guides |
| Appendix F — Data Structures Deep Dive | [x] | Linked lists, stacks, queues, hash tables, BSTs, graphs; 6 Pyodide exercises, 4 SVG diagrams |
| Appendix G — Algorithms | [x] | Binary search, sorting, graph traversal; 3 Pyodide exercises, 2 SVG diagrams |

## Phase C — Enrichment
| # | Task | Status | Notes |
|---|------|--------|-------|
| C1 | Data Structures Deep Dive (Appendix F) | [x] | Added to appendices.html; bridge callout in phase-2.html Ch06 |
| C2 | Algorithms (Appendix G) | [x] | Added to appendices.html; bridge callout in phase-2.html Ch06 |
| C3 | Higher-Order Functions + Decorators | [x] | Higher-order functions added to Ch05, decorators added to Ch07 in phase-2.html |
| C4 | Curated Book Queue | [x] | Added to Appendix E in appendices.html |
| C5 | External Practice Platforms | [x] | Added to Appendix E + inline callouts in phase-2/3/4.html |
| C6 | Spec-Driven Development | [x] | Workflow added to Ch22 in phase-5.html |
| C7 | Community Guides | [x] | Added to Appendix E in appendices.html |
| C8 | HTML/CSS Fundamentals | [x] | Added to Ch14 in phase-4.html |
| C9 | Web Scraping (Optional) | [x] | Added to Ch13 in phase-4.html |
| C10 | "Solve & Compare" Exercises | [x] | 5 total added to Ch05–Ch09 in phase-2.html |

## Phase D — Enrichment (continued)
| # | Task | Status | Notes |
|---|------|--------|-------|
| D1 | Senior engineer expansion (Phases 7-10) | [x] | 19 new chapters (Ch 28-47) across 4 new phases |
| D2 | Update sidebar across all files | [x] | All 12 HTML files updated with 47-chapter sidebar |
| D3 | Update index.html landing page | [x] | 10 phase cards, correct chapter counts |
| D4 | Update PROGRESS.md | [x] | All 47 chapters tracked |
| D5 | Update DECISIONS.md | [x] | Updated with D011-D012 |
| D6 | Update COMPONENT-REGISTRY.md | [x] | Updated to cover phases 7-10 |
| D7 | Update CHANGELOG.md | [x] | Added 2.0.0 entry, fixed version ordering |
| D8 | Update progress.js chapter mapping | [x] | 10-phase mapping + migration function |

## Session Log
### Session 1 — 2026-03-15
- **Started:** Project scaffold + infrastructure (Phase A)
- **Completed:** Full infrastructure — scaffold, CSS, JS, all HTML shells, TaskForge v0.1, sidebar nav
- **Blocked on:** Nothing
- **Next:** Chapter 01 — What Programming Actually Is

### Session 2 — 2026-03-15
- **Completed:** All 28 chapters (Phases 1-6), all phase gates, all appendices (Glossary, Prompt Library, Self-Assessment)
- **Blocked on:** Nothing
- **Next:** Audit cycle

### Session 3 — 2026-03-17
- **Completed:** Phase C enrichment (C1–C10): Appendix F & G, higher-order functions, decorators, book queue, practice platforms, community guides, spec-driven dev, HTML/CSS fundamentals, web scraping, 5 Solve & Compare exercises
- **Blocked on:** Nothing
- **Next:** Phase D enrichment

### Session 4 — 2026-03-18
- **Completed:** Phase D expansion — Phases 7-10 (Ch 28-47): Engineering Craft, Systems & Scale, AI Levels 1-5, AI Levels 6-8. Updated sidebar, index.html, progress.js, README.md, PROGRESS.md
- **Blocked on:** Nothing
- **Next:** Audit phases 7-10

### Session 5 — 2026-03-18
- **Completed:** Documentation sync — CHANGELOG.md (2.0.0 entry, version ordering fix), EVAL-RESULTS.md (scope disclaimer), DECISIONS.md (D011-D012), COMPONENT-REGISTRY.md (phases 7-10), PEDAGOGY-REVIEW.md (phases 7-10), CONTRIBUTING.md (scope update), STRESS-TEST-RESULTS.md (scope note), QA-CHECKLIST.md (obsolete notice), LICENSE file, exercise-runner.js RegExp fix, api-demo.js fetch timeout, appendix-tabs.js debounce, ace-init.js/pyodide-runner.js error messages, REVIEW-AND-SUGGESTIONS.md (scope note), archived zero-to-hero-programming-PRODUCTION.md
- **Blocked on:** Nothing
- **Next:** Audit phases 7-10; add missing SVG aria-labels; add table captions; add callout role="note" attributes
