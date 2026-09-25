import { inlineToHtml } from './inline.mjs';
import { escapeHtml } from './html.mjs';

// Baut den kompletten Lesemodus-Bereich: Intro-Knoten + ein <div> je
// H2-Abschnitt mit "gg-section"-Wrapper (Basis fuer die Fokus-Buttons).
export function renderLesemodus(md, intro, sections) {
  const introHtml = renderNodes(md, intro);
  const sectionsHtml = sections
    .map((section) => renderSection(md, section))
    .join('\n');
  return `${introHtml}\n${sectionsHtml}`;
}

function renderSection(md, section) {
  const headingHtml = inlineToHtml(md, section.heading.inline);
  const bodyHtml = renderNodes(md, section.body);
  return (
    `<div class="gg-section" data-section-id="${section.slug}">\n` +
    `<h2 id="les-h-${section.slug}">${headingHtml}</h2>\n` +
    `${bodyHtml}\n` +
    `</div>`
  );
}

function renderNodes(md, nodes) {
  return nodes.map((n) => renderNode(md, n)).join('\n');
}

function renderNode(md, n) {
  switch (n.type) {
    case 'heading': {
      const level = Math.min(Math.max(n.level, 2), 4);
      const idAttr = n.slug ? ` id="les-h-${n.slug}"` : '';
      return `<h${level}${idAttr}>${inlineToHtml(md, n.inline)}</h${level}>`;
    }
    case 'paragraph':
      return `<p>${inlineToHtml(md, n.inline)}</p>`;
    case 'list': {
      const tag = n.ordered ? 'ol' : 'ul';
      const startAttr = n.ordered && n.start !== 1 ? ` start="${n.start}"` : '';
      const items = n.items
        .map((itemNodes) => `<li>${renderListItem(md, itemNodes)}</li>`)
        .join('\n');
      return `<${tag}${startAttr}>\n${items}\n</${tag}>`;
    }
    case 'blockquote':
      return `<blockquote>\n${renderNodes(md, n.children)}\n</blockquote>`;
    case 'table':
      return renderTable(md, n);
    case 'fence':
      return `<pre class="tactical-flow"><code>${escapeHtml(n.content)}</code></pre>`;
    case 'hr':
      return '<hr>';
    default:
      return '';
  }
}

function renderListItem(md, itemNodes) {
  if (itemNodes.length === 1 && itemNodes[0].type === 'paragraph') {
    return inlineToHtml(md, itemNodes[0].inline);
  }
  return renderNodes(md, itemNodes);
}

function renderTable(md, table) {
  const thead = table.header.length
    ? `<thead><tr>${table.header
        .map((c) => `<th>${inlineToHtml(md, c)}</th>`)
        .join('')}</tr></thead>`
    : '';
  const tbody = `<tbody>${table.rows
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td>${inlineToHtml(md, c)}</td>`).join('')}</tr>`
    )
    .join('')}</tbody>`;
  return `<div class="table-scroll"><table>${thead}${tbody}</table></div>`;
}
