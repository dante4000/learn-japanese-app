/* Progress tracking — localStorage persistence for exercise completion */
(function () {
  var STORAGE_KEY = 'zth-progress';

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function markComplete(ch, ex) {
    var data = load();
    if (!data[ch]) data[ch] = {};
    data[ch][ex] = true;
    save(data);
    updateStatusIcon(ch, ex);
    updateProgressBars();
  }

  function isComplete(ch, ex) {
    var data = load();
    return !!(data[ch] && data[ch][ex]);
  }

  function updateStatusIcon(ch, ex) {
    var el = document.querySelector(
      '[data-ch="' + ch + '"][data-ex="' + ex + '"] .exercise-status'
    );
    if (el) el.classList.add('done');
  }

  function getChapterMap() {
    return {
      1: ['01','02','03','04'],
      2: ['05','06','07','08','09'],
      3: ['10','11','12'],
      4: ['13','14','15','16','17','18'],
      5: ['19','20','21','22','23'],
      6: ['24','25','26','27'],
      7: ['28','29','30','31','32','33'],
      8: ['34','35','36','37'],
      9: ['38','39','40','41','42'],
      10: ['43','44','45','46','47']
    };
  }

  function countPhase(phaseNum) {
    var map = getChapterMap();
    var chapters = map[phaseNum] || [];
    var total = 0;
    var completed = 0;
    chapters.forEach(function (ch) {
      document.querySelectorAll(
        '[data-ch="' + ch + '"][data-ex]'
      ).forEach(function () {
        total++;
      });
    });
    var data = load();
    chapters.forEach(function (ch) {
      if (data[ch]) {
        var keys = Object.keys(data[ch]);
        keys.forEach(function (k) {
          if (data[ch][k]) completed++;
        });
      }
    });
    return { total: total, completed: completed };
  }

  function countAll() {
    var data = load();
    var completed = 0;
    Object.keys(data).forEach(function (ch) {
      Object.keys(data[ch]).forEach(function (ex) {
        if (data[ch][ex]) completed++;
      });
    });
    var total = document.querySelectorAll('[data-ch][data-ex]').length;
    return { total: total, completed: completed };
  }

  function updateProgressBars() {
    document.querySelectorAll('.progress-fill[data-phase]').forEach(function (bar) {
      var phase = parseInt(bar.getAttribute('data-phase'), 10);
      var stats = countPhase(phase);
      var pct = stats.total > 0 ? (stats.completed / stats.total * 100) : 0;
      bar.style.width = pct + '%';
      var label = bar.parentElement.querySelector('.progress-text');
      if (label) label.textContent = stats.completed + ' / ' + stats.total;
    });
    var ring = document.querySelector('.progress-ring .ring-fill');
    if (ring) {
      var all = countAll();
      var pct = all.total > 0 ? (all.completed / all.total) : 0;
      var r = parseFloat(ring.getAttribute('r') || 40);
      var circumference = 2 * Math.PI * r;
      ring.setAttribute('stroke-dasharray', circumference);
      ring.setAttribute('stroke-dashoffset', circumference * (1 - pct));
      var txt = document.querySelector('.progress-ring-pct');
      if (txt) txt.textContent = Math.round(pct * 100) + '%';
    }
  }

  function restoreAll() {
    migrateProgress();
    var data = load();
    Object.keys(data).forEach(function (ch) {
      Object.keys(data[ch]).forEach(function (ex) {
        if (data[ch][ex]) updateStatusIcon(ch, ex);
      });
    });
    updateProgressBars();
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    location.reload();
  }

  function migrateProgress() {
    var MIGRATED_KEY = 'zth-progress-v2-migrated';
    try {
      if (localStorage.getItem(MIGRATED_KEY)) return;
      var data = load();
      var renumberMap = {
        '19':'38','20':'39','21':'40','22':'41','23':'42',
        '24':'43','25':'44','26':'45','27':'46','28':'47'
      };
      var changed = false;
      Object.keys(renumberMap).forEach(function(oldCh) {
        if (data[oldCh]) {
          var newCh = renumberMap[oldCh];
          data[newCh] = data[oldCh];
          delete data[oldCh];
          changed = true;
        }
      });
      if (changed) save(data);
      localStorage.setItem(MIGRATED_KEY, '1');
    } catch (e) {}
  }

  window.ZTH = window.ZTH || {};
  window.ZTH.progress = {
    load: load,
    save: save,
    markComplete: markComplete,
    isComplete: isComplete,
    countPhase: countPhase,
    countAll: countAll,
    updateProgressBars: updateProgressBars,
    restoreAll: restoreAll,
    reset: reset
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreAll);
  } else {
    restoreAll();
  }
})();
