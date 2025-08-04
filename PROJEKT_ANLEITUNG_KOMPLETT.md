# Warhammer 40k Battle Simulator - Komplette Projektanleitung für Auszubildende

## 📚 Projektübersicht

Du wirst einen **Warhammer 40k Battle Simulator** entwickeln - eine Webanwendung, die Kampfszenarien des Tabletop-Spiels Warhammer 40000 (10. Edition) simuliert. Das Projekt kombiniert Spielmechaniken, Mathematik und moderne Webentwicklung.

## 🎯 Was das Projekt macht

Der Simulator berechnet die Wahrscheinlichkeiten und Ergebnisse von Kämpfen zwischen verschiedenen Einheiten. Spieler können:
- Angreifer und Verteidiger konfigurieren
- Waffen mit verschiedenen Eigenschaften auswählen
- Schlüsselwörter (Keywords) anwenden, die Kampfregeln modifizieren
- Statistische Auswertungen erhalten

## 🔧 Technologie-Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (ES6+)
- **Backend**: Keine - reine Client-Side Anwendung
- **Testing**: Node.js Test Runner
- **Deployment**: GitHub Pages
- **Build Tools**: npm Scripts, ESLint

## 📁 Projektstruktur verstehen

```
projekt/
├── index.html              # Hauptseite
├── dice40k.html            # Simulator-Interface
├── package.json            # Node.js Konfiguration
├── .eslintrc.json          # Code-Quality Regeln
├── src/
│   ├── css/
│   │   └── style.css       # Styling
│   ├── scripts/
│   │   ├── dice.js         # Würfel-System
│   │   ├── units.js        # Einheiten & Waffen
│   │   ├── w40k.js         # Kampf-Berechnungen
│   │   ├── jsonparser.js   # Daten-Import
│   │   └── loader.js       # HTML-Module Loader
│   ├── sites/
│   │   └── imports/        # Wiederverwendbare HTML-Teile
│   └── files/
│       └── warhammer/      # Beispiel-Armeen (JSON)
└── test/                   # Test-Dateien
```

## 🏗️ Schritt-für-Schritt Entwicklung

### Phase 1: Grundlagen verstehen

#### 1.1 Warhammer 40k Spielmechaniken lernen

**Kampfablauf (vereinfacht):**
1. **Hit Phase**: Würfeln, ob Angriffe treffen
2. **Wound Phase**: Würfeln, ob Treffer verwunden
3. **Save Phase**: Verteidiger würfelt Rettungswürfe
4. **Damage Phase**: Schaden wird angewendet

**Wichtige Konzepte:**
- **Dice Rolls**: D6 Würfel (1-6), verschiedene Zielwerte
- **Modifiers**: +1/-1 Modifikationen auf Würfe
- **Keywords**: Spezielle Regeln, die Kampf beeinflussen

#### 1.2 Mathematische Grundlagen

```javascript
// Wahrscheinlichkeit für erfolgreichen D6 Wurf
function hitProbability(target) {
    if (target <= 1) return 1.0;      // Automatischer Erfolg
    if (target >= 7) return 0.0;      // Unmöglich
    return (7 - target) / 6;          // z.B. 4+ = (7-4)/6 = 0.5
}

// Stärke vs Zähigkeit Matrix
function woundTarget(strength, toughness) {
    if (strength >= toughness * 2) return 2;      // 2+ to wound
    if (strength > toughness) return 3;           // 3+ to wound
    if (strength === toughness) return 4;         // 4+ to wound
    if (strength * 2 <= toughness) return 6;     // 6+ to wound
    return 5;                                     // 5+ to wound
}
```

### Phase 2: Würfel-System entwickeln

#### 2.1 Basis Dice Klasse

