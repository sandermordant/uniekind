// Eén tool met een menu per soort klas: de klaskeuze, alle stof per klas (examenprogramma met syllabus,
// beroepsgerichte programma's) en materiaal bij elk onderwerp.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { examenjaar, leerjarenVoor, laadKlas } from '../src/data/klas.js';
import { onderdelenVoor, stofRegels, kinderenVan, isOnderwerp } from '../src/data/stof.js';
import { onderwerpNaam, zoekterm, zoekLinks, begrippenVan, veiligeUrl, maakOnderwerpMateriaal, onderwerpPrompt, ONDERWERP_IDS } from '../src/examen/onderwerp.js';
import { leesMateriaalBestand } from '../src/examen/materiaalpaneel.js';
import { leesAntwoord } from '../src/ai/import.js';
import { tekstVan } from '../src/materiaal/model.js';

const profiel = JSON.parse(readFileSync('public/profiles/sophianum.json', 'utf8'));
const index = JSON.parse(readFileSync('public/data/kaders/index.json', 'utf8'));
const bestanden = new Map();
const kaderVan = (info) => {
  if (!bestanden.has(info.bestand)) bestanden.set(info.bestand, JSON.parse(readFileSync(`public/data/kaders/${info.bestand}`, 'utf8')));
  return bestanden.get(info.bestand).kaders[info.id];
};
const afd = (id) => profiel.afdelingen.find((a) => a.id === id);

describe('Klaskeuze: eindexamenklas of andere klas', () => {
  it('het examenjaar is vmbo 4, havo 5, vwo 6', () => {
    expect(examenjaar(afd('vmbo-k'))).toBe(4);
    expect(examenjaar(afd('havo'))).toBe(5);
    expect(examenjaar(afd('vwo-g'))).toBe(6);
  });
  it('de examenklas heeft alleen het examenjaar, andere klassen de rest', () => {
    expect(leerjarenVoor(afd('havo'), 'examen')).toEqual([5]);
    expect(leerjarenVoor(afd('havo'), 'regulier')).toEqual([1, 2, 3, 4]);
  });
  it('een opgeslagen klas wordt gecontroleerd tegen het profiel', () => {
    const k = laadKlas(profiel, {}, { modus: 'examen', afdeling: 'havo', leerjaar: 2, vak: 'latijn' });
    expect(k.leerjaar).toBe(5); // havo 2 is geen examenjaar
    expect(k.vak).not.toBe('latijn'); // Latijn staat niet bij havo
    const r = laadKlas(profiel, {}, { modus: 'regulier', afdeling: 'havo', leerjaar: 5, vak: 'economie' });
    expect(r.leerjaar).toBe(1);
    expect(r.vak).toBe('economie');
  });
  it('zonder opgeslagen klas: het eerste vak en de eerste afdeling van de docent', () => {
    const k = laadKlas(profiel, { afdelingen: ['vwo-a'], vakken: ['geschiedenis'] }, null);
    expect(k).toMatchObject({ modus: 'regulier', afdeling: 'vwo-a', vak: 'geschiedenis', gekozen: false });
  });
});

