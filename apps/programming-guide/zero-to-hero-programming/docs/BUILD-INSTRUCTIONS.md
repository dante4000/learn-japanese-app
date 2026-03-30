# Zero to Hero: Programming to Multi-Agent Claude Code
## Final Build Instructions (Validated, All Upgrades Applied)

> **What this is:** Complete, validated instructions to hand to an LLM (with the FUSO HMI HTML file as a design reference) to build a comprehensive, interactive HTML reference document that takes a complete beginner from zero programming knowledge to orchestrating multi-agent AI coding systems — structured around the 8 Levels of Agentic Engineering framework.
>
> **Target reader:** Someone who has never written code, is intellectually capable, and wants to reach a level where they can architect and supervise multi-agent AI coding systems. Not a CS degree — a functional, modern, AI-augmented programming capability.
>
> **Design system:** Use the identical design system from the FUSO HMI Expert Reference (provide the HTML file as context). Same fonts, colors, components, dark/light theme, sidebar, responsive layout. Change the branding/theming to suit programming (no truck SVGs, no Mitsubishi logos).
>
>
> **Document version:** Final validated build spec. 21 chapters across 5 phases, with a phase gate after each phase and appendices. Incorporates: original 20-chapter spec, 8 Levels addendum, bridge chapter, TaskForge spine project, multi-file architecture, phase gates, pedagogical QA, diagram rubric, tool volatility handling, chapter acceptance criteria, and pedagogy editor role.
>
> **Final guarantee:** The curriculum must remain readable, navigable, and executable by a complete beginner without requiring external documentation beyond the appendices.

---

## SPEC IMMUTABILITY

This document is the build specification. It must not be modified during execution. All build decisions derive from this document. If a conflict arises between this spec and runtime judgment, this spec wins.

---

## CONTEXT WINDOW MANAGEMENT

This specification is large. Execution must follow these rules:

- Only load instructions relevant to the current phase.
- Do not process the entire document simultaneously.
- When starting a new phase, reload:
  1. META-INSTRUCTIONS (Step 0 through Step 9)
  2. BUILD RULES
  3. The current phase specification only.
- Ignore later phases until reached.

---

# === META-INSTRUCTIONS: READ FIRST, EXECUTE IN ORDER ===

## Step 0: Project Scaffold

Before writing ANY content, create the following file structure:

```
zero-to-hero-programming/
├── CLAUDE.md
├── docs/
│   ├── BUILD-INSTRUCTIONS.md       # This file (copy here)
│   ├── PROGRESS.md
│   ├── DECISIONS.md
│   ├── QA-CHECKLIST.md
│   ├── PEDAGOGY-REVIEW.md          # Pedagogy editor findings
│   └── COMPONENT-REGISTRY.md
├── src/
│   ├── index.html                  # Landing page
│   ├── phase-1.html                # Chapters 01-04 + Phase 1 Gate
│   ├── phase-2.html                # Chapters 05-08 + Phase 2 Gate
│   ├── phase-3.html                # Chapters 09-12 + Phase 3 Gate
│   ├── phase-4.html                # Chapters 13-17 + Phase 4 Gate
│   ├── phase-5.html                # Chapters 18-21 + Phase 5 Gate
│   ├── appendices.html             # Glossary, Prompt Library, Self-Assessment
│   ├── css/
│   │   └── design-system.css       # ALL CSS — extracted once from FUSO ref
│   ├── js/
│   │   ├── theme.js                # Dark/light toggle + localStorage
│   │   ├── sidebar.js              # Hamburger + scroll tracking
│   │   └── shared.js               # Shared utilities
│   ├── assets/
│   └── drafts/                     # Chapter drafts before integration
├── reference/
│   └── fuso-hmi-reference.html
└── output/
    └── (final deliverables copied here)
```

---

## Step 1: Create CLAUDE.md

```markdown
# Programming Zero-to-Hero Build

## Project Overview
Building a multi-file HTML reference document: "Zero to Hero — Programming to Multi-Agent Claude Code."
21 chapters across 5 phases, with a phase gate after each phase and appendices. Structured around the 8 Levels of Agentic Engineering.
Multi-file architecture: one landing page + one HTML file per phase + shared CSS/JS.

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
10. All CSS must live ONLY in `src/css/design-system.css`. No inline styles except inside SVG diagrams. All shared JS must live in `src/js/theme.js`, `src/js/sidebar.js`, or `src/js/shared.js`. Phase files may NOT define additional global CSS or JS.
11. The sidebar navigation must be generated from a single shared HTML snippet copied identically into each phase file. The sidebar must include: all phases, all chapters, appendices, and current-chapter highlighting. No phase file may omit sidebar entries for other phases.

## Generation Scope Control

Never generate the entire project in one response. Work units are limited to:
- Infrastructure setup (Phase A)
- One chapter
- One phase gate

After completing a work unit:
1. Update PROGRESS.md
2. Run QA checklists
3. Output build status (see Status Report Format below)
4. Stop generation. Wait for confirmation before next work unit.

## File Output Format

Every generated file must be complete. Output format:

```
FILE: path/to/file
```
```language
(full file contents)
```

Partial file fragments are not allowed. Never output a file as "the same as before but with X changed." Always output the complete file.

## Failure Protocol

If any step cannot be executed:
1. Stop generation immediately.
2. Report the blocking issue with the exact error or constraint.
3. Suggest the minimal fix.
4. Wait for confirmation before continuing.

Do not attempt workarounds without confirmation. Do not skip steps.

## Dependency Policy

Only the following libraries are allowed:

**Python:** Flask, requests, pytest
**Frontend:** HTML, CSS (design-system.css only), vanilla JavaScript

No other dependencies. If another dependency appears necessary, the builder must flag it and wait for approval instead of adding it. This prevents hallucinated package names and unnecessary complexity.

## Code Style
- HTML: semantic, accessible, no frameworks
- CSS: design system custom properties only, no external frameworks
- JS: vanilla only, no build tools, no dependencies
- SVG: inline, design system classes (node-fill, node-accent, label-text, sub-text, arrow)

## Design System Lock

The file `src/css/design-system.css` is **immutable after initial extraction**. Rules:
- Never modify this file after Phase A infrastructure is complete
- Never add additional CSS files
- Never introduce CSS frameworks (Tailwind, Bootstrap, etc.)
- Never introduce JS frameworks (React, Vue, etc.)

Allowed technologies: HTML, the existing CSS design system, vanilla JavaScript. Nothing else.

## Quality Bar
- Every diagram teaches one non-obvious concept (decorative diagrams not permitted)
- Every "Try This Now" is copy-paste-ready with verification AND troubleshooting
- Every chapter has at least 1 diagram and 1 exercise
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
```

---

## Step 2: Create PROGRESS.md

```markdown
# Build Progress Tracker

## Status Key
- ⬜ Not started
- 🔨 In progress
- 🔍 In QA review (rendering + pedagogy)
- ✅ Complete
- 🔄 Needs revision

## Overall Status
- **Current phase:** Not started
- **Current chapter:** Not started
- **Last updated:** [DATE]

---

## Infrastructure
| Component | Status | Notes |
|-----------|--------|-------|
| Project scaffold created | ⬜ | |
| design-system.css extracted from FUSO ref | ⬜ | |
| theme.js extracted | ⬜ | |
| sidebar.js extracted | ⬜ | |
| SVG arrow markers (global defs) — include in each phase file | ⬜ | |
| index.html (landing page with hero + phase links) | ⬜ | |
| Empty phase-1.html through phase-5.html + appendices.html | ⬜ | |
| Sidebar in each file (all phases linked, current highlighted) | ⬜ | |
| TaskForge v0.1 source code written | ⬜ | |

## Chapters
| # | Phase | Title | Status | Diagrams | Exercise | Pedagogy QA | Notes |
|---|-------|-------|--------|----------|----------|-------------|-------|
| 01 | 1 | What Programming Actually Is | ⬜ | 0/2 | ⬜ | ⬜ | Abstraction Stack + Language Landscape |
| 02 | 1 | How Computers Execute Code | ⬜ | 0/2 | ⬜ | ⬜ | Memory Viz + Error Types |
| 03 | 1 | Setting Up Your Environment | ⬜ | 0/1 | ⬜ | ⬜ | Terminal Anatomy diagram |
| 04 | 1 | Reading Code Before Writing It | ⬜ | 0/1 | ⬜ | ⬜ | Code reading .pe exercises |
| -- | 1 | Phase 1 Gate + TaskForge Checkpoint | ⬜ | — | — | ⬜ | Reader receives TaskForge v0.1 |
| 05 | 2 | Functions, Logic, and Control Flow | ⬜ | 0/2 | ⬜ | ⬜ | Control Flow + Loop Execution |
| 06 | 2 | Data Structures | ⬜ | 0/1 | ⬜ | ⬜ | Data Structure Viz |
| 07 | 2 | Files, Modules, Standard Library | ⬜ | 0/1 | ⬜ | ⬜ | File Format Comparison |
| 08 | 2 | Error Handling, Debugging, Testing | ⬜ | 0/1 | ⬜ | ⬜ | Test-first pipeline |
| -- | 2 | Phase 2 Gate + TaskForge Checkpoint | ⬜ | — | — | ⬜ | Reader extends TaskForge |
| 09 | 3 | The Terminal and Shell Scripting | ⬜ | 0/1 | ⬜ | ⬜ | Pipe Composition |
| 10 | 3 | Version Control with Git | ⬜ | 0/1 | ⬜ | ⬜ | Git Branching Model |
| 11 | 3 | APIs, HTTP, and Software Communication | ⬜ | 0/1 | ⬜ | ⬜ | HTTP Request/Response flow |
| 12 | 3 | Project Architecture | ⬜ | 0/1 | ⬜ | ⬜ | Project Anatomy tree |
| -- | 3 | Phase 3 Gate + TaskForge Checkpoint | ⬜ | — | — | ⬜ | Reader gives TaskForge structure |
| 13 | 4 | Evaluating and Directing AI Code (BRIDGE) | ⬜ | 0/1 | ⬜ | ⬜ | AI Evaluation Pipeline |
| 14 | 4 | Levels 1 & 2 — Tab Complete and Agent IDE | ⬜ | 0/1 | ⬜ | ⬜ | 8 Levels Progression |
| 15 | 4 | Level 3 — Context Engineering | ⬜ | 0/1 | ⬜ | ⬜ | Context Window Budget |
| 16 | 4 | Level 4 — Compounding Engineering | ⬜ | 0/1 | ⬜ | ⬜ | Compounding Loop |
| 17 | 4 | Level 5 — MCP, Skills, and Capabilities | ⬜ | 0/1 | ⬜ | ⬜ | Skill Fan-Out |
| -- | 4 | Phase 4 Gate + TaskForge Checkpoint | ⬜ | — | — | ⬜ | Reader uses Claude Code on TaskForge |
| 18 | 5 | Level 6 — Harness Engineering | ⬜ | 0/1 | ⬜ | ⬜ | Harness/Backpressure |
| 19 | 5 | Level 7 — Background Agents | ⬜ | 0/1 | ⬜ | ⬜ | Dispatch Architecture |
| 20 | 5 | Level 8 — Autonomous Agent Teams | ⬜ | 0/2 | ⬜ | ⬜ | Team diagram + Decision Tree |
| 21 | 5 | The Multiplayer Effect and What Comes Next | ⬜ | 0/1 | ⬜ | ⬜ | Team Maturity Matrix |
| -- | 5 | Phase 5 Gate + TaskForge Checkpoint | ⬜ | — | — | ⬜ | Reader dispatches agents on TaskForge |

## Appendices
| Name | Status | Notes |
|------|--------|-------|
| Glossary | ⬜ | 6 groups |
| Prompt Library | ⬜ | All prompts collected |
| Self-Assessment Quiz | ⬜ | "What level are you?" |

## Session Log
### Session 1 — [DATE]
- **Started:**
- **Completed:**
- **Blocked on:**
- **Next:**
```

