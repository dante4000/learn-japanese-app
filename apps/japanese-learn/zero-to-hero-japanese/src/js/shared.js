/* ============================================================
   Zero to Hero — Shared Utilities
   window.storage API with localStorage + in-memory fallback
   ============================================================ */

(function () {
  'use strict';

  var memoryStore = {};
  var useLocalStorage = true;

  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
  } catch (e) {
    useLocalStorage = false;
  }

  window.storage = {
    get: function (key) {
      if (useLocalStorage) {
        try { return localStorage.getItem('zth-' + key); }
        catch (e) { return memoryStore[key] || null; }
      }
      return memoryStore[key] || null;
    },
    set: function (key, value) {
      if (useLocalStorage) {
        try { localStorage.setItem('zth-' + key, value); }
        catch (e) { memoryStore[key] = value; }
      } else {
        memoryStore[key] = value;
      }
    },
    remove: function (key) {
      if (useLocalStorage) {
        try { localStorage.removeItem('zth-' + key); }
        catch (e) { delete memoryStore[key]; }
      } else {
        delete memoryStore[key];
      }
    },
    getAll: function (prefix) {
      var results = {};
      if (useLocalStorage) {
        try {
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf('zth-' + prefix) === 0) {
              results[k.replace('zth-', '')] = localStorage.getItem(k);
            }
          }
        } catch (e) {}
      }
      for (var mk in memoryStore) {
        if (mk.indexOf(prefix) === 0) results[mk] = memoryStore[mk];
      }
      return results;
    }
  };

  // Chapter completion helpers
  window.chapterProgress = {
    isComplete: function (ch) {
      return window.storage.get('ch-' + ch + '-complete') === 'true';
    },
    markComplete: function (ch) {
      window.storage.set('ch-' + ch + '-complete', 'true');
      window.dispatchEvent(new CustomEvent('chapter-progress-changed', { detail: { ch: ch } }));
    },
    markIncomplete: function (ch) {
      window.storage.remove('ch-' + ch + '-complete');
      window.dispatchEvent(new CustomEvent('chapter-progress-changed', { detail: { ch: ch } }));
    },
    toggleComplete: function (ch) {
      if (this.isComplete(ch)) this.markIncomplete(ch);
      else this.markComplete(ch);
    },
    getCompletedCount: function () {
      var count = 0;
      for (var i = 0; i <= 21; i++) {
        if (this.isComplete(String(i).padStart(2, '0'))) count++;
      }
      return count;
    }
  };
})();

// --- Chapter TOC Draggable (desktop only) ---
(function () {
  var toc = document.querySelector('.chapter-toc');
  if (!toc) return;

  var dragging = false, startX, startY, origLeft, origTop;

  function isFixed() {
    return getComputedStyle(toc).position === 'fixed';
  }

  toc.addEventListener('mousedown', function (e) {
    if (!isFixed()) return;
    if (e.target.closest('a, summary, details')) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    var r = toc.getBoundingClientRect();
    origLeft = r.left;
    origTop = r.top;
    toc.style.transition = 'none';
    toc.classList.add('toc-dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    var x = Math.max(0, Math.min(window.innerWidth - 60, origLeft + dx));
    var y = Math.max(0, Math.min(window.innerHeight - 60, origTop + dy));
    toc.style.left = x + 'px';
    toc.style.top = y + 'px';
  });

  document.addEventListener('mouseup', function () {
    if (!dragging) return;
    dragging = false;
    toc.classList.remove('toc-dragging');
    toc.style.transition = '';
  });

  // Touch support
  toc.addEventListener('touchstart', function (e) {
    if (!isFixed()) return;
    if (e.target.closest('a, summary, details')) return;
    var t = e.touches[0];
    dragging = true;
    startX = t.clientX;
    startY = t.clientY;
    var r = toc.getBoundingClientRect();
    origLeft = r.left;
    origTop = r.top;
    toc.style.transition = 'none';
    toc.classList.add('toc-dragging');
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (!dragging) return;
    var t = e.touches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    var x = Math.max(0, Math.min(window.innerWidth - 60, origLeft + dx));
    var y = Math.max(0, Math.min(window.innerHeight - 60, origTop + dy));
    toc.style.left = x + 'px';
    toc.style.top = y + 'px';
  }, { passive: true });

  document.addEventListener('touchend', function () {
    if (!dragging) return;
    dragging = false;
    toc.classList.remove('toc-dragging');
    toc.style.transition = '';
  });
})();

// --- Chapter TOC Scroll Spy ---
(function () {
  var toc = document.querySelector('.chapter-toc');
  if (!toc) return;
  var links = [].slice.call(toc.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;
  var headings = [];
  for (var i = 0; i < links.length; i++) {
    var el = document.getElementById(links[i].getAttribute('href').slice(1));
    if (el) headings.push({ el: el, link: links[i] });
  }
  if (!headings.length) return;
  var raf;
  function update() {
    var y = (window.scrollY || window.pageYOffset) + 120;
    var active = -1;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].el.offsetTop <= y) active = i;
    }
    for (var j = 0; j < headings.length; j++) {
      headings[j].link.classList.toggle('toc-active', j === active);
    }
  }
  window.addEventListener('scroll', function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { update(); raf = null; });
  });
  update();
})();
