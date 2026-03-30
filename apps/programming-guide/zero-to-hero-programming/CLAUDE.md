# Programming Zero-to-Hero Build

## Project Overview
Building a multi-file HTML reference document: "Zero to Hero — Programming to Multi-Agent Claude Code."
47 chapters across 10 phases, with a phase gate after each phase and appendices.
Multi-file architecture: one landing page + one HTML file per phase (10 files) + shared CSS/JS.

## Key Commands
- View progress: `cat docs/PROGRESS.md`
- View decisions: `cat docs/DECISIONS.md`
- View QA status: `cat docs/QA-CHECKLIST.md`
- View pedagogy review: `cat docs/PEDAGOGY-REVIEW.md`
- View component usage: `cat docs/COMPONENT-REGISTRY.md`

## Build Rules
1. NEVER modify `reference/fuso-hmi-reference.html`
2. Build ONE chapter at a time, in order
3. Complete ALL chapters in a phase + phase gate BEFORE starting next phase
4. Update PROGRESS.md after completing each chapter
5. Log every non-obvious design decision in DECISIONS.md
6. Run BOTH the rendering QA AND the pedagogical QA against each chapter
7. Commit after each completed chapter: "ch[XX]: [title]"
8. Each phase file must be independently viewable (no broken state in isolation)
9. Every chapter must reference the TaskForge project at least once — as an example, code snippet, exercise, or conceptual explanation. This ensures the spine project compounds throughout, not only at phase gates.
10. All CSS must live ONLY in `src/css/design-system.css`. No inline styles except inside SVG diagrams. Shared JS lives in `src/js/` — core files: `theme.js`, `sidebar.js`, `shared.js`. Interactive platform files: `progress.js`, `ace-init.js`, `pyodide-runner.js`, `quiz.js`, `exercise-runner.js`. Phase files may NOT define additional global CSS or JS.
11. The sidebar navigation must be generated from a single shared HTML snippet copied identically into each phase file. The sidebar must include: all phases, all chapters, appendices, and current-chapter highlighting. No phase file may omit sidebar entries for other phases.
12. New chapters follow the exact same template as existing chapters
13. All images and diagrams must have descriptive alt text or aria-label
14. Interactive elements must be keyboard navigable
15. Color contrast must meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
16. Phase files have no hard line limit; keep content comprehensive but focused
17. SVG diagrams should use design system CSS variables, not inline styles
18. Consider diagram count per page - more than 8 diagrams may impact load time

## Generation Scope Control

Build continuously. No stopping between work units.

## Failure Protocol

If any step cannot be executed, use best judgment and continue. Log the issue in DECISIONS.md.

## Dependency Policy

Only the following libraries are allowed:

**Python:** Flask, requests, pytest, sqlite3 (stdlib)
**Frontend:** HTML, CSS (design-system.css only), vanilla JavaScript
**Frontend CDN:** Ace Editor (cdn.jsdelivr.net/npm/ace-builds), Pyodide (cdn.jsdelivr.net/pyodide)
**Infrastructure:** Docker

No other dependencies. If another dependency appears necessary, the builder must flag it and wait for approval instead of adding it. This prevents hallucinated package names and unnecessary complexity.

## Code Style
- HTML: semantic, accessible, no frameworks
- CSS: design system custom properties only, no external frameworks
- JS: vanilla IIFE pattern (ES5), no build tools. CDN deps: Ace Editor, Pyodide (lazy-loaded)
- SVG: inline, design system classes (node-fill, node-accent, label-text, sub-text, arrow)

## Design System Lock

The file `src/css/design-system.css` is **immutable after initial extraction**. Rules:
- Never modify this file after Phase A infrastructure is complete
- Never add additional CSS files
- Never introduce CSS frameworks (Tailwind, Bootstrap, etc.)
- Never introduce JS frameworks (React, Vue, etc.)

Exception: utility classes may be added per Decision D005.

Allowed technologies: HTML, the existing CSS design system, vanilla JavaScript. Nothing else.

## Quality Bar
- Every diagram teaches one non-obvious concept (decorative diagrams not permitted)
- Every "Try This Now" is copy-paste-ready with verification AND troubleshooting
- Every chapter has at least 1 diagram, 1 static exercise, and 1 interactive exercise (Pyodide, quiz, or checklist)
- Maximum 5 new technical terms per chapter
- No forward references (no concept used before introduced)
- Mobile responsive at 700px and 900px

## Tool References
All tool references use the two-layer pattern:
- Layer 1: Enduring concept (what the tool category does and why)
- Layer 2: Current example (specific tool, version, install command) — clearly marked, easy to update

## Context Management
- Compact with: /compact Focus on current chapter build status
- When resuming: read PROGRESS.md → DECISIONS.md → last session log → current chapter spec
