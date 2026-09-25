import { slugify } from './slug.mjs';
import { inlineToText } from './inline.mjs';

// Baut das Inhaltsverzeichnis aus den H2-Sektionen + darin verschachtelten
// H3-Ueberschriften und vergibt dabei jeder Ueberschrift einen stabilen,
// modus-unabhaengigen Slug (heading.slug). Renderer haengen daran zur
// Laufzeit nur noch das Modus-Praefix ("les-"/"hoer-") fuer die id an.
export function buildToc(sections) {
  const seen = new Set();
  const uniqueSlug = (base) => {
    let s = base;
    let i = 2;
    while (seen.has(s)) {
      s = `${base}-${i}`;
      i += 1;
    }
    seen.add(s);
    return s;
  };

  const entries = [];
  for (const section of sections) {
    seen.add(section.slug);
    section.heading.slug = section.slug;
    const title = inlineToText(section.heading.inline);
    const sub = [];
    collectSubheadings(section.body, sub, uniqueSlug);
    entries.push({ title, slug: section.slug, sub });
  }
  return entries;
}

function collectSubheadings(nodes, out, uniqueSlug) {
  for (const node of nodes) {
    if (node.type === 'heading' && node.level >= 3) {
      const title = inlineToText(node.inline);
      const slug = uniqueSlug(slugify(title));
      node.slug = slug;
      out.push({ title, slug });
    } else if (node.type === 'blockquote') {
      collectSubheadings(node.children, out, uniqueSlug);
    } else if (node.type === 'list') {
      for (const item of node.items) collectSubheadings(item, out, uniqueSlug);
    }
  }
}
