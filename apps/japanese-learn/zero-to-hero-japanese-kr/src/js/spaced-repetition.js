/* ============================================================
   Zero to Hero — Spaced Repetition Engine
   SM-2 algorithm with persistent review scheduling
   ============================================================ */

var SpacedRepetition = (function () {
  'use strict';

  var DB_KEY = 'sr-items';
  var STREAK_KEY = 'sr-streak';
  var LAST_REVIEW_DATE_KEY = 'sr-last-review-date';

  // ─── Helpers ───

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function daysBetween(dateStrA, dateStrB) {
    var a = new Date(dateStrA);
    var b = new Date(dateStrB);
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
  }

  // ─── Database Access ───

  function loadItems() {
    var raw = window.storage.get(DB_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); }
    catch (e) { return {}; }
  }

  function saveItems(items) {
    window.storage.set(DB_KEY, JSON.stringify(items));
  }

  function loadStreak() {
    var raw = window.storage.get(STREAK_KEY);
    if (!raw) return { count: 0, lastDate: '' };
    try { return JSON.parse(raw); }
    catch (e) { return { count: 0, lastDate: '' }; }
  }

  function saveStreak(streak) {
    window.storage.set(STREAK_KEY, JSON.stringify(streak));
  }

  // ─── SM-2 Algorithm ───

  function calculateNextReview(quality, previousInterval, easeFactor) {
    var newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEF < 1.3) newEF = 1.3;

    var newInterval;
    if (quality < 3) newInterval = 1;
    else if (previousInterval === 0) newInterval = 1;
    else if (previousInterval === 1) newInterval = 3;
    else newInterval = Math.round(previousInterval * newEF);

    return { interval: newInterval, easeFactor: newEF };
  }

  // ─── Public API ───

  function registerItem(item) {
    var items = loadItems();
    var id = item.id || ('sr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6));

    if (!items[id]) {
      items[id] = {
        id: id,
        chapter: item.chapter || '',
        type: item.type || '',
        prompt: item.prompt || '',
        answer: item.answer || '',
        korean_bridge: item.korean_bridge || '',
        mnemonic: item.mnemonic || '',
        palace_location: item.palace_location || '',
        last_review: item.last_review || todayStr(),
        interval_days: item.interval_days || 0,
        ease_factor: item.ease_factor || 2.5,
        times_reviewed: item.times_reviewed || 0,
        times_correct: item.times_correct || 0,
        created: item.created || todayStr()
      };
    } else {
      // Update fields but preserve review data
      var existing = items[id];
      existing.chapter = item.chapter || existing.chapter;
      existing.type = item.type || existing.type;
      existing.prompt = item.prompt || existing.prompt;
      existing.answer = item.answer || existing.answer;
      existing.korean_bridge = item.korean_bridge || existing.korean_bridge;
      existing.mnemonic = item.mnemonic || existing.mnemonic;
      existing.palace_location = item.palace_location || existing.palace_location;
    }

    saveItems(items);
    return id;
  }

  function getDueItems() {
    var items = loadItems();
    var today = todayStr();
    var due = [];

    for (var id in items) {
      if (!items.hasOwnProperty(id)) continue;
      var item = items[id];
      var dueDate = item.last_review;
      var daysOverdue = daysBetween(dueDate, today) - item.interval_days;

      if (daysOverdue >= 0) {
        item._overdue = daysOverdue;
        due.push(item);
      }
    }

    // Sort: most overdue first, then lowest ease factor
    due.sort(function (a, b) {
      if (b._overdue !== a._overdue) return b._overdue - a._overdue;
      return a.ease_factor - b.ease_factor;
    });

    // Clean up temporary sort key
    due.forEach(function (item) { delete item._overdue; });

    return due;
  }

  function reviewItem(id, quality) {
    if (quality < 0) quality = 0;
    if (quality > 5) quality = 5;

    var items = loadItems();
    var item = items[id];
    if (!item) return null;

    var result = calculateNextReview(quality, item.interval_days, item.ease_factor);

    item.interval_days = result.interval;
    item.ease_factor = result.easeFactor;
    item.last_review = todayStr();
    item.times_reviewed = (item.times_reviewed || 0) + 1;
    if (quality >= 3) {
      item.times_correct = (item.times_correct || 0) + 1;
    }

    saveItems(items);

    // Update streak
    updateStreak();

    return {
      id: id,
      newInterval: result.interval,
      newEaseFactor: result.easeFactor
    };
  }

  function updateStreak() {
    var streak = loadStreak();
    var today = todayStr();

    if (streak.lastDate === today) {
      // Already reviewed today, streak stays
      return;
    }

    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
      String(yesterday.getDate()).padStart(2, '0');

    if (streak.lastDate === yesterdayStr) {
      streak.count++;
    } else if (streak.lastDate === '') {
      streak.count = 1;
    } else {
      // Missed a day, reset
      streak.count = 1;
    }

    streak.lastDate = today;
    saveStreak(streak);
  }

  function getStats() {
    var items = loadItems();
    var totalItems = 0;
    var mastered = 0;

    for (var id in items) {
      if (!items.hasOwnProperty(id)) continue;
      totalItems++;
      if (items[id].ease_factor > 2.5 && items[id].interval_days > 21) {
        mastered++;
      }
    }

    var dueToday = getDueItems().length;
    var streak = loadStreak();

    // Check if streak should be reset (missed yesterday)
    var today = todayStr();
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
      String(yesterday.getDate()).padStart(2, '0');

    var currentStreak = streak.count;
    if (streak.lastDate !== today && streak.lastDate !== yesterdayStr) {
      currentStreak = 0;
    }

    return {
      totalItems: totalItems,
      dueToday: dueToday,
      mastered: mastered,
      streak: currentStreak
    };
  }

  // ─── Daily Review Widget ───

  function DailyReview(container) {
    var dueItems = getDueItems();
    var sessionSize = Math.min(Math.max(dueItems.length, 0), 25);
    if (sessionSize < 15 && dueItems.length >= 15) sessionSize = 15;
    var session = dueItems.slice(0, sessionSize);

    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      'Daily Review <span class="quiz-type">Spaced Repetition</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    if (session.length === 0) {
      var stats = getStats();
      body.appendChild(el('div', 'quiz-prompt',
        '<strong>No items due for review!</strong><br>' +
        'Total items: ' + stats.totalItems +
        ' | Mastered: ' + stats.mastered +
        ' | Streak: ' + stats.streak + ' day' + (stats.streak !== 1 ? 's' : '')
      ));
      container.appendChild(wrap);
      return;
    }

    var idx = 0;
    var results = [];
    var revealed = false;

    function renderItem() {
      body.innerHTML = '';
      revealed = false;

      var item = session[idx];
      var progress = el('div', '', '');
      progress.style.cssText = 'text-align:center;font-size:.78rem;color:var(--text-muted);margin-bottom:.75rem';
      progress.textContent = 'Card ' + (idx + 1) + ' of ' + session.length;
      body.appendChild(progress);

      // Prompt area
      var promptDiv = el('div', 'quiz-prompt',
        '<div style="font-size:1.8rem;margin-bottom:.5rem">' + item.prompt + '</div>' +
        (item.korean_bridge ? '<div style="font-size:.85rem;color:var(--text-muted)">Korean bridge: ' + item.korean_bridge + '</div>' : '') +
        (item.palace_location ? '<div style="font-size:.85rem;color:var(--text-muted)">Palace: ' + item.palace_location + '</div>' : '')
      );
      body.appendChild(promptDiv);

      // Answer area (hidden initially)
      var answerDiv = el('div', '', '');
      answerDiv.style.cssText = 'text-align:center;margin:1rem 0;display:none';
      answerDiv.innerHTML =
        '<div style="font-size:1.4rem;font-weight:600;color:var(--heading);margin-bottom:.3rem">' + item.answer + '</div>' +
        (item.mnemonic ? '<div style="font-size:.85rem;color:var(--text-muted);font-style:italic">' + item.mnemonic + '</div>' : '');
      body.appendChild(answerDiv);

      // Reveal button
      var revealBtn = el('button', 'quiz-btn', 'Reveal Answer');
      revealBtn.style.cssText = 'display:block;margin:1rem auto';
      body.appendChild(revealBtn);

      // Rating buttons (hidden initially)
      var ratingDiv = el('div', 'flashcard-rating');
      ratingDiv.style.display = 'none';

      var buttons = [
        { label: 'Again', quality: 1, cls: 'again' },
        { label: 'Hard', quality: 2, cls: 'hard' },
        { label: 'Easy', quality: 4, cls: 'easy' }
      ];

      buttons.forEach(function (b) {
        var btn = el('button', b.cls, b.label);
        btn.addEventListener('click', function () {
          var result = reviewItem(item.id, b.quality);
          results.push({
            item: item,
            quality: b.quality,
            result: result
          });
          idx++;
          if (idx < session.length) {
            renderItem();
          } else {
            renderSummary();
          }
        });
        ratingDiv.appendChild(btn);
      });
      body.appendChild(ratingDiv);

      revealBtn.addEventListener('click', function () {
        if (revealed) return;
        revealed = true;
        answerDiv.style.display = 'block';
        revealBtn.style.display = 'none';
        ratingDiv.style.display = 'flex';
      });
    }

    function renderSummary() {
      body.innerHTML = '';

      var correct = results.filter(function (r) { return r.quality >= 3; }).length;
      var accuracy = session.length > 0 ? Math.round((correct / session.length) * 100) : 0;
      var stats = getStats();

      var summaryDiv = el('div', '', '');
      summaryDiv.style.textAlign = 'center';

      summaryDiv.innerHTML =
        '<div style="font-size:1.3rem;font-weight:700;color:var(--heading);margin-bottom:1rem">Review Complete!</div>' +
        '<div style="font-size:2rem;font-weight:700;color:' + (accuracy >= 70 ? 'var(--quiz-correct)' : 'var(--quiz-incorrect)') + ';margin-bottom:.5rem">' + accuracy + '%</div>' +
        '<div style="font-size:.9rem;color:var(--text-muted);margin-bottom:.3rem">Accuracy</div>' +
        '<div style="margin:1rem 0;font-size:.9rem">' +
          '<div>Items reviewed: <strong>' + session.length + '</strong></div>' +
          '<div>Easy/Correct: <strong>' + correct + '</strong></div>' +
          '<div>Needs work: <strong>' + (session.length - correct) + '</strong></div>' +
          '<div>Total mastered: <strong>' + stats.mastered + '</strong></div>' +
          '<div>Streak: <strong>' + stats.streak + ' day' + (stats.streak !== 1 ? 's' : '') + '</strong></div>' +
        '</div>';

      // Items still needing work
      var hard = results.filter(function (r) { return r.quality < 3; });
      if (hard.length > 0) {
        var hardDiv = el('div', '', '');
        hardDiv.style.cssText = 'text-align:left;margin-top:1rem;padding:1rem;background:var(--surface-alt, #f5f5f5);border-radius:8px';
        hardDiv.innerHTML = '<div style="font-weight:600;margin-bottom:.5rem">Review these again:</div>';
        hard.forEach(function (r) {
          hardDiv.innerHTML += '<div style="margin-bottom:.3rem">' +
            '<strong>' + r.item.prompt + '</strong> = ' + r.item.answer +
            '</div>';
        });
        summaryDiv.appendChild(hardDiv);
      }

      body.appendChild(summaryDiv);
    }

    renderItem();
    container.appendChild(wrap);
  }

  // ─── Public API ───

  return {
    calculateNextReview: calculateNextReview,
    registerItem: registerItem,
    getDueItems: getDueItems,
    reviewItem: reviewItem,
    getStats: getStats,
    DailyReview: DailyReview
  };
})();
