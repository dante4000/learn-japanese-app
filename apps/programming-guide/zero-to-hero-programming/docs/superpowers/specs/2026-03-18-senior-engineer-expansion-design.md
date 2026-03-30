# Senior Engineer Expansion — Design Spec

> **Date:** 2026-03-18
> **Status:** Approved
> **Goal:** Expand the Zero-to-Hero curriculum from 6 phases / 28 chapters to 10 phases / 47 chapters by adding four new phases of professional engineering content between the current "Building & Deploying" phase and the AI phases.

---

## Motivation

Data Structures and Algorithms were relegated to appendices (F & G) as late additions. They belong in the core curriculum. Beyond DS&A, the guide currently jumps from "can build and deploy a Flask app" to "use AI to write code" — skipping the entire body of knowledge that makes someone a capable engineer: system design, database mastery, concurrency, networking, security, design patterns, performance, and navigating real codebases.

The expansion fills this gap. The end-state learner doesn't just use AI tools — they have the engineering judgment to evaluate what AI produces.

---

## New Curriculum Structure

| Phase | Title | Chapters | Status |
|-------|-------|----------|--------|
| 1 | Foundations | 01–04 | Existing, unchanged |
| 2 | Writing Python | 05–09 | Existing, unchanged |
| 3 | Development Tools | 10–12 | Existing, unchanged |
| 4 | Building & Deploying | 13–18 | Existing, unchanged |
| **5** | **Data Structures & Complexity** | **19–23** | **NEW** |
| **6** | **Algorithms** | **24–27** | **NEW** |
| **7** | **Engineering Craft** | **28–33** | **NEW** |
| **8** | **Systems & Scale** | **34–37** | **NEW** |
| 9 | AI-Assisted Development (Levels 1–5) | 38–42 | Existing content, renumbered from Ch 19–23 |
| 10 | AI Orchestration (Levels 6–8) | 43–47 | Existing content, renumbered from Ch 24–28 |

**Total:** 10 phases, 47 chapters (up from 6 phases, 28 chapters)

---

## Phase 5: Data Structures & Complexity (Ch 19–23)

Complexity analysis comes FIRST so that every data structure chapter can discuss Big-O without forward references.

### Ch 19: Complexity Analysis — Measuring What Matters
- Big-O, Big-Omega, Big-Theta — what they actually mean, not just memorized rankings
- Analyzing loops, nested loops, recursive calls — derive complexity yourself
- Space complexity — when memory matters more than time
- Amortized analysis — why `list.append()` is O(1) despite occasional O(n) resizes
- Common complexity classes with real examples: O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n)
- When Big-O lies — constant factors, cache effects, small-n behavior
- Engineering angle: profiling real code vs theoretical analysis, when to optimize and when to stop
- TaskForge: analyze the complexity of existing TaskForge operations, identify the bottleneck

### Ch 20: Linear Structures — Arrays, Linked Lists, Stacks & Queues
- How arrays work in memory (contiguous allocation, cache locality)
- Dynamic arrays — amortized doubling (referencing Ch 19 analysis)
- Linked lists — singly/doubly, when they beat arrays (frequent insert/delete at head), when they don't (cache misses)
- Stacks (LIFO) — call stacks, undo systems, expression evaluation, parentheses matching
- Queues & Deques (FIFO) — BFS, task scheduling, `collections.deque`
- Engineering angle: why linked lists are rarely the right choice in modern code despite textbooks loving them (cache locality > Big-O for small n)
- TaskForge: implement an undo stack for task operations

### Ch 21: Hash Tables, Sets & Maps
- How hashing works — hash functions, buckets, collision resolution (chaining vs open addressing)
- Load factors and rehashing — why dicts "just work" and when they don't
- Sets — membership testing, deduplication, set operations
- Real-world: how Python dicts are implemented (compact dict, insertion-ordered since 3.7)
- When hashing breaks — mutable keys, hash collisions, worst-case O(n)
- Engineering angle: choosing between dict/set/list for lookup-heavy code, how databases use hash indexes
- TaskForge: build a tag index for tasks using hash maps

