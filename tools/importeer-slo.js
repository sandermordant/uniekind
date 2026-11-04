#!/usr/bin/env node
/**
 * Importeert kerndoelen, examenprogramma's en syllabi uit de open data van SLO (licentie MIT):
 *   https://github.com/slonl/curriculum-kerndoelen
 *   https://github.com/slonl/curriculum-examenprogramma
 *   https://github.com/slonl/curriculum-syllabus
 *   https://github.com/slonl/curriculum-fo           (nieuwe kerndoelen en praktijkgerichte programma's)
 *
 * Gebruik (eenmaal per jaar, als SLO een nieuwe release heeft):
 *   mkdir slo && cd slo
 *   git clone --depth 1 https://github.com/slonl/curriculum-kerndoelen
 *   git clone --depth 1 https://github.com/slonl/curriculum-examenprogramma
 *   git clone --depth 1 https://github.com/slonl/curriculum-syllabus
 *   git clone --depth 1 https://github.com/slonl/curriculum-fo
 *   cd .. && npm run importeer-slo -- slo
 *
 * Schrijft public/data/kaders/index.json en één bestand per kader. Alleen tekst, geen code.
 * Welke SLO-kaders bij welk Uniekind-vak horen, staat in VAKKEN hieronder: dat kun je aanvullen.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const bron = process.argv[2];
if (!bron || !existsSync(join(bron, 'curriculum-examenprogramma'))) {
  console.error('Geef de map op waarin de SLO-repositories staan (zie de uitleg bovenin dit bestand).');
  process.exit(1);
}
const uit = 'public/data/kaders';
const lees = (repo, bestand) => JSON.parse(readFileSync(join(bron, repo, 'data', bestand), 'utf8'));
const perId = (lijst) => new Map(lijst.map((x) => [x.id, x]));
const versieVan = (repo) => {
  try { return execSync(`git -C "${join(bron, repo)}" log -1 --format=%cs`, { encoding: 'utf8' }).trim(); } catch { return null; }
};

/* ── Welke SLO-kaders horen bij welk vak in Uniekind ──
   ep: examenprogramma's (titel bevat), kd: vakleergebied bij de kerndoelen onderbouw VO,
   fo: nieuwe kerndoelen of programma's (titel van de set bevat). */
const VAKKEN = {
  nederlands: { ep: ['Nederlandse taal'], kd: ['Nederlands'], fo: ['Kerndoelen Nederlands'] },
  engels: { ep: ['vreemde talen Engels'], kd: ['Engels'], fo: ['Kerndoelen Engels'] },
  duits: { ep: ['vreemde talen Duits'], fo: ['Kerndoelen moderne vreemde talen'] },
  frans: { ep: ['vreemde talen Frans'], fo: ['Kerndoelen moderne vreemde talen'] },
  latijn: { ep: ['Latijnse taal'] },
  grieks: { ep: ['Griekse taal'] },
  wiskunde: { ep: ['Wiskunde'], kd: ['Rekenen en wiskunde'], fo: ['Kerndoelen rekenen en wiskunde'] },
  rekenen: { kd: ['Rekenen en wiskunde'], fo: ['Kerndoelen rekenen en wiskunde'] },
  geschiedenis: { ep: ['Geschiedenis'], kd: ['Geschiedenis'], fo: ['Kerndoelen mens en maatschappij'] },
  aardrijkskunde: { ep: ['Aardrijkskunde'], kd: ['Aardrijkskunde'], fo: ['Kerndoelen mens en maatschappij'] },
  economie: { ep: ['Examenprogramma Economie'], kd: ['Economie'], fo: ['Kerndoelen mens en maatschappij'] },
  bedrijfseconomie: { ep: ['Bedrijfseconomie'] },
  maatschappijleer: { ep: ['Maatschappijleer'], kd: ['Mens en maatschappij'], fo: ['Kerndoelen burgerschap'] },
  biologie: { ep: ['Biologie'], kd: ['Biologie'], fo: ['Kerndoelen mens en natuur'] },
  natuurkunde: { ep: ['Natuurkunde', 'Natuur- en scheikunde I vmbo'], kd: ['Natuurkunde', 'Natuur- en scheikunde I'], fo: ['Kerndoelen mens en natuur'] },
  scheikunde: { ep: ['Scheikunde', 'Natuur- en scheikunde II'], kd: ['Scheikunde'], fo: ['Kerndoelen mens en natuur'] },
  informatica: { ep: ['Informatica'], fo: ['Kerndoelen digitale geletterdheid'] },
  kunst: { ep: ['Beeldende vorming', 'Kunst (beeldende', 'Kunst (algemeen)', 'Tekenen', 'Handvaardigheid', 'Textiele'], kd: ['Kunst en cultuur'], fo: ['Kerndoelen kunst en cultuur'] },
  muziek: { ep: ['Muziek', 'Kunst (muziek)'], kd: ['Kunst en cultuur'], fo: ['Kerndoelen kunst en cultuur'] },
  drama: { ep: ['Drama', 'Kunst (drama)'], kd: ['Kunst en cultuur'], fo: ['Kerndoelen kunst en cultuur'] },
  ckv: { ep: ['Culturele en kunstzinnige vorming', 'Kunstvakken incl. CKV'], kd: ['Kunst en cultuur'], fo: ['Kerndoelen kunst en cultuur'] },
  lo: { ep: ['Lichamelijke opvoeding'], kd: ['Bewegen en sport'], fo: ['Kerndoelen bewegen en sport'] },
  filosofie: { ep: ['Filosofie'] },
  'digitale-geletterdheid': { fo: ['Kerndoelen digitale geletterdheid'] },
  mm: { kd: ['Mens en maatschappij'], fo: ['Kerndoelen mens en maatschappij', 'Kerndoelen burgerschap'] },
  mn: { kd: ['Mens en natuur'], fo: ['Kerndoelen mens en natuur'] },
  tt: { kd: ['Techniek'], fo: ['praktijkgericht programma Technologie en Toepassing'] },
  oo: { kd: ['Mens en natuur'], fo: ['onderzoek en ontwerpen'] },
  dp: { fo: ['praktijkgericht programma Dienstverlening en Producten'] }
};

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const tekst = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

