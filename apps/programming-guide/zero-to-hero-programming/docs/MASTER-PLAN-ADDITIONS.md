# Master Plan Additions: Deep CS Foundations + Expanded Resources

> **What this is:** Complete build instructions for an LLM to implement 10 content additions to the Zero-to-Hero Programming curriculum. Each task is self-contained with exact placement, content specifications, HTML patterns, and verification steps.
>
> **Why these additions exist:** The current curriculum produces someone who can orchestrate multi-agent AI systems. These additions ensure that person also has **deep understanding of algorithms, data structures, systems thinking, and computer science fundamentals** — not just tool fluency, but the judgment to architect complex systems and evaluate whether AI-generated solutions are correct, efficient, and appropriate.
>
> **End-state learner:** Can spec, design, and build complex software systems with AI assistance — and understands what's happening under the hood. Knows why a hash table is O(1), when recursion will blow the stack, why merge sort beats bubble sort, what a graph traversal actually does, and how to evaluate AI-generated code against these fundamentals.

---

## CRITICAL RULES

### Read Before Building

Before touching ANY file, read these documents in order:

1. `CLAUDE.md` — Project build rules, code style, design system constraints
2. `docs/PROGRESS.md` — Current build state
3. `docs/DECISIONS.md` — Prior design decisions
4. `docs/COMPONENT-REGISTRY.md` — Component usage patterns

### No File Size Limits

The previous 1200-line limit per phase file is **removed**. If a phase file grows large after additions, split it into multiple files (e.g., `phase-2a.html`, `phase-2b.html`) and update ALL sidebars across ALL HTML files to reflect the new structure. Content goes where it pedagogically belongs — never compromise placement for arbitrary size constraints.

### Build Order

Execute tasks 1–10 in the order listed. Some tasks depend on earlier ones (e.g., Task 5 references appendices created in Tasks 1–2). After each task, verify the work before moving to the next.

### Immutable Reference

NEVER modify `reference/fuso-hmi-reference.html`.

### Design System

All CSS lives in `src/css/design-system.css`. No inline styles except inside SVG diagrams. No CSS frameworks. No JS frameworks. Vanilla HTML/CSS/JS only. Follow existing patterns exactly.

### TaskForge Spine

Every new chapter-level section must reference the TaskForge project at least once — as an example, code snippet, exercise, or conceptual explanation. For appendix content, TaskForge references are encouraged but not required.

### Exercise Format

ALL interactive exercises use the Pyodide pattern (in-browser Python execution). No exercises should require the reader to leave the page or install anything. Static "Try This Now" exercises are acceptable for setup/terminal tasks only.

### Two-Layer Tool References

All tool references use the two-layer pattern:
- **Layer 1:** Enduring concept (what the tool category does and why)
- **Layer 2:** Current example (specific tool, version, install command) — clearly marked, easy to update

---

## HTML PATTERNS REFERENCE

Use these exact patterns for all new content. Do not invent new component types.

### Chapter Section

```html
<!-- ===== CH XX ===== -->
<section id="chXX" data-ch="XX">
<h2><span class="ch-label">Chapter XX</span>Chapter Title Here</h2>

<!-- chapter content -->

</section>
```

### Pyodide Exercise

```html
<div class="exercise" data-type="pyodide" data-ch="XX" data-ex="unique-slug">
  <div class="exercise-header">
    <h4>Exercise Title</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt">Description of what the reader must do. Use <code>code formatting</code> for function names and variables.</p>
  <div class="exercise-editor">
    <script type="text/plain" class="starter-code">
def function_name():
    # Your code here
    pass
</script>
    <script type="text/plain" class="test-code">
assert function_name() == expected, "Descriptive failure message"
</script>
  </div>
  <div class="exercise-controls">
    <button class="ex-run">Run</button>
    <button class="ex-check">Check</button>
    <button class="ex-hint" data-level="0">Hint</button>
    <button class="ex-reset">Reset</button>
  </div>
  <div class="exercise-output"></div>
  <div class="exercise-tests"></div>
  <div class="exercise-hints">
    <p class="hint">First hint — gentle nudge.</p>
    <p class="hint">Second hint — more specific.</p>
    <p class="hint">Third hint — nearly gives the answer.</p>
  </div>
</div>
```

