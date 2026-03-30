# Evaluation Framework: Zero-to-Hero AI Programming Courses (Claude Code Focus)

## How to Use This Document

For each section below, evaluate the repository on a **1–5 scale** (1 = missing/broken, 5 = excellent). Record your score, a brief justification, and any blockers. At the end, compute a weighted total to get a final verdict.

---

## 1. Onboarding & Environment Setup (Weight: 15%)

The first 15 minutes determine whether someone finishes the course or bounces. Evaluate:

**1a. Prerequisites clarity**
- Does it explicitly state what the learner needs before starting? (OS, Node.js version, terminal basics, text editor, Anthropic account/API key or Claude Max subscription)
- Does it distinguish between "nice to have" and "required"?
- Does it acknowledge that the target audience may have *zero* programming experience and calibrate accordingly?

**1b. Installation walkthrough**
- Are Claude Code installation steps provided for macOS, Linux, and Windows/WSL?
- Does it walk through `npm install -g @anthropic-ai/claude-code` (or current equivalent) with expected terminal output shown?
- Does it handle common failure modes? (Node not installed, permissions errors, npm proxy issues, PATH not configured)

**1c. First successful interaction**
- Within the first lesson, does the learner *actually run* Claude Code and get a working result?
- Is there a "hello world" equivalent — a trivial but satisfying task that proves the toolchain works? (e.g., "Ask Claude Code to create a file that prints hello world, then run it")
- Is the dopamine hit front-loaded? The learner should feel agency within 10 minutes of setup.

**1d. Troubleshooting section**
- Is there a dedicated troubleshooting page or FAQ for setup issues?
- Does it cover: authentication failures, rate limits, network/proxy issues, version mismatches?

**Score: ___ / 5**
**Notes:**

---

## 2. Curriculum Architecture (Weight: 20%)

This is the structural backbone. A zero-to-hero course must have a coherent progression, not just a pile of tutorials.

**2a. Learning arc**
- Is there a clear progression from "what is a terminal" through to building real projects autonomously?
- Does the difficulty curve ramp smoothly, or are there cliff jumps where a beginner would get lost?
- Suggested milestone structure to look for:
  - **Phase 1 — Foundations**: Terminal basics, file system, what code is, what an LLM is
  - **Phase 2 — Guided building**: Claude Code writes code, learner learns to read and verify it
  - **Phase 3 — Iterative development**: Learner drives, Claude Code assists — debugging, extending, refactoring
  - **Phase 4 — Real projects**: End-to-end builds with increasing autonomy
  - **Phase 5 — Advanced patterns**: Multi-file projects, testing, deployment, CI/CD, MCP servers, custom slash commands

**2b. Skill dependency mapping**
- Does lesson N actually depend on skills taught in lesson N-1?
- Or could you shuffle the lessons randomly and it wouldn't matter? (Bad sign)
- Are dependencies made explicit? ("Before this lesson, you should be comfortable with X from Lesson 3")

**2c. Completeness**
- Does it cover the full stack of what a Claude Code user needs?
  - Reading and understanding code you didn't write
  - Prompting strategies (being specific, providing context, iterating)
  - File and project structure
  - Version control (git basics — init, commit, diff, branches)
  - Debugging with Claude Code's help
  - Testing (at least basic: "does this function return what I expect?")
  - Deployment (even a simple one — Vercel, GitHub Pages, or a local server)
