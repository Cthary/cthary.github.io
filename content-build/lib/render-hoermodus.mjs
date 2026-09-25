import { inlineToText } from './inline.mjs';
import { escapeHtml } from './html.mjs';
import { applySpeechText, flowToSpeech, ordinalWord, stripCheckboxMarker } from './speech.mjs';

// Baut den kompletten Hoermodus-Bereich aus demselben Baum wie Lesemodus.
// Reine Struktur-Transformation: nichts wird zusammengefasst, umformuliert
// oder inhaltlich veraendert - nur linearisiert und von Markdown-/ASCII-
// Notation befreit, damit T2S es natuerlich vorlesen kann.
export function renderHoermodus(md, intro, sections, whitelist) {
  const introHtml = renderNodes(intro, whitelist);
  const sectionsHtml = sections
    .map((section) => renderSection(section, whitelist))
    .join('\n');
  return `${introHtml}\n${sectionsHtml}`;
}

function speak(tokens, whitelist) {
  return escapeHtml(applySpeechText(inlineToText(tokens), whitelist));
}

function renderSection(section, whitelist) {
  const headingText = speak(section.heading.inline, whitelist);
  const bodyHtml = renderNodes(section.body, whitelist);
  return (
    `<div class="gg-section" data-section-id="${section.slug}">\n` +
    `<h2 id="hoer-h-${section.slug}">${headingText}</h2>\n` +
    `${bodyHtml}\n` +
    `</div>`
  );
}

function renderNodes(nodes, whitelist) {
  return nodes.map((n) => renderNode(n, whitelist)).join('\n');
}

function renderNode(n, whitelist) {
  switch (n.type) {
    case 'heading': {
      const level = Math.min(Math.max(n.level, 2), 4);
      const idAttr = n.slug ? ` id="hoer-h-${n.slug}"` : '';
      return `<h${level}${idAttr}>${speak(n.inline, whitelist)}</h${level}>`;
    }
    case 'paragraph':
      return `<p>${speak(n.inline, whitelist)}</p>`;
    case 'list':
      return renderList(n, whitelist);
    case 'blockquote':
      return `<div class="gg-quote">\n${renderNodes(n.children, whitelist)}\n</div>`;
    case 'table':
      return renderTable(n, whitelist);
    case 'fence':
      return renderFence(n, whitelist);
    case 'hr':
      // Keine gesprochene Entsprechung erfinden - Trennlinie traegt keinen Inhalt.
      return '';
    default:
      return '';
  }
}

function renderList(n, whitelist) {
  const items = n.items.map((itemNodes, i) => renderListItem(itemNodes, i + 1, whitelist));
  const tag = n.ordered ? 'ol' : 'ul';
  return `<${tag} class="gg-spoken-list">\n${items.join('\n')}\n</${tag}>`;
}

function renderListItem(itemNodes, position, whitelist) {
  const prefix = ordinalWord(position);
  if (itemNodes.length === 0) return `<li>${prefix}:</li>`;

  const [first, ...rest] = itemNodes;
  let firstHtml;
  if (first.type === 'paragraph') {
    const text = stripCheckboxMarker(speak(first.inline, whitelist));
    firstHtml = `${prefix}: ${text}`;
  } else {
    // Kein Paragraph als erstes Kind (z.B. direkt verschachtelte Liste) -
    // Praefix trotzdem setzen, restlichen Inhalt normal rendern.
    firstHtml = `${prefix}:`;
    rest.unshift(first);
  }
  const restHtml = rest.length ? `\n${renderNodes(rest, whitelist)}` : '';
  return `<li>${firstHtml}${restHtml}</li>`;
}

function renderTable(table, whitelist) {
  const headers = table.header.map((c, i) =>
    c ? speak(c, whitelist) : `Spalte ${i + 1}`
  );
  const articles = table.rows.map((row, rowIndex) => {
    const cells = row.map((c) => speak(c, whitelist));
    const rowTitle = cells[0] || `Zeile ${rowIndex + 1}`;
    const fields = cells
      .map((value, i) => {
        const label = headers[i] || `Spalte ${i + 1}`;
        return `<p><strong>${label}:</strong> ${value}.</p>`;
      })
      .join('\n');
    return `<article class="gg-row">\n<h3>${rowTitle}</h3>\n${fields}\n</article>`;
  });
  return `<div class="gg-table-spoken">\n${articles.join('\n')}\n</div>`;
}

function renderFence(n, whitelist) {
  const paragraphs = flowToSpeech(n.content, whitelist);
  if (paragraphs.length === 0) return '';
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
}