---

## Step 3: Create DECISIONS.md

```markdown
# Design Decisions Log
(Entries added during build. Format: Decision, Context, Alternatives, Rationale, Reversible Y/N)
```

---

## Step 4: Create QA-CHECKLIST.md

```markdown
# Quality Assurance Checklist
Apply BOTH sections to every chapter before marking complete.

## A. Rendering QA

### Chapter [XX]: [TITLE]
- [ ] Correct heading: `<h2><span class="ch-label">Chapter XX</span>Title</h2>`
- [ ] Section has `id="chXX"` and `data-ch="XX"`
- [ ] Content matches build instructions spec
- [ ] No placeholder text (search: TODO, FIXME, [PLACEHOLDER])
- [ ] "Try This Now" present, `.callout.ok`, copy-paste ready, has verification, has troubleshooting
- [ ] All specified diagrams present
- [ ] SVG viewBox `0 0 700 [height]`
- [ ] Design system classes used (node-fill, node-accent, label-text, sub-text, arrow)
- [ ] Renders in dark theme
- [ ] Renders in light theme
- [ ] Diagram captions state the main takeaway (not just describe the diagram)
- [ ] Callouts use correct variant (warn, info, critical, ok)
- [ ] Tables have `<th>` headers
- [ ] Readable at 700px viewport
- [ ] No horizontal scroll on mobile

## B. Pedagogical QA

### Chapter [XX]: [TITLE]
- [ ] Jargon audit: every technical term defined on first use or in preceding chapter
- [ ] No term used more than 2 paragraphs before definition
- [ ] Maximum 5 new technical terms in this chapter
- [ ] No forward references (no concept used before introduced in curriculum)
- [ ] If forward ref unavoidable: flagged as "We'll cover this in Chapter XX — for now, just know..."
- [ ] Exercise requires ONLY skills from this chapter and preceding chapters
- [ ] Synthesis exercise preceded by at least 2 single-concept micro-exercises
- [ ] Exercise includes verification method (pass/fail, not subjective)
- [ ] Exercise includes troubleshooting (2-3 common failures and fixes)
- [ ] No more than 3 major new concepts introduced
- [ ] Each major concept has its own section with example before next concept
- [ ] 1-3 most common beginner misconceptions identified and addressed
- [ ] LLM ambiguity check: could this spec be interpreted 2+ ways?
- [ ] Diagram spec has enough detail to build (nodes, labels, connections, layout)
```

---

## Step 5: Create COMPONENT-REGISTRY.md

```markdown
# Component Registry
| Type | Chapter | Description | Notes |
|------|---------|-------------|-------|
| (populated during build) | | | |
```

---

## Step 6: Create PEDAGOGY-REVIEW.md

```markdown
# Pedagogy Review Log
Written by the Pedagogy Editor agent (Agent 5) or manually during review.
Format: Chapter number, difficulty rating (1-5), issues found, suggested fixes.
(Entries added during build)
```

---

## Step 7: Build Sequence

### Phase A: Infrastructure (FIRST)
1. Extract complete CSS from FUSO reference → `src/css/design-system.css`
2. Extract JS → `src/js/theme.js`, `src/js/sidebar.js`, `src/js/shared.js`
3. Build `src/index.html` (landing page: hero section with programming branding, 5 phase cards with descriptions and links, progress markers)
4. Build empty phase files (`phase-1.html` through `phase-5.html` + `appendices.html`), each including:
   - Shared CSS/JS via relative links
   - SVG arrow marker defs
   - Sidebar with ALL phases and chapters (identical HTML snippet across all files, current phase highlighted)
   - Hamburger menu + theme toggle
   - Empty chapter sections with correct IDs
   - Footer
5. Write TaskForge v0.1 source code (see Spine Project spec below) and store in `src/assets/taskforge-v01.py`

**PRE-BUILD VALIDATION CHECKLIST (must pass before proceeding to Phase B):**

The builder must confirm ALL of the following:
- [ ] `src/css/design-system.css` extracted correctly (open in browser, inspect variables)
- [ ] Sidebar navigation renders identically in all phase files
- [ ] Theme toggle works in all phase files (dark ↔ light)
- [ ] All phase files open independently without broken styles or JS errors
- [ ] `src/assets/taskforge-v01.py` exists and runs: `python3 src/assets/taskforge-v01.py`
- [ ] At least one SVG diagram renders correctly in both themes (test with a placeholder diagram)
- [ ] Mobile view under 900px: sidebar collapses, hamburger works, content is readable
- [ ] Navigation links between phase files work (click Phase 2 link in Phase 1 sidebar → opens Phase 2)

**If ANY check fails, do not proceed to chapter construction. Fix the infrastructure first.**

6. Update PROGRESS.md, git commit: "infrastructure: multi-file shell with design system"

### Performance Guardrail
If any phase HTML file exceeds 1200 lines or 500KB during the build, split that phase into `phase-X-a.html` and `phase-X-b.html`. Both files must share the same sidebar navigation. Update all cross-file links.

### Phase B: Content (one PHASE at a time, in chapter order)
For EACH chapter within a phase:
1. Reload context files: `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/PEDAGOGY-REVIEW.md`, `docs/QA-CHECKLIST.md`
2. Read the chapter spec in this document
3. Draft in `src/drafts/chXX-draft.md` (plain text first)
4. Convert to HTML using design system components
5. Build all SVG diagrams per the diagram spec
6. Build "Try This Now" with verification + troubleshooting
7. Build 2+ single-concept micro-exercises in the chapter body
8. Verify the chapter references TaskForge at least once
9. Insert into the correct phase HTML file
10. **CHECKPOINT:** Browser test in both themes + mobile
11. Run Rendering QA checklist
12. Run Pedagogical QA checklist
13. Update PROGRESS.md + COMPONENT-REGISTRY.md
14. Git commit: "ch[XX]: [title]"
15. Output build status report:

```
BUILD STATUS
Current Phase: [N]
Current Chapter: [XX] — [title]
Files Modified: [list]
Rendering QA: PASS / FAIL
Pedagogical QA: PASS / FAIL
TaskForge Referenced: YES / NO
Next Step: [what to do next]
```

16. Stop generation. Wait for confirmation before next chapter.

After all chapters in a phase are complete:
17. Build the Phase Gate section
18. Build the TaskForge Checkpoint section
19. **CHECKPOINT:** Full phase file review
20. Git commit: "phase-[N]: gate + taskforge checkpoint"
21. Output phase completion status report. Stop. Wait for confirmation.

### Phase C: Appendices
### Phase D: Final QA (cross-file navigation, full read-through, all viewports)
### Phase E: Copy to output/

---

## Step 8: Recovery Protocol

If context is lost (compaction, new session, crash):

**Before starting ANY chapter, always reload these files first:**
1. `cat docs/PROGRESS.md` — where you left off
2. `cat docs/DECISIONS.md` — what's been decided
3. `cat docs/PEDAGOGY-REVIEW.md` — any outstanding pedagogical issues
4. `cat docs/QA-CHECKLIST.md` — any outstanding QA issues
5. Read last session log entry in PROGRESS.md
6. Read the current chapter spec in this build instructions file
7. Open current phase HTML to see state
8. Resume from "Next:" in session log

**This reload sequence is mandatory at the start of every work session, not just after crashes.**

---

## Step 9: Multi-Agent Coordination (Optional)

**Agent 1 (Lead/Integrator):** Owns phase HTML files, manages PROGRESS.md, handles infrastructure and integration. Only agent that writes to phase HTML files.

**Agent 2 (Content Writer):** Writes chapter drafts in `src/drafts/`. Never touches phase HTML files.

**Agent 3 (Diagram Specialist):** Builds SVG diagrams per specs. Tests both themes. Delivers as code blocks to Agent 1.

**Agent 4 (QA):** Runs Rendering QA and Pedagogical QA checklists. Writes findings to QA-CHECKLIST.md. Never modifies content.

**Agent 5 (Pedagogy Editor):** Reviews completed chapters for beginner comprehension, pacing, jargon load, and exercise difficulty. Writes to `docs/PEDAGOGY-REVIEW.md`. A chapter CANNOT be marked ✅ until Agent 5's review is complete.

Responsibilities:
- Flag any technical term used before introduction
- Flag any exercise requiring skills not yet taught
- Flag any paragraph with 2+ jargon terms without plain-English explanation
- Rate each chapter's difficulty 1-5 (1=too easy, 3=appropriate, 5=too hard)
- If difficulty > 3, suggest specific simplifications
- Verify "Try This Now" is completable by someone who has ONLY read preceding chapters
- Identify any section exceeding 250 words without a code example, diagram, or exercise
- Identify jargon clusters (3+ new terms within 2 paragraphs) and flag for spreading or glossary linking
- Flag diagrams that do not teach a non-obvious concept
- Verify every chapter references TaskForge at least once
- Does NOT rewrite chapters or modify HTML

**Coordination:** Only Agent 1 writes to phase HTML files. Lock files: `docs/.lock-chXX`. Agent 5 reviews must complete before Agent 1 marks a chapter ✅.

### File Locking Rule

Only Agent 1 (Lead/Integrator) may modify:
- Phase HTML files (`phase-1.html` through `phase-5.html`)
- `index.html`
- `appendices.html`
- `src/css/design-system.css` (during Phase A only — immutable after)

All other agents must produce outputs as:
- Markdown drafts in `src/drafts/`
- Code blocks in their communication channel
- Review notes in `docs/`

Agent 1 integrates all outputs. No other agent touches production files. Lock file convention: create `docs/.lock-chXX` when Agent 1 begins integration, delete when commit is made.

# === END META-INSTRUCTIONS ===

---
---

# DOCUMENT ARCHITECTURE

## The Core Thesis

**Phase 1 (Ch 1-4): What is code?** Understand what code IS and how computers execute it — so you can read, evaluate, and direct AI-generated code.

**Phase 2 (Ch 5-8): Writing Python.** Working fluency in one language. Enough to read any function, understand control flow, and spot when something's wrong.

**Phase 3 (Ch 9-12): Building real software.** Files, modules, APIs, databases, version control. The vocabulary of professional codebases that Claude Code operates in.

**Phase 4 (Ch 13-17): Levels 1-5 of Agentic Engineering.** From evaluating AI output to custom skills and MCPs. The progression from "I can judge AI code" to "the AI has capabilities I've given it."

**Phase 5 (Ch 18-21): Levels 6-8 of Agentic Engineering.** From harness engineering to autonomous agent teams. Aspirational reference material — return to this as projects grow in complexity.