### Ch 22: Trees
- Binary trees — structure, traversals (inorder, preorder, postorder, level-order)
- Binary search trees — insert, search, delete, why balance matters
- Heaps & priority queues — heap property, `heapq` module, top-K problems, scheduling
- Tries — prefix trees for autocomplete and search
- B-trees (conceptual) — why databases and filesystems use them, not BSTs
- Engineering angle: why you rarely implement trees yourself, but need them to reason about DB indexes, file systems, priority scheduling
- TaskForge: implement a priority queue for task scheduling

### Ch 23: Graphs
- Representations — adjacency list vs adjacency matrix, trade-offs
- Directed vs undirected, weighted vs unweighted
- Modeling real problems as graphs — dependencies, networks, routes, social connections
- Building a graph class from scratch
- When graphs show up in practice — dependency resolution, build systems, network topology, recommendation engines
- Engineering angle: how package managers resolve dependencies (topological sort preview), how routing works
- TaskForge: model task dependencies as a directed acyclic graph

### Phase 5 Gate
- TaskForge checkpoint: implement a task dependency system using a DAG with priority queue scheduling and undo support

---

## Phase 6: Algorithms (Ch 24–27)

### Ch 24: Searching & Sorting
- Linear search — when it's the right choice (unsorted, small, search-once)
- Binary search — implementation, off-by-one pitfalls, search space problems beyond sorted arrays
- Sorting: insertion sort (small/nearly-sorted), merge sort (stable, predictable), quicksort (fast in practice, pivot selection), heapsort (in-place, guaranteed O(n log n))
- Non-comparison sorts: counting sort, radix sort — breaking the O(n log n) barrier
- Stability, adaptivity, Timsort
- Engineering angle: `sorted()` with custom keys, database ORDER BY under the hood, sort once vs search repeatedly
- TaskForge: implement multi-key sorting (priority, then due date, then creation date)

### Ch 25: Recursion & Dynamic Programming
- Recursive thinking — subproblems, base cases, the call stack
- Stack overflow and tail recursion — Python's recursion depth limit
- Memoization — `@functools.lru_cache`
- Bottom-up tabulation — converting recursion to iteration
- Classic DP patterns: Fibonacci, coin change, longest common subsequence, knapsack
- Recognizing DP: overlapping subproblems + optimal substructure
- Engineering angle: where DP appears in production — text diff, spell check, resource allocation, route optimization
- TaskForge: optimal task scheduling with time constraints (knapsack variant)

### Ch 26: Algorithm Patterns
- Two pointers — sorted array problems, palindromes, container with most water
- Sliding window — subarray/substring problems, max sum of k, longest substring without repeats
- Greedy — interval scheduling, activity selection, when greedy fails
- Divide and conquer — merge sort structure, closest pair, the pattern beyond sorting
- Backtracking — constraint satisfaction, N-queens, subsets, permutations
- Decision framework: which pattern for which problem shape
- Engineering angle: sliding window for rate limiters, greedy for scheduling, backtracking for config validation
- TaskForge: sliding window for "tasks completed in last N days"

### Ch 27: Graph Algorithms & Problem Solving
- Recall callout referencing Ch 23 graph class
- BFS — shortest path (unweighted), level-order, connected components
- DFS — cycle detection, topological sort, path finding
- Dijkstra's algorithm — weighted shortest path, priority queue
- Topological sort — dependency ordering, build systems
- Union-Find — connected components, cycle detection
- Problem-solving framework: understand -> identify shape -> choose structure -> implement -> verify
- Engineering angle: pip dependency resolution (topo sort), GPS routing (Dijkstra/A*), social media suggestions (BFS)
- TaskForge: topological sort for valid task execution order

