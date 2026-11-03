// Uniekind – Vite-configuratie.
// Eén codebasis, meerdere schoolprofielen. Het profiel wordt gekozen met de build-modus:
//   npm run build:sophianum  → profiles/sophianum.json
//   npm run build:algemeen   → profiles/voorbeeld-algemeen.json (fase 7)
// Titel, noindex en themakleur worden bij het bouwen uit het profiel in index.html gezet.
import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'node:fs';

function kiesProfiel(mode) {
  if (process.env.UNIEKIND_PROFIEL) return process.env.UNIEKIND_PROFIEL;
  if (mode === 'algemeen') return 'voorbeeld-algemeen';
  return 'sophianum';
}

export default defineConfig(({ mode }) => {
  const profielId = kiesProfiel(mode);
  const pad = `public/profiles/${profielId}.json`;
  if (!existsSync(pad)) throw new Error(`Schoolprofiel niet gevonden: ${pad}`);
  const profiel = JSON.parse(readFileSync(pad, 'utf8'));

  return {
    base: './',
    define: { __PROFIEL__: JSON.stringify(profielId) },
    build: {
      // Lettertypen en kleine afbeeldingen worden in de CSS/JS opgenomen: geen externe verzoeken.
      assetsInlineLimit: 40000,
      target: 'es2020'
    },
    plugins: [
      {
        name: 'uniekind-profiel-in-html',
        transformIndexHtml(html) {
          const titel = `${profiel.uniekind.titel} – ${profiel.school.naam}`;
          const robots = profiel.uniekind.noindex ? '<meta name="robots" content="noindex, nofollow">' : '';
          return html
            .replace('%TITEL%', titel)
            .replace('%ROBOTS%', robots)
            .replace('%THEMAKLEUR%', profiel.huisstijl.kleuren.hoofd)
            .replace('%OMSCHRIJVING%', profiel.uniekind.ondertitel);
        }
      }
    ],
    test: { environment: 'node' }
  };
});
