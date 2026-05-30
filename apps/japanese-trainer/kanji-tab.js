// Kanji tab handler — extends the Kana/Words tab switcher with a 3rd tab.
// Lives in its own file so it doesn't have to be merged into words.js.

(function () {
  "use strict";

  const KEY = "kt.mode";
  const $ = (id) => document.getElementById(id);
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  function panels() {
    return {
      kana:  $("kana-mode"),
      words: $("words-mode"),
      kanji: $("kanji-mode"),
    };
  }
  function tabs() {
    return {
      kana:  $("tab-kana"),
      words: $("tab-words"),
      kanji: $("tab-kanji"),
    };
  }

  function activate(mode, opts) {
    const p = panels();
    const t = tabs();
    Object.entries(p).forEach(([name, el]) => { if (el) el.hidden = (name !== mode); });
    Object.entries(t).forEach(([name, el]) => {
      if (!el) return;
      const active = (name === mode);
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-selected", String(active));
    });
    document.body.dataset.mode = mode;
    lsSet(KEY, mode);

    if (mode === "kanji" && window.KanjiMode) {
      window.KanjiMode.init().then(() => window.KanjiMode.refresh());
    }
    if (mode === "words" && window.WordsMode) {
      window.WordsMode.init();
      window.WordsMode.refresh();
    }

    // Move keyboard focus into the newly shown panel unless this is the very
    // first render (avoid stealing focus on page load).
    const initialRender = !!(opts && opts.initial);
    if (!initialRender) {
      if (mode === "kana") {
        const inp = $("input-box"); if (inp) inp.focus({ preventScroll: true });
      } else if (mode === "kanji") {
        const inp = $("kj-input-box"); if (inp) inp.focus({ preventScroll: true });
      } else if (mode === "words") {
        const card = $("fc-display") || $("login-name");
        if (card) card.focus({ preventScroll: true });
      }
    }
  }

  function init() {
    const t = tabs();
    if (t.kanji) t.kanji.addEventListener("click", () => activate("kanji"));
    // Re-wire kana/words clicks here too so all three call the unified activator,
    // overriding (idempotently) the binary handler in words.js.
    if (t.kana)  t.kana.addEventListener("click",  () => activate("kana"));
    if (t.words) t.words.addEventListener("click", () => activate("words"));

    // Initial state: respect persisted mode, but default to kana for new users.
    const stored = lsGet(KEY);
    const initial = (stored === "kanji" || stored === "words") ? stored : "kana";
    activate(initial, { initial: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
