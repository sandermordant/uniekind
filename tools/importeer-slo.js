#!/usr/bin/env node
/**
 * Importeert alle leerdoelen van SLO uit de open data (licentie MIT), voor vmbo, mavo, havo en vwo:
 *   https://github.com/slonl/curriculum-kerndoelen         kerndoelen onderbouw VO (geldend)
 *   https://github.com/slonl/curriculum-examenprogramma    alle examenprogramma's: domeinen, subdomeinen, eindtermen
 *   https://github.com/slonl/curriculum-syllabus           alle syllabi: specifieke eindtermen, toelichtingen, vakbegrippen
 *   https://github.com/slonl/curriculum-fo                 nieuwe kerndoelen, praktijkgerichte en conceptexamenprogramma's
 *   https://github.com/slonl/curriculum-leerdoelenkaarten  leerdoelenkaarten: de onderwerpen per vak
 *
 * Gebruik (eenmaal per jaar, als SLO een nieuwe release heeft):
 *   mkdir slo && cd slo
 *   for r in kerndoelen examenprogramma syllabus fo leerdoelenkaarten; do git clone --depth 1 https://github.com/slonl/curriculum-$r; done
 *   cd .. && npm run importeer-slo -- slo
 *
 * Schrijft public/data/kaders/index.json en één bestand per vak (alle kaders van dat vak samen).
 * Alleen tekst, geen code. Welke SLO-vakken bij welk Uniekind-vak horen, staat in VAK_NAAR_UNIEKIND.
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
const heeft = (repo) => existsSync(join(bron, repo, 'data'));
const lees = (repo, bestand) => JSON.parse(readFileSync(join(bron, repo, 'data', bestand), 'utf8'));
const perId = (lijst) => new Map(lijst.map((x) => [x.id, x]));
const versieVan = (repo) => { try { return execSync(`git -C "${join(bron, repo)}" log -1 --format=%cs`, { encoding: 'utf8' }).trim(); } catch { return null; } };
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const tekst = (s, max = 4000) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const groot = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ── Eén naam per vak, zodat examenprogramma, syllabus en nieuwe programma's bij elkaar komen ── */
const ALIAS = {
  'nederlandse taal en literatuur': 'Nederlands', 'nederlandse taal': 'Nederlands',
  'engelse taal en cultuur': 'Engels', 'duitse taal en cultuur': 'Duits', 'franse taal en cultuur': 'Frans',
  'spaanse taal en cultuur': 'Spaans', 'italiaanse taal en cultuur': 'Italiaans', 'russische taal en cultuur': 'Russisch',
  'turkse taal en cultuur': 'Turks', 'arabische taal en cultuur': 'Arabisch', 'chinese taal en cultuur': 'Chinees',
  'friese taal en cultuur': 'Fries', 'friese taal': 'Fries', 'latijnse taal en cultuur': 'Latijn', 'griekse taal en cultuur': 'Grieks',
  'geschiedenis en staatsinrichting': 'Geschiedenis', 'culturele en kunstzinnige vorming': 'CKV', 'culturele kunstzinnige vorming': 'CKV',
  'kunstvakken incl. ckv': 'CKV', 'kunst (muziek)': 'Muziek', 'kunst (drama)': 'Drama', 'theater': 'Drama', 'kunst (dans)': 'Dans',
  'kunst (beeldende vormgeving)': 'Beeldende vakken', 'kunst (beeldende vorming)': 'Beeldende vakken', 'kunst (algemeen)': 'Beeldende vakken',
  'beeldende vorming': 'Beeldende vakken', 'beeldend': 'Beeldende vakken', 'tekenen': 'Beeldende vakken', 'handvaardigheid': 'Beeldende vakken', 'textiele vormgeving': 'Beeldende vakken',
  'lichamelijke opvoeding 1': 'Lichamelijke opvoeding', 'lichamelijke opvoeding 2': 'Lichamelijke opvoeding',
  'natuur- en scheikunde i': 'Natuurkunde', 'natuur- en scheikunde ii': 'Scheikunde', 'scheikunde (naskii)': 'Scheikunde',
  'wiskunde a': 'Wiskunde', 'wiskunde b': 'Wiskunde', 'wiskunde c': 'Wiskunde', 'wiskunde d': 'Wiskunde',
  'wiskunde maatschappij': 'Wiskunde', 'wiskunde natuur': 'Wiskunde', 'wiskunde techniek': 'Wiskunde', 'wiskunde maatschappij c&m': 'Wiskunde', 'gecijferdheid': 'Wiskunde',
  'rekenen en wiskunde': 'Wiskunde', 'onderzoek en ontwerpen': 'O&O (Onderzoeken en Ontwerpen)', 'technologie en toepassing': 'T&T (Technologie en Toepassing)',
  'techniek': 'T&T (Technologie en Toepassing)', 'dienstverlening en producten': 'D&P (Dienstverlening en Producten)',
  'natuur, leven en technologie': 'NLT (Natuur, leven en technologie)', 'algemene natuurwetenschappen': 'ANW (Algemene natuurwetenschappen)',
  'management en organisatie': 'Bedrijfseconomie', 'bewegen, sport en maatschappij': 'BSM (Bewegen, sport en maatschappij)',
  'maatschappijwetenschappen': 'Maatschappijwetenschappen', 'maatschappijkunde': 'Maatschappijkunde', 'informatietechnologie': 'Informatica'
};
function vakNaam(ruw) {
  let s = String(ruw).replace(/^(Definitief )?(concept)?examenprogramma\s+/i, '').replace(/^Examenprogramma\s+/i, '')
    .replace(/^praktijkgericht programma\s+/i, '').replace(/^(Functionele )?kerndoelen\s+/i, '').replace(/^Syllabus\s+/i, '')
    .replace(/^Moderne vreemde talen\s+/i, '').replace(/\s+-\s+(kleine|grote) variant$/i, '')
    .replace(/\s+(vmbo|havo|vwo)(-?(bb|kb|gl\/tl|gl|tl))?(\s+(bb|kb|gl|tl|gl\/tl|gl en tl))?(\s+\d{4})?$/i, '')
    .replace(/\s+compact$/i, '').replace(/\s+\d{4}$/, '').trim();
  const k = s.toLowerCase();
  return ALIAS[k] ?? groot(s);
}
/* Welke vakken in Uniekind bij een SLO-vak horen (schoolprofielen gebruiken deze id's) */
const VAK_NAAR_UNIEKIND = {
  Nederlands: ['nederlands'], Engels: ['engels'], Duits: ['duits'], Frans: ['frans'], Spaans: ['spaans'], Latijn: ['latijn'], Grieks: ['grieks'],
  Wiskunde: ['wiskunde', 'rekenen'], Geschiedenis: ['geschiedenis'], Aardrijkskunde: ['aardrijkskunde'], Economie: ['economie'],
  Bedrijfseconomie: ['bedrijfseconomie'], Maatschappijleer: ['maatschappijleer'], Biologie: ['biologie'], Natuurkunde: ['natuurkunde'],
  Scheikunde: ['scheikunde'], Informatica: ['informatica'], 'Beeldende vakken': ['kunst'], Muziek: ['muziek'], Drama: ['drama'], Dans: ['dans'],
  CKV: ['ckv'], 'Lichamelijke opvoeding': ['lo'], 'Bewegen en sport': ['lo'], Filosofie: ['filosofie'], 'Digitale geletterdheid': ['digitale-geletterdheid', 'informatica'],
  'Mens en maatschappij': ['mm', 'geschiedenis', 'aardrijkskunde', 'economie', 'maatschappijleer'], 'Mens en natuur': ['mn', 'biologie', 'natuurkunde', 'scheikunde', 'oo'],
  Burgerschap: ['maatschappijleer', 'mm'], 'Kunst en cultuur': ['kunst', 'muziek', 'ckv', 'drama'], 'Culturele oriëntatie en creatieve expressie': ['kunst', 'muziek', 'ckv', 'drama'],
  'Moderne vreemde talen': ['duits', 'frans', 'spaans'], 'T&T (Technologie en Toepassing)': ['tt'], 'O&O (Onderzoeken en Ontwerpen)': ['oo'],
  'D&P (Dienstverlening en Producten)': ['dp'], 'NLT (Natuur, leven en technologie)': ['nlt'], 'ANW (Algemene natuurwetenschappen)': ['anw'],
  'BSM (Bewegen, sport en maatschappij)': ['bsm', 'lo'], Maatschappijwetenschappen: ['maw'], Maatschappijkunde: ['maatschappijkunde', 'maatschappijleer']
};
// De praktijkgerichte programma's van vmbo horen bij het beroepsgerichte profielvak
for (const p of ['Bouwen, Wonen en Interieur', 'Economie en Ondernemen', 'Groen', 'Horeca, Bakkerij en Recreatie', 'Maritiem en Techniek', 'Media, Vormgeving en ICT',
  'Mobiliteit en Transport', 'Produceren, Installeren en Energie', 'Techniek en Innovatief Vakmanschap', 'Zorg en Welzijn', 'Maatschappij', 'Technologie']) VAK_NAAR_UNIEKIND[p] = ['beroepsgericht', slug(p)];

