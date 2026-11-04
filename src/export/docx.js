// Documentmodel → Word (.docx), met de docx-bibliotheek. Werkt in de browser en in Node (voor de tests).
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, PageBreak, ShadingType, LevelFormat, Footer, PageNumber
} from 'docx';
import { segmenten, hex } from './delen.js';

const LIJN = { style: BorderStyle.SINGLE, size: 6, color: '9CA3AF' };
const STREEP = { style: BorderStyle.DASHED, size: 6, color: '9CA3AF' };
const GEEN = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const randen = (r) => ({ top: r, bottom: r, left: r, right: r, insideHorizontal: r, insideVertical: r });

function maakContext(o) {
  const groot = !!o.dyslexie;
  return {
    accent: hex(o.kleur),
    pt: groot ? 13 : 11,
    regel: groot ? 432 : 300, // regelafstand in 240-sten
    font: groot ? 'Verdana' : 'Arial'
  };
}

function runs(tekst, c, o = {}) {
  return segmenten(tekst).map((s) => new TextRun({
    text: s.tekst, bold: o.vet, size: Math.round((o.pt ?? c.pt) * 2), font: c.font, color: o.kleur,
    ...(s.invul ? { highlight: 'yellow' } : {})
  }));
}
const p = (tekst, c, o = {}) => new Paragraph({ children: runs(tekst, c, o), spacing: { after: o.na ?? 100, line: c.regel }, alignment: AlignmentType.LEFT, ...(o.extra ?? {}) });
// Schrijfregels als tabel met alleen onderranden (lege alinea's met dezelfde rand voegt Word samen)
const lijnen = (n, c) => [new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: { top: GEEN, left: GEEN, right: GEEN, bottom: LIJN, insideHorizontal: LIJN, insideVertical: GEEN },
  rows: Array.from({ length: n }, () => new TableRow({ height: { value: c.pt > 11 ? 620 : 460, rule: 'exact' }, children: [new TableCell({ children: [new Paragraph('')], borders: { top: GEEN, left: GEEN, right: GEEN, bottom: LIJN } })] }))
})];

function cel(kinderen, o = {}) {
  return new TableCell({
    children: kinderen.length ? kinderen : [new Paragraph('')],
    width: o.breedte ? { size: o.breedte, type: WidthType.PERCENTAGE } : undefined,
    shading: o.vulling ? { type: ShadingType.CLEAR, color: 'auto', fill: o.vulling } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: o.randen
  });
}
function tabel(rijen, o = {}) {
  return new Table({ rows: rijen, width: { size: 100, type: WidthType.PERCENTAGE }, borders: randen(o.rand ?? LIJN) });
}

function blokken(lijst, c) {
  const uit = [];
  for (const b of lijst) uit.push(...blok(b, c));
  return uit;
}

