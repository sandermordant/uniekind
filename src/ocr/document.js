// Eigen materiaal van de docent inlezen: Word (.docx), PowerPoint (.pptx), PDF, tekst of een foto.
// Alles gebeurt in de browser. Het bestand gaat nergens heen en wordt niet bewaard; alleen de tekst
// komt in het lesconcept (en, als de docent dat wil, in de AI-opdracht die hij zelf kopieert).
import JSZip from 'jszip';

import { MAX_BESTAND } from './document-info.js';
export { MAX_BESTAND, SOORTEN, signalenLeerlinggegevens } from './document-info.js';

const ontsnap = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');
const schoon = (regels) => regels.map((r) => r.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');

/** Word: de tekst per alinea (ook in tabellen), in volgorde. */
export async function tekstUitDocx(data) {
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) throw new Error('Dit Word-bestand kan Uniekind niet lezen. Sla het op als .docx en probeer het opnieuw.');
  const alineas = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((m) => [...m[0].matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)].map((x) => (x[1] != null ? ontsnap(x[1]) : ' ')).join(''));
  return schoon(alineas);
}

/** PowerPoint: per dia de tekst, met "Dia 1", "Dia 2" … ervoor. */
export async function tekstUitPptx(data) {
  const zip = await JSZip.loadAsync(data);
  const dias = Object.keys(zip.files).map((f) => f.match(/^ppt\/slides\/slide(\d+)\.xml$/)).filter(Boolean).sort((a, b) => Number(a[1]) - Number(b[1]));
  if (!dias.length) throw new Error('In deze PowerPoint vindt Uniekind geen dia’s. Sla hem op als .pptx en probeer het opnieuw.');
  const delen = [];
  for (const [pad, nr] of dias) {
    const xml = await zip.file(pad).async('string');
    const regels = [...xml.matchAll(/<a:p>[\s\S]*?<\/a:p>|<a:p\s[\s\S]*?<\/a:p>/g)].map((m) => [...m[0].matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((x) => ontsnap(x[1])).join(''));
    const tekst = schoon(regels);
    if (tekst) delen.push(`Dia ${nr}\n${tekst}`);
  }
  return delen.join('\n\n');
}

/** PDF met tekst (geen scan). pdfjs wordt meegegeven of in de browser pas geladen als het nodig is. */
export async function tekstUitPdf(data, pdfjs = null) {
  const lib = pdfjs ?? await laadPdfjs();
  const doc = await lib.getDocument({ data: new Uint8Array(data), isEvalSupported: false }).promise;
  const paginas = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const inhoud = await (await doc.getPage(i)).getTextContent();
    paginas.push(inhoud.items.map((it) => `${it.str}${it.hasEOL ? '\n' : ''}`).join(''));
  }
  const tekst = schoon(paginas.join('\n').split('\n'));
  if (!tekst) throw new Error('In deze PDF staat geen leesbare tekst (waarschijnlijk een scan). Maak een foto van de pagina of plak de tekst.');
  return tekst;
}

async function laadPdfjs() {
  const lib = await import('pdfjs-dist/build/pdf.mjs');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  return lib;
}

/** Leest een bestand en geeft de tekst terug. Een foto gaat via de tekstherkenning (ook in de browser). */
export async function leesDocument(bestand, voortgang = () => {}) {
  if (!bestand) throw new Error('Kies eerst een bestand.');
  if (bestand.size > MAX_BESTAND) throw new Error('Dit bestand is groter dan 15 MB. Kies een kleiner bestand of plak de tekst.');
  const naam = bestand.name ?? 'bestand';
  const ext = (naam.match(/\.([a-z0-9]+)$/i)?.[1] ?? '').toLowerCase();
  if (bestand.type?.startsWith('image/')) {
    const { herkenTekst } = await import('./ocr.js');
    const { tekst } = await herkenTekst(bestand, voortgang);
    return { naam, soort: 'foto', tekst };
  }
  const data = await bestand.arrayBuffer();
  if (ext === 'docx') return { naam, soort: 'Word', tekst: await tekstUitDocx(data) };
  if (ext === 'pptx') return { naam, soort: 'PowerPoint', tekst: await tekstUitPptx(data) };
  if (ext === 'pdf') return { naam, soort: 'PDF', tekst: await tekstUitPdf(data) };
  if (['txt', 'md'].includes(ext)) return { naam, soort: 'tekst', tekst: schoon(new TextDecoder().decode(data).split('\n')) };
  if (['doc', 'ppt'].includes(ext)) throw new Error('Dit is een oud Office-bestand. Sla het op als .docx of .pptx en probeer het opnieuw.');
  throw new Error('Dit soort bestand kan Uniekind niet lezen. Kies Word (.docx), PowerPoint (.pptx), PDF, tekst of een foto.');
}
