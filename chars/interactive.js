(function () {
  'use strict';

  var FILLED = '●', EMPTY = '○';

  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function slugify(s) {
    return norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'on') Object.keys(attrs.on).forEach(function (ev) { n.addEventListener(ev, attrs.on[ev]); });
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  var h1 = document.querySelector('h1');
  var fileName = decodeURIComponent(location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
  var KEY = 'char:' + (slugify(fileName) || slugify(h1 && h1.textContent) || 'sheet');

  var storageOk = true;
  function loadStored() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (e) { storageOk = false; return null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { storageOk = false; showStatus(); }
  }
  function forget() {
    try { localStorage.removeItem(KEY); } catch (e) { storageOk = false; }
  }

  // Defaults are always read from the exported sheet itself; the script knows no character values.
  var defaults = { hp: null, temp: 0, counters: {}, bubbles: {} };
  var meta = { hpMax: null, counterMax: {}, bubbleKind: {}, bubbleLabel: {} };
  var views = { hp: null, temp: null, counters: [], bubbles: [] };
  var state;

  function bandItems() {
    return Array.prototype.filter.call(
      document.querySelectorAll('.combat-band > span, .track-band > span'),
      function (s) { return s.firstElementChild && s.firstElementChild.tagName === 'B'; }
    );
  }
  function labelOf(span) { return span.firstElementChild.textContent.trim(); }
  function valueText(span) {
    var t = '';
    for (var n = span.firstElementChild.nextSibling; n; n = n.nextSibling) t += n.textContent;
    return t;
  }
  function clearValue(span) {
    while (span.firstElementChild.nextSibling) span.removeChild(span.firstElementChild.nextSibling);
  }
  function uniqueKey(map, base) {
    var k = base, i = 2;
    while (Object.prototype.hasOwnProperty.call(map, k)) k = base + ' #' + i++;
    return k;
  }

  function stepButton(sym, label, fn) {
    return el('button', { type: 'button', class: 'i-step', 'aria-label': label, text: sym, on: { click: fn } });
  }

  function buildHp(span, cur, max) {
    defaults.hp = cur;
    meta.hpMax = max;
    var out = el('span', { class: 'i-hp-cur', 'aria-live': 'polite' });
    var amount = el('input', {
      type: 'number', min: '1', inputmode: 'numeric', class: 'i-amount',
      placeholder: 'n', 'aria-label': 'Betrag für Schaden oder Heilung'
    });
    function applyAmount(sign) {
      var n = parseInt(amount.value, 10);
      if (!(n > 0)) { amount.focus(); return; }
      sign < 0 ? damage(n) : heal(n);
      amount.value = '';
    }
    amount.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); applyAmount(e.shiftKey ? 1 : -1); }
    });
    clearValue(span);
    span.classList.add('i-hp-item');
    span.appendChild(el('span', { class: 'i-hp' }, [
      stepButton('−', '1 HP abziehen', function () { damage(1); }),
      el('span', { class: 'i-hp-val' }, [out, document.createTextNode('/' + max)]),
      stepButton('+', '1 HP heilen', function () { heal(1); }),
      el('span', { class: 'i-hp-amt i-screen' }, [
        amount,
        el('button', { type: 'button', class: 'i-btn i-dmg', text: 'Schaden', on: { click: function () { applyAmount(-1); } } }),
        el('button', { type: 'button', class: 'i-btn i-heal', text: 'Heilen', on: { click: function () { applyAmount(1); } } })
      ])
    ]));
    views.hp = { out: out, item: span };
  }

  function buildTemp(blank) {
    var input = el('input', {
      type: 'number', min: '0', inputmode: 'numeric', class: 'i-temp', 'aria-label': 'Temporäre HP', placeholder: '0'
    });
    input.addEventListener('change', function () {
      state.temp = Math.max(0, parseInt(input.value, 10) || 0);
      save(); render();
    });
    blank.parentNode.replaceChild(input, blank);
    views.temp = input;
  }

  function buildCounter(host, key, cur, max) {
    defaults.counters[key] = cur;
    meta.counterMax[key] = max;
    var out = el('span', { class: 'i-count-cur' });
    function step(d) {
      state.counters[key] = clamp(state.counters[key] + d, 0, max);
      save(); render();
    }
    host.appendChild(el('span', { class: 'i-counter' }, [
      stepButton('−', key + ': einen verbrauchen', function () { step(-1); }),
      el('span', { class: 'i-count-val' }, [out, document.createTextNode('/' + max)]),
      stepButton('+', key + ': einen zurückgewinnen', function () { step(1); })
    ]));
    views.counters.push({ key: key, out: out });
  }

  function buildBubbles(span, key, kind, label, filled) {
    defaults.bubbles[key] = filled;
    meta.bubbleKind[key] = kind;
    meta.bubbleLabel[key] = label;
    span.textContent = '';
    span.classList.add('i-bubs');
    var buttons = filled.map(function (_, i) {
      var b = el('button', {
        type: 'button', class: 'i-bub',
        'aria-label': label + ' ' + (i + 1) + (kind === 'slot' ? ' (Slot)' : ''),
        on: { click: function () { state.bubbles[key][i] = !state.bubbles[key][i]; save(); render(); } }
      });
      span.appendChild(b);
      return b;
    });
    views.bubbles.push({ key: key, buttons: buttons });
  }

  function scan() {
    bandItems().forEach(function (span) {
      var label = labelOf(span);
      var blank = span.querySelector('.blank');
      if (norm(label) === 'temp hp' && blank) { buildTemp(blank); return; }
      if (span.querySelector('.bub')) return;
      var m = valueText(span).match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
      if (!m) return;
      if (norm(label) === 'hp') { buildHp(span, +m[1], +m[2]); return; }
      clearValue(span);
      buildCounter(span, uniqueKey(defaults.counters, label), +m[1], +m[2]);
    });

    Array.prototype.forEach.call(document.querySelectorAll('.uses'), function (u) {
      var m = u.textContent.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
      if (!m) return;
      var name = '';
      for (var n = u.previousSibling; n; n = n.previousSibling) name = n.textContent + name;
      name = name.trim() || 'Uses';
      u.textContent = '';
      buildCounter(u, uniqueKey(defaults.counters, name), +m[1], +m[2]);
    });

    Array.prototype.forEach.call(document.querySelectorAll('.bub'), function (b) {
      var marks = Array.prototype.filter.call(b.textContent, function (c) { return c === FILLED || c === EMPTY; });
      if (!marks.length) return;
      var h = b.closest('h1, h2, h3, h4');
      var band = b.closest('.combat-band > span, .track-band > span');
      var kind, label;
      if (h) {
        kind = 'slot';
        label = '';
        for (var n = h.firstChild; n && n !== b; n = n.nextSibling) label += n.textContent;
        label = label.trim() || h.textContent.trim();
      } else {
        kind = 'mark';
        label = band ? labelOf(band) : 'Marker';
        var prev = b.previousSibling && b.previousSibling.nodeType === 3
          ? b.previousSibling.textContent.replace(/[·|,]/g, ' ').trim() : '';
        if (prev && prev.length <= 12) label += ' ' + prev;
      }
      buildBubbles(b, uniqueKey(defaults.bubbles, label), kind, label,
        marks.map(function (c) { return c === FILLED; }));
    });
  }

  // Foundry inline rolls: "[[/damage 2d8 type=poison]]" -> "2D8 poison", "[[/r d8]]" -> "D8"
  var ROLL = /\[\[\/\w+\s+([^\]]*?)\]\](?:\{([^}]*)\})?/g;
  function rollText(_, body, label) {
    if (label) return label;
    var type = '';
    body = body.replace(/\btype=(\w+)/gi, function (_, t) { type = t.toLowerCase(); return ''; });
    body = body.replace(/\s+/g, ' ').trim()
      .replace(/\b(\d*)d(\d+)\b/gi, function (_, n, f) { return n + 'D' + f; });
    return body + (type ? ' ' + type : '');
  }
  function cleanRolls() {
    var walker = document.createTreeWalker(document.querySelector('.page') || document.body, NodeFilter.SHOW_TEXT);
    for (var n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeValue.indexOf('[[') !== -1) n.nodeValue = n.nodeValue.replace(ROLL, rollText);
    }
  }

  function abilityMod(abbr) {
    var boxes = document.querySelectorAll('.abilities .ab');
    for (var i = 0; i < boxes.length; i++) {
      var a = boxes[i].querySelector('.ab-abbr'), m = boxes[i].querySelector('.ab-mod');
      if (a && m && norm(a.textContent) === norm(abbr)) {
        var n = parseInt(m.textContent.replace('−', '-'), 10);
        return isNaN(n) ? null : n;
      }
    }
    return null;
  }

  function buildMageArmor() {
    var known = Array.prototype.some.call(document.querySelectorAll('li > strong'), function (s) {
      return norm(s.textContent) === 'mage armor';
    });
    var dex = abilityMod('DEX');
    var acItem = bandItems().filter(function (s) { return norm(labelOf(s)) === 'ac'; })[0];
    if (!known || dex === null || !acItem) return;
    var item = el('span', { class: 'i-ac-alt', title: 'Mage Armor: 13 + DEX-Modifikator, ohne Rüstung' }, [
      el('b', { text: 'AC Mage Armor' }),
      document.createTextNode(String(13 + dex))
    ]);
    acItem.parentNode.insertBefore(item, acItem.nextSibling);
  }

  function mergeStored(stored) {
    var s = clone(defaults);
    if (!stored || typeof stored !== 'object') return s;
    if (meta.hpMax !== null && typeof stored.hp === 'number') s.hp = clamp(Math.round(stored.hp), 0, meta.hpMax);
    if (typeof stored.temp === 'number') s.temp = Math.max(0, Math.round(stored.temp));
    Object.keys(s.counters).forEach(function (k) {
      var v = stored.counters && stored.counters[k];
      if (typeof v === 'number') s.counters[k] = clamp(Math.round(v), 0, meta.counterMax[k]);
    });
    Object.keys(s.bubbles).forEach(function (k) {
      var v = stored.bubbles && stored.bubbles[k];
      if (Array.isArray(v) && v.length === s.bubbles[k].length) s.bubbles[k] = v.map(Boolean);
    });
    return s;
  }

  function isDeathSaves(key) { return /death/i.test(meta.bubbleLabel[key]); }
  function clearDeathSaves() {
    Object.keys(state.bubbles).forEach(function (k) {
      if (isDeathSaves(k)) state.bubbles[k] = state.bubbles[k].map(function () { return false; });
    });
  }

  function damage(n) {
    if (state.hp === null) return;
    var absorbed = Math.min(state.temp, n);
    state.temp -= absorbed;
    state.hp = Math.max(0, state.hp - (n - absorbed));
    save(); render();
  }
  function heal(n) {
    if (state.hp === null) return;
    var wasDown = state.hp === 0;
    state.hp = Math.min(meta.hpMax, state.hp + n);
    if (wasDown && state.hp > 0) clearDeathSaves();
    save(); render();
  }

  function longRest() {
    if (meta.hpMax !== null) state.hp = meta.hpMax;
    state.temp = 0;
    Object.keys(state.counters).forEach(function (k) { state.counters[k] = meta.counterMax[k]; });
    Object.keys(state.bubbles).forEach(function (k) {
      if (meta.bubbleKind[k] === 'slot') state.bubbles[k] = state.bubbles[k].map(function () { return true; });
    });
    clearDeathSaves();
    save(); render();
  }

  var CLASS_DIE = {
    barbarian: 12, fighter: 10, paladin: 10, ranger: 10, artificer: 8, bard: 8, cleric: 8,
    druid: 8, monk: 8, rogue: 8, warlock: 8, sorcerer: 6, wizard: 6
  };
  function guessHitDie() {
    var sub = document.querySelector('header .subtitle');
    var t = norm(sub ? sub.textContent : ''), best = 0;
    Object.keys(CLASS_DIE).forEach(function (c) {
      if (new RegExp('\\b' + c + '\\b').test(t)) best = Math.max(best, CLASS_DIE[c]);
    });
    return best || 8;
  }
  function hitDiceKey() {
    return Object.keys(meta.counterMax).filter(function (k) { return /hit di/i.test(k); })[0];
  }
  function signed(n) { return (n < 0 ? '−' : '+') + Math.abs(n); }

  var dialog;
  function shortRest() {
    if (dialog) dialog.remove();
    var key = hitDiceKey();
    var avail = key ? state.counters[key] : 0;
    var con = abilityMod('CON') || 0;
    var canHeal = meta.hpMax !== null && state.hp < meta.hpMax && avail > 0;
    var count = canHeal ? 1 : 0;

    function close() { if (dialog.close) dialog.close(); dialog.remove(); dialog = null; }
    var kids = [el('h2', { class: 'i-dlg-title', text: 'Kurze Rast' })];

    if (!canHeal) {
      kids.push(el('p', {
        text: avail === 0 ? 'Keine Hit Dice mehr übrig. Die kurze Rast heilt daher nichts.'
          : 'Du hast volle HP, Hit Dice werden nicht gebraucht.'
      }));
      kids.push(el('div', { class: 'i-dlg-actions' }, [
        el('button', { type: 'button', class: 'i-btn', text: 'Rast beenden', on: { click: close } })
      ]));
    } else {
      var countOut = el('span', { class: 'i-count-cur' });
      var die = el('select', { class: 'i-die', 'aria-label': 'Würfelgröße' });
      [6, 8, 10, 12].forEach(function (d) {
        var o = el('option', { value: String(d), text: 'D' + d });
        if (d === guessHitDie()) o.selected = true;
        die.appendChild(o);
      });
      var roll = el('input', {
        type: 'number', min: '1', inputmode: 'numeric', class: 'i-amount', 'aria-label': 'Gewürfelte Summe'
      });
      var preview = el('p', { class: 'i-dlg-preview', 'aria-live': 'polite' });
      var healBtn = el('button', { type: 'button', class: 'i-btn', text: 'Heilen' });

      var update = function () {
        countOut.textContent = count;
        var sum = parseInt(roll.value, 10);
        var ready = count > 0 && sum > 0;
        healBtn.disabled = !ready;
        if (!ready) {
          preview.textContent = count === 0 ? 'Keine Hit Dice ausgewählt.'
            : 'Würfle ' + count + 'D' + die.value + ' und trag die Summe ein.';
          return;
        }
        var amount = Math.max(0, sum + count * con);
        preview.textContent = 'Heilung ' + sum + ' ' + signed(count * con) + ' CON = ' + amount +
          '  ·  HP ' + state.hp + ' → ' + Math.min(meta.hpMax, state.hp + amount) + '/' + meta.hpMax;
      };
      var setCount = function (d) { count = clamp(count + d, 0, avail); roll.value = ''; update(); };
      roll.addEventListener('input', update);
      die.addEventListener('change', function () { roll.value = ''; update(); });
      healBtn.addEventListener('click', function () {
        var sum = parseInt(roll.value, 10);
        if (!(count > 0 && sum > 0)) return;
        state.counters[key] -= count;
        heal(Math.max(0, sum + count * con));
        close();
      });

      kids.push(el('p', {
        text: 'Möchtest du Hit Dice zum Heilen verwenden? Verfügbar: ' + avail + '/' + meta.counterMax[key] +
          ' · pro Würfel ' + signed(con) + ' (CON)'
      }));
      kids.push(el('div', { class: 'i-dlg-grid' }, [
        el('span', { text: 'Anzahl' }),
        el('span', { class: 'i-counter' }, [
          stepButton('−', 'Ein Hit Die weniger', function () { setCount(-1); }),
          countOut,
          stepButton('+', 'Ein Hit Die mehr', function () { setCount(1); })
        ]),
        el('span', { text: 'Würfel' }), die,
        el('span', { text: 'Gewürfelt' }),
        el('span', { class: 'i-dlg-roll' }, [roll, el('button', {
          type: 'button', class: 'i-btn i-ghost', text: 'Für mich würfeln', on: {
            click: function () {
              var s = 0, f = parseInt(die.value, 10);
              for (var i = 0; i < count; i++) s += 1 + Math.floor(Math.random() * f);
              roll.value = count ? s : '';
              update();
            }
          }
        })])
      ]));
      kids.push(preview);
      kids.push(el('div', { class: 'i-dlg-actions' }, [
        el('button', { type: 'button', class: 'i-btn i-ghost', text: 'Ohne Hit Dice rasten', on: { click: close } }),
        healBtn
      ]));
      update();
    }

    dialog = el('dialog', { class: 'i-dialog', 'aria-label': 'Kurze Rast' }, kids);
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    document.body.appendChild(dialog);
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  }

  function resetToExport() {
    if (!confirm('Alle Änderungen verwerfen und die Werte aus dem Export wiederherstellen?')) return;
    forget();
    state = clone(defaults);
    render();
  }

  var statusEl;
  function showStatus() {
    if (statusEl) statusEl.textContent = storageOk ? '' : 'Browser-Speicher blockiert: Änderungen gehen beim Neuladen verloren.';
  }

  function buildToolbar() {
    statusEl = el('span', { class: 'i-status', role: 'status' });
    var actions = el('span', { class: 'i-actions', role: 'group', 'aria-label': 'Spieltisch' }, [
      el('button', { type: 'button', class: 'i-btn', text: 'Kurze Rast', on: { click: shortRest } }),
      el('button', { type: 'button', class: 'i-btn', text: 'Lange Rast', on: { click: longRest } }),
      el('button', { type: 'button', class: 'i-btn i-ghost', text: 'Auf Export zurücksetzen', on: { click: resetToExport } })
    ]);
    var bar = el('div', { class: 'i-toolbar i-screen' }, [
      el('span', { class: 'i-tb-title', text: 'Spieltisch' }), actions, statusEl
    ]);
    var page = document.querySelector('.page') || document.body;
    page.insertBefore(bar, page.firstChild);
    showStatus();
    buildTabs(page, bar, actions);
  }

  // Extra tabs come from <template data-tab="Name"> blocks in the character file.
  function buildTabs(page, bar, actions) {
    var templates = Array.prototype.slice.call(document.querySelectorAll('template[data-tab]'));
    if (!templates.length) return;

    var sheet = el('div', { class: 'i-panel' });
    Array.prototype.slice.call(page.childNodes).forEach(function (n) {
      if (n !== bar && n.nodeName !== 'SCRIPT' && n.nodeName !== 'TEMPLATE') sheet.appendChild(n);
    });
    page.appendChild(sheet);
    var panels = [sheet], names = ['Bogen'];
    templates.forEach(function (t) {
      var p = el('div', { class: 'i-panel i-extra' });
      p.appendChild(t.content.cloneNode(true));
      page.appendChild(p);
      panels.push(p);
      names.push(t.getAttribute('data-tab'));
    });

    var tabs = names.map(function (name, i) {
      return el('button', {
        type: 'button', role: 'tab', class: 'i-tab', id: 'i-tab-' + i, 'aria-controls': 'i-panel-' + i, text: name,
        on: { click: function () { select(i, true); } }
      });
    });
    panels.forEach(function (p, i) {
      p.id = 'i-panel-' + i;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', 'i-tab-' + i);
    });
    var list = el('div', { class: 'i-tabs', role: 'tablist', 'aria-label': 'Ansicht' }, tabs);
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (i < 0 || !d) return;
      e.preventDefault();
      var next = (i + d + tabs.length) % tabs.length;
      select(next, true);
      tabs[next].focus();
    });
    bar.replaceChild(list, bar.querySelector('.i-tb-title'));

    function select(i, byUser) {
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.tabIndex = j === i ? 0 : -1;
        panels[j].hidden = j !== i;
      });
      actions.hidden = i !== 0;
      if (byUser) {
        window.scrollTo(0, 0);
        try { localStorage.setItem(KEY + ':tab', String(i)); } catch (e) { /* view preference only */ }
      }
    }
    var start = 0;
    try { start = parseInt(localStorage.getItem(KEY + ':tab'), 10) || 0; } catch (e) { /* default tab */ }
    select(start < tabs.length ? start : 0, false);
  }

  function render() {
    if (views.hp) {
      views.hp.out.textContent = state.hp;
      views.hp.item.classList.toggle('i-down', state.hp === 0);
      views.hp.item.classList.toggle('i-bloodied', state.hp > 0 && state.hp <= meta.hpMax / 2);
    }
    if (views.temp && document.activeElement !== views.temp) views.temp.value = state.temp || '';
    views.counters.forEach(function (c) {
      c.out.textContent = state.counters[c.key];
      c.out.parentNode.parentNode.classList.toggle('i-empty', state.counters[c.key] === 0);
    });
    views.bubbles.forEach(function (g) {
      g.buttons.forEach(function (b, i) {
        var on = state.bubbles[g.key][i];
        b.textContent = on ? FILLED : EMPTY;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
  }

  cleanRolls();
  scan();
  buildMageArmor();
  state = mergeStored(loadStored());
  buildToolbar();
  render();

  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { state = mergeStored(loadStored()); render(); }
  });
})();
