# Claude Code Quick Start Site Build Instructions

> This file is the build specification for a third learning material in this repository.
>
> It is not the learner-facing guide itself.
>
> The output should be a standalone site that teaches a complete beginner how to get started with Claude Code from zero, including the terminal, Bash, Git, installation, first-run workflow, and a high-level orchestration map of how the larger Claude Code ecosystem fits together.

Verified research baseline: April 8, 2026.

---

## 1. Product Definition

Build a new static learning site named:

**Claude Code Quick Start**

Its job is different from `zero-to-hero-programming`:

- `zero-to-hero-programming` is a full curriculum
- `claude-code-quickstart` is a rapid onboarding site
- it must assume the reader has **zero** programming knowledge
- it must still be rigorous enough that the reader learns the real fundamentals instead of blindly copy-pasting commands

This site should answer:

- What is Claude Code?
- What is a terminal?
- What is Bash?
- What is Git?
- What do I need to install?
- How do I safely run Claude Code for the first time?
- How does Claude Code fit into the bigger AI coding and orchestration picture?

The end state is:

- the learner can install the prerequisites
- the learner can start Claude Code in the correct folder
- the learner understands the minimum Bash and Git needed to work safely
- the learner can complete a first Claude Code session on a throwaway practice project
- the learner has a high-level mental model of single-agent work, plan-first work, project memory, context, tools, MCP, and orchestration

Estimated learner completion time: **2–3 hours** in one sitting.

---

## 2. Audience

Target reader:

- intelligent
- curious
- comfortable using a computer
- no prior coding background
- no assumption of terminal knowledge
- no assumption of Git knowledge
- may not know what a file path is
- may not know the difference between a shell, terminal, folder, or repository

Tone:

- direct
- respectful
- non-condescending
- plain English first
- technically exact when needed

The material must never sound like it expects the reader to already know:

- CLI
- PATH
- Git repo
- branch
- shell
- Bash
- zsh
- PowerShell
- WSL
- `CLAUDE.md`
- MCP
- worktree

Every one of those terms must be introduced before use.

---

## 3. Core Design Goal

This site is not "prompt engineering tips."

It is also not a deep software engineering course.

It is a **step-by-step follow-along guide** that takes the learner from:

- "I have never used the terminal"
- to
- "I can safely use Claude Code on a small project and understand the bigger picture of where this fits"

**This is a follow-along guide, not a reference manual.** The learner should be doing every step in real time on their own machine as they read. Every chapter is a hands-on walkthrough.

Think of it as:

- practical — the learner is doing, not just reading
- beginner-safe — every action is explained before and verified after
- sequential — each step depends on the previous one
- super explicit — nothing is assumed, nothing is skipped
- mentally honest about what the learner does and does not understand yet

The site must be useful on day one, but it must not create fake confidence.

---

## 4. Current Research Facts That Must Be Treated As Source-of-Truth

These facts were verified against official docs on April 8, 2026 and must shape the build.

### Claude Code installation

- Anthropic's current docs recommend the **native installer**
- npm installation is now **deprecated**
- native installer requires **no dependencies**
- native installer **auto-updates**

### Current supported platforms

Anthropic's setup docs currently list support for:

- macOS 13.0+
- Windows 10 1809+ or Windows Server 2019+
- Ubuntu 20.04+
- Debian 10+
- Alpine Linux 3.19+
- 4 GB+ RAM
- internet connection required
- Bash, Zsh, PowerShell, or CMD

### Windows requirement

Anthropic's docs explicitly say:

- on Windows, **Git for Windows is required**

### Terminal guidance

Anthropic's docs explicitly provide:

- `/terminal-setup`
- `Ctrl + J` newline behavior
- `\` + Enter newline escape
- Shift+Enter guidance depending on terminal

### Project memory

Anthropic's docs explicitly support:

- `/init`
- `CLAUDE.md`
- project-level instructions
- user-level instructions

### Permissions

Anthropic's docs currently expose permission modes including:

- `default`
- `acceptEdits`
- `plan`
- `auto`
- `dontAsk`
- `bypassPermissions`

The beginner site must emphasize:

- `plan`
- `default`
- cautious use of `acceptEdits`
- avoidance of `bypassPermissions` for beginners

### Account access

The site must explain clearly that install success and account access are different things.

The docs currently indicate Claude Code can be used via:

- eligible Claude.ai paid plans
- Anthropic Console with funded billing
- supported enterprise/provider setups

Do not let the site imply:

- "If you can log into claude.ai free chat, you automatically have Claude Code access"

### Tool volatility rule

All volatile claims must be stamped with an absolute date.

Examples:

- installation method
- plan names
- supported platforms
- exact commands
- account access details

Whenever the site says "current" or "latest," it must also include an absolute date.

---

## 5. Product Scope

Build a standalone static site with:

- landing page
- 3 content pages
- 1 appendices page
- shared CSS (forked from existing design system)
- shared JS (forked from existing shared scripts)
- mobile support
- dark/light theme
- sidebar navigation that makes the whole material navigable in one pass

This should be lighter than `zero-to-hero-programming`, but still polished and intentionally designed.

The site must feel like a **visual sibling** to the existing learning materials — same family, different scope.

---

## 6. File Structure

Create and use this structure:

```text
claude-code-quickstart/
├── BUILD-INSTRUCTIONS.md
├── CLAUDE.md
├── docs/
│   ├── PROGRESS.md
│   ├── DECISIONS.md
│   ├── QA-CHECKLIST.md
│   └── SOURCE-LOG.md
├── index.html
├── part-1.html
├── part-2.html
├── part-3.html
├── appendices.html
├── css/
│   └── design-system.css
├── js/
│   ├── theme.js
│   ├── sidebar.js
│   └── shared.js
└── assets/
```

Rules:

- no framework
- no build step
- no React/Vue/Svelte
- HTML, CSS, and vanilla JS only
- the site must be openable directly in a browser like the other learning materials

---

## 7. Visual and Formatting Consistency with Existing Sites

This site must look and feel like a sibling of `zero-to-hero-programming` and the root hub. This section defines the exact conventions to follow.

### 7.1. Design System: Fork, Don't Reinvent

**Do not build the CSS from scratch.**

1. Copy `zero-to-hero-programming/css/design-system.css` into `claude-code-quickstart/css/design-system.css`
2. Remove CSS rules for components this site will not use (exercise engine, Pyodide loading, quiz, API demo, appendix tabs/subtabs, glossary search, troubleshooting accordion)
3. Keep every shared rule: theme variables, reset, sidebar, hamburger, theme toggle, hero, content-wrap, cards, tables, prompt-block/code/pre, callouts, diagrams, timeline, comparison grid, blockquote, footer, phase-nav, progress-bar, responsive breakpoints
4. If new component styles are needed, add them to the end of the file using the same naming conventions and variable references

The resulting CSS must share identical theme variables (colors, fonts, spacing) so both sites are visually indistinguishable in tone.

### 7.2. Font Stack

Use exactly:

```css
--serif: 'Instrument Serif', Georgia, serif;
--sans: 'DM Sans', -apple-system, sans-serif;
--mono: 'JetBrains Mono', monospace;
```

Load from the same Google Fonts import used in `zero-to-hero-programming`:

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 7.3. Theme Variables

Use identical dark/light variable values as `zero-to-hero-programming`. Both themes are already defined in the design system CSS. The five accent colors are:

| Variable | Purpose | Dark | Light |
|----------|---------|------|-------|
| `--accent` | Primary / links | `#4a90e2` | `#2a6bc9` |
| `--a2` | Secondary / purple | `#7c6dd8` | `#6550b0` |
| `--a3` | Success / green | `#2ebd80` | `#1a8c5e` |
| `--a4` | Warning / amber | `#e8943a` | `#c47a1a` |
| `--a5` | Danger / red | `#e05c7a` | `#b84060` |

