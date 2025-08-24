# Intermediate Representation (IR) – Schema & Typen

Dieses Dokument beschreibt das Zod-Schema und die Typen für die kanonische IR, wie sie vom Battlescribe-Parser erzeugt wird.

## Übersicht
- **faction**: Fraktionsname (z.B. "ADEPTUS ASTARTES")
- **points**: Gesamtpunkte der Liste
- **units**: Array von Einheiten

### Unit
- **name**: Name der Einheit
- **models**: Array von Modellen
- **unitKeywords**: Array von Keywords (z.B. "INFANTRY")
- **abilities**: Array von Abilities
- **auras**: Array von Auren
- **modifiers**: Array von Modifikatoren

### Model
- **name**: Modellname
- **count**: Anzahl Modelle
- **profile**: Statline (M, T, Sv, W, Ld, OC, Inv)
- **weapons**: Array von Waffenprofilen

### WeaponProfile
- **name**: Waffenname
- **type**: "melee" | "ranged"
- **profile**: Statline (A, BS/WS, S, AP, D, range)
- **keywords**: Array von Waffen-Keywords

## Zod-Schema
Das vollständige Schema ist in `packages/parser/ir.ts` implementiert.

## Beispiel
```json
{
  "faction": "ADEPTUS ASTARTES",
  "points": 1000,
  "units": [
    {
      "name": "Intercessor Squad",
      "models": [
        {
          "name": "Intercessor",
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
      "unitKeywords": ["INFANTRY", "ADEPTUS ASTARTES"],
      "abilities": ["Oath of Moment"],
      "auras": [],
      "modifiers": []
    }
  ]
}
```

## Akzeptanzkriterien
- Schema validiert Beispiel-Objekte ohne Fehler.
- Typen werden automatisch aus dem Schema generiert.
- Doku und Beispiel sind aktuell.
