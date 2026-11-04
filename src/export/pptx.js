// Les → PowerPoint (.pptx) met PptxGenJS: een dia per lesfase in de huisstijl.
// De docent past hem verder aan in PowerPoint. In de notities staat wat je zegt en hoe de werkvorm gaat.
import { segmenten, hex } from './delen.js';

const PLEK = { lokaal: 'Lokaal', plein: 'Plein', stilte: 'Stilteruimte' };

function tekstRuns(s, o = {}) {
  return segmenten(s).map((x) => ({ text: x.tekst, options: { ...o, ...(x.invul ? { highlight: 'FFF3C4', color: '7A4B00' } : {}) } }));
}

export async function naarPptx(les, data, o = {}) {
  const mod = await import('pptxgenjs');
  const PptxGenJS = mod.default ?? mod;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inch
  const k = data.profiel.huisstijl.kleuren;
  const A = hex(k.hoofd);
  const balk = [k.paars, k.rood, k.oranje, k.geel, k.groen].map(hex);
  const itemMap = data.itemMap ?? new Map(data.items.map((i) => [i.id, i]));
  const doelen = les.doel.lesdoelen.map((d) => d.tekst);
  const onderwerp = les.doel.onderwerp || 'Les';
  const font = 'Arial';

  pptx.defineSlideMaster({
    title: 'UNIEKIND',
    background: { color: 'FFFFFF' },
    objects: [
      ...balk.map((c, i) => ({ rect: { x: (13.333 / 5) * i, y: 7.38, w: 13.333 / 5, h: 0.12, fill: { color: c } } })),
      { text: { text: `${data.profiel.school.naam} · ${onderwerp}`, options: { x: 0.5, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: '6B7280', fontFace: font } } }
    ],
    slideNumber: { x: 12.4, y: 7.0, fontSize: 10, color: '6B7280' }
  });

  // Titeldia
  const t = pptx.addSlide({ masterName: 'UNIEKIND' });
  t.addText(onderwerp, { x: 0.7, y: 1.6, w: 12, h: 1.2, fontSize: 44, bold: true, color: A, fontFace: font });
  t.addText('Vandaag ga je leren:', { x: 0.7, y: 3.0, w: 12, h: 0.5, fontSize: 20, color: '374151', fontFace: font });
  t.addText(doelen.length ? doelen.map((d) => ({ text: d, options: { bullet: true } })) : [{ text: '⟦Lesdoel⟧', options: { bullet: true, highlight: 'FFF3C4' } }], { x: 0.9, y: 3.5, w: 11.5, h: 2.2, fontSize: 24, color: '111827', fontFace: font, valign: 'top' });
  t.addNotes(les.waarom);

  for (const f of les.fases) {
    const s = pptx.addSlide({ masterName: 'UNIEKIND' });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 1.15, fill: { color: A } });
    s.addText(f.titel, { x: 0.5, y: 0.15, w: 9.5, h: 0.85, fontSize: 30, bold: true, color: 'FFFFFF', fontFace: font });
    s.addText(`minuut ${f.start}–${f.start + f.duur}`, { x: 10, y: 0.15, w: 2.9, h: 0.85, fontSize: 20, color: 'FFFFFF', align: 'right', fontFace: font });
    if (doelen[0]) s.addText(`Lesdoel: ${doelen[0]}`, { x: 0.5, y: 1.25, w: 12.3, h: 0.45, fontSize: 14, color: '4B5563', fontFace: font });

    const notities = [];
    const blokken = f.blokken.filter((b) => !b.vervolg || f.blokken.length > 1);
    if (f.type === 'doel') {
      s.addText([
        ...doelen.map((d) => ({ text: d, options: { bullet: true, fontSize: 26 } })),
        { text: ' ', options: { breakLine: true } },
        { text: les.doel.relevantie.vraag, options: { fontSize: 22, bold: true, color: A, breakLine: true } },
        ...tekstRuns('⟦Zet hier je eigen voorbeeld uit het leven van je leerlingen of uit de regio⟧', { fontSize: 20 })
      ], { x: 0.7, y: 1.9, w: 12, h: 4.8, valign: 'top', fontFace: font, color: '111827' });
      if (les.doel.relevantie.regionaal) notities.push(`Idee uit de regio: ${les.doel.relevantie.regionaal}`);
    } else if (f.type === 'verwerken' && blokken.length > 1) {
      const rijen = [[{ text: 'Groep', options: { bold: true, fill: { color: 'EEF2F7' } } }, { text: 'Waar', options: { bold: true, fill: { color: 'EEF2F7' } } }, { text: 'Wat', options: { bold: true, fill: { color: 'EEF2F7' } } }, { text: 'Tot', options: { bold: true, fill: { color: 'EEF2F7' } } }]];
      for (const b of blokken) {
        rijen.push([
          b.groepen.map((g) => les.groepen.find((x) => x.id === g)?.naam ?? g).join(' + '),
          PLEK[b.plek] ?? b.plek,
          b.werkvorm?.naam ?? b.tekst ?? '',
          `minuut ${f.start + f.duur}`
        ]);
      }
      s.addTable(rijen, { x: 0.6, y: 1.95, w: 12.1, colW: [3.6, 1.8, 5.1, 1.6], fontSize: 18, fontFace: font, color: '111827', border: { type: 'solid', pt: 0.75, color: '9CA3AF' }, valign: 'middle' });
    } else {
      // Hoofdblok (in het lokaal) groot; wat andere groepen ondertussen doen onderaan
      const b = blokken.find((x) => x.plek === 'lokaal') ?? blokken[0];
      const anderen = blokken.filter((x) => x !== b);
      const it = b?.werkvorm ? itemMap.get(b.werkvorm.id) : null;
      const hoogte = anderen.length ? 3.6 : 4.8;
      if (f.type === 'instructie') {
        s.addShape(pptx.ShapeType.rect, { x: 0.7, y: 1.95, w: 11.9, h: hoogte, line: { color: 'D79A00', dashType: 'dash', width: 1.5 }, fill: { color: 'FFFBEB' } });
        s.addText('Plaats voor je eigen uitleg: tekst, schema, uitgewerkt voorbeeld', { x: 0.9, y: 1.95 + hoogte / 2 - 0.5, w: 11.5, h: 1, fontSize: 24, color: '7A4B00', align: 'center', fontFace: font });
      } else {
        const regels = [];
        if (it) regels.push({ text: it.naam, options: { fontSize: 30, bold: true, color: A, breakLine: true } });
        if (['check', 'tussencheck', 'startcheck'].includes(f.type)) {
          regels.push(...tekstRuns('⟦Checkvraag: zet hier je vraag met antwoorden A, B, C en D⟧', { fontSize: 24, breakLine: true }));
          regels.push({ text: 'A ……   B ……   C ……   D ……', options: { fontSize: 24, color: '374151', breakLine: true } });
        } else if (f.type === 'opening') {
          regels.push(...tekstRuns('⟦Zet hier je vraag, foto, getal of voorwerp⟧', { fontSize: 24, breakLine: true }));
        } else if (f.type === 'afsluiting') {
          regels.push({ text: 'Exit ticket: maak het kaartje en lever het in bij de deur.', options: { fontSize: 24, breakLine: true } });
          regels.push({ text: 'Volgende les: ', options: { fontSize: 22, bold: true } });
          regels.push(...tekstRuns('⟦vooruitblik⟧', { fontSize: 22, breakLine: true }));
        } else if (it) {
          regels.push({ text: it.kort, options: { fontSize: 22, color: '374151', breakLine: true } });
        } else if (b?.tekst) regels.push({ text: b.tekst, options: { fontSize: 24 } });
        s.addText(regels.length ? regels : [{ text: ' ' }], { x: 0.7, y: 1.95, w: 12, h: hoogte, valign: 'top', fontFace: font, color: '111827' });
      }
      if (anderen.length) {
        s.addText([{ text: 'Ondertussen: ', options: { bold: true } }, { text: anderen.map((x) => `${x.groepen.map((g) => les.groepen.find((y) => y.id === g)?.naam ?? g).join(' + ')} werkt ${x.plek === 'plein' ? 'op het plein' : x.plek === 'stilte' ? 'in de stilteruimte' : 'in het lokaal'} aan ${x.werkvorm?.naam ?? 'de opdracht'}`).join('; ') + '.' }],
          { x: 0.7, y: 5.75, w: 12, h: 0.9, fontSize: 16, color: '374151', fontFace: font, fill: { color: 'EEF2F7' }, margin: 8 });
      }
    }
    for (const b of f.blokken) {
      const it = b.werkvorm ? itemMap.get(b.werkvorm.id) : null;
      if (it && !b.vervolg) notities.push(`${it.naam}${les.groepen.length > 1 ? ` (${b.groepen.join('+')}, ${PLEK[b.plek]})` : ''}\nJe zegt: "${it.startzin}"\n${it.stappen.map((x, i) => `${i + 1}. ${x}`).join('\n')}${it.alsDan?.length ? '\nAls-dan:\n' + it.alsDan.map((r) => `- Als ${r.als}: ${r.dan}`).join('\n') : ''}`);
    }
    if (notities.length) s.addNotes(notities.join('\n\n').replace(/[⟦⟧]/g, ''));
  }

  // Routeschema
  if (les.groepen.length > 1) {
    const s = pptx.addSlide({ masterName: 'UNIEKIND' });
    s.addText('Wie is waar?', { x: 0.5, y: 0.25, w: 12, h: 0.8, fontSize: 32, bold: true, color: A, fontFace: font });
    const plekken = [...new Set(les.fases.flatMap((f) => f.blokken.map((b) => b.plek)))];
    const rijen = [[{ text: 'Minuut', options: { bold: true, fill: { color: 'EEF2F7' } } }, ...plekken.map((p) => ({ text: PLEK[p], options: { bold: true, fill: { color: 'EEF2F7' } } }))]];
    for (const f of les.fases) rijen.push([`${f.start}–${f.start + f.duur}`, ...plekken.map((p) => f.blokken.filter((b) => b.plek === p).map((b) => b.groepen.join('+')).join(', '))]);
    s.addTable(rijen, { x: 0.5, y: 1.2, w: 12.3, fontSize: 14, fontFace: font, color: '111827', border: { type: 'solid', pt: 0.75, color: '9CA3AF' } });
  }

  return typeof window === 'undefined' ? pptx.write({ outputType: 'nodebuffer' }) : pptx.write({ outputType: 'blob' });
}
