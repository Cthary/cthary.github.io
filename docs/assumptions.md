# Annahmen & offene Punkte zum Battlescribe-XML-Mapping

- Die XML-Struktur von Battlescribe ist verschachtelt und enthält viele optionale Felder.
- Waffen werden manchmal als eigene Auswahl (type="weapon") geführt, dürfen aber **nie** als Unit in die IR gemappt werden.
- Modelle können verschachtelte Selections (z.B. Waffen, Wargear) enthalten.
- Kategorien (categories/category) werden als Keywords übernommen.
- Abilities werden aus <rules> extrahiert.
- Die Zuordnung von Waffen zu Modellen erfolgt über die Verschachtelung in <selections>.
- Für die erste Version wird nur ein einfaches Beispiel (intercessor.ros) abgedeckt; komplexere Listen werden iterativ ergänzt.
- Fehlerhafte oder unklare XML-Strukturen werden im Parser-Test als Annahme dokumentiert und führen zu Fehlern.

(Stand: 24.08.2025)
