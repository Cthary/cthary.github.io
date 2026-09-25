// Text-Transformationen fuer den Hoermodus. Alles hier ist rein mechanisch:
// Markdown-/ASCII-Notation wird entfernt oder in sprechbare Verbindungswoerter
// uebersetzt, aber es wird niemals Bedeutung hinzuerfunden oder Inhalt
// weggelassen.

const ORDINALS = [
  '', 'Erstens', 'Zweitens', 'Drittens', 'Viertens', 'Fünftens', 'Sechstens',
  'Siebtens', 'Achtens', 'Neuntens', 'Zehntens', 'Elftens', 'Zwölftens',
  'Dreizehntens', 'Vierzehntens', 'Fünfzehntens', 'Sechzehntens',
  'Siebzehntens', 'Achtzehntens', 'Neunzehntens', 'Zwanzigstens'
];

export function ordinalWord(n) {
  if (n >= 1 && n < ORDINALS.length) return ORDINALS[n];
  return `Punkt ${n}`;
}

// Checkbox-Marker ("[ ] "/"[x] ") ist strukturelle Markdown-Notation, kein
// Inhalt - wird entfernt, der eigentliche Text bleibt vollstaendig erhalten.
export function stripCheckboxMarker(text) {
  return text.replace(/^\[[ xX]\]\s*/, '');
}

// Feste, eindeutige mechanische Symbol-Ersetzungen (nicht nutzerkonfigurierbar,
// da jede dieser Bedeutungen im Warhammer-Kontext unzweideutig ist und keine
// Zahl/keinen Wert veraendert - nur Sprechbarkeit herstellt).
const MECHANICAL_SYMBOLS = [
  ['×', ' mal '],
  ['≥', ' mindestens '],
  ['≤', ' höchstens '],
  ['→', ' dann '],
  ['≈', ' ungefähr '],
  ['~', ' ungefähr ']
];

export function applyMechanicalSymbols(text) {
  let out = text;
  for (const [from, to] of MECHANICAL_SYMBOLS) {
    out = out.split(from).join(to);
  }
  return out.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
}

// Nutzer-Whitelist: nur exakte Treffer, laengster Treffer zuerst, kein Regex.
export function applyWhitelist(text, whitelist) {
  if (!whitelist || whitelist.length === 0) return text;
  const sorted = [...whitelist].sort((a, b) => b.match.length - a.match.length);
  let out = text;
  for (const { match, say } of sorted) {
    if (!match) continue;
    out = out.split(match).join(say);
  }
  return out;
}

export function applySpeechText(text, whitelist) {
  // Whitelist zuerst (z.B. 18" -> "18 Zoll"), damit die mechanische
  // Symbol-Ersetzung das Anfuehrungszeichen danach nicht mehr sieht.
  return applyMechanicalSymbols(applyWhitelist(text, whitelist));
}

const CONNECTOR_ONLY = /^[\s\-_=~^|+<>.─-╿]*$/;
const CONNECTOR_EDGE = /^[\s\-_=~^|+<>.─-╿]+|[\s\-_=~^|+<>.─-╿]+$/g;
const INLINE_ARROW = /\s*(?:-->|->|→)\s*/;

// Wandelt einen Fence-Inhalt (taktisches ASCII-Flowdiagramm) in eine Liste
// von Sprech-Absaetzen um. Leerzeilen trennen Absaetze; reine
// Pfeil-/Rahmenzeilen werden entfernt (keine Aussage, nur Verbindungsgrafik);
// Text bleibt vollstaendig erhalten, Reihenfolge wird durch "Dann:" markiert.
export function flowToSpeech(content, whitelist) {
  const blocks = content.split(/\r?\n\s*\r?\n/); // an Leerzeilen in Absaetze teilen
  const paragraphs = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    let first = true;
    for (let rawLine of lines) {
      let line = rawLine.trim();
      if (line === '') continue;
      if (CONNECTOR_ONLY.test(line) && /[\->]/.test(line)) continue; // reine Pfeil-/Trennzeile
      line = stripCheckboxMarker(line);
      line = line.replace(CONNECTOR_EDGE, '').trim();
      if (line === '') continue;

      const segments = line.split(INLINE_ARROW).map((s) => s.trim()).filter(Boolean);
      for (const segment of segments) {
        const spoken = applySpeechText(segment, whitelist);
        paragraphs.push(first ? spoken : `Dann: ${spoken}`);
        first = false;
      }
    }
  }
  return paragraphs;
}
