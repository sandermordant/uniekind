// Documentmodel → PDF met pdfmake (nette pagina-indeling, echte tekst, geen afbeelding van de pagina).
// pdfmake en de lettertypen worden pas geladen als iemand een PDF maakt.
import { segmenten } from './delen.js';

let pdfMakeP = null;
async function laadPdfMake() {
  if (!pdfMakeP) {
    pdfMakeP = (async () => {
      const pm = (await import('pdfmake/build/pdfmake.js')).default ?? (await import('pdfmake/build/pdfmake.js'));
      const vf = await import('pdfmake/build/vfs_fonts.js');
      const vfs = vf.default?.pdfMake?.vfs ?? vf.pdfMake?.vfs ?? vf.default?.vfs ?? vf.default ?? vf.vfs;
      pm.vfs = vfs;
      if (pm.addVirtualFileSystem) pm.addVirtualFileSystem(vfs);
      return pm;
    })();
  }
  return pdfMakeP;
}

const GRIJS = '#9ca3af';
const BREEDTE = 515; // A4 min marges, in punten

function t(tekst, c, o = {}) {
  return {
    text: segmenten(tekst).map((s) => (s.invul ? { text: s.tekst, background: '#fff3c4', color: '#7a4b00' } : { text: s.tekst })),
    fontSize: o.pt ?? c.pt, bold: o.vet, color: o.kleur, margin: o.marge ?? [0, 0, 0, 5], lineHeight: c.regel
  };
}
const lijn = (breedte = BREEDTE) => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: breedte, y2: 0, lineWidth: 0.6, lineColor: GRIJS }], margin: [0, 20, 0, 0] });
const randLayout = { hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => GRIJS, vLineColor: () => GRIJS, paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 4, paddingBottom: () => 4 };
const streepLayout = { ...randLayout, hLineStyle: () => ({ dash: { length: 3 } }), vLineStyle: () => ({ dash: { length: 3 } }) };
const kaderLayout = { ...randLayout, paddingLeft: () => 9, paddingRight: () => 9, paddingTop: () => 7, paddingBottom: () => 7 };

function blokken(lijst, c, breedte) { return lijst.flatMap((b) => blok(b, c, breedte)); }