- Does it cover Claude Code-specific features?
  - `/init` and CLAUDE.md configuration
  - Slash commands and custom commands
  - MCP server integration
  - Context management (what's in the conversation, how to reset)
  - Cost awareness (token usage, when to start a new conversation)
  - Model selection and when it matters

**2d. What's intentionally excluded**
- Does the course define its scope? A good course says "we will NOT cover X" so learners know what to expect.
- Is it honest about what AI-assisted programming can and cannot do?

**Score: ___ / 5**
**Notes:**

---

## 3. Pedagogical Quality (Weight: 20%)

How well does it actually *teach*?

**3a. Explain-then-do ratio**
- Does each concept get explained *before* the learner is asked to use it?
- Or does it dump code and say "run this" without context? (Tutorial hell pattern)
- Ideal ratio: ~30% explanation, ~70% hands-on, with explanation happening just-in-time.

**3b. Mental model building**
- Does the course build accurate mental models for how Claude Code works?
  - "You are having a conversation with an AI that can read and write files on your computer"
  - "Claude Code sees your project's files as context"
  - "Better prompts → better code — and here's what 'better' means"
- Does it avoid dangerous misconceptions? (e.g., "Claude Code always writes correct code," "you don't need to understand the code")

**3c. Progressive disclosure**
- Is complexity introduced gradually, or does the course frontload jargon?
- Does it use analogies and plain language before introducing technical terms?
- When a technical term is introduced, is it defined clearly and used consistently?

**3d. Error handling as pedagogy**
- Does the course *intentionally* show things going wrong?
- Does it teach learners how to read error messages, how to feed errors back to Claude Code, and how to recognize when Claude Code is stuck in a loop?
- This is arguably the most important skill for AI-assisted development and most courses skip it entirely.

**3e. Verification and critical thinking**
- Does the course teach learners to *verify* Claude Code's output rather than blindly trust it?
- Does it cover: running code to check if it works, reading code to understand what it does, spotting common LLM mistakes (hallucinated imports, off-by-one logic, outdated API usage)?
- Does it instill the habit of "trust but verify"?

**Score: ___ / 5**
**Notes:**

---

## 4. Hands-On Projects & Exercises (Weight: 20%)

Theory without practice is worthless. Evaluate the quality of the doing.

**4a. Project variety and relevance**
- Are projects things a beginner would actually want to build? (Personal website, CLI tool, simple game, automation script, API integration)
- Do projects increase in complexity across the course?
- Are there at least 3–5 substantial projects, not just toy snippets?

**4b. Guided vs. open-ended balance**
- Early projects should be heavily guided ("type this prompt, expect this output")
- Later projects should give goals and constraints but let the learner figure out the prompts and approach
- Is there a clear transition from guided → semi-guided → independent?

**4c. Real-world applicability**
- Do projects resemble things people actually build in the real world?
- Or are they contrived classroom exercises with no practical utility?
- Bonus: does the course teach learners to build tools that *they personally need*?

**4d. Starter code and solution quality**
- If starter code is provided, is it clean and well-commented?
- Are solutions provided for all exercises?
- Are solutions *good* solutions, or sloppy ones that "work but teach bad habits"?
- Do solutions show the Claude Code prompts used, not just the final code?

**4e. Checkpoints and self-assessment**
- Can the learner verify they completed a lesson correctly before moving on?
- Are there quizzes, automated tests, or clear "your output should look like this" checkpoints?
- Can a learner who gets stuck find exactly where they diverged?

**Score: ___ / 5**
**Notes:**

---

## 5. Claude Code–Specific Depth (Weight: 15%)

A generic "learn to code" course with Claude Code sprinkled on top is not the same as a course *designed around* AI-assisted development. This section evaluates how deeply the course engages with what makes Claude Code unique.

**5a. Prompt engineering for code generation**
- Does it teach how to write effective prompts for Claude Code specifically?
- Does it cover: providing context, specifying languages/frameworks, asking for explanations, iterating on output, using examples in prompts?
- Does it distinguish between good and bad prompts with before/after examples?

**5b. Context and conversation management**
- Does it teach how Claude Code's context window works at a practical level?
- Does it cover: when to start fresh vs. continue, how file context works, how to keep conversations focused?
- Does it address CLAUDE.md and project-level configuration?

**5c. Multi-file and multi-step workflows**
- Does it go beyond single-file scripts to teach real project development?
- Does it show how to use Claude Code for: creating project scaffolds, editing across multiple files, refactoring, adding features to existing codebases?

**5d. Integration with development tools**
- Does it cover Claude Code alongside git, testing frameworks, linters, package managers?
- Does it teach an integrated workflow rather than Claude Code in isolation?

**5e. Limitations and failure modes**
- Is it honest about when Claude Code struggles? (Complex state management, very large codebases, niche/undocumented APIs, tasks requiring visual judgment)
- Does it teach when to *stop* using Claude Code and switch to manual coding, documentation reading, or asking a human?

**Score: ___ / 5**
**Notes:**

---

## 6. Content Quality & Maintenance (Weight: 5%)

**6a. Writing quality**
- Is the prose clear, concise, and free of filler?
- Is it written for the stated audience (beginners), not for other developers?
- Is jargon avoided or defined on first use?

**6b. Code quality**
- Are all code examples tested and working?
- Do they follow reasonable conventions for the language used?
- Are they commented where a beginner would need explanation?

**6c. Freshness and maintenance**
- When was the repo last updated?
- Does it reference current Claude Code versions and features, or is it stale?
- Is there an active maintainer responding to issues?
- Does it have a CHANGELOG or update log?

**6d. Multimedia and formatting**
- Are screenshots, diagrams, or videos used where they'd help? (Terminal output, project architecture, workflow diagrams)
- Is the markdown well-formatted and consistent?
- Is it easy to navigate? (Table of contents, clear file/folder structure, numbered lessons)

**Score: ___ / 5**
**Notes:**

---

## 7. Community & Support (Weight: 5%)

**7a. Issue tracker health**
- Are GitHub issues being responded to?
- Are common questions addressed in documentation or FAQ?
- Is there a welcoming tone toward beginners asking basic questions?

**7b. Community channels**
- Is there a Discord, forum, or discussion board?
- If so, is it active and moderated?

**7c. Contribution model**
- Can learners contribute fixes, improvements, or additional exercises?
- Are contribution guidelines clear?
- Is there a code of conduct?

**Score: ___ / 5**
**Notes:**

---

## Scoring & Verdict

| Section | Weight | Score (1–5) | Weighted |
|---|---|---|---|
| 1. Onboarding & Setup | 15% | ___ | ___ |
| 2. Curriculum Architecture | 20% | ___ | ___ |
| 3. Pedagogical Quality | 20% | ___ | ___ |
| 4. Projects & Exercises | 20% | ___ | ___ |
| 5. Claude Code Depth | 15% | ___ | ___ |
| 6. Content Quality | 5% | ___ | ___ |
| 7. Community & Support | 5% | ___ | ___ |
| **TOTAL** | **100%** | | **___ / 5.00** |

### Interpretation

| Score | Verdict |
|---|---|
| **4.5–5.0** | Exceptional. Recommend without caveats. |
| **3.5–4.4** | Strong. Has gaps but delivers real value. Worth recommending with noted limitations. |
| **2.5–3.4** | Mediocre. Learner would need to supplement significantly. Recommend only if nothing better exists. |
| **1.5–2.4** | Weak. More likely to frustrate beginners than help them. Do not recommend. |
| **1.0–1.4** | Broken or fundamentally misguided. Avoid. |

---

## Red Flags (Instant Disqualifiers)

Check for these independently. Any single red flag should trigger serious caution regardless of the overall score:

- **No runnable code**: The course talks about coding but the learner never actually runs anything
- **"Just trust the AI"**: No emphasis on reading, understanding, or verifying generated code
- **Outdated tooling**: References deprecated Claude Code commands, old model names, or removed features
- **No error handling**: Every example works perfectly on the first try with no discussion of what to do when things break
- **Paywall bait**: Free content is just teasers for a paid course, with insufficient standalone value
- **Copy-paste only**: Learner copies prompts verbatim but is never asked to formulate their own
- **No projects**: All theory, no building
- **Assumes prior knowledge while claiming "zero"**: Says "zero to hero" but starts with "assuming you know Python basics" or "open your IDE"

---

## Evaluation Process Checklist

Use this as your workflow when evaluating a specific repo:

1. **Read the README end-to-end.** Does it tell you what the course is, who it's for, and how to get started?
2. **Follow the setup instructions exactly as written on a clean machine** (or fresh environment). Note every point of friction.
3. **Complete the first lesson.** Time yourself. Did you get a working result? How long did it take?
4. **Skim the full table of contents / lesson list.** Map the learning arc. Identify any cliff jumps or missing fundamentals.
5. **Complete 2–3 lessons from the middle of the course.** These reveal whether the course sustains quality past the intro.
6. **Attempt the most advanced project.** Even if you can't finish it, evaluate whether the instructions are sufficient for someone who completed all prior lessons.
7. **Deliberately break something.** Follow a lesson but introduce an error. Does the course help you recover?
8. **Check the issue tracker and commit history.** Is this actively maintained?
9. **Score each section above.** Compute the weighted total.
10. **Write a 3–5 sentence summary verdict.** Would you recommend this to a friend who wants to learn programming with Claude Code?
