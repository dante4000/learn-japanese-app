/* Ace Editor initialization — creates editors for all .exercise-editor elements */
(function () {
  var editors = {};
  var darkTheme = 'ace/theme/one_dark';
  var lightTheme = 'ace/theme/chrome';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? lightTheme : darkTheme;
  }

  function initEditor(container) {
    var exercise = container.closest('.exercise');
    if (!exercise) return null;
    var ch = exercise.getAttribute('data-ch') || '00';
    var ex = exercise.getAttribute('data-ex') || '0';
    var id = 'ace-' + ch + '-' + ex;

    var inner = document.createElement('div');
    inner.id = id;
    inner.style.width = '100%';
    inner.style.minHeight = '150px';
    container.appendChild(inner);

    var editor = ace.edit(id);
    editor.setTheme(currentTheme());
    editor.session.setMode('ace/mode/python');
    editor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      maxLines: 30,
      minLines: 6,
      tabSize: 4,
      useSoftTabs: true,
      wrap: true
    });

    var starterEl = container.querySelector('script.starter-code');
    if (starterEl) {
      editor.setValue(starterEl.textContent.trim(), -1);
    }

    editors[id] = editor;
    return editor;
  }

  function initAll() {
    if (typeof ace === 'undefined') {
      document.querySelectorAll('.exercise[data-type="pyodide"] .exercise-editor').forEach(function (el) {
        if (!el.querySelector('.ace-load-error')) {
          var msg = document.createElement('div');
          msg.className = 'ace-load-error';
          msg.style.padding = '1rem';
          msg.style.color = 'var(--a5)';
          msg.textContent = 'Code editor failed to load. Check your internet connection and refresh the page.';
          el.appendChild(msg);
        }
      });
      return;
    }
    document.querySelectorAll('.exercise[data-type="pyodide"] .exercise-editor').forEach(function (el) {
      if (!el.querySelector('[id^="ace-"]')) {
        initEditor(el);
      }
    });
  }

  /* Sync theme changes across all editors */
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.attributeName === 'data-theme') {
        var theme = currentTheme();
        Object.keys(editors).forEach(function (id) {
          editors[id].setTheme(theme);
        });
      }
    });
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  window.ZTH = window.ZTH || {};
  window.ZTH.editors = editors;
  window.ZTH.aceInit = { initAll: initAll, initEditor: initEditor };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