function niveausUitTitel(t) {
  const s = t.toLowerCase();
  if (/vmbo-bb|vmbo bb\b/.test(s)) return ['vmbo-bb'];
  if (/vmbo-kb|vmbo kb\b/.test(s)) return ['vmbo-kb'];
  if (/gl\/tl|vmbo (gl|tl)\b|vmbo gl en tl/.test(s)) return ['vmbo-gltl'];
  if (/praktijkgericht programma/.test(s)) return ['vmbo-gltl'];
  if (/\bvmbo\b/.test(s)) return ['vmbo-bb', 'vmbo-kb', 'vmbo-gltl'];
  const n = [];
  if (/\bhavo\b|\/h$/.test(s)) n.push('havo');
  if (/\bvwo\b|\/v$/.test(s)) n.push('vwo');
  return n.length ? n : ['havo', 'vwo'];
}

/* ── Verzamelen per vak ── */
const perVak = new Map(); // vakNaam → { naam, kaders: [] }
const ids = new Set();
function voegToe(k) {
  if (!k.items?.length) return;
  let id = k.id, n = 2;
  while (ids.has(id)) id = `${k.id}-${n++}`;
  ids.add(id); k.id = id;
  const v = perVak.get(k.sloVak) ?? { naam: k.sloVak, kaders: [] };
  v.kaders.push(k);
  perVak.set(k.sloVak, v);
}
const vlag = (x) => ({ ...(x.ce ? { ce: 1 } : {}), ...(x.se ? { se: 1 } : {}) });

