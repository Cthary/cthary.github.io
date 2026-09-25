/* Gegneranalysen: Lesen/Hoeren-Umschalter, Inhaltsverzeichnis, Fokus-Modus,
   Service-Worker-Registrierung. Reines Vanilla-JS, keine Abhaengigkeiten.
   Ohne JavaScript bleibt die Seite im Lesemodus vollstaendig nutzbar. */
(function () {
  'use strict';

  /* ---- Speicher (localStorage, mit Rueckfall auf Arbeitsspeicher) ---- */
  var mem = {};
  var ls = null;
  try {
    var probe = '__gg_probe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    ls = window.localStorage;
  } catch (e) {
    ls = null;
  }
  var GG = (window.GG = window.GG || {});
  GG.get = function (key) {
    try {
      if (ls) return ls.getItem(key);
    } catch (e) { /* ignorieren */ }
    return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null;
  };
  GG.set = function (key, value) {
    try {
      if (ls) { ls.setItem(key, value); return; }
    } catch (e) { /* ignorieren */ }
    mem[key] = value;
  };

  /* ---- Lesen/Hoeren-Umschalter ---- */
  var modeButtons = document.querySelectorAll('[data-mode-btn]');
  var modeSections = document.querySelectorAll('[data-mode]');

  function applyMode(mode) {
    modeSections.forEach(function (section) {
      section.hidden = section.getAttribute('data-mode') !== mode;
    });
    modeButtons.forEach(function (btn) {
      var active = btn.getAttribute('data-mode-btn') === mode;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function currentMode() {
    var saved = GG.get('gg:mode');
    return saved === 'hoeren' ? 'hoeren' : 'lesen';
  }

  if (modeButtons.length) {
    applyMode(currentMode());
    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-mode-btn');
        GG.set('gg:mode', mode);
        applyMode(mode);
      });
    });
  }

  /* ---- Inhaltsverzeichnis: einklappbar ---- */
  var toc = document.getElementById('gg-toc');
  var tocToggle = toc ? toc.querySelector('.gg-toc-toggle') : null;
  if (toc && tocToggle) {
    tocToggle.addEventListener('click', function () {
      var collapsed = toc.getAttribute('data-collapsed') === 'true';
      toc.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
      tocToggle.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
    });
  }

  /* ---- Inhaltsverzeichnis: modusbewusste Sprungziele ---- */
  function prefixFor(mode) {
    return mode === 'hoeren' ? 'hoer' : 'les';
  }

  document.querySelectorAll('[data-toc-target]').forEach(function (link) {
    link.addEventListener('click', function (evt) {
      evt.preventDefault();
      var slug = link.getAttribute('data-toc-target');
      var target = document.getElementById(prefixFor(currentMode()) + '-h-' + slug);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---- Kapitelweise Fokus: einen Abschnitt isolieren ---- */
  var focusReset = document.getElementById('gg-focus-reset');

  function setFocus(sectionId) {
    document.querySelectorAll('.gg-section').forEach(function (el) {
      el.hidden = sectionId ? el.getAttribute('data-section-id') !== sectionId : false;
    });
    if (focusReset) focusReset.hidden = !sectionId;
  }

  document.querySelectorAll('[data-focus-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setFocus(btn.getAttribute('data-focus-target'));
      var target = document.getElementById(
        prefixFor(currentMode()) + '-h-' + btn.getAttribute('data-focus-target')
      );
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (focusReset) {
    focusReset.addEventListener('click', function () {
      setFocus(null);
    });
  }

  /* ---- Offline: Service Worker nur unter /gegner/ registrieren ---- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* Offline-Unterstuetzung ist ein Zusatz - Seite funktioniert auch ohne. */
      });
    });
  }
})();