**The key insight threaded throughout:** Every chapter in Phases 1-3 exists to make Phases 4-5 possible. "You need to understand functions because when Claude Code generates a 200-line function, you need to know whether it's doing what you asked."

## The 8 Levels Progression

| Level | Name | Core Skill | What Changes |
|-------|------|-----------|--------------|
| 1 | Tab Complete | Accept AI suggestions | You type less |
| 2 | Agent IDE | Chat with codebase | Multi-file edits become easy |
| 3 | Context Engineering | Curate what the model sees | Output quality jumps |
| 4 | Compounding Engineering | Codify what you learn | Every session improves |
| 5 | MCP & Skills | Give the model capabilities | The model can ACT |
| 6 | Harness Engineering | Build automated feedback loops | The model verifies itself |
| 7 | Background Agents | Orchestrate parallel workers | Work happens while you sleep |
| 8 | Autonomous Agent Teams | Agents coordinate directly | Agents manage themselves |

**Critical rule:** "Levels 3-5 are the building blocks. If your context is noisy, your prompts are misspecified, or your tools are poorly described, levels 6-8 just amplify the mess."

## The Spine Project: TaskForge

TaskForge is a command-line task manager that the reader builds incrementally across all five phases. It is NOT a detached appendix — it is the physical artifact that proves the reader completed the curriculum.

**Phase 1 (after Ch04):** Reader receives TaskForge v0.1 (50 lines). Assignment: read it and write a code analysis (what does it do, what data structure, what edge case does it miss). This IS the Phase 1 Gate artifact.

**Phase 2 (after Ch08):** Reader extends TaskForge: filter function (conditionals, loops), JSON save/load (file I/O), 5 test assertions. This IS the Phase 2 Gate artifact.

**Phase 3 (after Ch12):** Reader restructures TaskForge: `src/`, `tests/`, README, requirements.txt, git repo with 3+ commits and a merged branch, a simple REST API endpoint, CI stub. This IS the Phase 3 Gate artifact.

**Phase 4 (after Ch17):** Reader uses Claude Code on TaskForge: CLAUDE.md, custom skill to add "priority" field, subagent to generate tests, review AI diff and fix an issue. This IS the Phase 4 Gate artifact.

**Phase 5 (after Ch21):** Reader dispatches agents: one adds "due date," another adds "tags," pre-commit hooks for backpressure, review both outputs, resolve conflicts. This IS the Phase 5 Gate artifact.

**TaskForge v0.1 source code** (include inline in Phase 1, after Chapter 04):

```python
# taskforge.py — v0.1
# A minimal command-line task manager

tasks = []

def add_task(description):
    task = {"id": len(tasks) + 1, "description": description, "status": "pending"}
    tasks.append(task)
    return task

def complete_task(task_id):
    for task in tasks:
        if task["id"] == task_id:
            task["status"] = "complete"
            return task
    return None

def list_tasks():
    return tasks

def main():
    while True:
        command = input("\nTaskForge> ").strip().lower()
        if command == "add":
            desc = input("Description: ")
            task = add_task(desc)
            print(f"Added: #{task['id']} — {task['description']}")
        elif command == "done":
            task_id = int(input("Task ID: "))
            result = complete_task(task_id)
            if result:
                print(f"Completed: #{result['id']}")
            else:
                print("Task not found.")
        elif command == "list":
            for t in list_tasks():
                status = "✓" if t["status"] == "complete" else " "
                print(f"  [{status}] #{t['id']} — {t['description']}")
        elif command == "quit":
            break
        else:
            print("Commands: add, done, list, quit")

if __name__ == "__main__":
    main()
```

---

## Tool Reference Structure (Mandatory for Phases 4-5)

Every tool reference must use the two-layer pattern:

**Layer 1 — Enduring Concept** (will not change; survives 2+ years):
Describe what the tool category DOES and WHY it matters.

**Layer 2 — Current Example** (will change; clearly marked):
Specific tool, version, install command, configuration. Wrapped in a distinct block.

Example:
> **Concept: Background Agent Orchestration**
> A dispatcher tool lets your main session stay lean while workers execute tasks in isolated contexts.
>
> **Current tool (as of March 2026):** Dispatch. Install: `npx skills add bassimeledath/dispatch -g`. Alternatives: `claude --background`, Gas Town, Multiclaude, Ramp Inspect.

Apply to ALL tool references in Phases 4-5.

---

## Diagram Specification Rules (Mandatory)

1. Every diagram teaches one non-obvious concept. Decorative diagrams not permitted.
2. Captions state the main takeaway, not describe the diagram. Bad: "A flowchart showing git branching." Good: "Feature branches isolate work. Merging brings it back. Conflicts happen when two branches change the same line."
3. Interpretable in 5 seconds. If a reader needs 30 seconds, the diagram is too complex.
4. Every diagram spec includes: viewBox (always 700 width), node count and names, connection topology, which nodes use `node-accent` vs `node-fill`, label text, caption with takeaway.
5. Dark/light compatibility via CSS variables. No hardcoded hex except domain-specific indicators.
6. All diagrams must follow these structural constraints:
   - SVG width: 700. Use `viewBox="0 0 700 HEIGHT"`.
   - All text elements must use design-system classes: `label-text` or `sub-text`.
   - Nodes must use: `node-fill` or `node-accent`.
   - All arrows must use `marker-end="url(#arrowhead)"`.
   - No hardcoded colors anywhere. All fills, strokes, and text colors via CSS custom properties.

### SVG Validation Checklist

Before marking any chapter complete, verify every SVG diagram in that chapter passes:
- [ ] `viewBox` width = 700
- [ ] Arrow marker `url(#arrowhead)` exists in the file's SVG defs
- [ ] No hardcoded hex colors (search for `#` followed by 3 or 6 hex chars inside SVG elements)
- [ ] All text uses `label-text` or `sub-text` class
- [ ] All nodes use `node-fill` or `node-accent` class
- [ ] Caption exists and explains the takeaway (not just describes the diagram)
- [ ] Renders correctly in dark theme
- [ ] Renders correctly in light theme

---

## Chapter Acceptance Criteria (Apply to Every Chapter)

**Purpose:** One sentence, measurable.
**Learner outcome:** What the reader can DO (verb: write, identify, create, explain, debug — not "understand").
**Artifact:** What the reader creates (file, repo, config, analysis).
**Verification:** Pass/fail, not subjective.
**Common misconceptions:** 1-3 most likely wrong beliefs, explicitly addressed.
**Forward dependencies:** Which later chapters depend on this one.
**Micro-exercises:** 2+ single-concept exercises in the chapter body before synthesis.
**Try This Now:** Synthesis exercise at the end. Requires ONLY skills from this + preceding chapters. Includes verification + troubleshooting (2-3 common failures).
**Diagram:** Minimum 1 per chapter, meeting rubric above.
**Jargon:** Max 5 new terms. All defined on first use or linked to glossary. No forward references.

---

# CHAPTER SPECIFICATIONS

## PHASE 1: WHAT IS CODE?

**Progress marker:** "By the end of Phase 1, you can read a 30-line Python function and explain what it does. See the Phase 1 Gate for the exact test."

---

### Chapter 01: What Programming Actually Is

**Learner outcome:** Explain what a program is (a text file with instructions an interpreter translates) and name 3 categories of programming languages.
**Artifact:** A sentence written in plain English describing what code is, demonstrating comprehension.
**Common misconceptions:** (1) "You need to be good at math" — programming is closer to writing recipes than solving equations. (2) "Code is mysterious/magical" — it's a text file.

**Key content:**
- Programming as instructions for a machine with zero common sense. The peanut butter sandwich analogy: "put peanut butter on bread" — the machine doesn't know to open the jar.
- Why code exists: computers understand voltage patterns. Languages are human-readable translations. Multiple layers between Python and CPU.
- Abstraction layers: you don't need transistors to write Python.
- What a program IS: a text file that an interpreter/compiler translates.
- Language landscape: Python (readability/AI), JavaScript (web), Rust (performance), SQL (databases).

**Diagram 1 (SVG, `.diagram`):** The Abstraction Stack — 5 vertically stacked nodes: Human Thought (node-accent) → Python Code (node-accent) → Bytecode (node-fill) → Machine Code (node-fill) → CPU Voltage (node-fill). Arrows between each. Caption: "You write Python. Four translation layers later, the CPU flips switches. You never touch the lower layers."

**Diagram 2 (SVG):** Language Landscape — 5 columns: Web (JS, HTML/CSS), Systems (Rust, C, Go), Data/AI (Python, R), Mobile (Swift, Kotlin), Databases (SQL). Python node uses node-accent. Caption: "Different languages for different jobs. Python is your starting point — it covers AI, scripting, and web backends."

**Micro-exercise 1:** "In your browser console (F12 → Console), type `"hello" + " " + "world"` and press Enter. What happened? The browser CONCATENATED two strings. You just gave the machine an instruction and it followed it literally."
**Micro-exercise 2:** "Type `2 + 2` in the console. Now type `"2" + "2"`. Why are the results different? (Answer: numbers add, strings concatenate. The machine takes you literally — the quotes change the data type.)"

**Try This Now:** "Open any browser. Press F12. Click Console. Type `2 + 2` and press Enter. You just executed code. Now type `console.log('I wrote code')`. You just executed a program that produces output."
**Verification:** If the console shows `4` and then `I wrote code`, you succeeded.
**If this doesn't work:** If F12 doesn't open developer tools, try right-click → Inspect → Console tab. On Safari, enable Developer menu first (Preferences → Advanced → Show Develop menu).

---

### Chapter 02: How Computers Execute Code

**Learner outcome:** Predict the output of a 5-line program with variables, assignment, and print.
**Artifact:** Written predictions for 3 code snippets (before running them), then verified.
**Common misconceptions:** (1) "Variables are permanent" — they can be reassigned. (2) "The computer understands what I mean" — it executes exactly what you write, nothing more.

**Key content:**
- Variables as labeled boxes: `speed = 85`. The box can be refilled. The label stays.
- Sequential execution: top to bottom. Order matters. `x = 5` then `x = x + 1` → 6.
- Data types as box shapes: integers, floats, strings, booleans. The shape determines valid operations.
- Operators: arithmetic, comparison, logical.
- Input/output: `print()` as simplest output.
- Errors as feedback: syntax (spelling), runtime (impossible operation like divide by zero), logic (runs fine, wrong answer). "AI code generators almost never produce Type 1 or 2. Type 3 is where they fail — and where your review matters."

**Diagram 1 (SVG, `.dw`):** Memory Visualization — 3 labeled boxes: `x` containing `10`, `y` containing `"hello"`, `z` containing `True`. Show an arrow from `x = x + 5` instruction to `x` box changing from `10` to `15`. Caption: "Variables are boxes with labels. Assignment puts a new value in the box. The old value is gone."

**Diagram 2 (SVG):** Error Types — 3 cards side by side: Syntax Error (node with red-pink border, text: "Caught before running. Typo."), Runtime Error (amber border, "Crashes during execution. Impossible operation."), Logic Error (blue border, "Runs fine. Wrong answer. Hardest to find."). Caption: "AI-generated code almost never has syntax or runtime errors. Logic errors — code that runs but does the wrong thing — are where AI fails and where your review matters."