/* 1. Kerndoelen onderbouw VO */
{
  const kd = perId(lees('curriculum-kerndoelen', 'kerndoelen.json'));
  for (const vlg of lees('curriculum-kerndoelen', 'vakleergebieden.json')) {
    const vo = (vlg.kerndoel_id ?? []).map((i) => kd.get(i)).filter((x) => x && x.prefix.startsWith('VO ')).sort((a, b) => a.prefix.localeCompare(b.prefix, 'nl', { numeric: true }));
    if (!vo.length) continue;
    const naam = vakNaam(vlg.title);
    voegToe({
      id: `kerndoelen-onderbouw-${slug(vlg.title)}`, titel: `Kerndoelen onderbouw: ${vlg.title}`, soort: 'kerndoelen', status: 'geldend', niveaus: ['onderbouw'], sloVak: naam,
      bron: { naam: 'SLO, kerndoelen onderbouw VO', repo: 'slonl/curriculum-kerndoelen', versie: versieVan('curriculum-kerndoelen') },
      items: vo.map((x) => ({ c: x.prefix.replace('VO Kerndoel ', 'Kerndoel '), t: tekst(x.title), kop: tekst(x.description) }))
    });
  }
}

/* 2. Examenprogramma's, alle vakken */
const epLijst = lees('curriculum-examenprogramma', 'examenprogramma.json');
const toelichtingen = heeft('curriculum-syllabus') ? perId(lees('curriculum-syllabus', 'toelichtingen.json')) : new Map();
const vakbegrippen = heeft('curriculum-syllabus') ? perId(lees('curriculum-syllabus', 'vakbegrippen.json')) : new Map();
const toelPerEindterm = new Map();
for (const t of toelichtingen.values()) for (const e of t.examenprogramma_eindterm_id ?? []) toelPerEindterm.set(e, [...(toelPerEindterm.get(e) ?? []), t]);
const begrPerEindterm = new Map();
for (const b of vakbegrippen.values()) for (const e of b.examenprogramma_eindterm_id ?? []) begrPerEindterm.set(e, [...(begrPerEindterm.get(e) ?? []), b]);
const toelTekst = (t) => tekst([t.prefix, t.title, t.description].filter(Boolean).join(': '), 1500);
const begrTekst = (b) => tekst(b.description ? `${b.title}: ${b.description}` : b.title, 900);
{
  const dom = perId(lees('curriculum-examenprogramma', 'domeinen.json'));
  const sub = perId(lees('curriculum-examenprogramma', 'subdomeinen.json'));
  const et = perId(lees('curriculum-examenprogramma', 'eindtermen.json'));
  const eind = (ids) => (ids ?? []).map((i) => et.get(i)).filter(Boolean).map((x) => {
    const toel = (toelPerEindterm.get(x.id) ?? []).map(toelTekst);
    const b = (begrPerEindterm.get(x.id) ?? []).map(begrTekst);
    return { c: tekst(x.prefix ?? '').split('/').pop(), t: tekst(x.title), ...(x.description ? { d: tekst(x.description, 800) } : {}), ...vlag(x), ...(toel.length ? { toel } : {}), ...(b.length ? { b } : {}) };
  });
  for (const ep of epLijst) {
    const items = (ep.examenprogramma_domein_id ?? []).map((i) => dom.get(i)).filter(Boolean).map((d) => ({
      c: tekst(d.prefix ?? '').split('/').pop(), t: tekst(d.title), ...vlag(d),
      k: [
        ...(d.examenprogramma_subdomein_id ?? []).map((i) => sub.get(i)).filter(Boolean).map((s) => ({ c: tekst(s.prefix ?? '').split('/').pop(), t: tekst(s.title), ...vlag(s), k: eind(s.examenprogramma_eindterm_id) })),
        ...eind(d.examenprogramma_eindterm_id)
      ]
    }));
    voegToe({
      id: `examenprogramma-${slug(ep.prefix || ep.title)}`, titel: tekst(ep.title), soort: 'examenprogramma', status: 'geldend',
      niveaus: niveausUitTitel(`${ep.title} ${ep.prefix}`), sloVak: vakNaam(ep.title),
      bron: { naam: 'SLO, examenprogramma', repo: 'slonl/curriculum-examenprogramma', versie: versieVan('curriculum-examenprogramma'), url: ep.url || null, ingang: tekst(ep.ingangsdatum) || null },
      items
    });
  }
}

