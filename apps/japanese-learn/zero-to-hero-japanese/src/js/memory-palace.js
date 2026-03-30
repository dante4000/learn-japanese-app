/* ============================================================
   Zero to Hero — Memory Palace Walker
   Interactive spatial memory navigation and recall testing
   ============================================================ */

var MemoryPalace = (function () {
  'use strict';

  // ─── Helpers ───

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // ─── SVG Map Rendering ───

  function createSVGMap(locations, width, height, onLocationClick) {
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', '100%');
    svg.style.maxWidth = width + 'px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    svg.style.cursor = 'pointer';

    // Background
    var bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('width', width);
    bg.setAttribute('height', height);
    bg.setAttribute('fill', 'var(--surface-alt, #f8f6f0)');
    bg.setAttribute('rx', '12');
    svg.appendChild(bg);

    // Draw paths between locations
    for (var i = 0; i < locations.length - 1; i++) {
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', locations[i].position.x);
      line.setAttribute('y1', locations[i].position.y);
      line.setAttribute('x2', locations[i + 1].position.x);
      line.setAttribute('y2', locations[i + 1].position.y);
      line.setAttribute('stroke', 'var(--text-muted, #999)');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '6 4');
      line.setAttribute('opacity', '0.5');
      svg.appendChild(line);
    }

    // Draw location markers
    var markers = [];
    locations.forEach(function (loc, idx) {
      var g = document.createElementNS(svgNS, 'g');
      g.style.cursor = 'pointer';

      // Outer circle
      var circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', loc.position.x);
      circle.setAttribute('cy', loc.position.y);
      circle.setAttribute('r', '20');
      circle.setAttribute('fill', 'var(--a1, #4a90d9)');
      circle.setAttribute('opacity', '0.85');
      g.appendChild(circle);

      // Number label
      var text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', loc.position.x);
      text.setAttribute('y', loc.position.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', '600');
      text.textContent = String(idx + 1);
      g.appendChild(text);

      // Location name label
      var label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', loc.position.x);
      label.setAttribute('y', loc.position.y + 32);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', 'var(--heading, #333)');
      label.setAttribute('font-size', '11');
      label.textContent = loc.name;
      g.appendChild(label);

      g.addEventListener('click', function () {
        if (onLocationClick) onLocationClick(idx);
      });

      markers.push({ group: g, circle: circle });
      svg.appendChild(g);
    });

    return { svg: svg, markers: markers };
  }

  // ─── Palace Walker ───

  function Walker(container, data) {
    // data: { title, palace, locations: [{ id, name, position: {x,y}, item: {prompt, answer, detail} }] }
    var locations = data.locations || [];
    if (locations.length === 0) return;

    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      (data.title || 'Memory Palace') +
      ' <span class="quiz-type">' + (data.palace || 'Walk the Palace') + '</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    var mapWidth = 600;
    var mapHeight = 400;
    var mode = 'explore'; // 'explore' | 'walk' | 'review' | 'done'
    var walkIdx = 0;
    var results = [];
    var revealed = false;
    var mapData = null;

    function render() {
      body.innerHTML = '';

      if (mode === 'explore') {
        renderExploreMode();
      } else if (mode === 'walk') {
        renderWalkMode();
      } else if (mode === 'review') {
        renderReviewAtStop();
      } else if (mode === 'done') {
        renderDone();
      }
    }

    function renderExploreMode() {
      var desc = el('div', 'quiz-prompt',
        'Explore the palace by clicking locations on the map, or start a guided walk.'
      );
      body.appendChild(desc);

      mapData = createSVGMap(locations, mapWidth, mapHeight, function (idx) {
        showLocationPopup(idx);
      });
      body.appendChild(mapData.svg);

      var startBtn = el('button', 'quiz-btn', 'Walk the Palace');
      startBtn.style.cssText = 'display:block;margin:1rem auto';
      startBtn.addEventListener('click', function () {
        mode = 'walk';
        walkIdx = 0;
        results = [];
        render();
      });
      body.appendChild(startBtn);
    }

    function showLocationPopup(idx) {
      var loc = locations[idx];
      // Remove any existing popup
      var old = body.querySelector('.palace-popup');
      if (old) old.remove();

      var popup = el('div', 'palace-popup', '');
      popup.style.cssText = 'background:var(--surface, #fff);border:1px solid var(--border, #ddd);' +
        'border-radius:8px;padding:1rem;margin:1rem 0;text-align:center;position:relative';

      popup.innerHTML =
        '<div style="font-weight:600;font-size:1.1rem;margin-bottom:.5rem">' + loc.name + '</div>' +
        '<div style="font-size:1.3rem;margin-bottom:.3rem">' + loc.item.prompt + '</div>' +
        '<div style="font-size:1rem;color:var(--heading)">' + loc.item.answer + '</div>' +
        (loc.item.detail ? '<div style="font-size:.85rem;color:var(--text-muted);margin-top:.3rem">' + loc.item.detail + '</div>' : '');

      var closeBtn = el('button', 'quiz-btn secondary', 'Close');
      closeBtn.style.cssText = 'font-size:.78rem;padding:.25rem .6rem;margin-top:.5rem';
      closeBtn.addEventListener('click', function () { popup.remove(); });
      popup.appendChild(closeBtn);

      body.appendChild(popup);
    }

    function renderWalkMode() {
      var loc = locations[walkIdx];

      var progress = el('div', '', '');
      progress.style.cssText = 'text-align:center;font-size:.78rem;color:var(--text-muted);margin-bottom:.5rem';
      progress.textContent = 'Stop ' + (walkIdx + 1) + ' of ' + locations.length;
      body.appendChild(progress);

      // Show map with current location highlighted
      mapData = createSVGMap(locations, mapWidth, mapHeight, null);

      // Highlight current location
      mapData.markers.forEach(function (m, i) {
        if (i === walkIdx) {
          m.circle.setAttribute('fill', 'var(--quiz-correct, #4caf50)');
          m.circle.setAttribute('r', '24');
          m.circle.setAttribute('opacity', '1');
        } else if (i < walkIdx) {
          m.circle.setAttribute('fill', 'var(--text-muted, #999)');
          m.circle.setAttribute('opacity', '0.5');
        }
      });

      body.appendChild(mapData.svg);

      // Location name
      var locName = el('div', '', '');
      locName.style.cssText = 'text-align:center;font-size:1.2rem;font-weight:600;color:var(--heading);margin:1rem 0 .5rem';
      locName.textContent = loc.name;
      body.appendChild(locName);

      // Prompt: what's stored here?
      var promptDiv = el('div', 'quiz-prompt',
        'What item is stored at this location?'
      );
      promptDiv.style.textAlign = 'center';
      body.appendChild(promptDiv);

      // Recall button
      var recallBtn = el('button', 'quiz-btn', 'Reveal What\'s Here');
      recallBtn.style.cssText = 'display:block;margin:.75rem auto';
      recallBtn.addEventListener('click', function () {
        mode = 'review';
        render();
      });
      body.appendChild(recallBtn);
    }

    function renderReviewAtStop() {
      var loc = locations[walkIdx];
      revealed = true;

      var progress = el('div', '', '');
      progress.style.cssText = 'text-align:center;font-size:.78rem;color:var(--text-muted);margin-bottom:.5rem';
      progress.textContent = 'Stop ' + (walkIdx + 1) + ' of ' + locations.length;
      body.appendChild(progress);

      var locName = el('div', '', '');
      locName.style.cssText = 'text-align:center;font-size:1rem;font-weight:600;color:var(--heading);margin-bottom:.75rem';
      locName.textContent = loc.name;
      body.appendChild(locName);

      // Show the item
      var itemDiv = el('div', '', '');
      itemDiv.style.cssText = 'text-align:center;margin:1rem 0;padding:1rem;background:var(--surface-alt, #f5f5f5);border-radius:8px';
      itemDiv.innerHTML =
        '<div style="font-size:1.5rem;margin-bottom:.3rem">' + loc.item.prompt + '</div>' +
        '<div style="font-size:1.2rem;font-weight:600;color:var(--heading)">' + loc.item.answer + '</div>' +
        (loc.item.detail ? '<div style="font-size:.85rem;color:var(--text-muted);margin-top:.3rem">' + loc.item.detail + '</div>' : '');
      body.appendChild(itemDiv);

      // Rating buttons
      var ratingDiv = el('div', 'flashcard-rating');

      var buttons = [
        { label: 'Again', quality: 'again' },
        { label: 'Hard', quality: 'hard' },
        { label: 'Easy', quality: 'easy' }
      ];

      buttons.forEach(function (b) {
        var btn = el('button', b.quality, b.label);
        btn.addEventListener('click', function () {
          results.push({
            location: loc.name,
            item: loc.item,
            rating: b.quality
          });

          // If SpacedRepetition is available, record the review
          if (loc.id && typeof SpacedRepetition !== 'undefined' && SpacedRepetition.reviewItem) {
            var qualityMap = { again: 1, hard: 2, easy: 4 };
            SpacedRepetition.reviewItem(loc.id, qualityMap[b.quality]);
          }

          walkIdx++;
          if (walkIdx < locations.length) {
            mode = 'walk';
          } else {
            mode = 'done';
          }
          render();
        });
        ratingDiv.appendChild(btn);
      });
      body.appendChild(ratingDiv);
    }

    function renderDone() {
      var easy = results.filter(function (r) { return r.rating === 'easy'; }).length;
      var hard = results.filter(function (r) { return r.rating === 'hard'; }).length;
      var again = results.filter(function (r) { return r.rating === 'again'; }).length;
      var accuracy = locations.length > 0 ? Math.round((easy / locations.length) * 100) : 0;

      var summaryDiv = el('div', '', '');
      summaryDiv.style.textAlign = 'center';

      summaryDiv.innerHTML =
        '<div style="font-size:1.3rem;font-weight:700;color:var(--heading);margin-bottom:1rem">Palace Walk Complete!</div>' +
        '<div style="font-size:2rem;font-weight:700;color:' + (accuracy >= 70 ? 'var(--quiz-correct)' : 'var(--quiz-incorrect)') + ';margin-bottom:.5rem">' + accuracy + '%</div>' +
        '<div style="font-size:.9rem;color:var(--text-muted);margin-bottom:.3rem">Easy recall rate</div>' +
        '<div style="margin:1rem 0;font-size:.9rem">' +
          '<div>Total stops: <strong>' + locations.length + '</strong></div>' +
          '<div>Easy: <strong>' + easy + '</strong></div>' +
          '<div>Hard: <strong>' + hard + '</strong></div>' +
          '<div>Again: <strong>' + again + '</strong></div>' +
        '</div>';

      // Items needing review
      var needsWork = results.filter(function (r) { return r.rating !== 'easy'; });
      if (needsWork.length > 0) {
        var hardDiv = el('div', '', '');
        hardDiv.style.cssText = 'text-align:left;margin-top:1rem;padding:1rem;background:var(--surface-alt, #f5f5f5);border-radius:8px';
        hardDiv.innerHTML = '<div style="font-weight:600;margin-bottom:.5rem">Review these locations:</div>';
        needsWork.forEach(function (r) {
          hardDiv.innerHTML += '<div style="margin-bottom:.3rem">' +
            '<strong>' + r.location + ':</strong> ' +
            r.item.prompt + ' = ' + r.item.answer +
            '</div>';
        });
        summaryDiv.appendChild(hardDiv);
      }

      body.appendChild(summaryDiv);

      // Walk again button
      var againBtn = el('button', 'quiz-btn', 'Walk Again');
      againBtn.style.cssText = 'display:block;margin:1rem auto';
      againBtn.addEventListener('click', function () {
        mode = 'explore';
        walkIdx = 0;
        results = [];
        revealed = false;
        render();
      });
      body.appendChild(againBtn);
    }

    render();
    container.appendChild(wrap);
  }

  // ─── Palace Audit ───

  function Audit(container, palaces) {
    // palaces: [{ title, palace, locations: [...] }]
    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      'Palace Audit <span class="quiz-type">Random recall test</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    // Collect all items from all palaces
    var allItems = [];
    palaces.forEach(function (palace) {
      (palace.locations || []).forEach(function (loc) {
        allItems.push({
          palace: palace.title || palace.palace || 'Unknown Palace',
          location: loc.name,
          id: loc.id,
          item: loc.item
        });
      });
    });

    if (allItems.length === 0) {
      body.appendChild(el('div', 'quiz-prompt', 'No palace items to audit.'));
      container.appendChild(wrap);
      return;
    }

    // Shuffle and pick up to 15 items
    var testItems = shuffleArray(allItems).slice(0, 15);
    var idx = 0;
    var results = [];

    function renderAuditItem() {
      body.innerHTML = '';

      if (idx >= testItems.length) {
        renderAuditSummary();
        return;
      }

      var item = testItems[idx];

      var progress = el('div', '', '');
      progress.style.cssText = 'text-align:center;font-size:.78rem;color:var(--text-muted);margin-bottom:.75rem';
      progress.textContent = 'Item ' + (idx + 1) + ' of ' + testItems.length;
      body.appendChild(progress);

      var palaceLabel = el('div', '', '');
      palaceLabel.style.cssText = 'text-align:center;font-size:.8rem;color:var(--text-muted);margin-bottom:.25rem';
      palaceLabel.textContent = item.palace + ' — ' + item.location;
      body.appendChild(palaceLabel);

      var promptDiv = el('div', 'quiz-prompt', '');
      promptDiv.style.cssText = 'text-align:center;font-size:1.6rem;margin:1rem 0';
      promptDiv.textContent = item.item.prompt;
      body.appendChild(promptDiv);

      // Answer (hidden)
      var answerDiv = el('div', '', '');
      answerDiv.style.cssText = 'text-align:center;margin:1rem 0;display:none';
      answerDiv.innerHTML =
        '<div style="font-size:1.3rem;font-weight:600;color:var(--heading)">' + item.item.answer + '</div>' +
        (item.item.detail ? '<div style="font-size:.85rem;color:var(--text-muted);margin-top:.3rem">' + item.item.detail + '</div>' : '');
      body.appendChild(answerDiv);

      var revealBtn = el('button', 'quiz-btn', 'Reveal Answer');
      revealBtn.style.cssText = 'display:block;margin:.75rem auto';
      body.appendChild(revealBtn);

      var ratingDiv = el('div', 'flashcard-rating');
      ratingDiv.style.display = 'none';

      var buttons = [
        { label: 'Again', quality: 'again' },
        { label: 'Hard', quality: 'hard' },
        { label: 'Easy', quality: 'easy' }
      ];

      buttons.forEach(function (b) {
        var btn = el('button', b.quality, b.label);
        btn.addEventListener('click', function () {
          results.push({
            item: item,
            rating: b.quality
          });

          if (item.id && typeof SpacedRepetition !== 'undefined' && SpacedRepetition.reviewItem) {
            var qualityMap = { again: 1, hard: 2, easy: 4 };
            SpacedRepetition.reviewItem(item.id, qualityMap[b.quality]);
          }

          idx++;
          renderAuditItem();
        });
        ratingDiv.appendChild(btn);
      });
      body.appendChild(ratingDiv);

      revealBtn.addEventListener('click', function () {
        answerDiv.style.display = 'block';
        revealBtn.style.display = 'none';
        ratingDiv.style.display = 'flex';
      });
    }

    function renderAuditSummary() {
      body.innerHTML = '';

      var easy = results.filter(function (r) { return r.rating === 'easy'; }).length;
      var hard = results.filter(function (r) { return r.rating === 'hard'; }).length;
      var again = results.filter(function (r) { return r.rating === 'again'; }).length;
      var accuracy = testItems.length > 0 ? Math.round((easy / testItems.length) * 100) : 0;

      var summaryDiv = el('div', '', '');
      summaryDiv.style.textAlign = 'center';

      summaryDiv.innerHTML =
        '<div style="font-size:1.3rem;font-weight:700;color:var(--heading);margin-bottom:1rem">Audit Complete!</div>' +
        '<div style="font-size:2rem;font-weight:700;color:' + (accuracy >= 70 ? 'var(--quiz-correct)' : 'var(--quiz-incorrect)') + ';margin-bottom:.5rem">' + accuracy + '%</div>' +
        '<div style="font-size:.9rem;color:var(--text-muted);margin-bottom:.3rem">Easy recall rate across ' + palaces.length + ' palace' + (palaces.length !== 1 ? 's' : '') + '</div>' +
        '<div style="margin:1rem 0;font-size:.9rem">' +
          '<div>Items tested: <strong>' + testItems.length + '</strong></div>' +
          '<div>Easy: <strong>' + easy + '</strong></div>' +
          '<div>Hard: <strong>' + hard + '</strong></div>' +
          '<div>Again: <strong>' + again + '</strong></div>' +
        '</div>';

      var needsWork = results.filter(function (r) { return r.rating !== 'easy'; });
      if (needsWork.length > 0) {
        var hardDiv = el('div', '', '');
        hardDiv.style.cssText = 'text-align:left;margin-top:1rem;padding:1rem;background:var(--surface-alt, #f5f5f5);border-radius:8px';
        hardDiv.innerHTML = '<div style="font-weight:600;margin-bottom:.5rem">Needs review:</div>';
        needsWork.forEach(function (r) {
          hardDiv.innerHTML += '<div style="margin-bottom:.3rem">' +
            '<em>' + r.item.palace + ' / ' + r.item.location + ':</em> ' +
            '<strong>' + r.item.item.prompt + '</strong> = ' + r.item.item.answer +
            '</div>';
        });
        summaryDiv.appendChild(hardDiv);
      }

      body.appendChild(summaryDiv);

      var retryBtn = el('button', 'quiz-btn', 'Audit Again');
      retryBtn.style.cssText = 'display:block;margin:1rem auto';
      retryBtn.addEventListener('click', function () {
        idx = 0;
        results = [];
        testItems = shuffleArray(allItems).slice(0, 15);
        renderAuditItem();
      });
      body.appendChild(retryBtn);
    }

    renderAuditItem();
    container.appendChild(wrap);
  }

  // ─── Public API ───

  return {
    Walker: Walker,
    Audit: Audit
  };
})();
