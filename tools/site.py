#!/usr/bin/env python3
"""Hilfsskript für die statische Seite (nur Python-Standardbibliothek).

    python tools/site.py sync    Kopf, Navigation, Fußzeile und Skripte in alle Seiten einsetzen
    python tools/site.py check   Links, Anker, Groß-/Kleinschreibung und Pflichtangaben prüfen

Die fertigen HTML-Dateien werden committet. Beim Veröffentlichen läuft nichts davon.
Regelstand ändern: REGELSTAND unten anpassen, dann `sync` ausführen.
"""
import os
import re
import sys
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent

SITE_NAME = "Die richtigen Fragen"
REGELSTAND = "11. Edition · geprüft am 19.09.2026"

NAV = [
    (None, [("index.html", "Start")]),
    ("Vor dem Spiel", [
        ("before.html", "Vor dem Spiel"),
        ("army.html", "Meine Armee"),
        ("units.html", "Meine Einheiten"),
        ("deployment.html", "Deployment"),
    ]),
    ("Im Spiel", [
        ("checklist.html", "Checkliste"),
        ("stratagems.html", "Stratagems"),
        ("threat.html", "Mein Gegner"),
        ("missions.html", "Mission"),
    ]),
    ("Lernen", [("examples.html", "Beispiele")]),
    ("Danach", [("review.html", "Nach dem Spiel")]),
]

HEAD = """<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<script>(function(){try{var t=localStorage.getItem('ba:theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();</script>
<link rel="stylesheet" href="css/style.css">"""

SCRIPTS = """<script src="js/app.js" defer></script>
<script src="js/checklist.js" defer></script>
<script src="js/helper.js" defer></script>"""

BLOCKS = ("HEAD", "HEADER", "FOOTER", "SCRIPTS")


def render_header(current):
    groups = []
    for title, links in NAV:
        items = []
        for href, label in links:
            cur = ' aria-current="page"' if href.split(".")[0] == current else ""
            items.append(f'<a href="{href}"{cur}>{escape(label)}</a>')
        heading = f'<p class="group-title">{escape(title)}</p>' if title else ""
        groups.append(f'<li class="group">{heading}<div class="links">{"".join(items)}</div></li>')
    nav = "\n".join(groups)
    return f"""<a class="skip" href="#main">Zum Inhalt springen</a>
<header class="site-header">
<div class="wrap">
<div class="header-bar">
<a class="brand" href="index.html"><img src="assets/favicon.svg" alt="" width="30" height="30"><span>{escape(SITE_NAME)}</span></a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav"><span aria-hidden="true">☰</span><span class="btn-label"> Menü</span></button>
<button class="theme-btn" type="button"><span class="ico" aria-hidden="true">🌙</span><span class="btn-label"> Dunkel</span></button>
</div>
<nav class="site-nav" id="site-nav" aria-label="Hauptmenü">
<ul>
{nav}
</ul>
</nav>
</div>
</header>"""


def render_footer(current, rules):
    stand = ""
    if rules:
        stand = (f'<p><span class="badge-rule">Regelstand</span> {escape(REGELSTAND)}. '
                 'Regeln und Punkte ändern sich. Im Zweifel gilt die offizielle App.</p>\n')
    fab = "" if current == "checklist" else '\n<a class="fab" href="checklist.html">✓ Checkliste</a>'
    return f"""<footer class="site-footer">
<div class="wrap">
{stand}<p>Inoffizielles Fanprojekt zum Lernen. Warhammer 40,000 und Blood Angels sind Marken von Games Workshop. Diese Seite hat keine Verbindung zu Games Workshop. Regeln sind hier in eigenen Worten zusammengefasst. Maßgeblich sind immer das Regelbuch und die offizielle Warhammer-40,000-App.</p>
<p class="no-print"><a href="#main">↑ Nach oben</a> · <a href="index.html#quellen">Quellen und Regelstand</a></p>
</div>
</footer>{fab}"""


def expected_blocks(current, rules):
    return {
        "HEAD": HEAD,
        "HEADER": render_header(current),
        "FOOTER": render_footer(current, rules),
        "SCRIPTS": SCRIPTS,
    }


def page_files():
    return sorted(p for p in ROOT.glob("*.html"))


