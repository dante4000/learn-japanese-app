/* Sidebar — hamburger toggle + scroll-based active link tracking + scroll persistence */
(function () {
  var ham = document.getElementById('hamburger');
  var sb = document.getElementById('sidebar');
  var ov = document.getElementById('sidebar-overlay');
  if (!ham || !sb || !ov) return;

  /* ── Scroll position persistence across pages ── */
  var SCROLL_KEY = 'zth-sidebar-scroll';

  function restoreScroll() {
    try {
      var saved = parseInt(localStorage.getItem(SCROLL_KEY), 10);
      if (saved > 0) sb.scrollTop = saved;
    } catch (e) {}
  }

  /* Restore after layout settles — try multiple times to beat browser scroll restoration */
  restoreScroll();
  requestAnimationFrame(restoreScroll);
  setTimeout(restoreScroll, 50);

  /* Save on scroll (debounced) */
  var scrollTimer;
  sb.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      try { localStorage.setItem(SCROLL_KEY, String(sb.scrollTop)); } catch (e) {}
    }, 100);
  });

  /* Save immediately before navigating away */
  window.addEventListener('beforeunload', function () {
    try { localStorage.setItem(SCROLL_KEY, String(sb.scrollTop)); } catch (e) {}
  });

  /* ── Hamburger toggle (mobile) ── */
  ham.addEventListener('click', function () {
    ham.classList.toggle('open');
    sb.classList.toggle('open');
    ov.classList.toggle('open');
  });

  ov.addEventListener('click', function () {
    ham.classList.remove('open');
    sb.classList.remove('open');
    ov.classList.remove('open');
  });

  sb.querySelectorAll('.toc-link').forEach(function (l) {
    l.addEventListener('click', function () {
      if (window.innerWidth <= 920) {
        ham.classList.remove('open');
        sb.classList.remove('open');
        ov.classList.remove('open');
      }
    });
  });

  /* ── Scroll-based active link tracking ── */
  var secs = document.querySelectorAll('section[id]');
  var links = document.querySelectorAll('.toc-link');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        links.forEach(function (l) { l.classList.remove('active'); });
        var active = sb.querySelector('a[href="#' + entry.target.id + '"]');
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  secs.forEach(function (s) { obs.observe(s); });
})();
