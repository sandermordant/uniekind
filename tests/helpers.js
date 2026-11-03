import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const lees = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

export function laadData(profielId = 'sophianum') {
  const profiel = lees(`profiles/${profielId}.json`);
  const dir = join(root, 'data/werkvormen');
  const items = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !['index.json', 'werkvorm.schema.json'].includes(f))
    .flatMap((f) => lees(`data/werkvormen/${f}`).items);
  return { profiel, items };
}

/** Bouw een invoer met alleen de velden die de test noemt. */
export function invoer({ stand = 2, docent = {}, context = {}, inhoud = {}, klas = {}, opties = {} } = {}) {
  return {
    stand,
    docent,
    context,
    inhoud: { onderwerp: 'Testonderwerp', lesdoelen: [{ tekst: 'Je kunt uitleggen wat het kernbegrip betekent.' }], ...inhoud },
    klas,
    opties
  };
}

export const idsIn = (les) => les.fases.flatMap((f) => f.blokken.map((b) => b.werkvorm?.id).filter(Boolean));
export const plekkenIn = (les) => new Set(les.fases.flatMap((f) => f.blokken.map((b) => b.plek)));
export const mislukt = (les) => les.controles.filter((c) => !c.ok);
