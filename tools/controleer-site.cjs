#!/usr/bin/env node
/**
 * Controleert een draaiende Uniekind-site in een echte browser:
 * - alle pagina's en drie werkvormpagina's laden zonder fouten (console, ontbrekende bestanden);
 * - axe-core (WCAG 2.1 A en AA) zonder overtredingen;
 * - nergens zijwaarts scrollen;
 * - geen verbindingen naar andere sites (geen trackers);
 * - een havo-les van 100 minuten: drie varianten die precies 100 minuten duren, stap 2 t/m 4 van de lesmaker,
 *   met de ingeklapte varianten en een wijzigpaneel open;
 * - alle downloads in stap 4 leveren een bestand op.
 * Op laptop (1366×768), digibord (1920×1080) en telefoon (375 px), in licht en donker.
 *
 * Gebruik:  node tools/controleer-site.cjs [adres]
 *   standaard: https://sandermordant.github.io/uniekind/
 *   lokaal:    npm run site, dan een webserver op site/ en node tools/controleer-site.cjs http://127.0.0.1:4173/
 * Nodig: Playwright met Chromium (staat klaar in Claude-cloudsessies; anders: npm i -D playwright && npx playwright install chromium).
 * Uitkomst: een lijst met problemen; exitcode 1 als er iets mis is.
 */
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const BASE = process.argv[2] ?? 'https://sandermordant.github.io/uniekind/';
const HOST = new URL(BASE).host;
const AXE = readFileSync(join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const ROUTES = ['', 'examenklas', 'klas', 'les-maken', 'examenopgave', 'examenstof', 'materiaal', 'bibliotheek', 'begin-hier', 'visie',
  'invulformulier', 'les-openen', 'digibord', 'hulp', 'mijn-profiel', 'privacy', 'schoolprofiel',
  'werkvorm-abcd-kaarten', 'werkvorm-wisbordjes', 'werkvorm-drie-twee-een'];
const SCHERMEN = { laptop: { width: 1366, height: 768 }, digibord: { width: 1920, height: 1080 }, telefoon: { width: 375, height: 740 } };

(async () => {
  const browser = await chromium.launch();
  const problemen = [];
  let controles = 0;
  for (const thema of ['light', 'dark']) for (const [scherm, viewport] of Object.entries(SCHERMEN)) {
    const ctx = await browser.newContext({ viewport, colorScheme: thema, acceptDownloads: true });
    const p = await ctx.newPage();
    const log = [];
    p.on('pageerror', (e) => log.push(`fout in script: ${e.message}`));
    p.on('console', (m) => m.type() === 'error' && log.push(`console: ${m.text()}`));
    p.on('response', (r) => r.status() >= 400 && log.push(`HTTP ${r.status()} ${r.url()}`));
    p.on('request', (r) => { const h = new URL(r.url()).host; if (h && h !== HOST && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) log.push(`verbinding met andere site: ${h}`); });
    const meld = (waar, wat) => problemen.push(`${thema} · ${scherm} · ${waar}: ${wat}`);
    const controleer = async (waar) => {
      controles++;
      await p.waitForTimeout(300);
      await p.addScriptTag({ content: AXE });
      const axe = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }))
        .violations.map((v) => `axe ${v.id} (${v.impact}, ${v.nodes.length}×) ${v.nodes[0]?.target}`));
      const breed = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      axe.forEach((a) => meld(waar, a));
      if (breed > 0) meld(waar, `pagina is ${breed}px te breed`);
      log.splice(0).forEach((l) => meld(waar, l));
    };

    for (const r of ROUTES) {
      await p.goto(BASE + (r ? `#${r}` : ''), { waitUntil: 'networkidle' });
      if (await p.$('.laden')) meld(r || 'start', 'blijft hangen op "wordt geladen"');
      await controleer(r || 'start');
    }

    // Een les van begin tot eind
    try {
      await p.goto(BASE + '#les-maken', { waitUntil: 'networkidle' });
      await p.selectOption('#v-context-afdeling', { label: 'havo' });
      await p.waitForTimeout(300);
      await p.fill('#v-inhoud-onderwerp', 'Betogende teksten');
      await p.getByLabel('100 min').check();
      await p.click('text=Genereer de les →');
      await controleer('lesmaker stap 2');
      // De andere twee varianten staan ingeklapt; klap ze open om alle drie te controleren
      if (await p.locator('details.andere-varianten > summary').count()) {
        await p.locator('details.andere-varianten > summary').click();
        await controleer('lesmaker stap 2, alle varianten open');
      }
      const regels = (await p.locator('main').innerText()).split('\n').filter((l) => /^\d+′/.test(l));
      const varianten = [];
      for (const l of regels) { if (/Opening/.test(l) || !varianten.length) varianten.push(0); varianten[varianten.length - 1] += +l.match(/^\d+/)[0]; }
      if (varianten.length !== 3 || varianten.some((m) => m !== 100)) meld('lesmaker stap 2', `varianten duren ${varianten.join(', ')} minuten (verwacht 3× 100)`);
      if ((await p.locator('text=Voldoet aan alle eisen').count()) < 3) meld('lesmaker stap 2', 'niet elke variant voldoet aan alle eisen');
      await p.click('text=Kies de bovenste variant →');
      await controleer('lesmaker stap 3');
      // Een wijzigpaneel openen: knoppen, keuzelijst en uitleg moeten ook in orde zijn
      if (await p.locator('.fase [data-actie="wijzig"]').count()) {
        await p.locator('.fase [data-actie="wijzig"]').nth(3).click();
        if (!(await p.locator('.fase .wijzigpaneel').count())) meld('lesmaker stap 3', 'Wijzig opent geen paneel');
        await controleer('lesmaker stap 3, Wijzig open');
      }
      await p.locator('main button', { hasText: 'Volgende →' }).click();
      await controleer('lesmaker stap 4');
      if (scherm === 'laptop' && thema === 'light') {
        const knoppen = p.locator('main button', { hasText: /^(Alles als PDF|Alles als Word|Presentatie \(\.pptx\)|Lesbestand bewaren|Dit document als PDF|Dit document als Word)$/ });
        const n = await knoppen.count();
        if (n < 6) meld('lesmaker stap 4', `${n} van de 6 downloadknoppen gevonden`);
        for (let i = 0; i < n; i++) {
          const tekst = (await knoppen.nth(i).textContent()).trim();
          try {
            const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), knoppen.nth(i).click()]);
            if (!(await d.path())) meld('lesmaker stap 4', `download "${tekst}" is leeg`);
          } catch { meld('lesmaker stap 4', `download "${tekst}" levert geen bestand op`); }
        }
      }
    } catch (e) { meld('lesmaker', `kon de les niet doorlopen: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
  await browser.close();
  console.log(`${BASE}\n${controles} controles, ${problemen.length} problemen`);
  problemen.forEach((x) => console.log(' - ' + x));
  process.exit(problemen.length ? 1 : 0);
})();
