# Warhammer 40k Battle Simulator - Projektanleitung für Auszubildende

## 📚 Projektübersicht

Du entwickelst einen **Warhammer 40k Battle Simulator** - eine Webanwendung, die Kampfszenarien des Tabletop-Spiels Warhammer 40000 (10. Edition) simuliert. Das Projekt kombiniert Spiellogik, Mathematik und moderne Webentwicklung.

## 🎯 Was das Projekt macht

Der Simulator berechnet Kampfergebnisse zwischen verschiedenen Einheiten. Benutzer können:
- Angreifer und Verteidiger konfigurieren
- Waffen mit verschiedenen Eigenschaften definieren
- Spezielle Kampfregeln (Keywords) anwenden
- Statistische Auswertungen erhalten
- Verschiedene Kampfszenarien durchspielen

## 🔧 Technologien die du lernen wirst

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Keine - reine Browser-Anwendung
- **Testing**: Node.js Test Framework
- **Tools**: Git, npm, ESLint
- **Deployment**: GitHub Pages

## 📁 Projektstruktur verstehen

Das Projekt ist modular aufgebaut:
- **HTML-Dateien**: Benutzeroberfläche
- **CSS**: Styling und Layout
- **JavaScript-Module**: Spiellogik aufgeteilt in einzelne Bereiche
- **JSON-Dateien**: Beispieldaten für Armeen
- **Tests**: Automatische Qualitätssicherung

## 🎲 Warhammer 40k Spielmechaniken verstehen

### Grundlagen des Kampfsystems
Warhammer 40k verwendet ein würfelbasiertes System mit 6-seitigen Würfeln (D6). Jeder Kampf läuft in festen Phasen ab:

### Kampfphasen
1. **Hit Phase**: Würfeln ob Angriffe das Ziel treffen
2. **Wound Phase**: Würfeln ob Treffer Schaden verursachen
3. **Save Phase**: Verteidiger würfelt Rettungswürfe
4. **Damage Phase**: Endgültiger Schaden wird berechnet

### Wichtige Konzepte
- **Zielwerte**: Du musst X oder höher würfeln (z.B. 4+ bedeutet 4,5,6 ist Erfolg)
- **Modifikatoren**: +1/-1 Änderungen an Würfen
- **Keywords**: Spezielle Regeln die das Kampfverhalten ändern
- **Wahrscheinlichkeiten**: Mathematische Berechnung von Erfolgsraten

## 🏗️ Entwicklungsphasen

### Phase 1: Würfel-System entwickeln (Wochen 1-2)

**Was du lernst:**
- Zufallszahlen generieren
- String-Parsing (z.B. "2D6+1" interpretieren)
- Mathematische Berechnungen
- Test-getriebene Entwicklung

**Aufgaben:**
- Einfache Würfel-Klasse erstellen
- Verschiedene Würfel-Ausdrücke unterstützen
- Deterministische Tests für Zufallszahlen
- Edge Cases behandeln

### Phase 2: Einheiten-System aufbauen (Wochen 3-4)

**Was du lernst:**
- Objektorientierte Programmierung
- JSON-Datenverarbeitung
- Datenvalidierung
- Klassen-Design

**Aufgaben:**
- Waffen-Klasse mit Eigenschaften entwickeln
- Verteidiger-Klasse implementieren
- JSON-Import System erstellen
- Keyword-System grundlegend aufbauen

### Phase 3: Kampf-Engine implementieren (Wochen 5-7)

**Was du lernst:**
- Komplexe Algorithmen entwickeln
- Zustandsmanagement
- Mathematische Modellierung
- Performance-Optimierung

**Aufgaben:**
- Jede Kampfphase einzeln programmieren
- Modifikatoren und Boni berechnen
- Wahrscheinlichkeitsberechnungen
- Ergebnis-Aggregation

### Phase 4: Keyword-System ausbauen (Wochen 8-10)