function blok(b, c) {
  switch (b.t) {
    case 'kop': return [p(b.tekst, c, { vet: true, pt: b.niveau === 1 ? c.pt + 5 : b.niveau === 2 ? c.pt + 3 : c.pt + 1, kleur: b.niveau <= 2 ? c.accent : undefined, na: 80, extra: { spacing: { before: 200, after: 80 } } })];
    case 'alinea': return [p(b.tekst, c, { vet: b.nadruk, pt: b.klein ? c.pt - 2 : c.pt, kleur: b.klein ? '4B5563' : undefined })];
    case 'lijst': return b.items.map((x) => new Paragraph({ children: runs(x, c), numbering: { reference: b.genummerd ? 'nummers' : 'bolletjes', level: 0 }, spacing: { after: 60, line: c.regel } }));
    case 'vink': return b.items.map((x) => new Paragraph({ children: [new TextRun({ text: '☐  ', size: c.pt * 2, font: c.font }), ...runs(x, c)], spacing: { after: 60, line: c.regel } }));
    case 'tabel': {
      const rijen = [];
      if (b.kop?.some(Boolean)) rijen.push(new TableRow({ tableHeader: true, children: b.kop.map((k, i) => cel([p(k, c, { vet: true, pt: c.pt - 1, na: 0 })], { vulling: 'EEF2F7', breedte: b.breedtes?.[i] })) }));
      for (const r of b.rijen) rijen.push(new TableRow({ children: r.map((x, i) => cel([p(x, c, { pt: c.pt - 1, na: 0 })], { breedte: b.breedtes?.[i] })) }));
      return [tabel(rijen), p('', c, { na: 60 })];
    }
    case 'vraag': return [p(`${b.nr}. ${b.tekst}${b.label ? `  [${b.label}]` : ''}`, c, { na: 40 }), ...lijnen(b.regels, c), p('', c, { na: 80 })];
    case 'regels': return lijnen(b.aantal, c);
    case 'invulveld': return [tabel([new TableRow({ children: [cel([p(`⟦${b.tekst}⟧`, c, { na: 40 }), ...(b.voorbeeld ? [p(b.voorbeeld, c, { pt: c.pt - 2, kleur: '4B5563', na: 0 })] : [])])] })], { rand: { style: BorderStyle.DASHED, size: 8, color: 'D79A00' } }), p('', c, { na: 60 })];
    case 'kader': return [tabel([new TableRow({ children: [cel([...(b.titel ? [p(b.titel, c, { vet: true, kleur: c.accent, na: 60 })] : []), ...blokken(b.blokken, c)])] })]), p('', c, { na: 60 })];
    case 'schaal': {
      const rijen = [new TableRow({ tableHeader: true, children: [cel([p('', c)], { vulling: 'EEF2F7' }), ...b.kolommen.map((k) => cel([p(k, c, { vet: true, pt: c.pt - 1, na: 0 })], { vulling: 'EEF2F7' }))] })];
      for (const x of b.items) rijen.push(new TableRow({ children: [cel([p(x, c, { na: 0 })], { breedte: 46 }), ...b.kolommen.map(() => cel([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐', size: c.pt * 2 + 4 })] })], { breedte: 18 }))] }));
      return [tabel(rijen), p('', c, { na: 60 })];
    }
    case 'schema': return schema(b, c);
    case 'kaarten': {
      const per = b.perPagina === 2 ? 1 : 2;
      const rijen = [];
      for (let i = 0; i < b.kaarten.length; i += per) {
        const groep = b.kaarten.slice(i, i + per);
        while (groep.length < per) groep.push(null);
        rijen.push(new TableRow({ cantSplit: true, children: groep.map((k) => cel(k ? [p(k.titel, c, { vet: true, pt: c.pt + 1, kleur: c.accent, na: 80 }), ...blokken(k.blokken, c)] : [p('', c)], { breedte: 100 / per, randen: randen(STREEP) })) }));
      }
      return [tabel(rijen, { rand: STREEP })];
    }
    case 'pagina': return [new Paragraph({ children: [new PageBreak()] })];
    default: return [];
  }
}

function schema(b, c) {
  const it = b.items ?? [];
  const leeg = (x) => cel([p(x ?? '', c, { na: 0 })]);
  if (b.soort === 'woordweb') {
    const r = [...it.slice(1), '', '', '', '', '', ''].slice(0, 6);
    return [tabel([
      new TableRow({ height: { value: 900, rule: 'atLeast' }, children: [leeg(r[0]), leeg(r[1]), leeg(r[2])] }),
      new TableRow({ height: { value: 900, rule: 'atLeast' }, children: [leeg(''), cel([p(it[0] ?? '', c, { vet: true, kleur: c.accent, na: 0 })], { vulling: 'EEF2F7' }), leeg('')] }),
      new TableRow({ height: { value: 900, rule: 'atLeast' }, children: [leeg(r[3]), leeg(r[4]), leeg(r[5])] })
    ]), p('', c, { na: 60 })];
  }
  if (b.soort === 'oorzaak-gevolg') {
    return [tabel([new TableRow({ height: { value: 1800, rule: 'atLeast' }, children: [cel([p('Oorzaak', c, { vet: true })]), cel([p('→', c)], { breedte: 6 }), cel([p(it[0] ?? '', c, { vet: true, kleur: c.accent })], { vulling: 'EEF2F7' }), cel([p('→', c)], { breedte: 6 }), cel([p('Gevolg', c, { vet: true })])] })]), p('', c, { na: 60 })];
  }
  if (b.soort === 'tijdlijn') {
    const r = [...it, '', ''].slice(0, 5);
    return [tabel([new TableRow({ children: r.map(() => cel([p('Jaar: ____', c, { pt: c.pt - 1, na: 0 })], { vulling: 'EEF2F7' })) }), new TableRow({ height: { value: 1200, rule: 'atLeast' }, children: r.map((x) => cel([p(x, c, { na: 0 })])) })]), p('', c, { na: 60 })];
  }
  const [a, d] = [it[0] ?? '⟦begrip 1⟧', it[1] ?? '⟦begrip 2⟧'];
  const rijen = [new TableRow({ tableHeader: true, children: [cel([p('', c)], { vulling: 'EEF2F7' }), cel([p(a, c, { vet: true, na: 0 })], { vulling: 'EEF2F7' }), cel([p(d, c, { vet: true, na: 0 })], { vulling: 'EEF2F7' })] })];
  for (const r of ['Wat is het?', 'Kenmerk', 'Voorbeeld', 'Overeenkomst of verschil']) rijen.push(new TableRow({ height: { value: 700, rule: 'atLeast' }, children: [cel([p(r, c, { vet: true, pt: c.pt - 1, na: 0 })], { breedte: 26 }), leeg(''), leeg('')] }));
  return [tabel(rijen), p('', c, { na: 60 })];
}

/** Maakt één .docx van een of meer documenten (elk op een nieuwe pagina). Geeft een Blob of Buffer. */
export async function naarDocx(docs, o = {}) {
  const c = maakContext(o);
  const kinderen = [];
  docs.forEach((doc, i) => {
    if (i > 0) kinderen.push(new Paragraph({ children: [new PageBreak()] }));
    const cc = { ...c, ...(o.dyslexie && doc.voor === 'leerling' ? {} : maakContext({ ...o, dyslexie: false })) };
    if (o.toonAantal && doc.aantal) kinderen.push(p(`Print ${doc.aantal}×${doc.aantalUitleg ? ` (${doc.aantalUitleg})` : ''}`, cc, { pt: 9, kleur: '4B5563', na: 40 }));
    kinderen.push(p(doc.titel, cc, { vet: true, pt: cc.pt + 7, kleur: cc.accent, na: 60 }));
    if (doc.ondertitel) kinderen.push(p(doc.ondertitel, cc, { pt: cc.pt - 1, kleur: '4B5563', na: 160 }));
    kinderen.push(...blokken(doc.blokken, cc));
  });
  const document = new Document({
    creator: 'Uniekind', title: docs.length === 1 ? docs[0].titel : (o.titel ?? 'Uniekind materiaal'),
    styles: { default: { document: { run: { font: c.font, size: c.pt * 2 } } } },
    numbering: {
      config: [
        { reference: 'bolletjes', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }] },
        { reference: 'nummers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] }
      ]
    },
    sections: [{
      properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${o.schoolnaam ? o.schoolnaam + ' · ' : ''}Uniekind · `, size: 16, color: '6B7280' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '6B7280' })] })] }) },
      children: kinderen
    }]
  });
  return typeof window === 'undefined' ? Packer.toBuffer(document) : Packer.toBlob(document);
}