/* 3. Syllabi: per examenprogramma en leerweg de nieuwste, met specifieke eindtermen, toelichtingen en vakbegrippen */
if (heeft('curriculum-syllabus')) {
  const ep = perId(epLijst);
  const se = perId(lees('curriculum-syllabus', 'specifieke_eindtermen.json'));
  const leerweg = (t) => (t.match(/\bvmbo (bb|kb|gl|tl)\b/i)?.[1] ?? '').toLowerCase();
  const nieuwste = new Map();
  for (const s of lees('curriculum-syllabus', 'syllabus.json')) {
    for (const e of s.examenprogramma_id ?? []) {
      const sleutel = `${e}|${leerweg(s.title)}`;
      const oud = nieuwste.get(sleutel);
      const jaar = Number(s.examenjaar) || 0;
      const omvang = (x) => (x.syllabus_specifieke_eindterm_id?.length ?? 0) + (x.syllabus_toelichting_id?.length ?? 0);
      if (!oud || jaar > oud.jaar || (jaar === oud.jaar && omvang(s) > omvang(oud.s))) nieuwste.set(sleutel, { jaar, s });
    }
  }
  // Een algemene vmbo-syllabus vervalt als er even nieuwe of nieuwere per leerweg zijn
  for (const [sleutel, { jaar }] of [...nieuwste]) {
    const [e, lw] = sleutel.split('|');
    if (!lw && [...nieuwste].some(([k, v]) => k !== sleutel && k.startsWith(`${e}|`) && v.jaar >= jaar)) nieuwste.delete(sleutel);
  }
  const perSyllabus = new Map();
  for (const [sleutel, { s }] of nieuwste) {
    const e = ep.get(sleutel.split('|')[0]);
    if (!e) continue;
    const lw = leerweg(s.title);
    const al = perSyllabus.get(s.id) ?? { s, e, niveaus: new Set() };
    (lw === 'bb' ? ['vmbo-bb'] : lw === 'kb' ? ['vmbo-kb'] : lw ? ['vmbo-gltl'] : niveausUitTitel(`${e.title} ${e.prefix}`)).forEach((n) => al.niveaus.add(n));
    perSyllabus.set(s.id, al);
  }
  for (const { s, e, niveaus } of perSyllabus.values()) {
    const groepen = new Map();
    const domeinVan = (prefix) => tekst(prefix ?? '').split('/').find((d) => /^domein/i.test(d))?.replace(/^domein\s*/i, 'Domein ') ?? null;
    const voeg = (domein, item) => { const d = domein ?? 'Overig'; if (!groepen.has(d)) groepen.set(d, []); groepen.get(d).push(item); };
    for (const x of (s.syllabus_specifieke_eindterm_id ?? []).map((i) => se.get(i)).filter(Boolean)) {
      const toel = (x.syllabus_toelichting_id ?? []).map((i) => toelichtingen.get(i)).filter(Boolean).map(toelTekst);
      const b = (x.syllabus_vakbegrip_id ?? []).map((i) => vakbegrippen.get(i)).filter(Boolean).map(begrTekst);
      voeg(domeinVan(x.prefix), { c: tekst(x.prefix ?? '').split('/').pop(), t: tekst(x.title), ...(x.description ? { d: tekst(x.description, 800) } : {}), ...(x.ce ? { ce: 1 } : {}), ...(toel.length ? { toel } : {}), ...(b.length ? { b } : {}) });
    }
    // Toelichtingen en vakbegrippen die bij de syllabus als geheel horen
    const losToel = (s.syllabus_toelichting_id ?? []).map((i) => toelichtingen.get(i)).filter(Boolean);
    if (losToel.length) groepen.set('Toelichting', losToel.map((t) => ({ c: tekst(t.prefix ?? '').split('/').pop(), t: tekst(t.title, 2000), ...(t.description ? { d: tekst(t.description, 1500) } : {}), ...(t.ce ? { ce: 1 } : {}) })));
    const losBegr = (s.syllabus_vakbegrip_id ?? []).map((i) => vakbegrippen.get(i)).filter(Boolean);
    if (losBegr.length) groepen.set('Vakbegrippen', losBegr.map((b) => ({ c: tekst(b.prefix ?? ''), t: tekst(b.title, 3000), ...(b.description ? { d: tekst(b.description, 1500) } : {}), ...(b.ce ? { ce: 1 } : {}) })));
    const volgorde = (a) => (a === 'Toelichting' ? 'zz1' : a === 'Vakbegrippen' ? 'zz2' : a);
    const items = [...groepen].sort(([a], [b]) => volgorde(a).localeCompare(volgorde(b), 'nl', { numeric: true }))
      .map(([d, k]) => ({ c: d, t: d, k: k.sort((a, b) => a.c.localeCompare(b.c, 'nl', { numeric: true })) }));
    voegToe({
      id: `syllabus-${slug(s.title.replace(/^Syllabus /, ''))}`, titel: tekst(s.title), soort: 'syllabus', status: s.status && s.status !== 'definitief' ? 'concept' : 'geldend',
      niveaus: [...niveaus], sloVak: vakNaam(e.title),
      bron: { naam: 'SLO/CvTE, syllabus centraal examen', repo: 'slonl/curriculum-syllabus', versie: versieVan('curriculum-syllabus'), url: s.url || null, examenjaar: s.examenjaar || null },
      items
    });
  }
}