**Micro-exercise 1:** "Predict: `a = 3; b = a; a = 7; print(b)`. What prints? (Answer: 3, not 7. `b` got a COPY of `a`'s value, not a link to it.)"
**Micro-exercise 2:** "Predict: `name = 'world'; print('Hello, ' + name + '!')`. What prints?"

**Try This Now:** "Predict the output of these three snippets BEFORE running them: (1) `x = 10; x = x * 2; print(x)` (2) `a = 'py'; b = 'thon'; print(a + b)` (3) `x = 5; y = 0; print(x / y)`. Write your predictions. Now run them. How many did you get right?"
**Verification:** If you predicted 20, `python`, and an error (ZeroDivisionError), you understand sequential execution, string concatenation, and runtime errors.
**If this doesn't work:** If Python isn't installed yet, do Chapter 03 first, then return. Or use the browser console at replit.com (free, no install).

---

### Chapter 03: Setting Up Your Environment

**Learner outcome:** Run a Python script from the terminal and install a package with pip.
**Artifact:** A working `hello.py` that runs without errors.
**Common misconceptions:** (1) "The terminal is for hackers" — it's just text-based computer interaction. (2) "I need an IDE to code" — a text editor + terminal is sufficient.

**Key content:**
- The terminal: what it is, why developers use it. "Instead of clicking File → New Folder, you type `mkdir new_folder`. Faster, scriptable, automatable."
- Installing Python: macOS (`brew install python3` or python.org), Windows (python.org installer, check "Add to PATH"), Linux (`apt install python3`). Verify: `python3 --version`.
- The REPL: `python3` → `>>>` prompt. Your sandbox for testing.
- Installing VS Code (or Cursor/Zed — acknowledge AI-native editors exist but start with VS Code).
- First file: `hello.py` containing `print("Hello, World!")`. Run: `python3 hello.py`.
- pip and packages: `pip install requests`. Libraries = code other people wrote that you can use.
- Virtual environments (brief): `python3 -m venv myenv`, `source myenv/bin/activate`.

**Diagram (SVG, `.diagram`):** Terminal Anatomy — a terminal window with labeled parts: Prompt (`$` or `%`, where you type), Command (`python3 hello.py`, what you typed), Output (`Hello, World!`, what came back), Current Directory (`~/projects`, where you are). 4 nodes in a vertical layout with labels. Caption: "The terminal is a conversation. You type a command. The computer responds. The prompt tells you it's ready for the next one."

**Callout (`.callout.info`):** "Claude Code requires Node.js in addition to Python. Install it now to avoid a second setup session: go to nodejs.org and download the LTS version. Verify: `node --version`."

**Micro-exercise 1:** "Open your terminal. Type `pwd` (Mac/Linux) or `cd` (Windows). This shows your current directory. Navigate to your Desktop: `cd ~/Desktop`."
**Micro-exercise 2:** "Create a directory: `mkdir my-project`. Navigate into it: `cd my-project`. Create a file: `echo 'print(42)' > test.py`. Run it: `python3 test.py`."

**Try This Now:** "Create `me.py` that prints your name, the year, and why you're learning programming (3 separate print statements). Run: `python3 me.py`."
**Verification:** If all three lines appear in the terminal, your environment works.
**If this doesn't work:** (1) `python3: command not found` → Python isn't installed or not in PATH. On Windows, try `python` without the `3`. On Mac, run `brew install python3`. (2) `SyntaxError` → check for missing quotes or parentheses. (3) File not found → make sure you're in the same directory as the file (`ls` to check).

---

### Chapter 04: Reading Code Before Writing It

**Learner outcome:** Read a 30-line Python function and produce a written analysis: what it does, inputs, outputs, one edge case.
**Artifact:** Written code analysis of TaskForge v0.1.
**Common misconceptions:** (1) "I need to understand every line to read code" — start with the big picture, then zoom in. (2) "Reading code is passive" — it's active analytical work.

**Key content:**
- The paradigm shift: traditional education starts with writing. AI-assisted work starts with reading. 80% of your time will be reading/evaluating AI-generated code.
- How to read code: top-to-bottom (structure), trace logic (data flow), check edges (empty inputs, huge inputs).
- Pattern recognition: functions, loops, conditionals, imports — RECOGNIZE them, not write from memory.
- Comments and naming: `total_price` tells you what's in the box. `x` doesn't. Bad naming is a red flag in AI output.
- Reading error messages: stack traces — read from the BOTTOM.

**Before/After (`.pe`):** "Weak reading" = "It does stuff with tasks." "Strong reading" = "This script manages a list of task dictionaries. `add_task` creates a dict with id, description, and 'pending' status. `complete_task` iterates the list to find a matching id and updates the status. The `main` function runs an input loop with 4 commands. Edge case: if you enter a non-integer for task ID in `done`, it crashes with ValueError because there's no try/except."

**Micro-exercise 1:** "Look at this function: `def double(x): return x * 2`. What does it do? What does `double(5)` return? What does `double('hi')` return?"
**Micro-exercise 2:** "Look at this: `for item in ['a', 'b', 'c']: print(item.upper())`. How many times does the print run? What's the output?"

**Try This Now:** "Read the TaskForge v0.1 code (provided above). Write a code analysis answering: (1) What does this program do? (2) What data structure stores the tasks? (3) What happens if you enter `done` and type `abc` instead of a number? (4) What happens if the list is empty and you type `list`? Write 4-6 sentences."
**Verification:** Your analysis should identify: a command-line task manager, a list of dictionaries, a crash on non-integer input, and an empty output for an empty list. If you got 3 of 4, you pass.
**If this doesn't work:** If the code looks completely alien, return to Chapter 02 and re-read the sections on variables and functions. The patterns in TaskForge are the same patterns from Chapter 02 at larger scale.

---

### Phase 1 Gate

**Minimum competency:** Read a 30-line function, explain what it does, identify inputs/outputs, spot one edge case.
**Artifact:** Your written TaskForge v0.1 analysis from Chapter 04's exercise.
**Verification:** Analysis identifies 3 of 4 elements (purpose, data structure, crash case, empty case).
**Failure signal:** If you cannot predict the output of `x = 5; x = x + 1; print(x)` → return to Chapter 02.

**TaskForge Checkpoint:** You have read and analyzed TaskForge v0.1. You have NOT modified it. The project exists as a single `.py` file with no tests, no git, no structure. This is your baseline.

---

## PHASE 2: WRITING PYTHON

**Progress marker:** "By the end of Phase 2, you can write a function with tests and debug when it fails. See the Phase 2 Gate for the exact test."

---

### Chapter 05: Functions, Logic, and Control Flow

**Learner outcome:** Write a function with parameters, conditional logic, and a return value.
**Artifact:** A working `analyze_signal` function that passes 3 test cases.
**Common misconceptions:** (1) "Functions run when you define them" — defining creates the function, CALLING it runs it. (2) "If/else checks all branches" — it executes the FIRST true branch and skips the rest.

**Key content:**
- Functions: `def`, parameters, `return`. A function is a small machine. One function, one job.
- Conditionals: `if`, `elif`, `else`. Decision trees in code.
- Comparison and logical operators: `==`, `!=`, `>`, `<`, `and`, `or`, `not`.
- Loops: `for` (each item in collection), `while` (until condition changes).
- Combining: a function that loops through data and uses conditionals.
- Scope: variables inside functions are invisible outside. Common source of bugs in AI code.

**Diagram 1 (SVG, `.diagram`):** Control Flow Branching — an if/elif/else with 3 paths. Input node (node-accent) → diamond decision → 3 branch nodes (node-fill, labeled "Path A", "Path B", "Path C") → convergence node. Caption: "The program takes ONE path. Once it enters a branch, it skips all others."

**Diagram 2 (SVG, `.dw`):** Loop Execution — show a `for item in [10, 20, 30, 40, 50]` loop with a `total` accumulator. 5 iteration rows showing: current item, total before, total after. Caption: "The loop processes one item at a time. The accumulator remembers the running result."

**Micro-exercise 1:** "Write a function `greet(name)` that returns `'Hello, [name]!'`. Call it: `print(greet('World'))`."
**Micro-exercise 2:** "Write a function `is_positive(n)` that returns `True` if n > 0, `False` otherwise."
**Micro-exercise 3:** "Write a `for` loop that prints each number in `[1, 2, 3, 4, 5]` multiplied by 10."

**Try This Now:** "Write `analyze_signal(value, threshold)` returning 'CRITICAL' if value > threshold, 'WARNING' if value > threshold * 0.9, 'NORMAL' otherwise. Test: `analyze_signal(95, 100)` should return 'WARNING'. `analyze_signal(105, 100)` → 'CRITICAL'. `analyze_signal(50, 100)` → 'NORMAL'."
**Verification:** All 3 test cases return the expected value.
**If this doesn't work:** (1) All results are 'CRITICAL' → your `if` checks are in the wrong order (check CRITICAL first, then WARNING). (2) `NameError` → you forgot `def` or misspelled the function name. (3) Nothing returns → you used `print()` instead of `return`.

---

### Chapter 06: Data Structures — Lists, Dicts, and How Data Lives

**Learner outcome:** Create and manipulate a nested dictionary, access nested values.
**Artifact:** A dictionary representing a project with nested data.
**Common misconceptions:** (1) "Lists and dicts are the same" — lists are ordered by position, dicts are accessed by key name. (2) "Dicts must be flat" — they can nest arbitrarily.

**Key content:**
- Lists: ordered, indexed from 0, mutable. `signals = ["speed", "rpm", "fuel"]`. Comprehensions.
- Dictionaries: key-value pairs. `warning = {"level": "critical", "system": "brakes"}`. Accessing: `warning["level"]`. THE most important structure for APIs and AI tools (JSON = nested dicts).
- Nested structures: lists of dicts, dicts of lists. `vehicles = [{"name": "Model A", "type": "EV"}, {"name": "Model B", "type": "diesel"}]`.
- Tuples (immutable lists), sets (unique collections).
- Choosing: "Order → list. Lookup by name → dict. Uniqueness → set."

**Diagram (SVG, `.dw`):** Data Structure Comparison — 3 side-by-side visuals: List (indexed boxes: [0]="a", [1]="b", [2]="c"), Dict (key→value pairs: "name"→"Alice", "age"→30), Nested (dict containing a list: "tasks"→[{...}, {...}]). Caption: "Lists hold ordered items. Dicts hold named items. Real data is usually nested dicts containing lists of dicts."

**Micro-exercise 1:** "Create a list of 5 numbers. Print the third one (remember: index starts at 0)."
**Micro-exercise 2:** "Create a dict with keys 'name', 'age', 'city'. Print just the city."

**Try This Now:** "Create a dict representing a project: `name` (string), `features` (list of 3 strings), `tech_stack` (dict with 'language', 'framework', 'database'), `status` (string). Print `project['tech_stack']['framework']`."
**Verification:** The nested access prints the framework value.
**If this doesn't work:** (1) `KeyError` → the key name doesn't match exactly (case-sensitive). (2) `TypeError: string indices` → you used `project['tech_stack']` as a string, not a dict. Check that tech_stack is defined as `{...}` not `"..."`.

