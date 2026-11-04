#!/usr/bin/env node
/**
 * Kopieert de bestanden voor de foto-herkenning (Tesseract.js) naar public/ocr/,
 * zodat ze met de site worden meegeleverd. Er gaat dan niets naar een externe server:
 * de foto wordt in de browser van de docent herkend.
 * Draait automatisch vóór `npm run dev` en `npm run build`.
 */
import { mkdirSync, copyFileSync, existsSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const doel = join(root, 'public/ocr');
const bestanden = [
  ['tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'core/tesseract-core-simd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'core/tesseract-core-lstm.wasm.js'],
  // Het taalpakket krijgt de extensie .wasm: sommige hosts (zoals de claude.ai-preview) leveren geen .gz.
  // ocr/worker.js stuurt het verzoek van Tesseract om naar dit bestand. De inhoud is ongewijzigd (gzip).
  ['@tesseract.js-data/nld/4.0.0_best_int/nld.traineddata.gz', 'lang/nld.traineddata.gz.wasm']
];
rmSync(join(doel, 'lang/nld.traineddata.gz'), { force: true });
for (const [van, naar] of bestanden) {
  const bron = join(nm, van);
  const bestemming = join(doel, naar);
  if (!existsSync(bron)) { console.error(`Ontbreekt: ${van}. Draai eerst npm install.`); process.exit(1); }
  mkdirSync(dirname(bestemming), { recursive: true });
  if (!existsSync(bestemming) || statSync(bestemming).size !== statSync(bron).size) copyFileSync(bron, bestemming);
}
writeFileSync(join(doel, 'worker.js'), `// Uniekind: laadt de Tesseract-worker en stuurt het taalpakket naar de .wasm-naam.\nconst echteFetch = self.fetch.bind(self);\nself.fetch = (url, opties) => echteFetch(String(url).replace(/\\.traineddata\\.gz$/, '.traineddata.gz.wasm'), opties);\nimportScripts('worker.min.js');\n`);
console.log('OCR-bestanden klaar in public/ocr/');
