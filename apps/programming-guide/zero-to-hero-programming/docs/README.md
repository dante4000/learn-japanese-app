# Zero to Hero: Programming to Multi-Agent Claude Code

A complete programming curriculum that takes learners from zero coding experience to orchestrating AI agent teams with Claude Code.

## What This Is

A multi-file HTML course (47 chapters, 10 phases, appendices) with:
- 120+ interactive exercises (Python runs in the browser via Pyodide)
- A spine project (TaskForge) that grows across all 47 chapters
- An 8-level framework for AI-assisted development mastery
- Built-in quizzes, phase gates, and self-assessment tools

## Who This Is For

People with **zero programming experience** who want to learn programming fundamentals AND AI-assisted development with Claude Code. This is not a "prompt engineering" course — it teaches real programming first (Phases 1-4), then data structures and algorithms (Phases 5-6), engineering craft and systems (Phases 7-8), then AI tool usage (Phases 9-10).

## What This Is NOT

- Not a quick-start guide for Claude Code (that's Phase 9, Chapter 39)
- Not a prompt engineering tutorial
- Not a course that assumes you already know how to code
- Not dependent on any specific IDE or paid tool (exercises run in your browser)

## Quick Start

1. Clone or download this repository
2. Open `src/index.html` in any modern browser
3. Start with Phase 1, Chapter 1

No build step. No install. No server required. All exercises run client-side via Pyodide.

For the full development environment (Python, Node.js, Claude Code), follow the setup guide in Phase 1, Chapter 3.

## Structure

```
src/
  index.html          - Landing page
  phase-1.html        - Foundations (Ch 01-04)
  phase-2.html        - Python (Ch 05-09)
  phase-3.html        - Dev Tools (Ch 10-12)
  phase-4.html        - Building & Deploying (Ch 13-18)
  phase-5.html        - Data Structures & Complexity (Ch 19-23)
  phase-6.html        - Algorithms (Ch 24-27)
  phase-7.html        - Engineering Craft (Ch 28-33)
  phase-8.html        - Systems & Scale (Ch 34-37)
  phase-9.html        - AI-Assisted Dev, Levels 1-5 (Ch 38-42)
  phase-10.html       - AI Orchestration, Levels 6-8 (Ch 43-47)
  appendices.html     - Glossary, Prompt Library, Self-Assessment, Troubleshooting
  css/design-system.css
  js/                 - Theme, sidebar, exercise runners
docs/
  PROGRESS.md         - Build tracker
  DECISIONS.md        - Design decisions log
  EVAL-RESULTS.md     - Course evaluation
```

## Evaluation

This course has been evaluated against a structured framework (see `docs/eval-framework.md`).

**Current score: 4.23 / 5.00** (Strong — "Has gaps but delivers real value")

> **Note:** This score was evaluated against the 28-chapter / 6-phase version of the course. Phases 7-10 (chapters 28-47) have not yet been formally evaluated.

Top scores: Curriculum Architecture (4.5), Pedagogical Quality (4.5), Projects & Exercises (4.5), Claude Code Depth (4.5). See `docs/EVAL-RESULTS.md` for details.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