---

### Chapter 07: Files, Modules, and the Standard Library

**Learner outcome:** Read a JSON file, modify its contents in Python, write it back.
**Artifact:** A script that reads, modifies, and writes a JSON file.
**Common misconceptions:** (1) "JSON is a programming language" — it's a data format (like a spreadsheet is a data format). (2) "Importing a module downloads it" — standard library modules are already installed.

**Key content:**
- Reading/writing files: `open()`, context managers (`with open(...) as f:`).
- File formats: .txt, .csv, .json, .md. JSON deeply: `json.loads()` (string→dict), `json.dumps()` (dict→string), `json.load()` (file→dict), `json.dump()` (dict→file).
- Modules and imports: `import os`, `from pathlib import Path`, `import json`.
- Standard library highlights: `os`, `pathlib`, `json`, `datetime`, `re`, `subprocess`.
- Organizing code: modules = `.py` files with functions. `if __name__ == "__main__":`.

**Diagram (SVG, `.dw`):** File Format Comparison — same data (name: "Alice", age: 30, tasks: ["code", "test"]) shown as: .txt (plain text), .csv (comma-separated), .json (curly braces), .py dict (Python syntax). 4 side-by-side boxes. Caption: "Different formats store the same data differently. JSON is the format AI tools and APIs use. Learn it well."

**Micro-exercise 1:** "Write a script that creates a text file: `with open('hello.txt', 'w') as f: f.write('Hello!')`. Then read it back and print the contents."
**Micro-exercise 2:** "Import json. Convert this dict to a JSON string: `data = {'name': 'test', 'count': 5}`. Print the string."

**Try This Now:** "Create `config.json` with: `{\"project\": \"my-app\", \"version\": \"0.1\", \"features\": [\"auth\", \"dashboard\"]}`. Write a Python script that reads this file, adds `\"api\"` to the features list, and writes it back. Verify by reading and printing the updated file."
**Verification:** After running, `config.json` contains `[\"auth\", \"dashboard\", \"api\"]`.
**If this doesn't work:** (1) `FileNotFoundError` → the JSON file isn't in the same directory as your script. Use `ls` to check. (2) `json.decoder.JSONDecodeError` → invalid JSON (check for missing quotes, trailing commas). (3) File unchanged → you forgot to write back with `json.dump()`.

---

### Chapter 08: Error Handling, Debugging, and Testing

**Learner outcome:** Write 3+ meaningful assert statements and run pytest.
**Artifact:** A test file with assertions that pass.
**Common misconceptions:** (1) "Errors mean I'm bad at coding" — errors are normal feedback. (2) "Testing is optional" — in the AI era, tests are your primary quality gate. (3) "The AI will write correct code" — it writes plausible code that might be wrong.

**Key content:**
- Try/except: `try: result = risky_op() except ValueError as e: print(f"Bad input: {e}")`.
- Common exceptions: `ValueError`, `TypeError`, `KeyError`, `FileNotFoundError`, `IndexError`.
- Debugging: print debugging, `breakpoint()`, reading stack traces bottom-up.
- Testing with `assert`: `assert calculate_tax(100) == 10`.
- pytest basics: `test_*.py` files, running `pytest`, reading output.
- Why testing matters MORE in the AI era: write tests first, let AI implement, tests verify.

**Diagram (SVG, `.diagram`):** Test-Driven AI Pipeline — 4 nodes in a flow: Write Tests (node-accent, "YOU define correct behavior") → Describe Feature to AI (node-fill) → AI Generates Code (node-fill) → Run Tests (node-accent, "Pass = evidence of correctness. Fail = iterate."). Caption: "Write tests BEFORE asking the AI. Tests define the contract. The AI implements against it."

**Callout (`.callout.critical`):** "Test-Driven AI Development: Write tests before asking the AI to write code. This is the highest-leverage AI coding workflow."

**Micro-exercise 1:** "Write: `assert 2 + 2 == 4`. Run it. Nothing happens (assertion passed). Now write: `assert 2 + 2 == 5`. Run it. You get `AssertionError`. Assertions that PASS are silent."
**Micro-exercise 2:** "Write: `try: print(1/0) except ZeroDivisionError: print('Cannot divide by zero')`. Run it. The program handles the error gracefully instead of crashing."

**Try This Now:** "Write 3 assert statements testing a function called `is_valid_email(email)` — one valid email, one invalid (no @), one edge case (empty string). Don't write the function. Go to claude.ai or chatgpt.com (free) and ask: 'Write a Python function `is_valid_email` that passes these tests: [paste your asserts].' Run the tests. Did it pass?"
**Verification:** The AI's function passes all 3 assertions.
**Note:** This is your first interaction with an LLM for code. You haven't formally learned about AI coding tools (that starts in Phase 4). This is a preview of the test-driven AI workflow you'll master later.
**If this doesn't work:** (1) `NameError: is_valid_email` → you need to paste the AI's function definition ABOVE your assert statements. (2) Assertion fails → the AI's implementation has a bug. Read the function and figure out why. This is exactly the skill Phase 4 teaches.

---

### Phase 2 Gate

**Minimum competency:** Write a function with parameters, conditionals, loops, and a return value. Create/manipulate nested dicts. Read/write JSON. Write meaningful test assertions.
**Artifact:** Extended TaskForge with: `filter_tasks(status)` function (returns only tasks matching the status), JSON save/load (`save_tasks(filepath)`, `load_tasks(filepath)`), and 5 passing test assertions (add, complete, filter, save, load).
**Verification:** `python3 taskforge.py` runs. `pytest test_taskforge.py` passes 5 assertions.
**Failure signal:** If you cannot write a function that takes a list and returns filtered results → return to Chapters 05-06.

**TaskForge Checkpoint:** TaskForge now has filtering, persistence (JSON), and tests. Still a single directory with no git, no structure.

---

## PHASE 3: BUILDING REAL SOFTWARE

**Progress marker:** "By the end of Phase 3, you can navigate a professional codebase, use git, and make API calls. See the Phase 3 Gate for the exact test."

---

### Chapter 09: The Terminal and Shell Scripting

**Learner outcome:** Compose a multi-step shell pipeline using pipes.
**Artifact:** A one-liner that searches files and counts results.
**Common misconceptions:** (1) "The terminal is outdated" — it's the primary interface for professional development and all AI coding tools. (2) "I need to memorize all commands" — you need ~15 commands and the ability to look up the rest.

**Key content:**
- Shell fundamentals: `cd`, `ls`, `pwd`, `mkdir`, `rm`, `cp`, `mv`, `cat`, `head`, `tail`, `grep`, `find`. For each: one-line description, one example.
- Piping: `|` sends output of one command to another. `>` writes to file. `>>` appends.
- Environment variables: `export API_KEY="..."`, `echo $PATH`.
- PATH: what it is, why `command not found` happens.
- Shell scripting basics: `.sh` files, shebang (`#!/bin/bash`).
- `tmux` fundamentals: split panes, sessions. "Multiple Claude Code sessions require multiple panes."
- SSH basics: what it is, key generation.

**Diagram (SVG, `.dw`):** Pipe Composition — data flowing through 4 stages: `cat access.log` (reads file) → `grep "POST"` (filters POST requests) → `grep "500"` (filters errors) → `wc -l` (counts lines). Each stage shows sample data shrinking. Caption: "Pipes compose small tools into powerful workflows. Each stage filters or transforms the data for the next."

**Micro-exercise 1:** "Run `echo 'hello world' | wc -w`. The pipe sends the output of echo to the word-counter. Result: 2."
**Micro-exercise 2:** "Run `ls | head -5`. This lists files and shows only the first 5."

**Try This Now:** "In one line, find all Python files in your current directory tree that contain the word 'import' and count them: `grep -rl 'import' . --include='*.py' | wc -l`."
**Verification:** A number prints (the count of matching files).
**If this doesn't work:** (1) `grep: No such file or directory` → make sure you're in a directory that contains `.py` files. `cd` to your project first. (2) Count is 0 → you might be in an empty directory or one without Python files.

---

### Chapter 10: Version Control with Git

**Learner outcome:** Create a branch, make commits on it, and resolve a merge conflict.
**Artifact:** A git repo with 3+ commits, a merged branch, and a resolved conflict.
**Common misconceptions:** (1) "Git is just backup" — it's a collaboration and parallel-work tool. (2) "Merge conflicts mean I did something wrong" — they're normal when parallel work touches the same lines.

**Key content:**
- What Git does: tracks every change, enables undo, enables parallel work.
- Mental model: time machine. Commits = snapshots. Branches = parallel timelines.
- Core commands: `init`, `add`, `commit`, `status`, `log`, `diff`. For each: what, when, example.
- Branching: `branch`, `checkout`/`switch`, `merge`.
- Remotes: `clone`, `push`, `pull`. GitHub.
- `.gitignore`: API keys, node_modules, .env, venvs.
- Merge conflicts: what they are, `<<<<<<<`/`=======`/`>>>>>>>` markers, resolution.
- Worktrees: `git worktree add`. "Claude Code multi-agent uses worktrees."

**Diagram (SVG, `.diagram`):** Git Branching — a horizontal main branch with commit nodes, a feature branch diverging at commit 2, 2 commits on the feature branch, then merging back to main. Nodes: main commits (node-fill), branch point (node-accent), feature commits (node-fill), merge commit (node-accent). Caption: "Branches let you work on features without affecting main. Merging brings the work back. This is how every professional team works — and how AI agents work in parallel."

**Callout (`.callout.warn`):** "Git is the single most important prerequisite for Claude Code. Claude Code reads your git history, makes commits, creates branches, and resolves conflicts. If you don't understand what it's doing with git, you can't supervise it."

**Micro-exercise 1:** "Run `git init`, create a file, `git add .`, `git commit -m 'initial'`. Check `git log`."
**Micro-exercise 2:** "Run `git branch feature`, `git switch feature`, create a new file, commit it, `git switch main`. The new file disappears. It's on the other branch."

**Try This Now:** "Init a repo, commit a file, create branch `test`, modify line 1 on `test`, switch to `main`, modify the same line 1 differently, `git merge test`. You'll get a conflict. Open the file, resolve it (keep the version you want, delete the markers), commit."
**Verification:** `git log --oneline` shows at least 4 commits. The conflict markers are gone.
**If this doesn't work:** (1) `fatal: not a git repository` → you forgot `git init`. (2) No conflict → you modified different lines, not the same line. (3) `CONFLICT` message but file looks normal → you need to open the file in an editor to see the markers.

---

### Chapter 11: APIs, HTTP, and How Software Talks to Software

**Learner outcome:** Make an HTTP GET request, parse the JSON response, extract specific data.
**Artifact:** A script that calls a public API and prints extracted information.
**Common misconceptions:** (1) "APIs are complicated" — an API call is just sending a URL and getting data back. (2) "I need permission for every API" — many public APIs are free and open.

