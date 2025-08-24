# Copilot Prompt: Online-Simulator für Warhammer 40k (10th Edition)

> **Ziel:** Baue ein modernes, performantes, erweiterbares **Online-Tool zur Simulation von Warhammer 40k 10th Edition**.
> Eingabe sind **Battlescribe-Listen** (Angreifer & Verteidiger). Das Tool **parst korrekt**, **simuliert X-mal** echte Würfelabläufe und zeigt **aussagekräftige Statistiken, Wahrscheinlichkeiten und Diagramme**.

---

## 0) Arbeitsmodus & Meta-Regeln (wichtig!)

1. **Starte mit einer detaillierten TODO-Liste**

   - Erstelle eine **feingranulare Projekt-Roadmap** (max. 1–2 Std. pro Task, inkl. Akzeptanzkriterien).
   - Speichere sie in `docs/TODO.md`.
   - Halte sie aktuell (abhaken/erweitern), bevor du den nächsten Schritt implementierst.
2. **Abarbeitung in kleinen, abgeschlossenen Schritten**

   - Implementiere **immer nur einen TODO-Punkt pro Commit/PR**.
   - Schreibe kurze, präzise Commits; verlinke den TODO-Punkt.
   - Dokumentiere Annahmen in `docs/assumptions.md`.
3. **Kontext-Sparsamkeit / Limit vermeiden**

   - Große Artefakte (Schemas, Beispieldateien, Benchmark-Outputs) **als Dateien** ablegen, nicht in Konversation.
   - Längere Erklärungen in `docs/` persistieren und nur verlinken.
   - Ergebnisse (Charts, CSV) auf Disk speichern und im UI rendern.
4. **Best Practices durchgängig**

   - SOLID, Clean Code, DRY/KISS/YAGNI, Type-Safety.
   - **TypeScript** für Frontend & Backend, strikter TS-Modus.
   - **Unit-, Property- & Integration-Tests** ab Beginn.
   - **Lint/Format/CI**: ESLint, Prettier, GitHub Actions.

---

## 1) Tech-Stack & Projektstruktur

- **Frontend:** Next.js (App Router), React, **TypeScript**, TailwindCSS, **shadcn/ui**, Recharts (Charts).
- **Backend:** Node.js + Fastify (oder Express), **TypeScript**.
- **Simulation Core:** TS-Lib, optional **Web Workers**; später optional **WASM** (Rust) für Performance.
- **State:** Zustand (Frontend); serverseitig Service-Layer.
- **Tests:** Vitest/Jest, Playwright für E2E (Basisflows).
- **Ordnerstruktur (Vorschlag):**
  ```
  /app            # Next.js UI
  /packages/core  # Simulation Engine (pure TS)
  /packages/parser# Battlescribe-Parser + IR
  /packages/api   # Fastify-API
  /packages/ui    # UI-Komponenten (Charts, Tables)
  /docs           # TODO, Specs, Annahmen, Benchmarks
  /fixtures       # Beispiel-Listen (.ros/.rosz), Snapshots
  ```

---

## 2) Battlescribe-Parsing (robust & eindeutig)

**Ziel:** Waffen **nicht** als Einheiten behandeln. Korrekt trennen: **Force → Units → Models → Weapons/Profiles → Abilities/Keywords**.

- **Input:** `.rosz` (ZIP) oder `.ros` (XML).
- **Schritte:**

  1. `.rosz` entpacken → `roster.xml` lesen.
  2. XML zu **Canonical Intermediate Representation (IR)** mappen (JSON).
  3. **Disambiguierung:**
     - **Units** = oberste Auswahl mit Modell-/Wargear-Kontext.
     - **Models** = Profile innerhalb der Unit (Model count, W, Sv, Ld, OC).
     - **Weapons** = **Waffenprofile** (Melee/Ranged) **als Kind von Models/Unit**, **nie** eigene Unit.
     - **Wargear/Options** sauber als **Modifikatoren** (z. B. +Attacken, neue Waffe).
  4. **Keywords & Abilities** sammeln, normalisieren und in IR referenzieren.
