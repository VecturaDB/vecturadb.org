// vecturadb.org: the menu on narrow screens and the tabs.
// Without JavaScript the links stay visible under the name and every tab panel is shown.
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  if (header && toggle) {
    var setOpen = function (open) {
      header.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () {
      setOpen(!header.classList.contains('menu-open'));
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('menu-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    header.querySelectorAll('.site-nav a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
  }

  // Tabs with a data-tabs-key (the language of the guides, Docker or not) choose together, and the choice is kept
  // for the next pages. The storage can be missing or refused: the tabs then simply start from the first one.
  var saved = function (key) {
    try { return window.localStorage.getItem('vecturadb-tab-' + key); } catch (e) { return null; }
  };
  var save = function (key, label) {
    try { window.localStorage.setItem('vecturadb-tab-' + key, label); } catch (e) { /* not kept */ }
  };
  var groups = [];
  var choose = function (group, index, focus) {
    group.select(index, focus);
    if (!group.key) return;
    var label = group.buttons[index].textContent;
    save(group.key, label);
    groups.forEach(function (other) {
      if (other === group || other.key !== group.key) return;
      other.buttons.forEach(function (button, i) {
        if (button.textContent === label) other.select(i, false);
      });
    });
  };

  document.querySelectorAll('[data-tabs]').forEach(function (tabs) {
    var buttons = Array.prototype.slice.call(tabs.querySelectorAll('[role="tab"]'));
    var group = { tabs: tabs, buttons: buttons, key: tabs.getAttribute('data-tabs-key') };
    group.select = function (index, focus) {
      buttons.forEach(function (button, i) {
        var selected = i === index;
        button.setAttribute('aria-selected', selected ? 'true' : 'false');
        button.tabIndex = selected ? 0 : -1;
        document.getElementById(button.getAttribute('aria-controls')).hidden = !selected;
      });
      if (focus) buttons[index].focus();
    };
    groups.push(group);
    buttons.forEach(function (button, i) {
      button.addEventListener('click', function () { choose(group, i, false); });
      button.addEventListener('keydown', function (event) {
        var n = buttons.length;
        var next = { ArrowRight: (i + 1) % n, ArrowLeft: (i + n - 1) % n, Home: 0, End: n - 1 }[event.key];
        if (next !== undefined) {
          event.preventDefault();
          choose(group, next, true);
        }
      });
    });
    var start = 0;
    var label = group.key && saved(group.key);
    buttons.forEach(function (button, i) {
      if (label && button.textContent === label) start = i;
    });
    group.select(start, false);
    tabs.setAttribute('data-ready', '');
  });

  // A link to a section inside a tab, like /leaving-chroma-cloud/to-vecturadb#python or #aspire, opens that tab and
  // shows the section. The heading of a panel is hidden by the tabs, which then take its place.
  var openFromHash = function () {
    var target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    var panel = target && target.closest('[role="tabpanel"]');
    if (!panel) return;
    groups.forEach(function (group) {
      group.buttons.forEach(function (button, i) {
        if (button.getAttribute('aria-controls') !== panel.id) return;
        choose(group, i, false);
        (target.getClientRects().length ? target : group.tabs).scrollIntoView();
      });
    });
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