**Key content:**
- What an API is: software-to-software interface. "If a UI is how humans talk to software, an API is how software talks to other software."
- HTTP basics: GET (read), POST (create), PUT (update), DELETE (remove). Status codes (200 OK, 404 not found, 500 server error).
- JSON as universal data format.
- Python `requests`: `requests.get(url)`, `response.json()`. One real example.
- Authentication: API keys, Bearer tokens, `.env` files. Never commit keys.
- The Anthropic API: basic message format. "This is what Claude Code does under the hood."
- Rate limits, error handling, retry logic.

**Diagram (SVG, `.diagram`):** HTTP Request/Response — 2 nodes: Client (node-accent, "Your script") and Server (node-fill, "API"). Arrow right labeled "GET /api/repos?language=python" (the request). Arrow left labeled "200 OK + JSON body [{name: ..., stars: ...}]" (the response). Caption: "An API call is a question and an answer. You send a request with a URL. The server sends back data, usually as JSON."

**Micro-exercise 1:** "In Python: `import requests; r = requests.get('https://httpbin.org/get'); print(r.status_code)`. If 200, the request succeeded."
**Micro-exercise 2:** "Parse the response: `data = r.json(); print(data['origin'])`. You just extracted your IP address from an API response."

**Try This Now:** "Use `requests` to fetch `https://api.github.com/search/repositories?q=language:python&sort=stars&per_page=5`. Parse the JSON. Print each repo's `name` and `stargazers_count`."
**Verification:** 5 repo names print with star counts.
**If this doesn't work:** (1) `ModuleNotFoundError: requests` → run `pip install requests`. (2) `ConnectionError` → check internet connection. (3) `KeyError` → print the full JSON first (`print(r.json())`) to see the actual structure.

---

### Chapter 12: Project Architecture — How Real Codebases Work

**Learner outcome:** Clone an unfamiliar project and describe its architecture from README and directory structure.
**Artifact:** A written architectural summary of a cloned open-source project.
**Common misconceptions:** (1) "A project is just a collection of scripts" — it has defined structure, dependencies, tests, documentation. (2) "README is optional" — it's the first thing every developer (and Claude Code) reads.

**Key content:**
- From script to project: `src/`, `tests/`, `config/`, `docs/`, `README.md`, `requirements.txt`.
- Common structures: Python, Node.js, full-stack — side by side.
- Dependencies: pip + requirements.txt, npm + package.json.
- Databases (conceptual): SQL vs NoSQL, ORMs.
- Docker (conceptual): "A box containing your project plus everything it needs." Relevant for AI multi-agent isolation.
- CI/CD (conceptual): GitHub Actions.
- README.md: "When Claude Code reads a new codebase, it starts with README."

**Diagram (SVG, `.diagram`):** Project Anatomy — tree structure: project root (node-accent) with children: src/ (node-fill), tests/ (node-fill), docs/ (node-fill), README.md (node-accent, bold), requirements.txt (node-fill), .gitignore (node-fill), CLAUDE.md (node-accent, "AI reads this"). Caption: "Claude Code reads README first, then CLAUDE.md, then package files. Structure your project so both humans and AI agents can orient quickly."

**Micro-exercise 1:** "Run `mkdir -p myproject/src myproject/tests` and `touch myproject/README.md myproject/requirements.txt`. You just created a project skeleton."
**Micro-exercise 2:** "Write a one-paragraph README for your TaskForge project. Include: what it does, how to run it, how to run tests."

**Try This Now:** "Clone a popular project: `git clone https://github.com/psf/httpx.git`. Spend 15 minutes reading ONLY: directory structure (`ls`, `find . -maxdepth 2 -type d`), README, and one test file. Write a one-paragraph summary: what it does, how it's organized, what testing framework."
**Verification:** Your summary identifies: an HTTP client library, src/tests structure, and pytest.
**If this doesn't work:** (1) `git clone` fails → check internet and that git is installed. (2) Overwhelmed by file count → focus ONLY on top-level directories and README. Ignore everything else.

---

### Phase 3 Gate

**Minimum competency:** Use terminal commands, create git branches and resolve conflicts, make API calls, navigate unfamiliar codebases.
**Artifact:** TaskForge restructured with: `src/taskforge/`, `tests/`, README.md, requirements.txt, git repo with 3+ commits and a merged feature branch, a simple `/tasks` API endpoint (Flask: `pip install flask`), and a CI stub (`.github/workflows/test.yml` that runs pytest).
**Verification:** `git log --oneline` shows 3+ commits. `pytest` passes. `pip install -r requirements.txt` succeeds. `python3 -m flask run` serves the API. README describes the project.
**Failure signal:** If you cannot resolve a merge conflict or cannot explain `git status` output → return to Chapter 10.

**TaskForge Checkpoint:** TaskForge is now a proper project with structure, git history, an API endpoint, and CI. Ready for AI-assisted development.

---

## PHASE 4: LEVELS 1-5 OF AGENTIC ENGINEERING

**Progress marker:** "By the end of Phase 4, you can use Claude Code with custom skills, MCPs, and context engineering to implement features from specs you write. See the Phase 4 Gate for the exact test."

---

### Chapter 13: Evaluating and Directing AI-Generated Code (BRIDGE)

**Learner outcome:** Review a diff, write an implementation spec, and identify a hallucination in AI output.
**Artifact:** A written evaluation of an AI-generated code sample using the evaluation pipeline.
**Common misconceptions:** (1) "AI-generated code that runs is correct" — running without errors doesn't mean it does the right thing. (2) "The AI knows my project" — it only knows what you tell it in context. (3) "Polished output = trustworthy output" — formatting quality has zero correlation with correctness.

**THIS IS THE MOST IMPORTANT CHAPTER IN PHASE 4. Without these skills, every subsequent chapter produces a reader who uses AI tools without the judgment to evaluate their output.**

**Key content:**

**1. Reading Diffs**
- What a diff is: line-by-line comparison. `+` (added), `-` (removed), unchanged.
- `git diff` output format. What to look for: does the change match the request? Unrelated changes? Wrong deletions?

**2. Writing Implementation Specs**
- Difference between "make a login page" (vague) and a spec with: WHAT, INPUTS, OUTPUTS, CONSTRAINTS, EDGE CASES, ACCEPTANCE CRITERIA.
- The spec template: use this for every Claude Code request in Phase 4+.

**3. Constraints vs Step-by-Step Prompting**
- Step-by-step: "1. Do A. 2. Do B." → model follows checklist, ignores anything not on it.
- Constraint-based: "Achieve X. Requirements: [list]. Verify by: [test]." → model solves creatively within boundaries.
- When to use which: step-by-step for simple tasks. Constraints for anything requiring judgment.

