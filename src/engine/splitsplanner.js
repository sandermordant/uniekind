import { termen } from '../data/termen.js';
// De splitsplanner: wat doe je als de klas groter is dan het lokaal, of als je bewust splitst?
// Geeft alle opties met haalbaarheid; de opbouw maakt van de gekozen optie een tijdlijn.

export const OPZETTEN = {
  klassikaal: { naam: 'Klassikaal-plus', kort: 'Je vertrouwde les met één differentiatie-element erin.' },
  routes: { naam: 'Routes vanuit het lokaal', kort: 'Iedereen begint samen; daarna steun aan de instructietafel, zelfstandig basis en verdieping op een eigen plek.' },
  'gespreide-start': { naam: 'Gespreide start', get kort() { return `De verdiepingsgroep begint direct op het ${termen.plein} met een zelfstandige startopdracht. De rest krijgt instructie in het lokaal.`; } },
  startcheck: { naam: 'Startcheck bepaalt de route', kort: 'Iedereen start op het plein met 3 tot 5 vragen. Wie alles goed heeft, blijft op het plein voor verdieping; de rest gaat naar binnen voor instructie.' },
  carrousel: { naam: 'Carrousel', kort: 'Twee groepen wisselen halverwege tussen het lokaal (instructie) en het plein (verwerken).' },
  flipped: { naam: 'Flipped start', kort: 'De pleingroep krijgt de instructie via een kennisclip op de laptop; jij geeft instructie in het lokaal.' },
  oa: { naam: 'Docent plus onderwijsassistent', kort: 'De onderwijsassistent begeleidt de pleingroep met een eigen instructiekaart.' },
  stilte: { naam: 'Stilteruimte', kort: 'Een kleine groep werkt met een eigen opdrachtkaart in de stilteruimte.' }
};

export function planSplitsing(ctx) {
  const n = ctx.aantal;
  const cap = ctx.capaciteit.lokaal;
  const overflow = Number.isFinite(cap) ? Math.max(0, n - cap) : 0;
  const v = ctx.verdeling;
  const gevraagd = ctx.opties.splitsing;
  const nodig = overflow > 0 || (ctx.stand === 3 && ctx.ruimte === 'M') || (!!gevraagd && gevraagd !== 'routes' && gevraagd !== 'klassikaal');

  const pleinGroep = Math.max(v.verdieping, overflow);
  const opties = [];
  const optie = (id, haalbaar, waaromNiet = '', extra = {}) => opties.push({ id, ...OPZETTEN[id], haalbaar, waaromNiet, ...extra });

  if (overflow === 0) optie('routes', true, '', { pleinGroep: 0 });
  const p = ctx.pleinMogelijk;
  const geenPlein = ctx.ruimte !== 'M' ? `Dit lokaal heeft geen ${termen.plein}.` : 'Er is geen toezicht op het plein mogelijk.';
  optie('gespreide-start', p && (v.bekend ? v.verdieping >= Math.max(1, overflow) : true) && pleinGroep <= ctx.capaciteit.plein,
    !p ? geenPlein : 'De verdiepingsgroep is kleiner dan het aantal leerlingen dat niet in het lokaal past.', { pleinGroep });
  optie('startcheck', p && n <= ctx.capaciteit.plein, !p ? geenPlein : 'De hele klas past niet op het plein.', { pleinGroep });
  optie('carrousel', p && Math.ceil(n / 2) <= cap, !p ? geenPlein : 'Ook de helft van de klas past niet in het lokaal.', { pleinGroep: Math.floor(n / 2) });
  optie('flipped', p && ctx.laptops !== 'geen', !p ? geenPlein : 'Er zijn geen laptops voor de kennisclip.', { pleinGroep: Math.max(pleinGroep, Math.round(n * 0.3)) });
  optie('oa', p && ctx.oa, !p ? geenPlein : 'Er is deze les geen onderwijsassistent.', { pleinGroep: Math.max(pleinGroep, Math.round(n * 0.3)) });
  const stilteGroep = overflow > 0 ? overflow : Math.min(4, ctx.capaciteit.stilte);
  optie('stilte', ctx.stilteMogelijk && stilteGroep <= ctx.capaciteit.stilte && stilteGroep > 0,
    !ctx.stilteMogelijk ? 'Er is geen stilteruimte beschikbaar.' : `De stilteruimte heeft ${ctx.capaciteit.stilte} plekken.`, { pleinGroep: stilteGroep });

  let gekozen = null;
  const haalbaar = (id) => opties.find((o) => o.id === id && o.haalbaar);
  if (gevraagd && haalbaar(gevraagd)) gekozen = gevraagd;
  else if (overflow > 0) {
    gekozen = [ctx.oa && 'oa', v.bekend && 'gespreide-start', !v.bekend && 'startcheck', 'carrousel', 'gespreide-start', 'flipped', 'stilte']
      .filter(Boolean).find((id) => haalbaar(id)) ?? null;
  }

  let reden = '';
  if (overflow > 0) reden = `Er zijn ${n} leerlingen en het ${ctx.ruimteDef?.kort ?? 'lokaal'} biedt plaats aan ${cap}. ${overflow} leerling${overflow === 1 ? '' : 'en'} moet${overflow === 1 ? '' : 'en'} dus op een andere plek werken.`;
  else if (nodig) reden = 'Je koos voor volledig Uniekind: de les werkt met meerdere routes en plekken.';

  const waarschuwing = overflow > 0 && !gekozen
    ? `Deze klas past niet in het ${ctx.ruimteDef?.kort ?? 'lokaal'} (${n} leerlingen, ${cap} plaatsen) en er is geen andere plek beschikbaar. Kies een groter lokaal of zet een stilteruimte aan.`
    : '';
  return { nodig, overflow, reden, opties, gekozen, waarschuwing };
}
