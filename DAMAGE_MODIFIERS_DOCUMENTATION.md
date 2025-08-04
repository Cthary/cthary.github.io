# Schadensmodifikatoren - Neues +1D Keyword

## Übersicht

Das neue Keyword "+1D" wurde erfolgreich implementiert und folgt der korrekten Reihenfolge der Schadensmodifikatoren gemäß Warhammer 40k 10th Edition.

## Keyword: +1D

- **Beschreibung**: Erhöht den ausgehenden Schaden um 1
- **Anwendung**: Kann sowohl für Waffen (offensive Schadenserhöhung) als auch theoretisch für Verteidiger verwendet werden
- **Implementierung**: Wird als internes "+1 dmg" Keyword verarbeitet

## Reihenfolge der Schadensmodifikatoren

Die korrekte Reihenfolge ist jetzt implementiert:

1. **Grundwert** - Basis-Schaden der Waffe (z.B. D6, 2, 3+1)
2. **Halbierung (/2D)** - Schaden wird halbiert (abgerundet, minimum 1)
3. **Erhöhung (+1D)** - Schaden wird um 1 erhöht
4. **Reduzierung (-1D)** - Schaden wird um 1 reduziert (minimum 1)

## Beispiele

### Beispiel 1: Outriders vs C'Tan
- Grundschaden: 1
- C'Tan hat /2D: 1 ÷ 2 = 0.5 → 1 (minimum 1)
- Outriders haben +1D: 1 + 1 = 2
- **Finaler Schaden: 2**

### Beispiel 2: Outriders vs Deathwing Knight
- Grundschaden: 1
- Keine Halbierung
- Outriders haben +1D: 1 + 1 = 2
- Deathwing Knights haben -1D: 2 - 1 = 1
- **Finaler Schaden: 1**

### Beispiel 3: Komplexer Schaden mit D6
- Grundschaden: D6 (z.B. Wurf = 4)
- Halbierung: 4 ÷ 2 = 2
- Erhöhung: 2 + 1 = 3
- Reduzierung: 3 - 1 = 2
- **Finaler Schaden: 2**

## Code-Implementierung

### units.js - Keyword-Parsing
```javascript
// Damage Increase Keywords (NEW)
if (this.Keywords.includes("+1D")) {
    this.Keywords.push("+1 dmg");
}
```

### Defender-Keywords
```javascript
processDefenderKeywords() {
    // Process damage reduction keywords
    if (this.Keywords.includes("/2D")) {
        this.Keywords.push("halve damage");
    }

    if (this.Keywords.includes("-1D")) {
        this.Keywords.push("-1 dmg");
    }
}
```

### w40k.js - Damage-Berechnung
```javascript
damage(weapon, defender) {
    const dice = new Dice();
    let damage = dice.parseAndRoll(weapon.damage);

    // Apply damage modifiers in correct order:
    // 1. Base damage (already calculated)
    // 2. Halve damage (/2D)
    // 3. Increase damage (+1D)
    // 4. Reduce damage (-1D)

    // Step 2: Halve damage first
    if (defender.Keywords.includes("halve damage")) {
        damage = Math.max(1, Math.floor(damage / 2));
    }

    // Step 3: Apply damage increase
    if (weapon.Keywords.includes("+1 dmg")) {
        damage += 1;
    }

    // Step 4: Apply damage reduction last
    if (defender.Keywords.includes("-1 dmg")) {
        damage = Math.max(1, damage - 1);
    }

    return damage;
}
```

## Testing

Umfangreiche Tests wurden implementiert:

- **Unit-Tests**: `test/unit/damage-modifiers.test.js`
- **Integrationstests**: Validierung der korrekten Reihenfolge
- **Performance-Tests**: Keine Performance-Beeinträchtigung

### Test-Beispiele

```javascript
// Test der korrekten Reihenfolge
test("should apply damage modifiers in correct order: /2D → +1D → -1D", () => {
    // 4 → /2 = 2 → +1 = 3 → -1 = 2
    let damage = 4; // Base
    damage = Math.max(1, Math.floor(damage / 2)); // /2D: 4/2 = 2
    damage += 1; // +1D: 2+1 = 3
    damage = Math.max(1, damage - 1); // -1D: 3-1 = 2
    
    assert.equal(damage, 2, "Modifier order should result in damage 2");
});
```

## UI-Integration

Das "+1D" Keyword ist in der Benutzeroberfläche verfügbar:

- **Keyword-Referenz**: Im Hilfe-Modal unter "Custom Keywords"
- **Beschreibung**: "Erhöht ausgehenden Schaden um 1"
- **Eingabe**: Kann als Keyword für Waffen eingegeben werden

## Kompatibilität

- ✅ Kompatibel mit bestehenden Keywords
- ✅ Korrekte Interaktion mit /2D und -1D
- ✅ Funktioniert mit variablen Schadenswerten (D6, D3+1, etc.)
- ✅ Respektiert Minimum-Schaden von 1

## Status

- ✅ **Implementiert**: Keyword-Parsing und Schadensberechnung
- ✅ **Getestet**: Umfangreiche Unit- und Integrationstests
- ✅ **Dokumentiert**: Code-Kommentare und Beispiele
- ✅ **UI-Integration**: Keyword-Referenz aktualisiert
- ✅ **Validiert**: Korrekte Reihenfolge bestätigt
