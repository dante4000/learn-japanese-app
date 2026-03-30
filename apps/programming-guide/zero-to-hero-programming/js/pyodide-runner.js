/* Pyodide runner — lazy-loads Python WebAssembly runtime on first use */
(function () {
  var pyodideInstance = null;
  var loading = false;
  var loadCallbacks = [];

  function ensureLoaded(callback) {
    if (pyodideInstance) { callback(pyodideInstance); return; }
    loadCallbacks.push(callback);
    if (loading) return;
    loading = true;

    /* Show loading overlay on all Pyodide exercise editors */
    document.querySelectorAll('.exercise[data-type="pyodide"] .exercise-editor').forEach(function (el) {
      if (el.querySelector('.pyodide-loading')) return;
      var overlay = document.createElement('div');
      overlay.className = 'pyodide-loading';
      overlay.innerHTML = '<span>Loading Python runtime\u2026</span>';
      el.appendChild(overlay);
    });

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
    script.onload = function () {
      /* global loadPyodide */
      loadPyodide().then(function (py) {
        pyodideInstance = py;
        document.querySelectorAll('.pyodide-loading').forEach(function (el) {
          el.remove();
        });
        loadCallbacks.forEach(function (cb) { cb(pyodideInstance); });
        loadCallbacks = [];
      });
    };
    script.onerror = function () {
      document.querySelectorAll('.pyodide-loading span').forEach(function (el) {
        el.textContent = 'Failed to load Python runtime. Check your connection.';
        el.style.color = 'var(--a5)';
      });
      loading = false;
    };
    document.head.appendChild(script);
  }

  function captureRun(py, code) {
    var stdout = [];
    var stderr = [];
    py.setStdout({ batched: function (s) { stdout.push(s); } });
    py.setStderr({ batched: function (s) { stderr.push(s); } });
    var err = null;
    try {
      py.runPython(code);
    } catch (e) {
      err = e;
    }
    return { stdout: stdout.join('\n'), stderr: err ? err.message : stderr.join('\n'), error: err };
  }

  function runCode(code, callback) {
    ensureLoaded(function (py) {
      /* Reset namespace between runs */
      try { py.runPython('import sys\nfor _k in [k for k in dir() if not k.startswith("_")]:\n  try:\n    exec(f"del {_k}")\n  except: pass'); } catch (e) {}
      var result = captureRun(py, code);
      callback(null, result.stdout, result.stderr);
    });
  }

  function runTests(userCode, testCode, callback) {
    ensureLoaded(function (py) {
      /* Reset namespace */
      try { py.runPython('import sys\nfor _k in [k for k in dir() if not k.startswith("_")]:\n  try:\n    exec(f"del {_k}")\n  except: pass'); } catch (e) {}

      /* Execute user code first */
      var userResult = captureRun(py, userCode);
      if (userResult.error) {
        callback([{ name: 'Code execution', pass: false, message: userResult.error.message }]);
        return;
      }

      /* Inject captured stdout so tests can check output */
      try {
        py.globals.set('__stdout', userResult.stdout || '');
      } catch (e) {
        try { py.runPython('__stdout = ""'); } catch (e2) {}
      }

      /* Run each assertion individually */
      var lines = testCode.split('\n').filter(function (line) {
        return line.trim().length > 0 && !line.trim().startsWith('#');
      });

      var results = [];
      lines.forEach(function (line) {
        var trimmed = line.trim();
        /* Extract description: text after last comma in quotes, or the assertion itself */
        var desc = trimmed;
        var msgMatch = trimmed.match(/,\s*["'](.+)["']\s*$/);
        if (msgMatch) {
          desc = msgMatch[1];
        } else {
          desc = trimmed.replace(/^assert\s+/, '').substring(0, 60);
        }

        try {
          py.runPython(trimmed);
          results.push({ name: desc, pass: true, message: '' });
        } catch (e) {
          results.push({ name: desc, pass: false, message: e.message.split('\n').pop() });
        }
      });

      callback(results);
    });
  }

  window.ZTH = window.ZTH || {};
  window.ZTH.pyodide = {
    ensureLoaded: ensureLoaded,
    runCode: runCode,
    runTests: runTests
  };
})();
