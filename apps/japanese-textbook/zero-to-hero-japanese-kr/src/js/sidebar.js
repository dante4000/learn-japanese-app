/* ============================================================
   Zero to Hero — Sidebar Navigation + Chapter Checkboxes
   ============================================================ */

(function () {
  'use strict';

  var ham = document.getElementById('hamburger');
  var sb = document.getElementById('sidebar');
  var ov = document.getElementById('sidebar-overlay');

  // Mobile hamburger
  if (ham && sb && ov) {
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
        if (window.innerWidth <= 900) {
          ham.classList.remove('open');
          sb.classList.remove('open');
          ov.classList.remove('open');
        }
      });
    });
  }

  // Active section tracking (for single-page chapters)
  var secs = document.querySelectorAll('section[id]');
  var links = document.querySelectorAll('.toc-link');
  if (secs.length > 0 && links.length > 0) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); });
          var active = sb.querySelector('a[href="#' + entry.target.id + '"]');
          if (!active) active = sb.querySelector('a[href$="' + entry.target.id + '"]');
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    secs.forEach(function (s) { obs.observe(s); });
  }

  // Update sidebar checkboxes and progress bar from storage
  function updateSidebarProgress() {
    if (!window.chapterProgress) return;

    var completed = window.chapterProgress.getCompletedCount();

    // Update progress bar segments
    var segs = document.querySelectorAll('.sidebar-progress-bar .seg');
    segs.forEach(function (seg, i) {
      var ch = String(i + 1).padStart(2, '0');
      if (window.chapterProgress.isComplete(ch)) {
        seg.classList.add('done');
      } else {
        seg.classList.remove('done');
      }
    });

    // Update progress count
    var countEl = document.querySelector('.sidebar-progress-count');
    if (countEl) countEl.textContent = completed + '/22 완료';

    // Update toc checkboxes
    var checks = document.querySelectorAll('.toc-check');
    checks.forEach(function (chk) {
      var ch = chk.getAttribute('data-ch');
      if (ch && window.chapterProgress.isComplete(ch)) {
        chk.classList.add('done');
        chk.innerHTML = '&#10003;';
        chk.closest('.toc-link').classList.add('completed');
      } else if (ch) {
        chk.classList.remove('done');
        chk.innerHTML = '';
        var link = chk.closest('.toc-link');
        if (link) link.classList.remove('completed');
      }
    });

    // Update landing page checklist if present
    var landingChecks = document.querySelectorAll('.checklist-check');
    landingChecks.forEach(function (chk) {
      var ch = chk.getAttribute('data-ch');
      if (ch && window.chapterProgress.isComplete(ch)) {
        chk.classList.add('done');
        chk.innerHTML = '&#10003;';
        chk.closest('.checklist-item').classList.add('done');
      } else if (ch) {
        chk.classList.remove('done');
        chk.innerHTML = '';
        var item = chk.closest('.checklist-item');
        if (item) item.classList.remove('done');
      }
    });

    // Update landing page progress bar
    var landingSegs = document.querySelectorAll('.progress-bar-large .seg');
    landingSegs.forEach(function (seg, i) {
      var ch = String(i + 1).padStart(2, '0');
      if (window.chapterProgress.isComplete(ch)) {
        seg.classList.add('done');
      } else {
        seg.classList.remove('done');
      }
    });

    var landingCount = document.querySelector('.progress-count');
    if (landingCount) landingCount.textContent = completed + '/22 완료';
  }

  // Run on load
  updateSidebarProgress();

  // Listen for changes
  window.addEventListener('chapter-progress-changed', updateSidebarProgress);

  // Mark as Complete buttons
  document.querySelectorAll('.chapter-complete').forEach(function (btn) {
    var ch = btn.getAttribute('data-ch');
    if (ch && window.chapterProgress && window.chapterProgress.isComplete(ch)) {
      btn.classList.add('done');
      btn.innerHTML = 'Completed &#10003;';
    }
    btn.addEventListener('click', function () {
      if (!window.chapterProgress) return;
      window.chapterProgress.toggleComplete(ch);
      if (window.chapterProgress.isComplete(ch)) {
        btn.classList.add('done');
        btn.innerHTML = 'Completed &#10003;';
      } else {
        btn.classList.remove('done');
        btn.innerHTML = 'Mark as Complete &#10003;';
      }
    });
  });
})();
