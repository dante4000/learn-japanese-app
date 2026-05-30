// Kana Trainer — quiz engine, persistence, theme

const KANA = {
  hsingle: { 'あ':'a','い':'i','う':'u','え':'e','お':'o' },
  hk:      { 'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko' },
  hs:      { 'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so' },
  ht:      { 'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to' },
  hn:      { 'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no' },
  hh:      { 'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho' },
  hm:      { 'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo' },
  hy:      { 'や':'ya','ゆ':'yu','よ':'yo' },
  hr:      { 'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro' },
  hw:      { 'わ':'wa','を':'o' },
  hn1:     { 'ん':'n' },
  hg:      { 'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go' },
  hz:      { 'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo' },
  hd:      { 'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do' },
  hb:      { 'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo' },
  hp:      { 'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po' },
  hdk:     { 'きゃ':'kya','きゅ':'kyu','きょ':'kyo' },
  hds:     { 'しゃ':'sha','しゅ':'shu','しょ':'sho' },
  hdc:     { 'ちゃ':'cha','ちゅ':'chu','ちょ':'cho' },
  hdn:     { 'にゃ':'nya','にゅ':'nyu','にょ':'nyo' },
  hdh:     { 'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo' },
  hdm:     { 'みゃ':'mya','みゅ':'myu','みょ':'myo' },
  hdr:     { 'りゃ':'rya','りゅ':'ryu','りょ':'ryo' },
  hdg:     { 'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo' },
  hdj:     { 'じゃ':'ja','じゅ':'ju','じょ':'jo' },
  hdj2:    { 'ぢゃ':'ja','ぢゅ':'ju','ぢょ':'jo' },
  hdb:     { 'びゃ':'bya','びゅ':'byu','びょ':'byo' },
  hdp:     { 'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo' },
  ksingle: { 'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o' },
  kk:      { 'カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko' },
  ks:      { 'サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so' },
  kt:      { 'タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to' },
  kn:      { 'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no' },
  kh:      { 'ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho' },
  km:      { 'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo' },
  ky:      { 'ヤ':'ya','ユ':'yu','ヨ':'yo' },
  kr:      { 'ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro' },
  kw:      { 'ワ':'wa','ヲ':'o' },
  kn1:     { 'ン':'n' },
  kg:      { 'ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go' },
  kz:      { 'ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo' },
  kd:      { 'ダ':'da','ヂ':'ji','ヅ':'zu','デ':'de','ド':'do' },
  kb:      { 'バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo' },
  kp:      { 'パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po' },
  kdk:     { 'キャ':'kya','キュ':'kyu','キョ':'kyo' },
  kds:     { 'シャ':'sha','シュ':'shu','ショ':'sho' },
  kdc:     { 'チャ':'cha','チュ':'chu','チョ':'cho' },
  kdn:     { 'ニャ':'nya','ニュ':'nyu','ニョ':'nyo' },
  kdh:     { 'ヒャ':'hya','ヒュ':'hyu','ヒョ':'hyo' },
  kdm:     { 'ミャ':'mya','ミュ':'myu','ミョ':'myo' },
  kdr:     { 'リャ':'rya','リュ':'ryu','リョ':'ryo' },
  kdg:     { 'ギャ':'gya','ギュ':'gyu','ギョ':'gyo' },
  kdj:     { 'ジャ':'ja','ジュ':'ju','ジョ':'jo' },
  kdj2:    { 'ヂャ':'ja','ヂュ':'ju','ヂョ':'jo' },
  kdb:     { 'ビャ':'bya','ビュ':'byu','ビョ':'byo' },
  kdp:     { 'ピャ':'pya','ピュ':'pyu','ピョ':'pyo' },
};

// Alternate romanizations the user might type
const ALT_ROMAJI = {
  o:    ['wo'],
  shi:  ['si'],
  chi:  ['ci', 'ti'],
  tsu:  ['tu'],
  fu:   ['hu'],
  ji:   ['di', 'zi'],
  zu:   ['du'],
  ja:   ['dya', 'jya'],
  ju:   ['dyu', 'jyu'],
  jo:   ['dyo', 'jyo'],
};