```javascript
// src/scripts/dice.js
export class Dice {
    constructor() {
        // Optionaler Seed für deterministische Tests
        this.seed = null;
    }

    // Einzelner D6 Wurf (1-6)
    roll(sides = 6) {
        if (this.seed !== null) {
            // Deterministischer Modus für Tests
            return this.deterministicRoll(sides);
        }
        return Math.floor(Math.random() * sides) + 1;
    }

    // Mehrere Würfel werfen
    rollMultiple(count, sides = 6) {
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(this.roll(sides));
        }
        return results;
    }

    // String-Ausdrücke parsen: "2D6", "D6+1", "D3"
    parseAndRoll(expression) {
        if (typeof expression === "number") {
            return expression;
        }

        if (typeof expression === "string") {
            // Einfache Zahlen: "3"
            if (/^\d+$/.test(expression)) {
                return parseInt(expression);
            }

            // Würfel-Ausdrücke: "2D6", "D6+1"
            const dicePattern = /^(\d*)[Dd](\d+)(?:([+-])(\d+))?$/;
            const match = expression.match(dicePattern);

            if (match) {
                const numDice = parseInt(match[1]) || 1;    // "D6" = 1D6
                const sides = parseInt(match[2]);           // "D6" = 6 Seiten
                const operator = match[3];                  // "+" oder "-"
                const modifier = parseInt(match[4]) || 0;   // Zusätzlicher Wert

                let result = 0;
                for (let i = 0; i < numDice; i++) {
                    result += this.roll(sides);
                }

                if (operator === "+") {
                    result += modifier;
                } else if (operator === "-") {
                    result -= modifier;
                }

                return Math.max(1, result); // Minimum 1 Schaden
            }
        }

        return 0; // Fallback
    }
}
```

#### 2.2 Warum diese Implementierung?

- **Flexibilität**: Unterstützt verschiedene Würfel-Typen
- **String-Parsing**: Benutzer können "2D6+1" eingeben
- **Testbarkeit**: Deterministischer Modus für Tests
- **Warhammer-Konform**: Mindestschaden von 1

### Phase 3: Einheiten-System entwickeln

#### 3.1 Weapon Klasse verstehen

```javascript
// src/scripts/units.js
export class Weapon {
    constructor(json) {
        // Basis-Eigenschaften aus JSON
        this.name = json.name;
        this.type = json.type;          // "Ranged" oder "Melee"
        this.attacks = json.attacks;    // "2" oder "D6" oder "2D6"
        this.to_hit = json.to_hit;      // 2-6 (Zielwert für Treffer)
        this.strength = json.strength;   // 1-12+ (Stärke)
        this.ap = json.ap;              // 0-6 (Armor Penetration)
        this.damage = json.damage;      // "1" oder "D3" oder "D6"
        this.Keywords = json.Keywords || []; // Spezial-Regeln

        // Verarbeitete Eigenschaften
        this.sustainedHits = false;
        this.lethalHits = false;
        this.devastatingWounds = false;

        // Keywords verarbeiten
        this.calculateKeywords();
    }

    calculateKeywords() {
        // Case-insensitive Keyword-Verarbeitung
        const normalizedKeywords = this.Keywords.map(k => k.toLowerCase());
        
        const hasKeyword = (keyword) => 
            normalizedKeywords.includes(keyword.toLowerCase());

        // Hit-Modifikatoren
        if (hasKeyword("+1 to hit")) {
            this.to_hit -= 1; // Besserer Treffer-Wert
        }
        if (hasKeyword("-1 to hit")) {
            this.to_hit += 1; // Schlechterer Treffer-Wert
        }

        // Spezial-Keywords
        if (hasKeyword("lethal hits")) {
            this.lethalHits = true;
            this.Keywords.push("lethal-hits-effect");
        }

        if (hasKeyword("devastating wounds")) {
            this.devastatingWounds = true;
            this.Keywords.push("devastating-wounds-effect");
        }

        // Anti-X Keywords verarbeiten
        this.processAntiKeywords(normalizedKeywords);
        
        // Weitere Keywords...
        this.processBlastKeyword(hasKeyword);
        this.processHazardousKeyword(hasKeyword);
    }

    processAntiKeywords(normalizedKeywords) {
        for (const keyword of normalizedKeywords) {
            // "anti-vehicle 5+" oder "anti-infantry 4"
            const antiPattern = /^anti-(\w+)\s+(\d+)(\+)?$/;
            const match = keyword.match(antiPattern);
            
            if (match) {
                const targetType = match[1];      // "vehicle", "infantry"
                const threshold = parseInt(match[2]); // 4, 5, 6
                
                // Erstelle Keywords für Kampf-Engine
                this.Keywords.push(`CritWound${threshold}`);
                this.Keywords.push(`Anti-${targetType}`);
            }
        }
    }

    processBlastKeyword(hasKeyword) {
        if (hasKeyword("blast")) {
            this.Keywords.push("blast-effect");
            // Blast gibt +1 Attacke pro 5 Modelle im Ziel
        }
    }

    // Attacken würfeln
    getAttacks() {
        const dice = new Dice();
        return dice.parseAndRoll(this.attacks);
    }

    // Schaden würfeln
    getDamage() {
        const dice = new Dice();
        return dice.parseAndRoll(this.damage);
    }
}
```

