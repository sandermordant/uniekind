#!/usr/bin/env node
/**
 * Zet beide versies samen in één map om te publiceren:
 *   site/            Uniekind Sophianum   (uit dist/)
 *   site/algemeen/   Uniekind algemeen    (uit dist-voorbeeld-algemeen/)
 * Gebruik: npm run site   (bouwt eerst beide versies)
 */
import { cpSync, rmSync, existsSync, writeFileSync } from 'node:fs';

for (const m of ['dist', 'dist-voorbeeld-algemeen']) if (!existsSync(m)) { console.error(`Map ${m} ontbreekt. Draai eerst npm run build:alles.`); process.exit(1); }
rmSync('site', { recursive: true, force: true });
cpSync('dist', 'site', { recursive: true });
cpSync('dist-voorbeeld-algemeen', 'site/algemeen', { recursive: true });
// GitHub Pages: geen Jekyll-verwerking
writeFileSync('site/.nojekyll', '');
console.log('Klaar: site/ (Sophianum) en site/algemeen/ (algemene versie).');