const STORE = {
  cb:    (id) => `kt.cb.${id}`,
  font:  (id) => `kt.font.${id}`,
  theme: 'kt.theme',
  score: 'kt.score',
  stats: 'kt.stats',
};

// SRS-lite tuning constants
const COOLDOWN = 5;        // never repeat within last N picks
const WRONG_BOOST = 3;     // wrong answers weigh 3x in error-rate calc
const LEECH_THRESHOLD = 5; // wrong N+ times w/o net recovery → flag as leech

let active = [];      // [[kana, romaji], ...]
let stats = {};       // { kana: { correct, wrong, lastSeen, leech } }
let current = null;   // [kana, romaji]
let wrongOnCurrent = false;
let totalAnswered = 0;
let totalCorrect = 0;
let turn = 0;         // monotonic counter for recency tracking

const $ = (id) => document.getElementById(id);

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* private mode */ }
}

function loadCheckboxes() {
  document.querySelectorAll('input.kanacheck').forEach((cb) => {
    const v = safeGet(STORE.cb(cb.id));
    if (v === '1') cb.checked = true;
    else if (v === '0') cb.checked = false;
  });
}

function saveCheckboxes() {
  document.querySelectorAll('input.kanacheck').forEach((cb) => {
    safeSet(STORE.cb(cb.id), cb.checked ? '1' : '0');
  });
}

function loadFontChecks() {
  document.querySelectorAll('input.fontcheck').forEach((cb) => {
    const v = safeGet(STORE.font(cb.id));
    if (v === '1') cb.checked = true;
    else if (v === '0') cb.checked = false;
  });
}

function saveFontChecks() {
  document.querySelectorAll('input.fontcheck').forEach((cb) => {
    safeSet(STORE.font(cb.id), cb.checked ? '1' : '0');
  });
  // If a non-default font is now selected, ensure Google Fonts CSS is loaded.
  if (hasNonDefaultFontEnabled()) ensureGoogleFontsLoaded();
}

function hasNonDefaultFontEnabled() {
  return [...document.querySelectorAll('input.fontcheck')].some((cb) => cb.checked && cb.id !== 'font-default');
}

// Inject the Google Fonts <link> on demand instead of every page load.
let googleFontsLoaded = false;
function ensureGoogleFontsLoaded() {
  if (googleFontsLoaded || document.getElementById('kt-google-fonts')) {
    googleFontsLoaded = true;
    return;
  }
  googleFontsLoaded = true;

  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = '';

  const css = document.createElement('link');
  css.id = 'kt-google-fonts';
  css.rel = 'stylesheet';
  css.href =
    'https://fonts.googleapis.com/css2?' +
    'family=DotGothic16&family=Hina+Mincho&family=Klee+One&family=Kosugi+Maru' +
    '&family=Noto+Sans+JP&family=Noto+Serif+JP&family=Reggae+One&family=Shippori+Mincho' +
    '&family=Stick&family=Yomogi&family=Zen+Kaku+Gothic+New' +
    '&text=' + encodeURIComponent(
      'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん' +
      'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっ' +
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
      'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポャュョッ'
    ) +
    '&display=swap';

  document.head.append(pre1, pre2, css);
}

function activeFonts() {
  const out = [];
  document.querySelectorAll('input.fontcheck').forEach((cb) => {
    if (cb.checked) {
      // id is "font-<key>" → strip prefix
      out.push(cb.id.replace(/^font-/, ''));
    }
  });
  // Always guarantee at least one font is in play
  if (out.length === 0) return ['default'];
  return out;
}

function applyKanaFont() {
  const fonts = activeFonts();
  const choice = fonts[Math.floor(Math.random() * fonts.length)];
  $('kana').setAttribute('data-font', choice);
}

function loadScore() {
  const raw = safeGet(STORE.score);
  if (!raw) return;
  try {
    const { answered, correct } = JSON.parse(raw);
    if (Number.isFinite(answered) && Number.isFinite(correct)) {
      totalAnswered = answered;
      totalCorrect = correct;
    }
  } catch { /* ignore */ }
}
function saveScore() {
  safeSet(STORE.score, JSON.stringify({ answered: totalAnswered, correct: totalCorrect }));
}

