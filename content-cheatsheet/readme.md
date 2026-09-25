# Gegneranalysen – Kurzform ("Spickzettel")

Kurze Checklisten-Version einer Analyse (30-Sekunden-Checkliste, Kernaussage,
wichtigste Trigger) – erscheint als dritter Tab "Kurzform" neben Lesen/Hören.

## Workflow

1. Datei hier ablegen: `content-cheatsheet/<slug>.md`
2. Committen und nach `main` pushen.
3. Gibt es bereits eine Analyse mit demselben `<slug>` in `content/`
   (oder eine Aufnahme in `content-audio/`), wird die Kurzform automatisch
   als dritter Tab an die bestehende Seite angehängt. Ohne Gegenstück
   entsteht eine eigenständige Seite nur mit diesem Kurzform-Inhalt.
4. Kein Gegenstück? Kein Problem – der Tab erscheint nur, wenn eine
   `<slug>.md` hier liegt.

## Namenskonvention

- `<slug>.md`, gleiche Regeln wie in `content/` (Kleinbuchstaben, Ziffern,
  Bindestrich). Der Slug sollte mit dem der zugehörigen `content/`- bzw.
  `content-audio/`-Datei übereinstimmen, sonst entsteht ein separater
  Eintrag statt eines dritten Tabs.

## Format

Normales Markdown (Überschriften, Fett/Kursiv, Listen, Checklisten,
Blockquotes, Trennlinien) – wird mit derselben Pipeline wie `content/`
verarbeitet. Der Kurzform-Tab zeigt eine einzige, unveränderte Ansicht
(keine eigene Lesen/Hören-Unterteilung, da der Text ohnehin kurz genug ist).
