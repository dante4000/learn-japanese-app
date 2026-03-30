/* Exercise runner — handles Run, Check, Hint, Reset for all interactive exercises */
(function () {

  function getEditor(exercise) {
    var aceEl = exercise.querySelector('[id^="ace-"]');
    if (!aceEl || !window.ZTH || !window.ZTH.editors) return null;
    return window.ZTH.editors[aceEl.id] || null;
  }

  function getTestCode(exercise) {
    var el = exercise.querySelector('script.test-code');
    return el ? el.textContent.trim() : '';
  }

  /* --- Output panel --- */
  function showOutput(exercise, stdout, stderr) {
    var out = exercise.querySelector('.exercise-output');
    if (!out) return;
    out.innerHTML = '';
    if (stdout) {
      var stdSpan = document.createElement('span');
      stdSpan.textContent = stdout;
      out.appendChild(stdSpan);
    }
    if (stderr) {
      if (stdout) out.appendChild(document.createTextNode('\n'));
      var errSpan = document.createElement('span');
      errSpan.className = 'stderr';
      errSpan.textContent = stderr;
      out.appendChild(errSpan);
    }
    out.classList.add('visible');
  }

  /* --- Test results panel --- */
  function showTests(exercise, results) {
    var container = exercise.querySelector('.exercise-tests');
    if (!container) return;
    container.innerHTML = '';
    var allPass = true;

    results.forEach(function (r) {
      var div = document.createElement('div');
      div.className = 'test-result ' + (r.pass ? 'pass' : 'fail');
      div.textContent = (r.pass ? 'PASS' : 'FAIL') + ': ' + r.name;
      if (!r.pass && r.message) {
        div.textContent += ' \u2014 ' + r.message;
      }
      container.appendChild(div);
      if (!r.pass) allPass = false;
    });

    container.classList.add('visible');

    if (allPass && results.length > 0) {
      var ch = exercise.getAttribute('data-ch');
      var ex = exercise.getAttribute('data-ex');
      if (ch && ex && window.ZTH && window.ZTH.progress) {
        window.ZTH.progress.markComplete(ch, ex);
      }
    }
  }

  /* --- Button handlers --- */
  function handleRun(exercise) {
    var editor = getEditor(exercise);
    if (!editor) return;
    if (!window.ZTH || !window.ZTH.pyodide) return;
    var code = editor.getValue();
    window.ZTH.pyodide.runCode(code, function (err, stdout, stderr) {
      showOutput(exercise, stdout, stderr);
    });
  }

  function handleCheck(exercise) {
    var editor = getEditor(exercise);
    if (!editor) return;
    if (!window.ZTH || !window.ZTH.pyodide) return;
    var code = editor.getValue();
    var testCode = getTestCode(exercise);
    if (!testCode) return;
    window.ZTH.pyodide.runTests(code, testCode, function (results) {
      showTests(exercise, results);
    });
  }

  function handleHint(exercise) {
    var hints = exercise.querySelectorAll('.exercise-hints .hint');
    var btn = exercise.querySelector('.ex-hint');
    if (!btn || !hints.length) return;
    var level = parseInt(btn.getAttribute('data-level') || '0', 10);
    if (level < hints.length) {
      hints[level].classList.add('revealed');
      btn.setAttribute('data-level', String(level + 1));
      if (level + 1 >= hints.length) {
        btn.disabled = true;
        btn.textContent = 'No more hints';
      }
    }
  }

  function handleReset(exercise) {
    var editor = getEditor(exercise);
    if (!editor) return;
    var starterEl = exercise.querySelector('script.starter-code');
    var starter = starterEl ? starterEl.textContent.trim() : '';
    editor.setValue(starter, -1);

    var out = exercise.querySelector('.exercise-output');
    if (out) { out.classList.remove('visible'); out.innerHTML = ''; }
    var tests = exercise.querySelector('.exercise-tests');
    if (tests) { tests.classList.remove('visible'); tests.innerHTML = ''; }

    exercise.querySelectorAll('.exercise-hints .hint').forEach(function (h) {
      h.classList.remove('revealed');
    });
    var hintBtn = exercise.querySelector('.ex-hint');
    if (hintBtn) {
      hintBtn.setAttribute('data-level', '0');
      hintBtn.disabled = false;
      hintBtn.textContent = 'Hint';
    }
  }

  /* --- Checklists --- */
  function initChecklists() {
    document.querySelectorAll('.checklist').forEach(function (cl) {
      var ch = cl.getAttribute('data-ch');
      var exId = cl.getAttribute('data-ex');
      var checkboxes = cl.querySelectorAll('input[type="checkbox"]');

      checkboxes.forEach(function (cb, i) {
        var key = exId + '-item-' + i;
        if (window.ZTH && window.ZTH.progress && window.ZTH.progress.isComplete(ch, key)) {
          cb.checked = true;
          cb.parentElement.classList.add('checked');
        }

        cb.addEventListener('change', function () {
          var itemKey = exId + '-item-' + i;
          if (cb.checked) {
            cb.parentElement.classList.add('checked');
            if (window.ZTH && window.ZTH.progress) window.ZTH.progress.markComplete(ch, itemKey);
          } else {
            cb.parentElement.classList.remove('checked');
            if (window.ZTH && window.ZTH.progress) {
              var data = window.ZTH.progress.load();
              if (data[ch]) { delete data[ch][itemKey]; window.ZTH.progress.save(data); }
            }
          }
          /* Check if all items done → mark whole checklist complete */
          var allChecked = true;
          checkboxes.forEach(function (c) { if (!c.checked) allChecked = false; });
          if (allChecked && window.ZTH && window.ZTH.progress) {
            window.ZTH.progress.markComplete(ch, exId);
          }
        });
      });
    });
  }

  /* --- Output-match exercises --- */
  function initOutputMatch() {
    document.querySelectorAll('.exercise[data-type="output-match"]').forEach(function (ex) {
      var verifyBtn = ex.querySelector('.ex-verify');
      if (!verifyBtn) return;

      verifyBtn.addEventListener('click', function () {
        var textarea = ex.querySelector('.exercise-paste');
        var pattern = ex.getAttribute('data-pattern');
        var feedback = ex.querySelector('.exercise-feedback');
        if (!textarea || !pattern || !feedback) return;

        var re;
        try {
          re = new RegExp(pattern, 'm');
        } catch (e) {
          feedback.className = 'exercise-feedback visible incorrect';
          feedback.textContent = 'Invalid verification pattern. Please report this issue.';
          return;
        }
        var match = re.test(textarea.value);

        feedback.className = 'exercise-feedback visible ' + (match ? 'correct' : 'incorrect');
        feedback.textContent = match
          ? 'Output verified!'
          : 'Output doesn\'t match expected pattern. Check the instructions and try again.';

        if (match) {
          var ch = ex.getAttribute('data-ch');
          var exId = ex.getAttribute('data-ex');
          if (ch && exId && window.ZTH && window.ZTH.progress) {
            window.ZTH.progress.markComplete(ch, exId);
          }
        }
      });
    });
  }

  /* --- Initialize all exercise types --- */
  function initExercises() {
    /* Pyodide exercises */
    document.querySelectorAll('.exercise[data-type="pyodide"]').forEach(function (ex) {
      var runBtn = ex.querySelector('.ex-run');
      var checkBtn = ex.querySelector('.ex-check');
      var hintBtn = ex.querySelector('.ex-hint');
      var resetBtn = ex.querySelector('.ex-reset');

      if (runBtn) runBtn.addEventListener('click', function () { handleRun(ex); });
      if (checkBtn) checkBtn.addEventListener('click', function () { handleCheck(ex); });
      if (hintBtn) hintBtn.addEventListener('click', function () { handleHint(ex); });
      if (resetBtn) resetBtn.addEventListener('click', function () { handleReset(ex); });
    });

    initChecklists();
    initOutputMatch();
  }

  window.ZTH = window.ZTH || {};
  window.ZTH.exerciseRunner = { init: initExercises };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExercises);
  } else {
    initExercises();
  }
})();