/* 4. Nieuwe kerndoelen, praktijkgerichte programma's en conceptexamenprogramma's (curriculum-fo) */
if (heeft('curriculum-fo')) {
  const fd = perId(lees('curriculum-fo', 'domeinen.json'));
  const fs = perId(lees('curriculum-fo', 'subdomeinen.json'));
  const fk = perId(lees('curriculum-fo', 'kernzinnen.json'));
  const fz = perId(lees('curriculum-fo', 'doelzinnen.json'));
  const fu = perId(lees('curriculum-fo', 'uitwerkingen.json'));
  const doel = (ids) => {
    const gezien = new Set();
    return (ids ?? []).map((i) => fz.get(i)).filter(Boolean).filter((z) => !gezien.has(z.description) && gezien.add(z.description)).map((z) => {
      const uitw = [...new Set((z.fo_uitwerking_id ?? []).map((i) => fu.get(i)).filter(Boolean).map((u) => tekst(u.description, 400)).filter(Boolean))];
      return { c: `${z.soort === 'eindterm' ? 'Eindterm' : 'Doel'} ${tekst(z.prefix)}`.trim(), t: tekst(z.description), ...vlag(z), ...(uitw.length ? { toel: uitw } : {}) };
    });
  };
  for (const set of lees('curriculum-fo', 'sets.json')) {
    if (/^Functionele/.test(set.title) || /gebarentaal/i.test(set.title)) continue; // praktijkonderwijs/vso en NGT: buiten vmbo, havo en vwo
    const kern = /^Kerndoelen/.test(set.title);
    const items = (set.fo_domein_id ?? []).map((i) => fd.get(i)).filter(Boolean).map((d) => {
      const gezien = new Set();
      return {
        c: tekst(d.prefix), t: tekst(d.title) + (d.description ? `: ${tekst(d.description)}` : ''),
        k: [
          ...(d.fo_kernzin_id ?? []).map((i) => fk.get(i)).filter((x) => x && !gezien.has(x.description) && gezien.add(x.description)).map((x) => ({ c: 'Kerndoel', t: tekst(x.description), k: doel(x.fo_doelzin_id) })),
          ...(d.fo_subdomein_id ?? []).map((i) => fs.get(i)).filter(Boolean).map((x) => ({ c: tekst(x.prefix), t: tekst(x.description || x.title), k: doel(x.fo_doelzin_id) })),
          ...doel(d.fo_doelzin_id)
        ]
      };
    });
    voegToe({
      id: `nieuw-${slug(set.title)}`, titel: tekst(set.title), soort: kern ? 'kerndoelen' : 'examenprogramma',
      status: set.status === 'definitief' ? 'geldend' : 'concept', niveaus: kern ? ['onderbouw'] : niveausUitTitel(set.title), sloVak: vakNaam(set.title),
      bron: { naam: kern ? 'SLO, nieuwe kerndoelen (definitief concept, nog niet wettelijk vastgesteld)' : `SLO, ${set.status === 'definitief' ? 'examenprogramma' : 'conceptexamenprogramma, nog niet geldend'}`, repo: 'slonl/curriculum-fo', versie: versieVan('curriculum-fo') },
      items
    });
  }
}

