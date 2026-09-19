/* Checklisten und Textfelder lokal speichern (nur in diesem Browser).
   - <ul data-checklist="name"> mit Checkboxen: Zustand bleibt erhalten
   - <input|textarea data-persist="id">: Text bleibt erhalten
   - <button data-reset="name">: setzt eine Checkliste zurück
   - <button data-reset-fields="#bereich">: leert die Felder darin
   - <button data-copy="#bereich">: kopiert Beschriftung + Text als Klartext */
(function () {
  'use strict';

  var BA = window.BA;
  if (!BA) return;

  var page = document.body.getAttribute('data-page') || 'seite';
  var prefix = 'ba:v1:' + page + ':';

  function hash(text) {
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function clean(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  /* ---- Checklisten ---- */
  function updateProgress(name) {
    var list = document.querySelector('[data-checklist="' + name + '"]');
    if (!list) return;
    var boxes = list.querySelectorAll('input[type="checkbox"]');
    var done = 0;
    boxes.forEach(function (b) { if (b.checked) done++; });
    document.querySelectorAll('[data-progress="' + name + '"]').forEach(function (el) {
      el.textContent = done + ' von ' + boxes.length + ' erledigt';
    });
  }

  document.querySelectorAll('[data-checklist]').forEach(function (list) {
    var name = list.getAttribute('data-checklist');
    list.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
      var label = box.closest('label');
      var text = clean((label || box.parentNode).textContent);
      var key = prefix + name + ':' + hash(text);
      box.setAttribute('data-key', key);
      if (BA.get(key) === '1') box.checked = true;
      box.addEventListener('change', function () {
        if (box.checked) BA.set(key, '1');
        else BA.remove(key);
        updateProgress(name);
      });
    });
    updateProgress(name);
  });

  document.querySelectorAll('[data-reset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-reset');
      if (!window.confirm('Alle Haken in diesem Abschnitt entfernen?')) return;
      BA.keys(prefix + name + ':').forEach(function (k) { BA.remove(k); });
      var list = document.querySelector('[data-checklist="' + name + '"]');
      if (list) list.querySelectorAll('input[type="checkbox"]').forEach(function (b) { b.checked = false; });
      updateProgress(name);
    });
  });

  /* ---- Textfelder ---- */
  var timers = {};
  document.querySelectorAll('[data-persist]').forEach(function (field) {
    var key = prefix + 'field:' + field.getAttribute('data-persist');
    var saved = BA.get(key);
    if (saved !== null) field.value = saved;
    field.addEventListener('input', function () {
      window.clearTimeout(timers[key]);
      timers[key] = window.setTimeout(function () {
        if (field.value) BA.set(key, field.value);
        else BA.remove(key);
      }, 200);
    });
  });

  document.querySelectorAll('[data-reset-fields]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var area = document.querySelector(btn.getAttribute('data-reset-fields'));
      if (!area) return;
      if (!window.confirm('Alle Felder in diesem Bereich leeren?')) return;
      area.querySelectorAll('[data-persist]').forEach(function (field) {
        BA.remove(prefix + 'field:' + field.getAttribute('data-persist'));
        field.value = '';
      });
    });
  });

  /* ---- Kopieren als Klartext ---- */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var status = btn.parentNode.querySelector('[data-copy-status]');
    btn.addEventListener('click', function () {
      var area = document.querySelector(btn.getAttribute('data-copy'));
      if (!area) return;
      var lines = [];
      area.querySelectorAll('[data-persist]').forEach(function (field) {
        var label = area.querySelector('label[for="' + field.id + '"]');
        var q = label ? clean(label.childNodes[0].textContent) : field.getAttribute('data-persist');
        lines.push(q + '\n' + (field.value || '–') + '\n');
      });
      var text = lines.join('\n');
      function done(ok) {
        if (status) status.textContent = ok ? 'Kopiert ✔' : 'Kopieren nicht möglich – bitte Text markieren.';
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(legacyCopy(text)); });
      } else {
        done(legacyCopy(text));
      }
    });
  });
})();
