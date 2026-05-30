// Kanji Mode for Japanese Trainer — quiz engine + SRS-lite + persistence
// Exposes window.KanjiMode = { init, refresh }
// Body keydown listener auto-bows-out when document.body.dataset.mode !== 'kanji'.

(function () {
  "use strict";

  const STORE = {
    filter: (axis, value) => `kt2.f.${axis}.${value}`,
    mode:   'kt2.mode',
    score:  'kt2.score',
    stats:  'kt2.stats',
  };

  const COOLDOWN = 5;
  const WRONG_BOOST = 3;
  const LEECH_THRESHOLD = 5;

  let DATA = [];
  let pool = [];
  let stats = {};
  let current = null;
  let wrongOnCurrent = false;
  let mode = 'meaning';
  let totalAnswered = 0;
  let totalCorrect = 0;
  let turn = 0;
  let initialized = false;
  let loadPromise = null;

  // Scoped element lookup: all kanji-mode IDs use the kj- prefix.
  const $ = (id) => document.getElementById('kj-' + id);
  function panel() { return document.getElementById('kanji-mode'); }
  function panelAll(sel) { const p = panel(); return p ? p.querySelectorAll(sel) : []; }

  function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function safeSet(key, v) { try { localStorage.setItem(key, v); } catch {} }

  // -------- normalize helpers --------

  function normMeaning(s) {
    return (s || '')
      .toLowerCase()
      .replace(/^(to |a |an |the )/, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
  function normReading(s) {
    return (s || '').toLowerCase().replace(/[^a-z]+/g, '');
  }

  function acceptableAnswers(entry) {
    if (mode === 'meaning') {
      const acc = new Set();
      for (const m of (entry.m || [])) {
        const n = normMeaning(m);
        if (n) acc.add(n);
        for (const w of n.split(' ')) {
          if (w.length >= 3) acc.add(w);
        }
      }
      return acc;
    }
    const acc = new Set();
    for (const r of (entry.on_r || [])) if (r) acc.add(normReading(r));
    for (const r of (entry.kun_r || [])) if (r) acc.add(normReading(r));
    return acc;
  }

  function checkInput(entry, typed) {
    const t = (mode === 'meaning') ? normMeaning(typed) : normReading(typed);
    if (!t) return { prefix: true, exact: false };
    const acc = acceptableAnswers(entry);
    let prefix = false, exact = false;
    for (const a of acc) {
      if (a === t) exact = true;
      if (a.startsWith(t)) prefix = true;
    }
    return { prefix, exact };
  }

  // -------- SRS-lite --------

  function loadStats() {
    const raw = safeGet(STORE.stats);
    if (!raw) { stats = {}; return; }
    try {
      const parsed = JSON.parse(raw);
      stats = (parsed && typeof parsed === 'object') ? parsed : {};
    } catch { stats = {}; }
  }
  function saveStats() { safeSet(STORE.stats, JSON.stringify(stats)); }

  function statFor(c) {
    if (!stats[c]) stats[c] = { correct: 0, wrong: 0, lastSeen: -Infinity, leech: false };
    return stats[c];
  }

  function recordResult(c, wasCorrect) {
    const s = statFor(c);
    if (wasCorrect) s.correct++; else s.wrong++;
    if (!s.leech && s.wrong >= LEECH_THRESHOLD && (s.wrong - s.correct) >= 3) s.leech = true;
    if (s.leech && s.correct > s.wrong) s.leech = false;
    saveStats();
  }

  function pickNext() {
    if (pool.length === 0) return null;
    turn++;
    const weights = pool.map((e) => {
      const s = statFor(e.c);
      if (turn - s.lastSeen < COOLDOWN) return 0;
      const wb = s.wrong * WRONG_BOOST;
      return (wb + 1) / (s.correct + wb + 2);
    });
    let total = 0;
    for (const w of weights) total += w;
    let idx;
    if (total === 0) {
      const candidates = pool
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => !current || e.c !== current.c);
      idx = candidates.length
        ? candidates[Math.floor(Math.random() * candidates.length)].i
        : Math.floor(Math.random() * pool.length);
    } else {
      let r = Math.random() * total;
      idx = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) { idx = i; break; }
      }
    }
    statFor(pool[idx].c).lastSeen = turn;
    return pool[idx];
  }

  // -------- score --------

  function loadScore() {
    const raw = safeGet(STORE.score);
    if (!raw) return;
    try {
      const { answered, correct } = JSON.parse(raw);
      if (Number.isFinite(answered) && Number.isFinite(correct)) {
        totalAnswered = answered; totalCorrect = correct;
      }
    } catch {}
  }
  function saveScore() {
    safeSet(STORE.score, JSON.stringify({ answered: totalAnswered, correct: totalCorrect }));
  }
  function updateCount() {
    const el = $('count');
    if (el) el.textContent = totalAnswered > 0 ? `${totalCorrect} / ${totalAnswered}` : '';
  }

  // -------- filters --------

  function freqBucket(f) {
    if (f <= 100) return '0-100';
    if (f <= 300) return '100-300';
    if (f <= 600) return '300-600';
    return '600-1000';
  }

  function loadFilters() {
    panelAll('input[data-axis]').forEach((cb) => {
      const v = safeGet(STORE.filter(cb.dataset.axis, cb.dataset.value));
      if (v === '1') cb.checked = true;
      else if (v === '0') cb.checked = false;
    });
  }
  function saveFilters() {
    panelAll('input[data-axis]').forEach((cb) => {
      safeSet(STORE.filter(cb.dataset.axis, cb.dataset.value), cb.checked ? '1' : '0');
    });
  }
  function selectedSet(axis) {
    const set = new Set();
    panelAll(`input[data-axis="${axis}"]:checked`).forEach((cb) => set.add(cb.dataset.value));
    return set;
  }

  function rebuildPool() {
    const jlpt = selectedSet('jlpt');
    const grade = selectedSet('grade');
    const freq = selectedSet('freq');
    pool = DATA.filter((k) => {
      const jKey = (k.jlpt == null) ? 'none' : String(k.jlpt);
      const gKey = (k.grade == null) ? 'none' : String(k.grade);
      const fKey = freqBucket(k.f);
      return jlpt.has(jKey) && grade.has(gKey) && freq.has(fKey);
    });
    if (pool.length === 0) {
      const m = $('message');
      if (m) m.textContent = 'No kanji match the current filters. Tick a few more options above.';
      const k = $('kanji');
      if (k) k.textContent = '—';
    }
  }

  // -------- mode (meaning / reading sub-toggle inside kanji panel) --------

  function setMode(next) {
    mode = (next === 'reading') ? 'reading' : 'meaning';
    safeSet(STORE.mode, mode);
    const mm = $('mode-meaning'), mr = $('mode-reading');
    if (mm) { mm.classList.toggle('active', mode === 'meaning'); mm.setAttribute('aria-selected', mode === 'meaning'); }
    if (mr) { mr.classList.toggle('active', mode === 'reading'); mr.setAttribute('aria-selected', mode === 'reading'); }
    const pl = $('prompt-label');
    if (pl) pl.textContent = mode === 'meaning' ? 'type the meaning (English)' : 'type a reading (romaji)';
    const ib = $('input-box');
    if (ib) ib.placeholder = mode === 'meaning' ? 'meaning…' : 'romaji…';
    if (current) renderAnswer();
  }

  // -------- rendering --------

  function makeSpan(cls, text, lang) {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    if (lang) s.lang = lang;
    s.textContent = text;
    return s;
  }
  function makeLabeledList(cls, label, items, itemLang) {
    const wrap = document.createElement('span');
    wrap.className = cls;
    wrap.append(makeSpan('label', label));
    wrap.append(makeSpan('', items.join(' · '), itemLang));
    return wrap;
  }

  function renderAnswer() {
    const a = $('answer');
    if (!a) return;
    a.textContent = '';
    if (!current) return;
    if (current.m && current.m.length) {
      a.append(makeSpan('ans-meanings', current.m.slice(0, 3).join(' · ')));
    }
    if (current.on && current.on.length) {
      a.append(makeLabeledList('ans-on', 'on', current.on, 'ja'));
    }
    if (current.kun && current.kun.length) {
      a.append(makeLabeledList('ans-kun', 'kun', current.kun, 'ja'));
    }
  }

  function appendRow(dl, term, valueNode) {
    const dt = document.createElement('dt'); dt.textContent = term;
    const dd = document.createElement('dd');
    if (valueNode instanceof Node) dd.append(valueNode); else dd.textContent = String(valueNode);
    dl.append(dt, dd);
  }
  function readingRow(label, items, romaji, kanaCls) {
    const dd = document.createElement('span');
    dd.append(makeSpan(kanaCls, items.join(' · '), 'ja'));
    dd.append(' ');
    dd.append(makeSpan('reading-romaji', '(' + romaji.join(' · ') + ')'));
    return { label, value: dd };
  }
  function renderDetails() {
    const dp = $('details-panel');
    if (!dp) return;
    if (!current) { dp.hidden = true; dp.textContent = ''; return; }
    dp.textContent = '';
    const dl = document.createElement('dl');
    appendRow(dl, 'meanings', (current.m || []).join('; '));
    if (current.on && current.on.length) {
      const r = readingRow("on'yomi", current.on, current.on_r, 'reading-on');
      appendRow(dl, r.label, r.value);
    }
    if (current.kun && current.kun.length) {
      const r = readingRow("kun'yomi", current.kun, current.kun_r, 'reading-kun');
      appendRow(dl, r.label, r.value);
    }
    if (current.s != null)     appendRow(dl, 'strokes', String(current.s));
    if (current.jlpt != null)  appendRow(dl, 'JLPT', `N${current.jlpt} (legacy)`);
    if (current.grade != null) appendRow(dl, 'grade', current.grade <= 6 ? String(current.grade) : 'JHS / general use');
    if (current.f != null)     appendRow(dl, 'freq rank', '#' + current.f);
    dp.append(dl);
    dp.hidden = false;
  }

  function updateLeechBadge() {
    const badge = $('leech-badge');
    if (!badge) return;
    if (!current) { badge.hidden = true; return; }
    const s = stats[current.c];
    if (s && s.leech) {
      badge.hidden = false;
      badge.textContent = `tricky one — missed ${s.wrong}×`;
    } else {
      badge.hidden = true;
    }
  }

  function showKanji() {
    const next = pickNext();
    if (!next) return;
    current = next;
    wrongOnCurrent = false;
    const k = $('kanji'); if (k) k.textContent = current.c;
    renderAnswer();
    renderDetails();
    const dp = $('details-panel'); if (dp) dp.hidden = true;
    const a = $('answer'); if (a) a.classList.remove('show');
    const ib = $('input-box'); if (ib) ib.value = '';
    const m = $('message'); if (m) m.textContent = '';
    updateCount();
    updateLeechBadge();
  }

  // -------- quiz cycle --------

  function showAnswer() { const a = $('answer'); if (a) a.classList.add('show'); }
  function hideAnswer() { const a = $('answer'); if (a) a.classList.remove('show'); }

  function checkAnswer() {
    if (!current) return;
    const ib = $('input-box'); if (!ib) return;
    const typed = ib.value;
    const { prefix, exact } = checkInput(current, typed);

    if (!prefix && typed.trim()) {
      if (!wrongOnCurrent) {
        wrongOnCurrent = true;
        recordResult(current.c, false);
      }
      showAnswer();
      const m = $('message');
      if (m) {
        m.textContent = '';
        const wrong = document.createElement('span'); wrong.id = 'kj-wrong'; wrong.textContent = 'not quite';
        const kbd = document.createElement('kbd'); kbd.textContent = 'space';
        m.append(wrong, ' — see the answer above, press ', kbd, ' to continue');
      }
      return;
    }
    if (exact) {
      totalAnswered++;
      if (!wrongOnCurrent) {
        totalCorrect++;
        recordResult(current.c, true);
      }
      saveScore();
      showKanji();
    }
  }

  function forceNext() {
    if (!current) { showKanji(); return; }
    if (!wrongOnCurrent) {
      recordResult(current.c, false);
      wrongOnCurrent = true;
    }
    totalAnswered++;
    saveScore();
    showKanji();
  }

  function playSound() {
    if (!current) return;
    if (!('speechSynthesis' in window)) {
      const m = $('message'); if (m) m.textContent = '(Speech synthesis not available.)';
      return;
    }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(current.c);
      u.lang = 'ja-JP';
      u.rate = 0.85;
      speechSynthesis.speak(u);
    } catch {}
    const ib = $('input-box'); if (ib) ib.focus();
  }

  function toggleDetails() {
    const dp = $('details-panel');
    if (!dp) return;
    dp.hidden = !dp.hidden;
    if (!dp.hidden) renderDetails();
  }

  // -------- init --------

  function wireEvents() {
    // Mode pill switcher
    const mm = $('mode-meaning'), mr = $('mode-reading'), ib = $('input-box');
    if (mm) mm.addEventListener('click', () => { setMode('meaning'); if (ib) ib.focus(); });
    if (mr) mr.addEventListener('click', () => { setMode('reading'); if (ib) ib.focus(); });

    // Filter checkboxes (scoped to kanji panel)
    panelAll('input[data-axis]').forEach((cb) => {
      cb.addEventListener('change', () => {
        saveFilters();
        rebuildPool();
        if (pool.length) showKanji();
      });
    });

    // Check-all / uncheck-all buttons (scoped via data-kj-action attribute)
    panelAll('button[data-kj-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.kjTarget;
        const on = btn.dataset.kjAction === 'check';
        panelAll(`input[data-axis="${target}"]`).forEach((cb) => { cb.checked = on; });
        saveFilters();
        rebuildPool();
        if (pool.length) showKanji();
      });
    });

    // Tools
    const ts = $('tool-sound'); if (ts) ts.addEventListener('click', playSound);
    const ti = $('tool-info'); if (ti) ti.addEventListener('click', toggleDetails);
    const tk = $('tool-skip'); if (tk) tk.addEventListener('click', () => { forceNext(); if (ib) ib.focus(); });

    // Kanji display: hover/tap reveals the answer
    const display = $('kanji-display');
    if (display) {
      display.addEventListener('mouseenter', showAnswer);
      display.addEventListener('mouseleave', hideAnswer);
      display.addEventListener('focus', showAnswer);
      display.addEventListener('blur', hideAnswer);
      display.addEventListener('click', () => {
        const a = $('answer');
        if (a && a.classList.contains('show')) hideAnswer();
        else showAnswer();
        if (ib) ib.focus();
      });
      display.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showAnswer(); }
      });
    }

    // Reset button
    const rs = $('reset-stats');
    if (rs) rs.addEventListener('click', () => {
      if (!confirm('Clear all per-kanji stats and the running score?')) return;
      stats = {}; totalAnswered = 0; totalCorrect = 0;
      saveStats(); saveScore(); updateCount(); updateLeechBadge();
      const m = $('message'); if (m) m.textContent = 'Stats cleared.';
    });

    // Input
    if (ib) ib.addEventListener('input', checkAnswer);
  }

  async function loadData() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        const res = await fetch('data/kanji-top1000.json', { cache: 'force-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        DATA = await res.json();
      } catch (err) {
        const m = $('message');
        if (m) m.textContent = 'Failed to load kanji data.';
        console.error('[KanjiMode] data load failed:', err);
      }
    })();
    return loadPromise;
  }

  // Body-level keyboard handler — only acts when the kanji tab is active.
  // Installed once at module load.
  document.body.addEventListener('keydown', (e) => {
    if (document.body.dataset.mode !== 'kanji') return;
    if (e.target.tagName === 'INPUT' && e.target.id !== 'kj-input-box') return;
    if (['BUTTON', 'SUMMARY', 'LABEL'].includes(e.target.tagName)) return;
    const ib = $('input-box');
    if (!ib) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (wrongOnCurrent || ib.value === '') forceNext();
      else checkAnswer();
      ib.focus();
      return;
    }
    if (e.key.length === 1 && document.activeElement !== ib) ib.focus();
  });

  async function init() {
    if (initialized) return;
    initialized = true;

    // Restore meaning/reading mode preference
    const storedMode = safeGet(STORE.mode);
    setMode(storedMode === 'reading' ? 'reading' : 'meaning');

    loadFilters();
    wireEvents();
    loadStats();
    loadScore();

    await loadData();
    rebuildPool();
    if (pool.length) showKanji();

    const ib = $('input-box');
    if (ib && document.body.dataset.mode === 'kanji') ib.focus();
  }

  function refresh() {
    // Called when the tab is re-entered; keep current state but refocus.
    const ib = $('input-box');
    if (ib && document.body.dataset.mode === 'kanji') ib.focus();
  }

  window.KanjiMode = { init, refresh };
})();