#### 3.2 Defender Klasse verstehen

```javascript
export class Defender {
    constructor(json) {
        this.Name = json.Name;
        this.type = json.type;              // "infantry", "vehicle", "monster"
        this.toughness = json.toughness;    // 3-12+ (Zähigkeit)
        this.wounds = json.wounds;          // HP pro Modell
        this.models = json.models;          // Anzahl Modelle in Einheit
        this.save = json.save;              // 2-6+ (Rettungswurf)
        this.invulnerable = json.invulnerable || 7; // Unverwundbar-Rettung
        this.Keywords = json.Keywords || [];

        // Spezial-Eigenschaften
        this.feelNoPainValue = null;

        this.calculateKeywords();
    }

    calculateKeywords() {
        const normalizedKeywords = this.Keywords.map(k => k.toLowerCase());

        // Feel No Pain verarbeiten: "feel no pain 5"
        for (const keyword of normalizedKeywords) {
            const fnpPattern = /^feel no pain (\d+)$/;
            const match = keyword.match(fnpPattern);
            
            if (match) {
                this.feelNoPainValue = parseInt(match[1]);
                break;
            }
        }

        // Cover Keyword
        if (normalizedKeywords.includes("cover")) {
            // Cover bleibt als Keyword erhalten für Save-Phase
        }
    }
}
```

### Phase 4: Kampf-Engine entwickeln

#### 4.1 Calculator Klasse - Herzstück des Systems

