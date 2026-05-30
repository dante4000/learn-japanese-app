// Words Trainer — Anki-style spaced-repetition vocabulary deck.
// Name-only login; per-user SRS state persisted to Vercel Blob (via
// /api/state) with a localStorage cache for instant load + offline resilience.

(function () {
  "use strict";

  /* ---------------- constants ---------------- */
  const MIN = 60 * 1000, DAY = 24 * 60 * MIN;
  const LEARN_STEPS = [1 * MIN, 10 * MIN];   // learning steps (minutes)
  const GRADUATE = 1 * DAY;                  // interval after graduating with Good
  const EASY_GRAD = 4 * DAY;                 // interval when Easy from learning
  const MIN_EASE = 1.3, START_EASE = 2.5;
  const HARD_MULT = 1.2, EASY_BONUS = 1.3;
  const COOLDOWN = 4;                        // avoid repeating a card within N picks
  const SAVE_DEBOUNCE = 1500;                // ms to debounce Blob pushes
  const STATE_V = 1;

  const LS = {
    user: "wt.user",
    cache: (u) => `wt.cache.${u}`,
    filter: (dim, val) => `wt.filter.${dim}.${val}`,
  };

  const $ = (id) => document.getElementById(id);
  const idOf = (e) => e.w + "|" + e.r;
  const slug = (name) => String(name || "").normalize("NFKC").trim().toLowerCase()
    .replace(/\s+/g, "-").replace(/[^a-z0-9_-]+/g, "").replace(/^-+|-+$/g, "").slice(0, 40);

  function lsGet(k){ try { return localStorage.getItem(k); } catch { return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); } catch {} }
  function lsDel(k){ try { localStorage.removeItem(k); } catch {} }

  /* ---------------- state ---------------- */
  let user = "";                  // slug of current user ("" = logged out)
  let displayName = "";           // raw name as typed
  let srs = {};                   // id -> { ease, interval, due, reps, lapses, stage, step }
  let session = { reviewed: 0, again: 0, correct: 0 };
  let pool = [], current = null, flipped = false, recent = [];
  let initialized = false, saveTimer = null, dirty = false, ready = false;
  let saveVersion = 0, pushInFlight = false;

  function stateFor(id){
    if (!srs[id]) srs[id] = { ease: START_EASE, interval: 0, due: 0, reps: 0, lapses: 0, stage: "new", step: 0 };
    return srs[id];
  }

  /* ---------------- scheduler (SM-2 + learning steps) ---------------- */
  function applyGrade(id, grade){
    const s = stateFor(id), t = Date.now();
    if (s.stage === "new" || s.stage === "learning"){
      if (s.stage === "new"){ s.stage = "learning"; s.step = 0; }
      if (grade === 0){ s.step = 0; s.due = t + LEARN_STEPS[0]; }
      else if (grade === 1){ s.due = t + LEARN_STEPS[Math.min(s.step, LEARN_STEPS.length - 1)]; }
      else if (grade === 2){
        s.step += 1;
        if (s.step >= LEARN_STEPS.length){ s.stage = "review"; s.interval = GRADUATE; s.due = t + GRADUATE; s.reps += 1; }
        else s.due = t + LEARN_STEPS[s.step];
      } else { s.stage = "review"; s.interval = EASY_GRAD; s.due = t + EASY_GRAD; s.reps += 1; }
    } else { // review
      if (grade === 0){
        s.lapses += 1; s.ease = Math.max(MIN_EASE, s.ease - 0.2);
        s.stage = "learning"; s.step = 0; s.interval = 0; s.due = t + LEARN_STEPS[0];
      } else if (grade === 1){
        s.ease = Math.max(MIN_EASE, s.ease - 0.15);
        s.interval = Math.max(MIN, s.interval * HARD_MULT); s.due = t + s.interval; s.reps += 1;
      } else if (grade === 2){
        s.interval = Math.max(MIN, s.interval * s.ease); s.due = t + s.interval; s.reps += 1;
      } else {
        s.ease += 0.15;
        s.interval = Math.max(MIN, s.interval * s.ease * EASY_BONUS); s.due = t + s.interval; s.reps += 1;
      }
    }
    session.reviewed += 1;
    if (grade === 0) session.again += 1; else session.correct += 1;
    scheduleSave();
  }

  function fmtMs(ms){
    if (ms < 60 * MIN) return Math.max(1, Math.round(ms / MIN)) + "m";
    if (ms < DAY)      return Math.max(1, Math.round(ms / (60 * MIN))) + "h";
    if (ms < 30 * DAY) return Math.max(1, Math.round(ms / DAY)) + "d";
    if (ms < 365 * DAY) return Math.max(1, Math.round(ms / (30 * DAY))) + "mo";
    return Math.max(1, Math.round(ms / (365 * DAY))) + "y";
  }
  function previewInterval(id, grade){
    const s = stateFor(id);
    if (s.stage === "new" || s.stage === "learning"){
      if (grade === 0) return fmtMs(LEARN_STEPS[0]);
      if (grade === 1) return fmtMs(LEARN_STEPS[Math.min(s.step, LEARN_STEPS.length - 1)]);
      if (grade === 2){ const ns = s.step + 1; return ns >= LEARN_STEPS.length ? fmtMs(GRADUATE) : fmtMs(LEARN_STEPS[ns]); }
      return fmtMs(EASY_GRAD);
    }
    if (grade === 0) return fmtMs(LEARN_STEPS[0]);
    if (grade === 1) return fmtMs(Math.max(MIN, s.interval * HARD_MULT));
    if (grade === 2) return fmtMs(Math.max(MIN, s.interval * s.ease));
    return fmtMs(Math.max(MIN, s.interval * s.ease * EASY_BONUS));
  }

  /* ---------------- lazy data load ---------------- */
  // words-data.js (~250 KB) is fetched on first Words-mode entry to keep the
  // Kana/Kanji users off that bandwidth.
  let wordsLoadPromise = null;
  function ensureWordsLoaded(){
    if (typeof WORDS !== "undefined") return Promise.resolve();
    if (wordsLoadPromise) return wordsLoadPromise;
    wordsLoadPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "words-data.js";
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("words-data.js failed to load"));
      document.head.appendChild(s);
    });
    return wordsLoadPromise;
  }

  /* ---------------- filters + pool ---------------- */
  function loadFilters(){
    document.querySelectorAll("input.wfilter").forEach((cb) => {
      const v = lsGet(LS.filter(cb.dataset.dim, cb.value));
      if (v === "1") cb.checked = true; else if (v === "0") cb.checked = false;
    });
  }
  function saveFilters(){
    document.querySelectorAll("input.wfilter").forEach((cb) => {
      lsSet(LS.filter(cb.dataset.dim, cb.value), cb.checked ? "1" : "0");
    });
  }
  function activeSet(dim){
    const set = new Set();
    document.querySelectorAll(`input.wfilter[data-dim="${dim}"]`).forEach((cb) => { if (cb.checked) set.add(cb.value); });
    return set;
  }
  function buildPool(){
    if (typeof WORDS === "undefined") return [];
    const s = activeSet("s"), lvl = activeSet("lvl"), pos = activeSet("pos");
    return WORDS.filter((e) => s.has(e.s) && lvl.has(e.lvl) && pos.has(e.pos));
  }
  function pickNext(){
    if (!pool.length) return null;
    const t = Date.now();
    const notRecent = (e) => !recent.includes(idOf(e)) || pool.length <= recent.length;
    const due = pool.map((e) => ({ e, s: srs[idOf(e)] }))
      .filter(({ s }) => s && s.stage !== "new" && s.due <= t)
      .sort((a, b) => a.s.due - b.s.due).map(({ e }) => e).filter(notRecent);
    if (due.length) return due[0];
    const fresh = pool.filter((e) => !srs[idOf(e)]).filter(notRecent);
    if (fresh.length) return fresh[0];
    const ahead = pool.map((e) => ({ e, s: stateFor(idOf(e)) }))
      .sort((a, b) => a.s.due - b.s.due).map(({ e }) => e).filter(notRecent);
    return ahead[0] || pool[0];
  }
  function poolCounts(){
    const t = Date.now(); let neu = 0, due = 0;
    for (const e of pool){
      const s = srs[idOf(e)];
      if (!s) neu++;
      else if (s.stage === "learning" || s.due <= t) due += (s.due <= t ? 1 : 0);
    }
    return { total: pool.length, neu, due };
  }

  /* ---------------- persistence (Blob + localStorage cache) ---------------- */
  function snapshot(){ return { v: STATE_V, srs, session, updatedAt: Date.now() }; }

  function writeCache(){ if (user) lsSet(LS.cache(user), JSON.stringify(snapshot())); }
  function readCache(){
    if (!user) return null;
    try { return JSON.parse(lsGet(LS.cache(user)) || "null"); } catch { return null; }
  }

  function setSync(text, kind){
    const el = $("sync-status");
    if (!el) return;
    el.textContent = text || "";
    el.dataset.kind = kind || "";
  }

  function markDirty(){
    dirty = true;
    saveVersion += 1;
    writeCache();
  }

  function scheduleSave(){
    markDirty();
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(pushBlob, SAVE_DEBOUNCE);
  }

  async function pushBlob(opts){
    if (!user || !dirty) return;
    if (pushInFlight) return;

    pushInFlight = true;
    const startedVersion = saveVersion;
    setSync("saving…", "busy");
    const payload = snapshot();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, state: payload }),
        keepalive: !!(opts && opts.keepalive),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      if (saveVersion === startedVersion) {
        dirty = false;
        setSync("saved", "ok");
      }
    } catch {
      setSync("saved locally", "warn"); // cache already written; will retry on next change
    } finally {
      pushInFlight = false;
      if (dirty && saveVersion !== startedVersion && !(opts && opts.keepalive)) {
        pushBlob();
      }
    }
  }

  async function loadUserState(){
    ready = false;
    setSync("loading…", "busy");
    const cache = readCache();
    let remote = null;
    let status = 0;
    try {
      const res = await fetch("/api/state?user=" + encodeURIComponent(user), { cache: "no-store" });
      status = res.status;
      if (res.ok) { const data = await res.json(); remote = data && data.state; }
    } catch { /* offline / file:// — fall back to cache */ }

    let chosen = null, source = "fresh";
    if (remote && cache){ chosen = (remote.updatedAt || 0) >= (cache.updatedAt || 0) ? remote : cache; source = chosen === remote ? "cloud" : "local"; }
    else if (remote){ chosen = remote; source = "cloud"; }
    else if (cache){ chosen = cache; source = "local"; }

    srs = (chosen && chosen.srs && typeof chosen.srs === "object") ? chosen.srs : {};
    session = (chosen && chosen.session && typeof chosen.session === "object") ? chosen.session : { reviewed: 0, again: 0, correct: 0 };

    if (source === "local"){ markDirty(); pushBlob(); }
    else { dirty = false; writeCache(); }
    ready = true;
    setSync(remote ? "synced" : (status === 0 ? "offline" : "new"), remote || status === 200 ? "ok" : "warn");
    return { ok: true, status };
  }

  /* ---------------- flashcard UI ---------------- */
  function refreshPool(){ pool = buildPool(); }

  function updateSummary(){
    const c = poolCounts();
    const sum = $("pool-summary");
    if (sum) sum.textContent = pool.length
      ? `${c.total} words match — ${c.neu} new, ${c.due} due now`
      : "No words match the current filters. Check at least one box in each group.";
    const foot = $("fc-count");
    if (foot) foot.textContent = `${session.reviewed} reviewed`;
  }
  function renderBadges(e){
    const host = $("fc-badges");
    host.textContent = "";
    if (!e) return;
    for (const text of [e.lvl, e.pos, e.s]) {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = text;
      host.append(span);
    }
  }

  function showCard(){
    refreshPool();
    current = pickNext();
    flipped = false;
    const back = $("fc-back"), grades = $("fc-grades"), hint = $("fc-hint");
    back.hidden = true; grades.hidden = true; hint.hidden = false;
    if (!current){
      $("fc-word").textContent = "—";
      hint.textContent = "No cards match the filters. Adjust them below.";
      renderBadges(null); updateSummary(); return;
    }
    renderBadges(current);
    $("fc-word").textContent = current.w;
    $("fc-reading").textContent = current.r;
    $("fc-romaji").textContent = current.o;
    $("fc-meaning").textContent = current.m;
    hint.textContent = "Tap the card (or press Space) to reveal.";
    updateSummary();
  }
  function flip(){
    if (!current || flipped) return;
    flipped = true;
    $("fc-back").hidden = false;
    $("fc-hint").hidden = true;
    const g = $("fc-grades"); g.hidden = false;
    const id = idOf(current);
    g.querySelectorAll(".grade-when").forEach((el) => { el.textContent = previewInterval(id, Number(el.dataset.when)); });
  }
  function grade(g){
    if (!current || !flipped) return;
    const id = idOf(current);
    applyGrade(id, g);
    recent.push(id); if (recent.length > COOLDOWN) recent.shift();
    showCard();
  }
  function skip(){
    if (!current) return;
    const id = idOf(current);
    recent.push(id); if (recent.length > COOLDOWN) recent.shift();
    showCard();
  }
  function playSound(){
    if (!current || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(current.w);
      u.lang = "ja-JP"; u.rate = 0.9; speechSynthesis.speak(u);
    } catch {}
  }

  /* ---------------- login UI ---------------- */
  function showLogin(){
    $("words-login").hidden = false;
    $("flashcard").hidden = true;
    $("words-options").hidden = true;
    $("words-user").hidden = true;
    const inp = $("login-name");
    if (inp){ inp.value = displayName || ""; if (document.body.dataset.mode === "words") inp.focus(); }
  }
  function showDeck(){
    $("words-login").hidden = true;
    $("flashcard").hidden = false;
    $("words-options").hidden = false;
    $("words-user").hidden = false;
    $("words-user-name").textContent = displayName || user;
  }

  async function doLogin(name){
    const raw = String(name || "").trim();
    const u = slug(raw);
    const msg = $("login-msg");
    if (msg) msg.textContent = "";
    if (!u){ if (msg) msg.textContent = "Please enter a name (letters or numbers)."; return; }
    user = u; displayName = raw;
    lsSet(LS.user, JSON.stringify({ user, displayName }));
    showDeck();
    $("fc-word").textContent = "…";
    $("fc-hint").textContent = "Loading deck…";
    try { await ensureWordsLoaded(); }
    catch { $("fc-hint").textContent = "Could not load vocabulary data."; return; }
    $("fc-hint").textContent = "Loading your deck…";
    recent = [];
    await loadUserState();
    showCard();
  }
  function signOut(){
    if (dirty) pushBlob({ keepalive: true });
    user = ""; displayName = ""; srs = {}; session = { reviewed: 0, again: 0, correct: 0 }; ready = false;
    lsDel(LS.user);
    setSync("", "");
    showLogin();
  }

  async function deleteAccount(){
    if (!user) return;
    if (!confirm("Delete your saved progress? This cannot be undone.")) return;
    setSync("deleting…", "busy");
    try {
      const res = await fetch("/api/state?user=" + encodeURIComponent(user), { method: "DELETE" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      // wipe local cache too
      lsDel(LS.cache(user));
      lsDel(LS.user);
      user = ""; displayName = "";
      srs = {}; session = { reviewed: 0, again: 0, correct: 0 }; ready = false;
      setSync("", "");
      showLogin();
      const msg = $("login-msg");
      if (msg) msg.textContent = "Your data has been deleted.";
    } catch {
      setSync("delete failed", "warn");
    }
  }

  /* ---------------- init / wiring ---------------- */
  function initWords(){
    if (initialized) return; initialized = true;
    loadFilters();

    // restore saved user (if any)
    try {
      const saved = JSON.parse(lsGet(LS.user) || "null");
      if (saved && saved.user){
        user = saved.user;
        displayName = saved.displayName || saved.user;
      }
    } catch {}

    // login form
    const submitLogin = () => doLogin($("login-name").value);
    $("login-start").addEventListener("click", submitLogin);
    $("login-name").addEventListener("keydown", (e) => { if (e.key === "Enter"){ e.preventDefault(); submitLogin(); } });
    $("words-signout").addEventListener("click", signOut);

    // Delete saved progress (DELETE /api/state)
    const delBtn = $("words-delete");
    if (delBtn) delBtn.addEventListener("click", deleteAccount);

    // card interactions
    const disp = $("fc-display");
    disp.addEventListener("click", flip);
    disp.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); flip(); } });
    $("fc-grades").addEventListener("click", (e) => { const b = e.target.closest(".grade-btn"); if (b) grade(Number(b.dataset.grade)); });
    $("fc-sound").addEventListener("click", playSound);
    $("fc-skip").addEventListener("click", skip);

    // filters
    document.querySelectorAll("input.wfilter").forEach((cb) => {
      cb.addEventListener("change", () => { saveFilters(); showCard(); });
    });
    document.querySelectorAll("button[data-wf-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const on = btn.dataset.wfAction === "check";
        document.querySelectorAll(`input.wfilter[data-dim="${btn.dataset.wfGroup}"]`).forEach((cb) => { cb.checked = on; });
        saveFilters(); showCard();
      });
    });

    // flush pending save when leaving / hiding the page
    const flush = () => { if (dirty) pushBlob({ keepalive: true }); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });

    if (user){
      showDeck();
      $("fc-word").textContent = "…";
      $("fc-hint").textContent = "Loading your deck…";
      ensureWordsLoaded()
        .then(loadUserState)
        .then(showCard)
        .catch(() => { $("fc-hint").textContent = "Could not load vocabulary data."; });
    } else { showLogin(); }
  }

  // keyboard (only while in words mode and logged in)
  document.addEventListener("keydown", (e) => {
    if (document.body.dataset.mode !== "words") return;
    if (!user) return;                                   // login screen handles its own keys
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "SUMMARY") return;     // don't hijack filter/login fields
    if (!flipped){
      if (e.key === " " || e.key === "Enter"){ e.preventDefault(); flip(); }
      return;
    }
    if (e.key === "1"){ e.preventDefault(); grade(0); }
    else if (e.key === "2"){ e.preventDefault(); grade(1); }
    else if (e.key === "3"){ e.preventDefault(); grade(2); }
    else if (e.key === "4"){ e.preventDefault(); grade(3); }
    else if (e.key === " " || e.key === "Enter"){ e.preventDefault(); grade(2); } // Space = Good
  });

  window.WordsMode = {
    init: initWords,
    refresh: function () { if (user && ready) showCard(); },
    // exposed for automated tests
    _debug: { applyGrade, previewInterval, buildPool: () => buildPool(), state: () => ({ user, srs, session }) },
  };
})();

// NOTE: The page-level mode switch (Kana / Words / Kanji) is owned solely by
// kanji-tab.js, which is the unified 3-way controller. An earlier binary
// (Kana/Words-only) controller used to live here, but it overwrote
// localStorage["kt.mode"] on load and corrupted the persisted "kanji" choice,
// so it was removed. kanji-tab.js calls WordsMode.init()/refresh() on entry.
