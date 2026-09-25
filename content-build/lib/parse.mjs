import MarkdownIt from 'markdown-it';

// html:false      -> kein Raw-HTML-Passthrough, deterministisch/sicher
// linkify:false    -> nur explizite [text](url)-Links, kein Auto-Linking
// typographer:false -> Unicode-Zeichen (×, ≈, →, „…") aus der Quelle bleiben
//                      unverändert, markdown-it darf sie nicht "smart" ersetzen
// breaks:false      -> Standard-CommonMark-Zeilenumbruchregeln
export function createParser() {
  const md = new MarkdownIt({
    html: false,
    linkify: false,
    typographer: false,
    breaks: false
  });
  // Ein einzelnes "~" (für "ungefähr") darf nie versehentlich als
  // Durchstreichen (~~text~~) interpretiert werden.
  md.disable('strikethrough');
  return md;
}

export function parseMarkdown(md, source) {
  return md.parse(source, {});
}
