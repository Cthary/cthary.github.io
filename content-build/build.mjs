import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createParser, parseMarkdown } from './lib/parse.mjs';
import { buildTree, groupIntoSections } from './lib/tree.mjs';
import { buildToc } from './lib/toc.mjs';
import { renderLesemodus } from './lib/render-lesemodus.mjs';
import { renderHoermodus } from './lib/render-hoermodus.mjs';
import { renderPage, renderIndex } from './lib/template.mjs';
import { inlineToText } from './lib/inline.mjs';
import { slugify } from './lib/slug.mjs';
import { parseAudioText } from './lib/parse-audio.mjs';
import { buildAudioToc, renderAudioBody, renderAudioPlayer } from './lib/render-audio.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const AUDIO_DIR = path.join(ROOT, 'content-audio');
const OUTPUT_DIR = path.join(ROOT, 'gegner');
const SYMBOL_MAP_PATH = path.join(HERE, 'symbol-map.json');

// Dateien in gegner/, die NICHT generiert werden - beim Aufraeumen verwaister
// Seiten (siehe cleanupOrphans) nie loeschen.
const HAND_WRITTEN = new Set([
  'index.html',
  'offline.html',
  'manifest.webmanifest',
  'sw.js'
]);

async function loadWhitelist() {
  const raw = await readFile(SYMBOL_MAP_PATH, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`symbol-map.json ist kein gueltiges JSON: ${err.message}`);
  }
  if (!Array.isArray(parsed.whitelist)) {
    throw new Error('symbol-map.json: "whitelist" muss ein Array sein.');
  }
  for (const entry of parsed.whitelist) {
    if (typeof entry.match !== 'string' || typeof entry.say !== 'string') {
      throw new Error('symbol-map.json: jeder Eintrag braucht "match" und "say" als String.');
    }
  }
  return parsed.whitelist;
}

async function listContentFiles() {
  if (!existsSync(CONTENT_DIR)) return [];
  const files = await readdir(CONTENT_DIR);
  return files
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .filter((f) => f.toLowerCase() !== 'readme.md')
    .sort();
}

function slugFromFilename(filename) {
  // content/gegner-sven-geib.md -> sven-geib
  const base = filename.replace(/\.md$/i, '');
  return base.startsWith('gegner-') ? base.slice('gegner-'.length) : base;
}

function extractTitle(tree, fallback) {
  const idx = tree.findIndex((n) => n.type === 'heading' && n.level === 1);
  if (idx === -1) return { title: fallback, rest: tree };
  const title = inlineToText(tree[idx].inline) || fallback;
  const rest = tree.slice(0, idx).concat(tree.slice(idx + 1));
  return { title, rest };
}

// Baut die Bestandteile einer Markdown-Analyse (noch nicht die fertige Seite -
// falls es eine passende content-audio/<slug>.mp3 gibt, wird deren Player
// spaeter in main() vor dem finalen renderPage() in hoermodusHtml eingefuegt).
async function buildOneMarkdown(md, whitelist, filename) {
  const filePath = path.join(CONTENT_DIR, filename);
  const source = await readFile(filePath, 'utf8');
  const slug = slugify(slugFromFilename(filename));

  const tokens = parseMarkdown(md, source);
  const tree = buildTree(tokens);
  const { title, rest } = extractTitle(tree, slug);
  const { intro, sections } = groupIntoSections(rest, slugify);
  const tocEntries = buildToc(sections);

  const lesemodusHtml = renderLesemodus(md, intro, sections);
  const hoermodusHtml = renderHoermodus(md, intro, sections, whitelist);

  return { slug, title, tocEntries, lesemodusHtml, hoermodusHtml };
}

// content-audio/<slug>.txt + content-audio/<slug>.mp3: bereits fertig
// vorformulierter Sprechtext + echte Aufnahme. Findet nur vollstaendige
// Paare - eine einzelne fehlende .txt oder .mp3 wird als Fehler gemeldet,
// damit sie nicht versehentlich uebersehen wird.
async function listAudioPairs() {
  if (!existsSync(AUDIO_DIR)) return { pairs: [], errors: [] };
  const files = await readdir(AUDIO_DIR);
  const txtBases = new Set(
    files.filter((f) => f.toLowerCase().endsWith('.txt') && f.toLowerCase() !== 'readme.txt')
      .map((f) => f.replace(/\.txt$/i, ''))
  );
  const mp3Bases = new Set(
    files.filter((f) => f.toLowerCase().endsWith('.mp3')).map((f) => f.replace(/\.mp3$/i, ''))
  );
  const errors = [];
  for (const base of txtBases) {
    if (!mp3Bases.has(base)) errors.push(`content-audio/${base}.txt hat keine passende ${base}.mp3`);
  }
  for (const base of mp3Bases) {
    if (!txtBases.has(base)) errors.push(`content-audio/${base}.mp3 hat keine passende ${base}.txt`);
  }
  const pairs = [...txtBases].filter((b) => mp3Bases.has(b)).sort();
  return { pairs, errors };
}