/* 5. Leerdoelenkaarten: de onderwerpen per vak (vakkern → subkern → inhoud) */
if (heeft('curriculum-leerdoelenkaarten')) {
  const kern = perId(lees('curriculum-leerdoelenkaarten', 'ldk.vakkernen.json'));
  const sub = perId(lees('curriculum-leerdoelenkaarten', 'ldk.vaksubkernen.json'));
  const inh = perId(lees('curriculum-leerdoelenkaarten', 'ldk.vakinhouden.json'));
  const knoop = (x, kinderen) => ({ c: tekst(x.prefix ?? '').split('/').slice(1).join('.'), t: tekst(x.title), ...(x.description ? { d: tekst(x.description, 800) } : {}), ...(kinderen?.length ? { k: kinderen } : {}) });
  for (const vlg of lees('curriculum-leerdoelenkaarten', 'ldk.vakleergebieden.json')) {
    const items = (vlg.ldk_vakkern_id ?? []).map((i) => kern.get(i)).filter(Boolean).map((k) => knoop(k,
      (k.ldk_vaksubkern_id ?? []).map((i) => sub.get(i)).filter(Boolean).map((s) => knoop(s, (s.ldk_vakinhoud_id ?? []).map((i) => inh.get(i)).filter(Boolean).map((x) => knoop(x))))));
    voegToe({
      id: `leerdoelenkaart-${slug(vlg.title)}`, titel: `Leerdoelenkaart ${vlg.title}`, soort: 'leerdoelenkaart', status: 'geldend', niveaus: ['alle'], sloVak: vakNaam(vlg.title),
      bron: { naam: 'SLO, leerdoelenkaart (onderwerpen per vak)', repo: 'slonl/curriculum-leerdoelenkaarten', versie: versieVan('curriculum-leerdoelenkaarten') },
      items
    });
  }
}

