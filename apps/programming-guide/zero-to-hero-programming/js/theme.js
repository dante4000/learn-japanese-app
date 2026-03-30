/* Theme toggle — dark/light with localStorage persistence */
/* NOTE: This script runs deferred, so the saved theme is applied after first
   paint, which may cause a Flash of Wrong Theme (FOWT). Moving the script to
   a blocking position in <head> would fix this but conflicts with the current
   loading strategy. */
(function () {
  var t = document.getElementById('themeToggle');
  if (!t) return;
  var h = document.documentElement;
  try {
    var saved = localStorage.getItem('zth-theme');
    if (saved === 'light') h.setAttribute('data-theme', 'light');
  } catch (e) {}
  t.addEventListener('click', function () {
    var isLight = h.getAttribute('data-theme') === 'light';
    if (isLight) {
      h.removeAttribute('data-theme');
      try { localStorage.setItem('zth-theme', 'dark'); } catch (e) {}
    } else {
      h.setAttribute('data-theme', 'light');
      try { localStorage.setItem('zth-theme', 'light'); } catch (e) {}
    }
  });
})();

/* Zoom persistence — intercept Cmd/Ctrl +/-/0 and persist via localStorage */
(function () {
  var ZOOM_KEY = 'zth-zoom';
  var STEP = 10; /* percent */
  var MIN = 50;
  var MAX = 200;
  var h = document.documentElement;

  function getZoom() {
    try {
      var v = parseInt(localStorage.getItem(ZOOM_KEY), 10);
      if (v >= MIN && v <= MAX) return v;
    } catch (e) {}
    return 100;
  }

  function applyZoom(pct) {
    h.style.zoom = (pct / 100);
    try { localStorage.setItem(ZOOM_KEY, String(pct)); } catch (e) {}
  }

  /* Restore saved zoom (also done in <head> inline script for flash prevention) */
  applyZoom(getZoom());

  document.addEventListener('keydown', function (e) {
    var isMeta = e.metaKey || e.ctrlKey;
    if (!isMeta) return;

    var current = getZoom();

    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      applyZoom(Math.min(current + STEP, MAX));
    } else if (e.key === '-') {
      e.preventDefault();
      applyZoom(Math.max(current - STEP, MIN));
    } else if (e.key === '0') {
      e.preventDefault();
      applyZoom(100);
    }
  });
})();