### Phase 6 Gate
- TaskForge checkpoint: given a set of tasks with dependencies, priorities, and time constraints, find the optimal execution order using graph algorithms + DP

---

## Phase 7: Engineering Craft (Ch 28–33)

Database Mastery split into two chapters (SQL/Indexing and Transactions/NoSQL) per scope review.

### Ch 28: Design Patterns & Clean Architecture
- SOLID principles — each with real violations and fixes
- Creational: Factory, Builder, Singleton (and why Singleton is usually wrong)
- Structural: Adapter, Decorator, Facade
- Behavioral: Observer, Strategy, Command
- Dependency injection — manual DI before frameworks
- Refactoring patterns — extract method/class, replace conditional with polymorphism, strangler fig
- Code smells — god classes, feature envy, shotgun surgery
- TaskForge: refactor using Strategy pattern for different storage backends

### Ch 29: SQL & Query Mastery
- SQL beyond basics — JOINs (inner, outer, cross, self), subqueries, CTEs, window functions
- Indexing — B-tree indexes, composite indexes, covering indexes, when indexes hurt
- Query optimization — EXPLAIN plans, how the query planner thinks, N+1 problem
- Normalization — 1NF through 3NF with real examples, when to denormalize
- Engineering angle: reading EXPLAIN output is a daily skill, not an academic exercise
- TaskForge: add indexes to TaskForge DB, analyze query plans, fix an N+1 query

### Ch 30: Transactions, NoSQL & Data Evolution
- Transactions & ACID — isolation levels (read uncommitted through serializable), deadlocks, optimistic vs pessimistic locking
- Connection pooling and why it matters
- NoSQL landscape — document stores (MongoDB-like), key-value (Redis-like), column-family, graph DBs — when to use each
- Migrations — schema evolution, zero-downtime migrations, backward compatibility
- Engineering angle: choosing the right database for the problem, not the one you know
- TaskForge: implement a migration strategy, model TaskForge data in both SQL and document store

### Ch 31: Networking & the Internet
- TCP/IP stack — physical -> link -> network -> transport -> application
- DNS — domain to IP, caching, TTL, DNS-based load balancing
- TCP vs UDP — three-way handshake, reliability, when UDP wins
- HTTP deep dive — methods, status codes, headers, cookies, sessions, HTTP/2
- TLS/HTTPS — certificate chains, handshake, symmetric vs asymmetric
- WebSockets — full-duplex, vs polling vs SSE
- Debugging — curl, dig, traceroute, reading packet flows
- TaskForge: trace a failing API call through DNS -> TCP -> TLS -> HTTP

### Ch 32: Concurrency & Parallelism
- Processes vs threads vs async — three models, when to use each
- Python's GIL — what it is, why it exists, what it prevents
- Threading — `threading`, shared state, race conditions, locks, deadlocks
- Async/await — event loops, coroutines, `asyncio`, non-blocking I/O
- Multiprocessing — process pools, shared memory, IPC
- Common bugs — race conditions, deadlocks, starvation, thundering herd
- Patterns — producer/consumer, thread pool, fan-out/fan-in, work queues
- TaskForge: async API calls + thread pool for CPU work

### Ch 33: Security Engineering
- Authentication — hashing/salting/bcrypt, JWT, OAuth2, session management
- Authorization — RBAC, ABAC, least privilege
- Encryption — symmetric (AES) vs asymmetric (RSA), hashing vs encryption
- OWASP Top 5 most critical — injection, broken auth, XSS, SSRF, security misconfiguration (with exploitable examples and fixes; remaining 5 as a reference table)
- Secure coding — input validation, parameterized queries, output encoding, dependency auditing
- Secrets management — env vars, secret stores, never commit credentials
- TaskForge: add auth, fix intentional vulnerabilities, implement RBAC

### Phase 7 Gate
- TaskForge checkpoint: refactor TaskForge with design patterns, add proper auth + RBAC, optimize database queries, implement concurrent task processing