def body_attrs(text):
    m = re.search(r"<body\b([^>]*)>", text)
    attrs = m.group(1) if m else ""
    page = re.search(r'data-page="([^"]+)"', attrs)
    rules = re.search(r'data-rules="([^"]+)"', attrs)
    return (page.group(1) if page else None), bool(rules and rules.group(1) == "1")


def apply_blocks(text, current, rules):
    """Ersetzt die Marker-Blöcke. Gibt (neuer Text, fehlende Blöcke) zurück."""
    missing = []
    for name, content in expected_blocks(current, rules).items():
        pattern = re.compile(rf"<!--{name}-->.*?<!--/{name}-->", re.S)
        if not pattern.search(text):
            missing.append(name)
            continue
        replacement = f"<!--{name}-->\n{content}\n<!--/{name}-->"
        text = pattern.sub(lambda _m, r=replacement: r, text, count=1)
    return text, missing


def cmd_sync():
    changed = 0
    for path in page_files():
        text = path.read_text(encoding="utf-8")
        current, rules = body_attrs(text)
        if not current:
            print(f"FEHLER {path.name}: <body data-page=\"…\"> fehlt")
            return 1
        new, missing = apply_blocks(text, current, rules)
        if missing:
            print(f"FEHLER {path.name}: Marker fehlen: {', '.join(missing)}")
            return 1
        if new != text:
            path.write_text(new, encoding="utf-8", newline="\n")
            changed += 1
            print(f"aktualisiert: {path.name}")
    print(f"sync fertig, {changed} Datei(en) geändert")
    return 0


# ---------------------------------------------------------------- check

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.refs = []          # (tag, attr, value, line)
        self.h1 = 0
        self.imgs_without_alt = []
        self.fields = []        # (id, wrapped_in_label, line, type)
        self.labels_for = set()
        self.label_depth = 0
        self.first_head_tag = None
        self.in_head = False
        self.title = ""
        self._in_title = False
        self.has_main = False
        self.lang = None
        self.description = False
        self.body_page = None
        self.base = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "head":
            self.in_head = True
        elif self.in_head and self.first_head_tag is None:
            self.first_head_tag = (tag, a)
        if tag == "title":
            self._in_title = True
        if tag == "meta" and a.get("name") == "description" and a.get("content"):
            self.description = True
        if tag == "body":
            self.body_page = a.get("data-page")
        if tag == "main" and a.get("id") == "main":
            self.has_main = True
        if "id" in a:
            self.ids.append((a["id"], line))
        if tag == "h1":
            self.h1 += 1
        if tag == "label":
            self.label_depth += 1
            if a.get("for"):
                self.labels_for.add(a["for"])
        if tag in ("input", "textarea", "select") and a.get("type") not in ("hidden", "submit", "button"):
            self.fields.append((a.get("id"), self.label_depth > 0, line, a.get("type", tag)))
        if tag == "img" and "alt" not in a:
            self.imgs_without_alt.append(line)
        if tag == "base":
            self.base = a.get("href")
            return
        for attr in ("href", "src"):
            if attr in a and a[attr] is not None:
                self.refs.append((tag, attr, a[attr], line))

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False
        if tag == "title":
            self._in_title = False
        if tag == "label":
            self.label_depth = max(0, self.label_depth - 1)

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def parse(path):
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def exact_exists(path):
    """Existiert der Pfad in genau dieser Schreibweise? (GitHub Pages ist case-sensitiv)

    Path.resolve() würde unter Windows die Schreibweise korrigieren, deshalb hier
    bewusst nur abspath/relpath und ein Vergleich mit dem Verzeichnisinhalt."""
    root = os.path.normpath(str(ROOT))
    full = os.path.normpath(os.path.abspath(str(path)))
    try:
        rel = os.path.relpath(full, root)
    except ValueError:
        return False
    if rel == ".." or rel.startswith(".." + os.sep):
        return False
    cur = root
    for part in rel.split(os.sep):
        if part in ("", "."):
            continue
        try:
            names = os.listdir(cur)
        except OSError:
            return False
        if part not in names:
            return False
        cur = os.path.join(cur, part)
    return True


