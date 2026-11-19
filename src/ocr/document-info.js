// Kleine, lichte gegevens over eigen materiaal (zonder de lezer zelf, die pas laadt als iemand een bestand kiest).
export const MAX_BESTAND = 15 * 1024 * 1024; // 15 MB
export const SOORTEN = '.docx,.pptx,.pdf,.txt,.md,image/*';

/** Woorden die op gegevens over leerlingen kunnen wijzen; de docent krijgt dan een waarschuwing. */
export function signalenLeerlinggegevens(tekst) {
  const woorden = String(tekst ?? '').match(/\b(dyslexie|dyscalculie|faalangst|hoogbegaafd|ondersteuningsbehoefte|leerlingnummer|geboortedatum|handelingsplan|OPP|cijferlijst)\b/gi) ?? [];
  return [...new Set(woorden.map((w) => w.toLowerCase()))];
}
