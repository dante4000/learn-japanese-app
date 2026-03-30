# API Live Demos & Appendices Navigation Overhaul

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Try it Live" buttons to GitHub API code blocks in phase-4.html, and overhaul appendices.html with tabbed navigation, alphabetical glossary with letter bar, prompt library phase sub-tabs, and collapsible troubleshooting cards.

**Architecture:** Two new vanilla JS files (IIFE pattern, ES5) handle all interactivity. New utility CSS classes added to design-system.css per D005. HTML markup updated with data attributes and structural changes.

**Tech Stack:** HTML, CSS (design-system.css utility classes only), vanilla JavaScript (IIFE, ES5)

---

## Chunk 1: CSS + API Demo JS + Phase-4 HTML

### Task 1: Add utility CSS classes to design-system.css

**Files:**
- Modify: `src/css/design-system.css:257` (append after interactive responsive block)

- [ ] **Step 1: Add API demo styles**

Append at the end of `src/css/design-system.css`, before the final newline:

```css
/* === API LIVE DEMO (D005) === */
.api-demo{margin-top:.8rem}
.api-demo-bar{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}
.api-demo-input{font-family:var(--mono);font-size:.82rem;padding:.4rem .8rem;background:var(--code-bg);border:1px solid var(--border-accent);border-radius:6px;color:var(--text);width:180px}
.api-demo-input::placeholder{color:var(--text-muted)}
.api-demo-btn{font-family:var(--sans);font-size:.82rem;font-weight:500;padding:.45rem 1rem;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer;transition:opacity .2s}
.api-demo-btn:hover{opacity:.85}
.api-demo-btn:disabled{opacity:.5;cursor:default}
.api-demo-output{background:var(--code-bg);border:1px solid var(--border);border-radius:6px;padding:1rem;font-family:var(--mono);font-size:.82rem;line-height:1.5;white-space:pre-wrap;margin-top:.6rem;display:none;max-height:300px;overflow-y:auto;color:var(--text)}
.api-demo-output.visible{display:block}
.api-demo-output .api-error{color:var(--a5)}
.api-demo-output .api-status{color:var(--a3);font-weight:600;margin-bottom:.4rem;display:block}

/* === APPENDIX TABS (D005) === */
.app-tabs{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:1.5rem;overflow-x:auto;-webkit-overflow-scrolling:touch}
.app-tab{font-family:var(--sans);font-size:.85rem;font-weight:500;padding:.7rem 1.2rem;color:var(--text-muted);background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;white-space:nowrap;transition:color .2s,border-color .2s}
.app-tab:hover{color:var(--text-bright)}
.app-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.app-tab-panel{display:none}
.app-tab-panel.active{display:block}

/* === APPENDIX SUB-TABS (D005) === */
.app-subtabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:1.2rem;overflow-x:auto}
.app-subtab{font-family:var(--mono);font-size:.78rem;font-weight:500;padding:.5rem 1rem;color:var(--text-muted);background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;white-space:nowrap;transition:color .2s,border-color .2s}
.app-subtab:hover{color:var(--text-bright)}
.app-subtab.active{color:var(--a2);border-bottom-color:var(--a2)}
.app-subtab-panel{display:none}
.app-subtab-panel.active{display:block}

/* === GLOSSARY LETTER BAR (D005) === */
.glossary-search{width:100%;font-family:var(--mono);font-size:.85rem;padding:.5rem .8rem;background:var(--code-bg);border:1px solid var(--border-accent);border-radius:6px;color:var(--text);margin-bottom:.8rem}
.glossary-search::placeholder{color:var(--text-muted)}
.letter-bar{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:1.2rem;position:sticky;top:0;background:var(--bg);padding:.6rem 0;z-index:10}
.letter-btn{font-family:var(--mono);font-size:.78rem;font-weight:600;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;border:1px solid var(--border-accent);background:var(--bg-card);color:var(--text-muted);cursor:pointer;transition:all .2s}
.letter-btn:hover{border-color:var(--accent);color:var(--accent)}
.letter-btn.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.letter-btn.disabled{opacity:.3;cursor:default;pointer-events:none}
.letter-group-heading{font-family:var(--serif);font-size:1.4rem;color:var(--accent);padding-top:1rem}
.glossary-term{display:none}
.glossary-term.visible{display:table-row}

/* === TROUBLESHOOTING ACCORDION (D005) === */
.ts-card{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:.6rem;overflow:hidden}
.ts-card-header{display:flex;align-items:center;justify-content:space-between;padding:.8rem 1rem;cursor:pointer;transition:background .2s}
.ts-card-header:hover{background:var(--accent-glow)}
.ts-card-header h5{margin:0;font-size:.9rem;color:var(--text-bright);font-weight:600}
.ts-card-arrow{font-size:.7rem;color:var(--text-muted);transition:transform .2s}
.ts-card.open .ts-card-arrow{transform:rotate(90deg)}
.ts-card-body{display:none;padding:0 1rem 1rem;font-size:.88rem;line-height:1.6}
.ts-card.open .ts-card-body{display:block}
.ts-card-body dt{font-weight:600;color:var(--text-bright);margin-top:.5rem}
.ts-card-body dd{margin:0 0 .5rem;color:var(--text)}

/* === APPENDIX RESPONSIVE (D005) === */
@media(max-width:700px){.app-tabs{gap:0}.app-tab{padding:.5rem .8rem;font-size:.78rem}.app-subtab{padding:.4rem .7rem;font-size:.72rem}.letter-btn{width:24px;height:24px;font-size:.7rem}.api-demo-input{width:140px}.api-demo-bar{gap:.4rem}}
```