def cmd_check():
    errors = []

    def err(where, msg):
        errors.append(f"{where}: {msg}")

    pages = page_files()
    parsed = {p.name: parse(p) for p in pages}

    for extra in (".nojekyll", "robots.txt", "assets/favicon.svg", "css/style.css", "js/app.js"):
        if not (ROOT / extra).exists():
            err("Repo", f"{extra} fehlt")

    for p in ROOT.rglob("*"):
        rel = p.relative_to(ROOT)
        if any(part.startswith(".") and part not in (".nojekyll", ".gitignore") for part in rel.parts):
            continue
        if not p.is_file():
            continue
        if rel.parts and rel.parts[0] == "tools":
            continue
        if rel.name in (".nojekyll", ".gitignore"):
            continue
        if not re.fullmatch(r"[a-z0-9._/-]+", rel.as_posix()):
            err(str(rel), "Dateiname nur klein, ohne Leerzeichen und Umlaute")

    for path in pages:
        name = path.name
        text = path.read_text(encoding="utf-8")
        pp = parsed[name]

        if pp.lang != "de":
            err(name, 'lang="de" fehlt')
        if not pp.first_head_tag or pp.first_head_tag[0] != "meta" or pp.first_head_tag[1].get("charset", "").lower() != "utf-8":
            err(name, '<meta charset="utf-8"> muss das erste Element im <head> sein')
        if not pp.title.strip():
            err(name, "<title> fehlt")
        if not pp.description:
            err(name, 'meta name="description" fehlt')
        if pp.base is not None and (name != "404.html" or pp.base != "/"):
            err(name, '<base> ist nur auf 404.html mit href="/" erlaubt')
        if pp.h1 != 1:
            err(name, f"genau eine <h1> erwartet, gefunden: {pp.h1}")
        if not pp.has_main:
            err(name, '<main id="main"> fehlt')
        for line in pp.imgs_without_alt:
            err(f"{name}:{line}", "<img> ohne alt")

        seen = set()
        for id_, line in pp.ids:
            if id_ in seen:
                err(f"{name}:{line}", f'doppelte id "{id_}"')
            seen.add(id_)

        for id_, wrapped, line, kind in pp.fields:
            if kind == "checkbox" and wrapped:
                continue
            if not wrapped and not (id_ and id_ in pp.labels_for):
                err(f"{name}:{line}", f"Formularfeld ({kind}) ohne <label>")

        current, rules = body_attrs(text)
        if current != name.split(".")[0]:
            err(name, f'data-page="{current}" passt nicht zum Dateinamen')
        synced, missing = apply_blocks(text, current or "", rules)
        if missing:
            err(name, f"Marker fehlen: {', '.join(missing)}")
        elif synced != text:
            err(name, "Kopf/Navigation/Fußzeile nicht synchron, bitte `python tools/site.py sync` ausführen")

        for tag, attr, value, line in pp.refs:
            where = f"{name}:{line}"
            parts = urlsplit(value)
            if parts.scheme in ("http", "https"):
                if tag != "a":
                    err(where, f"externe Ressource ({tag} {attr}): {value}")
                continue
            if parts.scheme in ("mailto", "tel", "data", "javascript") or value.startswith("//"):
                if parts.scheme not in ("mailto", "tel"):
                    err(where, f"nicht erlaubt: {value}")
                continue
            if value.startswith("/"):
                err(where, f"absoluter Pfad, bitte relativ verlinken: {value}")
                continue
            target_rel = unquote(parts.path)
            target = (path.parent / target_rel) if target_rel else path
            if target_rel and not exact_exists(target):
                err(where, f"Ziel nicht gefunden (Schreibweise beachten): {value}")
                continue
            if parts.fragment:
                tname = target.name if target_rel else name
                tp = parsed.get(tname)
                if tp is None:
                    if tname.endswith(".html"):
                        err(where, f"Anker in unbekannter Seite: {value}")
                elif parts.fragment not in {i for i, _ in tp.ids}:
                    err(where, f"Anker #{parts.fragment} fehlt in {tname}")

    css = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
    if re.search(r"@import|url\(\s*['\"]?https?:", css):
        err("css/style.css", "keine externen Ressourcen erlaubt")

    if errors:
        print("\n".join(errors))
        print(f"\ncheck: {len(errors)} Problem(e)")
        return 1
    print(f"check: OK ({len(pages)} Seiten)")
    return 0


def main(argv):
    if len(argv) != 2 or argv[1] not in ("sync", "check"):
        print(__doc__)
        return 2
    return cmd_sync() if argv[1] == "sync" else cmd_check()


if __name__ == "__main__":
    sys.exit(main(sys.argv))