---

## Phase 8: Systems & Scale (Ch 34–37)

### Ch 34: System Design Fundamentals
- Scale thinking — vertical vs horizontal, stateless vs stateful
- Load balancing — round robin, least connections, consistent hashing, health checks
- Caching — layers (browser, CDN, app, DB), invalidation, TTL, cache stampede
- CDNs — edge computing concepts
- Message queues — async processing, decoupling, at-least-once vs exactly-once
- Rate limiting — token bucket, sliding window
- Trade-off analysis — every decision has costs, articulating them
- TaskForge: design for 10,000 users — architecture diagram, bottleneck identification

### Ch 35: Distributed Systems & Architecture
- Monolith vs microservices — real trade-offs, when to split, when to stay
- CAP theorem in practice — what you actually give up
- Event-driven architecture — events vs commands, event sourcing, CQRS (conceptual)
- API design at scale — versioning, pagination, idempotency, backward compatibility
- Service communication — sync (HTTP/gRPC) vs async (queues), circuit breakers
- Data consistency — saga pattern, eventual consistency, distributed transactions
- TaskForge: decompose into services, design API contracts, handle service failures

### Ch 36: Performance & Observability
- Profiling — CPU, memory, `cProfile`, `memory_profiler`, flame graphs
- Caching in practice — memoization, cache-aside, Redis concepts
- Three pillars: logs, metrics, traces — what each tells you
- Structured logging — JSON logs, correlation IDs, log levels
- Monitoring & alerting — golden signals, SLIs/SLOs, dashboards
- Distributed tracing — following requests across services, span context
- Debugging production — investigation mindset, reading logs under pressure, postmortems
- TaskForge: structured logging, profile a slow endpoint, monitoring metrics

### Ch 37: Navigating & Evolving Large Codebases
- Reading unfamiliar code — entry points, dependency graphs, top-down vs bottom-up, "find the seam"
- Understanding legacy systems — archeological approach, drawing boundaries, load-bearing walls
- Safe changes — characterization tests, strangler fig, feature flags, incremental rewrites
- Technical debt — what it actually is, measuring it, paying it down strategically
- Code review as a senior skill — what to look for, feedback that improves code and engineers
- Working with large teams — conventions, ADRs, RFC processes
- TaskForge: diagnose and safely refactor a "legacy" version with intentional problems

### Phase 8 Gate
- TaskForge checkpoint: design TaskForge at scale (system design doc), add observability, perform a legacy refactoring exercise

---

## Structural Changes

### File Operations

**New files (4):**
- `src/phase-5.html` — Data Structures & Complexity (Ch 19–23)
- `src/phase-6.html` — Algorithms (Ch 24–27)
- `src/phase-7.html` — Engineering Craft (Ch 28–33)
- `src/phase-8.html` — Systems & Scale (Ch 34–37)

**Renamed files (2):**
- `src/phase-5.html` -> `src/phase-9.html` (rename FIRST, before creating new phase-5)
- `src/phase-6.html` -> `src/phase-10.html` (rename FIRST, before creating new phase-6)

**Modified files (all existing HTML + JS):**
- `src/index.html` — phase cards, hero-meta ("47 chapters", "10 phases"), `data-phase` attributes, inline JS chapter-to-phase maps (`chapterPhase`, `phaseFiles`)
- `src/phase-1.html` through `src/phase-4.html` — sidebar only
- `src/phase-9.html` (renamed) — sidebar, `<title>`, `<meta>` description, hero badge/sub, hero-meta chapter range, all `data-ch` attributes, all section IDs (`ch19`->`ch38`, etc.), all body text cross-references to other chapters, phase-nav links
- `src/phase-10.html` (renamed) — same as above
- `src/appendices.html` — remove Appendix F & G tab buttons (`data-tab="appendix-f"`, `data-tab="appendix-g"`), remove F & G panel content, remove internal cross-references between F and G, update phase-nav back link to "Phase 10"
- `src/js/progress.js` — update `getChapterMap()` to map 10 phases with 47 chapters
- `src/js/appendix-tabs.js` — remove F & G tab handling

