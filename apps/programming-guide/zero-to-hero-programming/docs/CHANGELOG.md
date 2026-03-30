# Changelog

All notable changes to this project are documented here.

## [2.0.0] — 2026-03-18

### Added
- 19 new chapters (Ch 28-47) across 4 new phases, expanding the curriculum from 28 to 47 chapters and from 6 to 10 phases
- Phase 7: Engineering Craft (Ch 28-33) — SOLID principles, design patterns, code review, refactoring, technical debt, documentation
- Phase 8: Systems & Scale (Ch 34-37) — system design, distributed systems, performance, observability
- Phase 9: AI-Assisted Dev, Levels 1-5 (Ch 38-42) — evaluating AI output, context engineering, compounding engineering, MCP/skills
- Phase 10: Advanced Orchestration, Levels 6-8 (Ch 43-47) — harness engineering, background agents, autonomous teams, Docker, multiplayer
- Phase files: phase-7.html through phase-10.html
- Updated index.html landing page to reflect 47 chapters / 10 phases
- Updated progress.js chapter-to-phase mapping for all 47 chapters
- Migration function in progress.js for renumbering from 28-chapter to 47-chapter scheme

### Changed
- Sidebar navigation updated across all files to include phases 7-10
- README.md updated to reflect full 47-chapter / 10-phase scope

## [1.2.0] — 2026-03-17

### Added
- Appendix F — Data Structures Deep Dive (linked lists, stacks, queues, hash tables, BSTs, graphs)
- Appendix G — Algorithms (binary search, sorting, graph traversal)
- Higher-order functions and closures in Ch05
- Decorators in Ch07
- Curated book queue, practice platforms, community guides in Appendix E
- Spec-driven development workflow in Ch22
- HTML/CSS fundamentals in Ch14
- Web scraping (optional) in Ch13
- 5 "Solve & Compare" exercises across Phase 2 (Ch05-Ch09)
- Appendix F and G sidebar links across all pages
- 24 new glossary terms for Phase C content

### Changed
- Removed 1200-line file size limit (phase-2.html now ~2056 lines; see Decision D006)

## [1.1.0] — 2026-03-17

### Added
- API live demo buttons ("Try it Live") for GitHub API examples in Ch 13
- Tabbed navigation for appendices with search and letter bar in glossary
- Phase sub-tabs in Prompt Library
- Collapsible troubleshooting accordion cards
- Claude Code preview callout in Ch 03 (Phase 1)
- Expected terminal output for Claude Code installation in Ch 20
- Rate limit, network, and proxy troubleshooting entries
- Per-phase prerequisite callouts (Phases 2-6)
- Model selection subsection in Ch 25
- CHANGELOG.md, README.md, CONTRIBUTING.md

### Infrastructure
- api-demo.js: vanilla JS for live GitHub API demo buttons
- appendix-tabs.js: tabbed navigation, glossary search, sub-tabs, accordions
- D005 utility CSS classes for API demos, tabs, glossary, and accordions

## [1.0.0] — 2026-03-15

### Added
- Complete 28-chapter curriculum across 6 phases
- Landing page (index.html) with phase overview and terminal hero art
- Phase files: phase-1.html through phase-6.html + appendices.html
- Design system CSS extracted and adapted from reference
- Interactive platform: Pyodide runner, Ace Editor, quiz engine, exercise runner
- Theme toggle (light/dark) with localStorage persistence
- Sidebar navigation with scroll tracking across all files
- TaskForge v0.1 spine project source code
- Appendices: Glossary, Prompt Library, Self-Assessment Quiz, Common Mistakes by Level, Troubleshooting, Resources

### Infrastructure
- Shared JS: theme.js, sidebar.js, shared.js, progress.js, ace-init.js, pyodide-runner.js, quiz.js, exercise-runner.js
- SVG diagrams using design system CSS variables (1+ per chapter)
- WCAG 2.1 AA compliance (contrast, keyboard nav, alt text)
- Responsive design at 700px and 900px breakpoints
