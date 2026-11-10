// Examenstof en opgave op niveau: alle SLO-gegevens, eindtermen bij een opgave zoeken, de drie versies en de AI-brug.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { vlak } from '../src/data/kaders.js';
import { splitsOpgave, vraagwoord, zoekEindtermen, maakVersies, maakOpgavePrompt, OPGAVE_IDS } from '../src/examen/opgave.js';
import { leesAntwoord } from '../src/ai/import.js';
import { zoekInKader } from '../src/pages/examenstof.js';

const index = JSON.parse(readFileSync('public/data/kaders/index.json', 'utf8'));
const vakBestand = (b) => JSON.parse(readFileSync(`public/data/kaders/${b}`, 'utf8'));
const regelsVan = (filter) => index.kaders.filter(filter).flatMap((info) => vlak(vakBestand(info.bestand).kaders[info.id]).map((r) => ({ ...r, info })));

const OPGAVE = `Tekst 2 Duurdere boodschappen
In 2022 stegen de prijzen in de supermarkt met gemiddeld 12 procent. De lonen stegen met 3 procent.
2p 5 Leg uit wat er gebeurt met de koopkracht van een gezin waarvan het inkomen met 3 procent stijgt.
1p 6 Bereken de prijs van een boodschappenmand die eerst 80 euro kostte.
2p 7 Beoordeel of de inflatie voor alle gezinnen even groot is.`;

describe('Alle SLO-gegevens', () => {
  it('bevat de examenprogramma\'s van alle vakken voor vmbo, havo en vwo, ook buiten de vakken van Sophianum', () => {
    const titels = index.kaders.filter((k) => k.soort === 'examenprogramma' && k.status === 'geldend').map((k) => k.titel);
    for (const t of ['Examenprogramma Moderne vreemde talen Spaans havo', 'Examenprogramma Natuur, leven en technologie vwo', 'Examenprogramma Maatschappijwetenschappen havo', 'Examenprogramma Economie vwo', 'Examenprogramma Wiskunde vmbo']) expect(titels).toContain(t);
    expect(titels.length).toBeGreaterThanOrEqual(107);
  });
  it('syllabi hebben toelichtingen en vakbegrippen', () => {
    const r = regelsVan((k) => k.soort === 'syllabus');
    expect(r.filter((x) => x.toel.length).length).toBeGreaterThan(400);
    expect(r.filter((x) => x.begrippen.length).length).toBeGreaterThan(300);
  });
  it('elk vak heeft één bestand en elk kader staat daarin', () => {
    for (const v of index.vakken) {
      const f = vakBestand(v.bestand);
      for (const k of index.kaders.filter((x) => x.bestand === v.bestand)) expect(f.kaders[k.id], k.id).toBeTruthy();
    }
  });
  it('zoeken in een kader vindt woorden in de tekst, de toelichting en de vakbegrippen', () => {
    const info = index.kaders.find((k) => k.titel === 'Syllabus Economie havo 2024');
    const t = zoekInKader(vakBestand(info.bestand).kaders[info.id], info, ['inflatie']);
    expect(t.length).toBeGreaterThan(0);
  });
});

describe('Opgave op niveau', () => {
  it('herkent vragen, punten en vraagwoorden', () => {
    const { inleiding, vragen } = splitsOpgave(OPGAVE);
    expect(vragen.map((v) => [v.nr, v.punten])).toEqual([['5', 2], ['6', 1], ['7', 2]]);
    expect(inleiding[0]).toBe('Tekst 2 Duurdere boodschappen');
    expect(vragen.map((v) => vraagwoord(v.tekst).soort)).toEqual(['uitleggen', 'berekenen', 'beoordelen']);
  });
  it('vindt passende eindtermen in examenprogramma en syllabus', () => {
    const regels = regelsVan((k) => k.sloVak === 'Economie' && k.niveaus.includes('havo') && k.status === 'geldend' && ['examenprogramma', 'syllabus'].includes(k.soort));
    const top = zoekEindtermen(OPGAVE, regels, 5);
    expect(top.length).toBeGreaterThan(0);
    expect(top.some((r) => /inflatie|koopkracht|prijs/i.test([r.tekst, ...r.toel, ...r.begrippen].join(' ')))).toBe(true);
  });
  it('maakt een docentblad en drie versies, met hulp per vraagwoord', () => {
    const docs = maakVersies({ vak: 'Economie', niveau: 'vmbo-gltl', bronNiveau: 'havo', opgave: OPGAVE, eindtermen: [{ code: 'D', tekst: 'De kandidaat kan inflatie berekenen', kaderTitel: 'Syllabus', begrippen: ['inflatie', 'koopkracht'] }] });
    expect(docs.map((d) => d.id)).toEqual(['opgave-docent', 'opgave-steun', 'opgave-basis', 'opgave-verdieping']);
    const steun = JSON.stringify(docs[1]);
    expect(steun).toContain('Schrijf op wat gegeven is');
    expect(steun).toContain('omdat … daardoor');
    expect(steun).toContain('koopkracht');
    expect(JSON.stringify(docs[3])).toContain('Een stap verder');
    expect(JSON.stringify(docs[0])).toContain('De opgave komt van havo');
  });
  it('de AI-opdracht vraagt om herschrijven naar het niveau van de klas en bevat geen klasgegevens', () => {
    const p = maakOpgavePrompt({ vak: 'Economie', niveau: 'vmbo-kb', bronNiveau: 'havo', opgave: OPGAVE, eindtermen: [{ code: 'D', tekst: 'De kandidaat kan inflatie berekenen', kaderTitel: 'Syllabus' }] });
    expect(p).toContain('Herschrijf hem naar het niveau vmbo kader');
    expect(p).toContain('### OPGAVE-STEUN');
    expect(p).not.toMatch(/dyslexie|leerlingen in de klas|namen/i);
  });
  it('een teruggeplakt antwoord vult de versies', () => {
    const antwoord = 'Natuurlijk!\n### OPGAVE-STEUN\n5a Wat is koopkracht?\n5b Wat gebeurt er als prijzen harder stijgen dan je inkomen?\n**OPGAVE-BASIS**\n5 Leg uit …\n### ANTWOORDMODEL\n5: koopkracht daalt (2p)';
    const { blokken, herkend } = leesAntwoord(antwoord, OPGAVE_IDS);
    expect(herkend).toEqual(['OPGAVE-STEUN', 'OPGAVE-BASIS', 'ANTWOORDMODEL']);
    const docs = maakVersies({ vak: 'Economie', niveau: 'havo', opgave: OPGAVE, ai: blokken });
    expect(JSON.stringify(docs[1])).toContain('Wat is koopkracht?');
    expect(JSON.stringify(docs[0])).toContain('koopkracht daalt (2p)');
  });
  it('exporteert naar Word en PDF', async () => {
    const docs = maakVersies({ vak: 'Economie', niveau: 'havo', opgave: OPGAVE });
    const { naarDocx } = await import('../src/export/docx.js');
    const docx = await naarDocx(docs, { kleur: '#00489a' });
    expect(Buffer.from(docx).subarray(0, 2).toString()).toBe('PK');
    const { naarPdf } = await import('../src/export/pdf.js');
    const pdf = await naarPdf(docs, { kleur: '#00489a' });
    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe('%PDF');
  }, 20000);
});