```javascript
// src/scripts/w40k.js
export class Calculator {
    constructor(attackers, defenders) {
        this.attackers = attackers;
        this.defenders = defenders;
    }

    // Hauptmethode: Komplette Kampf-Simulation
    calculate(attackerIndex, defenderIndex, weaponIndex) {
        const attacker = this.getAttacker(attackerIndex);
        const defender = this.getDefender(defenderIndex);
        const weapon = attacker.getWeapon(weaponIndex);

        // Kampf-Phasen durchlaufen
        const hitResult = this.hits(weapon, defender);
        const woundResult = this.wounds(weapon, defender, hitResult.hits);
        const saveResult = this.saves(weapon, defender, woundResult.wounds);
        const fnpResult = this.feelNoPain(defender, saveResult.failedSaves);
        const damageResult = this.damage(weapon, fnpResult.remainingDamage);

        // Gesamtergebnis zusammenfassen
        return {
            hits: hitResult.hits,
            wounds: woundResult.wounds,
            saves: saveResult.failedSaves,
            damage: damageResult.totalDamage,
            mortalWounds: (hitResult.mortalWounds || 0) + (woundResult.mortalWounds || 0),
            modelsKilled: Math.floor(damageResult.totalDamage / defender.wounds)
        };
    }

    // Phase 1: Hit-Würfe
    hits(weapon, defender) {
        let attacksToUse = weapon.getAttacks();
        let toHit = weapon.to_hit;
        let hits = 0;
        let mortalWounds = 0;

        // Blast-Keyword: +1 Attacke pro 5 Modelle
        if (weapon.Keywords.includes("blast-effect")) {
            const bonusAttacks = Math.floor(defender.models / 5);
            attacksToUse += bonusAttacks;
        }

        // Indirect Fire: -1 to hit, maximal 4+
        if (weapon.Keywords.includes("indirect-fire-effect")) {
            toHit += 1;
            toHit = Math.max(toHit, 4);
        }

        // Hit-Modifikatoren von Verteidiger
        if (defender.Keywords.includes("-1 to hit")) {
            toHit += 1;
        }

        // Würfe ausführen
        const rolls = this.rollDice(attacksToUse, toHit, "", false);

        for (const roll of rolls) {
            if (roll >= toHit) {
                hits++;

                // Lethal Hits: 6er sind automatische Verwundungen
                if (weapon.lethalHits && roll === 6) {
                    // Wird in Wound-Phase behandelt
                }
            }

            // Hazardous: 1er verursachen Mortal Wounds
            if (weapon.Keywords.includes("hazardous-effect") && roll === 1) {
                mortalWounds++;
            }
        }

        return { hits, mortalWounds };
    }

    // Phase 2: Wound-Würfe
    wounds(weapon, defender, hitCount) {
        let wounds = 0;
        let mortalWounds = 0;
        
        const toWound = this.calculateWoundTarget(weapon.strength, defender.toughness);

        // Wound-Modifikatoren anwenden
        let modifiedToWound = toWound;
        if (weapon.Keywords.includes("WoundBonus+1")) {
            modifiedToWound -= 1;
        }
        if (weapon.Keywords.includes("WoundPenalty-1")) {
            modifiedToWound += 1;
        }

        const rolls = this.rollDice(hitCount, modifiedToWound, "", false);

        for (const roll of rolls) {
            let isWound = roll >= modifiedToWound;

            // Anti-X Critical Wounds prüfen
            if (this.isAntiTarget(weapon, defender)) {
                const critThreshold = this.getAntiCritThreshold(weapon);
                if (roll >= critThreshold) {
                    isWound = true; // Critical Wound
                }
            }

            if (isWound) {
                wounds++;

                // Devastating Wounds: 6er werden zu Mortal Wounds
                if (weapon.devastatingWounds && roll === 6) {
                    mortalWounds++;
                    wounds--; // Nicht durch normale Save-Phase
                }
            }
        }

        return { wounds, mortalWounds };
    }

    // Phase 3: Save-Würfe
    saves(weapon, defender, woundCount) {
        let failedSaves = 0;
        let save = defender.save;

        // AP anwenden
        save += weapon.ap;

        // Cover: +1 Save (außer bei "Ignores Cover")
        if (defender.Keywords.includes("cover") && 
            !weapon.Keywords.includes("ignores-cover-effect")) {
            save -= 1; // Besserer Save
        }

        // Invulnerable Save verwenden wenn besser
        if (save > defender.invulnerable) {
            save = defender.invulnerable;
        }

        const rolls = this.rollDice(woundCount, save, "", false);

        for (const roll of rolls) {
            if (roll < save) {
                failedSaves++;
            }
        }

        return { failedSaves };
    }

    // Phase 4: Feel No Pain
    feelNoPain(defender, failedSaves) {
        if (!defender.feelNoPainValue || failedSaves === 0) {
            return {
                survivedDamage: 0,
                remainingDamage: failedSaves
            };
        }

        let survivedDamage = 0;
        const rolls = this.rollDice(failedSaves, defender.feelNoPainValue, "", false);

        for (const roll of rolls) {
            if (roll >= defender.feelNoPainValue) {
                survivedDamage++;
            }
        }

        return {
            survivedDamage,
            remainingDamage: failedSaves - survivedDamage
        };
    }

    // Phase 5: Schaden anwenden
    damage(weapon, failedSaves) {
        let totalDamage = 0;

        for (let i = 0; i < failedSaves; i++) {
            let damagePerHit = weapon.getDamage();

            // Schaden-Modifikatoren anwenden
            damagePerHit = this.applyDamageModifiers(weapon, damagePerHit);

            totalDamage += damagePerHit;
        }

        return { totalDamage };
    }

    // Hilfsmethoden
    calculateWoundTarget(strength, toughness) {
        if (strength >= toughness * 2) return 2;
        if (strength > toughness) return 3;
        if (strength === toughness) return 4;
        if (strength * 2 <= toughness) return 6;
        return 5;
    }

    rollDice(count, target, rerollType = "", debug = false) {
        const dice = new Dice();
        return dice.rollMultiple(count, 6);
    }

    // Anti-X Hilfsmethoden
    isAntiTarget(weapon, defender) {
        return weapon.Keywords.some(k => 
            k.toLowerCase() === `anti-${defender.type.toLowerCase()}`
        );
    }

    getAntiCritThreshold(weapon) {
        for (const keyword of weapon.Keywords) {
            if (keyword.startsWith("CritWound")) {
                return parseInt(keyword.replace("CritWound", ""));
            }
        }
        return 7; // Kein Critical
    }
}
```

### Phase 5: Frontend entwickeln

#### 5.1 HTML-Struktur

