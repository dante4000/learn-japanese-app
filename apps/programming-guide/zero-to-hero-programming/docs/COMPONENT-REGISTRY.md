# Component Registry

Populated post-build based on audit findings across all 47 chapters.

> **Scope Note:** The detailed component-to-chapter matrix below was compiled during audit rounds 1-5 covering phases 1-6. Phases 7-10 (Ch 28-47) use the same component patterns but have not yet been individually catalogued.

## SVG Diagram Types

| Type | Description | Chapters Used |
|------|-------------|---------------|
| Flow | Process/sequence diagrams showing step-by-step progression | Ch 01, 02, 05, 08, 09, 13, 17, 19, 21 |
| Timeline | Linear progression showing evolution or stages | Ch 01, 14, 20, 28 |
| Comparison | Side-by-side or tabular visual comparisons | Ch 06, 08, 10 |
| Ladder | Vertical hierarchy or layered stack diagrams | Ch 01, 02, 03, 18, 24 |
| Decision Tree | Branching logic diagrams with conditional paths | Ch 20, 26 |

## Callout Types

| Type | CSS Class | Purpose | Chapters Used |
|------|-----------|---------|---------------|
| Info | `.callout.info` | Background context, definitions, supplementary detail | All chapters |
| Warn | `.callout.warn` | Common mistakes, gotchas, version-specific caveats | Most chapters |
| Critical | `.callout.critical` | Data loss risks, security warnings, irreversible actions | Ch 10, 11, 15, 16, 24, 25, 26 |
| OK | `.callout.ok` | "Try This Now" exercises with verification and troubleshooting | All chapters (required per spec) |

## Interactive Components

| Component | Implementation | Location | Notes |
|-----------|---------------|----------|-------|
| Copy Buttons | Vanilla JS click handler, copies `<code>` block content to clipboard | `src/js/shared.js` | Attached to all `<pre>` blocks |
| Theme Toggle | localStorage-backed dark/light switch | `src/js/theme.js` | Key: `zth-theme` |
| Sidebar Navigation | IntersectionObserver-based scroll tracking with current-chapter highlighting | `src/js/sidebar.js` | Identical snippet in all phase files |

## Phase C Components (Enrichment)

### Exercise Patterns

| Pattern | Selector / ID | Description | Location |
|---------|---------------|-------------|----------|
| Solve & Compare | `data-ex="solve-compare-*"` | Standard Pyodide exercise block where the learner writes their solution first, then reveals an AI-generated reference solution as Hint 3. 5 exercises total. | Ch05–Ch09 in phase-2.html |

### Appendix Tab Panels

| Panel | ID | Content | Exercises | Diagrams |
|-------|----|---------|-----------|----------|
| Appendix F — Data Structures Deep Dive | `id="appendix-f"` | Linked lists, stacks, queues, hash tables, BSTs, graphs | 6 Pyodide exercises | 4 SVG diagrams |
| Appendix G — Algorithms | `id="appendix-g"` | Binary search, sorting, graph traversal | 3 Pyodide exercises | 2 SVG diagrams |

### Callout Patterns (New in Phase C)

| Pattern | CSS Class / Style | Purpose | Location |
|---------|-------------------|---------|----------|
| Bridge callout ("Going Deeper") | `.callout.info` with internal link to appendix | Links a chapter topic to its deep-dive appendix (e.g., Ch06 → Appendix F & G) | phase-2.html Ch06 |
| Practice callout | `.callout.info` with external link | Points learners to external practice platforms (NeetCode, Learn Git Branching, Select Star SQL) | phase-2.html, phase-3.html, phase-4.html, Appendix E |

## Component-to-Chapter Matrix

All chapters include at minimum: 1 SVG diagram, 1 `.callout.ok` exercise, and 1 `.callout.info` block. The table above lists non-universal usage. Detailed per-chapter component counts were verified during audit rounds 1-5 for phases 1-6 (see `AUDIT-ROUND-1.md` through `AUDIT-ROUND-5.md`). Phases 7-10 follow the same component requirements but await formal audit.
