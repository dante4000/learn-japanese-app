/* ============================================================
   Zero to Hero — Theme Toggle (Dark/Light)
   ============================================================ */

(function () {
  'use strict';

  var toggle = document.getElementById('themeToggle');
  var html = document.documentElement;

  // Restore saved theme (use window.storage if available, fallback to localStorage)
  var st = window.storage || { get: function(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }, set: function(k,v) { try { localStorage.setItem(k,v); } catch(e) {} } };
  var saved = st.get('zth-theme');
  if (saved === 'light') html.setAttribute('data-theme', 'light');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var isLight = html.getAttribute('data-theme') === 'light';
      if (isLight) {
        html.removeAttribute('data-theme');
        st.set('zth-theme', 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
        st.set('zth-theme', 'light');
      }
    });
  }
})();