### 7.4. Theme Toggle

Use the same sun/moon SVG toggle button as the existing sites. Position: fixed, top-right. Use the same `zth-theme` localStorage key so theme preference is shared across all sites in the repo.

Include the same FOWT-prevention inline script in `<head>`:

```html
<script>try{if(localStorage.getItem('zth-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}</script>
```

### 7.5. JS Patterns

Fork and adapt the existing JS files:

| File | Source | What to keep | What to remove |
|------|--------|--------------|----------------|
| `theme.js` | `zero-to-hero-programming/js/theme.js` | Theme toggle, zoom persistence | Nothing — use as-is |
| `sidebar.js` | `zero-to-hero-programming/js/sidebar.js` | Hamburger toggle, scroll persistence, active link tracking | Nothing — use as-is |
| `shared.js` | `zero-to-hero-programming/js/shared.js` | Copy buttons for `.prompt-block` elements | Nothing — use as-is |

All JS must follow the same pattern: vanilla IIFE (ES5), no build tools, `defer` attribute on script tags.

### 7.6. Sidebar Navigation

Use the same sidebar structure as `zero-to-hero-programming`:

- fixed left sidebar, `260px` wide
- hamburger toggle on mobile (`≤900px`)
- overlay backdrop when sidebar is open on mobile
- `.sidebar-logo` at the top linking to root hub (`/`)
- `.toc-group` containers with `.toc-group-title` headers
- `.toc-link` items with `.toc-num` spans for numbering
- active link highlighting via scroll-based IntersectionObserver
- scroll position persistence via localStorage

The sidebar must list all chapters across all parts so the learner can jump to any chapter from any page.

### 7.7. Page Structure Template

