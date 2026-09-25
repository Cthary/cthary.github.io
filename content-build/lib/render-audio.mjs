import { escapeHtml, escapeAttr } from './html.mjs';
import { slugify } from './slug.mjs';

// Baut Inhaltsverzeichnis-Eintraege (gleiche Form wie toc.mjs fuer den
// Markdown-Pfad) und vergibt dabei die Abschnitts-Slugs.
export function buildAudioToc(sections) {
  const seen = new Set();
  return sections.map((section, i) => {
    let slug = `sec-${i + 1}-${slugify(section.heading)}`;
    let unique = slug;
    let n = 2;
    while (seen.has(unique)) {
      unique = `${slug}-${n}`;
      n += 1;
    }
    seen.add(unique);
    section.slug = unique;
    return { title: section.heading, slug: unique, sub: [] };
  });
}

// Rendert den Textkoerper (Intro + Abschnitte). Wird fuer Lese- UND Hoermodus
// mit unterschiedlichem id-Praefix aufgerufen - der Text selbst ist in beiden
// Modi identisch, da die Quelle bereits fertig formulierter Sprechtext ist.
export function renderAudioBody(intro, sections, prefix) {
  const introHtml = intro.map((line) => `<p>${escapeHtml(line)}</p>`).join('\n');
  const sectionsHtml = sections
    .map((section) => {
      const body = section.body.map((line) => `<p>${escapeHtml(line)}</p>`).join('\n');
      return (
        `<div class="gg-section" data-section-id="${section.slug}">\n` +
        `<h2 id="${prefix}-h-${section.slug}">${escapeHtml(section.heading)}</h2>\n` +
        `${body}\n` +
        `</div>`
      );
    })
    .join('\n');
  return `${introHtml}\n${sectionsHtml}`;
}

// Audio-Player-Block, nur im Hoermodus vorangestellt. Verweist direkt auf die
// Quelldatei in content-audio/ - kein Kopieren/Duplizieren der (grossen)
// MP3s in gegner/ noetig.
//
// identicalText: true nur bei eigenstaendigen Audio-Seiten (dort ist der
// Text darunter wortgleich mit der Aufnahme). Bei einer mit einer Markdown-
// Analyse verknuepften Seite ist der Hoermodus-Text eine eigene, aus dem
// ausfuehrlicheren Markdown erzeugte Fassung - nicht wortgleich mit der
// Aufnahme, daher ein anderer Hinweistext.
export function renderAudioPlayer(slug, identicalText) {
  const src = `../content-audio/${escapeAttr(slug)}.mp3`;
  const hint = identicalText
    ? 'Vorgelesene Fassung dieser Analyse. Der Text unten ist identisch.'
    : 'Vorgelesene Fassung dieser Analyse (eigenes Sprechtext-Skript, nicht wortgleich mit dem Text unten).';
  return (
    `<div class="gg-audio-player">\n` +
    `<audio controls preload="none" src="${src}">\n` +
    `Dein Browser unterstuetzt das Audio-Element nicht. ` +
    `<a href="${src}">MP3 herunterladen</a>.\n` +
    `</audio>\n` +
    `<p class="gg-audio-hint">${hint}</p>\n` +
    `</div>`
  );
}