function niveausUitTitel(t) {
  const s = t.toLowerCase();
  if (/vmbo-bb/.test(s)) return ['vmbo-bb'];
  if (/vmbo-kb/.test(s)) return ['vmbo-kb'];
  if (/gl\/tl/.test(s)) return ['vmbo-gltl'];
  if (/praktijkgericht programma/.test(s)) return ['vmbo-gltl'];
  if (/\bvmbo\b/.test(s)) return ['vmbo-bb', 'vmbo-kb', 'vmbo-gltl'];
  const n = [];
  if (/\bhavo\b|\/h$/.test(s)) n.push('havo');
  if (/\bvwo\b|\/v$/.test(s)) n.push('vwo');
  return n.length ? n : ['havo', 'vwo'];
}
const vakkenVoor = (soort, titel) => Object.entries(VAKKEN).filter(([, m]) => (m[soort] ?? []).some((w) => (soort === 'kd' ? titel === w : titel.includes(w)))).map(([v]) => v);

const kaders = [];
const ids = new Set();
function bewaar(k) {
  if (!k.vakken.length || !k.items.length) return;
  let id = k.id, n = 2;
  while (ids.has(id)) id = `${k.id}-${n++}`;
  ids.add(id); k.id = id;
  const tel = (l) => l.reduce((n, x) => n + 1 + tel(x.k ?? []), 0);
  k.aantal = tel(k.items);
  writeFileSync(join(uit, `${k.id}.json`), JSON.stringify(k) + '\n');
  const { items, ...kort } = k;
  kaders.push({ ...kort, bestand: `${k.id}.json` });
}

rmSync(uit, { recursive: true, force: true });
mkdirSync(uit, { recursive: true });

/* 1. Kerndoelen onderbouw VO (geldend sinds 2006) */
{
  const kd = perId(lees('curriculum-kerndoelen', 'kerndoelen.json'));
  for (const vlg of lees('curriculum-kerndoelen', 'vakleergebieden.json')) {
    const vo = (vlg.kerndoel_id ?? []).map((i) => kd.get(i)).filter((x) => x && x.prefix.startsWith('VO '));
    if (!vo.length) continue;
    vo.sort((a, b) => a.prefix.localeCompare(b.prefix, 'nl', { numeric: true }));
    bewaar({
      id: `kerndoelen-onderbouw-${slug(vlg.title)}`, titel: `Kerndoelen onderbouw: ${vlg.title}`, soort: 'kerndoelen', status: 'geldend',
      niveaus: ['onderbouw'], vakken: vakkenVoor('kd', vlg.title),
      bron: { naam: 'SLO, kerndoelen onderbouw VO', repo: 'slonl/curriculum-kerndoelen', versie: versieVan('curriculum-kerndoelen') },
      items: vo.map((x) => ({ c: x.prefix.replace('VO Kerndoel ', 'Kerndoel '), t: tekst(x.title), kop: tekst(x.description) }))
    });
  }
}

