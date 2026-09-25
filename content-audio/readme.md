# Gegneranalysen mit Audio – Ablage

Für Analysen, die schon als fertig vorgelesener Text + echte MP3-Aufnahme
vorliegen (z. B. Export aus einem Turnier-Vorbereitungs-Tool) – im Unterschied
zu `content/`, wo Markdown-Quellen liegen, die erst beim Build in Lese- und
Hörmodus umgewandelt werden.

## Workflow

1. Für jeden Gegner zwei Dateien mit **demselben Namen** hier ablegen:
   - `<slug>.txt` – der fertige Sprechtext
   - `<slug>.mp3` – die passende Audioaufnahme/-erzeugung
2. Committen und nach `main` pushen.
3. GitHub Actions baut daraus automatisch `gegner/<slug>.html` (Text +
   eingebetteter Audio-Player) und aktualisiert `gegner/index.html`.

Eine `.txt` ohne passende `.mp3` (oder umgekehrt) lässt den Build mit einer
Fehlermeldung abbrechen, statt eine unvollständige Seite zu erzeugen.

## Namenskonvention

- `<slug>`: nur Kleinbuchstaben `a-z`, Ziffern `0-9`, Bindestrich `-`
- Der Slug darf sich nicht mit einem `content/gegner-<slug>.md` überschneiden
  (der Build meldet einen Fehler, falls doch).

## Format-Vertrag der `.txt`-Datei

- **Erste Zeile**: Titel der Analyse (z. B. `Gegneranalyse: <Name> (<Tag>) –
  <Fraktion>.`) – wird als Seitentitel verwendet, nicht doppelt im Text
  angezeigt.
- **`Abschnitt N: Titel.`** auf einer eigenen Zeile markiert einen neuen
  Hauptabschnitt (entspricht `## N. Titel` bei den Markdown-Analysen) –
  wird im Inhaltsverzeichnis und als „Nur diesen Abschnitt“-Button angezeigt.
- Jede andere nicht-leere Zeile wird unverändert als eigener Absatz
  übernommen – keine Zusammenfassung, keine Umformulierung, keine
  Symbolersetzung (der Text ist bereits fertig für T2S formuliert, z. B.
  „18 Zoll“ statt `18"`).
- Lese- und Hörmodus zeigen denselben Text; der Hörmodus stellt zusätzlich
  den Audio-Player mit der echten MP3 voran.

## Repo-Größe

MP3s werden direkt im Repo committet (kein Git LFS, da GitHub Pages
LFS-Dateien nicht zuverlässig ausliefert). Jede Aufnahme ist üblicherweise
8–12 MB groß – bei größeren Mengen (z. B. viele Turniere) wächst das Repo
entsprechend spürbar.