```html
<!-- dice40k.html -->
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warhammer 40k Battle Simulator</title>
    <link rel="stylesheet" href="src/css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Warhammer 40k Battle Simulator</h1>
        </header>

        <main>
            <!-- Attacker Configuration -->
            <section class="config-section">
                <h2>Angreifer konfigurieren</h2>
                <div class="weapon-config">
                    <label>Waffe:</label>
                    <input type="text" id="weapon-name" placeholder="Bolter">
                    
                    <label>Attacken:</label>
                    <input type="text" id="weapon-attacks" placeholder="2">
                    
                    <label>Trefferchance:</label>
                    <select id="weapon-hit">
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4" selected>4+</option>
                        <option value="5">5+</option>
                        <option value="6">6+</option>
                    </select>
                    
                    <label>Stärke:</label>
                    <input type="number" id="weapon-strength" value="4" min="1" max="20">
                    
                    <label>AP:</label>
                    <input type="number" id="weapon-ap" value="0" min="0" max="6">
                    
                    <label>Schaden:</label>
                    <input type="text" id="weapon-damage" placeholder="1">
                    
                    <label>Keywords:</label>
                    <input type="text" id="weapon-keywords" 
                           placeholder="rapid fire 2, anti-vehicle 4+">
                </div>
            </section>

            <!-- Defender Configuration -->
            <section class="config-section">
                <h2>Verteidiger konfigurieren</h2>
                <div class="defender-config">
                    <label>Einheit:</label>
                    <input type="text" id="defender-name" placeholder="Space Marines">
                    
                    <label>Zähigkeit:</label>
                    <input type="number" id="defender-toughness" value="4" min="1" max="20">
                    
                    <label>Rettungswurf:</label>
                    <select id="defender-save">
                        <option value="2">2+</option>
                        <option value="3" selected>3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                        <option value="6">6+</option>
                    </select>
                    
                    <label>Lebenspunkte:</label>
                    <input type="number" id="defender-wounds" value="2" min="1" max="50">
                    
                    <label>Modelle:</label>
                    <input type="number" id="defender-models" value="5" min="1" max="100">
                    
                    <label>Keywords:</label>
                    <input type="text" id="defender-keywords" 
                           placeholder="cover, feel no pain 6">
                </div>
            </section>

            <!-- Calculate Button -->
            <section class="action-section">
                <button id="calculate-btn" class="primary-btn">
                    Kampf simulieren
                </button>
            </section>

            <!-- Results Display -->
            <section class="results-section" id="results">
                <!-- Wird von JavaScript gefüllt -->
            </section>

            <!-- Keyword Reference -->
            <section class="reference-section">
                <h2>Keyword-Referenz</h2>
                <div class="keyword-grid">
                    <div class="keyword-item">
                        <h3>Anti-X</h3>
                        <p>Critical Wounds gegen bestimmte Einheiten</p>
                        <code>anti-vehicle 5+</code>
                    </div>
                    <div class="keyword-item">
                        <h3>Blast</h3>
                        <p>+1 Attacke pro 5 Modelle im Ziel</p>
                        <code>blast</code>
                    </div>
                    <!-- Weitere Keywords... -->
                </div>
            </section>
        </main>
    </div>

    <script type="module" src="src/scripts/main.js"></script>
</body>
</html>
```

#### 5.2 JavaScript Frontend-Logic

