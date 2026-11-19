// Eigen materiaal van de docent: Word, PowerPoint en PDF inlezen, meenemen in de AI-opdracht en in de presentatie.
import { describe, it, expect } from 'vitest';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { tekstUitDocx, tekstUitPptx, tekstUitPdf, leesDocument, signalenLeerlinggegevens } from '../src/ocr/document.js';
import { maakPrompt, MAX_TEKST } from '../src/ai/prompt.js';
import { promptVoor } from '../src/ai/adapter.js';
import { leesAntwoord, uitlegDias } from '../src/ai/import.js';
import { nodigVoorMateriaal } from '../src/ai/formaat.js';
import { genereerLes } from '../src/engine/opbouw.js';
import { lesVoorLaag } from '../src/materiaal/maak.js';
import { naarPptx } from '../src/export/pptx.js';
import { laadData, invoer } from './helpers.js';

const data = laadData();
const nep = (naam, inhoud, type = '') => ({ name: naam, type, size: inhoud.byteLength ?? inhoud.length, arrayBuffer: async () => inhoud });

describe('Documenten lezen (in de browser, hier in Node)', () => {
  it('Word: alinea\'s en tabellen, met speciale tekens', async () => {
    const doc = new Document({ sections: [{ children: [
      new Paragraph('Fotosynthese & bladgroen'),
      new Paragraph({ children: [new TextRun('Planten maken '), new TextRun({ text: 'glucose', bold: true }), new TextRun('.')] }),
      new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph('Beginstof')] }), new TableCell({ children: [new Paragraph('Water')] })] })] })
    ] }] });
    expect(await tekstUitDocx(await Packer.toBuffer(doc))).toBe('Fotosynthese & bladgroen\nPlanten maken glucose.\nBeginstof\nWater');
  });
  it('PowerPoint: per dia, in volgorde', async () => {
    const p = new PptxGenJS();
    p.addSlide().addText('Fotosynthese <basis>', { x: 1, y: 1, w: 5, h: 1 });
    p.addSlide().addText([{ text: 'Licht', options: { bullet: true, breakLine: true } }, { text: 'Water', options: { bullet: true } }], { x: 1, y: 1, w: 5, h: 2 });
    expect(await tekstUitPptx(await p.write({ outputType: 'nodebuffer' }))).toBe('Dia 1\nFotosynthese <basis>\n\nDia 2\nLicht\nWater');
  });
  it('PDF met tekst', async () => {
    const pdfMake = (await import('pdfmake/build/pdfmake.js')).default;
    const vfs = (await import('pdfmake/build/vfs_fonts.js')).default;
    pdfMake.vfs = vfs.pdfMake?.vfs ?? vfs;
    const buf = await new Promise((ok) => pdfMake.createPdf({ content: ['Fotosynthese in de PDF', 'Tweede regel met bladgroen'] }).getBuffer(ok));
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    expect(await tekstUitPdf(buf, pdfjs)).toBe('Fotosynthese in de PDF\nTweede regel met bladgroen');
  });
  it('duidelijke meldingen bij oude Office-bestanden, onbekende soorten en te grote bestanden', async () => {
    await expect(leesDocument(nep('les.doc', new ArrayBuffer(10)))).rejects.toThrow(/oud Office-bestand/);
    await expect(leesDocument(nep('les.xyz', new ArrayBuffer(10)))).rejects.toThrow(/Dit soort bestand/);
    await expect(leesDocument({ ...nep('groot.pdf', new ArrayBuffer(1)), size: 20 * 1024 * 1024 })).rejects.toThrow(/groter dan 15 MB/);
    const txt = await leesDocument(nep('stof.txt', new TextEncoder().encode('Regel een\n\n  Regel twee  ').buffer));
    expect(txt).toMatchObject({ soort: 'tekst', tekst: 'Regel een\nRegel twee' });
  });
});

