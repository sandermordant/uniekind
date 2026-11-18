// Laadt schoolprofiel en kennisbank. De kennisbank laadt lui: eerst alleen index.json
// (een lichte samenvatting), en een volledige categorie pas als een werkvorm wordt geopend.

/* global __PROFIEL__ */
import { kiesProfiel } from './profiel.js';
import { metOverigeVakken } from './overige-vakken.js';
const cache = new Map();

async function json(pad) {
  if (cache.has(pad)) return cache.get(pad);
  const p = fetch(pad).then((r) => {
    if (!r.ok) throw new Error(`Kon ${pad} niet laden (${r.status})`);
    return r.json();
  });
  cache.set(pad, p);
  try {
    return await p;
  } catch (e) {
    cache.delete(pad);
    throw e;
  }
}

export const profielId = typeof __PROFIEL__ !== 'undefined' ? __PROFIEL__ : 'sophianum';

// Het standaardprofiel van deze build, of (in de algemene versie) het eigen profiel van de school.
let gekozen = null;
export const laadStandaardProfiel = () => json(`./profiles/${profielId}.json`);
export const laadProfiel = () => (gekozen ??= laadStandaardProfiel().then((basis) => kiesProfiel(basis, json)).then(metOverigeVakken));
export const laadIndex = () => json('./data/werkvormen/index.json');
export const laadBronnen = () => json('./data/bronnen.json').then((d) => d.bronnen);
export const laadTaxonomie = () => json('./data/taxonomie.json');
export const laadSchema = () => json('./data/werkvormen/werkvorm.schema.json');

export async function laadWerkvorm(id) {
  const index = await laadIndex();
  const kort = index.items.find((i) => i.id === id);
  if (!kort) return null;
  const cat = await json(`./data/werkvormen/${kort.bestand}`);
  return cat.items.find((i) => i.id === id) ?? null;
}

/** Alle werkvormen volledig (nodig voor de generator). Wordt pas geladen als je een les maakt. */
export async function laadAlleWerkvormen() {
  const index = await laadIndex();
  const cats = await Promise.all(index.categorieen.map((c) => json(`./data/werkvormen/${c.bestand}`)));
  return cats.flatMap((c) => c.items);
}
export const laadBronnenPerVak = () => json('./data/bronnen-per-vak.json');