// Eigenstaendige Audio-Seite (nur wenn es KEINE Markdown-Analyse mit
// demselben Slug gibt - sonst wird der Player stattdessen in die
// Markdown-Seite eingefuegt, siehe main()).
async function buildOneAudioStandalone(slugRaw) {
  const slug = slugify(slugRaw);
  const filePath = path.join(AUDIO_DIR, `${slugRaw}.txt`);
  const source = await readFile(filePath, 'utf8');

  const { title, intro, sections } = parseAudioText(source, slug);
  const tocEntries = buildAudioToc(sections);

  const bodyLesemodus = renderAudioBody(intro, sections, 'les');
  const bodyHoermodus = renderAudioBody(intro, sections, 'hoer');
  const hoermodusHtml = `${renderAudioPlayer(slug, true)}\n${bodyHoermodus}`;

  return { slug, title, tocEntries, lesemodusHtml: bodyLesemodus, hoermodusHtml };
}

async function cleanupOrphans(validSlugs) {
  if (!existsSync(OUTPUT_DIR)) return;
  const files = await readdir(OUTPUT_DIR);
  for (const file of files) {
    if (!file.toLowerCase().endsWith('.html')) continue;
    if (HAND_WRITTEN.has(file)) continue;
    const slug = file.replace(/\.html$/i, '');
    if (!validSlugs.has(slug)) {
      await rm(path.join(OUTPUT_DIR, file));
      console.log(`entfernt (verwaist): gegner/${file}`);
    }
  }
}

function reportDuplicates(label, slugs) {
  const counts = new Map();
  for (const s of slugs) counts.set(s, (counts.get(s) || 0) + 1);
  let hadError = false;
  for (const [slug, count] of counts) {
    if (count > 1) {
      console.error(`Fehler: ${label} enthaelt den Slug "${slug}" ${count}-mal.`);
      hadError = true;
    }
  }
  return hadError;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const whitelist = await loadWhitelist();
  const md = createParser();
  const filenames = await listContentFiles();
  const { pairs: audioSlugs, errors: audioErrors } = await listAudioPairs();

  for (const msg of audioErrors) {
    console.error(`Fehler: ${msg}`);
    process.exitCode = 1;
  }

  const mdParts = [];
  for (const filename of filenames) {
    try {
      mdParts.push(await buildOneMarkdown(md, whitelist, filename));
    } catch (err) {
      console.error(`Fehler beim Verarbeiten von content/${filename}:`, err.message);
      process.exitCode = 1;
    }
  }

  if (
    reportDuplicates('content/', mdParts.map((p) => p.slug)) ||
    reportDuplicates('content-audio/', audioSlugs.map((s) => slugify(s)))
  ) {
    process.exitCode = 1;
  }

  if (process.exitCode === 1) {
    console.error('Build abgebrochen wegen Fehlern - es wurde nichts geschrieben.');
    return;
  }

  const mdBySlug = new Map(mdParts.map((p) => [p.slug, p]));
  const usedAudioSlugs = new Set();
  const parts = [...mdParts];

  for (const slugRaw of audioSlugs) {
    const slug = slugify(slugRaw);
    usedAudioSlugs.add(slug);
    const mdPart = mdBySlug.get(slug);
    try {
      if (mdPart) {
        // Gleicher Gegner in content/ UND content-audio/: die ausfuehrliche
        // Markdown-Seite bleibt Basis, der echte Player kommt oben in den
        // Hoermodus (statt einer zweiten, konkurrierenden Seite).
        mdPart.hoermodusHtml = `${renderAudioPlayer(slug, false)}\n${mdPart.hoermodusHtml}`;
        console.log(`Audio verknuepft: content-audio/${slugRaw}.mp3 -> gegner/${slug}.html (Markdown-Basis)`);
      } else {
        parts.push(await buildOneAudioStandalone(slugRaw));
      }
    } catch (err) {
      console.error(`Fehler beim Verarbeiten von content-audio/${slugRaw}.txt:`, err.message);
      process.exitCode = 1;
    }
  }

  if (process.exitCode === 1) {
    console.error('Build abgebrochen wegen Fehlern - es wurde nichts geschrieben.');
    return;
  }

  const results = parts.map((p) => ({
    slug: p.slug,
    title: p.title,
    html: renderPage(p)
  }));

  for (const { slug, html } of results) {
    await writeFile(path.join(OUTPUT_DIR, `${slug}.html`), html, 'utf8');
    console.log(`geschrieben: gegner/${slug}.html`);
  }

  const indexHtml = renderIndex(
    results
      .map((r) => ({ slug: r.slug, title: r.title }))
      .sort((a, b) => a.title.localeCompare(b.title, 'de'))
  );
  await writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf8');
  console.log('geschrieben: gegner/index.html');

  await cleanupOrphans(new Set(results.map((r) => r.slug)));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