describe('Eigen materiaal in de AI-opdracht', () => {
  const metStof = (tekst, extra = {}) => genereerLes(invoer({ context: { afdeling: 'havo', leerjaar: 3, vak: 'biologie', lesduur: 50, ruimte: 'L', aantal: 26 }, inhoud: { onderwerp: 'Fotosynthese', tekst }, ...extra }), data);
  it('gaat mee als basis', () => {
    const p = maakPrompt(metStof('Werkblad: planten maken glucose met licht.'), data.profiel, 'alles');
    expect(p).toMatch(/STOF EN EIGEN MATERIAAL VAN DE DOCENT \(dit is de basis/);
    expect(p).toContain('Werkblad: planten maken glucose met licht.');
  });
  it('lang materiaal wordt ingekort tot het maximum', () => {
    const p = maakPrompt(metStof('x'.repeat(MAX_TEKST + 500)), data.profiel, 'alles');
    expect(p).toContain('x'.repeat(MAX_TEKST));
    expect(p).not.toContain('x'.repeat(MAX_TEKST + 1));
  });
  it('een woord als "dyslexie" in de lesstof blokkeert de opdracht niet, maar geeft een waarschuwing', () => {
    const les = metStof('Bij dyslexie is lezen lastiger. Deze tekst gaat over lezen.');
    expect(() => promptVoor(les, data.profiel, 'alles')).not.toThrow();
    expect(signalenLeerlinggegevens(les.invoer.inhoud.tekst)).toEqual(['dyslexie']);
  });
  it('klasgegevens buiten het materiaal blijven wel geblokkeerd', () => {
    const les = metStof('Planten.', { klas: { dyslexie: 3 } });
    expect(maakPrompt(les, data.profiel, 'alles')).not.toMatch(/dyslexie/i);
  });
  it('bij twee lagen met een ander onderwerp gaat het materiaal alleen mee voor laag 1', () => {
    const les = genereerLes(invoer({ context: { afdeling: 'vwo-a', leerjaar: 4, vak: 'biologie', lesduur: 50, ruimte: 'L', aantal: 28 }, inhoud: { onderwerp: 'Erfelijkheid', tekst: 'Mijn werkblad erfelijkheid.' }, klas: { gemengd: true, laag2: { afdeling: 'vwo-a', onderwerp: 'Evolutie' } } }), data);
    expect(maakPrompt(lesVoorLaag(les, 'A'), data.profiel, 'alles')).toContain('Mijn werkblad erfelijkheid.');
    expect(maakPrompt(lesVoorLaag(les, 'B'), data.profiel, 'alles')).not.toContain('Mijn werkblad erfelijkheid.');
  });
});

describe("Uitlegdia's vullen de presentatie", () => {
  const les = genereerLes(invoer({ context: { afdeling: 'havo', leerjaar: 3, vak: 'biologie', lesduur: 50, ruimte: 'L', aantal: 26 }, inhoud: { onderwerp: 'Fotosynthese' } }), data);
  const antwoord = "### UITLEG-DIAS\nDia: Wat is fotosynthese?\n- Planten maken zelf voedsel\n- Met licht, water en CO2\nDia: Beginstoffen\n- Water\n- Koolstofdioxide\nDia: Eindstoffen\n- Glucose en zuurstof";
  it('worden herkend en ingelezen', () => {
    const blok = leesAntwoord(antwoord).blokken['UITLEG-DIAS'];
    expect(uitlegDias(blok).map((d) => d.titel)).toEqual(['Wat is fotosynthese?', 'Beginstoffen', 'Eindstoffen']);
    expect(uitlegDias(blok)[0].regels).toEqual(['Planten maken zelf voedsel', 'Met licht, water en CO2']);
    expect(nodigVoorMateriaal(['lesplan'])).toContain('UITLEG-DIAS');
  });
  it('de instructiedia krijgt de uitleg in plaats van het lege vak, met vervolgdia\'s', async () => {
    const JSZip = (await import('jszip')).default;
    const tekstVan = async (buf) => { const zip = await JSZip.loadAsync(buf); return (await Promise.all(Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).map((f) => zip.file(f).async('string')))); };
    const zonder = await tekstVan(await naarPptx(les, data));
    const met = await tekstVan(await naarPptx(les, { ...data, ai: leesAntwoord(antwoord).blokken }));
    expect(zonder.join(' ')).toMatch(/Plaats voor je eigen uitleg/);
    expect(met.join(' ')).not.toMatch(/Plaats voor je eigen uitleg/);
    expect(met.join(' ')).toMatch(/Wat is fotosynthese\?[\s\S]*Beginstoffen[\s\S]*Eindstoffen/);
    expect(met.length).toBe(zonder.length + 2);
  });
});