Every content page (`part-1.html`, `part-2.html`, `part-3.html`, `appendices.html`) must follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="[page-specific description]">
  <title>[Page Title] — Claude Code Quick Start</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link href="[Google Fonts URL]" rel="stylesheet">
  <link rel="stylesheet" href="/claude-code-quickstart/css/design-system.css">
  <script>try{if(localStorage.getItem('zth-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}</script>
</head>
<body>

<!-- SVG Arrow Defs (same as zero-to-hero) -->
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0">...</svg>

<button class="hamburger" id="hamburger">...</button>
<div class="sidebar-overlay" id="sidebar-overlay"></div>
<button class="toggle" id="themeToggle" aria-label="Toggle theme">...</button>

<!-- SIDEBAR — identical across all files -->
<aside class="sidebar" id="sidebar">
  <a href="/" class="sidebar-logo">...</a>
  <!-- toc-groups with toc-links for ALL chapters -->
</aside>

<div class="main">
  <!-- Content sections with id="chXX" and data-ch="XX" -->
  <section id="ch01" data-ch="01">
    <h2><span class="ch-label">Chapter 01</span> Title Here</h2>
    <!-- content -->
  </section>

  <!-- Phase navigation at bottom -->
  <nav class="phase-nav">
    <a href="..." class="phase-nav-link prev">...</a>
    <a href="..." class="phase-nav-link next">...</a>
  </nav>
</div>

<footer>
  <p>Claude Code Quick Start &middot; April 2026</p>
</footer>

<script src="/claude-code-quickstart/js/theme.js" defer></script>
<script src="/claude-code-quickstart/js/sidebar.js" defer></script>
<script src="/claude-code-quickstart/js/shared.js" defer></script>
</body>
</html>
```

### 7.8. Component Class Reference

Use these existing CSS classes consistently. Do not invent new class names when an existing one applies:

| Component | Class(es) | When to use |
|-----------|-----------|-------------|
| Code blocks | `.prompt-block` with `.label` and `.copy-btn` | Any copyable command or code snippet |
| Inline code | `<code>` | Terminal commands, file names, paths in running text |
| Pre blocks | `<pre><code>` | Multi-line code/output that doesn't need copy button |
| Callouts | `.callout` + `.warn` / `.critical` / `.info` / `.ok` | Warnings, errors, tips, success states |
| Callout title | `.callout-title` | Bold label inside callout |
| Diagrams | `.diagram` or `.dw` wrapping inline SVG | All diagrams |
| Diagram caption | `.diagram-caption` or `.dc` | Caption below diagram |
| Cards | `.card` | Grouped content blocks |
| Card grids | `.card-grid` | Side-by-side cards |
| Numbered steps | `.pr` with `.pn` + `.pb2` | Step-by-step instructions |
| Before/after | `.pe` with `.pb` / `.pg` sections | Comparing wrong vs right |
| Blockquotes | `.pq` with optional `.pqa` attribution | Pull quotes, key principles |
| Tables | Standard `<table>` | Comparison data, reference tables |
| Phase nav | `.phase-nav` with `.phase-nav-link .prev` / `.next` | Bottom-of-page navigation between parts |
| Section separators | `section[id^="ch"]::before` gradient line | Automatic between chapter sections |

### 7.9. Diagram Conventions

All diagrams must use inline SVG with design system CSS classes:

| SVG Class | Purpose |
|-----------|---------|
| `.node-fill` | Default node: `fill: var(--bg-card)`, `stroke: var(--border-accent)` |
| `.node-accent` | Highlighted node: `fill: var(--accent-glow)`, `stroke: var(--accent)` |
| `.label-text` | Primary label: `fill: var(--heading)`, 11px, weight 600 |
| `.sub-text` | Secondary label: `fill: var(--text-muted)`, 9px |
| `.arrow` | Connectors: `stroke: var(--accent)`, marker-end arrowhead |

Every diagram must have:

- a wrapping `.diagram` div
- a `.diagram-caption` or `.dc` below it
- `aria-label` on the SVG element
- one clear instructional takeaway (no decorative diagrams)

### 7.10. Error and Troubleshooting Formatting

When a command might fail, use this inline pattern:

```html
<div class="callout warn">
  <div class="callout-title">If you see: command not found</div>
  <p>Explanation and fix here.</p>
</div>
```

For collections of troubleshooting items in the appendix, use collapsible cards (the `.ts-card` pattern from `zero-to-hero-programming`). Include this CSS in the forked design system.

### 7.11. Asset Paths

All asset paths must be **absolute from the repo root**, prefixed with `/claude-code-quickstart/`:

```html
<link rel="stylesheet" href="/claude-code-quickstart/css/design-system.css">
<script src="/claude-code-quickstart/js/theme.js" defer></script>
```

The favicon uses the shared repo-root path:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```

This matches the pattern established in `zero-to-hero-programming` (see commit `9d42785` which fixed this exact issue).

### 7.12. Responsive Breakpoints

Follow the same breakpoints as the existing design system:

- `≤900px`: sidebar collapses, hamburger appears, `.main` loses left margin
- `≤700px`: typography shrinks, grids collapse to single column, padding reduces

### 7.13. Accessibility Standard

Target **WCAG 2.1 AA**:

- Text contrast: 4.5:1 minimum
- Large text contrast: 3:1 minimum
- All interactive elements must be keyboard navigable
- All images and diagrams must have descriptive `alt` text or `aria-label`
- Semantic HTML headings (h1 → h2 → h3, no skipping)
- Focus indicators on interactive elements

---

## 8. Navigation Requirements

The site has **5** learner-facing destinations:

1. `index.html` — Home / landing page
2. `part-1.html` — Part 1: Foundations and Setup (Chapters 1–4)
3. `part-2.html` — Part 2: First Project and Safe Workflow (Chapters 5–9)
4. `part-3.html` — Part 3: Big Picture and Orchestration (Chapters 10–12)
5. `appendices.html` — Appendices (A–D)

Chapter-to-page mapping:

| Page | Chapters | Section count |
|------|----------|---------------|
| `part-1.html` | 01–04 | 4 chapters |
| `part-2.html` | 05–09 | 5 chapters |
| `part-3.html` | 10–12 | 3 chapters |
| `appendices.html` | A–D | 4 appendices |

Navigation labels:

- Home
- Part 1: Foundations and Setup
- Part 2: First Project and Safe Workflow
- Part 3: Big Picture and Orchestration
- Appendices

The learner must always know:

- where they are
- what comes next
- whether they are still in beginner territory or higher-level reference territory

---

## 9. Curriculum Architecture

Use 3 parts.

This is the required structure.

## Part 1: Foundations and Setup

Purpose:

- remove fear
- define terms
- teach just enough terminal and Bash to function
- install the toolchain correctly

Required chapters:

### Chapter 1. What Claude Code Is

This is the only chapter that is mostly conceptual (not hands-on). The learner needs a mental model before they touch the terminal.

Must cover:

- what Claude Code is (an AI coding assistant that runs in your terminal and can read, write, and execute code on your computer)
- how it differs from plain web chat (it can see your files, run commands, and make changes — web chat cannot)
- what "runs in your terminal" means (explain this concretely — it's a program you type to, not a website you visit)
- what it can do (read code, write code, run commands, create files, use Git)
- what it cannot safely replace (your judgment, your understanding, your review)
- the idea of supervision (you approve or reject every action — you are the pilot, Claude is the copilot)

Must include:

- one diagram showing `you -> terminal -> Claude Code -> files / commands / git`
- one callout explicitly stating this is not magic and not a substitute for judgment
- a preview of what the rest of the guide will walk them through ("By the end of this guide, you will have...")

### Chapter 2. Terminal, Shell, Bash, Files, and Paths

**This is the first hands-on chapter.** The learner opens their terminal for the first time and types real commands.

Must start with:

- how to open the terminal on each OS (explicit instructions: "On macOS, press Cmd+Space, type Terminal, press Enter")
- what they are looking at when the terminal opens (explain the prompt, the cursor, and the blank screen)

Must define (one at a time, with examples, not as a glossary dump):

- terminal (the window you're looking at right now)
- shell (the program inside the terminal that reads your commands)
- Bash (one type of shell — the one this guide uses)
- zsh (another type of shell — macOS uses this by default, and it works the same for everything in this guide)
- PowerShell (Windows's built-in shell — different syntax, this guide notes differences)
- current working directory (the folder the terminal is "inside" right now)
- file (a single document on your computer)
- folder / directory (a container that holds files and other folders — "folder" and "directory" mean the same thing)
- path (the address of a file or folder, like `/Users/yourname/Documents`)
- home directory (your personal folder — where the terminal starts)
- `~` (a shortcut that means "my home directory")

Must walk the learner through typing each of these commands, one at a time, with the full 6-step treatment (Rule 1):

- `pwd` — "print working directory" — shows where you are
- `ls` — "list" — shows what's in the current folder
- `cd` — "change directory" — moves to a different folder
- `mkdir` — "make directory" — creates a new folder
- `clear` — clears the screen (nothing is deleted, just scrolled away)

Must include:

- a simple filesystem tree diagram showing folders nested inside folders
- expected output examples after every command
- explicit note: "If you make a typo, just press Enter and try again. You cannot break anything with these commands."

### Chapter 3. Install the Basics

**This is a fully guided install walkthrough.** The learner installs each tool one at a time, verifying each before moving to the next.

Structure this chapter as numbered steps using the `.pr` component. The learner must not move to the next step until the previous one is verified.

**Step 1: Confirm your terminal works**

- Verify the terminal from Chapter 2 is open
- Type `pwd` to confirm they get output

**Step 2: Install Git**

Must include separate OS-specific cards (visually separated, not interleaved):

- **macOS:** `xcode-select --install` (explain this installs Apple's developer tools, which includes Git)
- **Linux:** `sudo apt install git` (for Ubuntu/Debian) — explain what `sudo` means ("run as administrator")
- **Windows:** Download from git-scm.com — walk through the installer step by step, including which options to select

After install, verify:

```
git --version
```

Show expected output: `git version 2.x.x`

**Step 3: Configure Git identity**

Walk through each command with full explanation:

```
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global init.defaultBranch main
```

Explain: what `--global` means, why Git needs your name and email (it stamps every save point), what `init.defaultBranch` does.

Verify:

```
git config --list
```

Show what the output should include.

**Step 4: Install VS Code**

- Link to download page for each OS
- Walk through opening VS Code after install
- Explain what VS Code is (a text editor for code — like Word but for programming)

**Step 5: Set up the `code` command**

- **macOS:** Open VS Code → press Cmd+Shift+P → type "shell command" → select "Install 'code' command in PATH"
- **Windows/Linux:** Usually automatic — verify with `code --version`
- Explain what this does: "Now you can type `code .` in the terminal to open any folder in VS Code"

**Step 6: Install Claude Code**

- Use the native installer (current recommended method as of April 8, 2026)
- Show the exact install command
- Explicit note: npm install is deprecated as of April 8, 2026
- Verify with `claude --version`
- Show expected output

**Step 7: Verification checklist**

End with a `.checklist` component:

- [ ] `git --version` shows a version number
- [ ] `code --version` shows a version number
- [ ] `claude --version` shows a version number
- [ ] `git config user.name` shows your name

**Node.js is not required** for the native Claude Code installer. Do not include a Node.js install section. If a future chapter mentions a tool that requires Node (e.g., certain MCP servers), note it there with a one-line install pointer — not here.

Must also include:

- Windows WSL recommendation for learners who want to use Bash (with brief explanation of what WSL is)
- native Windows alternative for learners who prefer PowerShell

### Chapter 4. Login, Verification, and First Health Check

**The learner launches Claude Code for the first time in this chapter.**

Walk through each step:

**Step 1: Run the health check**

```
claude doctor
```

Explain what this does: "This command checks that everything Claude Code needs is set up correctly."

Show what healthy output looks like. Show what common errors look like with `.callout.warn` blocks for each.

**Step 2: Launch Claude Code**

```
claude
```

Explain: "This starts Claude Code. You'll see a new prompt — you're now talking to Claude, not your regular terminal."

Show exactly what the startup screen looks like (describe the prompt, the version info, the interface).

**Step 3: The login flow**

Walk through what happens on first launch:

- a browser window opens for authentication
- the learner logs in with their Anthropic/Claude account
- the terminal confirms login success

**Step 4: Understand the difference between install and access**

Must explicitly explain:

- installing Claude Code ≠ having access to use it
- Claude Code requires a paid Claude plan or funded Anthropic Console billing (as of April 8, 2026)
- if the learner can chat on claude.ai for free, that does **not** automatically mean they have Claude Code access
- show what the error looks like if they don't have access, and what to do

**Step 5: Exit Claude Code**

Show how to exit: type `/exit` or press Ctrl+C

Explain: "You're back in your normal terminal now. Claude Code is just a program — you can start and stop it whenever you want."

**Step 6: Verification checklist**

- [ ] `claude doctor` shows no errors
- [ ] `claude` launches successfully
- [ ] You can see the Claude Code prompt
- [ ] You can exit back to your normal terminal

Must also include:

- troubleshooting for `command not found` (PATH issues)
- note that Git for Windows is required on Windows

---

## Part 2: First Project and Safe Workflow

Purpose:

- get the learner to actually use Claude Code
- teach safe habits
- teach the minimum Git workflow around AI edits

Required chapters:

### Chapter 5. Git Basics for AI-Assisted Work

**The learner creates their first Git repository in this chapter.** This is not a full Git course — it teaches only the commands they need to work safely with Claude Code.

Walk through each concept and command hands-on:

**Step 1: Understand why Git matters for AI work**

Explain concretely: "Claude Code will edit your files. If something goes wrong, you need a way to undo it. Git saves snapshots of your work so you can always go back. Working with AI without Git is like editing a document without undo."

**Step 2: Create a practice folder and initialize Git**

```
mkdir git-practice
cd git-practice
git init
```

Walk through each command. For `git init`, explain: "This tells Git to start tracking this folder. Git creates a hidden folder called `.git` inside it — that's where it stores all the snapshots."

Show expected output: `Initialized empty Git repository in /Users/yourname/git-practice/.git/`

**Step 3: Create a file and check status**

```
echo "hello" > hello.txt
git status
```

Explain what `echo "hello" > hello.txt` does (creates a file called hello.txt containing the word "hello"). Explain what `>` means (sends output into a file).

Show the `git status` output and explain every line: what "untracked files" means, what the red filename means.

**Step 4: Stage and commit**

```
git add hello.txt
git status
git commit -m "Add hello file"
```

Explain what staging means (telling Git "include this file in the next snapshot"). Explain what `-m` means (message — a short description of what you did). Show the status output at each step.

**Step 5: Make a change and see the diff**

```
echo "world" >> hello.txt
git diff
```

Explain what `>>` means (append to file, unlike `>` which overwrites). Show and explain the diff output: what `+` lines mean, what the file path header means.

**Step 6: View history**

```
git add hello.txt
git commit -m "Add world to hello file"
git log --oneline
```

Show the log output. Explain: each line is a snapshot (commit) with a unique ID and your message.

Must include:

- a diagram showing working tree → staged changes → commit history
- the full 6-step treatment for every command
- a confidence check: "If you can create a file, stage it, commit it, and see it in `git log`, you're ready to use Git with Claude Code."

### Chapter 6. Create a Safe Playground Project

**The learner builds the project they will use with Claude Code.** Every step is explicit.

**Step 1: Create the project folder**

```
cd ~
mkdir my-first-project
cd my-first-project
```

Explain each command. Remind them: `~` means home directory (defined in Chapter 2). `cd` means change directory.

**Step 2: Initialize Git**

```
git init
```

Explain: "You learned this in Chapter 5. This folder is now a Git repository — Git is watching for changes."

**Step 3: Open in VS Code**

```
code .
```

Explain: "`code` is the VS Code command you set up in Chapter 3. The `.` means 'this folder' — the folder you're currently inside. So `code .` means 'open this folder in VS Code.'"

Show what VS Code should look like when it opens (empty sidebar, welcome tab or empty editor).

**Step 4: Create a starter file**

Walk through creating `index.html` in VS Code:

- "In VS Code, look at the left sidebar. You should see the folder name 'my-first-project'."
- "Right-click in the sidebar area and select 'New File'"
- "Type `index.html` and press Enter"
- "The file opens in the editor. Type this:" (provide minimal HTML)

Also show the terminal alternative:

```
echo '<!DOCTYPE html><html><body><h1>Hello</h1></body></html>' > index.html
```

**Step 5: Make an initial commit**

```
git add index.html
git commit -m "Initial project setup"
```

Explain: "This saves your starting point. Before Claude Code touches anything, you have a clean snapshot to go back to."

**Step 6: Verify everything is ready**

Verification checklist:

- [ ] You're inside `my-first-project` (`pwd` shows the right path)
- [ ] `git status` shows "nothing to commit, working tree clean"
- [ ] `code .` opens the project in VS Code
- [ ] You can see `index.html` in VS Code's sidebar

Must end with: "This is a practice project. Keep it for reference as you work through the rest of the guide, and delete it whenever you're comfortable."

### Chapter 7. First Claude Code Session

**This is the most important chapter in the guide.** The learner runs Claude Code on their practice project for the first time. Every interaction is scripted — the learner types exactly what the guide shows and sees exactly what the guide describes.

**Step 1: Navigate to your project**

```
cd ~/my-first-project
```

Verify: `pwd` should show `/Users/yourname/my-first-project` (or equivalent).

**Step 2: Start Claude Code in plan mode**

```
claude --permission-mode plan
```

Explain every part:

- `claude` — starts Claude Code
- `--permission-mode plan` — tells Claude it can only *suggest* changes, not make them directly. You stay in full control.
- "Plan mode is the safest way to start. Claude will tell you what it wants to do, and you decide whether to allow it."

Show what the Claude Code prompt looks like when it starts.

**Step 3: Ask for a plan (exact first prompt)**

Tell the learner to type this exact prompt:

```
Look at my index.html file. Suggest a plan to turn it into a simple personal homepage with a heading, a short paragraph about me, and some basic CSS styling. Don't make any changes yet — just describe what you would do.
```

Explain: "You're asking Claude to think before acting. This is the most important habit in AI-assisted coding."

Show what a good response looks like: Claude describes the changes it would make, lists the files it would modify, explains the approach.

**Step 4: Exit plan mode**

```
/exit
```

**Step 5: Start a normal session**

```
claude
```

Explain: "Now you're in default mode. Claude will ask for your permission before making changes."

**Step 6: Give the implementation prompt (exact second prompt)**

```
Update my index.html to be a simple personal homepage with a heading that says "Hello, World", a paragraph with placeholder text about me, and basic CSS styling inline in a <style> tag. Keep it simple — just HTML and CSS, no JavaScript.
```

**Step 7: Review what Claude proposes**

Explain what happens:

- Claude will show you the changes it wants to make
- It will ask for your permission before writing to files
- Walk through what the permission prompt looks like
- Explain each option (approve, reject, etc.)

Show what a good proposal looks like vs what a suspicious one looks like:

**Good behavior:**
- Claude explains what it's about to do
- Changes are limited to the file you mentioned
- The code makes sense even if you don't understand every line

**Suspicious behavior:**
- Claude wants to install packages or run shell commands you didn't ask for
- Claude wants to modify files you didn't mention
- Claude creates an overly complex structure when you asked for something simple

**Step 8: Approve the change and verify**

- Approve the file edit
- Open `index.html` in your browser (explain: "Find the file in Finder/Explorer and double-click it, or type `open index.html` in the terminal on macOS")
- Show what the page should look like

**Step 9: Exit Claude Code**

```
/exit
```

The implementation target is a tiny HTML/CSS page because:

- no extra runtime needed
- visible result the learner can see in their browser
- easy to understand even with zero coding knowledge

### Chapter 8. Review, Approve, Commit, Recover

**The learner reviews what Claude changed, saves a checkpoint, and learns the safety net.**

**Step 1: See what changed**

```
git diff
```

Walk through the diff output line by line:

- what the `---` and `+++` lines mean (old version vs new version)
- what red lines with `-` mean (removed)
- what green lines with `+` mean (added)
- "Even if you don't understand the code yet, you can see *what changed*. This is your safety net."

**Step 2: Check the overall status**

```
git status
```

Show and explain the output: which files were modified, what "modified" means.

**Step 3: Save a checkpoint (commit)**

```
git add index.html
git commit -m "Add personal homepage with CSS styling"
```

Explain: "You just saved a snapshot of the working version. If anything goes wrong later, you can always come back to this point."

**Step 4: View your history**

```
git log --oneline
```

Show expected output: two commits now visible. Explain: "Each line is a save point. Your project's history is building up."

**Step 5: Understand the safety net**

Explain the recovery concept in beginner terms:

- "If Claude makes a change you don't like, and you haven't committed it yet, you can see exactly what changed with `git diff`"
- "If you have committed it, you still have every previous commit in your history"
- "For now, the safest strategy is: commit often, review diffs, and work in your practice project"

Do not teach:

- `git reset --hard`
- `git checkout .`
- any destructive recovery command

Instead frame safety as:

- inspect first (always `git diff` before committing)
- commit often (every time something works)
- work in a practice repo (nothing important can break)

**Step 6: Confidence check**

- [ ] You can read a `git diff` and identify what lines were added or removed
- [ ] You have at least 2 commits in your `git log`
- [ ] You understand that committing = saving a restore point

### Chapter 9. Project Memory and `CLAUDE.md`

**The learner creates a `CLAUDE.md` file for their practice project.**

**Step 1: Understand the problem**

Explain: "Every time you start Claude Code, it starts fresh — it doesn't remember what you told it in the last session. `CLAUDE.md` is a file you put in your project folder that Claude reads automatically when it starts. It's like a sticky note that says 'here's what you need to know about this project.'"

**Step 2: Create a `CLAUDE.md` using `/init`**

```
cd ~/my-first-project
claude
```

Then inside Claude Code:

```
/init
```

Explain what `/init` does: "Claude looks at your project and creates a `CLAUDE.md` file with some basic information. You can edit it later."

Show what the generated file might look like.

**Step 3: Exit and read the file**

```
/exit
```

Then:

```
cat CLAUDE.md
```

Explain what `cat` does: "It prints the contents of a file in your terminal. `cat` stands for 'concatenate' — for now, just think of it as 'show me this file.'"

Walk through what each section means.

**Step 4: Edit it to add your own instructions**

Show a short starter `CLAUDE.md` the learner can use or adapt:

```markdown
# My First Project

## About
This is a practice personal homepage.

## Rules
- Keep changes simple
- Explain what you're doing before making changes
- Only edit files I mention
- Use plain HTML and CSS, no JavaScript unless I ask
```

Show how to edit: "Open `CLAUDE.md` in VS Code (it should already be visible in the sidebar) and replace the contents with the above."

**Step 5: Commit the `CLAUDE.md`**

```
git add CLAUDE.md
git commit -m "Add project instructions for Claude"
```

**Step 6: Understand the difference between project and user memory**

Explain:

- **Project memory** (`CLAUDE.md` in your project folder): instructions for this specific project, shared with anyone who works on it
- **User memory** (`~/.claude/` settings): your personal preferences that apply to all projects

"For now, just use project memory. User memory is something you'll explore later."

Must include a warning: "Keep your `CLAUDE.md` short and focused. A 200-line rule dump is harder for Claude to follow than 5 clear rules."

---

## Part 3: Big Picture and Orchestration

Purpose:

- give the learner a map of where Claude Code fits in the larger ecosystem
- do not dump advanced implementation complexity on them
- show what comes next without pretending they are ready for all of it immediately

**Maximum 5 new technical terms per section** within this part. The learner just learned what a terminal is — pace the vocabulary accordingly.

Required chapters:

### Chapter 10. How Claude Code Works at a High Level

This chapter shifts from hands-on to conceptual. The learner has now used Claude Code successfully and needs a mental model of what was happening behind the scenes.

Must cover (with concrete examples from what they just did):

- the loop: you type a prompt → Claude reads your files → Claude analyzes → Claude proposes edits or commands → you review → you approve or reject → repeat
- context: "Claude can see your project files, your terminal, and your `CLAUDE.md`. This is its context — the information it has to work with."
- project files: "Claude reads your code to understand what exists before suggesting changes."
- `CLAUDE.md`: "The instructions file you created in Chapter 9 — Claude reads this first."
- tools: "Claude can read files, write files, and run terminal commands. These are its tools."
- permissions: "You control which tools Claude can use. In plan mode, it can only suggest. In default mode, it asks before acting."

Must include:

- one workflow loop diagram showing the cycle the learner just experienced
- callout: "Now you know the loop. Every Claude Code session — from a beginner fixing a homepage to an expert orchestrating agents — follows this same basic cycle."

### Chapter 11. The Higher-Level Claude Code Stack

This is the required orchestration chapter.

Must introduce, at a high level, grouped into tiers:

**Tier 1 — "Start using soon" (next few sessions):**

- single-session coding
- plan-first workflow
- iterative editing
- Git checkpoints

**Tier 2 — "Learn when ready" (after you're comfortable with Tier 1):**

- branching (define "branch" in 2 sentences before proceeding — this concept has not been introduced yet)
- worktrees (requires understanding of branches)
- subagents / background agents
- MCP

**Tier 3 — "Advanced orchestration" (months of experience):**

- skills / plugins
- harnesses / guardrails
- Docker / isolated environments

The learner does **not** need to execute these yet.

The goal is:

- mental map
- vocabulary
- what each layer is for
- when complexity increases

This chapter must explicitly say:

- "You are not expected to use all of this on day one."

Must include:

- a ladder diagram from beginner use to advanced orchestration
- a table: concept / what it does / when you'd need it
- a section called "What is for now vs what is for later"

### Chapter 12. What to Learn Next

This is the final chapter. Congratulate the learner and give them a concrete next-step plan.

Must guide the learner toward (in order of priority):

1. **Practice:** use Claude Code on 2–3 more small projects to build confidence
2. **Learn Python or JavaScript basics** — pick one, get comfortable reading and writing simple code
3. **Learn Git branching** — you know commits, now learn branches
4. **Go deeper:** `zero-to-hero-programming` for full programming fundamentals
5. **Testing and debugging** — how to verify code works
6. **Deployment** — how to put your project on the internet
7. **Advanced Claude Code features** — the orchestration concepts from Chapter 11, when you're ready

This chapter should end with:

- a realistic next-step plan formatted as a numbered list the learner can follow
- a link to `zero-to-hero-programming`
- a closing message: "You are no longer a complete beginner. You have a terminal, Git, a code editor, and Claude Code. You know how to supervise AI-generated code. Everything from here is building on what you've already done."

---

## 10. Appendices

Build these appendices:

### Appendix A. Command Cheat Sheet

Group commands by purpose:

- navigation
- file creation
- Git basics
- Claude Code basics

### Appendix B. Troubleshooting

Must include:

- `claude: command not found`
- `git: command not found`
- `code: command not found`
- PowerShell `&&` confusion
- WSL install confusion
- account access vs install confusion
- Git identity missing
- launched Claude in wrong folder
- long paste problems
- deprecated npm install migration

Use the collapsible `.ts-card` pattern from `zero-to-hero-programming` for each troubleshooting item.

### Appendix C. Install Matrix

A clean table for:

- macOS
- Linux
- Windows native
- Windows WSL

Columns:

- terminal
- Git
- VS Code
- Claude Code install command
- special notes

### Appendix D. Beginner Prompt Starter Pack

Include copy-paste prompts such as:

- explain this folder
- propose a plan before editing
- explain this command before running it
- keep changes small
- describe this diff in beginner language

Also include a short **"Prompts to avoid"** section with anti-patterns:

- "rewrite everything"
- "make it production-ready"
- "do whatever you think is best"
- "fix all the problems"

Explain briefly why each is dangerous for beginners (loss of control, scope explosion, skips supervision).

---

## 11. Pedagogy Rules

These are mandatory.

### Rule 1. This is a follow-along guide — write it like one

Every chapter must read as a hands-on walkthrough. The learner is sitting at their computer doing each step as they read. Write in the present tense, addressing the learner directly.

**Pattern for every action the learner takes:**

1. **Say what they are about to do and why** (1–2 sentences)
2. **Show the exact command or action** (in a `.prompt-block`)
3. **Explain every part of it** (what each word/symbol means)
4. **Show what they should see** (expected output in a `<pre>` block or plain description)
5. **Confirm success** ("If you see X, it worked.")
6. **Troubleshoot failure** (`.callout.warn` if it might go wrong)

This 6-step pattern is the backbone of the guide. Use it for every terminal command, every install step, every Git operation, and every Claude Code interaction.

Example of the correct level of explicitness:

```
Now create a new folder called "practice" inside your home directory.

  mkdir practice

Let's break this down:
- `mkdir` stands for "make directory" — it creates a new folder
- `practice` is the name you're giving the folder

You won't see any output. That's normal — most terminal commands stay silent when they succeed.

To verify it worked, list the contents of your current directory:

  ls

You should see `practice` in the list.
```

Do **not** write like this:

```
Create a folder:

  mkdir practice

Then cd into it.
```

That is too compressed. The learner does not yet know what `mkdir` means, what a directory is, or why there's no output.

### Rule 2. No unexplained jumps

If a command uses a symbol like `.`, `~`, `/`, `-m`, `--`, or any flag, explain it the first time it appears. Do not assume the learner will figure it out from context.

### Rule 3. Every command needs the full treatment

For every command the learner types, provide all of:

1. the exact command to type (in a copyable `.prompt-block`)
2. what each part means in plain English
3. what the learner should expect to see (exact output or "no output means success")

No exceptions for "simple" commands. The learner does not know which commands are simple.

### Rule 4. Always teach the safe path first

For example:

- plan mode before implementation
- throwaway repo before real repo
- Git before AI edits

### Rule 5. Avoid fake simplicity

Do not say things like:

- "Just run this"
- "Simply install this"
- "Go ahead and..."
- "Now just..."

without also explaining:

- what it is
- why it exists
- how to verify success

The word "just" implies the step is trivial. For a beginner, no step is trivial.

### Rule 6. Differentiate "required now" vs "later"

This is crucial for orchestration content. Use the tiered structure defined in Chapter 11.

### Rule 7. Use beginner language without dumbing down facts

Acceptable:

- "A repository is a project folder with memory."

Then refine it:

- "More precisely, it is a folder Git is tracking."

### Rule 8. Every chapter must end with a confidence check

Examples:

- "If you can do X, you are ready for Y."
- "If this still feels unclear, reread the command examples before moving on."

These must reference **specific things the learner did** in that chapter, not vague feelings.

### Rule 9. Cap new vocabulary

Maximum **5 new technical terms per chapter**. If a chapter needs more, split the concepts across sections with breathing room between them. The existing `zero-to-hero-programming` uses this same cap.

### Rule 10. Number every step in sequential workflows

When the learner is following a multi-step process (install flow, project setup, first session), use **numbered steps** with the `.pr` component. This makes it impossible to lose their place.

Do not use unnumbered prose for sequences of actions. If the learner needs to do step A before step B, number them.

### Rule 11. Show, don't tell, for expected output

Whenever a command produces visible output, show the actual output (or a representative example) in a `<pre>` block. Label it clearly as "What you should see" or "Expected output."

When a command produces no output, explicitly say: "This command produces no output. That's normal — it means it worked."

### Rule 12. OS-specific instructions must be visually separated

When macOS, Linux, and Windows instructions differ, use clearly labeled sections or cards for each OS. Do not interleave them in running text. The learner must be able to find their OS and follow only those instructions without reading the others.

Use the `.card-grid` with labeled `.card` elements, or a tabbed approach if you add that component.

---

## 12. Technical Build Rules

### HTML

- semantic structure
- accessible headings (h1 → h2 → h3, never skip levels)
- keyboard-navigable UI
- tables only where tables are actually useful
- meta description on every page
- `lang="en"` on `<html>`

### CSS

- single design system file (forked from existing, per section 7.1)
- CSS custom properties (identical variable names)
- strong typography (identical font stack)
- responsive at mobile and desktop widths (same breakpoints)

### JS

- theme toggle (same `zth-theme` key)
- sidebar behavior (same hamburger/scroll/active patterns)
- copy buttons on `.prompt-block` elements
- no framework
- no build tooling
- all scripts loaded with `defer`

### Assets

- diagrams should be inline SVG where practical
- diagrams must teach, not decorate
- SVGs must use design system CSS classes (see section 7.9)

---

## 13. Required Diagrams

Include at least these diagrams:

1. `You -> Terminal -> Claude Code -> Files / Commands / Git`
2. filesystem path tree and current working directory marker
3. Git state flow: working tree -> staged -> commit
4. beginner-safe Claude workflow loop
5. orchestration ladder from single session to advanced team workflows

All diagrams must have:

- `.diagram` wrapper div
- `.diagram-caption` below
- `aria-label` on the SVG
- one instructional takeaway

---

## 14. Required Interaction Patterns

This site does not need a full interactive exercise engine like `zero-to-hero-programming`, but it should still have lightweight interaction.

Required:

- collapsible troubleshooting cards (`.ts-card` pattern)
- checklists for install verification (`.checklist` pattern with checkboxes)
- copy-ready command blocks (`.prompt-block` with auto-injected `.copy-btn`)
- callouts for warnings, info, and inline errors (`.callout` variants)

Optional:

- quizzes
- command flashcards

---

## 15. Landing Page Requirements

The landing page must make the promise explicit:

- zero to first safe Claude Code session
- install guide
- terminal and Git foundations included
- orchestration map included
- estimated time: 2–3 hours

Suggested hero proposition:

**A step-by-step follow-along guide: from zero terminal knowledge to your first safe Claude Code session in one sitting.**

The landing page should clearly separate:

- what you will do today (follow along and build a real project)
- what this site does not try to teach fully (deep programming, advanced orchestration)
- how it connects to the larger `zero-to-hero-programming` curriculum
- a note: "This is a follow-along guide. You'll need a computer open next to you. Every step is something you do, not just something you read."

Use the same hero/landing page structure as `zero-to-hero-programming/index.html`:

- hero section with badge, h1, subtitle, meta stats
- part cards (similar to phase cards) linking to each part
- `.phase-card` styling adapted for 3 parts + appendices

---

## 16. Relationship to Existing Materials

The site must position itself as:

- a quick-start on-ramp
- a beginner bootstrap layer
- not a replacement for the full programming curriculum

It should cross-link to:

- `zero-to-hero-programming/index.html` (from Chapter 12 and landing page)

And `zero-to-hero-programming` should cross-link back:

- add a callout or link on the zero-to-hero landing page pointing beginners to this quickstart as a "start here if you're brand new" entry point

---

## 17. Hub Integration Requirements

After the learner-facing site exists, update the root hub `index.html` to add it as the third learning material.

Do not link the hub to this internal build spec.

The new card should use the same `.guide-card` structure as the existing cards:

```html
<a href="claude-code-quickstart/index.html" class="guide-card">
  <div class="guide-icon">&#9654;</div>
  <h2>Claude Code Quick Start</h2>
  <p>From zero terminal knowledge to your first safe Claude Code session. Includes Bash, Git, installation, and a high-level orchestration map.</p>
  <div class="guide-meta">12 chapters &middot; 3 parts &middot; ~2–3 hours</div>
</a>
```

After adding the third card, update the `.guides` grid in the hub CSS. With 3 cards, consider either:

- a 3-column grid on desktop (`grid-template-columns: repeat(3, 1fr)`)
- or keeping 2 columns with the third card spanning full width or placed in a new row

Choose whichever looks better and log the decision in `docs/DECISIONS.md`.

---

## 18. Deployment and Path Strategy

This site will deploy alongside the existing sites on Vercel.

Rules:

- all internal asset references must use **absolute paths** prefixed with `/claude-code-quickstart/`
- cross-site links must also use absolute paths (e.g., `/zero-to-hero-programming/index.html`)
- the shared favicon lives at `/favicon.svg` (repo root)
- do not use relative paths for CSS, JS, or cross-page links — this prevents breakage on Vercel's routing

This convention matches what `zero-to-hero-programming` already does (fixed in commit `9d42785`).

---

## 19. Source Rules

When building the actual site, use:

- official Anthropic docs as the source of truth for Claude Code
- official Git docs for Git install/setup
- official VS Code docs for editor install and `code` CLI behavior
- official Microsoft docs for WSL

If community sources are used at all:

- only use them for secondary workflow advice
- never for volatile install facts when official docs exist

Create `docs/SOURCE-LOG.md` and record:

- source URL
- what it was used to verify
- date checked

Before building, verify that all source URLs in section 24 still resolve. If any return 404, note this in `docs/DECISIONS.md` and find the current equivalent.

---

## 20. QA Checklist

Create `docs/QA-CHECKLIST.md` and validate:

### Content QA

- [ ] Assumes zero prior coding knowledge
- [ ] Defines terminal, shell, Bash, Git, repo, path, branch, and `CLAUDE.md` before first use
- [ ] Uses the native installer as the recommended Claude Code path
- [ ] Explicitly marks npm installation as deprecated
- [ ] Includes Windows WSL guidance
- [ ] Includes Git for Windows requirement
- [ ] Includes plan mode as the safe first workflow
- [ ] Includes a first practice project
- [ ] Includes Git diff and commit flow
- [ ] Includes high-level orchestration chapter
- [ ] Clearly distinguishes "now" vs "later" with tiered structure
- [ ] Maximum 5 new terms per chapter
- [ ] Every chapter ends with a confidence check
- [ ] Practice project cleanup guidance included

### Visual Consistency QA

- [ ] Font stack matches `zero-to-hero-programming` exactly
- [ ] Theme variables (dark + light) are identical
- [ ] Theme toggle uses same sun/moon SVG and `zth-theme` key
- [ ] Sidebar structure matches (logo, toc-groups, toc-links, hamburger)
- [ ] Component classes match reference table in section 7.8
- [ ] Diagram SVGs use design system CSS classes
- [ ] Callout/warning patterns match existing site
- [ ] Code blocks use `.prompt-block` with copy button
- [ ] Phase navigation at bottom of each part matches `.phase-nav` pattern
- [ ] Favicon is `/favicon.svg`
- [ ] Asset paths are all absolute

### UX QA

- [ ] Works on mobile (≤700px)
- [ ] Works on tablet (≤900px)
- [ ] Works on desktop
- [ ] Navigation is consistent across all pages
- [ ] Sidebar lists all chapters on every page
- [ ] Copy blocks are readable and functional
- [ ] Tables do not overflow badly on small screens
- [ ] Theme toggle works and persists
- [ ] Hub page updated with third card

### Accuracy QA

- [ ] All volatile Claude Code facts stamped with absolute date
- [ ] Install commands verified against official docs
- [ ] Platform support verified
- [ ] Account access wording does not overclaim
- [ ] Source URLs verified as live

### Accessibility QA

- [ ] WCAG 2.1 AA text contrast (4.5:1)
- [ ] WCAG 2.1 AA large text contrast (3:1)
- [ ] All diagrams have `aria-label`
- [ ] All interactive elements keyboard navigable
- [ ] Heading hierarchy is sequential (no skipped levels)

---

## 21. Build Order

Use this build sequence:

1. Create scaffold and tracker docs (`CLAUDE.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/QA-CHECKLIST.md`, `docs/SOURCE-LOG.md`)
2. Fork design system CSS from `zero-to-hero-programming` and trim unused components
3. Fork JS files (`theme.js`, `sidebar.js`, `shared.js`)
4. Build sidebar HTML (shared across all pages)
5. Build `index.html` (landing page)
6. Build `part-1.html` (Chapters 1–4)
7. Build `part-2.html` (Chapters 5–9)
8. Build `part-3.html` (Chapters 10–12)
9. Build `appendices.html` (A–D)
10. Run full QA pass (section 20)
11. Add cross-link from `zero-to-hero-programming` landing page back to quickstart
12. Add third card to root hub `index.html`

---

## 22. Suggested `CLAUDE.md` for the New Site Project

When building the site itself, create a project `CLAUDE.md` that says roughly:

- preserve zero-knowledge pedagogy
- define every technical term before use
- prefer plan-first workflows in examples
- always explain what commands do and how to verify success
- do not recommend dangerous Git recovery commands to beginners
- official docs outrank community sources for volatile Claude Code facts
- use absolute dates for tool-specific claims
- maximum 5 new technical terms per chapter
- all CSS must live in `css/design-system.css` — no inline styles except inside SVG diagrams
- all JS follows vanilla IIFE (ES5) pattern — no build tools
- all asset paths must be absolute from repo root, prefixed with `/claude-code-quickstart/`
- the sidebar must be identical across all pages
- visual style must match `zero-to-hero-programming` (same fonts, colors, components)

---

## 23. Deliverable Standard

The final built site should feel like:

- a guided walkthrough you do with your computer open
- a patient instructor who never skips a step
- a beginner-friendly systems guide that builds real skills
- a practical first-session playbook with exact commands to type
- a map into the wider Claude Code universe
- a **visual sibling** of `zero-to-hero-programming`

It should not feel like:

- a marketing page
- a blog post
- a generic "AI coding tips" article
- a half-technical README
- a visually unrelated microsite
- a reference manual you look things up in (it's a follow-along guide, not a dictionary)

---

## 24. Source URLs to Use

Verify all URLs resolve before building. Log results in `docs/SOURCE-LOG.md`.

Claude Code:

- https://docs.anthropic.com/en/docs/claude-code/quickstart
- https://docs.anthropic.com/en/docs/claude-code/setup
- https://docs.anthropic.com/en/docs/claude-code/memory
- https://docs.anthropic.com/en/docs/claude-code/slash-commands
- https://docs.anthropic.com/en/docs/claude-code/settings
- https://docs.anthropic.com/en/docs/claude-code/terminal-config
- https://docs.anthropic.com/en/docs/claude-code/ide-integrations

Supporting sources:

- https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
- https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup
- https://code.visualstudio.com/Download
- https://code.visualstudio.com/docs/configure/command-line
- https://code.visualstudio.com/docs/setup/mac
- https://learn.microsoft.com/en-us/windows/wsl/install

---

## 25. Final Instruction

Build the learner-facing site from this specification.

**This is a follow-along guide.** Every chapter (except Chapter 1 and the Part 3 conceptual chapters) must be structured as a sequence of numbered steps the learner performs on their own computer. No step should be left implicit. No command should appear without the full 6-step treatment defined in Rule 1.

Do not collapse the beginner fundamentals.

Do not skip Bash and Git.

Do not skip the orchestration overview.

Do not teach advanced complexity before the learner has a safe first-run path.

Do not deviate from the visual conventions defined in section 7 — the site must look like it belongs in the same family.

Do not write in a style where the learner reads passively. Write so the learner is actively doing something in every section.

The order matters:

- fundamentals
- setup
- first safe workflow
- memory and review
- high-level orchestration map

When in doubt about whether something is explicit enough, make it more explicit. The cost of over-explaining is a slightly longer page. The cost of under-explaining is a confused beginner who gives up.
