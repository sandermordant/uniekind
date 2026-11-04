// De AI-brug: Uniekind stelt een complete prompt samen die de docent in de AI-tool van de school plakt
// (bijvoorbeeld Microsoft Copilot met het schoolaccount). De prompt bevat ALLEEN lesinhoud:
// vak, niveau, lesdoelen, kernbegrippen, de tekst van de paragraaf en de gekozen werkvormen.
// Nooit klasgegevens: geen aantallen, geen ondersteuningsbehoeften, geen namen.
import { ONDERDELEN, PAKKETTEN } from './formaat.js';

const MAX_TEKST = 6000;
const DENK = { onthouden: 'onthouden', begrijpen: 'begrijpen', toepassen: 'toepassen', analyseren: 'analyseren', evalueren: 'evalueren', creeren: 'creëren' };
const ROUTE = { steun: 'steun (extra uitleg aan de instructietafel)', basis: 'basis (zelfstandig verwerken)', verdieping: 'verdieping (voor wie het lesdoel al beheerst)', zelfstandig: 'zelfstandig verwerken', wissel: 'wisselgroep', klas: 'hele klas', stilte: 'stilteruimte' };

export function maakPrompt(les, profiel, pakketId = 'alles') {
  const pakket = PAKKETTEN.find((p) => p.id === pakketId) ?? PAKKETTEN[0];
  const c = les.invoer?.context ?? {};
  const afd = profiel.afdelingen.find((a) => a.id === c.afdeling);
  const vak = profiel.vakken.find((v) => v.id === c.vak);
  const niveau = afd ? `${afd.naam}, leerjaar ${c.leerjaar ?? ''}`.trim() : '';
  const regio = profiel.school?.regio ?? 'de eigen regio';
  const doelen = les.doel.lesdoelen.map((d) => `- ${d.tekst} (denkniveau: ${DENK[d.niveau] ?? d.niveau})`);
  const begrippen = les.doel.begrippen?.length ? les.doel.begrippen.join(', ') : '(nog geen kernbegrippen gekozen: kies zelf de 3 tot 6 belangrijkste)';
  const bron = String(les.invoer?.inhoud?.tekst ?? '').trim().slice(0, MAX_TEKST);
  const werkvormen = [...new Set(les.fases.flatMap((f) => f.blokken.map((b) => b.werkvorm?.naam).filter(Boolean)))];
  const routes = [...new Set(les.groepen.map((g) => ROUTE[g.rol] ?? g.rol))];
  const onderdelen = ONDERDELEN.filter((o) => pakket.ids.includes(o.id));

  return [
    `Je bent een ervaren docent ${vak?.naam ?? ''} in het Nederlandse voortgezet onderwijs. Maak lesmateriaal voor de les hieronder. Schrijf in het Nederlands, in de je-vorm, op het niveau van ${niveau || 'de leerlingen'}. Gebruik korte, duidelijke zinnen.`.replace(/\s+/g, ' '),
    '',
    'LES',
    `Vak: ${vak?.naam ?? '-'}`,
    `Niveau: ${niveau || '-'}`,
    `Onderwerp: ${les.doel.onderwerp || '-'}`,
    `Lesduur: ${les.lesduur} minuten`,
    'Lesdoelen:',
    ...(doelen.length ? doelen : ['- (geen lesdoel opgegeven: leid een passend lesdoel af uit het onderwerp)']),
    `Kernbegrippen: ${begrippen}`,
    `Werkvormen in de les: ${werkvormen.join(', ') || '-'}`,
    `Routes: ${routes.join('; ')}. Iedereen werkt aan hetzelfde lesdoel, met meer of minder steun; alleen de verdieping gaat verder dan het doel.`,
    ...(les.invoer?.inhoud?.misvattingen ? [`Bekende misvattingen: ${les.invoer.inhoud.misvattingen}`] : []),
    '',
    ...(bron ? ['TEKST VAN DE PARAGRAAF (gebruik deze als bron; ga er niet buiten tenzij het nodig is voor een voorbeeld)', '"""', bron, '"""', ''] : []),
    'REGELS',
    '- Blijf bij de stof en het niveau van deze les. Verzin geen feiten, jaartallen, cijfers of bronnen.',
    '- Opdrachten gebruiken nooit een mobiele telefoon. Digitaal werken gaat via de schoollaptop.',
    '- Noem geen namen van echte leerlingen of docenten.',
    '- Schrijf geen inleiding en geen afsluiting, alleen de onderdelen hieronder.',
    `- Begin elk onderdeel met een eigen regel met precies drie hekjes en de naam, bijvoorbeeld "### ${onderdelen[0]?.id ?? 'NAAM'}". Gebruik geen andere kopjes.`,
    '',
    'ONDERDELEN',
    ...onderdelen.flatMap((o) => [`### ${o.id}`, o.vorm.replace('{regio}', regio), '']),
  ].join('\n').trim() + '\n';
}

/** Controleert of een prompt geen klas- of leerlinggegevens bevat (gebruikt in de tests en als vangnet). */
export function bevatKlasgegevens(prompt, les) {
  const k = les.invoer?.klas ?? {};
  const woorden = /\b(dyslexie|dyscalculie|faalangst|nt2|hoogbegaafd|ondersteuningsbehoefte|leerlingnaam)\b/i;
  if (woorden.test(prompt)) return true;
  const getallen = ['steun', 'basis', 'verdieping', 'dyslexie', 'nt2', 'faalangst'].map((x) => Number(k[x])).filter((n) => n > 1);
  return getallen.some((n) => new RegExp(`\\b${n} leerlingen\\b`).test(prompt));
}
