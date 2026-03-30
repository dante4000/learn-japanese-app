# Contributing

Contributions are welcome. This document explains how to contribute effectively.

This is a 47-chapter, 10-phase curriculum. See `CLAUDE.md` for the full project scope and build rules.

## What We Need Help With

- **Typos and broken links** — always welcome, no discussion needed
- **Troubleshooting entries** — if you hit a setup issue not covered in Appendix D, describe the symptom, cause, and fix
- **Exercise improvements** — better hints, additional test cases, clearer prompts
- **Accessibility fixes** — missing alt text, keyboard nav issues, contrast problems

## How to Contribute

1. Open an issue describing what you'd like to change and why
2. Fork the repository
3. Make your changes in a feature branch
4. Open a pull request referencing the issue

## Constraints

All contributions must follow the rules in `CLAUDE.md`:

- **No new CSS or JS files.** All styles use `src/css/design-system.css`. All scripts use existing files in `src/js/`.
- **No frameworks.** HTML, vanilla CSS, vanilla JS only.
- **No inline styles** except inside SVG diagrams.
- **Sidebar must be identical** across all phase files (except same-page anchors).
- **Every chapter references TaskForge** at least once.
- **No forward references.** Don't use a concept before its introduction chapter.
- **Max 5 new technical terms per chapter.**

## What We Won't Merge

- New JavaScript or CSS frameworks
- AI-generated content that hasn't been manually reviewed and tested
- Changes that break the browser-based exercises (test in Chrome and Firefox before submitting)
- Content that says "just trust the AI" or skips verification steps

## Code of Conduct

Be respectful. This is a learning resource for beginners. Questions are welcome. Condescension is not.