/* 2. Examenprogramma's (geldend) met domeinen, subdomeinen en eindtermen */
const epLijst = lees('curriculum-examenprogramma', 'examenprogramma.json');
{
  const dom = perId(lees('curriculum-examenprogramma', 'domeinen.json'));
  const sub = perId(lees('curriculum-examenprogramma', 'subdomeinen.json'));
  const et = perId(lees('curriculum-examenprogramma', 'eindtermen.json'));
  const vlag = (x) => ({ ...(x.ce ? { ce: 1 } : {}), ...(x.se ? { se: 1 } : {}) });
  const eind = (ids) => (ids ?? []).map((i) => et.get(i)).filter(Boolean).map((x) => ({ c: tekst(x.prefix ?? '').split('/').pop(), t: tekst(x.title), ...vlag(x) }));
  for (const ep of epLijst) {
    const vakken = vakkenVoor('ep', ep.title);
    const items = (ep.examenprogramma_domein_id ?? []).map((i) => dom.get(i)).filter(Boolean).map((d) => ({
      c: tekst(d.prefix ?? '').split('/').pop(), t: tekst(d.title), ...vlag(d),
      k: [
        ...(d.examenprogramma_subdomein_id ?? []).map((i) => sub.get(i)).filter(Boolean).map((s) => ({ c: tekst(s.prefix ?? '').split('/').pop(), t: tekst(s.title), ...vlag(s), k: eind(s.examenprogramma_eindterm_id) })),
        ...eind(d.examenprogramma_eindterm_id)
      ]
    }));
    bewaar({
      id: `examenprogramma-${slug(ep.prefix || ep.title)}`, titel: tekst(ep.title), soort: 'examenprogramma', status: 'geldend',
      niveaus: niveausUitTitel(`${ep.title} ${ep.prefix}`), vakken,
      bron: { naam: 'SLO, examenprogramma', repo: 'slonl/curriculum-examenprogramma', versie: versieVan('curriculum-examenprogramma'), url: ep.url || null, ingang: tekst(ep.ingangsdatum) || null },
      items
    });
  }
}

/* 3. Syllabi: per examenprogramma en per leerweg (bb, kb, gl, tl) de nieuwste, met de specifieke eindtermen per domein */
{
  const ep = perId(epLijst);
  const se = perId(lees('curriculum-syllabus', 'specifieke_eindtermen.json'));
  const leerweg = (t) => (t.match(/\bvmbo (bb|kb|gl|tl)\b/i)?.[1] ?? '').toLowerCase();
  const nieuwste = new Map();
  for (const s of lees('curriculum-syllabus', 'syllabus.json')) {
    for (const e of s.examenprogramma_id ?? []) {
      const sleutel = `${e}|${leerweg(s.title)}`;
      const oud = nieuwste.get(sleutel);
      const jaar = Number(s.examenjaar) || 0;
      if (!oud || jaar > oud.jaar || (jaar === oud.jaar && s.syllabus_specifieke_eindterm_id.length > oud.s.syllabus_specifieke_eindterm_id.length)) nieuwste.set(sleutel, { jaar, s });
    }
  }
  // Een algemene vmbo-syllabus vervalt als er even nieuwe of nieuwere per leerweg zijn
  for (const [sleutel, { jaar }] of [...nieuwste]) {
    const [e, lw] = sleutel.split('|');
    if (!lw && [...nieuwste].some(([k, v]) => k !== sleutel && k.startsWith(`${e}|`) && v.jaar >= jaar)) nieuwste.delete(sleutel);
  }
  // Eén syllabus kan bij meerdere examenprogramma's horen (bijvoorbeeld de beeldende vakken): één keer opnemen
  const perSyllabus = new Map();
  for (const [sleutel, { s }] of nieuwste) {
    const e = ep.get(sleutel.split('|')[0]);
    if (!e) continue;
    const lw = leerweg(s.title);
    const niveaus = lw === 'bb' ? ['vmbo-bb'] : lw === 'kb' ? ['vmbo-kb'] : lw ? ['vmbo-gltl'] : niveausUitTitel(`${e.title} ${e.prefix}`);
    const al = perSyllabus.get(s.id) ?? { s, vakken: new Set(), niveaus: new Set() };
    vakkenVoor('ep', e.title).forEach((v) => al.vakken.add(v));
    niveaus.forEach((n) => al.niveaus.add(n));
    perSyllabus.set(s.id, al);
  }
  for (const { s, vakken, niveaus } of perSyllabus.values()) {
    const groepen = new Map();
    for (const x of s.syllabus_specifieke_eindterm_id.map((i) => se.get(i)).filter(Boolean)) {
      const delen = tekst(x.prefix ?? '').split('/');
      const domein = delen.find((d) => /^domein/i.test(d))?.replace(/^domein/i, 'Domein ') ?? 'Overig';
      if (!groepen.has(domein)) groepen.set(domein, []);
      groepen.get(domein).push({ c: delen.pop() || '', t: tekst(x.title), ...(x.ce ? { ce: 1 } : {}) });
    }
    const items = [...groepen].sort(([a], [b]) => a.localeCompare(b, 'nl', { numeric: true })).map(([d, k]) => ({ c: d, t: d, k: k.sort((a, b) => a.c.localeCompare(b.c, 'nl', { numeric: true })) }));
    bewaar({
      id: `syllabus-${slug(s.title.replace(/^Syllabus /, ''))}`, titel: tekst(s.title), soort: 'syllabus', status: 'geldend',
      niveaus: [...niveaus], vakken: [...vakken],
      bron: { naam: 'SLO/CvTE, syllabus centraal examen', repo: 'slonl/curriculum-syllabus', versie: versieVan('curriculum-syllabus'), url: s.url || null, examenjaar: s.examenjaar || null },
      items
    });
  }
}

