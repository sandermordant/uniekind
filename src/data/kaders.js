// Leerdoelenkaders van SLO: kerndoelen onderbouw, examenprogramma's en syllabi (open data, MIT).
// Gemaakt met tools/importeer-slo.js. Een kader wordt pas geladen als de docent het opent.

const cache = new Map();
async function json(pad) {
  if (!cache.has(pad)) cache.set(pad, fetch(pad).then((r) => { if (!r.ok) throw new Error(`Kon ${pad} niet laden`); return r.json(); }).catch((e) => { cache.delete(pad); throw e; }));
  return cache.get(pad);
}

export const laadKaderIndex = () => json('./data/kaders/index.json');
/** Eén kader (uit het bestand van zijn vak). */
export const laadKader = (info) => json(`./data/kaders/${info.bestand}`).then((f) => f.kaders?.[info.id] ?? null);
/** Alle kaders van één vak in één keer. */
export const laadVak = (bestand) => json(`./data/kaders/${bestand}`);

export const SOORT_NAAM = { kerndoelen: 'Kerndoelen', leerdoelenkaart: 'Leerdoelenkaart (onderwerpen)', examenprogramma: 'Examenprogramma', syllabus: 'Syllabus (centraal examen)', keuzevakken: 'Keuzevakken (beroepsgericht)', referentiekader: 'Referentiekader (taal, rekenen, ERK)' };

/** Het SLO-niveau van een afdeling: vmbo-bb, vmbo-kb, vmbo-gltl, havo of vwo. */
export function sloNiveau(afdeling) {
  if (!afdeling) return null;
  if (afdeling.slo) return afdeling.slo;
  return afdeling.niveau === 'vmbo' ? null : afdeling.niveau;
}

/** Hoort deze klas nog bij de onderbouw? Standaard: vmbo t/m leerjaar 2, havo/vwo t/m leerjaar 3. */
export function isOnderbouw(afdeling, leerjaar) {
  const tot = afdeling?.onderbouwTot ?? (afdeling?.niveau === 'vmbo' ? 2 : 3);
  return Number(leerjaar) <= tot;
}

/**
 * Kaders die bij dit vak en deze afdeling passen, de meest voor de hand liggende eerst:
 * in de onderbouw de geldende kerndoelen, in de bovenbouw het examenprogramma en de syllabus.
 */
export function kadersVoor(index, { vak, afdeling, leerjaar }) {
  const niveau = sloNiveau(afdeling);
  const onder = isOnderbouw(afdeling, leerjaar);
  const past = (k) => k.vakken.includes(vak) && (k.niveaus.includes('onderbouw') || k.niveaus.includes('alle') || !niveau || k.niveaus.includes(niveau) || (afdeling?.niveau === 'vmbo' && k.niveaus.some((n) => n.startsWith('vmbo'))));
  const gewicht = (k) => {
    let g = 0;
    if (k.status !== 'geldend') g += 10;
    if (onder) g += k.soort === 'kerndoelen' ? 0 : k.soort === 'leerdoelenkaart' ? 1 : 5;
    else g += k.soort === 'kerndoelen' ? 6 : k.soort === 'examenprogramma' ? 0 : k.soort === 'syllabus' ? 1 : 2;
    if (niveau && !k.niveaus.includes(niveau) && !k.niveaus.includes('onderbouw') && !k.niveaus.includes('alle')) g += 3;
    return g;
  };
  return index.kaders.filter(past).sort((a, b) => gewicht(a) - gewicht(b) || a.titel.localeCompare(b.titel, 'nl'));
}

const mooi = (c) => String(c ?? '').replace(/^Domein([A-Z])$/, 'Domein $1').trim();

/** Alle regels van een kader, plat, met een sleutel per regel en het pad van codes erboven. */
export function vlak(kader) {
  const uit = [];
  const loop = (items, pad, codes, diepte) => items.forEach((x, i) => {
    const sleutel = `${kader.id}:${[...pad, i].join('.')}`;
    const eigen = mooi(x.c);
    // Staat de code al aan het begin van de tekst ("Domein B Concept schaarste"), dan niet nog eens ervoor
    const code = [...codes, x.t.startsWith(eigen) ? '' : eigen].filter((c) => c && !/^(Kerndoel|Overig)$/.test(c)).join(' · ');
    uit.push({ sleutel, code, tekst: x.t, kop: x.kop, d: x.d, toel: x.toel ?? [], begrippen: x.b ?? [], ce: !!x.ce, se: !!x.se, diepte, heeftKinderen: !!x.k?.length });
    if (x.k?.length) loop(x.k, [...pad, i], eigen ? [...codes, eigen] : codes, diepte + 1);
  });
  loop(kader.items, [], [], 0);
  return uit;
}

/** Korte vakbegrippen uit de syllabus, bruikbaar als kernbegrippen (lange opsommingen zoals topografie niet). */
export function korteBegrippen(begrippen) {
  return [...new Set((begrippen ?? []).map((b) => String(b).split(':')[0].trim()).filter((b) => b.length > 1 && b.length <= 40 && !b.includes(',')))];
}

/** Is dit een doelzin (De kandidaat kan…, De leerling…) en dus bruikbaar als lesdoel? */
export const isDoelzin = (tekst) => /^De (kandidaat|leerling)\b/i.test(String(tekst ?? '').trim());

/** Maakt van een eindterm een eerste versie van een lesdoel in de je-vorm. De docent past hem daarna aan. */
export function alsLesdoel(tekst) {
  let t = String(tekst ?? '').trim().replace(/\.$/, '');
  t = t.replace(/^De (kandidaat|leerling) kan\s+/i, 'Je kunt ')
    .replace(/^De (kandidaat|leerling) leert\s+/i, 'Je leert ')
    .replace(/^De (kandidaat|leerling)\s+/i, 'Je ');
  if (!/^Je /.test(t)) t = `Je kunt ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  return `${t}.`;
}
