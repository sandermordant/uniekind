#!/usr/bin/env node
/**
 * Zet de gebouwde website (dist/) in site/, klaar om te publiceren op GitHub Pages of Netlify.
 * Gebruik: npm run site   (bouwt eerst de Sophianum-versie)
 */
import { cpSync, rmSync, existsSync, writeFileSync } from 'node:fs';

if (!existsSync('dist')) { console.error('Map dist ontbreekt. Draai eerst npm run build:sophianum.'); process.exit(1); }
rmSync('site', { recursive: true, force: true });
cpSync('dist', 'site', { recursive: true });
// GitHub Pages: geen Jekyll-verwerking
writeFileSync('site/.nojekyll', '');
console.log('Klaar: site/ bevat de website van Uniekind voor het Sophianum.');
