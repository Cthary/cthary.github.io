// Inline-Token-Array (aus markdown-it) -> HTML (fuer Lesemodus).
// Delegiert an markdown-its eigenen Inline-Renderer, damit Lesemodus nie
// vom Bedeutungsgehalt der Quelle abweicht.
export function inlineToHtml(md, tokens) {
  if (!tokens) return '';
  return md.renderer.renderInline(tokens, md.options, {});
}

// Inline-Token-Array -> reiner Sprechtext (fuer Hoermodus).
// Entfernt Markdown-Markup-Zeichen (**, *, `, []()), behaelt aber jedes Wort.
export function inlineToText(tokens) {
  if (!tokens) return '';
  let out = '';
  for (const t of tokens) {
    switch (t.type) {
      case 'text':
      case 'code_inline':
        out += t.content;
        break;
      case 'softbreak':
      case 'hardbreak':
        out += ' ';
        break;
      case 'link_open':
      case 'link_close':
      case 'strong_open':
      case 'strong_close':
      case 'em_open':
      case 'em_close':
        // Markup wird verworfen, der eingeschlossene Text kommt als eigener
        // 'text'-Token in derselben flachen Liste und bleibt erhalten.
        break;
      default:
        if (t.children) out += inlineToText(t.children);
        break;
    }
  }
  return out.replace(/[ \t]+/g, ' ').trim();
}