- **IR-Schema (vereinfachte Skizze):**

  ```json
  {
    "faction": "string",
    "points": 0,
    "units": [
      {
        "name": "string",
        "models": [
          {
            "name": "string",
            "count": 5,
            "profile": { "M":6, "T":4, "Sv":3, "W":2, "Ld":7, "OC":1, "Inv":5 },
            "weapons": [
              {
                "name": "Bolt Rifle",
                "type": "ranged",
                "profile": { "A":2, "BS":3, "S":4, "AP":-1, "D":2, "range":24 },
                "keywords": ["Rapid Fire 1", "Assault"]
              }
            ]
          }
        ],
        "unitKeywords": ["INFANTRY","ADEPTUS ASTARTES"],
        "abilities": ["Oath of Moment"],
        "auras": [],
        "modifiers": []
      }
    ]
  }
  ```
- **Keyword-Abdeckung (10th Edition, Beispiele):**Weapon/Ability-Keywords wie **Assault, Heavy, Pistol, Rapid Fire X, Twin-linked, Torrent, Blast, Devastating Wounds, Lethal Hits, Sustained Hits X, Precision, Anti-X(+Y), Ignores Cover, Hazardous, Lance, Melta X, Extra Attacks, Twin-linked, Indirect Fire, Twin-linked, Torrent, Devastating Wounds** usw.→ **Alle Standard-Keywords** als **maschinenlesbare Definitionen** in `packages/core/rules/keywords.ts` modellieren (mit Parametern).
- **Custom-Keywords** für Sonderfälle ohne offizielles Keyword

  - **Notation:** `KEY(args?)`, kurz & eindeutig.
  - Beispiele: `RH1` = *Reroll Hit rolls of 1*, `RRW` = *Reroll all Wound rolls*, `APM1` = *AP +1*, `+A1` = *+1 Attacke pro Modell*, `FNP5` = *Feel No Pain 5+*.
  - Auflösung erfolgt in einer **Mapping-Tabelle** `rules/customKeywords.ts`, inkl. Testfällen.
- **Validierung:**

  - Zod-Schemas für IR; **fehlertolerant**, aber eindeutig (harte Fehler bei Unit/Waffen-Fehlklassifikation).
  - **Snapshot-Tests** für reale `.ros/.rosz` in `/fixtures`.

---

## 3) Rules Engine (10E-Konformität, Würfelreihenfolge)

**Ablauf einer Attack-Sequenz (Ranged/Melee):**

1. **Attacks ermitteln** (Model-Count × A, Modifikatoren, Blast, Rapid Fire X etc.).
2. **To Hit** (WS/BS, Modifikatoren; **Critical Hit** auf 6, modifizierte 6 beachten).
3. **Hit-Rerolls** (RH1, Full Reroll, Twin-linked wirkt später auf Wound!).
4. **Lethal Hits**: Crit-Hits → auto-Wound Hits.
5. **Sustained Hits X**: pro Crit zusätzliche Hits.
6. **To Wound** (S vs T Matrix; **Critical Wound** = 6 oder via **Anti-X**).
7. **Wound-Rerolls** (Twin-linked, RRW, Reroll 1s).
8. **Saves**: Normal vs **Invulnerable** (bestes wählen), **Cover**, AP-Modifikatoren.
9. **Damage**: D, **Melta X** (Reichweite), **Devastating Wounds** (Crit Wounds → MW statt normalem Schaden), **Damage Reduction**, **Feel No Pain X+**.
10. **Allocation & Casualties** (Modelle entfernen; Overflow beachten, Reanimation-ähnliche Effekte falls modelliert).
11. **Moral/OC** nur wenn modelliert (optional erste Iteration überspringen).

**Regelpriorität:** Keyword-Timing strikt dokumentieren (`docs/rules-timing.md`).
**Determinismus:** RNG mit Seed (SplitMix32) für reproduzierbare Runs.

---

## 4) Simulation (Monte-Carlo)

- **Parameter:** `runs = 10_000` (konfigurierbar), Szenario-Seed, Auswahl von Buffs/Stratagems.
- **Output pro Run:** Gesamtschaden, getötete Modelle, Ziel getötet? Rest-Wounds, verbrauchte Rerolls.
- **Parallelisierung:** **Web Workers** im Frontend oder Node Worker Threads im Backend.
- **Leistung:** Vektorisiere Hotpaths (lookup-tabellen), Minimize object churn, Pooling.

---

## 5) Statistik & Visualisierung

- **Kennzahlen:** Mean, Median, StdAbw, Min/Max, **P25/P75**, **P90/P95**, **Kill-Wahrscheinlichkeit**, **TTK-Schätzung**, **Überlebenswahrscheinlichkeit**.
- **Charts (Recharts):**
  - **Histogramm** Schadensverteilung.
  - **CDF** (kumulierte Kill-Chance).
  - **Boxplot-ähnliche Darstellung** (vereinfachbar).
