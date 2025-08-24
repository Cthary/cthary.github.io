# TODO-Liste: Online-Simulator für Warhammer 40k (10th Edition)

> **Hinweis:** Diese Liste ist feingranular, Tasks sind auf 1–2 Std. geschätzt und enthalten Akzeptanzkriterien. Vor jedem Commit/PR wird sie aktualisiert.

---

## 1. Projektgerüst & Infrastruktur

- [x] **PNPM Workspaces einrichten**
  - Akzeptanz: `pnpm install` funktioniert, Workspaces-Struktur vorhanden.
- [x] **TypeScript-Config-Basen anlegen** (`tsconfig.base.json`, pro Package erweiterbar)
  - Akzeptanz: Alle Packages bauen mit `tsc` ohne Fehler.
- [x] **ESLint & Prettier konfigurieren** (strict, für TS/JS/React)
  - Akzeptanz: `pnpm lint` & `pnpm format` laufen fehlerfrei.
- [x] **Vitest für Unit-Tests einrichten** (Basis-Konfig, Beispieltest)
  - Akzeptanz: `pnpm test` läuft, Beispieltest grün.

## 2. Parser & Intermediate Representation (IR)

- [x] **IR-Schema (Zod) + Typen + Doku**
  - Akzeptanz: Zod-Schema in `packages/parser/ir.ts`, Doku in `docs/ir.md`, Typen generiert.
- [x] **Battlescribe-Reader (.ros/.rosz), XML → IR Mapper** (Basisstruktur, Mapping in Arbeit)
  - Akzeptanz: Funktioniert für Beispiel-Listen, Snapshots in `fixtures/`.
- [x] **3 Fixtures + Snapshots** (3/3)
  - Akzeptanz: Mind. 3 reale `.ros/.rosz` in `fixtures/`, Snapshot-Tests grün.

## 3. Keywords & Mapping

- [x] **Keyword-Definitionen (Standard) in `core/rules/keywords.ts`**
  - Akzeptanz: Mind. 20 Standard-Keywords abgedeckt, Tests vorhanden.
- [x] **Custom-Keyword-Mapping + Tests**
  - Akzeptanz: Mapping-Tabelle in `core/rules/customKeywords.ts`, mind. 10 Custom-Keywords, Tests grün.

## 4. Simulation Core

- [x] **Core Dice Engine (RNG, To-Hit, To-Wound, Saves, Damage, Timing) + Tests**
  - Akzeptanz: Engine in `core/`, alle Kernfunktionen mit Unit-Tests.
 - [x] **Monte-Carlo-Loop + Aggregation**
   - Akzeptanz: 10k Runs < 2s (lokal), Output wie spezifiziert.
 - [x] **Web Worker-Bridge + Abbruch/Progress**
  - Akzeptanz: Simulation läuft im Worker, Progress/Abbruch steuerbar.


## 2a. Parser für Browser

- [x] **Browserfähiger Battlescribe-Parser (.ros/.rosz, IR-Mapping)**
  - Akzeptanz: Kann im UI verwendet werden, nutzt JSZip & fast-xml-parser, gibt IR zurück.

## 5. UI & Visualisierung

- [x] **UI: Upload → Parser-Report → Szenario → Run → Charts/Tables → Export**
  - Akzeptanz: Flow im Frontend klickbar, Charts (Recharts), CSV/JSON-Export.

## 6. Qualität & CI

- [x] **Benchmarks + Doku**
  - Akzeptanz: Benchmarks in `docs/benchmarks.md`, reproduzierbar.
- [x] **CI: Lint/Typecheck/Test auf jedem PR**
  - Akzeptanz: GitHub Actions laufen, PRs werden geprüft.

---

**Letzte Aktualisierung:** 24.08.2025
