/* Denkassistent: kleine Frage-für-Frage-Abläufe.
   Das ist bewusst KEIN Taktikberater. Er stellt Fragen und gibt neutrale Hinweise.
   Einbinden: <div class="flow" data-flow="move"></div> (Namen: move, roles, tree) */
(function () {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function copy(obj) {
    var out = {};
    Object.keys(obj).forEach(function (k) { out[k] = obj[k]; });
    return out;
  }

  /* ---------- Abläufe ---------- */

  function moveResult(a) {
    var hints = [];
    if (a.danger === 'ja') {
      hints.push({ tone: 'warn', text: 'Der Gegner kann sie dort töten, bevor sie ihren Job erledigt hat. Gibt es eine Position, von der aus sie ihre Aufgabe noch erfüllt, aber schwerer zu erwischen ist?' });
    }
    if (a.task === 'Chargen' && a.charge === 'nein') {
      hints.push({ tone: 'warn', text: 'Dein Plan ist ein Charge, aber von dort kommst du nicht mehr hin. Passt die Position noch zum Plan?' });
    } else if (a.charge === 'nein') {
      hints.push({ tone: 'info', text: 'Von dort kann sie nicht mehr chargen. Ist das für den Plan der nächsten Runde in Ordnung?' });
    }
    if (a.task === 'Objective halten') {
      hints.push({ tone: 'info', text: 'Muss die Einheit dafür wirklich nach vorne? Bleibt sie dort lange genug am Leben, um Punkte zu erzeugen?' });
    } else if (a.task === 'Schießen') {
      hints.push({ tone: 'info', text: 'Welche gegnerische Einheit verhindert gerade deinen Plan? Kannst du genau dieses Ziel von dort sehen?' });
    } else if (a.task === 'Gegner blockieren') {
      hints.push({ tone: 'info', text: 'Was verhindert der Gegner dadurch wirklich – und was riskierst du dabei?' });
    } else if (a.task === 'Überleben') {
      hints.push({ tone: 'info', text: 'Wenn sie nur überleben soll: Muss sie sich dafür überhaupt bewegen?' });
    }
    if (a.danger === 'nein' && a.charge === 'ja') {
      hints.push({ tone: 'ok', text: 'Kein akutes Risiko und der Charge bleibt möglich. Prüf trotzdem: Muss sie jetzt wirklich weiter nach vorne?' });
    }
    return {
      summary: ['Aufgabe: ' + a.task, 'Gegner kann sie dort töten: ' + a.danger, 'Von dort noch chargen: ' + a.charge],
      hints: hints,
      note: 'Das ist ein Denkassistent, kein Taktikberater. Du entscheidest.'
    };
  }

  function rolesResult(a) {
    var picked = a.roles || [];
    var hints = [];
    if (!picked.length) {
      hints.push({ tone: 'info', text: 'Keine der drei Rollen? Dann darf diese Einheit vielleicht ignoriert werden. Was könntest du stattdessen mit deinen Einheiten machen?' });
    }
    if (picked.indexOf('A') > -1) {
      hints.push({ tone: 'bad', text: 'Bedrohung: Kannst du sie ausschalten oder wenigstens schwächen, bevor sie deinen Plan zerstört? Oder kannst du ihr aus dem Weg gehen?' });
    }
    if (picked.indexOf('B') > -1) {
      hints.push({ tone: 'warn', text: 'Mission: Wie viele Victory Points macht sie gerade? Musst du sie töten, oder reicht es, ihr das Objective abzunehmen?' });
    }
    if (picked.indexOf('C') > -1) {
      hints.push({ tone: 'info', text: 'Aufgabe: Was kann die Einheit, die sie unterstützt, ohne sie nicht mehr? Manchmal reicht es, sie zu binden oder wegzulocken.' });
    }
    if (picked.length > 1) {
      hints.push({ tone: 'warn', text: 'Mehrere Rollen zugleich: Diese Einheit ist wahrscheinlich sehr wichtig für den Plan deines Gegners.' });
    }
    return {
      summary: ['Rollen: ' + (picked.length ? picked.join(' + ') : 'keine erkannt')],
      hints: hints,
      note: 'Eine Einheit kann A, B und C gleichzeitig sein.'
    };
  }

  var FLOWS = {
    move: {
      title: 'Denkassistent · Einheit bewegen',
      start: 'task',
      nodes: {
        task: {
          q: 'Du willst diese Einheit bewegen. Was soll sie danach tun?',
          opts: ['Objective halten', 'Schießen', 'Chargen', 'Gegner blockieren', 'Überleben'].map(function (t) {
            return { t: t, to: 'danger', set: { task: t } };
          })
        },
        danger: {
          q: 'Kann der Gegner sie dort vorher töten?',
          note: 'Denk an seine Reichweite, seine Sichtlinien und Einheiten, die noch anrücken können.',
          opts: [
            { t: 'Ja', to: 'charge', set: { danger: 'ja' } },
            { t: 'Nein', to: 'charge', set: { danger: 'nein' } }
          ]
        },
        charge: {
          q: 'Kann sie von dort aus noch chargen?',
          note: 'Ein Charge geht nur, wenn ein Gegner höchstens 12 Zoll entfernt ist und die Einheit in diesem Zug nicht schon Advance oder Fall Back gemacht hat.',
          opts: [
            { t: 'Ja', to: 'end', set: { charge: 'ja' } },
            { t: 'Nein', to: 'end', set: { charge: 'nein' } }
          ]
        },
        end: { result: moveResult }
      }
    },

    roles: {
      title: 'Denkassistent · Welche Rolle hat die gegnerische Einheit?',
      start: 'pick',
      nodes: {
        pick: {
          q: 'Wähle alles, was zutrifft. Es dürfen auch mehrere sein.',
          key: 'roles',
          to: 'end',
          multi: [
            { id: 'A', t: 'A – Bedrohung', d: 'Wenn ich sie nicht stoppe, kann sie meine Armee zerstören.' },
            { id: 'B', t: 'B – Mission', d: 'Wenn ich sie nicht stoppe, bekommt mein Gegner Punkte.' },
            { id: 'C', t: 'C – Aufgabe', d: 'Wenn ich sie nicht stoppe, kann sie eine andere wichtige Einheit unterstützen oder eine bestimmte Aufgabe erfüllen.' }
          ]
        },
        end: { result: rolesResult }
      }
    },

    tree: {
      title: 'Entscheidungsbaum',
      start: 'goal',
      nodes: {
        goal: { q: 'Was will ich erreichen?', note: 'Zum Beispiel: ein Objective halten, eine wichtige Einheit stoppen, Zeit gewinnen.', opts: [{ t: 'Weiter', to: 'unit' }] },
        unit: { q: 'Welche Einheit soll das tun?', opts: [{ t: 'Weiter', to: 'place' }] },
        place: { q: 'Wo muss sie dafür stehen?', opts: [{ t: 'Weiter', to: 'kills' }] },
        kills: { q: 'Was kann sie dort töten?', opts: [{ t: 'Weiter', to: 'killed' }] },
        killed: {
          q: 'Was kann sie dort töten lassen? Kann der Gegner sie dort erwischen?',
          opts: [{ t: 'Ja', to: 'protect' }, { t: 'Nein', to: 'stop' }]
        },
        protect: {
          q: 'Position ändern oder die Einheit schützen.',
          note: 'Was kann der Gegner töten, bevor die Einheit ihren Job erledigt? Deckung nutzen, Sichtlinien blockieren, später kommen oder anders aufstellen.',
          opts: [{ t: 'Neue Position prüfen', to: 'place' }]
        },
        stop: { q: 'Was muss der Gegner verhindern?', opts: [{ t: 'Weiter', to: 'who' }] },
        who: { q: 'Welche gegnerische Einheit ist dafür verantwortlich?', opts: [{ t: 'Weiter', to: 'kill' }] },
        kill: {
          q: 'Muss ich sie töten?',
          opts: [{ t: 'Ja', to: 'attack' }, { t: 'Nein', to: 'ignore' }]
        },
        attack: {
          result: function () {
            return {
              summary: ['Ergebnis: Angriff vorbereiten'],
              hints: [{ tone: 'info', text: 'Welche Einheiten brauchst du dafür, und wo stehen sie danach?' }],
              note: 'Du entscheidest. Der Baum stellt nur die Fragen.'
            };
          }
        },
        ignore: {
          result: function () {
            return {
              summary: ['Ergebnis: Ignorieren und Punkte spielen'],
              hints: [{ tone: 'ok', text: 'Was kannst du stattdessen mit deinen Einheiten machen? Welches Objective bringt dir jetzt Punkte?' }],
              note: 'Du entscheidest. Der Baum stellt nur die Fragen.'
            };
          }
        }
      }
    }
  };

  /* ---------- Ablauf-Motor ---------- */

  function Flow(container, def) {
    this.container = container;
    this.def = def;
    this.restart(false);
  }

  Flow.prototype.restart = function (focus) {
    this.answers = {};
    this.history = [];
    this.node = this.def.start;
    this.render(focus);
  };

  Flow.prototype.go = function (to, set) {
    this.history.push({ node: this.node, answers: copy(this.answers) });
    if (set) {
      var self = this;
      Object.keys(set).forEach(function (k) { self.answers[k] = set[k]; });
    }
    this.node = to;
    this.render(true);
  };

  Flow.prototype.back = function () {
    var prev = this.history.pop();
    if (!prev) return;
    this.node = prev.node;
    this.answers = prev.answers;
    this.render(true);
  };

  Flow.prototype.render = function (focus) {
    var self = this;
    var box = this.container;
    while (box.firstChild) box.removeChild(box.firstChild);
    box.setAttribute('role', 'region');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', this.def.title);

    box.appendChild(el('div', 'flow-title', this.def.title));
    var node = this.def.nodes[this.node];
    var heading;

    if (node.result) {
      var r = node.result(this.answers);
      heading = el('div', 'flow-q', 'Zusammenfassung');
      heading.tabIndex = -1;
      box.appendChild(heading);
      var ul = el('ul', 'flow-summary');
      r.summary.forEach(function (s) { ul.appendChild(el('li', null, s)); });
      box.appendChild(ul);
      if (r.hints.length) {
        var hints = el('div', 'flow-hints');
        r.hints.forEach(function (h) { hints.appendChild(el('div', 'callout callout--' + h.tone, h.text)); });
        box.appendChild(hints);
      }
      if (r.note) box.appendChild(el('p', 'fine', r.note));
    } else {
      heading = el('div', 'flow-q', node.q);
      heading.tabIndex = -1;
      box.appendChild(heading);
      if (node.note) box.appendChild(el('p', 'muted', node.note));

      if (node.multi) {
        var multi = el('div', 'flow-multi');
        var boxes = [];
        node.multi.forEach(function (m) {
          var label = el('label', 'check');
          var input = document.createElement('input');
          input.type = 'checkbox';
          input.value = m.id;
          boxes.push(input);
          var text = el('span');
          var strong = el('strong', null, m.t);
          text.appendChild(strong);
          text.appendChild(document.createElement('br'));
          text.appendChild(document.createTextNode(m.d));
          label.appendChild(input);
          label.appendChild(text);
          multi.appendChild(label);
        });
        box.appendChild(multi);
        var next = el('button', 'btn btn--primary', 'Weiter');
        next.type = 'button';
        next.addEventListener('click', function () {
          var ids = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
          var set = {};
          set[node.key] = ids;
          self.go(node.to, set);
        });
        box.appendChild(next);
      } else {
        var opts = el('div', 'flow-opts');
        node.opts.forEach(function (o) {
          var b = el('button', o.t === 'Weiter' || o.t === 'Ja' || o.t === 'Nein' ? 'btn btn--primary' : 'btn', o.t);
          b.type = 'button';
          b.addEventListener('click', function () { self.go(o.to, o.set); });
          opts.appendChild(b);
        });
        box.appendChild(opts);
      }
    }

    var actions = el('div', 'flow-actions');
    if (this.history.length) {
      var back = el('button', 'btn btn--ghost btn--small', '← Zurück');
      back.type = 'button';
      back.addEventListener('click', function () { self.back(); });
      actions.appendChild(back);
    }
    if (this.history.length || node.result) {
      var again = el('button', 'btn btn--ghost btn--small', 'Neu starten');
      again.type = 'button';
      again.addEventListener('click', function () { self.restart(true); });
      actions.appendChild(again);
    }
    if (actions.firstChild) box.appendChild(actions);

    if (focus && heading) heading.focus();
  };

  document.querySelectorAll('[data-flow]').forEach(function (container) {
    var def = FLOWS[container.getAttribute('data-flow')];
    if (def) new Flow(container, def);
  });
})();
