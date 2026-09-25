const TRANSLIT = {
  'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
  'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue'
};

// URL-/id-sicherer Slug. Wirkt nur auf IDs/Dateinamen, nie auf sichtbaren Text.
export function slugify(text) {
  let s = String(text || '');
  for (const [from, to] of Object.entries(TRANSLIT)) {
    s = s.split(from).join(to);
  }
  s = s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // übrige Akzente entfernen
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'abschnitt';
}