**Rules for Pyodide exercises:**
- `data-ch` matches the chapter number (e.g., `"06"`)
- `data-ex` is a unique slug within that chapter (e.g., `"linked-list"`)
- Starter code goes in `<script type="text/plain" class="starter-code">`
- Test assertions go in `<script type="text/plain" class="test-code">`
- Always provide 2–3 progressive hints
- Starter code must be syntactically valid Python (it should run without errors, even if it doesn't pass tests)
- Test code uses `assert` statements with descriptive failure messages

### Info Callout

```html
<div class="callout info">
<div class="callout-title">Title Here</div>
<p>Informational content. Used for context, background, or "why this matters" framing.</p>
</div>
```

### Warning Callout

```html
<div class="callout warn">
<div class="callout-title">Title Here</div>
<p>Warning content. Used for common mistakes, myths, or "watch out for this" patterns.</p>
</div>
```

### OK / Try This Now Callout

```html
<div class="callout ok">
<div class="callout-title">Try This Now</div>
<p>Instructions for what to do.</p>
<div class="prompt-block"><span class="label">filename.py</span>code here</div>
<p><strong>Verification:</strong> How to confirm it worked.</p>
<p><strong>If this doesn't work:</strong> Troubleshooting steps.</p>
</div>
```

### Pull Quote / Micro-Win

```html
<div class="pq">Achievement statement. Congratulates the reader on what they just accomplished.</div>
```

Or with attribution:

```html
<div class="pq">
<blockquote>"Quote text here."<br>&mdash;Author Name, <em>Source</em></blockquote>
</div>
```

### Quiz

```html
<div class="quiz" data-ch="XX" data-ex="quiz-slug">
  <h4>Knowledge Check</h4>
  <p>Question text?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-correct="false">Wrong answer</button>
    <button class="quiz-option" data-correct="true">Correct answer</button>
    <button class="quiz-option" data-correct="false">Wrong answer</button>
    <button class="quiz-option" data-correct="false">Wrong answer</button>
  </div>
  <div class="quiz-feedback"></div>
</div>
```

### SVG Diagram

```html
<svg viewBox="0 0 700 XXX" xmlns="http://www.w3.org/2000/svg">
  <rect class="node-fill" x="10" y="10" width="120" height="70" rx="8"/>
  <text class="label-text" x="70" y="35" text-anchor="middle">Label</text>
  <text class="sub-text" x="70" y="52" text-anchor="middle">Subtitle</text>
  <rect class="node-accent" x="150" y="10" width="120" height="70" rx="8"/>
  <text class="label-text" x="210" y="35" text-anchor="middle">Highlighted</text>
  <line x1="130" y1="45" x2="150" y2="45" class="arrow" marker-end="url(#arrowhead)"/>
</svg>
<div class="diagram-caption">Caption explaining what the diagram teaches.</div>
```

**SVG rules:**
- Use `class="node-fill"` for standard boxes, `class="node-accent"` for highlighted boxes
- Use `class="label-text"` for primary labels, `class="sub-text"` for secondary text
- Use `class="arrow"` with `marker-end="url(#arrowhead)"` for arrows
- Every diagram MUST have a `<div class="diagram-caption">` explaining the concept
- Every diagram must teach ONE non-obvious concept (no decorative diagrams)
- `viewBox` width should be 700 for consistency; height varies

### Sidebar Link

For appendix links in the sidebar (inside the Reference `<div class="toc-group">`):

```html
<a href="appendices.html#section-id" class="toc-link"><span class="toc-num">&oplus;</span>Link Text</a>
```

For same-page links in `appendices.html` itself:

```html
<a href="#section-id" class="toc-link"><span class="toc-num">&oplus;</span>Link Text</a>
```

### Appendix Section

```html
<!-- ===== SECTION TITLE ===== -->
<section id="section-id">
<h2><span class="ch-label">Appendix X</span>Section Title</h2>
<p>Introduction paragraph.</p>

<!-- content -->

</section>
```

---

## TASK 1: Data Structures Deep Dive

### Goal

Add comprehensive coverage of fundamental data structures that the reader will encounter in AI-generated code and need to understand for building complex systems. This is not a theoretical exercise — every data structure must be connected to real scenarios where AI generates code using it and the reader needs to evaluate whether it's the right choice.

### Placement

**New appendix:** `Appendix F — Data Structures from the Ground Up` in `src/appendices.html`.

**Inline additions to Ch06 (Data Structures in `src/phase-2.html`):** Add a callout at the END of Ch06 that bridges to the appendix:

```html
<div class="callout info">
<div class="callout-title">Going Deeper: Data Structures Under the Hood</div>
<p>This chapter taught you to <em>use</em> lists, dicts, and sets. Appendix F teaches you how they <em>work</em> internally — hash tables, linked lists, trees, and graphs. Understanding the internals matters because AI-generated code sometimes picks the wrong data structure, and you need the vocabulary to catch it. When you're ready, read <a href="appendices.html#appendix-f">Appendix F</a>.</p>
</div>
```

Also add a **Big O callout** in Ch06, placed right after the section where lists and dicts are compared (wherever the "choosing the right structure" content is):

```html
<div class="callout info">
<div class="callout-title">Big O — How Fast Is This Code?</div>
<p>Big O notation describes how an operation's time grows as data grows. You don't need to derive it mathematically — you need to <em>recognize</em> it when reading AI-generated code:</p>
<table>
<tr><th>Notation</th><th>Name</th><th>Example</th><th>Feel</th></tr>
<tr><td><code>O(1)</code></td><td>Constant</td><td>Dict lookup by key</td><td>Instant, no matter the size</td></tr>
<tr><td><code>O(log n)</code></td><td>Logarithmic</td><td>Binary search</td><td>Doubles data? One extra step</td></tr>
<tr><td><code>O(n)</code></td><td>Linear</td><td>Loop through a list</td><td>10x data = 10x time</td></tr>
<tr><td><code>O(n log n)</code></td><td>Linearithmic</td><td>Sorting (good algorithms)</td><td>Slightly worse than linear</td></tr>
<tr><td><code>O(n&sup2;)</code></td><td>Quadratic</td><td>Nested loops</td><td>10x data = 100x time</td></tr>
<tr><td><code>O(2&#x207F;)</code></td><td>Exponential</td><td>Brute force all subsets</td><td>Unusable past ~30 items</td></tr>
</table>
<p><strong>The practical rule:</strong> When AI generates a nested loop over a list, ask: "Is this O(n&sup2;)? Could it be O(n) with a dict?" That single question catches the most common performance mistake in AI-generated code.</p>
</div>
```

### Appendix F Content Specification

The appendix must cover the following data structures in this order. For each one, include:

1. **What it is** — plain-language explanation with a real-world analogy
2. **How it works internally** — with an SVG diagram showing the structure
3. **When to use it** — concrete scenarios (including when AI might pick it)
4. **When NOT to use it** — what goes wrong if you use it in the wrong context
5. **Big O table** — lookup, insert, delete, search times
6. **Connection to Python** — which Python built-in implements this (if any)
7. **At least one Pyodide exercise** — the reader builds it or uses it
8. **TaskForge tie-in** — where applicable, show how this structure could improve or relate to TaskForge

#### F.1 — Arrays and Dynamic Arrays

- Fixed-size arrays vs. Python's dynamic `list`
- How `list.append()` works (amortized O(1) with occasional resize)
- Memory layout: contiguous blocks
- SVG diagram: show a fixed array with indices, then a dynamic array growing (doubling strategy)
- Exercise: Implement a `DynamicArray` class using `ctypes.py_object` that supports `append`, `__getitem__`, and `__len__`. It should double capacity when full.
- Quiz: "What is the time complexity of accessing `my_list[500]` in Python?" (Answer: O(1) — direct index)

#### F.2 — Linked Lists

- Singly linked list: nodes with data + pointer to next
- Why they exist: O(1) insertion/deletion at known positions (vs. O(n) for arrays)
- Why Python doesn't have a built-in linked list (arrays are better for most modern workloads due to cache locality)
- SVG diagram: nodes as boxes with arrows, showing insertion in the middle
- Exercise: Implement a `LinkedList` class with `append`, `prepend`, `delete`, `search`, `reverse`, and `__len__` methods.
- Exercise: Given a linked list, detect if it has a cycle (Floyd's tortoise and hare).
- When AI generates linked list code: usually wrong choice in Python. Teach the reader to question it.

#### F.3 — Stacks

- LIFO principle (Last In, First Out)
- Real-world analogy: stack of plates, browser back button, undo history
- Implementation: just a list with `append()` and `pop()`
- SVG diagram: vertical stack with push/pop arrows
- Exercise: Implement an expression evaluator that handles nested parentheses using a stack. Given a string like `"(3 + (2 * 4))"`, evaluate it correctly.
- Exercise: Implement "Valid Parentheses" — given a string of `()[]{}`, determine if every open bracket is correctly closed.
- Connection: Python's call stack IS a stack. Recursion = implicit stack.

#### F.4 — Queues

- FIFO principle (First In, First Out)
- Real-world analogy: print queue, task queue, message queue
- Implementation with `collections.deque` (O(1) at both ends vs. O(n) for `list.pop(0)`)
- SVG diagram: horizontal queue with enqueue/dequeue arrows
- Exercise: Implement a `TaskQueue` for TaskForge that processes tasks in order. Methods: `enqueue(task)`, `dequeue()`, `peek()`, `is_empty()`, `size()`.
- Warn callout: "AI frequently uses `list.pop(0)` for queue operations. This is O(n) because every remaining element shifts. Use `collections.deque` instead."

#### F.5 — Hash Tables

- How Python dicts actually work under the hood
- Hash functions: turn any key into an integer index
- Collision handling: open addressing (Python's approach) vs. chaining
- Why O(1) average but O(n) worst case
- SVG diagram: show keys being hashed to indices, show a collision and how it's resolved
- Exercise: Implement a basic `HashTable` class from scratch. Use a list of buckets with chaining (each bucket is a list of key-value pairs). Support `set(key, value)`, `get(key)`, `delete(key)`, `keys()`.
- Exercise: Use your hash table to solve "Two Sum" — given a list of numbers and a target, return indices of two numbers that add up to the target. Demonstrate O(n) vs. the O(n^2) brute force.
- TaskForge tie-in: TaskForge stores tasks in a list and searches by ID with a loop. Show how a dict (hash table) makes lookup O(1).

#### F.6 — Trees

- Binary trees: nodes with left/right children
- Binary Search Trees (BST): left < parent < right
- Why trees matter: hierarchical data, file systems, DOM, decision trees
- Tree traversals: inorder, preorder, postorder — what each produces and why you'd use each
- SVG diagram: a BST with 7 nodes, showing inorder traversal order with numbered arrows
- Exercise: Implement a `BST` class with `insert`, `search`, `inorder` (returns sorted list), `min`, and `max`.
- Exercise: Given a BST, write `is_valid_bst(node)` that checks whether the BST property holds. (AI sometimes generates broken BST code — this is how you verify it.)
- Brief mention of balanced trees (AVL, Red-Black) — the reader doesn't need to implement them, but should know they exist and that Python's `sorted()` uses Timsort, not a BST.

#### F.7 — Graphs

- Nodes and edges, directed vs. undirected
- Representations: adjacency list (dict of lists) vs. adjacency matrix
- Real-world examples: social networks, dependency graphs, route planning, git commit history
- SVG diagram: a small directed graph (6 nodes) shown both as a visual graph and as an adjacency list
- Exercise: Implement a `Graph` class using an adjacency list. Support `add_node`, `add_edge`, `neighbors`, `has_path(start, end)`.
- Exercise: Implement BFS (breadth-first search) on the graph. Given a start node, return all reachable nodes in BFS order. (This connects to Task 2's algorithm coverage.)
- Exercise: Implement DFS (depth-first search) both recursively and iteratively.
- Connection: "When AI generates dependency resolution, build ordering, or 'find shortest path' code, it's using graph algorithms. You need to know what BFS and DFS are to evaluate whether it picked the right one."

#### F.8 — Choosing the Right Data Structure

A summary decision table:

| Need | Best Structure | Why |
|------|---------------|-----|
| Fast lookup by key | Dict (hash table) | O(1) average |
| Ordered collection, indexed access | List (dynamic array) | O(1) index access |
| Fast insert/delete at both ends | `collections.deque` | O(1) at both ends |
| Unique items, membership testing | Set (hash table) | O(1) lookup |
| Hierarchical data | Tree | Natural parent-child |
| Relationships between entities | Graph | Nodes + edges |
| LIFO processing | Stack (list) | `append` + `pop` |
| FIFO processing | Queue (deque) | `append` + `popleft` |

Pyodide exercise: Present 5 scenarios and ask the reader to pick the best data structure for each. Auto-check with assertions.

### Verification

After building Appendix F:

- [ ] Every section has at least one SVG diagram with a `<div class="diagram-caption">`
- [ ] Every section has at least one Pyodide exercise
- [ ] All exercise `data-ex` slugs are unique
- [ ] The Big O callout is inserted in Ch06
- [ ] The "Going Deeper" bridge callout is inserted at the end of Ch06
- [ ] Appendix F appears in `appendices.html` with `id="appendix-f"`
- [ ] ALL sidebar files updated with the new appendix link
- [ ] Content renders correctly in both light and dark themes
- [ ] All Pyodide exercises run without errors when the starter code is executed
- [ ] Glossary (Appendix A) updated with new terms: Big O, linked list, stack, queue, hash table, hash function, collision, binary search tree, graph, adjacency list, BFS, DFS, LIFO, FIFO

---

## TASK 2: Algorithms

### Goal

Teach the core algorithms that underpin AI-generated code. The reader should be able to recognize which algorithm an AI is using, evaluate whether it's the right choice, and understand the performance implications.

### Placement

**New appendix:** `Appendix G — Algorithms: Searching, Sorting, and Traversal` in `src/appendices.html`.

**Inline callout in Ch06** (after the Big O callout from Task 1):

```html
<div class="callout info">
<div class="callout-title">Algorithms: The Recipes Behind the Code</div>
<p>Data structures are <em>how you store</em> data. Algorithms are <em>how you process</em> it. When AI generates a sort, a search, or a pathfinding solution, it's applying an algorithm. <a href="appendices.html#appendix-g">Appendix G</a> teaches you the essential ones so you can evaluate whether the AI picked the right approach.</p>
</div>
```

### Appendix G Content Specification

#### G.1 — Searching

**Linear Search:**
- Walk through every element until you find it
- O(n) — acceptable for small/unsorted data
- Exercise: Implement `linear_search(lst, target)` returning the index or -1

**Binary Search:**
- Requires sorted data. Halve the search space each step.
- O(log n) — dramatically faster for large sorted data
- SVG diagram: show a sorted array being halved 3 times to find a target
- Exercise: Implement `binary_search(sorted_lst, target)` returning the index or -1
- Exercise: "AI-generated code does `if x in my_list` on a sorted list of 1 million items. Is this efficient? Rewrite it using binary search."
- Connection to `bisect` module in Python's standard library

#### G.2 — Sorting

**Why sorting matters:** Sorted data enables binary search, makes duplicates adjacent, enables merge operations. AI sorts data constantly.

**Bubble Sort:**
- Compare adjacent elements, swap if out of order, repeat
- O(n^2) — terrible for large data, but simple to understand
- Exercise: Implement `bubble_sort(lst)` that sorts in place
- This is what "bad sorting" looks like. Teach the reader to recognize it.

**Selection Sort:**
- Find the minimum, put it first, repeat for the rest
- O(n^2) — also bad, but useful for understanding the concept
- Exercise: Implement `selection_sort(lst)`

**Insertion Sort:**
- Build sorted portion one element at a time
- O(n^2) worst case but O(n) for nearly-sorted data
- Exercise: Implement `insertion_sort(lst)`
- Note: Python's Timsort uses insertion sort for small runs

**Merge Sort:**
- Divide the list in half, sort each half, merge them back
- O(n log n) — always. No worst case degradation.
- This is the reader's introduction to divide-and-conquer
- SVG diagram: show a list being split into halves recursively, then merged back together
- Exercise: Implement `merge_sort(lst)` recursively. Implement the `merge(left, right)` helper separately.

**Quick Sort:**
- Pick a pivot, partition around it, recurse on each side
- O(n log n) average, O(n^2) worst case (bad pivot)
- SVG diagram: show partitioning around a pivot
- Exercise: Implement `quick_sort(lst)` with a basic pivot strategy (first element or random)

**Comparison table:**

| Algorithm | Best | Average | Worst | Stable? | In-place? |
|-----------|------|---------|-------|---------|-----------|
| Bubble | O(n) | O(n^2) | O(n^2) | Yes | Yes |
| Selection | O(n^2) | O(n^2) | O(n^2) | No | Yes |
| Insertion | O(n) | O(n^2) | O(n^2) | Yes | Yes |
| Merge | O(n log n) | O(n log n) | O(n log n) | Yes | No |
| Quick | O(n log n) | O(n log n) | O(n^2) | No | Yes |
| Python `sorted()` | O(n) | O(n log n) | O(n log n) | Yes | No |

**Practical callout:**

```html
<div class="callout warn">
<div class="callout-title">In Practice: Just Use sorted()</div>
<p>Python's built-in <code>sorted()</code> uses Timsort — a hybrid of merge sort and insertion sort, optimized for real-world data. It's faster than anything you'll write by hand. The reason you implement these algorithms is to <em>understand the concepts</em>, not to replace <code>sorted()</code>. When AI generates a manual sorting loop instead of using <code>sorted()</code>, that's usually a red flag.</p>
</div>
```

#### G.3 — Recursion Deep Dive

- What recursion is: a function that calls itself with a smaller problem
- The two requirements: base case (stop condition) and recursive case (smaller subproblem)
- The call stack: how Python tracks each call (and why deep recursion crashes with `RecursionError`)
- SVG diagram: show the call stack for `factorial(4)` — four frames stacked, then unwinding with return values
- SVG diagram: show the call tree for `fibonacci(5)` — branching tree showing redundant calculations

**Exercises (all Pyodide):**
- Implement `factorial(n)` recursively
- Implement `fibonacci(n)` recursively, then discuss why it's O(2^n) and show the memoized version
- Implement `sum_of_digits(n)` recursively (e.g., `sum_of_digits(1234)` returns 10)
- Implement `flatten(nested_list)` that flattens arbitrarily nested lists (e.g., `[1, [2, [3, 4]], 5]` becomes `[1, 2, 3, 4, 5]`)
- Implement `power(base, exp)` recursively using the fast exponentiation trick (if exp is even, `power(base, exp//2) ** 2`)

**Callout: Recursion vs. Iteration:**

```html
<div class="callout info">
<div class="callout-title">When to Use Recursion</div>
<p>Use recursion when the problem has a naturally recursive structure: trees, nested data, divide-and-conquer algorithms. Use iteration (loops) when you're just processing a flat sequence. AI sometimes generates recursive solutions for problems that are simpler iteratively — and vice versa. Knowing both lets you evaluate the choice.</p>
</div>
```

#### G.4 — Graph Algorithms (BFS and DFS)

This section expands on the BFS/DFS introduced in Task 1's graph section (Appendix F.7). If the reader already implemented basic BFS/DFS there, this section builds on it:

- **BFS applications:** shortest path in unweighted graphs, level-order traversal, "find all nodes within N hops"
- **DFS applications:** cycle detection, topological sort, connected components
- SVG diagram: side-by-side comparison of BFS (level-by-level) vs. DFS (deep-first) traversal order on the same graph
- Exercise: Implement `shortest_path(graph, start, end)` using BFS that returns the actual path (not just distance)
- Exercise: Implement `topological_sort(graph)` for a directed acyclic graph (DAG). Connection: "This is how package managers resolve install order and how CI/CD pipelines determine build order."
- Exercise: Implement `find_connected_components(graph)` that returns a list of groups

**TaskForge tie-in:** "If TaskForge tasks had dependencies (Task B requires Task A to be done first), you'd model that as a DAG and use topological sort to find the correct execution order."

### Verification

After building Appendix G:

- [ ] Every algorithm has at least one Pyodide exercise
- [ ] The sorting comparison table is present
- [ ] Call stack diagrams for recursion are present (SVG)
- [ ] BFS vs DFS comparison diagram is present (SVG)
- [ ] Bridge callout is inserted in Ch06
- [ ] Appendix G appears in `appendices.html` with `id="appendix-g"`
- [ ] ALL sidebar files updated with the new appendix link
- [ ] Glossary updated with: recursion, base case, call stack, divide and conquer, binary search, merge sort, quick sort, BFS, DFS, topological sort, stable sort, time complexity, space complexity
- [ ] All exercises run without errors in Pyodide

---

## TASK 3: Recursion, Higher-Order Functions, and Decorators in Existing Chapters

### Goal

Expand Ch05 (Functions, Logic, and Control Flow) and Ch07 (Classes & OOP Basics) with content the reader needs to READ AI-generated code that uses these patterns. AI generates higher-order functions, closures, lambda expressions, and decorators constantly. The reader currently has no foundation for any of these.

### Placement

**Ch05 expansion** (`src/phase-2.html`): Add a new subsection AFTER the existing content on functions but BEFORE the chapter's interactive exercises section. Title: `"Functions as Values: Higher-Order Functions and Closures"`.

**Ch07 expansion** (`src/phase-2.html`): Add a new subsection covering decorators. Title: `"Decorators: Functions That Modify Functions"`. Place it after the existing OOP content but before the chapter's exercises.

### Ch05 Addition: Higher-Order Functions and Closures

Content to cover:

**Functions are values:**
- You can assign a function to a variable: `greet = print`
- You can pass a function as an argument
- You can return a function from a function
- This is what "first-class functions" means

**Built-in higher-order functions:**
- `map(function, iterable)` — apply a function to every element
- `filter(function, iterable)` — keep elements where function returns True
- `sorted(iterable, key=function)` — sort by a custom key
- Show each one, then show the list comprehension equivalent
- Callout: "AI generates `map()` and `filter()` frequently. List comprehensions are usually more readable in Python. Knowing both lets you read the AI's code and decide which is clearer."

**Lambda expressions:**
- Anonymous functions: `lambda x: x * 2`
- When they're useful: short, throwaway functions as arguments
- When they're NOT useful: anything more than one expression
- Exercise: Rewrite 3 lambda expressions as named functions and vice versa

**Closures:**
- A function that remembers variables from the scope where it was defined
- Example: a counter factory function
- Why this matters: AI generates closures in callbacks, event handlers, and factory patterns
- Exercise: Implement a `make_multiplier(n)` function that returns a new function that multiplies its input by `n`

**Pyodide exercises:**
1. Implement `apply_to_all(func, lst)` that applies a function to every element (reimplementing `map`)
2. Implement `keep_if(func, lst)` that keeps elements where func returns True (reimplementing `filter`)
3. Sort a list of TaskForge task dicts by priority using `sorted()` with a `key` function
4. Implement `make_validator(min_len, max_len)` that returns a function checking if a string's length is within range (closure exercise)

### Ch07 Addition: Decorators

Content to cover:

**What a decorator is:**
- A function that takes a function and returns a modified version of it
- The `@decorator` syntax is shorthand for `func = decorator(func)`
- Show the manual version first, then the `@` syntax

**Why this matters NOW:**
- `@app.route("/tasks")` in Flask — the reader has already seen this in Ch14 or will soon
- `@staticmethod`, `@classmethod`, `@property` — standard OOP decorators
- `@pytest.fixture` — testing decorators
- AI generates decorated functions constantly. Without understanding decorators, the reader can't modify or debug them.

**Building a decorator step by step:**
1. Write a function that takes a function as input
2. Define an inner wrapper function that calls the original
3. Return the wrapper
4. Show timing decorator, logging decorator, retry decorator

**Pyodide exercises:**
1. Implement a `@timer` decorator that prints how long a function takes to run
2. Implement a `@log_calls` decorator that prints the function name and arguments each time it's called
3. Read AI-generated Flask code with `@app.route` decorators and explain what each one does (comprehension exercise, not implementation)

### Verification

- [ ] Higher-order functions section added to Ch05 with all specified content
- [ ] Decorator section added to Ch07 with all specified content
- [ ] At least 4 Pyodide exercises in Ch05 additions
- [ ] At least 3 Pyodide exercises in Ch07 additions
- [ ] Lambda, map, filter, closure, decorator added to Glossary
- [ ] No forward references — closures are explained before decorators
- [ ] Existing exercises in Ch05 and Ch07 are not modified or removed

---

## TASK 4: Curated Book Queue with Phase Alignment

### Goal

Give the reader a structured reading path for deepening their CS knowledge beyond the curriculum. Books are aligned to specific phases so the reader knows WHEN to read each one.

### Placement

**Expand Appendix E** (`src/appendices.html`): Add a new `<h3>` section titled `"Structured Reading Path"` at the TOP of Appendix E (before the existing Python/Git/Web sections). This is the most important resource section — it should be first.

### Content

```html
<h3>Structured Reading Path</h3>
<p>These books deepen the foundations this curriculum introduces. Read them in order, at the pace suggested. You don't need to finish one before starting the next phase of this curriculum — they're parallel tracks that reinforce each other.</p>

<table>
<tr><th>When to Start</th><th>Book</th><th>What It Gives You</th><th>How to Read It</th></tr>
<tr>
<td><strong>After Phase 2</strong></td>
<td><a href="https://composingprograms.com">Composing Programs</a> (free online)</td>
<td>Deep understanding of functions, data abstraction, recursion, and interpreters. The CS foundation underneath Python.</td>
<td>Read Ch 1–2. Do all exercises. This is your most important supplementary resource.</td>
</tr>
<tr>
<td><strong>After Phase 2</strong></td>
<td><em>Code: The Hidden Language of Computer Hardware and Software</em> — Charles Petzold</td>
<td>How computers actually work, from telegraph relays to CPUs. Makes Ch02 of this curriculum concrete.</td>
<td>Read cover to cover. No exercises — just read and absorb. It's written for non-engineers.</td>
</tr>
<tr>
<td><strong>After Phase 4</strong></td>
<td><em>The Algorithm Design Manual</em> — Steven Skiena</td>
<td>Practical algorithm thinking. Complements Appendix G with real-world algorithm selection.</td>
<td>Read Part I (Ch 1–8). Skip Part II (the war stories) on first pass — return to it when you hit a real problem.</td>
</tr>
<tr>
<td><strong>After Phase 4</strong></td>
<td><em>Computer Systems: A Programmer's Perspective</em> (CS:APP)</td>
<td>How programs actually run on hardware. Memory, processes, networking at the systems level.</td>
<td>Read Ch 1–6. Dense but transformative. One chapter per week is fine.</td>
</tr>
<tr>
<td><strong>After Phase 5</strong></td>
<td><em>Designing Data-Intensive Applications</em> (DDIA) — Martin Kleppmann</td>
<td>How real systems handle data at scale. Reliability, scalability, maintainability.</td>
<td>Read Ch 1–2 first (vocabulary). Then Ch 3–9 when you're building systems that need to scale.</td>
</tr>
<tr>
<td><strong>After Phase 6</strong></td>
<td><a href="https://craftinginterpreters.com">Crafting Interpreters</a> (free online) — Robert Nystrom</td>
<td>Build a programming language from scratch. The deepest understanding of how code works.</td>
<td>Read Ch 1–4 first (scanner/tokenizer). Build the full interpreter when you have time for a multi-week project.</td>
</tr>
</table>

<div class="callout info">
<div class="callout-title">How This Connects to AI</div>
<p>Every book on this list makes you a better AI supervisor. <em>Composing Programs</em> teaches you to read any code AI generates. <em>The Algorithm Design Manual</em> teaches you to evaluate its efficiency. <em>DDIA</em> teaches you to question its architecture. <em>Crafting Interpreters</em> teaches you how the tools themselves work. The deeper your understanding, the better your judgment — and judgment is what separates someone who uses AI from someone who directs it.</p>
</div>
```

### Verification

- [ ] Reading path table appears at the top of Appendix E
- [ ] All 6 books are listed with correct titles, authors, and links (where free)
- [ ] Phase alignment is clear (After Phase 2, After Phase 4, etc.)
- [ ] The "How This Connects to AI" callout ties the reading list to the curriculum's goal
- [ ] Links are correct: composingprograms.com, craftinginterpreters.com

---

## TASK 5: External Practice Platforms

### Goal

Point readers to the best external platforms for practicing the skills each chapter teaches. Add both a consolidated section in Appendix E and inline callouts in the specific chapters.

### Appendix E Addition

Add a new `<h3>` section titled `"Practice Platforms"` in Appendix E, after the Structured Reading Path (Task 4) and before the existing Python section:

```html
<h3>Practice Platforms</h3>
<p>Reading and exercises aren't enough — you need volume. These platforms give you hundreds of problems to build fluency.</p>
<ul>
<li><strong><a href="https://neetcode.io">NeetCode</a></strong> — Curated algorithm and data structure problems organized by category and difficulty. The best starting point for building problem-solving skills. Start with the "NeetCode 150" roadmap.</li>
<li><strong><a href="https://exercism.org">Exercism</a></strong> — Free coding exercises in 70+ languages with mentor feedback. Excellent for Python fluency. Complete the Python track's easy tier first.</li>
<li><strong><a href="https://leetcode.com">LeetCode</a></strong> — The largest collection of algorithm problems. Use after NeetCode to expand your range. Focus on Easy and Medium.</li>
<li><strong><a href="https://learngitbranching.js.org">Learn Git Branching</a></strong> — Interactive visual tutorial that teaches Git branching, merging, rebasing, and remote operations. Complete the "Main" section alongside Ch11, the "Remote" section alongside Ch12.</li>
<li><strong><a href="https://selectstarsql.com">Select Star SQL</a></strong> — Free interactive SQL tutorial using real data. Complete alongside Ch15 (Databases).</li>
<li><strong><a href="https://adventofcode.com">Advent of Code</a></strong> — Annual programming puzzle competition (December). Great for algorithm practice in any language.</li>
<li><strong><a href="https://projecteuler.net">Project Euler</a></strong> — Math-heavy programming challenges that build algorithmic thinking.</li>
</ul>
```

**Note:** Exercism, Advent of Code, and Project Euler may already exist in Appendix E. If so, keep the existing entries and only add the new ones (NeetCode, LeetCode, Learn Git Branching, Select Star SQL). Do not create duplicates.

### Inline Callouts

Add the following callouts to existing chapters. Each is a small `<div class="callout info">` placed at the END of the relevant chapter, before the chapter's closing `</section>`:

**Ch06 (Data Structures) in `phase-2.html`:**
```html
<div class="callout info">
<div class="callout-title">Practice: Data Structure Problems</div>
<p>Want more practice? Work through the Arrays &amp; Hashing section on <a href="https://neetcode.io">NeetCode</a>. Start with "Two Sum" and "Group Anagrams" — both use dicts (hash tables) to solve problems that would be slow with lists alone.</p>
</div>
```

**Ch09 (Error Handling, Debugging, Testing) in `phase-2.html`:**
```html
<div class="callout info">
<div class="callout-title">Practice: Build Fluency</div>
<p>Complete 5 exercises from the Python track's easy tier on <a href="https://exercism.org">Exercism</a>. For each: solve it yourself first, then ask Claude Code to solve it, then compare approaches. This "solve-then-compare" habit is how you build judgment.</p>
</div>
```

**Ch11 (Git Fundamentals) in `phase-3.html`:**
```html
<div class="callout info">
<div class="callout-title">Practice: Interactive Git</div>
<p>Complete the "Main" section of <a href="https://learngitbranching.js.org">Learn Git Branching</a>. It's an interactive visual tutorial that makes branching and merging click in a way that reading alone cannot.</p>
</div>
```

**Ch12 (Git Remote & GitHub) in `phase-3.html`:**
```html
<div class="callout info">
<div class="callout-title">Practice: Remote Git</div>
<p>Complete the "Remote" section of <a href="https://learngitbranching.js.org">Learn Git Branching</a>. It covers push, pull, fetch, and remote tracking branches with interactive visualizations.</p>
</div>
```

**Ch15 (Databases) in `phase-4.html`:**
```html
<div class="callout info">
<div class="callout-title">Practice: Interactive SQL</div>
<p>Complete <a href="https://selectstarsql.com">Select Star SQL</a> — a free interactive tutorial that teaches SQL using real data (Texas death row records). It covers SELECT, WHERE, GROUP BY, HAVING, JOIN, and subqueries. You can finish it in an afternoon.</p>
</div>
```

### Verification

- [ ] Practice Platforms section added to Appendix E (no duplicates with existing entries)
- [ ] Inline callouts added to Ch06, Ch09, Ch11, Ch12, and Ch15
- [ ] All links are correct and use `https://`
- [ ] Callouts are placed at the end of each chapter, before `</section>`
- [ ] No callout references a platform not listed in Appendix E

---

## TASK 6: Spec-Driven Development / Harper Reed Workflow

### Goal

Teach the reader the explicit workflow of brainstorm → spec → plan → execute as a repeatable process for working with AI coding agents. This is the single most important practical workflow for AI-assisted development.

### Placement

**Expand Ch22 (Level 4 — Compounding Engineering)** in `src/phase-5.html`: Add a major new subsection titled `"The Spec-Driven Workflow"`. Place it after the existing content on compounding/codification but before the chapter's exercises.

**Add prompts to Appendix B (Prompt Library)** in `src/appendices.html`.

### Ch22 Content: The Spec-Driven Workflow

This section teaches the four-step workflow:

**Step 1 — Brainstorm:**
- Start with a conversation, not code
- Ask the AI: "I want to build X. Ask me questions to understand what I need."
- The AI asks clarifying questions about scope, users, constraints, edge cases
- Output: a shared understanding of the problem

**Step 2 — Write a Spec (`spec.md`):**
- Turn the brainstorm into a written specification
- What the system does (user stories or requirements)
- What it does NOT do (explicit scope boundaries)
- Data model (what gets stored, what the structure looks like)
- API or interface design (inputs, outputs, error cases)
- Edge cases and error handling
- Acceptance criteria (how you know it's done)
- Prompt: "Based on our brainstorm, write a spec.md for this project."

**Step 3 — Generate a Plan (`prompt_plan.md`):**
- Break the spec into ordered implementation steps
- Each step is a prompt you'll give to the AI
- Steps are small enough that each one can be reviewed independently
- Prompt: "Based on this spec, write a prompt_plan.md — a numbered list of implementation prompts I'll give you one at a time."

**Step 4 — Execute step by step:**
- Give each prompt from the plan to the AI one at a time
- Review the output after each step
- Run tests after each step
- If something is wrong, fix it before moving on
- Never skip review. Never batch multiple steps.

**Why this works:**
- Each step is small and reviewable
- The spec is your source of truth, not the AI's memory
- The plan creates checkpoints — if something goes wrong, you know exactly where
- It compounds: your spec quality improves with every project

**SVG diagram:** A horizontal flow diagram showing:
`Idea → Brainstorm → spec.md → prompt_plan.md → Step 1 → Review → Step 2 → Review → ... → Done`

**Pyodide exercises:**
1. Given a badly-written spec (vague requirements, no edge cases, no acceptance criteria), identify the 5 problems and rewrite the spec. The exercise provides the bad spec as a string and asks the reader to return a dict with `{"problems": [...], "missing_sections": [...]}`.
2. Given a good spec for a simple feature (TaskForge: add task priorities), write a `generate_plan()` function that returns a list of implementation step descriptions. Test assertions check that the plan includes: data model change, API change, test updates, and documentation.

**Callout with resource links:**

```html
<div class="callout info">
<div class="callout-title">Further Reading: The Spec-Driven Approach</div>
<p>This workflow is adapted from practitioners who build production software with AI daily:</p>
<ul>
<li><a href="https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/">Harper Reed: My LLM Codegen Workflow</a> — The original spec-driven workflow that inspired this section.</li>
<li><a href="https://harper.blog/2025/05/08/basic-claude-code/">Harper Reed: Basic Claude Code</a> — Practical patterns for working with Claude Code in this workflow.</li>
<li><a href="https://harper.blog/2025/04/17/an-llm-codegen-heros-journey/">Harper Reed: An LLM Codegen Hero's Journey</a> — The progression from novice to expert AI-assisted developer.</li>
</ul>
</div>
```

### Appendix B Addition: Spec-Driven Prompts

Add a new section in the Prompt Library titled `"Spec-Driven Workflow"` with these copy-paste-ready prompts:

**Brainstorm prompt:**
```
I want to build [DESCRIPTION]. Before we write any code, I want to brainstorm the design. Ask me clarifying questions one at a time to understand: what problem this solves, who uses it, what the core features are, what it should NOT do, and what edge cases matter. Don't suggest solutions yet — just ask questions.
```

**Spec generation prompt:**
```
Based on our brainstorm, write a spec.md for this project. Include these sections:
1. Overview (one paragraph)
2. Requirements (numbered list)
3. Non-requirements (what we're explicitly NOT building)
4. Data model (what gets stored and its structure)
5. API/Interface design (inputs, outputs, errors)
6. Edge cases and error handling
7. Acceptance criteria (how we know it's done)
```

**Plan generation prompt:**
```
Based on this spec, write a prompt_plan.md. Break the implementation into numbered steps where each step is a single prompt I'll give you. Each step should:
- Be small enough to review in under 5 minutes
- Build on the previous step
- Include what to test after completing it
- Not combine unrelated changes
```

### Verification

- [ ] Spec-driven workflow section added to Ch22 with all 4 steps explained
- [ ] Flow diagram (SVG) showing the workflow is present
- [ ] At least 2 Pyodide exercises
- [ ] Harper Reed links included in a callout
- [ ] Spec-driven prompts added to Appendix B (Prompt Library)
- [ ] Prompts are in copy-paste-ready `<div class="prompt-block">` format
- [ ] Glossary updated with: spec, prompt plan, acceptance criteria

---

## TASK 7: Community Guides

### Goal

Add links to the best community-written guides for Claude Code and AI-assisted development.

### Placement

**Expand Appendix E** (`src/appendices.html`): Add entries to the existing `Claude Code` `<h3>` section.

### Content

Add the following list items to the existing Claude Code `<ul>` in Appendix E, AFTER the existing Anthropic Documentation and Claude Code CLI Docs entries:

```html
<li><strong><a href="https://sankalp.bearblog.dev/my-experience-with-claude-code-20-and-how-to-get-better-at-using-coding-agents/">Sankalp's Claude Code Guide</a></strong> &mdash; Practical tips from heavy daily use: how to structure prompts, manage context, and get consistently good output.</li>
<li><strong><a href="https://clune.org/posts/claude-code-manual/">The Missing Manual for Claude Code</a></strong> &mdash; Comprehensive reference covering features, workflows, and patterns not in the official docs.</li>
<li><strong><a href="https://www.birkey.co/2025-08-02-hacker-news-ai-coding-experience-analysis.html">HN AI Coding Experience Analysis</a></strong> &mdash; Data-driven analysis of how experienced developers actually use AI coding tools, based on Hacker News discussions.</li>
<li><strong><a href="https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/">Harper Reed: LLM Codegen Workflow</a></strong> &mdash; The spec-driven workflow (brainstorm &rarr; spec &rarr; plan &rarr; execute) that defines modern AI-assisted development.</li>
<li><strong><a href="https://harper.blog/2025/05/08/basic-claude-code/">Harper Reed: Basic Claude Code</a></strong> &mdash; Practical patterns for daily Claude Code use from an experienced practitioner.</li>
```

**Note:** The Harper Reed links also appear in Ch22 (Task 6). That's intentional — the reader may find them from either location.

### Verification

- [ ] All 5 new entries added to the Claude Code section of Appendix E
- [ ] No duplicate entries (check existing content first)
- [ ] All links use `https://`
- [ ] Descriptions are concise and describe what the reader will get from each resource

---

## TASK 8: HTML/CSS Fundamentals for API Consumers

### Goal

Give the reader enough HTML/CSS/JavaScript knowledge to connect a frontend to the Flask API they build in Ch14. This bridges the gap between "I built an API" and "I can see it in a browser."

### Placement

**Expand Ch14 (Building APIs with Flask)** in `src/phase-4.html`: Add a new subsection AFTER the main Flask API content titled `"Connecting a Frontend to Your API"`. This should come after the reader has built their API endpoints but before the chapter's closing exercises.

### Content

This section teaches the MINIMUM viable frontend knowledge. It is NOT a full HTML/CSS course. Frame it as: "You need just enough to consume your own API."

**HTML in 5 minutes:**
- HTML is a tree of nested tags that describe a document's structure
- Tags the reader needs: `<html>`, `<head>`, `<body>`, `<h1>`–`<h3>`, `<p>`, `<div>`, `<button>`, `<input>`, `<ul>`, `<li>`, `<table>`, `<tr>`, `<td>`, `<script>`
- Show a minimal HTML page (10 lines) that displays "Hello World"
- Callout: "AI generates HTML constantly. You need to read it, not master it. Focus on understanding the tree structure."

**CSS in 5 minutes:**
- CSS controls how HTML looks: colors, spacing, layout
- Three things to know: selectors (`p`, `.classname`, `#id`), properties (`color`, `margin`, `padding`, `display`), and the box model (content → padding → border → margin)
- Flexbox for layout: `display: flex`, `justify-content`, `align-items` — enough to make a simple layout
- Show 10 lines of CSS that makes the HTML page look decent
- Callout: "You don't need to write CSS from scratch. AI generates excellent CSS. You need to know enough to read it and request changes."

**JavaScript fetch() in 5 minutes:**
- `fetch()` calls your API from the browser
- Show a complete example: fetch tasks from `/tasks`, parse JSON, display them in the page
- Show a POST example: submit a form, send JSON to `/tasks`, display the response
- Handle errors: what happens when the API returns 400 or 500

**Complete working example:**
- Provide a single HTML file (~50 lines) that:
  - Has a text input and "Add Task" button
  - Fetches tasks from the Flask API and displays them as a list
  - Sends a POST request when the button is clicked
  - Updates the list without refreshing the page
- The reader should be able to save this as `index.html`, run their Flask API, and open the HTML file in a browser

**Pyodide exercises:**
1. Given an HTML string, identify the tag structure (which tags are parents of which). The exercise provides HTML as a string and asks the reader to return a dict describing the nesting.
2. Given a `fetch()` code snippet with 3 bugs (wrong URL, missing `Content-Type` header, not calling `.json()`), identify and describe the bugs.

**Callout for further learning:**

```html
<div class="callout info">
<div class="callout-title">Going Deeper: Frontend Development</div>
<p>This section teaches the minimum to consume an API. If you want to build real frontends, start with <a href="https://developer.mozilla.org/">MDN Web Docs</a> — the authoritative reference for HTML, CSS, and JavaScript. For modern frontend frameworks (React, Vue, Svelte), learn vanilla JavaScript first.</p>
</div>
```

### Verification

- [ ] HTML basics section covers tags, nesting, minimal page
- [ ] CSS basics section covers selectors, box model, flexbox
- [ ] JavaScript fetch() section covers GET, POST, error handling
- [ ] Complete working HTML example is provided (copy-paste-ready)
- [ ] At least 2 Pyodide exercises
- [ ] The section is clearly framed as "minimum viable frontend" not a full course
- [ ] MDN link included for further learning

---

## TASK 9: Web Scraping (Optional Section)

### Goal

Introduce web scraping as a natural extension of the HTTP skills taught in Ch13. This is marked OPTIONAL — build it, but frame it as supplementary content the reader can skip without missing anything in later chapters.

### Placement

**Expand Ch13 (APIs, HTTP, and Software Communication)** in `src/phase-4.html`: Add a new subsection at the END of Ch13, titled `"Optional: Web Scraping with BeautifulSoup"`. Use a visual marker to indicate it's optional:

```html
<h3>Optional: Web Scraping with BeautifulSoup</h3>
<div class="callout info">
<div class="callout-title">This Section Is Optional</div>
<p>Web scraping extends the HTTP skills from this chapter but is not required for later chapters. Skip it if you want to move forward; come back when you need to extract data from web pages.</p>
</div>
```

### Content

**What web scraping is:**
- Making HTTP requests to web pages (just like API calls) and extracting data from the HTML
- The difference: APIs return structured JSON, web pages return HTML that you parse

**When to scrape vs. when to use an API:**
- If the site has an API, use it (faster, more reliable, more polite)
- Scrape only when there's no API and the data is publicly accessible
- Warn callout: "Respect `robots.txt`, rate-limit your requests, and check terms of service. Scraping is a tool, not a right."

**BeautifulSoup basics:**
- Install: `pip install beautifulsoup4 requests`
- `requests.get(url)` to fetch the page
- `BeautifulSoup(html, 'html.parser')` to parse it
- `soup.find()`, `soup.find_all()`, `soup.select()` (CSS selectors)
- Extracting text: `.text`, `.get_text(strip=True)`
- Extracting attributes: `tag['href']`, `tag['src']`

**Practical patterns:**
- Pagination: follow "next page" links
- Rate limiting: `time.sleep()` between requests
- Error recovery: handle 404, timeouts, missing elements

**Pyodide exercises:**

Since Pyodide can't make real HTTP requests, provide pre-fetched HTML strings for the exercises:

1. Given an HTML string containing a table of data, use BeautifulSoup (available in Pyodide) to extract all rows into a list of dicts.
2. Given an HTML string containing a list of links, extract all `href` attributes and filter to only external links (starting with `https://`).
3. Given an HTML string with nested divs containing product names and prices, extract them into a structured format.

**Note:** Check if `beautifulsoup4` is available in Pyodide. If not, write the exercises using Python's built-in `html.parser` module or string operations, and note that "In a real Python environment, you'd use BeautifulSoup for this."

### Verification

- [ ] Section is clearly marked as optional
- [ ] "When to scrape vs API" guidance is present
- [ ] Ethics/rate-limiting warning callout is present
- [ ] At least 2 Pyodide exercises with pre-fetched HTML strings
- [ ] No later chapters depend on this content
- [ ] BeautifulSoup availability in Pyodide is verified or alternative approach is used

---

## TASK 10: "Solve Yourself, Then Compare to AI" Exercise Pattern

### Goal

Add a new exercise pattern throughout Phase 2 where the reader solves a problem by hand first, then sees how AI would solve it, then evaluates the differences. This builds the judgment muscle that Phases 5–6 depend on.

### Placement

Add **one "Solve & Compare" exercise** to each of these chapters in `src/phase-2.html`:
- Ch05 (Functions, Logic, Control Flow)
- Ch06 (Data Structures)
- Ch07 (Classes & OOP)
- Ch08 (Files, Modules, Standard Library)
- Ch09 (Error Handling, Debugging, Testing)

Place each exercise at the END of the chapter's interactive exercises section (as the last exercise before the chapter closes).

### Exercise Pattern

Each "Solve & Compare" exercise follows this structure:

1. **Problem statement** — A clear problem the reader can solve with what they've learned in this chapter
2. **"Your Solution" editor** — Empty Pyodide editor where the reader writes their solution
3. **"AI's Solution" reveal** — A button or second editor showing a plausible AI-generated solution (pre-written, not actually generated)
4. **"Evaluate" prompt** — Questions asking the reader to compare: What did the AI do differently? Is the AI's approach better? Are there bugs in the AI's version? Would you use the AI's approach or yours?
5. **Test assertions** — Tests that BOTH solutions must pass (verifying correctness)

### Implementation

Use a two-editor layout within a single exercise block. The second editor is hidden until the reader clicks a reveal button. Implementation approach:

```html
<div class="exercise" data-type="pyodide" data-ch="XX" data-ex="solve-compare-slug">
  <div class="exercise-header">
    <h4>Solve &amp; Compare: [Problem Name]</h4>
    <span class="exercise-status"></span>
  </div>
  <p class="exercise-prompt"><strong>Step 1:</strong> Solve this problem yourself. <strong>Step 2:</strong> Click "Show AI Solution" to see how an AI solved it. <strong>Step 3:</strong> Answer the evaluation questions in the comments.</p>
  <div class="exercise-editor">
    <script type="text/plain" class="starter-code">
# YOUR SOLUTION: [Problem description]
# Write your solution here first. Run it. Make sure it works.
# Then click "Show AI Solution" below to compare.

def your_function():
    pass

# After comparing, answer these questions in comments:
# 1. What did the AI do differently?
# 2. Is the AI's approach better, worse, or just different? Why?
# 3. Did you spot any issues in the AI's version?
</script>
    <script type="text/plain" class="test-code">
# Tests that both solutions must pass
assert your_function(test_input) == expected, "Test description"
</script>
  </div>
  <div class="exercise-controls">
    <button class="ex-run">Run</button>
    <button class="ex-check">Check</button>
    <button class="ex-hint" data-level="0">Hint</button>
    <button class="ex-reset">Reset</button>
  </div>
  <div class="exercise-output"></div>
  <div class="exercise-tests"></div>
  <div class="exercise-hints">
    <p class="hint">Solve it yourself first — don't look at the AI version yet.</p>
    <p class="hint">[Problem-specific hint]</p>
    <p class="hint"><strong>AI's Solution:</strong><br><code>[Pre-written AI solution shown here as a hint reveal]</code><br><br><strong>Evaluation:</strong> [Specific things to notice about the AI's version — e.g., "The AI used a list comprehension where you probably used a for loop. Both are correct, but the comprehension is more idiomatic Python." or "The AI forgot to handle the empty list case — did you catch that?"]</p>
  </div>
</div>
```

**Key design decision:** Use the hint system to reveal the AI's solution. Hint 1 is a nudge for the reader's own solution. Hint 2 is a stronger nudge. Hint 3 reveals the AI's solution along with evaluation guidance. This prevents the reader from seeing the AI version before attempting their own.

### Five Exercises

**Ch05 — Solve & Compare: Word Frequency Counter**
- Problem: Write `word_freq(text)` that returns a dict of word → count (case-insensitive, strip punctuation)
- AI solution to pre-write: Uses `collections.Counter` with a clean one-liner. Correct but uses a module the reader hasn't learned yet.
- Evaluation point: "The AI used `Counter` from `collections`. Your manual approach works fine. But now you know `Counter` exists — add it to your vocabulary."

**Ch06 — Solve & Compare: Flatten Nested Lists**
- Problem: Write `flatten(lst)` that flattens `[1, [2, [3, 4]], 5]` into `[1, 2, 3, 4, 5]`
- AI solution to pre-write: Uses recursion with `isinstance` check. Correct but may not handle edge cases (empty inner lists, non-list iterables).
- Evaluation point: "The AI used recursion — did you? If you used a loop with a stack, that's also valid. Notice whether the AI handles `[[]]` (nested empty list)."

**Ch07 — Solve & Compare: Bank Account Class**
- Problem: Write a `BankAccount` class with `deposit`, `withdraw` (no overdraft), and `balance` property
- AI solution to pre-write: Over-engineers with transaction history, timestamps, and a `__repr__` method. Functionally correct but violates YAGNI.
- Evaluation point: "The AI added features you didn't ask for (transaction history, timestamps). This is 'over-engineering' — one of the most common AI failure modes. Your simpler version is better for this requirement."

**Ch08 — Solve & Compare: CSV Report Generator**
- Problem: Write `generate_report(data, filename)` that takes a list of dicts and writes a CSV file. Return the number of rows written.
- AI solution to pre-write: Uses the `csv` module correctly but hardcodes column order instead of inferring from dict keys. Also doesn't handle the case where dicts have different keys.
- Evaluation point: "The AI used the `csv` module (good) but assumed all dicts have the same keys (fragile). Did your version handle mixed keys?"

**Ch09 — Solve & Compare: Retry Decorator**
- Problem: Write a `retry(max_attempts)` decorator that retries a function up to N times if it raises an exception
- AI solution to pre-write: Correct implementation but uses bare `except:` instead of `except Exception:`, catching `KeyboardInterrupt` and `SystemExit` — a subtle but real bug.
- Evaluation point: "The AI used `except:` (bare except) instead of `except Exception:`. This catches `KeyboardInterrupt`, meaning Ctrl+C won't stop your program. This is the kind of subtle bug that only someone who understands error handling can catch."

### Verification

- [ ] Five "Solve & Compare" exercises added, one per Phase 2 chapter
- [ ] Each uses the hint-reveal pattern (AI solution in Hint 3)
- [ ] Each has specific evaluation questions pointing out the key difference
- [ ] Each AI solution has a realistic, plausible flaw or notable difference
- [ ] All test assertions work for both the expected reader solution AND the AI solution (when bugs in the AI solution are fixed)
- [ ] Exercise slugs are unique: `solve-compare-wordfreq`, `solve-compare-flatten`, `solve-compare-bank`, `solve-compare-csv`, `solve-compare-retry`

---

## POST-IMPLEMENTATION CHECKLIST

After ALL 10 tasks are complete, verify:

### Cross-File Consistency

- [ ] **Sidebar sync:** Every HTML file (`index.html`, `phase-1.html` through `phase-6.html`, `appendices.html`) has IDENTICAL sidebar navigation. Run a diff of the sidebar sections across all files.
- [ ] **New appendix links:** Appendix F (DSA) and Appendix G (Algorithms) appear in ALL sidebar files under the Reference group.
- [ ] **Internal links:** Every `<a href="appendices.html#...">` link actually resolves to an existing `id` in `appendices.html`.

### Exercise Integrity

- [ ] **Unique exercise IDs:** No two exercises in the same file share a `data-ex` value. Run: search for all `data-ex="..."` attributes and check for duplicates.
- [ ] **Pyodide compatibility:** All starter code is valid Python that runs in Pyodide without import errors. Test: click "Run" on every new exercise. Standard library modules (`collections`, `json`, `csv`, `math`, `re`, `ctypes`) are available. Third-party packages are NOT (no `numpy`, `pandas`, `requests`). If an exercise needs `beautifulsoup4`, verify it's available in Pyodide or use an alternative.
- [ ] **Test assertions:** Every exercise has at least 3 test assertions in `<script class="test-code">`. Assertions have descriptive failure messages.
- [ ] **Hints:** Every exercise has 2–3 progressive hints.

### Content Quality

- [ ] **No forward references:** No concept is used before it is introduced. Verify: Task 3 (higher-order functions) comes in Ch05, and Task 10 (solve-compare exercises) in Ch05 does not assume knowledge from Task 3 content that appears later in the same chapter. If Task 3 content is placed after existing Ch05 content, any Task 10 exercise in Ch05 should not require higher-order function knowledge.
- [ ] **TaskForge references:** Every new chapter-level section references TaskForge at least once.
- [ ] **Diagrams:** Every new SVG diagram has a `<div class="diagram-caption">`.
- [ ] **Theme compatibility:** Open every modified file, toggle between light and dark themes. All new content renders correctly in both.
- [ ] **Mobile responsive:** Resize browser to 700px width. All new content is readable. Tables scroll horizontally if needed.

### Glossary Completeness

- [ ] All new technical terms from Tasks 1–10 are added to the Glossary (Appendix A). Verify each term appears:
  - Big O, time complexity, space complexity
  - Linked list, node, pointer
  - Stack, LIFO, queue, FIFO, deque
  - Hash table, hash function, collision, bucket
  - Binary search tree, tree traversal, inorder, preorder, postorder
  - Graph, directed graph, undirected graph, adjacency list, edge, vertex
  - BFS, DFS, topological sort
  - Recursion, base case, recursive case, call stack
  - Divide and conquer, merge sort, quick sort, binary search
  - Stable sort, in-place sort
  - Higher-order function, first-class function, closure, lambda, decorator
  - Spec, prompt plan, acceptance criteria
  - Web scraping (if Task 9 is built)

### Documentation Updates

- [ ] `docs/PROGRESS.md` updated with all new sections and their completion status
- [ ] `docs/DECISIONS.md` updated with any non-obvious design decisions made during implementation
- [ ] `docs/COMPONENT-REGISTRY.md` updated if any new component patterns were created

---

## SUMMARY

| Task | What | Where | New Exercises |
|------|------|-------|---------------|
| 1 | Data Structures deep dive | New Appendix F + Ch06 callouts | ~12 |
| 2 | Algorithms (sort, search, recursion, BFS/DFS) | New Appendix G + Ch06 callout | ~15 |
| 3 | Higher-order functions, closures, decorators | Expand Ch05 + Ch07 | ~7 |
| 4 | Curated book queue | Expand Appendix E | 0 |
| 5 | External practice platforms | Expand Appendix E + inline callouts | 0 |
| 6 | Spec-driven development workflow | Expand Ch22 + Appendix B | ~2 |
| 7 | Community guides | Expand Appendix E | 0 |
| 8 | HTML/CSS fundamentals for API consumers | Expand Ch14 | ~2 |
| 9 | Web scraping (optional) | Expand Ch13 | ~3 |
| 10 | "Solve yourself, then compare to AI" exercises | Ch05–Ch09 | 5 |
| **Total** | | | **~46 new exercises** |

**No new HTML files created** unless a phase file needs to be split for manageability. All changes are additions to existing files.

**No CSS or JS changes.** All new content uses existing design system classes and exercise patterns.

**No existing content modified or removed.** All changes are additive.
