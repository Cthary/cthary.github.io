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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
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

async function buildOne(md, whitelist, filename) {
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

  const html = renderPage({ title, slug, tocEntries, lesemodusHtml, hoermodusHtml });
  return { slug, title, html };
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

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const whitelist = await loadWhitelist();
  const md = createParser();
  const filenames = await listContentFiles();

  const results = [];
  for (const filename of filenames) {
    try {
      const result = await buildOne(md, whitelist, filename);
      results.push(result);
    } catch (err) {
      console.error(`Fehler beim Verarbeiten von content/${filename}:`, err.message);
      process.exitCode = 1;
    }
  }

  if (process.exitCode === 1) {
    console.error('Build abgebrochen wegen Fehlern - es wurde nichts geschrieben.');
    return;
  }

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