- **Tabellen:** ein-/ausklappbar, CSV-Export.
- **Vergleich:** Mehrere Setups nebeneinander (A/B), Delta-Metriken.

---

## 6) UX / UI-Design (modern, clean)

- **Design:** Tailwind + shadcn/ui, **Dark Mode**, responsive, Fokus auf Lesbarkeit.
- **Flows:**
  - Drag&Drop **Battlescribe-Listen** (Angreifer, Verteidiger).
  - Parser-Report (Fehler/Warnungen, was gemappt wurde).
  - Szenario-Konfigurator (Buffs, Reichweite, Cover, Stratagems).
  - **Run Button** mit Fortschritt & Seeds.
  - Ergebnisse: **Charts & Tabellen**, Download (CSV/JSON).
- **Barrierefreiheit:** ARIA-Labels, Tastatur-Nav.
- **Fehlerklarheit:** präzise Hinweise, wie die Liste zu korrigieren ist.

---

## 7) Qualität, Tests & CI

- **Unit-Tests:**
  - Würfel-Funktionen (kritisch, Rerolls, Anti-X, Lethal, Sustained).
  - Keyword-Mappings (Standard & Custom).
- **Property-Based Tests:** Hit/Wound-Verteilungen, Erhalt von Erwartungswerten.
- **Parser-Snapshot-Tests:** echte `.ros/.rosz` in `/fixtures`.
- **Integration:** End-to-End von Upload → Charts (Mock-RNG Seed).
- **CI:** Lint/Typecheck/Test, auf jedem PR.
- **Benchmarks:** simple Bench in `docs/benchmarks.md`.

---

## 8) Sicherheit & Performance

- **Client-first** (Privacy): Parsing/Simulation im Browser; Backend optional für Persistenz.
- **Limits:** Dateigröße, Timeout pro Run, Worker-Pool-Größe.
- **Keine PII** speichern; Ergebnisse lokal, Export via Download.

---

## 9) Deliverables (inkrementell)

1. `docs/TODO.md` (feingranular, mit Akzeptanzkriterien) **→ zuerst erstellen & speichern**.
2. `packages/parser` mit IR-Schema + Tests (Waffen ≠ Units!).
3. `packages/core` Rules Engine (10E), deterministische RNG, Tests.
4. API/Workers, dann UI (Uploader → Parser-Report → Szenario → Run → Charts).
5. Exporte (CSV/JSON), Docs, Fixtures.

---

## 10) Akzeptanzkriterien (Beispiele)

- Parser klassifiziert in allen `fixtures/*.rosz` **keine** Waffe als Unit; IR validiert ohne Fehler.
- Simulation 10k Runs < 2s (lokal, Mittelklasse-Rechner) für Standard-Infantry vs Infantry.
- Charts zeigen konsistente Verteilungen (Snapshot-Vergleich mit Seed).
- Mindestens 20 Standard-Keywords + 10 Custom-Keywords abgedeckt & getestet.
- Vergleichsansicht: Zwei Builds, Delta-Kennzahlen, CSV-Export.

---

## 11) Erste Tasks (soll Copilot in `docs/TODO.md` anlegen)

- [ ] Projektgerüst mit PNPM Workspaces, TS-Config-Basen, ESLint/Prettier, Vitest.
- [ ] IR-Schema (Zod) + Typen + Doku.
- [ ] Battlescribe-Reader (.ros/.rosz), XML → IR Mapper, 3 Fixtures + Snapshots.
- [ ] Keyword-Definitionen (Standard) + Custom-Mapping + Tests.
- [ ] Core Dice Engine (RNG, To-Hit, To-Wound, Saves, Damage, Timing) + Tests.
- [ ] Monte-Carlo-Loop + Aggregation.
- [ ] Web Worker-Bridge + Abbruch/Progress.
- [ ] UI: Upload → Parser-Report → Szenario → Run → Charts/Tables → Export.
- [ ] Benchmarks + Doku + CI.

---

## 12) Hinweise für Copilot (Interaktionsstil)

- Antworte **mit Code & Dateien**, keine langen Prosa-Blöcke.
- **Erst `docs/TODO.md` erzeugen und committen.**
- Danach **jeden TODO-Punkt** einzeln umsetzen (Code + Tests + kurze Doku).
- Wo unklar: **Annäherung in `docs/assumptions.md` dokumentieren** und weiterarbeiten.
- Immer **laufende Artefakte speichern** (Schemas, Fixtures, Charts).

---
