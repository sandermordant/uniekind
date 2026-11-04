#!/usr/bin/env node
/**
 * Maakt van dist/ een preview-map die als claude.ai-artifact gepubliceerd kan worden.
 * Gebruik:  node tools/maak-preview.js <doelmap> [bronmap, standaard dist]
 * Het artifact-platform zet zelf <!doctype>, <html>, <head> en <body> om de pagina heen,
 * dus die tags halen we uit index.html. Alle andere bestanden worden ongewijzigd gekopieerd.
 * Voor de echte website (Netlify / GitHub Pages) is dit niet nodig: gebruik gewoon dist/.
 */
import { cpSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const doel = process.argv[2];
const bron = process.argv[3] ?? 'dist';
if (!doel) { console.error('Geef een doelmap op.'); process.exit(1); }
rmSync(doel, { recursive: true, force: true });
cpSync(bron, doel, { recursive: true });

let h = readFileSync(join(doel, 'index.html'), 'utf8');
h = h.replace(/<!doctype html>/i, '')
  .replace(/<html[^>]*>/i, '').replace(/<\/html>/i, '')
  .replace(/<head>/i, '').replace(/<\/head>/i, '')
  .replace(/<body>/i, '').replace(/<\/body>/i, '')
  .replace(/<meta charset="utf-8">\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace('<title>', '<meta name="claude:viewport-fit-sides" content="cover">\n<title>');
writeFileSync(join(doel, 'index.html'), h.trim() + '\n');

const lijst = [];
(function loop(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) loop(p);
    else if (relative(doel, p) !== 'index.html') lijst.push(relative(doel, p));
  }
})(doel);
writeFileSync(join(doel, '..', `preview-bestanden${bron === 'dist' ? '' : '-' + bron}.json`), JSON.stringify(Object.fromEntries(lijst.map((f) => [f, join(doel, f)])), null, 1));
console.log(`Preview klaar in ${doel} (${lijst.length + 1} bestanden).`);
