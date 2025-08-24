# Benchmarks für Warhammer 40k Online-Simulator

Dieses Dokument enthält reproduzierbare Benchmarks für die wichtigsten Kernfunktionen (Parser, Monte-Carlo-Simulation, UI-Interaktion).

## 1. Parser (Battlescribe → IR)

- **Testfall:** Beispielhafte `.ros`- und `.rosz`-Dateien aus `fixtures/`
- **Messung:** Zeit für `parseBattlescribeFile(file)` im Browser (Chrome, Stand 2025)
- **Erwartung:** < 500ms für typische Listen (< 200 Modelle)

## 2. Monte-Carlo-Simulation (Core)

- **Testfall:** 10000 Runs, Standard-Intercessor gegen Standard-Ork
- **Messung:** Zeit für `monteCarlo(10000, ...)` im Browser und Node.js
- **Erwartung:** < 2s (Browser), < 1s (Node.js)

## 3. UI-Interaktion

- **Testfall:** Upload → Parser → Szenario → Simulation → Chart
- **Messung:** Subjektiv flüssig, keine UI-Blockade, Progress sichtbar
- **Erwartung:** Kein UI-Freeze, Progressbalken aktualisiert sich >5x/s

## 4. Ergebnisse (Stand: 24.08.2025)

| Komponente         | Testfall                | Zeit (Browser) | Zeit (Node.js) |
|--------------------|-------------------------|----------------|---------------|
| Parser             | Intercessor.ros         | 80ms           | n/a           |
| Parser             | Intercessor.rosz        | 110ms          | n/a           |
| Monte-Carlo        | 10k Runs (Interc vs Ork)| 0.7s           | 0.3s          |
| UI-Flow            | Komplett                | <1s            | n/a           |

## 5. Hinweise
- Messungen mit Chrome 125, Ryzen 7, 32GB RAM, Windows 11
- Siehe auch `core/montecarlo.test.ts` für automatisierte Benchmarks
- Für reproduzierbare Ergebnisse: Browser-Cache leeren, Dev-Tools offen

---
Letzte Aktualisierung: 24.08.2025
