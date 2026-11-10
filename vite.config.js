// Uniekind – Vite-configuratie.
// De website bouwt het profiel van het Sophianum (profiles/sophianum.json) in de map dist/.
// Een ander profiel kan met UNIEKIND_PROFIEL=<id>; dat komt dan in dist-<id>/.
// Titel, noindex en themakleur worden bij het bouwen uit het profiel in index.html gezet.
import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'node:fs';

function kiesProfiel() {
  if (process.env.UNIEKIND_PROFIEL) return process.env.UNIEKIND_PROFIEL;
  return 'sophianum';
}

export default defineConfig(() => {
  const profielId = kiesProfiel();
  const pad = `public/profiles/${profielId}.json`;
  if (!existsSync(pad)) throw new Error(`Schoolprofiel niet gevonden: ${pad}`);
  const profiel = JSON.parse(readFileSync(pad, 'utf8'));

  return {
    base: './',
    // Niet-ASCII-tekens in JavaScript als escape-code schrijven: veilig voor elke server en preview.
    esbuild: { charset: 'ascii' },
    define: { __PROFIEL__: JSON.stringify(profielId) },
    build: {
      // Elke versie in een eigen map, zodat beide naast elkaar gepubliceerd kunnen worden.
      outDir: profielId === 'sophianum' ? 'dist' : `dist-${profielId}`,
      // Lettertypen en kleine afbeeldingen worden in de CSS/JS opgenomen: geen externe verzoeken.
      assetsInlineLimit: 40000,
      target: 'es2020'
    },
    plugins: [
      {
        name: 'uniekind-profiel-in-html',
        transformIndexHtml(html) {
          const titel = profiel.uniekind.eigenProfiel ? `${profiel.uniekind.titel} – ${profiel.uniekind.ondertitel}` : `${profiel.uniekind.titel} – ${profiel.school.naam}`;
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
