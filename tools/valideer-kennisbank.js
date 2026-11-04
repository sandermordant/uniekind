#!/usr/bin/env node
/**
 * Uniekind – validatie van kennisbank en schoolprofielen.
 *
 * Gebruik:  npm run valideer
 *
 * Wat het doet:
 *  1. Controleert elk werkvorm-item tegen public/data/werkvormen/werkvorm.schema.json.
 *  2. Doet extra inhoudelijke controles (unieke id's, telefoon nooit, als-dan bij checks, bronnen bestaan, …).
 *  3. Controleert elk schoolprofiel tegen public/profiles/profiel.schema.json.
 *  4. Schrijft public/data/werkvormen/index.json: een lichte samenvatting voor de bibliotheek
 *     (zodat de site de volledige items pas laadt als ze nodig zijn).
 *
 * Bij fouten stopt het script met exitcode 1, zodat een build niet doorgaat met een kapotte kennisbank.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wvDir = join(root, 'public/data/werkvormen');
const profDir = join(root, 'public/profiles');

const lees = (p) => JSON.parse(readFileSync(p, 'utf8'));
const fouten = [];
const waarschuwingen = [];
const fout = (w, m) => fouten.push(`✗ ${w}: ${m}`);
const let_op = (w, m) => waarschuwingen.push(`! ${w}: ${m}`);

const ajv = new Ajv2020({ allErrors: true, strict: false });
const wvSchema = lees(join(wvDir, 'werkvorm.schema.json'));
const valideerItem = ajv.compile(wvSchema);
const bronnen = lees(join(root, 'public/data/bronnen.json')).bronnen;

const bestanden = readdirSync(wvDir)
  .filter((f) => f.endsWith('.json') && !['werkvorm.schema.json', 'index.json'].includes(f))
  .sort();

const ids = new Map();
const alleItems = [];
const index = { gegenereerd: 'door tools/valideer-kennisbank.js – niet met de hand aanpassen', categorieen: [], items: [] };

for (const bestand of bestanden) {
  let data;
  try {
    data = lees(join(wvDir, bestand));
  } catch (e) {
    fout(bestand, `geen geldige JSON (${e.message})`);
    continue;
  }
  if (!data.categorie || !Array.isArray(data.items)) {
    fout(bestand, 'verwacht { "categorie": "...", "items": [ ... ] }');
    continue;
  }
  index.categorieen.push({ categorie: data.categorie, titel: data.titel, bestand, aantal: data.items.length });

  for (const item of data.items) {
    const w = `${bestand} › ${item.id ?? '(zonder id)'}`;
    if (!valideerItem(item)) {
      for (const e of valideerItem.errors) fout(w, `${e.instancePath || '(item)'} ${e.message}${e.params?.allowedValues ? ' ' + JSON.stringify(e.params.allowedValues) : ''}${e.params?.additionalProperty ? ' (' + e.params.additionalProperty + ')' : ''}`);
      continue;
    }
    // Inhoudelijke controles
    if (ids.has(item.id)) fout(w, `id komt ook voor in ${ids.get(item.id)}`);
    ids.set(item.id, bestand);
    if (item.categorie !== data.categorie) fout(w, `categorie "${item.categorie}" past niet bij bestand (${data.categorie})`);
    if (item.duur.min > item.duur.max) fout(w, 'duur.min is groter dan duur.max');
    if (item.vereist.plein && !item.ruimte.plein) fout(w, 'vereist een plein maar ruimte.plein is false');
    if (item.vereist.plein && item.ruimte.L) fout(w, 'vereist een plein maar zegt ook te werken in een L-lokaal (daar is geen plein)');
    if (!item.ruimte.M && !item.ruimte.L && !item.ruimte.plein && !item.ruimte.stilte) fout(w, 'werkt in geen enkele ruimte');
    if (item.categorie === 'formatieve-check' && !(item.alsDan && item.alsDan.length >= 2)) fout(w, 'een formatieve check heeft minimaal twee als-dan-regels nodig');
    const vakken = new Set(item.vakvoorbeelden.map((v) => v.vak.toLowerCase()));
    if (vakken.size < 3) fout(w, 'minimaal drie vakvoorbeelden uit verschillende vakken');
    for (const b of item.bronnen) if (!bronnen[b]) fout(w, `bron "${b}" staat niet in data/bronnen.json`);
    if (item.bewijs !== 'praktijk' && item.bronnen.length === 0) let_op(w, `bewijs "${item.bewijs}" maar geen bronnen`);
    const tekst = JSON.stringify(item).toLowerCase();
    if (/\b(telefoon|smartphone|mobiel|gsm)\b/.test(item.middelen.lijst.join(' ').toLowerCase())) fout(w, 'middelen noemen een telefoon; dat is nooit toegestaan');
    if (/\b(app op je telefoon|met je telefoon|pak je telefoon)\b/.test(tekst)) fout(w, 'tekst vraagt om een telefoon');
    if (item.beweegmoment && !item.ruimte.beweging && item.energie !== 'actief') let_op(w, 'beweegmoment zonder beweging of actieve energie');
    if (item.beginHier && item.instapniveau !== 1) fout(w, 'een Begin hier-werkvorm moet instapniveau 1 hebben');
    alleItems.push(item);

    index.items.push({
      id: item.id, naam: item.naam, alias: item.alias, categorie: item.categorie, kort: item.kort,
      duur: item.duur, groepsvorm: item.groepsvorm, ruimte: item.ruimte, laptop: item.middelen.laptop,
      voorbereiding: item.voorbereiding, lesfase: item.lesfase, denkniveau: item.denkniveau,
      differentiatie: item.differentiatie, ondersteuning: Object.fromEntries(Object.entries(item.ondersteuning).map(([k, v]) => [k, v.past])),
      energie: item.energie, instapniveau: item.instapniveau, burgerschap: item.burgerschap,
      beginHier: item.beginHier?.volgorde ?? null, bestand
    });
  }
}

// Begin hier: precies 10, volgorde 1 t/m 10
const bh = alleItems.filter((i) => i.beginHier).map((i) => i.beginHier.volgorde).sort((a, b) => a - b);
if (bh.length !== 10) let_op('Begin hier', `${bh.length} van de 10 werkvormen gemarkeerd`);
if (new Set(bh).size !== bh.length) fout('Begin hier', 'dubbele volgnummers');

// Profielen
const profSchema = lees(join(profDir, 'profiel.schema.json'));
const valideerProfiel = ajv.compile(profSchema);
for (const p of readdirSync(profDir).filter((f) => f.endsWith('.json') && f !== 'profiel.schema.json')) {
  const prof = lees(join(profDir, p));
  if (!valideerProfiel(prof)) for (const e of valideerProfiel.errors) fout(`profiel ${p}`, `${e.instancePath} ${e.message}`);
  const afd = new Set(prof.afdelingen?.map((a) => a.id));
  for (const a of prof.afdelingen ?? []) if (!a.lesduren.includes(a.standaardLesduur)) fout(`profiel ${p}`, `standaardLesduur van ${a.id} staat niet in lesduren`);
  for (const v of prof.vakken ?? []) if (Array.isArray(v.afdelingen)) for (const x of v.afdelingen) if (!afd.has(x)) fout(`profiel ${p}`, `vak ${v.id} noemt onbekende afdeling ${x}`);
  if (prof.regels?.telefoon?.toegestaan) let_op(`profiel ${p}`, 'telefoon toegestaan: Uniekind stelt alsnog geen telefoonwerkvormen voor');
}

// Leerdoelenkaders van SLO (tools/importeer-slo.js): index en bestanden moeten kloppen
const kaderDir = join(root, 'public/data/kaders');
let kaderAantal = 0;
try {
  const ki = lees(join(kaderDir, 'index.json'));
  for (const k of ki.kaders) {
    kaderAantal++;
    let data;
    try { data = lees(join(kaderDir, k.bestand)); } catch { fout(`kader ${k.id}`, `bestand ${k.bestand} ontbreekt of is geen JSON`); continue; }
    if (data.id !== k.id || !Array.isArray(data.items) || !data.items.length) fout(`kader ${k.id}`, 'id klopt niet of er staan geen regels in');
  }
} catch { let_op('kaders', 'public/data/kaders/index.json ontbreekt; draai tools/importeer-slo.js'); }

// Samenvatting
const perCat = {};
for (const i of alleItems) perCat[i.categorie] = (perCat[i.categorie] ?? 0) + 1;
console.log('\nUniekind kennisbank');
console.log('───────────────────');
for (const [c, n] of Object.entries(perCat)) console.log(`  ${c.padEnd(22)} ${n}`);
console.log(`  ${'totaal'.padEnd(22)} ${alleItems.length}`);
console.log(`  ${'Begin hier'.padEnd(22)} ${bh.length}/10`);
console.log(`  ${'SLO-kaders'.padEnd(22)} ${kaderAantal}`);
const nogControleren = Object.entries(bronnen).filter(([, b]) => b.status !== 'gecontroleerd').map(([k]) => k);
if (nogControleren.length) console.log(`  bronnen nog controleren: ${nogControleren.join(', ')}`);

if (waarschuwingen.length) console.log('\nLet op:\n' + waarschuwingen.join('\n'));
if (fouten.length) {
  console.error(`\n${fouten.length} fout(en):\n` + fouten.join('\n'));
  process.exit(1);
}
index.items.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
writeFileSync(join(wvDir, 'index.json'), JSON.stringify(index, null, 1) + '\n');
console.log('\n✓ Alles geldig. index.json bijgewerkt.\n');
