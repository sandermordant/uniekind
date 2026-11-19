// Overige vakken: vakken waarvoor SLO kerndoelen, examenprogramma's of syllabi publiceert, maar die niet in het
// schoolprofiel staan. Ze zijn kiesbaar in de lesmaker en de werkplek onder het kopje "Overige vakken", zodat elke
// docent bij alle stof kan. Ze zeggen niets over wat de school aanbiedt: daarvoor blijft het schoolprofiel leidend.
// De afdelingen volgen uit de niveaus van de SLO-kaders (tests/overige-vakken.test.js controleert dat).
// Staat een vak ook in het schoolprofiel, dan wint het profiel.

export const OVERIGE_VAKKEN = [
  { id: 'spaans', naam: 'Spaans', afdelingen: 'alle', taal: true },
  { id: 'italiaans', naam: 'Italiaans', afdelingen: ['havo', 'vwo-a', 'vwo-g'], taal: true },
  { id: 'russisch', naam: 'Russisch', afdelingen: ['havo', 'vwo-a', 'vwo-g'], taal: true },
  { id: 'turks', naam: 'Turks', afdelingen: ['vmbo-b', 'vmbo-k', 'mavo', 'havo', 'vwo-a', 'vwo-g'], taal: true },
  { id: 'arabisch', naam: 'Arabisch', afdelingen: ['vmbo-b', 'vmbo-k', 'mavo', 'havo', 'vwo-a', 'vwo-g'], taal: true },
  { id: 'chinees', naam: 'Chinees', afdelingen: ['havo', 'vwo-a', 'vwo-g'], taal: true },
  { id: 'fries', naam: 'Fries', afdelingen: 'alle', taal: true },
  { id: 'informatica', naam: 'Informatica', afdelingen: 'alle' },
  { id: 'nlt', naam: 'NLT (natuur, leven en technologie)', afdelingen: ['havo', 'vwo-a', 'vwo-g'] },
  { id: 'anw', naam: 'ANW (algemene natuurwetenschappen)', afdelingen: ['havo', 'vwo-a', 'vwo-g'] },
  { id: 'maw', naam: 'Maatschappijwetenschappen', afdelingen: ['havo', 'vwo-a', 'vwo-g'] },
  { id: 'drama', naam: 'Drama', afdelingen: 'alle' },
  { id: 'dans', naam: 'Dans', afdelingen: ['vmbo-b', 'vmbo-k', 'mavo', 'havo', 'vwo-a', 'vwo-g'] },
  { id: 'film', naam: 'Film', afdelingen: ['mavo', 'havo', 'vwo-a', 'vwo-g'] }
];

/** Het profiel met de overige vakken erachter (gemarkeerd met overig: true). Verandert het origineel niet. */
export function metOverigeVakken(profiel) {
  const ids = new Set(profiel.vakken.map((v) => v.id));
  const afd = new Set(profiel.afdelingen.map((a) => a.id));
  const extra = OVERIGE_VAKKEN.filter((v) => !ids.has(v.id)).map((v) => ({
    ...v, rekenen: false, taal: !!v.taal, overig: true,
    afdelingen: v.afdelingen === 'alle' ? 'alle' : v.afdelingen.filter((a) => afd.has(a))
  })).filter((v) => v.afdelingen === 'alle' || v.afdelingen.length);
  return { ...profiel, vakken: [...profiel.vakken, ...extra] };
}

/** Het profiel zonder de overige vakken, bijvoorbeeld om het schoolprofiel te bewerken of te downloaden. */
export const zonderOverigeVakken = (profiel) => ({ ...profiel, vakken: profiel.vakken.filter((v) => !v.overig) });

/** Vakken op alfabetische volgorde (T&T staat dan onder de T). Verandert de volgorde in het profiel niet. */
export const opNaam = (vakken) => [...vakken].sort((a, b) => a.naam.localeCompare(b.naam, 'nl', { sensitivity: 'base' }));

/** Keuzelijst [id, naam, groep] voor een select, op alfabet; de overige vakken komen in een eigen groep. */
export const vakKeuzes = (vakken) => opNaam(vakken).map((v) => [v.id, v.naam, v.overig ? 'Overige vakken (alle stof van SLO)' : '']);