- [ ] **Step 2: Verify CSS is valid**

Open any phase HTML file in the browser. Confirm no visual regressions — existing styles unchanged. Check browser dev tools console for no CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add src/css/design-system.css
git commit -m "style: add utility classes for API demos and appendix tabs (D005)"
```

---

### Task 2: Create api-demo.js

**Files:**
- Create: `src/js/api-demo.js`

- [ ] **Step 1: Create the file**

```javascript
/* API Live Demo — adds "Try it Live" buttons to GitHub API code blocks */
(function () {
  function createOutput(container) {
    var out = container.querySelector('.api-demo-output');
    if (!out) {
      out = document.createElement('pre');
      out.className = 'api-demo-output';
      container.appendChild(out);
    }
    return out;
  }

  function showResult(out, status, body) {
    out.innerHTML = '';
    var statusSpan = document.createElement('span');
    statusSpan.className = 'api-status';
    statusSpan.textContent = 'Status: ' + status;
    out.appendChild(statusSpan);
    out.appendChild(document.createTextNode(JSON.stringify(body, null, 2)));
    out.classList.add('visible');
  }

  function showError(out, msg) {
    out.innerHTML = '';
    var errSpan = document.createElement('span');
    errSpan.className = 'api-error';
    errSpan.textContent = msg;
    out.appendChild(errSpan);
    out.classList.add('visible');
  }

  function resetBtn(btn) {
    btn.disabled = false;
    btn.textContent = 'Try it Live';
  }

  function fetchDemo(url, out, btn) {
    btn.disabled = true;
    btn.textContent = 'Loading\u2026';
    out.classList.remove('visible');

    fetch(url)
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        showResult(out, result.status, result.data);
        resetBtn(btn);
      })
      .catch(function (err) {
        showError(out, 'Request failed: ' + err.message);
        resetBtn(btn);
      });
  }

  function init() {
    var demos = document.querySelectorAll('.api-demo');
    for (var i = 0; i < demos.length; i++) {
      (function (demo) {
        var urlTemplate = demo.getAttribute('data-url');
        var input = demo.querySelector('.api-demo-input');
        var btn = demo.querySelector('.api-demo-btn');
        if (!btn) return;

        var out = createOutput(demo);

        btn.addEventListener('click', function () {
          var url = urlTemplate;
          if (input) {
            var val = input.value.trim();
            if (!val) { input.focus(); return; }
            url = urlTemplate.replace('{username}', encodeURIComponent(val));
          }
          fetchDemo(url, out, btn);
        });

        if (input) {
          input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') btn.click();
          });
        }
      })(demos[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 2: Verify file created**

Run: `ls -la src/js/api-demo.js`
Expected: file exists, ~80 lines.

- [ ] **Step 3: Commit**

```bash
git add src/js/api-demo.js
git commit -m "feat: add api-demo.js for live GitHub API buttons"
```

---

### Task 3: Add "Try it Live" buttons to phase-4.html

**Files:**
- Modify: `src/phase-4.html`

Four code blocks get live demo buttons. The localhost examples do NOT.

- [ ] **Step 1: Add demo after "Making a GET Request" code block (line ~211)**

After the `</pre>` on line 211 and before the `<p>` explanation, insert:

```html
<div class="api-demo" data-url="https://api.github.com/users/octocat">
  <div class="api-demo-bar">
    <button class="api-demo-btn">Try it Live</button>
  </div>
</div>
```

- [ ] **Step 2: Add demo after "Consuming a Public API" code block (line ~254)**

After the `</pre>` closing the "Consuming a Public API" code block and before the `<p>Always check` paragraph, insert:

```html
<div class="api-demo" data-url="https://api.github.com/users/octocat">
  <div class="api-demo-bar">
    <button class="api-demo-btn">Try it Live</button>
  </div>
</div>
```

- [ ] **Step 3: Add demo with username input after Micro-exercise 1 code block (line ~280)**

After the `</pre>` in the "Fetch a GitHub User" exercise and before the `<p>Try replacing`, insert:

```html
<div class="api-demo" data-url="https://api.github.com/users/{username}">
  <div class="api-demo-bar">
    <input class="api-demo-input" type="text" placeholder="GitHub username" value="octocat">
    <button class="api-demo-btn">Try it Live</button>
  </div>
</div>
```

- [ ] **Step 4: Add demo with username input after "Try This Now" prompt block (line ~308)**

After the closing `</div>` of the `prompt-block` for `github_repos.py` and before the `<p><strong>Verification:</strong>` paragraph, insert:

```html
<div class="api-demo" data-url="https://api.github.com/users/{username}/repos?sort=created&per_page=5">
  <div class="api-demo-bar">
    <input class="api-demo-input" type="text" placeholder="GitHub username" value="octocat">
    <button class="api-demo-btn">Try it Live</button>
  </div>
</div>
```

- [ ] **Step 5: Add script tag before closing body**

In phase-4.html, before `</body>`, add:

```html
<script src="js/api-demo.js"></script>
```

Add it after the existing shared JS script tags (after `shared.js`).

- [ ] **Step 6: Verify in browser**

Open `phase-4.html` in browser. For each "Try it Live" button:
1. Click it — should show loading state, then JSON response with green status line
2. For input versions — type a different username, press Enter or click, see different data
3. Confirm the repos demo returns an array of 5 repos
4. Confirm the Python code blocks remain unchanged and readable

- [ ] **Step 7: Commit**

```bash
git add src/phase-4.html
git commit -m "feat: add Try it Live buttons to GitHub API examples in ch13"
```

---

## Chunk 2: Appendix Tabs JS + Appendices HTML Overhaul

### Task 4: Create appendix-tabs.js

**Files:**
- Create: `src/js/appendix-tabs.js`

- [ ] **Step 1: Create the file**

```javascript
/* Appendix Tabs — tabbed navigation, glossary letter bar, sub-tabs, accordions */
(function () {
  /* Helper: iterate NodeList without NodeList.forEach (ES5 compat) */
  function each(nodeList, fn) {
    for (var i = 0; i < nodeList.length; i++) fn(nodeList[i], i);
  }

  /* --- Tab switching --- */
  function initTabs(containerSel, tabSel, panelSel) {
    var container = document.querySelector(containerSel);
    if (!container) return;
    var tabs = container.querySelectorAll(tabSel);
    var panels = container.querySelectorAll(panelSel);

    function activate(id) {
      each(tabs, function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === id);
      });
      each(panels, function (p) {
        p.classList.toggle('active', p.id === id);
      });
    }

    each(tabs, function (t) {
      t.addEventListener('click', function () {
        var id = t.getAttribute('data-tab');
        activate(id);
        history.replaceState(null, '', '#' + id);
      });
    });

    /* Activate from URL hash or default to first */
    var hash = window.location.hash.replace('#', '');
    var validIds = [];
    each(tabs, function (t) { validIds.push(t.getAttribute('data-tab')); });
    if (hash && validIds.indexOf(hash) !== -1) {
      activate(hash);
    } else if (tabs.length) {
      activate(tabs[0].getAttribute('data-tab'));
    }
  }

  /* --- Sub-tabs (prompt library phases) --- */
  function initSubTabs() {
    each(document.querySelectorAll('.app-subtabs'), function (bar) {
      var parent = bar.parentElement;
      var tabs = bar.querySelectorAll('.app-subtab');
      var panels = parent.querySelectorAll('.app-subtab-panel');

      each(tabs, function (t) {
        t.addEventListener('click', function () {
          var id = t.getAttribute('data-subtab');
          each(tabs, function (st) {
            st.classList.toggle('active', st.getAttribute('data-subtab') === id);
          });
          each(panels, function (p) {
            p.classList.toggle('active', p.getAttribute('data-subtab-panel') === id);
          });
        });
      });

      /* Default: first sub-tab active */
      if (tabs.length) tabs[0].click();
    });
  }

  /* --- Glossary: alphabetical letter bar + search --- */
  function initGlossary() {
    var section = document.getElementById('glossary-content');
    if (!section) return;

    var searchInput = section.querySelector('.glossary-search');
    var letterBar = section.querySelector('.letter-bar');
    var table = section.querySelector('.glossary-table');
    if (!table) return;

    /* Each letter's terms live in a <tbody class="letter-group"> */
    var groups = table.querySelectorAll('tbody.letter-group');
    var rows = table.querySelectorAll('tr.glossary-term');

    /* Build letter index from group ids */
    var letterMap = {};
    each(groups, function (g) {
      var id = g.id || '';
      var letter = id.replace('letter-', '');
      if (letter) letterMap[letter] = g;
    });

    /* Enable/disable letter buttons */
    if (letterBar) {
      each(letterBar.querySelectorAll('.letter-btn'), function (btn) {
        var letter = btn.getAttribute('data-letter');
        if (!letterMap[letter]) {
          btn.classList.add('disabled');
        } else {
          btn.addEventListener('click', function () {
            /* Clear search */
            if (searchInput) searchInput.value = '';
            /* Show all rows and groups */
            each(rows, function (r) { r.classList.add('visible'); });
            each(groups, function (g) { g.style.display = ''; });
            /* Scroll to letter group */
            var grp = letterMap[letter];
            if (grp) grp.scrollIntoView({ behavior: 'smooth', block: 'start' });
            /* Highlight active letter */
            each(letterBar.querySelectorAll('.letter-btn'), function (b) {
              b.classList.toggle('active', b === btn);
            });
          });
        }
      });
    }

    /* Search filter */
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.trim().toLowerCase();
        /* Clear active letter */
        if (letterBar) {
          each(letterBar.querySelectorAll('.letter-btn'), function (b) {
            b.classList.remove('active');
          });
        }
        each(rows, function (row) {
          if (!q) {
            row.classList.add('visible');
          } else {
            var text = row.textContent.toLowerCase();
            row.classList.toggle('visible', text.indexOf(q) !== -1);
          }
        });
        /* Show/hide letter groups based on whether they have visible rows */
        each(groups, function (g) {
          var visibleRows = g.querySelectorAll('tr.glossary-term.visible');
          g.style.display = visibleRows.length ? '' : 'none';
        });
      });
    }

    /* Initial: all visible */
    each(rows, function (r) { r.classList.add('visible'); });
  }

  /* --- Troubleshooting accordions --- */
  function initAccordions() {
    each(document.querySelectorAll('.ts-card-header'), function (header) {
      header.addEventListener('click', function () {
        var card = header.parentElement;
        card.classList.toggle('open');
      });
      /* Keyboard accessibility */
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }

  /* --- Init all --- */
  function init() {
    initTabs('.appendix-tabs-wrap', '.app-tab', '.app-tab-panel');
    initSubTabs();
    initGlossary();
    initAccordions();
  }

  /* Listen for hash changes (e.g., sidebar links) */
  window.addEventListener('hashchange', function () {
    var hash = window.location.hash.replace('#', '');
    var tab = document.querySelector('.app-tab[data-tab="' + hash + '"]');
    if (tab) tab.click();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 2: Verify file created**

Run: `ls -la src/js/appendix-tabs.js`
Expected: file exists, ~140 lines.

- [ ] **Step 3: Commit**

```bash
git add src/js/appendix-tabs.js
git commit -m "feat: add appendix-tabs.js for tabbed nav, glossary, accordions"
```

---

### Task 5: Restructure appendices.html — Tab wrapper + Glossary

**Files:**
- Modify: `src/appendices.html`

This is the largest task. We restructure the entire content area.

- [ ] **Step 1: Add tab bar after hero section**

Replace the opening `<div class="content-wrap">` and everything through the `<section id="glossary">` opening with a tabbed wrapper. After `</section>` closing the hero (line 94), replace:

```html
<div class="content-wrap">
```

With:

```html
<div class="content-wrap">
<div class="appendix-tabs-wrap">

<div class="app-tabs">
  <button class="app-tab active" data-tab="glossary">Glossary</button>
  <button class="app-tab" data-tab="prompt-library">Prompt Library</button>
  <button class="app-tab" data-tab="self-assessment">Self-Assessment</button>
  <button class="app-tab" data-tab="common-mistakes">Common Mistakes</button>
  <button class="app-tab" data-tab="appendix-d">Troubleshooting</button>
  <button class="app-tab" data-tab="appendix-e">Resources</button>
</div>
```

- [ ] **Step 2a: Add glossary panel wrapper, search, and letter bar**

Replace the entire `<section id="glossary">...</section>` block (lines 99-228). Start with:

```html
<div class="app-tab-panel active" id="glossary">
<h2><span class="ch-label">Appendix A</span>Glossary</h2>
<p>Every technical term used in this document. Click a letter to jump, or search to filter.</p>

<div id="glossary-content">
<input type="text" class="glossary-search" placeholder="Search terms..." aria-label="Filter glossary terms">

<div class="letter-bar" role="navigation" aria-label="Jump to letter">
  <button class="letter-btn" data-letter="A">A</button>
  <button class="letter-btn" data-letter="B">B</button>
  <button class="letter-btn" data-letter="C">C</button>
  <button class="letter-btn" data-letter="D">D</button>
  <button class="letter-btn" data-letter="E">E</button>
  <button class="letter-btn" data-letter="F">F</button>
  <button class="letter-btn" data-letter="G">G</button>
  <button class="letter-btn" data-letter="H">H</button>
  <button class="letter-btn" data-letter="I">I</button>
  <button class="letter-btn" data-letter="J">J</button>
  <button class="letter-btn" data-letter="K">K</button>
  <button class="letter-btn" data-letter="L">L</button>
  <button class="letter-btn" data-letter="M">M</button>
  <button class="letter-btn" data-letter="N">N</button>
  <button class="letter-btn" data-letter="O">O</button>
  <button class="letter-btn" data-letter="P">P</button>
  <button class="letter-btn" data-letter="Q">Q</button>
  <button class="letter-btn" data-letter="R">R</button>
  <button class="letter-btn" data-letter="S">S</button>
  <button class="letter-btn" data-letter="T">T</button>
  <button class="letter-btn" data-letter="U">U</button>
  <button class="letter-btn" data-letter="V">V</button>
  <button class="letter-btn" data-letter="W">W</button>
  <button class="letter-btn" data-letter="X">X</button>
  <button class="letter-btn" data-letter="Y">Y</button>
  <button class="letter-btn" data-letter="Z">Z</button>
</div>

<table class="glossary-table">
<thead><tr><th>Term</th><th>Definition</th><th>First Used</th></tr></thead>
```

- [ ] **Step 2b: Add all glossary terms sorted alphabetically**

Extract every term row from the existing 6 domain tables (Programming Fundamentals, Tools & Environment, Git & Version Control, APIs & Web, AI Coding Tools, Multi-Agent Concepts). Copy each term's `<td>` definition text verbatim from the existing source. Sort all terms alphabetically and group by first letter.

Each letter group uses a separate `<tbody class="letter-group" id="letter-X">` so the JS can show/hide entire groups during search. The heading row has class `letter-group-heading`. Term rows have class `glossary-term visible`.

Correct alphabetical order (letters with no terms — K, Q, U, X, Y, Z — are omitted from HTML but their letter-bar buttons remain and will be auto-disabled by JS):

```html
<tbody class="letter-group" id="letter-A">
<tr><td colspan="3" class="letter-group-heading">A</td></tr>
<tr class="glossary-term visible"><td><strong>Abstraction</strong></td><td>Hiding complexity behind a simpler interface. Each programming layer hides the one below it.</td><td>Ch 1</td></tr>
<tr class="glossary-term visible"><td><strong>Agent IDE (L2)</strong></td><td>Chat interface connected to your codebase. Produces multi-file edits from natural language.</td><td>Ch 20</td></tr>
<tr class="glossary-term visible"><td><strong>Agent Teams (L8)</strong></td><td>Experimental: agents with peer-to-peer coordination via shared mailbox.</td><td>Ch 27</td></tr>
<tr class="glossary-term visible"><td><strong>API</strong></td><td>Application Programming Interface. A contract defining how software components communicate.</td><td>Ch 13</td></tr>
<tr class="glossary-term visible"><td><strong>Assertion</strong></td><td>A statement that verifies a condition is true. Used in tests: <code>assert result == expected</code>.</td><td>Ch 8</td></tr>
</tbody>

<tbody class="letter-group" id="letter-B">
<tr><td colspan="3" class="letter-group-heading">B</td></tr>
<tr class="glossary-term visible"><td><strong>Backend</strong></td><td>The server-side part of a web application &mdash; processes requests, enforces business rules, talks to databases.</td><td>Ch 01</td></tr>
<tr class="glossary-term visible"><td><strong>Backpressure (L6)</strong></td><td>Automated feedback (linters, tests, hooks) that lets agents self-correct without human review.</td><td>Ch 24</td></tr>
<tr class="glossary-term visible"><td><strong>Branch</strong></td><td>A parallel line of development. <code>main</code> is the default. Feature branches isolate work.</td><td>Ch 11</td></tr>
</tbody>

<tbody class="letter-group" id="letter-C">
<tr><td colspan="3" class="letter-group-heading">C</td></tr>
<tr class="glossary-term visible"><td><strong>CI/CD</strong></td><td>Continuous Integration / Continuous Deployment. Automated build, test, and deploy pipelines.</td><td>Ch 17</td></tr>
<tr class="glossary-term visible"><td><strong>Class</strong></td><td>A blueprint for creating objects that bundles data (attributes) and behavior (methods) together.</td><td>Ch 07</td></tr>
<tr class="glossary-term visible"><td><strong>CLAUDE.md</strong></td><td>Persistent instruction file read by Claude Code at session start. Project-specific rules and context.</td><td>Ch 21</td></tr>
<tr class="glossary-term visible"><td><strong>Clone</strong></td><td>Create a local copy of a remote repository, including its full history.</td><td>Ch 12</td></tr>
<tr class="glossary-term visible"><td><strong>Codify</strong></td><td>Turn a lesson into a persistent rule (CLAUDE.md, rules file, skill, docs).</td><td>Ch 22</td></tr>
<tr class="glossary-term visible"><td><strong>Commit</strong></td><td>A snapshot of your project at a point in time. Has a message describing what changed.</td><td>Ch 11</td></tr>
<tr class="glossary-term visible"><td><strong>Compiler</strong></td><td>A program that translates your entire source code into machine code before execution (e.g., Rust, C).</td><td>Ch 1</td></tr>
<tr class="glossary-term visible"><td><strong>Compounding engineering (L4)</strong></td><td>The practice of codifying lessons so each session improves future sessions.</td><td>Ch 22</td></tr>
<tr class="glossary-term visible"><td><strong>Constraint-based prompting</strong></td><td>Telling the model what success looks like (constraints) instead of step-by-step instructions.</td><td>Ch 24</td></tr>
<tr class="glossary-term visible"><td><strong>Constructor (__init__)</strong></td><td>The special method called automatically when a new instance of a class is created.</td><td>Ch 07</td></tr>
<tr class="glossary-term visible"><td><strong>Container</strong></td><td>A running instance of a Docker image; an isolated process with its own filesystem, network, and dependencies.</td><td>Ch 16</td></tr>
<tr class="glossary-term visible"><td><strong>Context engineering (L3)</strong></td><td>Controlling what the model sees so every token does useful work.</td><td>Ch 21</td></tr>
<tr class="glossary-term visible"><td><strong>Context window</strong></td><td>The total amount of text (tokens) a model can process at once. Has a fixed budget.</td><td>Ch 21</td></tr>
<tr class="glossary-term visible"><td><strong>Control flow</strong></td><td>The order in which statements execute: sequential, conditional (if/else), or looping (for/while).</td><td>Ch 5</td></tr>
</tbody>
```

Continue this exact pattern for letters D through W. For each term, copy the definition `<td>` content verbatim from the existing 6 domain tables in `appendices.html` lines 104-227. The correct alphabetical order for remaining letters:

**D:** Data structure, Data type, Database, Diff, Dispatch (L7), Docker, docker-compose, Dockerfile
**E:** Endpoint, Environment variable, Exception
**F:** f-string, Flask, Fork, Frontend, Function
**G:** .gitignore
**H:** Harness, Hook, HTTP, Hub-and-spoke
**I:** IDE, Image, Inheritance, Instance, Instruction scaffold, Interpreter, iTerm2
**J:** JSON, JSON API
**L:** Large language model (LLM), List Comprehension
**M:** MCP, Merge, Merge conflict, Method, Module, Multi-model dispatch
**N:** Non-deterministic
**O:** Object, ORM
**P:** Package manager, Parameter, PATH, Peer-to-peer, Pipe ( | ), Pre-commit hook, Pull, Pull Request, Push
**R:** Ralph Loop, Remote, REPL, Repository (repo), REST, REST API, Return value, Route
**S:** Scope, self, Skill, SQL, SQLite, SSH Key, Standard library, Status code, Subagent
**T:** Tab complete (L1), Terminal / Shell, Test-driven development (TDD)
**V:** Variable, Virtual Environment, Volume (Docker)
**W:** Worktree

- [ ] **Step 2c: Close the glossary table and panel**

```html
</table>
</div><!-- /glossary-content -->
</div><!-- /glossary panel -->
```

- [ ] **Step 3: Verify glossary renders**

Open `appendices.html` in browser. Confirm:
1. Letter bar appears with clickable letters
2. K, Q, U, X, Y, Z are dimmed (no terms)
3. Clicking "D" scrolls to Docker/Data type area
4. Typing "flask" in search box filters to Flask row only
5. Clearing search restores all terms

- [ ] **Step 4: Commit**

```bash
git add src/appendices.html
git commit -m "feat: restructure glossary as alphabetical with letter bar and search"
```

---

### Task 6: Restructure Prompt Library with phase sub-tabs

**Files:**
- Modify: `src/appendices.html`

- [ ] **Step 1: Wrap prompt library in tab panel with sub-tabs**

Replace the entire `<section id="prompt-library">...</section>` (from the `<!-- ===== PROMPT LIBRARY ===== -->` comment through the closing `</section>` before `<!-- ===== SELF-ASSESSMENT ===== -->`) with:

```html
<div class="app-tab-panel" id="prompt-library">
<h2><span class="ch-label">Appendix B</span>Prompt Library</h2>
<p>All prompts, patterns, and templates from the document, organized by phase. Copy-paste ready.</p>

<div class="app-subtabs">
  <button class="app-subtab active" data-subtab="pl-p1">Phase 1</button>
  <button class="app-subtab" data-subtab="pl-p2">Phase 2</button>
  <button class="app-subtab" data-subtab="pl-p3">Phase 3</button>
  <button class="app-subtab" data-subtab="pl-p4">Phase 4</button>
  <button class="app-subtab" data-subtab="pl-p5">Phase 5</button>
  <button class="app-subtab" data-subtab="pl-p6">Phase 6</button>
</div>

<div class="app-subtab-panel active" data-subtab-panel="pl-p1">
<h3>Phase 1 — Foundations</h3>
<!-- Existing Phase 1 prompt blocks (Ch 3, Ch 4) go here unchanged -->
</div>

<div class="app-subtab-panel" data-subtab-panel="pl-p2">
<h3>Phase 2 — Python</h3>
<!-- Existing Phase 2 prompt blocks (Ch 5, Ch 09, Ch 08, Ch 6, Ch 09) go here unchanged -->
</div>

<div class="app-subtab-panel" data-subtab-panel="pl-p3">
<h3>Phase 3 — Development Tools</h3>
<!-- Existing Phase 3 prompt blocks (Ch 10, Ch 11, Ch 12) go here unchanged -->
</div>

<div class="app-subtab-panel" data-subtab-panel="pl-p4">
<h3>Phase 4 — Building &amp; Deploying</h3>
<!-- Existing Phase 4 prompt blocks (Ch 13, Ch 14, Ch 16) go here unchanged -->
</div>

<div class="app-subtab-panel" data-subtab-panel="pl-p5">
<h3>Phase 5 — Levels 1&ndash;5</h3>
<!-- Existing Phase 5 prompt blocks (Ch 19, Ch 20, Ch 21, Ch 23) go here unchanged -->
</div>

<div class="app-subtab-panel" data-subtab-panel="pl-p6">
<h3>Phase 6 — Levels 6&ndash;8</h3>
<!-- Existing Phase 6 prompt blocks (Ch 24, Ch 25, Ch 27) go here unchanged -->
</div>
</div><!-- /prompt-library panel -->
```

Move each phase's existing prompt `<h4>` + `<div class="prompt-block">` blocks into their respective sub-tab panel. Content stays exactly the same — only the wrapper changes.

- [ ] **Step 2: Verify sub-tabs work**

Open `appendices.html`, click "Prompt Library" tab. Confirm:
1. Six sub-tabs appear (Phase 1 through Phase 6)
2. Only Phase 1 content visible initially
3. Clicking Phase 4 shows the Flask/Docker/API prompts
4. Copy buttons still work on prompt blocks

- [ ] **Step 3: Commit**

```bash
git add src/appendices.html
git commit -m "feat: add phase sub-tabs to prompt library appendix"
```

---

### Task 7: Wrap remaining sections as tab panels + troubleshooting accordions

**Files:**
- Modify: `src/appendices.html`

- [ ] **Step 1: Wrap Self-Assessment as tab panel**

Change `<section id="self-assessment">` to `<div class="app-tab-panel" id="self-assessment">` and its closing `</section>` to `</div>`. Content inside stays unchanged.

- [ ] **Step 2: Wrap Common Mistakes as tab panel**

Change `<section id="common-mistakes">` to `<div class="app-tab-panel" id="common-mistakes">` and its closing `</section>` to `</div>`. Content stays unchanged.

- [ ] **Step 3: Convert Troubleshooting to tab panel with accordion cards**

Replace the entire `<section id="appendix-d">...</section>` with a tab panel. Convert each table row into a collapsible card.

The wrapper:

```html
<div class="app-tab-panel" id="appendix-d">
<h2><span class="ch-label">Appendix D</span>Troubleshooting</h2>
<p>Common issues organized by phase. Click an issue to expand the cause and fix.</p>
```

For each phase group (Phase 1, 2, 3, 4, 5), output a `<h3>` heading, then convert each table row to:

```html
<div class="ts-card">
  <div class="ts-card-header">
    <h5>[Issue title, e.g., "Python not found"]</h5>
    <span class="ts-card-arrow">&#9654;</span>
  </div>
  <div class="ts-card-body">
    <dl>
      <dt>Symptom</dt>
      <dd>[symptom text]</dd>
      <dt>Cause</dt>
      <dd>[cause text]</dd>
      <dt>Fix</dt>
      <dd>[fix text, preserve any <code> and <a> tags]</dd>
    </dl>
  </div>
</div>
```

Close with `</div><!-- /appendix-d panel -->`.

- [ ] **Step 4: Wrap Resources as tab panel**

Change `<section id="appendix-e">` to `<div class="app-tab-panel" id="appendix-e">` and its closing `</section>` to `</div>`. Content stays unchanged.

- [ ] **Step 5: Close the tab wrapper**

After the Resources panel closing `</div>`, add:

```html
</div><!-- /appendix-tabs-wrap -->
```

This should come before the `<nav class="phase-nav">`.

- [ ] **Step 6: Add script tag**

Before `</body>`, add after the existing shared JS script tags:

```html
<script src="js/appendix-tabs.js"></script>
```

- [ ] **Step 7: Verify everything in browser**

Open `appendices.html`:
1. Six tabs visible at top — Glossary active by default
2. Click each tab — correct content appears, others hidden
3. URL hash updates when clicking tabs
4. Navigating to `appendices.html#prompt-library` directly opens Prompt Library tab
5. Sidebar links (`#glossary`, `#prompt-library`, etc.) activate the correct tab
6. Troubleshooting cards are all collapsed — clicking one expands it
7. Keyboard: Tab to a troubleshooting header, press Enter — it opens
8. Mobile (700px): tabs scroll horizontally, sub-tabs wrap correctly

- [ ] **Step 8: Verify line count**

Run: `wc -l src/appendices.html`
Expected: under 1200 lines (CLAUDE.md rule 16). The conversion from tables to accordion cards and removal of duplicate header rows should keep size manageable.

- [ ] **Step 9: Commit**

```bash
git add src/appendices.html
git commit -m "feat: complete appendix overhaul — tabs, accordions, sub-tabs"
```

---

### Task 8: Final integration check

- [ ] **Step 1: Cross-file verification**

Open each file in browser:
1. `phase-4.html` — "Try it Live" buttons work, no JS errors in console
2. `appendices.html` — all 6 tabs work, glossary search works, prompt sub-tabs work, troubleshooting accordions work
3. `index.html` — landing page unaffected
4. Other phase files — unaffected

- [ ] **Step 2: Mobile check**

Resize browser to 700px width:
1. API demo buttons and inputs don't overflow
2. Tab bar scrolls horizontally
3. Letter bar wraps properly
4. Accordion cards full width

- [ ] **Step 3: Theme check**

Toggle light/dark theme on appendices.html:
1. Tab active state visible in both themes
2. Glossary search input readable in both themes
3. Letter buttons contrast sufficient in both themes
4. Accordion cards readable in both themes

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final integration verification for API demos and appendix overhaul"
```