function blok(b, c, breedte = BREEDTE) {
  switch (b.t) {
    case 'kop': return [t(b.tekst, c, { vet: true, pt: b.niveau <= 1 ? c.pt + 5 : b.niveau === 2 ? c.pt + 3 : c.pt + 1, kleur: b.niveau <= 2 ? c.accent : undefined, marge: [0, 8, 0, 4] })];
    case 'alinea': return [t(b.tekst, c, { vet: b.nadruk, pt: b.klein ? c.pt - 2 : c.pt, kleur: b.klein ? '#4b5563' : undefined })];
    case 'lijst': return [{ [b.genummerd ? 'ol' : 'ul']: b.items.map((x) => t(x, c, { marge: [0, 0, 0, 2] })), margin: [0, 0, 0, 6] }];
    case 'vink': return b.items.map((x) => ({ columns: [{ width: 14, canvas: [{ type: 'rect', x: 0, y: 2, w: 9, h: 9, lineWidth: 0.8, lineColor: '#111827' }] }, { ...t(x, c, { marge: [0, 0, 0, 3] }), width: '*' }] }));
    case 'tabel': {
      const kolommen = Math.max(b.kop?.length ?? 0, ...b.rijen.map((r) => r.length));
      const body = [];
      if (b.kop?.some(Boolean)) body.push(b.kop.map((k) => ({ ...t(k, c, { vet: true, pt: c.pt - 1, marge: [0, 0, 0, 0] }), fillColor: '#eef2f7' })));
      for (const r of b.rijen) body.push(Array.from({ length: kolommen }, (_, i) => t(r[i] ?? '', c, { pt: c.pt - 1, marge: [0, 0, 0, 0] })));
      return [{ table: { headerRows: b.kop?.some(Boolean) ? 1 : 0, widths: b.breedtes ? b.breedtes.map((w) => `${w}%`) : Array(kolommen).fill('*'), body, dontBreakRows: true }, layout: randLayout, margin: [0, 2, 0, 8] }];
    }
    case 'vraag': return [{ stack: [t(`${b.nr}. ${b.tekst}${b.label ? `   [${b.label}]` : ''}`, c, { marge: [0, 4, 0, 0] }), ...Array.from({ length: b.regels }, () => lijn(breedte))], unbreakable: true, margin: [0, 0, 0, 8] }];
    case 'regels': return Array.from({ length: b.aantal }, () => lijn(breedte));
    case 'invulveld': return [{ table: { widths: ['*'], body: [[{ stack: [t(`⟦${b.tekst}⟧`, c), ...(b.voorbeeld ? [t(b.voorbeeld, c, { pt: c.pt - 2, kleur: '#4b5563' })] : [])] }]] }, layout: { ...streepLayout, hLineColor: () => '#d79a00', vLineColor: () => '#d79a00' }, margin: [0, 2, 0, 8] }];
    case 'kader': return [{ table: { widths: ['*'], body: [[{ stack: [...(b.titel ? [t(b.titel, c, { vet: true, kleur: c.accent })] : []), ...blokken(b.blokken, c, breedte - 20)] }]] }, layout: kaderLayout, margin: [0, 2, 0, 10] }];
    case 'schaal': return [{ table: { headerRows: 1, widths: ['*', ...b.kolommen.map(() => 60)], body: [[{ text: '', fillColor: '#eef2f7' }, ...b.kolommen.map((k) => ({ ...t(k, c, { vet: true, pt: c.pt - 1, marge: [0, 0, 0, 0] }), fillColor: '#eef2f7', alignment: 'center' }))], ...b.items.map((x) => [t(x, c, { marge: [0, 0, 0, 0] }), ...b.kolommen.map(() => ({ canvas: [{ type: 'rect', x: 22, y: 2, w: 10, h: 10, lineWidth: 0.8 }] }))])] }, layout: randLayout, margin: [0, 2, 0, 8] }];
    case 'schema': return schema(b, c);
    case 'kaarten': {
      const per = b.perPagina === 2 ? 1 : 2;
      const rijen = [];
      for (let i = 0; i < b.kaarten.length; i += per) {
        const groep = b.kaarten.slice(i, i + per);
        while (groep.length < per) groep.push(null);
        rijen.push(groep.map((k) => (k ? { stack: [{ canvas: [{ type: 'rect', x: 0, y: 0, w: (BREEDTE / per) - 14, h: 8, color: KAARTKLEUR[k.kleur] ?? c.accent }], margin: [0, 0, 0, 6] }, t(k.titel, c, { vet: true, pt: c.pt + 1 }), ...blokken(k.blokken, c, BREEDTE / per - 20)], margin: [2, 2, 2, 10] } : { text: '' })));
      }
      return [{ table: { widths: Array(per).fill('*'), body: rijen, dontBreakRows: true }, layout: streepLayout }];
    }
    case 'pagina': return [{ text: '', pageBreak: 'after' }];
    default: return [];
  }
}
const KAARTKLEUR = { groen: '#2ea836', oranje: '#f39000', rood: '#d70926', paars: '#934d98' };