function rebuildActive() {
  active = [];
  document.querySelectorAll('input.kanacheck').forEach((cb) => {
    if (cb.checked && KANA[cb.id]) {
      for (const [k, r] of Object.entries(KANA[cb.id])) {
        active.push([k, r]);
      }
    }
  });
}

function ensureSomethingChecked() {
  const anyChecked = [...document.querySelectorAll('input.kanacheck')].some((c) => c.checked);
  if (!anyChecked) {
    const first = $('hsingle');
    if (first) {
      first.checked = true;
      safeSet(STORE.cb('hsingle'), '1');
    }
  }
}

// --- SRS-lite: per-kana stats + weighted random selection ---

function loadStats() {
  const raw = safeGet(STORE.stats);
  if (!raw) { stats = {}; return; }
  try {
    const parsed = JSON.parse(raw);
    stats = (parsed && typeof parsed === 'object') ? parsed : {};
  } catch { stats = {}; }
}

function saveStats() {
  safeSet(STORE.stats, JSON.stringify(stats));
}

function statFor(kana) {
  if (!stats[kana]) stats[kana] = { correct: 0, wrong: 0, lastSeen: -Infinity, leech: false };
  return stats[kana];
}

function recordResult(kana, wasCorrect) {
  const s = statFor(kana);
  if (wasCorrect) s.correct++;
  else s.wrong++;
  // Leech threshold: 5 misses where wrong outnumbers correct by 3+
  if (!s.leech && s.wrong >= LEECH_THRESHOLD && (s.wrong - s.correct) >= 3) {
    s.leech = true;
  }
  // Clear leech once they recover (correct now outnumbers wrong)
  if (s.leech && s.correct > s.wrong) s.leech = false;
  saveStats();
}

function pickNext() {
  if (active.length === 0) rebuildActive();
  if (active.length === 0) return null;

  turn++;
  const weights = active.map(([k]) => {
    const s = statFor(k);
    // Recency cooldown: never within last COOLDOWN picks
    if (turn - s.lastSeen < COOLDOWN) return 0;
    // Laplace-smoothed error rate w/ wrong-answer boost
    const boostedWrong = s.wrong * WRONG_BOOST;
    return (boostedWrong + 1) / (s.correct + boostedWrong + 2);
  });

  let total = 0;
  for (const w of weights) total += w;

  let pickIndex;
  if (total === 0) {
    // Everything is in cooldown → pick anything not equal to current
    const candidates = active
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => !current || p[0] !== current[0]);
    pickIndex = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)].i
      : Math.floor(Math.random() * active.length);
  } else {
    let r = Math.random() * total;
    pickIndex = active.length - 1;
    for (let i = 0; i < active.length; i++) {
      r -= weights[i];
      if (r <= 0) { pickIndex = i; break; }
    }
  }

  const chosen = active[pickIndex];
  statFor(chosen[0]).lastSeen = turn;
  return chosen;
}

function showKana() {
  ensureSomethingChecked();
  const next = pickNext();
  if (!next) return;

  current = next;
  wrongOnCurrent = false;

  applyKanaFont();
  $('kana').textContent = current[0];
  $('answer').textContent = current[1];
  hideAnswer();

  $('input-box').value = '';
  updateCount();
  updateLeechBadge();

  // Hide stroke-order link for combinations (Wikimedia animations only cover singles)
  const isCombo = current[0].length > 1;
  $('tool-stroke').classList.toggle('hidden', isCombo);
}

function updateLeechBadge() {
  const badge = $('leech-badge');
  if (!badge) return;
  const s = current ? stats[current[0]] : null;
  if (s && s.leech) {
    badge.hidden = false;
    badge.textContent = `tricky one — missed ${s.wrong}×`;
  } else {
    badge.hidden = true;
  }
}

