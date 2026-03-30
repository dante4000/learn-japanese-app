/* API Live Demo — adds "Try it Live" buttons to GitHub API code blocks */
(function () {
  function createOutput(container) {
    var out = container.querySelector('.api-demo-output');
    if (!out) {
      out = document.createElement('pre');
      out.className = 'api-demo-output';
      container.appendChild(out);
    }
    return out;
  }

  function showResult(out, status, body) {
    out.innerHTML = '';
    var statusSpan = document.createElement('span');
    statusSpan.className = 'api-status';
    statusSpan.textContent = 'Status: ' + status;
    out.appendChild(statusSpan);
    out.appendChild(document.createTextNode(JSON.stringify(body, null, 2)));
    out.classList.add('visible');
  }

  function showError(out, msg) {
    out.innerHTML = '';
    var errSpan = document.createElement('span');
    errSpan.className = 'api-error';
    errSpan.textContent = msg;
    out.appendChild(errSpan);
    out.classList.add('visible');
  }

  function resetBtn(btn) {
    btn.disabled = false;
    btn.textContent = 'Try it Live';
  }

  function fetchDemo(url, out, btn) {
    btn.disabled = true;
    btn.textContent = 'Loading\u2026';
    out.classList.remove('visible');

    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 10000);

    fetch(url, { signal: controller.signal })
      .then(function (res) {
        clearTimeout(timeoutId);
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        showResult(out, result.status, result.data);
        resetBtn(btn);
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        var msg = err.name === 'AbortError'
          ? 'Request timed out. Check your connection and try again.'
          : 'Request failed: ' + err.message;
        showError(out, msg);
        resetBtn(btn);
      });
  }

  function init() {
    var demos = document.querySelectorAll('.api-demo');
    for (var i = 0; i < demos.length; i++) {
      (function (demo) {
        var urlTemplate = demo.getAttribute('data-url');
        var input = demo.querySelector('.api-demo-input');
        var btn = demo.querySelector('.api-demo-btn');
        if (!btn) return;

        var out = createOutput(demo);

        btn.addEventListener('click', function () {
          var url = urlTemplate;
          if (input) {
            var val = input.value.trim();
            if (!val) { input.focus(); return; }
            url = urlTemplate.replace('{username}', encodeURIComponent(val));
          }
          fetchDemo(url, out, btn);
        });

        if (input) {
          input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') btn.click();
          });
        }
      })(demos[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