/* 4. Nieuwe kerndoelen en praktijkgerichte programma's (curriculum-fo) */
{
  const pad = join(bron, 'curriculum-fo');
  if (existsSync(pad)) {
    const fd = perId(lees('curriculum-fo', 'domeinen.json'));
    const fs = perId(lees('curriculum-fo', 'subdomeinen.json'));
    const fk = perId(lees('curriculum-fo', 'kernzinnen.json'));
    const fz = perId(lees('curriculum-fo', 'doelzinnen.json'));
    const doel = (ids) => {
      const gezien = new Set();
      return (ids ?? []).map((i) => fz.get(i)).filter(Boolean).filter((z) => !gezien.has(z.description) && gezien.add(z.description))
        .map((z) => ({ c: `${z.soort === 'eindterm' ? 'Eindterm' : 'Doel'} ${tekst(z.prefix)}`.trim(), t: tekst(z.description) }));
    };
    for (const set of lees('curriculum-fo', 'sets.json')) {
      const vakken = vakkenVoor('fo', set.title).filter(() => !/^Functionele/.test(set.title));
      if (!vakken.length) continue;
      const kern = /^Kerndoelen/.test(set.title);
      const items = (set.fo_domein_id ?? []).map((i) => fd.get(i)).filter(Boolean).map((d) => {
        const gezien = new Set();
        const k = [
          // Kernzinnen met dezelfde tekst (zelfde kerndoel voor po en vo) maar één keer
          ...(d.fo_kernzin_id ?? []).map((i) => fk.get(i)).filter((x) => x && !gezien.has(x.description) && gezien.add(x.description))
            .map((x) => ({ c: 'Kerndoel', t: tekst(x.description), k: doel(x.fo_doelzin_id) })),
          ...(d.fo_subdomein_id ?? []).map((i) => fs.get(i)).filter(Boolean).map((x) => ({ c: tekst(x.prefix), t: tekst(x.description || x.title), k: doel(x.fo_doelzin_id) })),
          ...doel(d.fo_doelzin_id)
        ];
        return { c: tekst(d.prefix), t: tekst(d.title) + (d.description ? `: ${tekst(d.description)}` : ''), k };
      });
      bewaar({
        id: `nieuw-${slug(set.title)}`, titel: tekst(set.title), soort: kern ? 'kerndoelen' : 'examenprogramma',
        status: set.status === 'definitief' ? 'geldend' : 'concept',
        niveaus: kern ? ['onderbouw'] : niveausUitTitel(set.title), vakken,
        bron: { naam: kern ? 'SLO, nieuwe kerndoelen (definitief concept, nog niet wettelijk vastgesteld)' : `SLO, ${set.status === 'definitief' ? 'examenprogramma' : 'conceptexamenprogramma'}`, repo: 'slonl/curriculum-fo', versie: versieVan('curriculum-fo') },
        items
      });
    }
  }
}

const SOORT = { kerndoelen: 0, examenprogramma: 1, syllabus: 2 };
kaders.sort((a, b) => (SOORT[a.soort] - SOORT[b.soort]) || (a.status === b.status ? 0 : a.status === 'geldend' ? -1 : 1) || a.titel.localeCompare(b.titel, 'nl'));
writeFileSync(join(uit, 'index.json'), JSON.stringify({
  toelichting: 'Gemaakt door tools/importeer-slo.js uit de open data van SLO (licentie MIT). Niet met de hand aanpassen: draai het script opnieuw.',
  licentie: 'Bron: SLO, nationaal expertisecentrum leerplanontwikkeling. Open data onder MIT-licentie, https://github.com/slonl',
  gemaakt: new Date().toISOString().slice(0, 10),
  kaders
}, null, 1) + '\n');
const per = {};
for (const k of kaders) for (const v of k.vakken) per[v] = (per[v] ?? 0) + 1;
console.log(`${kaders.length} kaders geschreven naar ${uit}/`);
console.log(Object.entries(per).map(([v, n]) => `${v}: ${n}`).join(' · '));
const zonder = Object.keys(VAKKEN).filter((v) => !per[v]);
if (zonder.length) console.log('Zonder kader:', zonder.join(', '));