function schema(b, c) {
  const it = b.items ?? [];
  const vak = (x, o = {}) => ({ ...t(x ?? '', c, { vet: o.vet, kleur: o.kleur, marge: [0, 0, 0, 0] }), alignment: 'center', margin: [0, o.hoog ? 24 : 16, 0, o.hoog ? 24 : 16], fillColor: o.vulling });
  if (b.soort === 'woordweb') {
    const r = [...it.slice(1), '', '', '', '', '', ''].slice(0, 6);
    return [{ table: { widths: ['*', '*', '*'], body: [[vak(r[0]), vak(r[1]), vak(r[2])], [vak(''), vak(it[0], { vet: true, kleur: c.accent, vulling: '#eef2f7' }), vak('')], [vak(r[3]), vak(r[4]), vak(r[5])]] }, layout: randLayout, margin: [0, 2, 0, 10] }];
  }
  if (b.soort === 'oorzaak-gevolg') return [{ table: { widths: ['*', 16, '*', 16, '*'], body: [[vak('Oorzaak', { vet: true, hoog: true }), vak('→'), vak(it[0], { vet: true, kleur: c.accent, vulling: '#eef2f7', hoog: true }), vak('→'), vak('Gevolg', { vet: true, hoog: true })]] }, layout: randLayout, margin: [0, 2, 0, 10] }];
  if (b.soort === 'tijdlijn') {
    const r = [...it, '', ''].slice(0, 5);
    return [{ table: { widths: Array(5).fill('*'), body: [r.map(() => ({ ...t('Jaar: ____', c, { pt: c.pt - 1, marge: [0, 0, 0, 0] }), fillColor: '#eef2f7' })), r.map((x) => vak(x, { hoog: true }))] }, layout: randLayout, margin: [0, 2, 0, 10] }];
  }
  const [a, d] = [it[0] ?? '⟦begrip 1⟧', it[1] ?? '⟦begrip 2⟧'];
  return [{ table: { headerRows: 1, widths: [110, '*', '*'], body: [[{ text: '', fillColor: '#eef2f7' }, { ...t(a, c, { vet: true }), fillColor: '#eef2f7' }, { ...t(d, c, { vet: true }), fillColor: '#eef2f7' }], ...['Wat is het?', 'Kenmerk', 'Voorbeeld', 'Overeenkomst of verschil'].map((r) => [t(r, c, { vet: true, pt: c.pt - 1 }), { text: '', margin: [0, 14, 0, 14] }, ''])] }, layout: randLayout, margin: [0, 2, 0, 10] }];
}

export function pdfDefinitie(docs, o = {}) {
  const basis = { accent: o.kleur ?? '#00489a', pt: 10.5, regel: 1.2 };
  const dys = { ...basis, pt: 13, regel: 1.55 };
  const content = [];
  docs.forEach((doc, i) => {
    const c = o.dyslexie && doc.voor === 'leerling' ? dys : basis;
    const kop = [];
    if (o.toonAantal && doc.aantal) kop.push(t(`Print ${doc.aantal}×${doc.aantalUitleg ? ` (${doc.aantalUitleg})` : ''}`, c, { pt: 8.5, kleur: '#4b5563' }));
    kop.push(t(doc.titel, c, { vet: true, pt: c.pt + 7, kleur: c.accent, marge: [0, 0, 0, 2] }));
    if (doc.ondertitel) kop.push(t(doc.ondertitel, c, { pt: c.pt - 1, kleur: '#4b5563', marge: [0, 0, 0, 8] }));
    content.push({ stack: [...kop, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: BREEDTE, y2: 0, lineWidth: 1.5, lineColor: c.accent }], margin: [0, 2, 0, 8] }, ...blokken(doc.blokken, c)], ...(i > 0 ? { pageBreak: 'before' } : {}) });
  });
  return {
    info: { title: docs.length === 1 ? docs[0].titel : (o.titel ?? 'Uniekind materiaal'), creator: 'Uniekind' },
    pageSize: 'A4', pageMargins: [40, 40, 40, 44],
    defaultStyle: { font: 'Roboto', fontSize: basis.pt, color: '#111827' },
    footer: (huidig, totaal) => ({ text: `${o.schoolnaam ? o.schoolnaam + ' · ' : ''}Uniekind · ${huidig}/${totaal}`, alignment: 'right', fontSize: 8, color: '#6b7280', margin: [40, 14, 40, 0] }),
    content
  };
}

/** Maakt een PDF van een of meer documenten. Geeft een Blob (browser) of Buffer (Node). */
export async function naarPdf(docs, o = {}) {
  const pm = await laadPdfMake();
  const def = pdfDefinitie(docs, o);
  return new Promise((resolve, reject) => {
    try {
      const pdf = pm.createPdf(def);
      if (typeof window === 'undefined') pdf.getBuffer((buf) => resolve(Buffer.from(buf)));
      else pdf.getBlob((blob) => resolve(blob));
    } catch (e) { reject(e); }
  });
}