describe('Alle stof per klas', () => {
  it('in de examenklas havo 5 economie: het examenprogramma met de syllabus als één onderdeel, geen kerndoelen', () => {
    const o = onderdelenVoor(index, { vak: 'economie', afdeling: afd('havo'), leerjaar: 5, modus: 'examen' });
    expect(o[0].soort).toBe('examenprogramma');
    expect(o[0].kaders.map((k) => k.titel)).toEqual(['Examenprogramma Economie havo', 'Syllabus Economie havo 2024']);
    expect(o.some((x) => x.soort === 'kerndoelen')).toBe(false);
  });
  it('in havo 1 staan de kerndoelen voorop', () => {
    const o = onderdelenVoor(index, { vak: 'economie', afdeling: afd('havo'), leerjaar: 1, modus: 'regulier' });
    expect(o[0].soort).toBe('kerndoelen');
  });
  it('de syllabus staat onder het juiste domein van het examenprogramma', () => {
    const [o] = onderdelenVoor(index, { vak: 'economie', afdeling: afd('havo'), leerjaar: 5, modus: 'examen' });
    const regels = stofRegels(o, kaderVan);
    const iD = regels.findIndex((r) => r.diepte === 0 && r.tekst.startsWith('Domein D'));
    const iE = regels.findIndex((r) => r.diepte === 0 && r.tekst.startsWith('Domein E'));
    const tussen = regels.slice(iD, iE);
    expect(tussen.some((r) => r.kopje && /syllabus/i.test(r.tekst))).toBe(true);
    expect(tussen.filter((r) => r.info.soort === 'syllabus').length).toBeGreaterThan(10);
    // alle regels van beide kaders komen precies één keer voor (behalve de domeinkoppen van de syllabus)
    const sleutels = regels.filter((r) => !r.kopje).map((r) => r.sleutel);
    expect(new Set(sleutels).size).toBe(sleutels.length);
  });
  it('kinderen van een domein zijn alle regels eronder', () => {
    const [o] = onderdelenVoor(index, { vak: 'economie', afdeling: afd('havo'), leerjaar: 5, modus: 'examen' });
    const regels = stofRegels(o, kaderVan);
    const d = regels.find((r) => r.diepte === 0 && r.tekst.startsWith('Domein D'));
    const k = kinderenVan(regels, d);
    expect(k.filter(isOnderwerp).length).toBeGreaterThan(20);
    expect(k.every((r) => r.diepte > 0)).toBe(true);
  });
  it('vmbo kader: alleen de syllabus van de eigen leerweg', () => {
    const o = onderdelenVoor(index, { vak: 'nederlands', afdeling: afd('vmbo-k'), leerjaar: 4, modus: 'examen' });
    const titels = o.flatMap((x) => x.kaders.map((k) => k.titel));
    expect(titels.some((t) => /vmbo kb/i.test(t))).toBe(true);
    expect(titels.some((t) => /vmbo (bb|gl|tl)\b/i.test(t))).toBe(false);
  });
  it('de beroepsgerichte profielvakken en keuzevakken van vmbo zijn compleet', () => {
    const bg = index.kaders.filter((k) => k.id.startsWith('beroepsgericht-'));
    expect(bg.filter((k) => k.soort === 'examenprogramma').length).toBe(10);
    expect(bg.filter((k) => k.soort === 'keuzevakken').length).toBe(10);
    const kv = index.kaders.filter((k) => k.soort === 'keuzevakken').reduce((n, k) => n + kaderVan(k).items.length, 0);
    expect(kv).toBe(158);
    const o = onderdelenVoor(index, { vak: 'beroepsgericht', afdeling: afd('vmbo-k'), leerjaar: 4, modus: 'examen' });
    expect(o.length).toBe(18); // 9 profielvakken met keuzevakken; D&P is een eigen vak
    expect(onderdelenVoor(index, { vak: 'dp', afdeling: afd('vmbo-k'), leerjaar: 4, modus: 'examen' }).map((x) => x.soort)).toEqual(expect.arrayContaining(['examenprogramma', 'keuzevakken']));
  });
});

