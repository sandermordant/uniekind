// Sectie-accenten (optioneel): per vak het lesmodel, de taxonomie, de methodewebsite en de werkvorm van de maand
// van je sectie. De beheerder zet ze in het schoolprofiel (sectieAccenten.perVak); een docent kan ze ook zelf
// invullen in Mijn profiel. Dat staat alleen in de eigen browser en geldt voor de eigen lessen. Via een klein
// bestand kan de beheerder ze in het schoolprofiel zetten, zodat de hele sectie ze krijgt. Geen server.

export const LESMODELLEN = ['di', 'adi', 'edi', 'igdi', 'eigen'];
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

/** Alleen geldige velden; de rest valt weg. */
export function schoonAccent(a) {
  if (!isObj(a)) return {};
  return {
    ...(LESMODELLEN.includes(a.lesmodel) ? { lesmodel: a.lesmodel } : {}),
    ...(['bloom', 'rtti'].includes(a.taxonomie) ? { taxonomie: a.taxonomie } : {}),
    ...(typeof a.methodesite === 'string' && /^https?:\/\/\S+$/.test(a.methodesite.trim()) ? { methodesite: a.methodesite.trim().slice(0, 300) } : {}),
    ...(typeof a.werkvormVanDeMaand === 'string' && /^[a-z0-9-]{1,80}$/.test(a.werkvormVanDeMaand) ? { werkvormVanDeMaand: a.werkvormVanDeMaand } : {})
  };
}

/** Alle accenten per vak, opgeschoond; lege vakken vallen weg. */
export function schoonPerVak(perVak, vakIds = null) {
  if (!isObj(perVak)) return {};
  return Object.fromEntries(Object.entries(perVak)
    .filter(([vak]) => /^[a-z0-9-]{1,40}$/.test(vak) && (!vakIds || vakIds.includes(vak)))
    .map(([vak, a]) => [vak, schoonAccent(a)])
    .filter(([, a]) => Object.keys(a).length));
}

/** Het accent voor één vak: wat de docent zelf invulde gaat voor, de school vult aan. */
export function sectieVoor(profiel, vak, eigen = {}) {
  return { ...(profiel.sectieAccenten?.perVak?.[vak] ?? {}), ...schoonAccent(eigen?.[vak]) };
}

const SOORT = 'uniekind-sectie-accenten';

/** Bestand voor de beheerder (JSON). Bevat alleen accenten per vak, nooit leerlinggegevens. */
export function naarAccentBestand(perVak, vandaag = new Date().toISOString().slice(0, 10)) {
  return JSON.stringify({ soort: SOORT, versie: 1, gemaakt: vandaag, perVak: schoonPerVak(perVak) }, null, 1) + '\n';
}

/** Leest een bestand van een collega; gooit een fout met een leesbare melding als het geen accentbestand is. */
export function uitAccentBestand(tekst, vakIds = null) {
  const d = JSON.parse(tekst);
  if (!isObj(d) || d.soort !== SOORT) throw new Error('Dit is geen bestand met sectie-accenten uit Uniekind.');
  const perVak = schoonPerVak(d.perVak, vakIds);
  if (!Object.keys(perVak).length) throw new Error('In dit bestand staan geen accenten voor vakken van deze school.');
  return perVak;
}

/** Voegt accenten samen: per vak per veld wint het nieuwe. */
export function voegAccentenSamen(oud, nieuw) {
  const uit = { ...(isObj(oud) ? oud : {}) };
  for (const [vak, a] of Object.entries(nieuw)) uit[vak] = { ...(uit[vak] ?? {}), ...a };
  return uit;
}