/* ── Schrijven: één bestand per vak, plus een index ── */
rmSync(uit, { recursive: true, force: true });
mkdirSync(uit, { recursive: true });
const tel = (l) => l.reduce((n, x) => n + 1 + tel(x.k ?? []), 0);
const SOORT = { kerndoelen: 0, leerdoelenkaart: 1, examenprogramma: 2, syllabus: 3 };
const index = [];
const vakken = [];
for (const v of [...perVak.values()].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))) {
  const bestand = `vak-${slug(v.naam)}.json`;
  const uniekind = VAK_NAAR_UNIEKIND[v.naam] ?? [slug(v.naam)];
  const kaders = {};
  for (const k of v.kaders) {
    kaders[k.id] = k;
    const { items, ...kort } = k;
    index.push({ ...kort, vakken: uniekind, bestand, aantal: tel(items) });
  }
  writeFileSync(join(uit, bestand), JSON.stringify({ vak: v.naam, kaders }) + '\n');
  vakken.push({ naam: v.naam, bestand, uniekind, aantal: v.kaders.length });
}
index.sort((a, b) => a.sloVak.localeCompare(b.sloVak, 'nl') || (SOORT[a.soort] - SOORT[b.soort]) || (a.status === b.status ? 0 : a.status === 'geldend' ? -1 : 1) || a.titel.localeCompare(b.titel, 'nl'));
writeFileSync(join(uit, 'index.json'), JSON.stringify({
  toelichting: 'Gemaakt door tools/importeer-slo.js uit de open data van SLO (licentie MIT). Niet met de hand aanpassen: draai het script opnieuw.',
  licentie: 'Bron: SLO, nationaal expertisecentrum leerplanontwikkeling. Open data onder MIT-licentie, https://github.com/slonl',
  gemaakt: new Date().toISOString().slice(0, 10),
  vakken, kaders: index
}, null, 1) + '\n');
const regels = index.reduce((n, k) => n + k.aantal, 0);
console.log(`${index.length} kaders in ${vakken.length} vakken, ${regels} regels, geschreven naar ${uit}/`);
for (const s of Object.keys(SOORT)) console.log(`  ${s}: ${index.filter((k) => k.soort === s).length}`);