function updateCount() {
  if (totalAnswered > 0) {
    $('count').textContent = `${totalCorrect} / ${totalAnswered}`;
  } else {
    $('count').textContent = '';
  }
}

function showAnswer() { $('answer').classList.add('show'); }
function hideAnswer() { $('answer').classList.remove('show'); }

function checkAnswer() {
  if (!current) return;
  const typed = ($('input-box').value || '').toLowerCase().trim();
  if (!typed) return;

  const [, reading] = current;
  const valid = new Set([reading, ...(ALT_ROMAJI[reading] || [])]);

  let isPrefix = false;
  let isExact = false;
  for (const candidate of valid) {
    if (candidate.startsWith(typed)) isPrefix = true;
    if (candidate === typed) isExact = true;
  }

  if (!isPrefix) {
    if (!wrongOnCurrent) {
      wrongOnCurrent = true;
      recordResult(current[0], false);
    }
    const msg = $('message');
    msg.textContent = '';
    const wrong = document.createElement('span');
    wrong.id = 'wrong';
    wrong.lang = 'ja';
    wrong.append(current[0], ' = ', reading);
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = ' — press space to continue';
    msg.append(wrong, ' ', hint);
    return;
  }

  if (isExact) {
    totalAnswered++;
    if (!wrongOnCurrent) {
      totalCorrect++;
      recordResult(current[0], true);
    }
    saveScore();
    $('message').textContent = '';
    showKana();
  }
}

function forceNext() {
  if (!current) return;
  if (!wrongOnCurrent) {
    // Treat a skip as a miss for SRS purposes — they didn't recall it
    recordResult(current[0], false);
    wrongOnCurrent = true;
  }
  totalAnswered++;
  saveScore();
  $('message').textContent = '';
  showKana();
}

function playSound() {
  if (!current) return;
  const reading = current[1];
  if (!('speechSynthesis' in window)) {
    $('message').textContent = "(Speech synthesis not available in this browser.)";
    return;
  }
  try {
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(current[0]);
    utter.lang = 'ja-JP';
    utter.rate = 0.9;
    speechSynthesis.speak(utter);
  } catch {
    // ignore
  }
  $('input-box').focus({ preventScroll: true });
}

// Wikimedia only hosts animations for the base kana, not dakuten/handakuten
// variants (が, ぎ, ば, ぱ, etc. all 404). NFD decomposition strips the mark
// so we look up the base stroke order, then tell the user about the diacritic.
function strokeBaseChar(ch) {
  return ch.normalize('NFD').charAt(0);
}

function strokeFileName(ch) {
  const base = strokeBaseChar(ch);
  const code = base.codePointAt(0);
  if (code >= 0x3040 && code <= 0x309F) return `Hiragana_${base}_stroke_order_animation.gif`;
  if (code >= 0x30A0 && code <= 0x30FF) return `Katakana_${base}_stroke_order_animation.gif`;
  return null;
}

function strokeMarkLabel(ch) {
  const decomposed = ch.normalize('NFD');
  if (decomposed.length < 2) return null;
  const mark = decomposed.charAt(1);
  if (mark === '゙') return 'dakuten ゛';
  if (mark === '゚') return 'handakuten ゜';
  return null;
}

function strokeImageUrl(filename) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