### Renumbering Map

| Old Chapter | New Chapter | Content |
|-------------|-------------|---------|
| 19 | 38 | Evaluating & Directing AI Code |
| 20 | 39 | Levels 1 & 2 — Tab Complete & Agent IDE |
| 21 | 40 | Level 3 — Context Engineering |
| 22 | 41 | Level 4 — Compounding Engineering |
| 23 | 42 | Level 5 — MCP, Skills & Capabilities |
| 24 | 43 | Level 6 — Harness Engineering |
| 25 | 44 | Level 7 — Background Agents |
| 26 | 45 | Claude Code in Docker |
| 27 | 46 | Level 8 — Autonomous Agent Teams |
| 28 | 47 | The Multiplayer Effect |

### Cross-Reference Updates Required

1. **Sidebar** across all 12 HTML files — update to 10-phase structure
2. **Phase-nav links** (`<nav class="phase-nav">`) — update prev/next on every phase file
3. **Glossary terms** in appendices.html — ~40+ terms reference Ch 19–28, must update to Ch 38–47
4. **Body text cross-references** in phase-9/10.html — inline mentions of "Ch 19", "Ch 20" etc.
5. **`<title>` tags** — phase-9.html and phase-10.html need new phase numbers
6. **`<meta>` description tags** — phase-9.html and phase-10.html need new chapter ranges
7. **`hero-meta` spans** — chapter ranges on phase-9.html and phase-10.html
8. **`hero-badge` divs** — phase numbers on phase-9.html and phase-10.html
9. **Appendix F/G bridge callouts** in phase-2.html (Ch 06) — redirect to Ch 20–23 / Ch 24–27
10. **Prerequisite callouts** in phase-9.html — may reference Phase 4 capabilities, now there are 4 more phases between

### Appendix F/G Content Migration

The existing Appendix F (6 Pyodide exercises, 4 SVG diagrams) and Appendix G (3 Pyodide exercises, 2 SVG diagrams) represent tested, working interactive content. This content is **migrated** into the new chapters, not discarded:

- F.1 (Arrays/Dynamic Arrays) exercises/diagrams -> Ch 20
- F.2 (Linked Lists) exercises/diagrams -> Ch 20
- F.3 (Stacks/Queues) exercises/diagrams -> Ch 20
- F.4 (Hash Tables) exercises/diagrams -> Ch 21
- F.5 (BSTs) exercises/diagrams -> Ch 22
- F.6 (Graphs) exercises/diagrams -> Ch 23
- G.1 (Searching) exercises/diagrams -> Ch 24
- G.2 (Sorting) exercises/diagrams -> Ch 24
- G.3 (Recursion) exercises/diagrams -> Ch 25
- G.4 (Graph Algorithms) exercises/diagrams -> Ch 27
- G.5 (Algorithm Thinking) content -> Ch 27

Exercise `data-ch` attributes update from `"F"`/`"G"` to the new chapter numbers. Existing exercise IDs preserved where possible to avoid localStorage collision (see below).

### Sidebar Structure
```
Foundations             (01-04)
Python                  (05-09)
Development Tools       (10-12)
Building & Deploy       (13-18)
Data Structures         (19-23)   <- NEW
Algorithms              (24-27)   <- NEW
Engineering Craft       (28-33)   <- NEW
Systems & Scale         (34-37)   <- NEW
AI Levels 1-5          (38-42)
AI Levels 6-8          (43-47)
Reference               (Appendices A-E)
```

### Pyodide Limitations

