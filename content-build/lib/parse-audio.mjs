// Parser fuer bereits fertig vorgelesene Analysen: content-audio/<slug>.txt
// (reiner Flieigsstext, T2S-Zeilen schon fertig formuliert) + content-audio/<slug>.mp3
// (echte Aufnahme/Erzeugung dieses Texts). Im Gegensatz zum Markdown-Pfad wird
// hier NICHTS umformuliert oder symbolersetzt - der Text ist bereits final.
//
// Struktur der .txt-Dateien (empirisch an allen vorhandenen Dateien geprueft):
//   Zeile 1: Titel ("Gegneranalyse: <Name> (<Tag>) - <Fraktion>.")
//   danach: Fliesstext-Zeilen (Intro/Listendaten) bis zur ersten "Abschnitt N: Titel."-Zeile
//   ab dort: "Abschnitt N: Titel." markiert je einen neuen Hauptabschnitt (= H2)
// Jede nicht-leere Zeile wird 1:1 zu einem Absatz - keine Zusammenfassung,
// keine Umsortierung, keine inhaltliche Interpretation.

const SECTION_MARKER = /^Abschnitt\s+\d+:\s*(.+?)\.?\s*$/;

export function parseAudioText(source, fallbackTitle) {
  const lines = source.split(/\r?\n/).map((l) => l.trim());
  const nonEmpty = lines.filter((l) => l !== '');
  if (nonEmpty.length === 0) {
    return { title: fallbackTitle, intro: [], sections: [] };
  }

  const titleLine = nonEmpty[0];
  const title = titleLine.replace(/\.\s*$/, '') || fallbackTitle;

  const intro = [];
  const sections = [];
  let current = null;
  let seenTitle = false;

  for (const line of lines) {
    if (line === '') continue;
    if (!seenTitle) {
      seenTitle = true;
      continue; // Titelzeile wird als <h1> gerendert, nicht doppelt im Text
    }
    const marker = SECTION_MARKER.exec(line);
    if (marker) {
      if (current) sections.push(current);
      current = { heading: marker[1], body: [] };
      continue;
    }
    if (current) {
      current.body.push(line);
    } else {
      intro.push(line);
    }
  }
  if (current) sections.push(current);

  return { title, intro, sections };
}
