// Schoolprofielen voor de algemene versie: een school gebruikt haar eigen profiel zonder dat er code verandert.
// Volgorde bij het laden (alleen als het standaardprofiel "eigenProfiel" toestaat):
//   1. ?school=<id>        een profiel dat op deze website staat (profiles/<id>.json)
//   2. ?profiel=<code>     een deellink: het profiel zit gecomprimeerd in de link zelf
//   3. eerder in deze browser gekozen profiel (localStorage)
//   4. het standaardprofiel van deze build
// Alles van buiten wordt eerst opgeschoond: alleen bekende vormen, kleuren als #rrggbb, logo alleen als afbeelding.

const SLEUTEL = 'uniekind:schoolprofiel';
const KLEUR = /^#[0-9a-fA-F]{6}$/;
const kloon = (x) => JSON.parse(JSON.stringify(x));

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const tekst = (x, max = 2000) => (typeof x === 'string' ? x.slice(0, max) : undefined);

/** Diep samenvoegen: wat in `eigen` staat wint, de rest komt uit `basis`. Lijsten worden vervangen, niet samengevoegd. */
function samen(basis, eigen) {
  if (!isObj(basis) || !isObj(eigen)) return eigen === undefined ? kloon(basis) : eigen;
  const uit = kloon(basis);
  for (const [k, v] of Object.entries(eigen)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    uit[k] = isObj(v) && isObj(basis[k]) ? samen(basis[k], v) : v;
  }
  return uit;
}

function veiligPlaatje(x) {
  if (x == null || x === '') return null;
  if (typeof x !== 'string') return null;
  if (/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(x) && x.length < 600000) return x;
  if (/^[a-z0-9/_.-]+\.(png|jpe?g|webp|svg|gif)$/i.test(x) && !x.includes('..')) return x;
  return null;
}

