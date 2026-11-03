// Laadt schoolprofiel en kennisbank. De kennisbank laadt lui: eerst alleen index.json
// (een lichte samenvatting), en een volledige categorie pas als een werkvorm wordt geopend.

/* global __PROFIEL__ */
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

export const laadProfiel = () => json(`./profiles/${profielId}.json`);
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
