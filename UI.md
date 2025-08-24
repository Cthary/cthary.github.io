# Prompt für CoPilot: UI/UX Design für Warhammer 40k Battle Simulator

## Ziel

Ein modernes, interaktives und barrierefreies User Interface (UI) für den Warhammer 40k Battle Simulator (10th Edition).
Das UI soll **intuitiv, responsive, barrierefrei und mobil-optimiert** sein, mit besonderem Fokus auf **Übersichtlichkeit, Interaktivität und schnelle Bedienbarkeit**.
Parse-Ergebnisse sollen **nicht direkt angezeigt** werden – stattdessen wird der Nutzer nur mit **klar strukturierten Daten und Simulationsergebnissen** konfrontiert.

---

## Anforderungen

### 1. Grundprinzipien

- **Mobile First**: UX soll auf Smartphones perfekt funktionieren, dann auf Desktop erweitert werden.
- **Responsives Layout** mit Flex/Grid.
- **Klares Design** mit Fokus auf Lesbarkeit und Reduzierung von kognitiver Last.
- **Dark Mode & Light Mode** Umschaltbar.
- **Barrierefreiheit**:
  - Kontraststarke Farben.
  - Screenreader-Unterstützung (ARIA-Labels).
  - Tastatur-Navigation.
  - Schriftgrößen anpassbar.
- **Intuitives Onboarding**: Nutzer verstehen ohne Erklärung, wie sie ihre Armeen laden und Simulationen starten.

---

### 2. Startscreen / Home

- Minimalistisches Dashboard.
- Buttons:
  - „Armeeliste hochladen“ (Attacker).
  - „Armeeliste hochladen“ (Defender).
  - „Simulation starten“.
- Fortschrittsanzeige (z.B. wie viele Daten geladen sind).
- Klarer **Call-to-Action**.

---

### 3. Armeelisten Management

- Hochladen via **Drag & Drop** oder Dateiauswahl.
- Validierung der Liste (nur Battlescribe Dateien).
- Feedback bei Fehlern:
  - Kurze Fehlermeldungen, keine Rohdaten.
  - Beispiele für Korrekturen anzeigen.
- Übersicht der geladenen Armeen:
  - Symbole / Icons für Fraktionen.
  - Kurze Zusammenfassung (z.B. Anzahl Einheiten, CP, Punkte).

---

### 4. Simulation Setup

- Nutzer kann einstellen:
  - Anzahl der Simulationen (z.B. 100, 1.000, 10.000).
  - Optionale Modifikatoren (z.B. Szenario-Boni, Gelände).
- Schlichtes, interaktives Formular.
- Hilfstexte als Tooltips.

---

### 5. Ergebnisse (Visualisierung)

- **Interaktive Graphen**:
  - Balkendiagramme für durchschnittlichen Schaden.
  - Wahrscheinlichkeitskurven (z.B. Treffer/Wunden).
  - Tabellen für detaillierte Werte.
- Ergebnisse klar gegliedert:
  - Gesamtschaden pro Simulation.
  - Durchschnittswerte.
  - Siegchance in %.
- Ergebnisse **exportierbar** (CSV, PNG Screenshot).
- Animationen **subtil** (z.B. Lade-Animation während Berechnung).

---

### 6. Navigation & Interaktion

- Seiten-Navigation **oben fixiert** (z.B. Tabs oder Burger-Menu).
- **Step-by-Step Navigation**:
  1. Listen laden.
  2. Simulation konfigurieren.
  3. Ergebnisse ansehen.
- Nutzer darf jederzeit zurückspringen und Änderungen machen.
- Keine unnötigen Klicks – jede Aktion max. 2 Steps entfernt.

---

### 7. UI-Komponenten

- **Kartenbasiertes Layout** für Einheiten-Infos & Ergebnisse.
- **Accordions** für Details.
- **Tabs** für unterschiedliche Ansichten (z.B. Graphen vs. Tabellen).
- **Floating Action Button** für schnelle Aktionen (z.B. neue Simulation starten).
- **Snackbar/Toast Meldungen** für Feedback (z.B. „Upload erfolgreich“).

---

### 8. Modernes Look & Feel

- Farbpalette: dunkle Warhammer-angehauchte Akzente (z.B. Schwarz, Grau, Akzent in Rot/Gold/Blau).
- Abgerundete Buttons & Cards mit Schatten.
- Einheitliche Icon-Sprache (z.B. Lucide oder HeroIcons).
- Lesbare Typographie (Sans Serif, klare Hierarchie mit h1-h3).

---

### 9. Technische Umsetzung

- **Framework**: React mit Tailwind CSS (leichtgewichtig, flexibel).
- **Komponentenbibliothek**: shadcn/ui oder Material UI.
- **Charts**: Recharts oder Chart.js.
- **Responsives Grid**: Tailwind Flex/Grid.
- **ARIA & WCAG 2.1** Konformität sicherstellen.

---

## Wichtiger Arbeitsablauf für CoPilot

1. **Erstelle eine detaillierte ToDo-Liste für das UI**, abspeichern.
2. **Arbeite Schritt für Schritt** ab, beginnend mit Struktur, dann Styling, dann Interaktion.
3. Baue erst **statische UI-Komponenten**.
4. Danach **Interaktivität hinzufügen** (Upload, Navigation, Graphen).
5. Zum Schluss **Barrierefreiheit und Optimierungen** implementieren.

---

## Zielbild

Am Ende soll ein **interaktives, modernes und benutzerfreundliches Frontend** entstehen, das:

- Klar strukturiert ist.
- Auch auf Smartphones perfekt bedienbar ist.
- Spieler schnell und ohne Frust zu den Ergebnissen führt.
- Optisch zum Warhammer 40k Feeling passt (modern, dunkel, minimalistisch, aber stimmungsvoll).