```javascript
// src/scripts/main.js
import { Calculator } from './w40k.js';
import { Attacker, Defender } from './units.js';

class BattleSimulatorUI {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const calculateBtn = document.getElementById('calculate-btn');
        calculateBtn.addEventListener('click', () => this.runSimulation());

        // Beispiel-Daten laden
        this.loadExampleData();
    }

    runSimulation() {
        // Eingaben sammeln
        const weaponData = this.getWeaponData();
        const defenderData = this.getDefenderData();

        // Objekte erstellen
        const attacker = new Attacker({
            Name: "Custom Attacker",
            Weapons: [weaponData]
        });
        const defender = new Defender(defenderData);

        // Simulation ausführen
        const calculator = new Calculator([attacker], [defender]);
        const result = calculator.calculate(0, 0, 0);

        // Ergebnisse anzeigen
        this.displayResults(result, weaponData, defenderData);
    }

    getWeaponData() {
        return {
            name: document.getElementById('weapon-name').value || 'Custom Weapon',
            type: 'Ranged',
            attacks: document.getElementById('weapon-attacks').value || '1',
            to_hit: parseInt(document.getElementById('weapon-hit').value),
            strength: parseInt(document.getElementById('weapon-strength').value),
            ap: parseInt(document.getElementById('weapon-ap').value),
            damage: document.getElementById('weapon-damage').value || '1',
            Keywords: this.parseKeywords(document.getElementById('weapon-keywords').value)
        };
    }

    getDefenderData() {
        return {
            Name: document.getElementById('defender-name').value || 'Custom Defender',
            type: 'infantry', // Könnte erweitert werden
            toughness: parseInt(document.getElementById('defender-toughness').value),
            wounds: parseInt(document.getElementById('defender-wounds').value),
            models: parseInt(document.getElementById('defender-models').value),
            save: parseInt(document.getElementById('defender-save').value),
            invulnerable: 7, // Standard
            Keywords: this.parseKeywords(document.getElementById('defender-keywords').value)
        };
    }

    parseKeywords(keywordString) {
        if (!keywordString) return [];
        return keywordString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    displayResults(result, weaponData, defenderData) {
        const resultsDiv = document.getElementById('results');
        
        resultsDiv.innerHTML = `
            <h2>Simulationsergebnisse</h2>
            <div class="result-grid">
                <div class="result-card">
                    <h3>Treffer</h3>
                    <div class="result-value">${result.hits}</div>
                </div>
                <div class="result-card">
                    <h3>Verwundungen</h3>
                    <div class="result-value">${result.wounds}</div>
                </div>
                <div class="result-card">
                    <h3>Fehlgeschlagene Saves</h3>
                    <div class="result-value">${result.saves}</div>
                </div>
                <div class="result-card">
                    <h3>Gesamtschaden</h3>
                    <div class="result-value">${result.damage}</div>
                </div>
                <div class="result-card">
                    <h3>Getötete Modelle</h3>
                    <div class="result-value">${result.modelsKilled}</div>
                </div>
                ${result.mortalWounds > 0 ? `
                <div class="result-card mortal-wounds">
                    <h3>Mortal Wounds</h3>
                    <div class="result-value">${result.mortalWounds}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="simulation-details">
                <h3>Simulationsdetails</h3>
                <p><strong>Waffe:</strong> ${weaponData.name} 
                   (${weaponData.attacks} Attacken, ${weaponData.to_hit}+, 
                   S${weaponData.strength}, AP${weaponData.ap}, ${weaponData.damage} Schaden)</p>
                <p><strong>Ziel:</strong> ${defenderData.Name} 
                   (T${defenderData.toughness}, ${defenderData.save}+, 
                   ${defenderData.wounds}W, ${defenderData.models} Modelle)</p>
                ${weaponData.Keywords.length > 0 ? 
                  `<p><strong>Waffen-Keywords:</strong> ${weaponData.Keywords.join(', ')}</p>` : ''}
                ${defenderData.Keywords.length > 0 ? 
                  `<p><strong>Verteidiger-Keywords:</strong> ${defenderData.Keywords.join(', ')}</p>` : ''}
            </div>
        `;
    }

    loadExampleData() {
        // Beispiel-Werte für einfaches Testen
        document.getElementById('weapon-name').value = 'Bolter';
        document.getElementById('weapon-attacks').value = '2';
        document.getElementById('weapon-hit').value = '3';
        document.getElementById('weapon-strength').value = '4';
        document.getElementById('weapon-ap').value = '0';
        document.getElementById('weapon-damage').value = '1';
        document.getElementById('weapon-keywords').value = 'rapid fire 2';
        
        document.getElementById('defender-name').value = 'Ork Boyz';
        document.getElementById('defender-toughness').value = '5';
        document.getElementById('defender-save').value = '6';
        document.getElementById('defender-wounds').value = '1';
        document.getElementById('defender-models').value = '10';
    }
}

// App initialisieren
document.addEventListener('DOMContentLoaded', () => {
    new BattleSimulatorUI();
});
```

### Phase 6: Testing verstehen

#### 6.1 Warum Tests wichtig sind

```javascript
// Beispiel: Unit Test für Dice Klasse
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Dice } from "../../src/scripts/dice.js";

