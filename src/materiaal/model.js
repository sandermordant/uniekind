// Het documentmodel: één beschrijving van elk materiaal, waaruit HTML (scherm en print),
// PDF, Word en PowerPoint worden gemaakt. Een nieuw werkblad werkt daardoor meteen in elke export.
//
// Document: { id, titel, ondertitel?, voor: 'docent'|'leerling', soort, niveau?, aantal, aantalUitleg?, blokken: Blok[] }
// Blok-typen:
//   kop        { tekst, niveau: 1|2|3 }
//   alinea     { tekst, klein?, nadruk? }
//   lijst      { items: string[], genummerd? }
//   vink       { items: string[] }                         — afvinklijst met hokjes
//   tabel      { kop: string[], rijen: string[][], breedtes?: number[] }
//   vraag      { nr, tekst, regels, label? }              — vraag met schrijfregels
//   regels     { aantal }                                  — lege schrijfregels
//   invulveld  { tekst, voorbeeld? }                       — door de docent in te vullen (gemarkeerd)
//   kader      { titel?, blokken: Blok[] }
//   schaal     { items: string[], kolommen: string[] }     — zelfbeoordeling
//   schema     { soort: 'woordweb'|'oorzaak-gevolg'|'vergelijking'|'tijdlijn', items: string[] }
//   kaarten    { kaarten: { titel, kleur?, blokken: Blok[] }[], perPagina?: 2|4 }
//   pagina     {}                                          — nieuwe pagina

export const kop = (tekst, niveau = 2) => ({ t: 'kop', tekst, niveau });
export const alinea = (tekst, o = {}) => ({ t: 'alinea', tekst, ...o });
export const lijst = (items, genummerd = false) => ({ t: 'lijst', items, genummerd });
export const vink = (items) => ({ t: 'vink', items });
export const tabel = (kopRij, rijen, breedtes) => ({ t: 'tabel', kop: kopRij, rijen, breedtes });
export const vraag = (nr, tekst, regels = 3, label = '') => ({ t: 'vraag', nr, tekst, regels, label });
export const regels = (aantal = 3) => ({ t: 'regels', aantal });
export const invulveld = (tekst, voorbeeld = '') => ({ t: 'invulveld', tekst, voorbeeld });
export const kader = (titel, blokken) => ({ t: 'kader', titel, blokken });
export const schaal = (items, kolommen = ['Nog niet', 'Een beetje', 'Ja']) => ({ t: 'schaal', items, kolommen });
export const schema = (soort, items = []) => ({ t: 'schema', soort, items });
export const kaarten = (lijstKaarten, perPagina = 4) => ({ t: 'kaarten', kaarten: lijstKaarten, perPagina });
export const pagina = () => ({ t: 'pagina' });

/** Platte tekst van een document (voor zoeken en tests). */
export function tekstVan(doc) {
  const uit = [doc.titel, doc.ondertitel];
  const loop = (bl) => {
    for (const b of bl) {
      if (b.tekst) uit.push(b.tekst);
      if (b.titel) uit.push(b.titel);
      if (b.voorbeeld) uit.push(b.voorbeeld);
      if (b.items) uit.push(...b.items);
      if (b.kop) uit.push(...b.kop);
      if (b.rijen) for (const r of b.rijen) uit.push(...r);
      if (b.blokken) loop(b.blokken);
      if (b.kaarten) for (const k of b.kaarten) { uit.push(k.titel); loop(k.blokken); }
    }
  };
  loop(doc.blokken);
  return uit.filter(Boolean).join('\n');
}

/**
 * Rustige versie: minder tegelijk op een blad (maximaal drie vragen per pagina),
 * geen schema's naast vragen. Bedoeld voor leerlingen met faalangst of behoefte aan structuur.
 */
export function rustig(doc) {
  if (doc.voor !== 'leerling') return doc;
  const nieuw = [];
  let vragen = 0;
  for (const b of doc.blokken) {
    if (b.t === 'vraag') {
      if (vragen > 0 && vragen % 3 === 0) nieuw.push(pagina(), alinea('Ga rustig verder. Je doet het stap voor stap.', { klein: true }));
      vragen++;
    }
    nieuw.push(b);
  }
  return { ...doc, blokken: nieuw, rustig: true };
}
