// Leesbare namen voor de sleutels uit de kennisbank.

export const CATEGORIE = {
  'instructiemodel': 'Instructiemodel',
  'differentiatievorm': 'Differentiatievorm',
  'activerende-werkvorm': 'Activerende werkvorm',
  'leerstrategie': 'Leerstrategie',
  'formatieve-check': 'Formatieve check',
  'aandachtrichter': 'Aandachtrichter',
  'energizer': 'Energizer',
  'afsluiter': 'Afsluiter',
  'routine': 'Routine'
};

export const LESFASE = {
  opening: 'Opening', voorkennis: 'Voorkennis activeren', instructie: 'Instructie', inoefenen: 'Inoefenen',
  verwerken: 'Verwerken', check: 'Check op begrip', afsluiting: 'Afsluiting'
};

export const GROEPSVORM = { individueel: 'Individueel', tweetal: 'Tweetal', groepje: 'Groepje (3-4)', klas: 'Hele klas' };

export const DENKNIVEAU = {
  onthouden: 'Onthouden', begrijpen: 'Begrijpen', toepassen: 'Toepassen',
  analyseren: 'Analyseren', evalueren: 'Evalueren', creeren: 'Creëren'
};

export const DIFFERENTIATIE = {
  niveau: 'Niveau', tempo: 'Tempo', ondersteuning: 'Mate van ondersteuning',
  'keuze-aanpak': 'Keuze in aanpak en verwerking', interesse: 'Interesse',
  groepering: 'Groepering', leeromgeving: 'Leeromgeving'
};

export const RICHTING = {
  convergent: 'Convergent: iedereen werkt aan hetzelfde doel',
  divergent: 'Divergent: verschillende doelen (verdieping)',
  beide: 'Convergent of divergent',
  nvt: ''
};

export const ONDERSTEUNING = {
  dyslexie: 'Dyslexie', dyscalculie: 'Dyscalculie', nt2: 'NT2', faalangst: 'Faalangst',
  structuur: 'Behoefte aan structuur', hoogbegaafd: 'Meer- en hoogbegaafd'
};
export const PAST = { goed: 'Past goed', aanpassen: 'Met aanpassing', minder: 'Minder geschikt' };

export const RUIMTE = { M: 'M-lokaal', L: 'L-lokaal', plein: 'Deelplein', stilte: 'Stilteruimte' };

export const VOORBEREIDING = { geen: 'Geen voorbereiding', kort: 'Korte voorbereiding (< 10 min)', uitgebreid: 'Uitgebreide voorbereiding' };
export const ENERGIE = { rustig: 'Rustig', gemiddeld: 'Gemiddeld', actief: 'Actief' };
export const INSTAP = { 1: 'Ook voor beginners', 2: 'Een stap verder', 3: 'Vraagt ervaring' };

export const BEWIJS = {
  sterk: 'Sterk onderbouwd',
  redelijk: 'Redelijk onderbouwd',
  beperkt: 'Beperkt onderzoek',
  praktijk: 'Praktijkervaring, weinig onderzoek'
};

export const DOELDOMEIN = { kwalificatie: 'Kwalificatie', socialisatie: 'Socialisatie', persoonsvorming: 'Persoonsvorming' };
export const BURGERSCHAP = { rechtvaardigheid: 'Rechtvaardigheid', inclusie: 'Inclusie', gemeenschappelijkheid: 'Gemeenschappelijkheid', duurzaamheid: 'Duurzaamheid' };

export const DOCENTSTIJL = {
  uitleggen: 'Ik leg graag zelf uit aan de hele klas.',
  structuur: 'Ik houd van structuur, rust en een vaste lesopbouw.',
  samenwerken: 'Ik laat leerlingen graag samenwerken.',
  ontdekken: 'Ik werk graag met vragen stellen en leerlingen zelf laten ontdekken.',
  digitaal: 'Ik gebruik graag digitale middelen.',
  relatie: 'Ik vind het gesprek en de relatie met leerlingen het belangrijkst.',
  houvast: 'Ik vind het spannend om de klas los te laten.'
};

export const VARIANT = { vmbo: 'vmbo', havo: 'havo', vwo: 'vwo', steun: 'Steun', basis: 'Basis', verdieping: 'Verdieping' };

export const duurTekst = (d) => (d.min === d.max ? `${d.min} min` : `${d.min}–${d.max} min`);