describe('Materiaal bij een onderwerp', () => {
  const regel = {
    sleutel: 'x:1', code: 'Domein D · 4.2b', diepte: 1, heeftKinderen: false, toel: ['Alleen verbaal en grafisch.'],
    tekst: 'De kandidaat kan in contexten herkennen hoe een verandering van de prijzen leidt tot een verschuiving van de collectieve aanbodlijn (Marktaanbod).',
    begrippen: ['aanbodlijn: grafiek van de aangeboden hoeveelheid bij elke prijs', 'productiefactoren: arbeid, kapitaal, natuur en ondernemerschap', 'marktevenwicht'],
    info: { id: 'x', titel: 'Syllabus Economie havo 2024', soort: 'syllabus', sloVak: 'Economie' }
  };
  it('naam en zoekterm komen uit het onderwerp tussen haakjes', () => {
    expect(onderwerpNaam(regel)).toBe('Marktaanbod');
    expect(zoekterm(regel)).toBe('marktaanbod');
    expect(zoekterm({ tekst: 'De kandidaat kan de werking van het hart beschrijven (bijvoorbeeld bij sport).' })).toBe('werking hart');
  });
  it('begrippen met uitleg; lange opsommingen vallen weg', () => {
    const b = begrippenVan([regel, { begrippen: ['Europa, Azië, Afrika, Amerika'] }]);
    expect(b.map((x) => x.naam)).toEqual(['aanbodlijn', 'productiefactoren', 'marktevenwicht']);
    expect(b[0].uitleg).toMatch(/grafiek/);
  });
  it('zoeklinks: de zoekbronnen van de school, Wikipedia en in de examenklas Examenblad', () => {
    const l = zoekLinks(profiel, { term: 'marktaanbod', vakNaam: 'Economie', niveauNaam: 'havo, leerjaar 5', examen: true });
    expect(l.map((x) => x.naam)).toEqual(expect.arrayContaining(['Schooltv', 'Wikiwijs', 'Wikipedia', 'Examenblad: examens en syllabus']));
    expect(l.find((x) => x.naam === 'Schooltv').url).toContain('marktaanbod');
    expect(l.find((x) => x.naam.startsWith('Examenblad')).url).not.toContain('leerjaar');
    expect(zoekLinks(profiel, { term: 'x', examen: false }).some((x) => x.naam.startsWith('Examenblad'))).toBe(false);
  });
  it('zonder AI: docentblad, leerkaart, oefenblad op drie niveaus en begrippenkaartjes', () => {
    const docs = maakOnderwerpMateriaal({ regel, kinderen: [], vakNaam: 'Economie', niveauNaam: 'havo', examen: true, bron: 'Syllabus' });
    expect(docs.map((d) => d.id)).toEqual(['onderwerp-docent', 'onderwerp-leerkaart', 'onderwerp-oefenblad', 'onderwerp-kaartjes']);
    const t = docs.map(tekstVan).join('\n');
    expect(t).toMatch(/Je kunt in contexten herkennen/);
    expect(t).toMatch(/Start: met hulp/);
    expect(t).toMatch(/Plus: een stap verder/);
    expect(t).toMatch(/examenvraag/);
    expect(t).toMatch(/grafiek van de aangeboden hoeveelheid/);
  });
  it('met AI: de teruggeplakte blokken komen in het materiaal, met een leeswaarschuwing', () => {
    const ai = leesAntwoord('### UITLEG\nMarktaanbod is wat alle aanbieders samen aanbieden.\n### OEFENEN-BASIS\n1. Wat is marktaanbod?\n2. Teken de aanbodlijn.\n### ANTWOORDEN\n1. Het totale aanbod.', ONDERWERP_IDS).blokken;
    const docs = maakOnderwerpMateriaal({ regel, kinderen: [], vakNaam: 'Economie', niveauNaam: 'havo', examen: true, ai });
    const t = docs.map(tekstVan).join('\n');
    expect(t).toMatch(/alle aanbieders samen/);
    expect(t).toMatch(/Teken de aanbodlijn/);
    expect(t).toMatch(/lees na op juistheid en niveau/);
  });
  it('de AI-opdracht bevat de eindterm en de kopjes, en niets over de klas', () => {
    const p = onderwerpPrompt({ regel, kinderen: [], vakNaam: 'Economie', niveauNaam: 'havo', examen: true });
    expect(p).toContain('Domein D · 4.2b');
    for (const id of ONDERWERP_IDS) expect(p).toContain(`### ${id}`);
    expect(p).toMatch(/centraal examen/);
    expect(p).not.toMatch(/dyslexie|leerlingen met|namen/i);
  });
  it('alleen http(s)-links worden bewaard of geïmporteerd', () => {
    expect(veiligeUrl('javascript:alert(1)')).toBeNull();
    expect(veiligeUrl('data:text/html,x')).toBeNull();
    expect(veiligeUrl('https://schooltv.nl/video/x')).toBe('https://schooltv.nl/video/x');
    const items = leesMateriaalBestand({ soort: 'uniekind-materiaal', versie: 1, items: [
      { sleutel: 'a:1', url: 'https://wikiwijs.nl/x', titel: 'Goed' },
      { sleutel: 'a:2', url: 'javascript:alert(1)', titel: 'Fout' },
      { url: 'https://x.nl' }
    ] });
    expect(items.map((x) => x.titel)).toEqual(['Goed']);
    expect(() => leesMateriaalBestand({ soort: 'iets anders', items: [] })).toThrow();
  });
});
