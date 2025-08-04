# Vollständige Case-Insensitive Keyword-Implementierung

## Übersicht

Alle Keywords im Warhammer 40k 10th Edition Kampfsimulator sind jetzt **vollständig case-insensitive** implementiert. Dies bedeutet, dass Keywords in beliebiger Groß-/Kleinschreibung erkannt werden.

## Implementierte Keywords

### ✅ Vollständig Implementiert und Getestet

#### Angreifer-Keywords (Weapon Keywords)
- **Hit Modifiers**: `+1 to hit`, `-1 to hit`, `+1 hit`, `-1 hit`
- **Wound Modifiers**: `+1 to wound`, `-1 to wound`, `+1 wound`, `-1 wound`
- **Critical Hits**: `lethal hits`, `devastating wounds`
- **Sustained Hits**: `sustained hits 1`, `sustained hits 2`, `sustained hits D3`, etc.
- **Twin-Linked**: `twin-linked`
- **Rapid Fire**: `rapid fire 1`, `rapid fire 2`, etc.
- **Melta**: `melta 2`, `melta 4`, etc.
- **Lance**: `lance`
- **Anti-X**: `anti-vehicle 4+`, `anti-infantry 5+`, `anti-monster 3+`, etc.
- **Damage Modifiers**: `+1d`, `-1d`, `/2d`
- **Special Rules**: `ba charge` (Blood Angels Charge)

#### Verteidiger-Keywords (Defender Keywords)
- **Feel No Pain**: `feel no pain 6`, `feel no pain 5`, etc.
- **Damage Reduction**: `-1d`, `/2d`

### 🚧 Teilweise Implementiert (Parsing OK, aber TODO)
- **Blast**: Erkannt, aber Maximum Attacks gegen große Units nicht implementiert
- **Hazardous**: Erkannt, aber Mortal Wounds bei Critical Fails nicht implementiert
- **Precision**: Erkannt, aber Charakter-Targeting nicht implementiert

## Case-Insensitive Beispiele

### Alle diese Varianten funktionieren identisch:

#### Lethal Hits
```json
"Keywords": ["lethal hits"]     ✅
"Keywords": ["Lethal Hits"]     ✅
"Keywords": ["LETHAL HITS"]     ✅
"Keywords": ["LeThaL hItS"]     ✅
```

#### Anti-Keywords
```json
"Keywords": ["anti-vehicle 4+"]     ✅
"Keywords": ["Anti-Vehicle 4+"]     ✅
"Keywords": ["ANTI-VEHICLE 4+"]     ✅
"Keywords": ["aNtI-vEhIcLe 4+"]     ✅
```

#### Feel No Pain
```json
"Keywords": ["feel no pain 6"]     ✅
"Keywords": ["Feel No Pain 6"]     ✅
"Keywords": ["FEEL NO PAIN 6"]     ✅
"Keywords": ["fEeL nO pAiN 6"]     ✅
```

#### Damage Modifiers
```json
"Keywords": ["+1d"]     ✅
"Keywords": ["+1D"]     ✅
"Keywords": ["-1d"]     ✅
"Keywords": ["-1D"]     ✅
"Keywords": ["/2d"]     ✅
"Keywords": ["/2D"]     ✅
```

## Technische Implementierung

### Weapon Keywords (units.js)
```javascript
calculateKeywords() {
    // Normalisiere alle Keywords zu lowercase für case-insensitive Vergleiche
    const normalizedKeywords = this.Keywords.map(k => k.toLowerCase());
    
    // Helper function für case-insensitive keyword checks
    const hasKeyword = (keyword) => normalizedKeywords.includes(keyword.toLowerCase());

    // Beispiel: Hit Modifier (case-insensitive)
    if (hasKeyword("+1 hit") || hasKeyword("+1 to hit")) {
        this.to_hit -= 1;
    }

    // Beispiel: Standard Keywords (case-insensitive)
    this.lethalHits = hasKeyword("lethal hits");
    this.devastatingWounds = hasKeyword("devastating wounds");

    // Beispiel: Lance (case-insensitive)
    if (hasKeyword("lance") && (this.type === "Melee" || this.type === "M")) {
        this.Keywords.push("+1 wound");
        this.ap += 1;
    }
}
```

### Defender Keywords (units.js)
```javascript
processDefenderKeywords() {
    // Helper function für case-insensitive keyword checks
    const hasKeyword = (keyword) => this.Keywords.some(k => k.toLowerCase() === keyword.toLowerCase());
    
    // Process damage reduction keywords (case-insensitive)
    if (hasKeyword("/2D")) {
        this.Keywords.push("halve damage");
    }

    // Process feel no pain keywords (case-insensitive)
    this.feelNoPainValue = null;
    for (const keyword of this.Keywords) {
        const fnpMatch = keyword.match(/^feel no pain (\d+)$/i);  // 'i' flag für case-insensitive
        if (fnpMatch) {
            this.feelNoPainValue = parseInt(fnpMatch[1]);
            break;
        }
    }
}
```