**Was du lernst:**
- Regular Expressions für Text-Parsing
- Flexible System-Architektur
- Case-insensitive Verarbeitung
- Regel-Engine Design

**Aufgaben:**
- Anti-X Keywords (kritische Treffer gegen bestimmte Ziele)
- Blast (mehr Attacken gegen große Einheiten)
- Hazardous (Selbstschaden bei schlechten Würfen)
- Cover und Ignores Cover (Deckungsregeln)
- Feel No Pain (zusätzliche Widerstandswürfe)

### Phase 5: Benutzeroberfläche entwickeln (Wochen 11-12)

**Was du lernst:**
- HTML5 Semantik und Struktur
- CSS Grid und Flexbox
- DOM-Manipulation
- Event-Handling
- Responsive Design

**Aufgaben:**
- Eingabeformulare für Waffen und Einheiten
- Ergebnisanzeige mit Visualisierung
- Keyword-Referenz und Hilfe
- Benutzerfreundliche Navigation

### Phase 6: Testing und Qualitätssicherung (Wochen 13-14)

**Was du lernst:**
- Unit Testing Prinzipien
- Integration Testing
- Code Coverage
- Debugging Techniken
- Performance Monitoring

**Aufgaben:**
- Umfassende Test-Suite entwickeln
- Edge Cases und Fehlerfälle testen
- Performance-Tests für große Simulationen
- Code-Review und Refactoring

## 🎓 Detaillierte Lernziele

### JavaScript Fertigkeiten
- **ES6+ Features**: Klassen, Module, Arrow Functions, Destructuring
- **Datenstrukturen**: Arrays, Objects, Maps, Sets effektiv nutzen
- **Asynchrone Programmierung**: Promises und Event-Loops verstehen
- **Fehlerbehandlung**: try-catch, defensive Programmierung
- **Regular Expressions**: Komplexe String-Verarbeitung

### Softwareentwicklung Prinzipien
- **Clean Code**: Lesbare und wartbare Code-Struktur
- **SOLID Prinzipien**: Besonders Single Responsibility
- **Design Patterns**: Factory, Strategy, Observer
- **Testing**: TDD (Test-Driven Development) Ansatz
- **Refactoring**: Code kontinuierlich verbessern

### Web-Technologien
- **HTML5**: Semantische Markup, Accessibility
- **CSS3**: Modern Layout Techniken, Responsive Design
- **Browser APIs**: LocalStorage, Event APIs
- **Performance**: Optimierung für schnelle Ladezeiten
- **Debugging**: Browser DevTools effektiv nutzen

### Tools und Workflow
- **Git**: Versionskontrolle, Branching, Merging
- **npm**: Package Management, Scripts
- **ESLint**: Code-Qualität und Konsistenz
- **GitHub**: Collaboration, Issues, Pull Requests
- **Documentation**: README, Code Comments, API Docs

## 🔍 Mathematische Konzepte

### Wahrscheinlichkeitsrechnung
- Grundlagen der Statistik verstehen
- Binomialverteilung für Würfelwürfe
- Erwartungswerte berechnen
- Monte-Carlo Simulationen

### Spielbalance
- Fairness zwischen verschiedenen Optionen
- Power Level Berechnungen
- Optimale Strategien identifizieren
- Meta-Game Analyse

## 🎯 Projektmeilensteine

### Meilenstein 1 (Woche 2): Basis-Würfelsystem
- Einfache D6 Würfe funktionieren
- String-Parsing für "2D6" Format
- Grundlegende Tests vorhanden

### Meilenstein 2 (Woche 4): Einheiten-Framework
- Waffen und Verteidiger als Klassen
- JSON-Import funktioniert
- Erste einfache Keywords

### Meilenstein 3 (Woche 7): Kampf-Engine
- Alle vier Kampfphasen implementiert
- Basis-Modifikatoren funktionieren
- Mathematisch korrekte Ergebnisse