function strokeFilePageUrl(filename) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`;
}

function strokeSearchUrl(ch) {
  return `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(ch)}+stroke+order&title=Special:MediaSearch&go=Go&type=image`;
}

function prefersReducedMotion() {
  return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setNote(noteEl, base, mark, ch) {
  if (!mark) {
    noteEl.hidden = true;
    noteEl.textContent = '';
    return;
  }
  noteEl.hidden = false;
  noteEl.textContent = '';
  noteEl.append('Showing base ');
  const a = document.createElement('span'); a.className = 'accent'; a.lang = 'ja'; a.textContent = base;
  noteEl.append(a, ' — add ', mark, ' to get ');
  const b = document.createElement('span'); b.className = 'accent'; b.lang = 'ja'; b.textContent = ch;
  noteEl.append(b, '.');
}

function setStatusFallback(statusEl, ch) {
  statusEl.textContent = 'Animation not available. ';
  const link = document.createElement('a');
  link.href = strokeSearchUrl(ch);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Search Wikimedia';
  statusEl.append(link);
}

function loadStrokeImage(filename, ch, img, statusEl) {
  img.hidden = true;
  img.onload = () => { statusEl.hidden = true; img.hidden = false; };
  img.onerror = () => { img.hidden = true; statusEl.hidden = false; setStatusFallback(statusEl, ch); };
  img.alt = `Stroke order animation for ${ch}`;
  img.src = strokeImageUrl(filename);
}

function openStrokeOrder() {
  if (!current) return;
  const modal = $('stroke-modal');
  if (modal.open) return; // re-entry guard
  const ch = current[0];
  if (ch.length > 1) return; // combos already hide the button
  const filename = strokeFileName(ch);
  if (!filename) return;

  const img = $('stroke-modal-img');
  const statusEl = $('stroke-modal-status');

  $('stroke-modal-char').textContent = ch;
  $('stroke-modal-romaji').textContent = current[1];
  $('stroke-modal-source').href = strokeFilePageUrl(filename);

  setNote($('stroke-modal-note'), strokeBaseChar(ch), strokeMarkLabel(ch), ch);

  img.hidden = true;
  img.removeAttribute('src');
  statusEl.hidden = false;
  statusEl.textContent = '';

  if (prefersReducedMotion()) {
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'stroke-modal-playbtn';
    playBtn.textContent = '▶ Play stroke animation';
    playBtn.addEventListener('click', () => {
      statusEl.textContent = 'Loading…';
      loadStrokeImage(filename, ch, img, statusEl);
    }, { once: true });
    statusEl.append(playBtn);
  } else {
    statusEl.textContent = 'Loading…';
    loadStrokeImage(filename, ch, img, statusEl);
  }

  modal.showModal();
}

function isStrokeModalOpen() {
  const modal = $('stroke-modal');
  return !!(modal && modal.open);
}

// --- check-all / uncheck-all ---
function rowSet(setClass, value) {
  document.querySelectorAll(`tr.${setClass} input[type="checkbox"]`).forEach((cb) => {
    cb.checked = value;
  });
  saveCheckboxes();
  rebuildActive();
}

// --- Theme ---
function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme'); // auto / system
  }
}

function currentEffectiveTheme() {
  const stored = safeGet(STORE.theme);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleTheme() {
  const next = currentEffectiveTheme() === 'dark' ? 'light' : 'dark';
  safeSet(STORE.theme, next);
  applyTheme(next);
}

// --- init ---
function init() {
  // Tag Japanese-text elements so TTS/screen-reader/font fallback picks ja.
  document.querySelectorAll('.kana-table .kana, .font-preview').forEach((el) => {
    el.setAttribute('lang', 'ja');
  });

  // Theme
  const storedTheme = safeGet(STORE.theme);
  if (storedTheme) applyTheme(storedTheme);

  $('theme-toggle').addEventListener('click', toggleTheme);

  // Listen to system theme changes when in auto mode
  if (window.matchMedia) {
    const mql = matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener?.('change', () => {
      if (!safeGet(STORE.theme)) applyTheme(null);
    });
  }

  // Stats
  loadStats();

  // Checkboxes
  loadCheckboxes();
  ensureSomethingChecked();
  rebuildActive();

  document.querySelectorAll('input.kanacheck').forEach((cb) => {
    cb.addEventListener('change', () => {
      saveCheckboxes();
      rebuildActive();
    });
  });

  // Fonts
  loadFontChecks();
  if (hasNonDefaultFontEnabled()) ensureGoogleFontsLoaded();
  document.querySelectorAll('input.fontcheck').forEach((cb) => {
    cb.addEventListener('change', saveFontChecks);
  });
  // The Fonts table's preview swatches need the Google webfonts. Load them the
  // moment the user opens the Options panel.
  const optionsDetails = $('options-details');
  if (optionsDetails) {
    optionsDetails.addEventListener('toggle', () => {
      if (optionsDetails.open) ensureGoogleFontsLoaded();
    }, { once: true });
  }

  // Row tools (kana + fonts)
  document.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const target = btn.dataset.target;
      if (action === 'check' || action === 'uncheck') {
        rowSet(target, action === 'check');
      } else if (action === 'check-fonts' || action === 'uncheck-fonts') {
        const on = action === 'check-fonts';
        document.querySelectorAll('input.fontcheck').forEach((cb) => { cb.checked = on; });
        saveFontChecks();
      }
    });
  });

  // Tools
  $('tool-sound').addEventListener('click', playSound);
  $('tool-stroke').addEventListener('click', openStrokeOrder);
  $('tool-skip').addEventListener('click', () => { forceNext(); $('input-box').focus({ preventScroll: true }); });

  // Stroke order modal: <dialog> handles Esc/× via form method="dialog".
  // Backdrop click closes it too. On close, cancel in-flight image load and
  // refocus the kana input.
  const strokeModal = $('stroke-modal');
  strokeModal.addEventListener('click', (e) => {
    // Click on the dialog element itself (not its children) = backdrop click.
    if (e.target === strokeModal) strokeModal.close();
  });
  strokeModal.addEventListener('close', () => {
    const img = $('stroke-modal-img');
    img.onload = null;
    img.onerror = null;
    img.removeAttribute('src');
    $('input-box').focus({ preventScroll: true });
  });

  // Kana hover / tap to reveal
  const display = $('kana-display');
  display.addEventListener('mouseenter', showAnswer);
  display.addEventListener('mouseleave', hideAnswer);
  display.addEventListener('focus', showAnswer);
  display.addEventListener('blur', hideAnswer);
  // Touch: tap to toggle
  display.addEventListener('click', () => {
    if ($('answer').classList.contains('show')) hideAnswer();
    else showAnswer();
    $('input-box').focus({ preventScroll: true });
  });
  display.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showAnswer();
    }
  });

  // Input
  const input = $('input-box');
  input.addEventListener('input', checkAnswer);
  input.focus({ preventScroll: true });

  // Global keys: Space/Enter advances; printable a-z refocuses the input.
  // Constrained so it doesn't fight browser shortcuts, screen-reader nav, or
  // typing in unrelated inputs.
  document.body.addEventListener('keydown', (e) => {
    // Only act in Kana mode — Words and Kanji modes have their own handlers.
    if (document.body.dataset.mode && document.body.dataset.mode !== 'kana') return;
    // <dialog> handles Esc/backdrop natively; back off entirely while open.
    if (isStrokeModalOpen()) return;
    // Don't fight modifier-key shortcuts (Cmd/Ctrl/Alt + X, F-keys, IME etc.)
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Don't steal focus from other inputs (font/kana checkboxes are inputs).
    if (e.target.tagName === 'INPUT' && e.target.id !== 'input-box') return;
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SUMMARY' || e.target.tagName === 'A') return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      // Exact correct answers already auto-advance on the input event, but a
      // complete answer that arrived without one still submits here. Anything
      // else — a shown miss, an empty box, or a half-typed prefix the user is
      // giving up on — advances. (Previously a prefix routed to checkAnswer(),
      // which no-ops on a non-exact prefix, so "press space to continue" did
      // nothing once you'd typed part of the reading.)
      const typed = (input.value || '').toLowerCase().trim();
      const exact = !!current && new Set([current[1], ...(ALT_ROMAJI[current[1]] || [])]).has(typed);
      if (exact) checkAnswer();
      else forceNext();
      input.focus({ preventScroll: true });
      return;
    }
    // Only refocus on a-z / 0-9 (romaji-bearing keys), and only when focus is
    // on body/main, so Tab nav and quick-find aren't hijacked.
    if (/^[a-z0-9]$/i.test(e.key) && document.activeElement !== input) {
      const ae = document.activeElement;
      if (!ae || ae === document.body || ae.tagName === 'MAIN') input.focus({ preventScroll: true });
    }
  });

  // Score
  loadScore();
  showKana();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
