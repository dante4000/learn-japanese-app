(function () {
  document.querySelectorAll('.prompt-block').forEach(function (block) {
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';

    btn.addEventListener('click', function () {
      var clone = block.cloneNode(true);
      clone.querySelectorAll('.label,.copy-btn').forEach(function (node) {
        node.remove();
      });
      var text = clone.textContent.trim();

      function done(ok) {
        btn.textContent = ok ? 'Copied' : 'Failed';
        if (ok) btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 1400);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          done(true);
        }).catch(function () {
          done(false);
        });
        return;
      }

      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done(true);
      } catch (e) {
        done(false);
      }
      document.body.removeChild(ta);
    });

    block.appendChild(btn);
  });
})();
