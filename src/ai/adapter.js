// AI-adapterlaag. Drie modi:
//   'geen' – alles via sjablonen (altijd beschikbaar)
//   'brug' – de docent kopieert een prompt naar de AI-tool van de school en plakt het antwoord terug (actief)
//   'api'  – de site praat zelf met een taalmodel via een eigen serverfunctie (voorbereid, staat UIT)
//
// De API-route gebruikt exact dezelfde prompt en hetzelfde antwoordformaat als de brug, zodat de
// materiaalsjablonen niet veranderen. Zie docs/api-route.md voor wat er vooraf nodig is.
import { maakPrompt, bevatKlasgegevens } from './prompt.js';
import { leesAntwoord } from './import.js';

export const MODI = { geen: 'Geen AI', brug: 'AI-brug (kopiëren en plakken)', api: 'Automatisch via de schoolserver' };

export function aiInstellingen(profiel) {
  const a = profiel.ai ?? {};
  return {
    modus: a.modus ?? 'brug',
    apiBeschikbaar: a.apiBeschikbaar === true && !!a.apiAdres,
    apiAdres: a.apiAdres ?? null,
    tool: a.tool ?? 'de AI-tool die de school toestaat',
    toolAdres: a.toolAdres ?? null
  };
}

/** Stelt de prompt samen en controleert dat er geen klasgegevens in staan. */
export function promptVoor(les, profiel, pakket) {
  const prompt = maakPrompt(les, profiel, pakket);
  if (bevatKlasgegevens(prompt, les)) throw new Error('De prompt bevat klasgegevens; dat mag niet. Neem contact op met de beheerder.');
  return prompt;
}

/**
 * API-route (later). Stuurt alleen de prompt (lesinhoud) naar de eigen serverfunctie; de API-sleutel
 * staat daar in een omgevingsvariabele en komt nooit in de browser.
 */
export async function vraagViaApi(les, profiel, pakket) {
  const inst = aiInstellingen(profiel);
  if (!inst.apiBeschikbaar) throw new Error('Automatisch aanvullen staat nog uit. Gebruik de AI-brug.');
  const prompt = promptVoor(les, profiel, pakket);
  const r = await fetch(inst.apiAdres, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, pakket }) });
  if (r.status === 429) throw new Error('Je hebt het daglimiet bereikt. Probeer het morgen opnieuw of gebruik de AI-brug.');
  if (!r.ok) throw new Error('De schoolserver gaf geen antwoord. Probeer het later of gebruik de AI-brug.');
  const { tekst } = await r.json();
  return leesAntwoord(tekst);
}
