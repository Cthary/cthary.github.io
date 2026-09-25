// Baut aus dem flachen markdown-it Token-Stream einen einfachen,
// verschachtelten Baum. Beide Renderer (Lesemodus/Hoermodus) lesen
// denselben Baum -> es wird nur einmal geparst.
//
// Knotentypen: heading, paragraph, list, blockquote, table, fence, hr
// 'inline' Felder enthalten das rohe markdown-it Inline-Token-Array
// (siehe lib/inline.mjs zum Rendern).

export function buildTree(tokens) {
  return parseBlocks(tokens, 0, null).nodes;
}

function parseBlocks(tokens, start, stopTypes) {
  const nodes = [];
  let i = start;
  while (i < tokens.length) {
    const t = tokens[i];
    if (stopTypes && stopTypes.includes(t.type)) {
      return { nodes, next: i };
    }

    if (t.type === 'heading_open') {
      const level = Number(t.tag.slice(1));
      const inlineTok = tokens[i + 1];
      nodes.push({ type: 'heading', level, inline: inlineTok.children });
      i += 3; // heading_open, inline, heading_close
      continue;
    }

    if (t.type === 'paragraph_open') {
      const inlineTok = tokens[i + 1];
      nodes.push({ type: 'paragraph', inline: inlineTok.children });
      i += 3;
      continue;
    }

    if (t.type === 'bullet_list_open' || t.type === 'ordered_list_open') {
      const ordered = t.type === 'ordered_list_open';
      const startAttr = ordered && t.attrGet ? t.attrGet('start') : null;
      const listStart = startAttr ? Number(startAttr) : 1;
      const closeType = ordered ? 'ordered_list_close' : 'bullet_list_close';
      const items = [];
      i += 1;
      while (tokens[i].type !== closeType) {
        // tokens[i] ist list_item_open
        i += 1;
        const res = parseBlocks(tokens, i, ['list_item_close']);
        items.push(res.nodes);
        i = res.next + 1; // list_item_close konsumieren
      }
      i += 1; // list close konsumieren
      nodes.push({ type: 'list', ordered, start: listStart, items });
      continue;
    }

    if (t.type === 'blockquote_open') {
      i += 1;
      const res = parseBlocks(tokens, i, ['blockquote_close']);
      i = res.next + 1;
      nodes.push({ type: 'blockquote', children: res.nodes });
      continue;
    }

    if (t.type === 'table_open') {
      const parsed = parseTable(tokens, i);
      nodes.push(parsed.node);
      i = parsed.next;
      continue;
    }

    if (t.type === 'fence' || t.type === 'code_block') {
      nodes.push({ type: 'fence', content: t.content, info: (t.info || '').trim() });
      i += 1;
      continue;
    }

    if (t.type === 'hr') {
      nodes.push({ type: 'hr' });
      i += 1;
      continue;
    }

    // Unbekannte/irrelevante Tokens sicher ueberspringen.
    i += 1;
  }
  return { nodes, next: i };
}

function parseTable(tokens, start) {
  let i = start + 1; // table_open konsumieren
  let header = [];
  const rows = [];
  while (tokens[i].type !== 'table_close') {
    if (tokens[i].type === 'thead_open') {
      i += 1;
      while (tokens[i].type !== 'thead_close') {
        if (tokens[i].type === 'tr_open') {
          const r = parseRow(tokens, i, 'th_open', 'th_close');
          header = r.cells;
          i = r.next;
        } else {
          i += 1;
        }
      }
      i += 1; // thead_close
    } else if (tokens[i].type === 'tbody_open') {
      i += 1;
      while (tokens[i].type !== 'tbody_close') {
        if (tokens[i].type === 'tr_open') {
          const r = parseRow(tokens, i, 'td_open', 'td_close');
          rows.push(r.cells);
          i = r.next;
        } else {
          i += 1;
        }
      }
      i += 1; // tbody_close
    } else {
      i += 1;
    }
  }
  return { node: { type: 'table', header, rows }, next: i + 1 };
}

function parseRow(tokens, start, cellOpen, cellClose) {
  let i = start + 1; // tr_open konsumieren
  const cells = [];
  while (tokens[i].type !== 'tr_close') {
    if (tokens[i].type === cellOpen) {
      const inlineTok = tokens[i + 1];
      cells.push(inlineTok.children);
      i += 3; // cellOpen, inline, cellClose
    } else {
      i += 1;
    }
  }
  return { cells, next: i + 1 }; // tr_close konsumieren
}

// Gruppiert die Top-Level-Knoten in Abschnitte anhand von H2-Ueberschriften.
// 'intro' enthaelt alles vor der ersten H2 (z.B. den H1-Titel).
// Jeder Abschnitt traegt einen stabilen, modus-unabhaengigen Slug fuer
// TOC-Links und die Fokus-Buttons.
export function groupIntoSections(nodes, slugify) {
  const intro = [];
  const sections = [];
  let current = null;

  for (const node of nodes) {
    // Level 1 nach dem Titel wird wie Level 2 behandelt (kommt in kuerzeren
    // Dokumenten wie den Kurzform-Spickzetteln als zweite grosse
    // Ueberschrift vor, z.B. eine abschliessende "# Grundannahmen"-Sektion).
    if (node.type === 'heading' && node.level <= 2) {
      if (current) sections.push(current);
      const title = inlineTextForSlug(node);
      current = {
        heading: node,
        slug: `sec-${sections.length + 1}-${slugify(title)}`,
        body: []
      };
      continue;
    }
    if (current) {
      current.body.push(node);
    } else {
      intro.push(node);
    }
  }
  if (current) sections.push(current);
  return { intro, sections };
}

function inlineTextForSlug(headingNode) {
  return (headingNode.inline || [])
    .filter((t) => t.type === 'text')
    .map((t) => t.content)
    .join(' ');
}
