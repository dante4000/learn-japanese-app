/* ============================================================
   Zero to Hero — Quiz Engine
   9 reusable quiz component types
   ============================================================ */

var QuizEngine = (function () {
  'use strict';

  var idCounter = 0;
  function uid() { return 'quiz-' + (++idCounter); }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  // ─── 1. Click-to-Reveal Flashcard ───
  function Flashcard(container, data) {
    // data: { cards: [{ front, back, detail }] }
    var idx = 0;
    var cards = data.cards;

    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header', 'Flashcard <span class="quiz-type">Click to reveal</span>');
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    function renderCard() {
      var c = cards[idx];
      body.innerHTML = '';

      var fc = el('div', 'flashcard');
      var inner = el('div', 'flashcard-inner');
      var front = el('div', 'flashcard-front',
        '<div class="char">' + c.front + '</div>' +
        '<div class="hint">Click to reveal</div>'
      );
      var back = el('div', 'flashcard-back',
        '<div class="answer">' + c.back + '</div>' +
        '<div class="detail">' + (c.detail || '') + '</div>'
      );
      inner.appendChild(front);
      inner.appendChild(back);
      fc.appendChild(inner);

      fc.addEventListener('click', function () {
        fc.classList.toggle('flipped');
      });

      body.appendChild(fc);

      var rating = el('div', 'flashcard-rating');
      ['Again', 'Hard', 'Easy'].forEach(function (label) {
        var btn = el('button', label.toLowerCase(), label);
        btn.addEventListener('click', function () {
          idx = (idx + 1) % cards.length;
          renderCard();
        });
        rating.appendChild(btn);
      });
      body.appendChild(rating);

      var counter = el('div', '', '');
      counter.style.cssText = 'text-align:center;font-size:.78rem;color:var(--text-muted);margin-top:.5rem';
      counter.textContent = (idx + 1) + ' / ' + cards.length;
      body.appendChild(counter);
    }

    renderCard();
    container.appendChild(wrap);
  }

  // ─── 2. Drag-and-Drop Matching ───
  function DragMatch(container, data) {
    // data: { pairs: [{ left, right }], instruction }
    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      (data.title || 'Matching') + ' <span class="quiz-type">Drag and drop</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    if (data.instruction) {
      body.appendChild(el('div', 'quiz-prompt', data.instruction));
    }

    var pairs = data.pairs.slice();
    var shuffledRight = pairs.map(function (p) { return p.right; })
      .sort(function () { return Math.random() - 0.5; });

    var grid = el('div', 'drag-match');
    var leftCol = el('div', 'drag-column');
    var rightCol = el('div', 'drag-column');

    var dropZones = [];
    var answers = {};

    pairs.forEach(function (p, i) {
      var item = el('div', 'drag-item', p.left);
      item.style.cursor = 'default';
      var zone = el('div', 'drop-zone', 'Drop here');
      zone.setAttribute('data-idx', i);
      zone.setAttribute('data-answer', p.right);
      leftCol.appendChild(item);
      leftCol.appendChild(zone);
      dropZones.push(zone);
    });

    shuffledRight.forEach(function (r) {
      var item = el('div', 'drag-item', r);
      item.setAttribute('draggable', 'true');
      item.setAttribute('data-value', r);

      item.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', r);
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', function () {
        item.classList.remove('dragging');
      });

      // Touch support
      var touchData = null;
      item.addEventListener('touchstart', function (e) {
        touchData = { value: r, el: item };
        item.classList.add('dragging');
      });
      item.addEventListener('touchend', function (e) {
        if (!touchData) return;
        item.classList.remove('dragging');
        var touch = e.changedTouches[0];
        var target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains('drop-zone')) {
          handleDrop(target, touchData.value, item);
        }
        touchData = null;
      });

      rightCol.appendChild(item);
    });

    dropZones.forEach(function (zone) {
      zone.addEventListener('dragover', function (e) {
        e.preventDefault();
        zone.classList.add('over');
      });
      zone.addEventListener('dragleave', function () {
        zone.classList.remove('over');
      });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        zone.classList.remove('over');
        var value = e.dataTransfer.getData('text/plain');
        var dragEl = rightCol.querySelector('[data-value="' + CSS.escape(value) + '"]');
        handleDrop(zone, value, dragEl);
      });
    });

    function handleDrop(zone, value, dragEl) {
      zone.textContent = value;
      zone.classList.add('filled');
      if (dragEl) dragEl.style.display = 'none';
      answers[zone.getAttribute('data-idx')] = value;

      if (Object.keys(answers).length === pairs.length) {
        checkAnswers();
      }
    }

    function checkAnswers() {
      var correct = 0;
      dropZones.forEach(function (zone) {
        var idx = zone.getAttribute('data-idx');
        var expected = zone.getAttribute('data-answer');
        if (answers[idx] === expected) {
          zone.classList.add('matched-correct');
          correct++;
        } else {
          zone.classList.add('matched-incorrect');
        }
      });
      var fb = el('div', 'quiz-feedback show ' + (correct === pairs.length ? 'correct' : 'incorrect'));
      fb.textContent = correct + '/' + pairs.length + ' correct' +
        (correct === pairs.length ? ' — Perfect!' : ' — Review the ones you missed.');
      body.appendChild(fb);
    }

    grid.appendChild(leftCol);
    grid.appendChild(rightCol);
    body.appendChild(grid);
    container.appendChild(wrap);
  }

  // ─── 3. Fill-in-the-Blank ───
  function FillBlank(container, data) {
    // data: { questions: [{ prompt, answer, acceptAlso:[], explanation, korean }] }
    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      (data.title || 'Fill in the Blank') + ' <span class="quiz-type">Type your answer</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    data.questions.forEach(function (q, qi) {
      var qDiv = el('div', '', '');
      qDiv.style.marginBottom = '1.5rem';

      var prompt = el('div', 'quiz-prompt', q.prompt);
      qDiv.appendChild(prompt);

      var input = el('input', 'fill-blank-input');
      input.type = 'text';
      input.placeholder = 'Your answer...';
      input.setAttribute('data-answer', q.answer);
      input.autocomplete = 'off';
      qDiv.appendChild(input);

      var checkBtn = el('button', 'quiz-btn', 'Check');
      checkBtn.style.marginLeft = '.5rem';
      checkBtn.style.verticalAlign = 'middle';
      qDiv.appendChild(checkBtn);

      var fb = el('div', 'quiz-feedback');
      qDiv.appendChild(fb);

      function check() {
        var val = input.value.trim();
        var accept = [q.answer].concat(q.acceptAlso || []);
        var isCorrect = accept.some(function (a) {
          return val === a || val.toLowerCase() === a.toLowerCase();
        });
        input.classList.remove('correct', 'incorrect');
        fb.classList.remove('correct', 'incorrect');
        if (isCorrect) {
          input.classList.add('correct');
          fb.className = 'quiz-feedback show correct';
          fb.innerHTML = 'Correct!' + (q.explanation ? ' ' + q.explanation : '');
        } else {
          input.classList.add('incorrect');
          fb.className = 'quiz-feedback show incorrect';
          fb.innerHTML = 'Answer: <strong>' + q.answer + '</strong>' +
            (q.korean ? ' (Korean: ' + q.korean + ')' : '') +
            (q.explanation ? '<br>' + q.explanation : '');
        }
      }

      checkBtn.addEventListener('click', check);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') check();
      });

      body.appendChild(qDiv);
    });

    container.appendChild(wrap);
  }

  // ─── 4. Timed Recognition Sprint ───
  function TimedSprint(container, data) {
    // data: { items: [{ prompt, answer }], timeLimit (seconds) }
    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      (data.title || 'Timed Sprint') + ' <span class="quiz-type">Speed challenge</span>'
    );
    var body = el('div', 'quiz-body sprint-container');
    wrap.appendChild(header);
    wrap.appendChild(body);

    var items = data.items.slice().sort(function () { return Math.random() - 0.5; });
    var timeLimit = data.timeLimit || 90;
    var idx = 0, correct = 0, total = 0;
    var timer = null, timeLeft = timeLimit;

    var timerEl = el('div', 'sprint-timer', formatTime(timeLeft));
    var charEl = el('div', 'sprint-char', '');
    var inputEl = el('input', 'sprint-input');
    inputEl.type = 'text';
    inputEl.autocomplete = 'off';
    var scoreEl = el('div', 'sprint-score', 'Score: 0 / 0');
    var startBtn = el('button', 'quiz-btn', 'Start Sprint');

    body.appendChild(timerEl);
    body.appendChild(charEl);
    body.appendChild(inputEl);
    body.appendChild(scoreEl);
    body.appendChild(startBtn);

    charEl.textContent = 'Ready?';
    inputEl.style.display = 'none';

    function formatTime(s) {
      var m = Math.floor(s / 60);
      var sec = s % 60;
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function showItem() {
      if (idx >= items.length) idx = 0;
      charEl.textContent = items[idx].prompt;
      inputEl.value = '';
      inputEl.focus();
    }

    function endSprint() {
      clearInterval(timer);
      charEl.textContent = 'Done!';
      inputEl.style.display = 'none';
      scoreEl.textContent = 'Final: ' + correct + ' / ' + total + ' correct';
      startBtn.textContent = 'Try Again';
      startBtn.style.display = 'inline-block';
    }

    startBtn.addEventListener('click', function () {
      idx = 0; correct = 0; total = 0; timeLeft = timeLimit;
      items.sort(function () { return Math.random() - 0.5; });
      inputEl.style.display = 'block';
      startBtn.style.display = 'none';
      timerEl.textContent = formatTime(timeLeft);
      showItem();

      timer = setInterval(function () {
        timeLeft--;
        timerEl.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) endSprint();
      }, 1000);
    });

    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var val = inputEl.value.trim();
        total++;
        var accept = [items[idx].answer];
        if (items[idx].acceptAlso) accept = accept.concat(items[idx].acceptAlso);
        if (accept.some(function (a) { return val === a || val.toLowerCase() === a.toLowerCase(); })) {
          correct++;
          charEl.style.color = 'var(--quiz-correct)';
        } else {
          charEl.style.color = 'var(--quiz-incorrect)';
        }
        scoreEl.textContent = 'Score: ' + correct + ' / ' + total;
        setTimeout(function () {
          charEl.style.color = '';
          idx++;
          if (idx >= items.length) idx = 0;
          showItem();
        }, 300);
      }
    });

    container.appendChild(wrap);
  }

  // ─── 5. Sentence Builder ───
  function SentenceBuilder(container, data) {
    // data: { sentences: [{ words: [], correct: "", hint }] }
    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      (data.title || 'Sentence Builder') + ' <span class="quiz-type">Arrange the words</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    data.sentences.forEach(function (s, si) {
      var sDiv = el('div', 'sentence-builder');
      if (s.hint) sDiv.appendChild(el('div', 'quiz-prompt', s.hint));

      var shuffled = s.words.slice().sort(function () { return Math.random() - 0.5; });
      var placed = [];

      var target = el('div', 'sentence-target');
      target.setAttribute('data-correct', s.correct);

      var bank = el('div', 'word-bank');
      shuffled.forEach(function (w) {
        var token = el('div', 'word-token', w);
        token.addEventListener('click', function () {
          if (token.classList.contains('placed')) return;
          token.classList.add('placed');
          placed.push(w);
          var t = el('div', 'word-token', w);
          t.addEventListener('click', function () {
            placed = placed.filter(function (x) { return x !== w; });
            t.remove();
            token.classList.remove('placed');
          });
          target.appendChild(t);
        });
        bank.appendChild(token);
      });

      sDiv.appendChild(bank);
      sDiv.appendChild(target);

      var checkBtn = el('button', 'quiz-btn', 'Check');
      var fb = el('div', 'quiz-feedback');
      sDiv.appendChild(checkBtn);
      sDiv.appendChild(fb);

      checkBtn.addEventListener('click', function () {
        var answer = placed.join('');
        var correct = s.correct.replace(/\s/g, '');
        fb.classList.remove('correct', 'incorrect');
        if (answer === correct || placed.join(' ') === s.correct || placed.join('') === s.correct.replace(/\s/g, '')) {
          fb.className = 'quiz-feedback show correct';
          fb.textContent = 'Correct! ' + s.correct;
        } else {
          fb.className = 'quiz-feedback show incorrect';
          fb.innerHTML = 'Not quite. Correct order: <strong>' + s.correct + '</strong>';
        }
      });

      body.appendChild(sDiv);
    });

    container.appendChild(wrap);
  }

  // ─── 6. Audio Discrimination (Visual) ───
  function AudioDiscrimination(container, data) {
    // data: { pairs: [{ a, b, question, answer: 'a'|'b', explanation }] }
    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      (data.title || 'Sound Discrimination') + ' <span class="quiz-type">Minimal pairs</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    data.pairs.forEach(function (p) {
      var pDiv = el('div', '');
      pDiv.style.marginBottom = '1.5rem';
      pDiv.appendChild(el('div', 'quiz-prompt', p.question));

      var opts = el('div', 'quiz-options');
      opts.style.flexDirection = 'row';
      opts.style.gap = '1rem';

      var btnA = el('button', 'quiz-option', '<strong>A:</strong> ' + p.a);
      var btnB = el('button', 'quiz-option', '<strong>B:</strong> ' + p.b);

      var fb = el('div', 'quiz-feedback');

      function check(choice) {
        btnA.classList.remove('selected', 'correct', 'incorrect');
        btnB.classList.remove('selected', 'correct', 'incorrect');
        if (choice === p.answer) {
          (choice === 'a' ? btnA : btnB).classList.add('correct');
          fb.className = 'quiz-feedback show correct';
          fb.textContent = 'Correct!' + (p.explanation ? ' ' + p.explanation : '');
        } else {
          (choice === 'a' ? btnA : btnB).classList.add('incorrect');
          (p.answer === 'a' ? btnA : btnB).classList.add('correct');
          fb.className = 'quiz-feedback show incorrect';
          fb.innerHTML = 'The answer is <strong>' + (p.answer === 'a' ? p.a : p.b) + '</strong>.' +
            (p.explanation ? ' ' + p.explanation : '');
        }
      }

      btnA.addEventListener('click', function () { check('a'); });
      btnB.addEventListener('click', function () { check('b'); });

      opts.appendChild(btnA);
      opts.appendChild(btnB);
      pDiv.appendChild(opts);
      pDiv.appendChild(fb);
      body.appendChild(pDiv);
    });

    container.appendChild(wrap);
  }

  // ─── 7. Spaced Recall Check ───
  function RecallCheck(container, data) {
    // data: { fromChapters: "Ch02-04", items: [{ question, answer }] }
    var wrap = el('div', 'recall-check');
    var title = el('div', 'recall-title',
      'Recall Check — from ' + (data.fromChapters || 'earlier chapters')
    );
    wrap.appendChild(title);

    data.items.forEach(function (item) {
      var qDiv = el('div', '');
      qDiv.style.marginBottom = '1rem';
      var q = el('div', '', item.question);
      q.style.cssText = 'font-size:.92rem;color:var(--heading);margin-bottom:.3rem;font-weight:500';
      qDiv.appendChild(q);

      var reveal = el('button', 'quiz-btn secondary', 'Show Answer');
      reveal.style.cssText = 'font-size:.78rem;padding:.3rem .8rem';
      var ans = el('div', '');
      ans.style.cssText = 'font-size:.88rem;color:var(--a3);margin-top:.3rem;display:none';
      ans.textContent = item.answer;

      reveal.addEventListener('click', function () {
        ans.style.display = ans.style.display === 'none' ? 'block' : 'none';
        reveal.textContent = ans.style.display === 'none' ? 'Show Answer' : 'Hide';
      });

      qDiv.appendChild(reveal);
      qDiv.appendChild(ans);
      wrap.appendChild(qDiv);
    });

    container.appendChild(wrap);
  }

  // ─── Multiple Choice (bonus utility) ───
  function MultipleChoice(container, data) {
    // data: { questions: [{ prompt, options: [], correctIndex, explanation }] }
    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      (data.title || 'Quiz') + ' <span class="quiz-type">Multiple choice</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    data.questions.forEach(function (q) {
      var qDiv = el('div', '');
      qDiv.style.marginBottom = '1.5rem';
      qDiv.appendChild(el('div', 'quiz-prompt', q.prompt));

      var opts = el('div', 'quiz-options');
      var answered = false;

      q.options.forEach(function (opt, oi) {
        var btn = el('button', 'quiz-option', opt);
        btn.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          opts.querySelectorAll('.quiz-option').forEach(function (b, bi) {
            if (bi === q.correctIndex) b.classList.add('correct');
            else if (bi === oi && oi !== q.correctIndex) b.classList.add('incorrect');
          });
          if (q.explanation) {
            var fb = el('div', 'quiz-feedback show ' + (oi === q.correctIndex ? 'correct' : 'incorrect'));
            fb.textContent = q.explanation;
            qDiv.appendChild(fb);
          }
        });
        opts.appendChild(btn);
      });

      qDiv.appendChild(opts);
      body.appendChild(qDiv);
    });

    container.appendChild(wrap);
  }

  // ─── 8. Memory Palace Walker ───
  function PalaceWalker(container, data) {
    // data: { title, palace, locations: [{ id, name, position: {x,y}, item: {prompt, answer, detail} }] }
    // Delegates to MemoryPalace.Walker if available
    if (typeof MemoryPalace !== 'undefined' && MemoryPalace.Walker) {
      MemoryPalace.Walker(container, data);
    } else {
      var wrap = el('div', 'quiz-container');
      var header = el('div', 'quiz-header',
        (data.title || 'Palace Walker') + ' <span class="quiz-type">Memory Palace</span>'
      );
      var body = el('div', 'quiz-body');
      wrap.appendChild(header);
      wrap.appendChild(body);

      body.appendChild(el('div', 'quiz-prompt',
        '<strong>Memory Palace module not loaded.</strong><br>' +
        'Include memory-palace.js before quiz-engine.js.'
      ));
      container.appendChild(wrap);
    }
  }

  // ─── 9. Predict-and-Verify ───
  function PredictVerify(container, data) {
    // data: { title, items: [{ korean, context, answer, acceptAlso:[], explanation }] }
    var wrap = el('div', 'quiz-container');
    var header = el('div', 'quiz-header',
      (data.title || 'Predict & Verify') + ' <span class="quiz-type">Korean bridge prediction</span>'
    );
    var body = el('div', 'quiz-body');
    wrap.appendChild(header);
    wrap.appendChild(body);

    var items = data.items || [];
    var totalPredictions = 0;
    var correctPredictions = 0;

    // Accuracy tracker
    var accuracyDiv = el('div', '', '');
    accuracyDiv.style.cssText = 'text-align:center;font-size:.85rem;color:var(--text-muted);margin-bottom:1rem;font-weight:500';
    accuracyDiv.textContent = 'Prediction accuracy: --';
    body.appendChild(accuracyDiv);

    function updateAccuracy() {
      var pct = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
      accuracyDiv.textContent = 'Prediction accuracy: ' + pct + '% (' + correctPredictions + '/' + totalPredictions + ')';
      accuracyDiv.style.color = totalPredictions === 0 ? 'var(--text-muted)' :
        pct >= 70 ? 'var(--quiz-correct)' : 'var(--quiz-incorrect)';
    }

    items.forEach(function (item, qi) {
      var qDiv = el('div', '', '');
      qDiv.style.cssText = 'margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border, #eee)';

      // Korean reading clue
      var koreanDiv = el('div', '', '');
      koreanDiv.style.cssText = 'font-size:.9rem;color:var(--text-muted);margin-bottom:.3rem';
      koreanDiv.innerHTML = '<strong>Korean reading:</strong> ' + item.korean;
      qDiv.appendChild(koreanDiv);

      // Context clue
      if (item.context) {
        var contextDiv = el('div', '', '');
        contextDiv.style.cssText = 'font-size:.88rem;color:var(--heading);margin-bottom:.75rem';
        contextDiv.innerHTML = '<strong>Context:</strong> ' + item.context;
        qDiv.appendChild(contextDiv);
      }

      // Prompt
      var promptDiv = el('div', 'quiz-prompt', 'Predict the Japanese reading:');
      promptDiv.style.fontSize = '.92rem';
      qDiv.appendChild(promptDiv);

      // Input field
      var input = el('input', 'fill-blank-input');
      input.type = 'text';
      input.placeholder = 'Type your prediction...';
      input.autocomplete = 'off';
      qDiv.appendChild(input);

      // Verify button
      var verifyBtn = el('button', 'quiz-btn', 'Verify');
      verifyBtn.style.marginLeft = '.5rem';
      verifyBtn.style.verticalAlign = 'middle';
      qDiv.appendChild(verifyBtn);

      // Feedback area
      var fb = el('div', 'quiz-feedback');
      qDiv.appendChild(fb);

      var answered = false;

      function verify() {
        if (answered) return;
        answered = true;

        var val = input.value.trim();
        var accept = [item.answer].concat(item.acceptAlso || []);
        var isCorrect = accept.some(function (a) {
          return val === a || val.toLowerCase() === a.toLowerCase();
        });

        totalPredictions++;
        input.classList.remove('correct', 'incorrect');
        fb.classList.remove('correct', 'incorrect');

        if (isCorrect) {
          correctPredictions++;
          input.classList.add('correct');
          fb.className = 'quiz-feedback show correct';
          fb.innerHTML = 'Correct prediction! <strong>' + item.answer + '</strong>' +
            (item.explanation ? '<br>' + item.explanation : '');
        } else {
          input.classList.add('incorrect');
          fb.className = 'quiz-feedback show incorrect';
          fb.innerHTML = 'Actual Japanese reading: <strong>' + item.answer + '</strong>' +
            (val ? '<br>Your prediction: <em>' + val + '</em>' : '<br><em>(no prediction entered)</em>') +
            (item.explanation ? '<br>' + item.explanation : '');
        }

        // Disable input after answering
        input.disabled = true;
        verifyBtn.disabled = true;
        verifyBtn.style.opacity = '0.5';

        updateAccuracy();
      }

      verifyBtn.addEventListener('click', verify);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') verify();
      });

      body.appendChild(qDiv);
    });

    container.appendChild(wrap);
  }

  // Public API
  return {
    Flashcard: Flashcard,
    DragMatch: DragMatch,
    FillBlank: FillBlank,
    TimedSprint: TimedSprint,
    SentenceBuilder: SentenceBuilder,
    AudioDiscrimination: AudioDiscrimination,
    RecallCheck: RecallCheck,
    MultipleChoice: MultipleChoice,
    PalaceWalker: PalaceWalker,
    PredictVerify: PredictVerify
  };
})();