### Meilenstein 4 (Woche 10): Vollständige Keywords
- Alle wichtigen 10th Edition Keywords
- Case-insensitive Verarbeitung
- Komplexe Regel-Interaktionen

### Meilenstein 5 (Woche 12): Funktionale UI
- Vollständig bedienbare Oberfläche
- Ergebnisse werden korrekt angezeigt
- Responsive für verschiedene Geräte

### Meilenstein 6 (Woche 14): Produktionsreife
- Umfassende Test-Abdeckung
- Performance-optimiert
- Dokumentation vollständig

## 💡 Tipps für erfolgreiche Entwicklung

### Entwicklungsstrategie
1. **Klein anfangen**: Zuerst nur eine Waffe gegen einen Verteidiger
2. **Iterativ arbeiten**: Funktionalität schrittweise ausbauen
3. **Tests zuerst**: Neue Features immer mit Tests absichern
4. **Refactoring**: Code regelmäßig überarbeiten und verbessern

### Debugging-Ansätze
1. **Console.log strategisch einsetzen**: Zwischenergebnisse ausgeben
2. **Browser DevTools nutzen**: Breakpoints und Debugging
3. **Kleine Testfälle**: Komplexe Probleme in einfache Teile zerlegen
4. **Pair Programming**: Mit anderen zusammen debuggen

### Code-Qualität
1. **Sprechende Namen**: Variablen und Funktionen klar benennen
2. **Kommentare**: Warum, nicht nur was
3. **Funktionen klein halten**: Eine Aufgabe pro Funktion
4. **DRY Prinzip**: Don't Repeat Yourself

### Lerntechniken
1. **Aktiv ausprobieren**: Nicht nur lesen, sondern programmieren
2. **Fehler als Lernchance**: Bugs sind normale Lernmomente
3. **Code Reviews**: Anderen Code zeigen und Feedback holen
4. **Dokumentation lesen**: MDN, Stack Overflow, offizielle Docs

## 🔧 Entwicklungsumgebung Setup

### Benötigte Software
- **Code Editor**: Visual Studio Code (empfohlen)
- **Browser**: Chrome oder Firefox mit DevTools
- **Node.js**: Für npm und Testing
- **Git**: Für Versionskontrolle

### Empfohlene Extensions (VS Code)
- ESLint für Code-Qualität
- Prettier für Code-Formatierung
- Live Server für lokale Entwicklung
- GitLens für erweiterte Git-Integration

## 🎨 Design-Überlegungen

### Benutzerfreundlichkeit
- Intuitive Navigation
- Klare Beschriftungen
- Hilfetexte für komplexe Features
- Responsive Design für alle Geräte

### Performance
- Schnelle Berechnungen auch bei großen Simulationen
- Effiziente DOM-Updates
- Minimale Ladezeiten
- Optimierte Algorithmen

### Erweiterbarkeit
- Modulare Architektur für neue Features
- Plugin-System für zusätzliche Keywords
- API-Design für externe Datenquellen
- Konfigurierbare Regelsets

## 🚀 Deployment und Veröffentlichung

### GitHub Pages Setup
- Repository richtig konfigurieren
- Build-Process automatisieren
- Domain und SSL verstehen
- Continuous Deployment

### Dokumentation
- README mit Setup-Anleitung
- API-Dokumentation für andere Entwickler
- Benutzerhandbuch
- Entwickler-Guidelines

## 🏆 Erfolgsmessung

Nach Abschluss solltest du können:
- Komplexe JavaScript-Anwendungen eigenständig entwickeln
- Test-getriebene Entwicklung praktizieren
- Mathematische Probleme programmatisch lösen
- Moderne Web-Technologien professionell einsetzen
- Code-Qualität beurteilen und verbessern
- Projekte von der Idee bis zum Deployment umsetzen

Das Projekt kombiniert praktische Programmierung mit theoretischem Verständnis und bereitet dich optimal auf professionelle Softwareentwicklung vor!

Viel Erfolg bei der Umsetzung! 🎯
