# UI-Verbesserungen für Einzelmodell-Einheiten und Case-Insensitive Keywords

## Übersicht

Zwei wichtige Verbesserungen wurden implementiert:
1. **Schadensanzeige für Einzelmodell-Einheiten** - Knights, Primarchs, etc. zeigen jetzt Schaden statt Modellverluste
2. **Case-insensitive Keyword-Erkennung** - "lethal hits", "Lethal Hits", "LETHAL HITS" werden alle erkannt

## 1. Schadensanzeige für Einzelmodell-Einheiten

### Problem
Bei Einheiten mit nur 1 Modell (wie Knights oder Primarchs) war "Vernichtete Modelle: 0.05 / 1" nicht sehr aussagekräftig. Wichtiger ist, wie viel Schaden tatsächlich verursacht wurde.

### Lösung
**Automatische UI-Umschaltung** basierend auf Modellanzahl:

#### Für Multi-Modell-Einheiten (models > 1):
```
🛡️ vs Ork Boyz
Vernichtete Modelle: 3.25 / 10
Vernichtungsrate: 32.5%
🔥 Komplette Vernichtung: 2.1%
```

#### Für Einzelmodell-Einheiten (models = 1):
```
🛡️ vs Canis Rex
Durchschnittsschaden: 8.45 / 26 Wounds
Lebensenergie verloren: 32.5%
🔥 Komplette Vernichtung: 2.1%
```

### Implementation

#### Backend (w40k.js)
```javascript
getNewTargetJson() {
    return {
        "Name": "",
        "ModelsDestroyed": 0,
        "MaximumModels": 0,
        "TotalDamage": 0,     // Neu: Gesamtschaden
        "MaxWounds": 0,       // Neu: Max Wounds pro Modell
        "Weapons": []
    };
}

// In createResults():
target.MaxWounds = defender.wounds;  // Wounds-Info weitergeben
target.TotalDamage += averageTotalDamage;  // Schaden aufsummieren
```

#### Frontend (dice40k.html)
```javascript
// Dynamische Label basierend auf Modellanzahl
<span class="stat-label">${target.MaximumModels === 1 ? 'Durchschnittsschaden:' : 'Vernichtete Modelle:'}</span>
<span class="stat-value">${target.MaximumModels === 1 ? 
    target.TotalDamage.toFixed(2) + ' / ' + target.MaxWounds + ' Wounds' :
    target.ModelsDestroyed.toFixed(2) + ' / ' + target.MaximumModels}</span>

<span class="stat-label">${target.MaximumModels === 1 ? 'Lebensenergie verloren:' : 'Vernichtungsrate:'}</span>
<span class="stat-value">${target.MaximumModels === 1 ? 
    ((target.TotalDamage / target.MaxWounds) * 100).toFixed(1) + '%' :
    ((target.ModelsDestroyed / target.MaximumModels) * 100).toFixed(1) + '%'}</span>
```

## 2. Case-Insensitive Keyword-Erkennung

### Problem
Keywords wie "lethal hits" wurden nur erkannt, wenn sie exakt in lowercase geschrieben waren. "Lethal Hits" oder "LETHAL HITS" funktionierten nicht.

### Lösung
**Case-insensitive Keyword-Parsing** für kritische Keywords:

#### Vorher (units.js)
```javascript
this.lethalHits = this.Keywords.includes("lethal hits");
this.devastatingWounds = this.Keywords.includes("devastating wounds");
```

#### Nachher (units.js)
```javascript
this.lethalHits = this.Keywords.some(keyword => keyword.toLowerCase() === "lethal hits");
this.devastatingWounds = this.Keywords.some(keyword => keyword.toLowerCase() === "devastating wounds");
```

### Unterstützte Varianten
Alle diese Versionen werden jetzt erkannt:
- ✅ `"lethal hits"` (lowercase)
- ✅ `"Lethal Hits"` (title case)
- ✅ `"LETHAL HITS"` (uppercase)
- ✅ `"LeThaL hItS"` (mixed case)
- ✅ `"devastating wounds"` (alle Varianten)
- ✅ `"DEVASTATING WOUNDS"` (alle Varianten)

## 3. JSON-Beispiele

### Einzelmodell-Einheit mit Feel No Pain
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

### Waffe mit Case-Insensitive Keywords
```json
{
  "name": "Plasma Incinerator",
  "type": "Ranged",
  "attacks": "2",
  "to_hit": 3,
  "strength": 8,
  "ap": 3,
  "damage": "2",
  "amount": 10,
  "Keywords": [
    "RHMiss",
    "Lethal Hits"    // Funktioniert jetzt case-insensitive
  ]
}
```

## 4. Tests

### Neue Test-Coverage
- ✅ Case-insensitive keyword parsing (8 neue Tests)
- ✅ UI-Unterscheidung zwischen Single-/Multi-Model Einheiten
- ✅ Korrekte Schadensberechnung und -anzeige
- ✅ Kompatibilität mit Feel No Pain

### Test-Ergebnisse
```
ℹ tests 139
ℹ suites 31  
ℹ pass 139
ℹ fail 0
```

## 5. Benutzerfreundlichkeit

### Vor den Änderungen
```
🛡️ vs Canis Rex
Vernichtete Modelle: 0.05 / 1
Vernichtungsrate: 5.0%
```
*Wenig aussagekräftig für große Einzelmodelle*

### Nach den Änderungen
```
🛡️ vs Canis Rex  
Durchschnittsschaden: 8.45 / 26 Wounds
Lebensenergie verloren: 32.5%
🔥 Komplette Vernichtung: 2.1%
```
*Viel aussagekräftiger für Spieler*

## 6. Rückwärtskompatibilität

- ✅ Bestehende JSON-Konfigurationen funktionieren weiterhin
- ✅ Multi-Modell-Einheiten zeigen weiterhin "Vernichtete Modelle"
- ✅ Lowercase Keywords funktionieren weiterhin
- ✅ Alle bestehenden Features unverändert

## Status
✅ **Vollständig implementiert und getestet**
- UI-Anpassungen für Einzelmodell-Einheiten ✅
- Case-insensitive Keyword-Erkennung ✅  
- Umfassende Tests bestanden (139/139) ✅
- Rückwärtskompatibilität gewährleistet ✅
- Feel No Pain Integration funktioniert ✅
