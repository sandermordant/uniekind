// Lessjablonen: de standaard lesopbouw met uitgewerkte tijdverdelingen voor 35, 50, 70 en 100 minuten.
// Een vrije lesduur wordt naar rato geschaald. De som klopt altijd exact.
//
// Slot-typen:
//   opening      aandachtrichter (startopdracht ligt klaar)
//   doel         lesdoel en relevantie-haak (geen werkvorm, vaste tekst)
//   voorkennis   voorkennis activeren
//   instructie   kern-instructie (in een M-lokaal max 15 min aaneengesloten, inclusief doel)
//   check        check op begrip met als-dan
//   verwerken    splitsen in routes
//   beweeg       beweegmoment / wissel (energizer, max 3 min)
//   tussencheck  tussentijdse check
//   afsluiting   exit ticket of afsluiter + vooruitblik

export const TABELLEN = {
  35: [['opening', 3], ['doel', 2], ['instructie', 8], ['check', 3], ['verwerken', 15], ['afsluiting', 4]],
  50: [['opening', 3], ['doel', 2], ['voorkennis', 4], ['instructie', 10], ['check', 3], ['verwerken', 23], ['afsluiting', 5]],
  70: [['opening', 4], ['doel', 3], ['voorkennis', 5], ['instructie', 12], ['check', 3], ['verwerken', 18], ['beweeg', 3], ['verwerken', 16], ['afsluiting', 6]],
  100: [['opening', 6], ['doel', 3], ['voorkennis', 7], ['instructie', 12], ['check', 4], ['verwerken', 24], ['beweeg', 3], ['tussencheck', 6], ['verwerken', 24], ['beweeg', 3], ['afsluiting', 8]]
};

export const SLOT_TITEL = {
  opening: 'Opening en aandachtrichter',
  doel: 'Lesdoel en waarom we dit leren',
  voorkennis: 'Voorkennis activeren',
  startcheck: 'Startcheck',
  instructie: 'Kern-instructie',
  check: 'Check op begrip',
  verwerken: 'Verwerken in routes',
  beweeg: 'Beweegmoment',
  tussencheck: 'Tussentijdse check',
  afsluiting: 'Afsluiting en vooruitblik'
};

const MAX_FASE = 25;
const som = (s) => s.reduce((t, x) => t + x.duur, 0);
const maak = (rij) => rij.map(([type, duur]) => ({ type, duur }));

/**
 * Geeft de slots voor een lesduur, aangepast aan lesmodel en situatie.
 * @param {number} lesduur  minuten
 * @param {object} o  { lesmodel, ruimte, extraBeweeg, extraVoorkennis, instructieMax }
 */
export function maakSlots(lesduur, o = {}) {
  const D = Math.max(20, Math.round(Number(lesduur) || 50));
  const basis = [100, 70, 50, 35].find((b) => b <= D) ?? 35;
  let slots = maak(TABELLEN[basis]);

  // Extra minuten: eerst naar verwerken (max 25 per fase), daarna een extra wissel + verwerkblok.
  let rest = D - som(slots);
  while (rest > 0) {
    const v = slots.filter((s) => s.type === 'verwerken' && s.duur < MAX_FASE).sort((a, b) => a.duur - b.duur)[0];
    if (v) { v.duur++; rest--; continue; }
    const i = slots.findIndex((s) => s.type === 'afsluiting');
    const nieuw = Math.min(rest, 3 + MAX_FASE);
    if (nieuw >= 8) {
      slots.splice(i, 0, { type: 'beweeg', duur: 3 }, { type: 'verwerken', duur: nieuw - 3 });
      rest -= nieuw;
    } else {
      slots[i].duur += rest; rest = 0; // kleine rest naar de afsluiting
    }
  }
  // Korter dan 35: haal tijd weg bij verwerken, dan opening/afsluiting
  while (rest < 0) {
    const v = slots.find((s) => s.type === 'verwerken' && s.duur > 6) ?? slots.find((s) => ['opening', 'afsluiting'].includes(s.type) && s.duur > 2) ?? slots.find((s) => s.type === 'instructie' && s.duur > 5);
    if (!v) break;
    v.duur--; rest++;
  }

  // Lesmodel
  const lm = o.lesmodel ?? 'di';
  const instr = slots.find((s) => s.type === 'instructie');
  const verw = () => slots.filter((s) => s.type === 'verwerken').sort((a, b) => a.duur - b.duur)[0];
  if (lm === 'igdi') { // korte instructie voor de hele groep, verdieping vertrekt eerder
    const doelInstr = basis >= 70 ? 10 : basis >= 50 ? 8 : 7;
    const vrij = instr.duur - doelInstr;
    if (vrij > 0) { instr.duur = doelInstr; verw().duur += vrij; }
  }
  if (lm === 'edi' && D >= 50) { // iets meer begeleide inoefening in de instructie
    const v = verw();
    if (v.duur > 12) { v.duur -= 2; instr.duur += 2; }
  }

  // Maximale aaneengesloten instructie (doel + instructie)
  const max = o.instructieMax ?? 15;
  const doel = slots.find((s) => s.type === 'doel');
  if (doel.duur + instr.duur > max) {
    const teveel = doel.duur + instr.duur - max;
    instr.duur -= teveel;
    verw().duur += teveel;
  }

  // Energizer voor een onrustige klas of het laatste uur bij korte lessen
  if (o.extraBeweeg && !slots.some((s) => s.type === 'beweeg')) {
    const v = slots.filter((s) => s.type === 'verwerken').sort((a, b) => b.duur - a.duur)[0];
    if (v.duur >= 11) {
      v.duur -= 2;
      slots.splice(slots.indexOf(slots.find((s) => s.type === 'check')) + 1, 0, { type: 'beweeg', duur: 2 });
    }
  }
  // Voorkennis expliciet nodig maar geen slot (35 minuten)
  if (o.extraVoorkennis && !slots.some((s) => s.type === 'voorkennis')) {
    const v = slots.filter((s) => s.type === 'verwerken').sort((a, b) => b.duur - a.duur)[0];
    if (v.duur >= 12) {
      v.duur -= 4;
      slots.splice(slots.findIndex((s) => s.type === 'doel') + 1, 0, { type: 'voorkennis', duur: 4 });
    }
  }

  // Splits te lange verwerkfasen (max 25 min aaneen zonder wissel)
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (s.duur > MAX_FASE) {
      const a = Math.ceil(s.duur / 2);
      slots.splice(i, 1, { type: s.type, duur: a }, { type: s.type, duur: s.duur - a });
    }
  }

  if (som(slots) !== D) throw new Error(`Sjabloonfout: ${som(slots)} ≠ ${D}`);
  return slots.map((s, i) => ({ ...s, id: `${s.type}-${slots.slice(0, i).filter((x) => x.type === s.type).length + 1}` }));
}