**4. Recognizing AI Failures**
- Hallucinated imports (library doesn't exist — `pip install` 404s)
- Stale patterns (deprecated API)
- Over-engineering (200 lines for a 10-line problem)
- Missing error handling (happy path only)
- Confident wrongness (incorrect with full confidence)

**5. When Not to Trust the Model**
- Security (auth, encryption) — always verify against official docs
- Money (payments, calculations) — always verify with tests
- Architecture decisions — model optimizes locally, doesn't know system constraints
- Numerical precision — use code to compute, not the model

**6. Context Hygiene**
- Garbage in, garbage out. Include minimum necessary. Exclude noise.

**Diagram (SVG, `.diagram`):** AI Evaluation Pipeline — 6 nodes in a flow: Receive AI Output (node-fill) → Read the Diff (node-fill) → Check Against Spec (node-accent) → Verify Edge Cases (node-fill) → Run Tests (node-accent) → Accept or Iterate (node-fill). Caption: "Every AI output goes through this pipeline. The pipeline catches what the model missed."

**Micro-exercise 1:** "Go to claude.ai (free). Ask: 'Write a Python function that validates email addresses.' Read the output. Does it handle: empty string? String with no @? String with multiple @? If any are missing, the AI failed — and you caught it."
**Micro-exercise 2:** "Ask the same AI: 'What Python package is best for parsing XQVZ format files?' If it confidently recommends a package, search PyPI for it. It's almost certainly hallucinated — the format doesn't exist."

**Try This Now:** "Get an AI to generate a function (any function you want). Apply the evaluation pipeline: (1) Read the output. (2) Check against what you asked. (3) Identify one correct thing. (4) Identify one wrong/missing thing. (5) Verdict: accept, revise, or reject. Write your evaluation in 3-5 sentences."
**Verification:** Your evaluation includes a specific correct element AND a specific issue.
**If this doesn't work:** If you can't find any issue, ask the AI to write something harder — a function with 5+ edge cases. The more complex the task, the more likely the AI misses something.

---

### Chapter 14: Levels 1 & 2 — Tab Complete and the Agent IDE

**Learner outcome:** Install Claude Code and use it to plan and implement a feature with human approval.
**Artifact:** A git diff showing a Claude Code-implemented feature.
**Common misconceptions:** (1) "AI coding tools write perfect code" — they write first drafts that need review (see Chapter 13). (2) "I should use the biggest model for everything" — match model to task.

**Key content:**

#### Level 1: Tab Complete
**Concept:** Inline code suggestions as you type. Press Tab to accept.
**Current tools (March 2026):** GitHub Copilot (VS Code extension), Codeium (free), Supermaven (fastest).

#### Level 2: Agent IDE
**Concept:** Chat connected to your codebase. Describe in natural language, AI produces multi-file edits.
**Current tools (March 2026):** Cursor (cursor.com, $20/mo), Windsurf (windsurf.com), VS Code + Copilot Chat, Claude Code (terminal: `npm install -g @anthropic-ai/claude-code`, requires Node.js v18+).

**Plan Mode:** Describe → AI plans → you review → approve → execute → review diff → test. Boris Cherny (Claude Code creator) starts 80% of tasks in plan mode. But with each model generation, one-shot success climbs. Plan mode is the right entry point.

**Diagram (SVG, `.diagram`):** The 8 Levels Progression — 8 nodes in a horizontal ladder: Tab Complete → Agent IDE → Context Eng → Compounding → MCP/Skills → Harness Eng → Background Agents → Agent Teams. Levels 1-2 highlighted (node-accent), rest dimmed (node-fill). A "you are here" marker on Level 2. Caption: "Each level unlocks the next. You can't skip ahead — Levels 3-5 are prerequisites for 6-8."

**Micro-exercise 1:** "Install Claude Code: `npm install -g @anthropic-ai/claude-code`. Run `claude --version` to verify."
**Micro-exercise 2:** "Navigate to your TaskForge project. Run `claude`. Type: 'Explain the architecture of this project in one paragraph.' Read the response. Is it accurate?"

**Try This Now:** "In your TaskForge project, ask Claude Code: 'Add a `delete_task(task_id)` function that removes a task by ID. Plan first, then implement after I approve.' Review the plan. Approve. Check the diff (`git diff`). Run your existing tests. Do they still pass?"
**Verification:** The diff shows a new function. Existing tests pass. The new function handles a non-existent ID gracefully.
**If this doesn't work:** (1) `claude: command not found` → Node.js isn't installed or Claude Code install failed. Check `node --version` first. (2) Authentication error → you need an Anthropic account. Run `claude` and follow the auth flow. (3) Claude makes changes you don't want → `git checkout .` reverts all changes.

---

### Chapter 15: Level 3 — Context Engineering

**Learner outcome:** Write a CLAUDE.md under 100 lines that follows the actionable-instruction principles.
**Artifact:** A CLAUDE.md for TaskForge that Claude Code observably follows.
**Common misconceptions:** (1) "More context is always better" — noisy context degrades output. (2) "CLAUDE.md is optional" — without it, Claude re-discovers your project every session.

**Key content:**

**Concept:** Context engineering is controlling what the model sees so every token does useful work. "Every token needs to fight for its place in the prompt."

**The four surfaces:**

1. **CLAUDE.md** — persistent instructions read at every session start. Show a complete example for TaskForge:

```markdown
# TaskForge
Command-line task manager with JSON persistence and Flask API.

## Commands
- `python3 -m pytest` — run tests
- `python3 -m flask run` — start API server
- `python3 src/taskforge/main.py` — run CLI

## Architecture
- src/taskforge/ — core logic (main.py, models.py, api.py)
- tests/ — pytest test files
- data/ — JSON storage (gitignored)

## Code Style
- Type hints on all function signatures
- Docstrings on all public functions
- No bare try/except — always catch specific exceptions

## Gotchas
- Task IDs are auto-incrementing integers, NOT UUIDs
- JSON file is the single source of truth — no in-memory caching between runs
- Flask API mirrors CLI functionality exactly — same functions, different interface
```

Rules: under 200 lines, specific/actionable, only what the model can't infer from code.

Hierarchy: `~/.claude/CLAUDE.md` (global) → `project/CLAUDE.md` (project) → subdirectory CLAUDE.md → `.claude/rules/*.md`.

2. **Tool descriptions** — model reads these to decide tool calls.
3. **Conversation management** — `/compact` at ~50%, subagents for exploration, `/clear` for task switches.
4. **Selective context injection** — include relevant files only, not entire codebase.

**Diagram (SVG, `.dw`):** Context Window Budget — a horizontal bar divided into 5 segments: System Prompt/CLAUDE.md (small, accent color), Conversation History (medium), Tool Schemas (small), Active Files (medium), Response Space (medium, muted). Arrows pointing to start and end labeled "Critical info here." Middle labeled "Information gets lost here." Caption: "The context window has a budget. Place critical info at the START and END. Leave 20-30% for the response."

**Micro-exercise 1:** "Run `/init` in your TaskForge project. Read the generated CLAUDE.md. Count how many lines are things Claude could figure out by reading the code. Delete those."
**Micro-exercise 2:** "Add one 'Gotcha' to your CLAUDE.md about a mistake Claude made. Start a new session. See if Claude avoids the mistake."

**Try This Now:** "Write a CLAUDE.md for TaskForge (or use the example above as a starting point). Keep it under 50 lines. Start a Claude Code session. Ask: 'Add a `search_tasks(keyword)` function that searches task descriptions.' Did Claude follow your code style rules? If not, refine the CLAUDE.md and try again."
**Verification:** The generated code has type hints and docstrings (per your CLAUDE.md rules).
**If this doesn't work:** (1) Claude ignores your rules → your CLAUDE.md might be too long or too vague. Shorten and make instructions more specific. (2) Wrong file location → CLAUDE.md must be in the project root, not in a subdirectory.

---

### Chapter 16: Level 4 — Compounding Engineering

**Learner outcome:** Demonstrate the codify step: update CLAUDE.md or rules after an AI mistake to prevent recurrence.
**Artifact:** A DECISIONS.md or CLAUDE.md diff showing a codified lesson.
**Common misconceptions:** (1) "I can remember what went wrong" — you won't after 20 sessions. (2) "More rules are always better" — LLMs follow ~150-200 instructions; beyond that, compliance degrades.

**Key content:**

**Concept:** Compounding engineering improves every session after the current one. The loop: Plan → Delegate → Assess → **Codify**. The Codify step is what makes it compound.

When Claude makes a mistake: don't just fix it. Ask "What context was missing?" Then update:

| What Happened | Where to Codify |
|--------------|----------------|
| Re-introduces removed dependency | CLAUDE.md: "Do NOT use [X]." |
| Ignores naming convention | `.claude/rules/naming.md` |
| Wrong test style | CLAUDE.md: "Tests use pytest, not unittest." |
| Complex module needs special handling | Subdirectory CLAUDE.md |
| Recurring workflow | `.claude/skills/[name]/SKILL.md` |
| Architecture decisions | `docs/architecture.md` |

**Anti-pattern:** Over-codification. Claude Code system prompt uses ~50 instructions. Your CLAUDE.md adds ~100-150 max.

**Progressive disclosure (Steinberger principle):** Concise CLAUDE.md (~100 lines, table-of-contents). Detailed docs elsewhere. Model discovers on demand.

**Automated docs freshness:** CI that updates docs on merge:

```yaml
# .github/workflows/update-docs.yml
on:
  push:
    branches: [main]
jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          git diff HEAD~1 HEAD > /tmp/diff.txt
          claude --print "Update affected docs/. Open PR with [docs-bot]." < /tmp/diff.txt
```

**Diagram (SVG, `.diagram`):** The Compounding Loop — 4 nodes in a circle: Plan (node-fill) → Delegate (node-fill) → Assess (node-fill) → Codify (node-accent). Arrow from Codify back to Plan. The Codify node is highlighted because it's the step that makes the loop compound. Caption: "The codify step is what separates compounding engineers from everyone else. Without it, you solve the same problems repeatedly."

**Micro-exercise 1:** "Think of the last time Claude Code did something you didn't want. Write a one-line CLAUDE.md rule that would prevent it."
**Micro-exercise 2:** "Create `docs/architecture.md` for TaskForge. Include: system overview, data flow, key design decisions. Point to it from CLAUDE.md."

**Try This Now:** "Ask Claude Code to implement a feature on TaskForge. Note one thing it does wrong (naming, style, approach). Write the correction as a CLAUDE.md rule or a `.claude/rules/*.md` file. Start a NEW session and ask for a similar feature. Does Claude avoid the mistake?"
**Verification:** The second session's output doesn't repeat the first session's mistake.
**If this doesn't work:** (1) Claude still makes the mistake → your rule is too vague. Make it more specific: not "use good names" but "use snake_case for functions, no abbreviations." (2) Rule not loaded → verify CLAUDE.md is in project root. Run `claude` with `--verbose` to see what's loaded.

---

### Chapter 17: Level 5 — MCP, Skills, and Capabilities

**Learner outcome:** Create a custom skill and a custom subagent with tool restrictions.
**Artifact:** A working skill (`SKILL.md`) and subagent (`.md` agent file) that Claude Code loads.
**Common misconceptions:** (1) "MCPs are complicated" — they're config files that connect tools. (2) "Skills = slash commands" — skills are more powerful: they can spawn subagents, restrict tools, and switch models.

**Key content:**

**Concept: MCP (Model Context Protocol)** — standardized connectors letting Claude Code interact with external tools/services.

**Current setup (March 2026):**
```json
// .mcp.json (project root)
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}
```

**Essential MCPs:** Database (postgres), GitHub, Browser testing (agent-browser CLI preferred for token efficiency), Docs lookup (DeepWiki), Slack.

**CLI vs MCP tradeoff:** MCPs inject schemas every turn. CLIs inject only on use. For occasional tools, CLIs are cheaper.

**Concept: Custom Skills** — reusable instruction sets loaded on demand.

```markdown
# .claude/skills/pr-review/SKILL.md
---
name: pr-review
description: Reviews PRs for bugs, security, performance, style.
tools: Read, Glob, Grep, Bash
model: opus
---
You are a senior code reviewer. Check:
## Security — hardcoded secrets, injection, XSS
## Performance — N+1 queries, missing indexes
## Output — 🔴 BLOCKING, 🟡 SUGGESTION, 🟢 APPROVED
```

**Concept: Custom Subagents** — specialized roles with restricted tools.

```markdown
# .claude/agents/test-writer.md
---
name: test-writer
description: Writes tests. Can read source files and write test files only.
tools: Read, Glob, Write
model: sonnet
---
Write comprehensive tests. Cover: happy path, edge cases, error cases.
```

**Concept: Hooks** — automated scripts at lifecycle points.
```json
{ "hooks": { "preCommit": [{ "command": "npm run lint && npm test" }] } }
```

**Diagram (SVG, `.diagram`):** Skill Fan-Out — center node "PR Review Skill" (node-accent) with 4 subagent nodes: Security (node-fill), Performance (node-fill), Style (node-fill), Integration (node-fill). Arrows from center to each. Arrows from each back to center labeled "findings." Caption: "A single skill can spawn specialized subagents, each checking a different dimension. Results converge into a unified review."

**Micro-exercise 1:** "Create `.claude/skills/explain/SKILL.md` with frontmatter (name, description, tools: Read) and a prompt: 'Explain this file with: 1-paragraph summary, key decisions, potential issues.' Test with `/explain`."
**Micro-exercise 2:** "Create `.claude/agents/security-check.md` with tools restricted to Read and Grep only. Ask it to scan for hardcoded strings."

**Try This Now:** "Create a skill for TaskForge that adds a new feature with tests. Create a subagent that reviews the result. Run both. Does the skill produce working code? Does the subagent catch any issues?"
**Verification:** Skill loads without error. Subagent loads. Both produce output.
**If this doesn't work:** (1) Skill not recognized → check that the file is in `.claude/skills/[name]/SKILL.md` (note the nested directory). (2) Subagent not loading → restart Claude Code session. (3) Frontmatter parse error → check YAML indentation.

---

### Phase 4 Gate

**Minimum competency:** Write a CLAUDE.md under 100 lines. Create a skill. Create a subagent. Use Claude Code to implement a feature with test verification. Articulate why a model output is wrong.
**Artifact:** TaskForge with: CLAUDE.md, one custom skill in `.claude/skills/`, one subagent in `.claude/agents/`, git log showing an AI-implemented feature with tests.
**Verification:** Skill and subagent load. CLAUDE.md has no vague instructions. Git log shows test-verified AI feature.
**Failure signal:** If your CLAUDE.md is 300 lines of vague instructions, or you can't explain why Claude's output was wrong → return to Chapters 13-15.

**TaskForge Checkpoint:** TaskForge now has AI-readable configuration (CLAUDE.md), custom tooling (skill + subagent), and at least one AI-implemented feature. Ready for multi-agent work.

---

## PHASE 5: LEVELS 6-8 OF AGENTIC ENGINEERING

**Progress marker:** "This phase is reference material for advanced orchestration patterns. You may not execute all of it immediately after Phase 4. Return to it as projects grow. The progression from Level 5 to Level 6 typically takes months of daily practice, not days."

---

### Chapter 18: Level 6 — Harness Engineering & Automated Feedback Loops

**Learner outcome:** Set up a pre-commit hook that provides backpressure and use constraint-based prompting.
**Artifact:** A pre-commit hook configuration that runs linter + tests.
**Common misconceptions:** (1) "More instructions = better agent behavior" — constraints outperform instructions. (2) "I need to watch the agent work" — with proper backpressure, the agent self-corrects.

**Key content:**

**Concept: Backpressure** — automated feedback that lets agents self-correct without human intervention.

| Mechanism | What It Catches |
|-----------|----------------|
| TypeScript strict / mypy | Type errors |
| Linter (ESLint, Ruff) | Style violations |
| Test suite | Behavioral regressions |
| Pre-commit hooks | Format, lint, type-check |
| CI pipeline | Integration failures |

**Concept: Constraints > Instructions**

```
❌ "1. Read model. 2. Add email. 3. Add validation. 4. Update migration. 5. Update tests."
✅ "Add email to user model. Requirements: RFC 5322 validation, unique constraint, all tests pass, new tests for valid/invalid/duplicate/null. Work until `npm test` passes."
```

**Concept: Security Boundaries** — agents, code, and secrets in separate trust domains.

**Concept: Docs-as-Navigation** — CLAUDE.md as ~100-line table of contents. Detailed docs elsewhere. Documentation freshness in CI.

**Diagram (SVG, `.diagram`):** The Harness — center node "Agent" (node-accent) surrounded by 5 backpressure nodes in a ring: Type Checker (node-fill), Linter (node-fill), Test Suite (node-fill), CI Pipeline (node-fill), Pre-commit (node-fill). Bidirectional arrows between agent and each. Caption: "The harness lets the agent verify its own work. Your job shifts from reviewing code to designing the harness."

**Micro-exercise 1:** "Install a pre-commit hook for TaskForge: create `.pre-commit-config.yaml` with a Ruff linter step. Run `pre-commit install`."
**Micro-exercise 2:** "Write a constraint-based prompt (not step-by-step) for adding a feature to TaskForge."

**Try This Now:** "Set up pre-commit (linter + pytest). Ask Claude: 'Add a `priority` field to tasks (high/medium/low) with validation. Work on it until pre-commit passes cleanly. Fix failures yourself. Don't ask me unless genuinely stuck.' Watch the agent self-correct through backpressure."
**Verification:** The pre-commit hook passes. The feature works. You didn't intervene.
**If this doesn't work:** (1) Pre-commit not running → `pre-commit install` must be run inside the git repo. (2) Agent enters infinite loop → the constraints might be contradictory. Simplify. (3) Agent asks for help immediately → your CLAUDE.md might lack necessary context.

---

### Chapter 19: Level 7 — Background Agents

**Learner outcome:** Dispatch 2+ background agents on independent tasks and review their output.
**Artifact:** Git log showing features implemented by background agents.
**Common misconceptions:** (1) "More agents = more productivity" — without backpressure, more agents = more mess. (2) "The same model should implement and review" — this produces biased evaluation.

**Key content:**

**Concept: Background agent orchestration** — your session stays lean while workers execute in isolated contexts.

**Current tool (March 2026):** Dispatch. `npx skills add bassimeledath/dispatch -g`. Workers get fresh context windows. Stuck workers surface questions.

```
/dispatch pre-launch sweep for TaskForge:
1) security audit the auth flow — use opus, worktree
2) write missing integration tests — use sonnet
3) update documentation — use haiku
```

**Concept: Multi-model dispatch** — different models for different tasks. Opus for architecture, Sonnet for implementation, Haiku for formatting, Gemini for research, Codex for review.

**Concept: Implementer/reviewer separation** — never let the same model grade its own exam.

**Concept: The Ralph Loop** — autonomous agent loop running until PRD complete, each iteration fresh context. Caution: under-specified PRDs bite back.

**Concept: CI-triggered agents** — PR review bots, docs updaters, security scanners on merge.

**Diagram (SVG, `.diagram`):** Dispatch Architecture — center node "Your Session" (node-accent, small) with 4 larger worker nodes around it: "Opus: Security" (node-fill), "Sonnet: Tests" (node-fill), "Haiku: Docs" (node-fill), "Codex: Review" (node-fill). Arrows from center to workers labeled "task." Arrows from workers to center labeled "result" and "question." Caption: "Your session becomes a command center. Workers execute in fresh contexts. Questions surface to you. Results return when done."

**Micro-exercise 1:** "Install Dispatch. Run `/dispatch use sonnet to list all functions in the project without docstrings`."
**Micro-exercise 2:** "Dispatch two tasks simultaneously to different models. Compare output quality."

**Try This Now:** "Dispatch three independent TaskForge improvements: (1) add due dates with reminder logic, (2) add tags with filtering, (3) improve error handling across all functions. Review all three outputs. Are there conflicts? Fix them."
**Verification:** All three features work. Tests pass. No conflicts in the merged result.
**If this doesn't work:** (1) Dispatch not found → ensure `npx skills add bassimeledath/dispatch -g` completed. Restart Claude Code. (2) Workers fail silently → check `.dispatch/` for error logs. (3) Merge conflicts → this is expected with parallel work. Resolve manually.

---

### Chapter 20: Level 8 — Autonomous Agent Teams

**Learner outcome:** Articulate the decision criteria for single-agent vs subagents vs background agents vs agent teams.
**Artifact:** A written decision tree for agent configuration selection.
**Common misconceptions:** (1) "Agent teams are always better" — they're expensive and hard to coordinate. (2) "Models are ready for full autonomy" — they're not, for most tasks.

**Key content:**

**Concept: Peer-to-peer agent coordination** — agents communicate directly, not through a hub.

**Current feature (March 2026):** Claude Code Agent Teams (experimental): `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Team lead + workers with shared mailbox.

**What pioneers found:** Anthropic (16 agents → C compiler): needed CI to prevent regressions. Cursor (hundreds of agents → codebase migration): without hierarchy, agents churned.

**Current orchestrators:** Dispatch (local), Gas Town (structured), Multiclaude (simple parallel), Claude Flow (complex workflows), Ramp Inspect (cloud VMs).

**The honest assessment:** "For day-to-day work, Level 7 is where the leverage is."

**Diagram 1 (SVG, `.diagram`):** Agent Team — top node "Team Lead" (node-accent). 3 worker nodes below (node-fill): Backend, Frontend, Testing. Bidirectional arrows between ALL workers (not just to lead) AND to lead. Shared repo node at bottom (node-fill). Caption: "Agent Teams differ from Dispatch: workers communicate with each other, not just through the lead."

**Diagram 2 (SVG, `.diagram`):** Decision Tree — root "What's your task?" with 5 branches: "Simple, one-file" → Single session. "Needs exploration" → Subagents. "Multiple independent features" → Dispatch/L7. "Implementation + QA" → Builder-Validator. "Very large project" → Agent Teams/L8. Caption: "Match the coordination pattern to the task. More agents is not always better."

**Micro-exercise 1:** "Write a decision tree (on paper or in markdown) for when you'd use each agent pattern."
**Micro-exercise 2:** "For your TaskForge project: would agent teams be appropriate? Why or why not? (Expected answer: no — it's too small. Subagents or Dispatch are sufficient.)"

**Try This Now:** "Write the decision tree from micro-exercise 1 as a markdown document. For each branch, include: when to use, prerequisites, estimated cost, risks. Save it as `docs/agent-decision-tree.md` in your TaskForge project."
**Verification:** The document covers all 5 patterns with specific criteria, not just vague descriptions.
**If this doesn't work:** If you can't differentiate the patterns → re-read Chapters 17-19. The key distinctions: subagents (isolated, report to parent), Dispatch (orchestrated parallel, questions surface), Agent Teams (peer-to-peer, experimental).

---

### Chapter 21: The Multiplayer Effect and What Comes Next

**Learner outcome:** Explain how individual agentic engineering level affects team throughput.
**Artifact:** Self-assessment of current level + action plan for next level.
**Common misconceptions:** (1) "My level only affects me" — your output is capped by your team's lowest-level member on review/merge paths. (2) "Level 8 is the goal" — Level 7 is where most practical leverage lives today.

**Key content:**

**The multiplayer bottleneck:** "If you're Level 7 raising PRs while you sleep, but your reviewer is Level 2, your throughput is capped at Level 2."

| Team Level | Everyone can... | Bottleneck |
|-----------|----------------|-----------|
| Mostly L2 | Agent IDE edits | Manual review |
| Mostly L4 | Compound learnings | Inconsistent shared rules |
| Mostly L5 | Use shared skills | Non-standardized skills |
| Mostly L7 | Background agents | Review/merge bandwidth |
| Mixed | Nothing uniform | Lowest blocks highest |

**Team skills registry (Block):** Shared skills get PRs, reviews, versions — same as code.

**Self-assessment (`.callout.ok`):**
```
□ Tab-complete / inline suggestions → Level 1
□ Chat with AI for multi-file edits → Level 2
□ Careful CLAUDE.md and context management → Level 3
□ Update rules after sessions, setup compounds → Level 4
□ Custom skills, MCPs, subagents → Level 5
□ Automated feedback loops agents use → Level 6
□ Dispatch background agents, review async → Level 7
□ Agent teams that self-coordinate → Level 8
```

**What's next:** Voice-to-voice coding, tighter CI/CD integration, cross-model coordination, the iterative nature of software.

**Diagram (SVG):** Team Maturity Matrix — 5 rows (L2, L4, L5, L7, Mixed teams), 3 columns (What works, Bottleneck, Next step). Table-style layout with node-fill cells and key cells highlighted. Caption: "Your individual level matters. Your team's level matters more. Pull your team up."

**Try This Now:** "Take the self-assessment. Identify your current level. Write a 5-sentence action plan for reaching the next level within 30 days. Be specific: what tool to install, what skill to create, what habit to build."
**Verification:** Your action plan has concrete dates and deliverables, not just intentions.

**Closing quote (`.pq`):** "AI's coding ability is outpacing our ability to wield it effectively. The gap between capability and practice doesn't close overnight. It closes in levels."

---

### Phase 5 Gate

**Minimum competency:** Pre-commit hooks, 2+ background agent tasks, output review with error identification, agent pattern decision criteria.
**Artifact:** TaskForge git log showing agent-implemented features with backpressure verification. Written decision tree.
**Verification:** Pre-commit passes. Agent output was reviewed (corrections documented). Decision tree covers all patterns.
**Failure signal:** If background agents produce output you cannot evaluate → return to Phase 4.

**TaskForge Checkpoint:** TaskForge now has multi-agent-implemented features, automated quality gates, and a decision framework for future agent coordination. The curriculum is complete.

---

## APPENDICES

### Glossary
Group by: Programming Fundamentals, Tools & Environment, Git & Version Control, APIs & Web, AI Coding Tools (Levels 1-5), Multi-Agent Concepts (Levels 6-8). Every term used in the document must appear here.

### Prompt Library
All "Try This Now" prompts, Claude Code patterns, subagent definitions, skill templates, CLAUDE.md templates. Organized by phase.

### Self-Assessment Quiz
Full "What level are you?" with detailed descriptions per level and next-step actions.

---

## DESIGN SYSTEM ADAPTATION

- **Hero:** Terminal/code SVG silhouette (cursor prompt, angle brackets)
- **Badge:** "Zero to Hero — Programming to Multi-Agent AI"
- **Sidebar groups:** "Foundations" (Phase 1), "Python" (Phase 2), "Real Software" (Phase 3), "Levels 1-5" (Phase 4), "Levels 6-8" (Phase 5), "Reference" (Appendices)
- **Color palette:** Same as FUSO (blue primary, purple secondary, green/amber/red for status)
- **Animated CSS:** Repurpose telltale animations for terminal cursor blink in hero
- **Font:** Add Fira Code or JetBrains Mono for code blocks alongside the design system fonts