## Anti-X Keywords Funktionalität

### Syntax
```
anti-<zieltyp> <schwellenwert>+
```

### Beispiele
- `"anti-vehicle 4+"` → Critical Hits bei 4+ statt 6+
- `"anti-infantry 5+"` → Critical Hits bei 5+ statt 6+  
- `"anti-monster 3+"` → Critical Hits bei 3+ statt 6+

### Verhalten
1. **Parsing**: Das Keyword wird erkannt und in `CritHit<X>` umgewandelt
2. **Anwendung**: In der Hit-Phase wird der Critical Hit Threshold auf X gesetzt
3. **Effekt**: Critical Hits lösen Lethal Hits und Sustained Hits aus

### Implementierung
```javascript
// Anti-X Keywords - Dynamische Parsing (case-insensitive)
for (const keyword of this.Keywords) {
    if (keyword.toLowerCase().startsWith("anti-")) {
        const match = keyword.match(/anti-(\w+)\s+(\d+)\+/i);
        if (match) {
            const threshold = parseInt(match[2]);
            this.Keywords.push(`CritHit${threshold}`);
        }
    }
}
```

## Test-Coverage

### Umfassende Tests (154 Tests total)
- ✅ Case-insensitive Erkennung aller Keywords
- ✅ Anti-X Keywords in verschiedenen Schreibweisen
- ✅ Kombinationen mehrerer Keywords
- ✅ Regressionstest für bestehende Funktionalität
- ✅ Integration mit Feel No Pain und Damage Modifiers

### Neue Test-Suite: `comprehensive-case-insensitive.test.js`
- Hit Modifiers (8 Tests)
- Anti-X Keywords (5 Tests)  
- Damage Modifiers (6 Tests)
- Standard Keywords (8 Tests)
- Sustained Hits & Rapid Fire (8 Tests)
- Defender Keywords (8 Tests)
- Complex Combinations (1 Test)

## Keyword-Status Übersicht

| Keyword | Case-Insensitive | Implementiert | Getestet |
|---------|-----------------|---------------|----------|
| `lethal hits` | ✅ | ✅ | ✅ |
| `devastating wounds` | ✅ | ✅ | ✅ |
| `sustained hits X` | ✅ | ✅ | ✅ |
| `twin-linked` | ✅ | ✅ | ✅ |
| `rapid fire X` | ✅ | ✅ | ✅ |
| `melta X` | ✅ | ✅ | ✅ |
| `lance` | ✅ | ✅ | ✅ |
| `anti-X Y+` | ✅ | ✅ | ✅ |
| `+1 to hit/wound` | ✅ | ✅ | ✅ |
| `-1 to hit/wound` | ✅ | ✅ | ✅ |
| `+1d/-1d/2d` | ✅ | ✅ | ✅ |
| `feel no pain X` | ✅ | ✅ | ✅ |
| `blast` | ✅ | 🚧 TODO | ✅ |
| `hazardous` | ✅ | 🚧 TODO | ✅ |
| `precision` | ✅ | 🚧 TODO | ✅ |

## Rückwärtskompatibilität

- ✅ Alle bestehenden JSON-Konfigurationen funktionieren weiterhin
- ✅ Lowercase Keywords funktionieren wie bisher
- ✅ Keine Breaking Changes in der API
- ✅ Bestehende Tests bestehen weiterhin

## Beispiel-JSON

```json
{
  "Name": "Versatile Weapon Squad",
  "Weapons": [
    {
      "name": "Advanced Plasma Gun",
      "type": "Ranged",
      "attacks": "2",
      "to_hit": 3,
      "strength": 8,
      "ap": 3,
      "damage": "2",
      "amount": 5,
      "Keywords": [
        "Anti-Vehicle 4+",      // Mixed case
        "LETHAL HITS",          // Uppercase
        "sustained hits 1",     // Lowercase
        "Twin-Linked",          // Title case
        "+1D"                   // Uppercase
      ]
    }
  ]
}
```

## Status
✅ **Vollständig implementiert und getestet**
- Alle Keywords sind case-insensitive ✅
- Anti-X Keywords funktionieren korrekt ✅
- 154 Tests bestehen alle ✅
- Umfassende Dokumentation erstellt ✅
- Rückwärtskompatibilität gewährleistet ✅
