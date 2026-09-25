import { escapeHtml, escapeAttr } from './html.mjs';

// Rendert eine komplette Analyse-Seite (gegner/<slug>.html).
// Lese- und Hoermodus liegen beide im DOM (fuer Offline-Toggle ohne Refetch),
// nur die Sichtbarkeit wird per JS/[hidden] umgeschaltet.
export function renderPage({ title, slug, tocEntries, lesemodusHtml, hoermodusHtml, kurzformHtml }) {
  const toc = renderToc(tocEntries);
  const hasKurzform = Boolean(kurzformHtml);

  const kurzformBtn = hasKurzform
    ? `\n<button type="button" class="gg-mode-btn" data-mode-btn="kurzform" aria-pressed="false">Kurzform</button>`
    : '';
  const kurzformSection = hasKurzform
    ? `\n<section class="gg-mode-section" data-mode="kurzform" id="mode-kurzform" hidden>\n${kurzformHtml}\n</section>`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<!-- AUTO-GENERATED aus content/gegner-${escapeAttr(slug)}.md - nicht direkt bearbeiten -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(title)}">
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="css/gegner.css">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="../assets/favicon.svg">
</head>
<body>
<a class="gg-skip" href="#gg-main">Zum Inhalt springen</a>
<header class="gg-header">
<a class="gg-back" href="index.html">&larr; Alle Gegneranalysen</a>
<h1>${escapeHtml(title)}</h1>
<div class="gg-mode-toggle" role="group" aria-label="Darstellung waehlen">
<button type="button" class="gg-mode-btn" data-mode-btn="lesen" aria-pressed="true">Lesen</button>
<button type="button" class="gg-mode-btn" data-mode-btn="hoeren" aria-pressed="false">Hören</button>${kurzformBtn}
</div>
</header>
<nav class="gg-toc" id="gg-toc" data-collapsed="true">
<button type="button" class="gg-toc-toggle" aria-expanded="false" aria-controls="gg-toc-list">Inhalt</button>
<button type="button" class="gg-focus-reset" id="gg-focus-reset" hidden>Alle Abschnitte anzeigen</button>
<ol class="gg-toc-list" id="gg-toc-list">
${toc}
</ol>
</nav>
<main id="gg-main">
<section class="gg-mode-section" data-mode="lesen" id="mode-lesen">
${lesemodusHtml}
</section>
<section class="gg-mode-section" data-mode="hoeren" id="mode-hoeren" hidden>
${hoermodusHtml}
</section>${kurzformSection}
</main>
<footer class="gg-footer">
<p>Automatisch erzeugt aus <code>content/gegner-${escapeHtml(slug)}.md</code>. Inhalt unveraendert, nur Darstellung angepasst.</p>
</footer>
<script src="js/gegner.js"></script>
</body>
</html>
`;
}

function renderToc(entries) {
  return entries
    .map((e) => {
      const sub = e.sub.length
        ? `<ol class="gg-toc-sub">\n${e.sub
            .map(
              (s) =>
                `<li><a href="#" data-toc-target="${escapeAttr(s.slug)}">${escapeHtml(s.title)}</a></li>`
            )
            .join('\n')}\n</ol>`
        : '';
      return `<li><a href="#" data-toc-target="${escapeAttr(e.slug)}">${escapeHtml(
        e.title
      )}</a> <button type="button" class="gg-focus-btn" data-focus-target="${escapeAttr(
        e.slug
      )}">Nur diesen Abschnitt</button>${sub}</li>`;
    })
    .join('\n');
}

// Rendert gegner/index.html - Liste aller Analysen.
export function renderIndex(entries) {
  const items = entries
    .map(
      (e) =>
        `<li><a href="${escapeAttr(e.slug)}.html">${escapeHtml(e.title)}</a></li>`
    )
    .join('\n');
  const empty = entries.length
    ? ''
    : '<p class="gg-empty">Noch keine Analysen. Lege eine Datei in <code>content/</code> ab und pushe nach main.</p>';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<!-- AUTO-GENERATED aus content/*.md - nicht direkt bearbeiten -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gegneranalysen</title>
<meta name="description" content="Übersicht aller Gegneranalysen">
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="css/gegner.css">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="../assets/favicon.svg">
</head>
<body>
<a class="gg-skip" href="#gg-main">Zum Inhalt springen</a>
<header class="gg-header">
<h1>Gegneranalysen</h1>
</header>
<main id="gg-main">
<ul class="gg-index-list">
${items}
</ul>
${empty}
</main>
<footer class="gg-footer">
<p>Neue Analyse: Datei in <code>content/</code> ablegen, committen, pushen.</p>
</footer>
<script src="js/gegner.js"></script>
</body>
</html>
`;
}
