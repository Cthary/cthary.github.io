# Gegneranalysen – Ablage

Dieser Ordner ist die einzige Stelle, die du zum Veröffentlichen einer neuen
Gegneranalyse anfassen musst.

## Workflow

1. Neue Datei hier ablegen: `content/gegner-<slug>.md`
   (z. B. `content/gegner-sven-geib.md`)
2. Committen und nach `main` pushen.
3. GitHub Actions baut daraus automatisch `gegner/<slug>.html` und
   aktualisiert `gegner/index.html` (Bot-Commit, ca. 1 Minute).
4. Danach ist die Analyse live unter `https://cthary.github.io/gegner/<slug>.html`.

Du musst **nichts** manuell in `gegner/` bearbeiten – diese Dateien werden
automatisch erzeugt und beim nächsten Build überschrieben.

## Namenskonvention

- Dateiname: `gegner-<slug>.md`
- `<slug>`: nur Kleinbuchstaben `a-z`, Ziffern `0-9`, Bindestrich `-`
  (passend zu `tools/site.py check`, das Dateinamen repoweit prüft)

## Format-Vertrag

Damit Lesemodus und Hörmodus korrekt gebaut werden, halte dich an:

- **Genau ein `# H1`** am Anfang – wird als Titel und Listeneintrag auf der
  Startseite verwendet.
- **`## N. Abschnittsname`** für Hauptabschnitte (werden im Inhaltsverzeichnis
  und als „Nur diesen Abschnitt“-Buttons angezeigt). Die Nummerierung bleibt
  wie geschrieben erhalten.
- **`### Unterabschnitt`** optional für Unterpunkte.
- **Tabellen** im Standard-Markdown-Format (`| Spalte | Spalte |`).
- **Listen**: nummeriert (`1.`) oder unnummeriert (`-`), auch verschachtelt.
- **Codeblöcke** (` ``` `) werden für taktische Ablaufdiagramme/ASCII-Checklisten
  verwendet, nicht für echten Programmcode – sie werden im Hörmodus in
  strukturierten Text umgewandelt.
- **Fett/Kursiv/Inline-Code/Blockquotes/Links** werden unterstützt.
- Der Inhalt wird **niemals verändert, gekürzt oder umformuliert** – nur
  strukturell in Lese- und Hörmodus aufbereitet.

## Aussprache-Whitelist

Für die T2S-Ausgabe (Hörmodus) kannst du in
`content-build/symbol-map.json` exakte Ersetzungen eintragen, z. B.
`18"` → `18 Zoll`. Es werden **nur** exakte, von dir eingetragene Treffer
ersetzt – das System rät oder erfindet keine Aussprache-Regeln.

## Bereits fertig vorgelesene Analysen (Text + MP3)

Liegt eine Analyse schon als fertiger Sprechtext plus echter Audioaufnahme
vor (z. B. Export aus einem anderen Tool), gehört sie nicht hierher, sondern
in `content-audio/` – siehe `content-audio/readme.md`.

## Bekannte Einschränkungen (Offline/PWA)

- Nur bereits online besuchte Analyse-Seiten sind offline verfügbar
  (kein automatisches Vor-Cachen aller Analysen).
- Nach einer Content-Änderung kann es durch Browser-eigenes Caching des
  Service Workers (`sw.js`) bis zu ~24h dauern, bis ein Gerät die neue
  Version des Service Workers selbst bemerkt – die Analyse-Inhalte selbst
  werden aber bereits beim nächsten Online-Besuch aktualisiert
  (stale-while-revalidate).
