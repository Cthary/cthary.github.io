# Feel No Pain Keyword Implementation

## Übersicht

Das "feel no pain X" Keyword wurde erfolgreich in die Warhammer 40k 10th Edition Kampfsimulation implementiert. Es funktioniert als Defensiv-Mechanik, die es Einheiten ermöglicht, Schaden zu ignorieren.

## Funktionsweise

### Mechanik
1. **Timing**: Feel No Pain wirkt nach fehlgeschlagenen Saves, aber vor der finalen Schadensanwendung
2. **Roll**: Für jeden fehlgeschlagenen Save wird ein W6 gewürfelt
3. **Erfolg**: Bei Würfelergebnis >= X wird der Schaden ignoriert
4. **Beispiel**: "feel no pain 6" bedeutet, dass bei einer 6 der Schaden ignoriert wird

### Reihenfolge der Schadensphasen
1. Hit Phase
2. Wound Phase  
3. Save Phase (normale Saves + Invulnerable Saves)
4. **Feel No Pain Phase** (neu implementiert)
5. Damage Phase (mit Schadensmodifikatoren)

## Code-Implementierung

### Keyword-Parsing (units.js)
```javascript
// In Defender.processDefenderKeywords()
this.feelNoPainValue = null;
for (const keyword of this.Keywords) {
    const fnpMatch = keyword.match(/^feel no pain (\d+)$/);
    if (fnpMatch) {
        this.feelNoPainValue = parseInt(fnpMatch[1]);
        break;
    }
}
```

### Feel No Pain Calculation (w40k.js)
```javascript
feelNoPain(defender, failedSaves) {
    let survivedDamage = 0;
    const result = {
        "survivedDamage": 0,
        "remainingDamage": failedSaves
    };

    if (defender.feelNoPainValue) {
        const fnpTarget = defender.feelNoPainValue;
        const rolls = this.rollDice(failedSaves, fnpTarget, "", false);

        for (const roll of rolls) {
            if (roll >= fnpTarget) {
                survivedDamage++;
            }
        }

        result.survivedDamage = survivedDamage;
        result.remainingDamage = failedSaves - survivedDamage;
    }

    return result;
}
```

### Integration in Simulation
```javascript
// In simulateOne()
const saveResult = calculator.saves(weapon, defender, totalWounds);
const failedSaves = saveResult.failedSaves;

// Feel No Pain Phase (neu)
const fnpResult = calculator.feelNoPain(defender, failedSaves);
const finalFailedSaves = fnpResult.remainingDamage;

// Damage Phase mit finalFailedSaves statt failedSaves
const totalDamageInstances = finalFailedSaves + mortalWounds;
```

## Keyword-Syntax

### Unterstützte Formate
- `"feel no pain 6"` - Ignoriert Schaden bei 6+
- `"feel no pain 5"` - Ignoriert Schaden bei 5+
- `"feel no pain 4"` - Ignoriert Schaden bei 4+
- etc.

### JSON-Beispiel
```json
{
  "Name": "Canis Rex",
  "type": "Vehicle",
  "models": 1,
  "toughness": 11,
  "wounds": 26,
  "save": 3,
  "invulnerable": 7,
  "Keywords": ["feel no pain 6"]
}
```

## UI-Integration

### Keyword-Referenz
Das Keyword wurde zur Keyword-Referenz in `dice40k.html` hinzugefügt:
```javascript
'feel no pain X': 'Ignoriert Schaden bei X+ auf 1W6 (z.B. "feel no pain 6")'
```

## Tests

### Unit Tests (feel-no-pain.test.js)
- ✅ Keyword-Parsing für verschiedene Werte (4, 5, 6)
- ✅ Feel No Pain Rolls mit verschiedenen Erfolgsraten
- ✅ Edge Cases (kein FNP, 0 Schaden, große Schadenszahlen)

### Integration Tests (feel-no-pain-integration.test.js)
- ✅ Vollständige Simulation mit Feel No Pain
- ✅ Interaction mit anderen Keywords (Schadensmodifikatoren)
- ✅ Mortal Wounds Handling
- ✅ Zero-Damage Scenarios

### Test-Ergebnisse
```
ℹ tests 112
ℹ suites 25
ℹ pass 112
ℹ fail 0
```

## Kompatibilität

### Mit anderen Keywords
Feel No Pain funktioniert korrekt mit:
- ✅ Schadensmodifikatoren (`+1D`, `-1D`, `/2D`)
- ✅ Devastating Wounds (Mortal Wounds)
- ✅ Allen anderen bestehenden Keywords

### Korrekte Reihenfolge
1. Normale Saves/Invulnerable Saves
2. **Feel No Pain** (wirkt auf fehlgeschlagene Saves)
3. Schadensmodifikatoren (`/2D` → `+1D` → `-1D`)

## Verwendung

### Für Angreifer
Feel No Pain ist ein Defensiv-Keyword und kann nur bei Defendern verwendet werden.

### Für Defender
Einfach das Keyword `"feel no pain X"` zum Keywords-Array hinzufügen, wobei X der benötigte Würfelwert ist.

### Beispiel-Simulation
```javascript
// Death Company Chainsword vs Canis Rex (feel no pain 6)
// Ergebnis: Durchschnittlicher Schaden wird reduziert durch FNP-Saves
```

## Status
✅ **Vollständig implementiert und getestet**
- Code-Integration abgeschlossen
- UI-Integration abgeschlossen  
- Umfassende Tests bestanden
- Dokumentation erstellt
- Kompatibilität mit bestehenden Features bestätigt