test("Dice Class", (t) => {
    t.test("should parse simple dice expressions", () => {
        const dice = new Dice();
        
        // Test verschiedene Eingaben
        assert.equal(dice.parseAndRoll("1"), 1);
        assert.equal(dice.parseAndRoll("5"), 5);
        assert.equal(dice.parseAndRoll(3), 3);
    });

    t.test("should handle D6 expressions", () => {
        const dice = new Dice();
        
        // Deterministischen Modus für Tests verwenden
        dice.seed = 42; // Feste Ergebnisse
        
        const result = dice.parseAndRoll("D6");
        assert.ok(result >= 1 && result <= 6);
    });
});
```

#### 6.2 Integration Tests

```javascript
// Beispiel: End-to-End Test
test("Complete Battle Simulation", () => {
    const attacker = new Attacker({
        Name: "Test Attacker",
        Weapons: [{
            name: "Test Weapon",
            attacks: "2",
            to_hit: 4,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: []
        }]
    });

    const defender = new Defender({
        Name: "Test Defender",
        type: "infantry",
        toughness: 4,
        wounds: 1,
        models: 5,
        save: 4,
        Keywords: []
    });

    const calculator = new Calculator([attacker], [defender]);
    const result = calculator.calculate(0, 0, 0);

    // Prüfe dass Ergebnis sinnvoll ist
    assert.ok(result.hits >= 0);
    assert.ok(result.damage >= 0);
    assert.ok(result.modelsKilled <= defender.models);
});
```

## 📋 Entwicklungsschritte für den Auszubildenden

### Woche 1-2: Grundlagen
1. **Warhammer 40k Regeln** studieren (nur Kampf-Phase)
2. **Projektstruktur** verstehen
3. **Git Repository** aufsetzen
4. **Node.js und npm** installieren

### Woche 3-4: Würfel-System
1. `Dice` Klasse implementieren
2. String-Parsing für Würfel-Ausdrücke
3. Tests für Dice-Funktionalität schreiben
4. Deterministische Tests implementieren

### Woche 5-6: Einheiten-System
1. `Weapon` Klasse mit Basis-Eigenschaften
2. `Defender` Klasse implementieren
3. Keyword-Parsing (erstmal nur einfache)
4. JSON-Import Funktionalität

### Woche 7-8: Kampf-Engine
1. `Calculator` Klasse - Hit Phase
2. Wound Phase implementieren
3. Save Phase hinzufügen
4. Damage Phase vervollständigen

### Woche 9-10: Keywords
1. Lethal Hits, Devastating Wounds
2. Anti-X Keywords
3. Blast, Hazardous
4. Cover, Ignores Cover, Indirect Fire

### Woche 11-12: Frontend
1. HTML Interface erstellen
2. CSS Styling
3. JavaScript Event-Handling
4. Ergebnisse anzeigen

### Woche 13-14: Polish
1. Fehlerbehandlung
2. Benutzerfreundlichkeit
3. Performance Optimierung
4. Dokumentation

## 🎓 Lernziele

Nach diesem Projekt sollte der Auszubildende können:

**JavaScript:**
- ES6+ Features (Klassen, Module, Arrow Functions)
- String-Parsing mit Regex
- Array-Manipulation und Iteration
- Error Handling

**Softwareentwicklung:**
- Objektorientierte Programmierung
- Modulare Architektur
- Test-Driven Development
- Code-Organisation

**Web-Entwicklung:**
- HTML5, CSS3, DOM-Manipulation
- Event-Handling
- Responsive Design
- Browser DevTools

**Tools:**
- Git Versionskontrolle
- npm Package Management
- ESLint Code Quality
- Node.js Testing

## 🔧 Hilfreiche Ressourcen

- **Warhammer 40k Regeln**: [Wahapedia.ru](https://wahapedia.ru/)
- **JavaScript Referenz**: [MDN Web Docs](https://developer.mozilla.org/)
- **Testing**: [Node.js Test Runner](https://nodejs.org/api/test.html)
- **Git**: [Git Handbook](https://guides.github.com/introduction/git-handbook/)

## 💡 Tipps für den Erfolg

1. **Klein anfangen**: Erstmal nur eine Waffe vs einen Verteidiger
2. **Viel testen**: Jeden Code-Teil einzeln testen
3. **Debugging**: console.log ist dein Freund
4. **Code-Review**: Regelmäßig Code durchgehen
5. **Dokumentation**: Kommentare schreiben für komplexe Logik

Viel Erfolg bei der Entwicklung! 🚀
