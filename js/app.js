/* Grundfunktionen: Speicher-Helfer, Theme, Menü, „Alle aufklappen“.
   Alles ist Zusatz: ohne JavaScript bleibt jede Seite les- und nutzbar. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  /* ---- Speicher (localStorage, mit Rückfall auf Arbeitsspeicher) ---- */
  var mem = {};
  var ls = null;
  try {
    var probe = '__ba_probe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    ls = window.localStorage;
  } catch (e) {
    ls = null;
  }

  var BA = (window.BA = window.BA || {});
  BA.get = function (key) {
    try {
      if (ls) return ls.getItem(key);
    } catch (e) { /* ignorieren */ }
    return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null;
  };
  BA.set = function (key, value) {
    try {
      if (ls) { ls.setItem(key, value); return; }
    } catch (e) { /* ignorieren */ }
    mem[key] = value;
  };
  BA.remove = function (key) {
    try {
      if (ls) ls.removeItem(key);
    } catch (e) { /* ignorieren */ }
    delete mem[key];
  };
  BA.keys = function (prefix) {
    var out = [];
    var i;
    try {
      if (ls) {
        for (i = 0; i < ls.length; i++) {
          var k = ls.key(i);
          if (k && k.indexOf(prefix) === 0) out.push(k);
        }
        return out;
      }
    } catch (e) { /* ignorieren */ }
    Object.keys(mem).forEach(function (k) {
      if (k.indexOf(prefix) === 0) out.push(k);
    });
    return out;
  };

  /* ---- Theme ---- */
  var themeBtn = document.querySelector('.theme-btn');
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function paintThemeBtn() {
    if (!themeBtn) return;
    var dark = currentTheme() === 'dark';
    var ico = themeBtn.querySelector('.ico');
    var label = themeBtn.querySelector('.btn-label');
    if (ico) ico.textContent = dark ? '☀' : '🌙';
    if (label) label.textContent = dark ? ' Hell' : ' Dunkel';
    themeBtn.setAttribute('aria-label', dark ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln');
  }
  if (themeBtn) {
    paintThemeBtn();
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      BA.set('ba:theme', next);
      paintThemeBtn();
    });
  }

  /* ---- Menü auf dem Handy ---- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', open ? 'false' : 'true');
      menuBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        nav.setAttribute('data-open', 'false');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* Sprunglinks zum Inhalt (funktionieren auch auf der 404-Seite mit <base>) */
  document.querySelectorAll('a[href="#main"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var main = document.getElementById('main');
      if (!main) return;
      ev.preventDefault();
      main.setAttribute('tabindex', '-1');
      main.focus();
      main.scrollIntoView();
    });
  });

  /* ---- „Alle aufklappen / zuklappen“ ---- */
  document.querySelectorAll('[data-toggle-all]').forEach(function (btn) {
    var target = document.querySelector(btn.getAttribute('data-toggle-all'));
    if (!target) return;
    var opened = false;
    btn.addEventListener('click', function () {
      opened = !opened;
      target.querySelectorAll('details.layer').forEach(function (d) { d.open = opened; });
      btn.textContent = opened ? 'Alles zuklappen' : 'Alles aufklappen';
    });
  });

  /* ---- Tabelle nach Phase filtern ---- */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var table = document.getElementById(group.getAttribute('data-filter-group'));
    if (!table) return;
    var buttons = group.querySelectorAll('[data-filter]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wanted = btn.getAttribute('data-filter');
        buttons.forEach(function (b) {
          var on = b === btn;
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          b.classList.toggle('btn--primary', on);
        });
        table.querySelectorAll('tbody tr').forEach(function (row) {
          var phases = (row.getAttribute('data-phase') || '').split(' ');
          row.hidden = wanted !== 'all' && phases.indexOf(wanted) === -1;
        });
      });
    });
  });

  /* Sprung zu einem Anker öffnet ein darin liegendes <details> */
  function openForHash() {
    if (!location.hash) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    while (el) {
      if (el.tagName === 'DETAILS') el.open = true;
      el = el.parentElement;
    }
  }
  window.addEventListener('hashchange', openForHash);
  openForHash();
})();