Some new chapters cover concepts that cannot run in a browser Python sandbox. Specifically:
- **Ch 31 (Networking):** No socket/network I/O in Pyodide. Interactive exercises use quiz or checklist format. Code examples are read-and-trace, not run-in-browser.
- **Ch 32 (Concurrency):** Pyodide does not support `threading` or real `asyncio`. Exercises use quiz/checklist format. Conceptual exercises (identify the race condition, predict output) work well.
- **Ch 33 (Security):** Most concepts are architectural. Exercises use quiz format (spot the vulnerability) and checklist format (security audit).
- **Ch 34-37 (Systems & Scale):** Primarily design-oriented. Exercises use checklist, quiz, and "draw the architecture" formats.

All other chapters (19-30) can use Pyodide exercises fully.

### localStorage / Progress Tracking

Renumbering creates a collision: old Ch 19–28 progress keys vs new Ch 19–23 content. Two options:
- **(a)** Change the localStorage key namespace from `zth-ch-19` to `zth-v2-ch-19`
- **(b)** Accept that existing users' AI chapter progress resets

**Decision:** Option (a) — namespace migration. Add a one-time migration in `progress.js` that moves `zth-ch-19` through `zth-ch-28` to `zth-v2-ch-38` through `zth-v2-ch-47`, then use `zth-v2-ch-XX` for all chapters going forward.

### CLAUDE.md Updates Required

Before implementation begins, update CLAUDE.md:
- Rule 16: Remove or update the 1200-line limit (already de facto removed per UNIFIED-MASTER-PLAN, but CLAUDE.md still states it)
- Update chapter/phase counts in Project Overview
- Update file list to include phase-5 through phase-10

### Glossary Expansion
- ~60-80 new terms across the four new phases
- Inserted alphabetically into existing letter-group structure
- ~40+ existing terms that reference Ch 19-28 updated to reference Ch 38-47

### TaskForge Spine
- Every new chapter references TaskForge
- Each new phase gate has a TaskForge checkpoint
- TaskForge evolution across new phases:
  - Phase 5: dependency DAG, priority queue, undo stack
  - Phase 6: topological sort execution order, multi-key sort, DP scheduling
  - Phase 7: Strategy pattern refactor, auth/RBAC, optimized queries, concurrent processing
  - Phase 8: system design at scale, observability, legacy refactoring

### Conventions (carried forward)
- Same HTML template as existing chapters
- Same CSS (design-system.css, no modifications except D005 utility classes if needed)
- Same JS patterns (vanilla IIFE ES5)
- Same quality bar: 1 diagram + 1 static exercise + 1 interactive exercise per chapter minimum (interactive = Pyodide, quiz, or checklist)
- Max 5 new technical terms per chapter
- No forward references
- Two-layer tool references
- WCAG 2.1 AA compliance
- Mobile responsive at 700px / 900px

---

## Execution Strategy

### Round 1: Plan & Build
1. Update CLAUDE.md with new structure
2. Write detailed implementation plan (writing-plans skill)
3. Rename existing phase-5/6.html to phase-9/10.html
4. Renumber all chapters in phase-9/10.html
5. Update all cross-references in phase-9/10.html and appendices.html
6. Build all 19 new chapters across 4 new phases
7. Update index.html, progress.js, appendix-tabs.js
8. Sync sidebar across all 12 HTML files
9. Remove Appendix F & G, migrate exercises
10. Add glossary terms, update existing chapter references in glossary

### Round 2: Revise & Iterate
1. Full content review — accuracy, depth, consistency
2. Cross-reference verification (every link resolves)
3. Pedagogical QA against each new chapter
4. Fix issues found

### Round 3: Stress Test & Validate
1. Render every HTML file, check both themes
2. Click every interactive element
3. Test all Pyodide exercises
4. Verify all internal links
5. Mobile responsive check at 700px
6. Console error check
7. localStorage migration test

### Round 4: Final Build
1. Execute fixes from stress test
2. Final quality pass
3. Update all documentation (PROGRESS.md, DECISIONS.md, CHANGELOG.md, etc.)
4. Generate final status report