/** Maakt van een (mogelijk onbetrouwbaar) profiel een bruikbaar profiel, aangevuld met de basis. */
export function schoonProfiel(eigen, basis) {
  if (!isObj(eigen)) throw new Error('Dit is geen schoolprofiel.');
  const p = samen(basis, eigen);
  for (const k of ['afdelingen', 'vakken', 'ruimtes', 'pijlers', 'principes', 'kernwaarden']) if (!Array.isArray(p[k]) || (k !== 'kernwaarden' && k !== 'principes' && !p[k].length)) p[k] = kloon(basis[k]);
  p.afdelingen = p.afdelingen.filter((a) => isObj(a) && typeof a.id === 'string' && Array.isArray(a.lesduren) && a.lesduren.length).map((a) => ({
    ...a,
    id: a.id.slice(0, 40), naam: tekst(a.naam, 80) ?? a.id, niveau: ['vmbo', 'havo', 'vwo'].includes(a.niveau) ? a.niveau : 'havo',
    leerjaren: (Array.isArray(a.leerjaren) && a.leerjaren.length ? a.leerjaren : [1]).map(Number).filter((n) => n >= 1 && n <= 6),
    lesduren: a.lesduren.map(Number).filter((n) => n >= 10 && n <= 240),
    standaardLesduur: Number(a.standaardLesduur) || Number(a.lesduren[0])
  })).filter((a) => a.lesduren.length && a.leerjaren.length);
  for (const a of p.afdelingen) if (!a.lesduren.includes(a.standaardLesduur)) a.standaardLesduur = a.lesduren[0];
  if (!p.afdelingen.length) p.afdelingen = kloon(basis.afdelingen);
  const afd = new Set(p.afdelingen.map((a) => a.id));
  p.vakken = p.vakken.filter((v) => isObj(v) && typeof v.id === 'string' && typeof v.naam === 'string').map((v) => ({
    ...v, id: v.id.slice(0, 40), naam: v.naam.slice(0, 80), rekenen: !!v.rekenen,
    afdelingen: v.afdelingen === 'alle' || !Array.isArray(v.afdelingen) ? 'alle' : v.afdelingen.filter((x) => afd.has(x))
  })).map((v) => (Array.isArray(v.afdelingen) && !v.afdelingen.length ? { ...v, afdelingen: 'alle' } : v));
  if (!p.vakken.length) p.vakken = kloon(basis.vakken);
  p.ruimtes = p.ruimtes.filter((r) => isObj(r) && ['M', 'L', 'plein', 'stilte', 'anders'].includes(r.id)).map((r) => ({
    ...r, naam: tekst(r.naam, 80) ?? r.id, kort: tekst(r.kort, 40) ?? r.id,
    capaciteit: r.capaciteit == null ? null : Math.max(1, Math.min(500, Number(r.capaciteit) || 1))
  }));
  if (!p.ruimtes.some((r) => r.id === 'L')) p.ruimtes.push(kloon(basis.ruimtes.find((r) => r.id === 'L')));
  if (!p.ruimtes.some((r) => r.id === 'anders')) p.ruimtes.push(kloon(basis.ruimtes.find((r) => r.id === 'anders')));
  const k = p.huisstijl.kleuren ?? {};
  p.huisstijl.kleuren = Object.fromEntries(Object.entries(basis.huisstijl.kleuren).map(([n, std]) => [n, KLEUR.test(k[n] ?? '') ? k[n] : std]));
  p.huisstijl.logo = veiligPlaatje(p.huisstijl.logo);
  p.huisstijl.motief = veiligPlaatje(p.huisstijl.motief);
  if (!['bloom', 'rtti'].includes(p.didactiek.taxonomie)) p.didactiek.taxonomie = basis.didactiek.taxonomie;
  if (!p.didactiek.lesmodelOpties?.some((o) => o.id === p.didactiek.lesmodel)) p.didactiek.lesmodel = basis.didactiek.lesmodel;
  p.regels.telefoon = { ...basis.regels.telefoon, ...(isObj(p.regels.telefoon) ? p.regels.telefoon : {}) };
  p.uniekind.titel = tekst(p.uniekind.titel, 40) || basis.uniekind.titel;
  p.uniekind.eigenProfiel = basis.uniekind.eigenProfiel;
  p.generator = { ...basis.generator, visieAccenten: Array.isArray(p.generator?.visieAccenten) ? p.generator.visieAccenten.filter((x) => typeof x === 'string').slice(0, 20) : basis.generator.visieAccenten };
  const perVak = isObj(p.sectieAccenten?.perVak) ? p.sectieAccenten.perVak : {};
  p.sectieAccenten = { ...(basis.sectieAccenten ?? {}), ...(isObj(p.sectieAccenten) ? p.sectieAccenten : {}), perVak: Object.fromEntries(Object.entries(perVak).filter(([, a]) => isObj(a)).map(([vak, a]) => [vak, {
    ...(['di', 'adi', 'edi', 'igdi', 'eigen'].includes(a.lesmodel) ? { lesmodel: a.lesmodel } : {}),
    ...(['bloom', 'rtti'].includes(a.taxonomie) ? { taxonomie: a.taxonomie } : {}),
    ...(typeof a.methodesite === 'string' && /^https?:\/\//.test(a.methodesite) ? { methodesite: a.methodesite.slice(0, 300) } : {}),
    ...(typeof a.werkvormVanDeMaand === 'string' && /^[a-z0-9-]{1,80}$/.test(a.werkvormVanDeMaand) ? { werkvormVanDeMaand: a.werkvormVanDeMaand } : {})
  }])) };
  p.bronnenZoeken = (Array.isArray(p.bronnenZoeken) ? p.bronnenZoeken : basis.bronnenZoeken ?? []).filter((b) => isObj(b) && /^https:\/\//.test(b.url ?? ''));
  p.eigen = true;
  return p;
}

/* ── Deellink: profiel gecomprimeerd in de link ── */
const uitB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function stroom(bytes, soort) {
  const s = new Blob([bytes]).stream().pipeThrough(soort);
  return new Uint8Array(await new Response(s).arrayBuffer());
}

export async function profielNaarCode(profiel) {
  const json = new TextEncoder().encode(JSON.stringify(profiel));
  const z = await stroom(json, new CompressionStream('deflate-raw'));
  let b = '';
  for (let i = 0; i < z.length; i += 8192) b += String.fromCharCode(...z.subarray(i, i + 8192));
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function codeNaarProfiel(code) {
  const z = uitB64(code);
  const json = await stroom(z, new DecompressionStream('deflate-raw'));
  return JSON.parse(new TextDecoder().decode(json));
}

/* ── Bewaren in deze browser ── */
export function bewaarEigenProfiel(p) {
  try { localStorage.setItem(SLEUTEL, JSON.stringify(p)); return true; } catch { return false; }
}
export function wisEigenProfiel() {
  try { localStorage.removeItem(SLEUTEL); } catch { /* niets */ }
}
export function eigenProfielActief() {
  try { return !!localStorage.getItem(SLEUTEL); } catch { return false; }
}

/** Kiest het profiel volgens de volgorde bovenaan. `basis` is het standaardprofiel van deze build. */
export async function kiesProfiel(basis, haal) {
  if (!basis.uniekind?.eigenProfiel) return basis;
  const q = new URLSearchParams(location.search);
  const school = q.get('school');
  if (school && /^[a-z0-9-]{1,60}$/.test(school)) {
    try { return schoonProfiel(await haal(`./profiles/${school}.json`), basis); } catch { /* val terug */ }
  }
  const code = q.get('profiel');
  if (code) {
    try {
      const p = schoonProfiel(await codeNaarProfiel(code), basis);
      bewaarEigenProfiel(p);
      history.replaceState(null, '', location.pathname + location.hash);
      return p;
    } catch { /* ongeldige link: val terug */ }
  }
  try {
    const opgeslagen = localStorage.getItem(SLEUTEL);
    if (opgeslagen) return schoonProfiel(JSON.parse(opgeslagen), basis);
  } catch { /* geen opslag of kapot: standaard */ }
  return basis;
}

