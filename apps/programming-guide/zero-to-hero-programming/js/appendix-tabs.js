/* Appendix Tabs — tabbed navigation, glossary letter bar, sub-tabs, accordions */
(function () {
  function each(nodeList, fn) {
    for (var i = 0; i < nodeList.length; i++) fn(nodeList[i], i);
  }

  function initTabs(containerSel, tabSel, panelSel) {
    var container = document.querySelector(containerSel);
    if (!container) return;
    var tabs = container.querySelectorAll(tabSel);
    var panels = container.querySelectorAll(panelSel);

    function activate(id) {
      each(tabs, function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === id);
      });
      each(panels, function (p) {
        p.classList.toggle('active', p.id === id);
      });
    }

    each(tabs, function (t) {
      t.addEventListener('click', function () {
        var id = t.getAttribute('data-tab');
        activate(id);
        history.replaceState(null, '', '#' + id);
      });
    });

    var hash = window.location.hash.replace('#', '');
    var validIds = [];
    each(tabs, function (t) { validIds.push(t.getAttribute('data-tab')); });
    if (hash && validIds.indexOf(hash) !== -1) {
      activate(hash);
    } else if (tabs.length) {
      activate(tabs[0].getAttribute('data-tab'));
    }
  }

  function initSubTabs() {
    each(document.querySelectorAll('.app-subtabs'), function (bar) {
      var parent = bar.parentElement;
      var tabs = bar.querySelectorAll('.app-subtab');
      var panels = parent.querySelectorAll('.app-subtab-panel');

      each(tabs, function (t) {
        t.addEventListener('click', function () {
          var id = t.getAttribute('data-subtab');
          each(tabs, function (st) {
            st.classList.toggle('active', st.getAttribute('data-subtab') === id);
          });
          each(panels, function (p) {
            p.classList.toggle('active', p.getAttribute('data-subtab-panel') === id);
          });
        });
      });

      if (tabs.length) tabs[0].click();
    });
  }

  function initGlossary() {
    var section = document.getElementById('glossary-content');
    if (!section) return;

    var searchInput = section.querySelector('.glossary-search');
    var letterBar = section.querySelector('.letter-bar');
    var table = section.querySelector('.glossary-table');
    if (!table) return;

    var groups = table.querySelectorAll('tbody.letter-group');
    var rows = table.querySelectorAll('tr.glossary-term');

    var letterMap = {};
    each(groups, function (g) {
      var id = g.id || '';
      var letter = id.replace('letter-', '');
      if (letter) letterMap[letter] = g;
    });

    if (letterBar) {
      each(letterBar.querySelectorAll('.letter-btn'), function (btn) {
        var letter = btn.getAttribute('data-letter');
        if (!letterMap[letter]) {
          btn.classList.add('disabled');
        } else {
          btn.addEventListener('click', function () {
            if (searchInput) searchInput.value = '';
            each(rows, function (r) { r.classList.add('visible'); });
            each(groups, function (g) { g.style.display = ''; });
            var grp = letterMap[letter];
            if (grp) grp.scrollIntoView({ behavior: 'smooth', block: 'start' });
            each(letterBar.querySelectorAll('.letter-btn'), function (b) {
              b.classList.toggle('active', b === btn);
            });
          });
        }
      });
    }

    if (searchInput) {
      var debounceTimer;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () { performSearch(); }, 150);
      });
      function performSearch() {
        var q = searchInput.value.trim().toLowerCase();
        if (letterBar) {
          each(letterBar.querySelectorAll('.letter-btn'), function (b) {
            b.classList.remove('active');
          });
        }
        each(rows, function (row) {
          if (!q) {
            row.classList.add('visible');
          } else {
            var text = row.textContent.toLowerCase();
            row.classList.toggle('visible', text.indexOf(q) !== -1);
          }
        });
        each(groups, function (g) {
          var visibleRows = g.querySelectorAll('tr.glossary-term.visible');
          g.style.display = visibleRows.length ? '' : 'none';
        });
      }
    }

    each(rows, function (r) { r.classList.add('visible'); });
  }

  function initAccordions() {
    each(document.querySelectorAll('.ts-card-header'), function (header) {
      header.addEventListener('click', function () {
        var card = header.parentElement;
        card.classList.toggle('open');
      });
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }

  function init() {
    initTabs('.appendix-tabs-wrap', '.app-tab', '.app-tab-panel');
    initSubTabs();
    initGlossary();
    initAccordions();
  }

  window.addEventListener('hashchange', function () {
    var hash = window.location.hash.replace('#', '');
    var tab = document.querySelector('.app-tab[data-tab="' + hash + '"]');
    if (tab) tab.click();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
