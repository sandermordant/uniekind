import { pastBijVak, VISIE_ACCENTEN } from './score.js';
// "Waarom deze?": de uitleg bij elke werkvorm en bij de les als geheel.
// Toon: bemoedigend en collegiaal, nooit belerend.

const NIVEAU = { onthouden: 'onthouden', begrijpen: 'begrijpen', toepassen: 'toepassen', analyseren: 'analyseren', evalueren: 'evalueren', creeren: 'creëren' };
const BEHOEFTE = { dyslexie: 'dyslexie', dyscalculie: 'dyscalculie', nt2: 'een NT2-achtergrond', faalangst: 'faalangst', structuur: 'behoefte aan structuur', hoogbegaafd: 'meer- of hoogbegaafdheid' };
const STIJL = {
  uitleggen: 'je legt graag zelf uit', structuur: 'je houdt van structuur en rust', samenwerken: 'je laat leerlingen graag samenwerken',
  ontdekken: 'je laat leerlingen graag zelf ontdekken', digitaal: 'je gebruikt graag digitale middelen', relatie: 'het gesprek met leerlingen vind je het belangrijkst',
  houvast: 'je houdt graag overzicht over de klas'
};
const BEWIJS = { sterk: 'Sterk onderbouwd', redelijk: 'Redelijk onderbouwd', beperkt: 'Beperkt onderzoek', praktijk: 'Praktijkervaring, weinig onderzoek' };
const ROLZIN = {
  steun: 'Voor de leerlingen die na de check nog twijfelen: zij krijgen extra uitleg in een kleine groep.',
  verdieping: 'Voor wie het lesdoel al beheerst: zo blijft ook de leerling aan de bovenkant uitgedaagd.',
  startcheck: 'De startcheck laat zien wie welke route nodig heeft, zodat je niet hoeft te gokken.',
  zelfinstructie: 'Deze groep krijgt de uitleg op papier, zodat jij tegelijk instructie kunt geven in het lokaal.',
  clip: 'Deze groep krijgt de uitleg via een kennisclip, zodat jij tegelijk instructie kunt geven in het lokaal.',
  startopdracht: 'Zo kan deze groep meteen beginnen, zonder op jou te wachten.',
  element: 'Dit is het ene differentiatie-element in je vertrouwde les.'
};

function topStijlen(ctx) {
  return Object.entries(ctx.docent.stijl ?? {}).filter(([, v]) => v >= 4).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

function visieZin(item, ctx) {
  const p = ctx.profiel;
  const pijler = (id) => p.pijlers?.find((x) => x.id === id)?.naam;
  const principe = (id) => p.principes?.find((x) => x.id === id);
  if (item.perspectieven && pijler('goed-samenleven')) return `Dit sluit aan bij ${pijler('goed-samenleven').toLowerCase()}: leerlingen leren van elkaars perspectief.`;
  if (item.categorie === 'differentiatievorm' && principe('differentiatie-instructie')) return `Dit sluit aan bij het principe ${principe('differentiatie-instructie').naam.toLowerCase()} ${principe('differentiatie-instructie').paragraaf ? `(schoolplan § ${principe('differentiatie-instructie').paragraaf})` : ''}: gedifferentieerde instructie en begeleiding.`;
  if ((item.groepsvorm.includes('tweetal') || item.groepsvorm.includes('groepje')) && p.koers?.citaat) return `"${p.koers.citaat.split('.')[0]}." Samenwerkend leren naast individueel leren.`;
  if (item.categorie === 'formatieve-check') return 'Evidence-informed: je beslist op basis van wat je ziet bij de hele klas, niet op gevoel.';
  if (item.doeldomein.includes('persoonsvorming') && pijler('goed-leven')) return `Dit raakt aan ${pijler('goed-leven').toLowerCase()}: leerlingen leren hun eigen aanpak kennen.`;
  const accent = (p.generator?.visieAccenten ?? []).map((a) => VISIE_ACCENTEN[a]).find((a) => a && a.bonus && a.past(item));
  if (accent) return `Dit past bij de visie van ${p.school.naam}: ${accent.naam.charAt(0).toLowerCase()}${accent.naam.slice(1)}.`;
  return 'Evidence-informed: een werkvorm met een eerlijke onderbouwing.';
}

export function uitlegWerkvorm(item, blok, delen = {}, ctx) {
  const zinnen = [];
  if (ROLZIN[blok?.rol]) zinnen.push(ROLZIN[blok.rol]);
  const passend = item.denkniveau.filter((n) => ctx.niveaus.includes(n));
  if (passend.length && ['instructiemodel', 'activerende-werkvorm', 'leerstrategie', 'differentiatievorm'].includes(item.categorie)) {
    zinnen.push(`Je lesdoel vraagt ${passend.map((n) => NIVEAU[n]).join(' en ')}, en daar is deze werkvorm geschikt voor.`);
  }
  const goed = Object.entries(ctx.behoeften).filter(([b, n]) => n > 0 && item.ondersteuning[b]?.past === 'goed').map(([b]) => BEHOEFTE[b]);
  if (goed.length) zinnen.push(`Werkt goed voor leerlingen met ${goed.join(', ').replace(/, ([^,]*)$/, ' en $1')}.`);
  if (ctx.dynamiek === 'onrustig' && item.energie === 'rustig') zinnen.push('Rustig en voorspelbaar, wat helpt bij een onrustige klas.');
  if (ctx.samenwerken === 'moeizaam' && item.groepsvorm.includes('tweetal') && !item.groepsvorm.includes('groepje')) zinnen.push('In tweetallen, omdat samenwerken in groepjes nog lastig is.');
  const top = topStijlen(ctx).filter((s) => item.docentstijl.includes(s));
  if (top.length) zinnen.push(`Past bij jou: ${STIJL[top[0]]}.`);
  if (ctx.vak?.kernwerkvormen?.includes(item.id)) zinnen.push(`Een werkvorm die bij ${ctx.vak.naam} hoort.`);
  else if (pastBijVak(item, ctx.vak)) zinnen.push(`Er staat een voorbeeld uit ${ctx.vak.naam} bij.`);
  if (ctx.sectie?.werkvormVanDeMaand === item.id) zinnen.push(`De werkvorm van de maand in je ${ctx.profiel.terminologie?.sectie ?? 'sectie'}.`);
  return {
    koppeling: zinnen.join(' '),
    visie: visieZin(item, ctx),
    onderbouwing: item.waarom,
    bewijs: BEWIJS[item.bewijs]
  };
}

export function uitlegLes(les, ctx) {
  const doel = ctx.inhoud.doelen[0]?.tekst;
  const niveau = ctx.niveaus.map((n) => NIVEAU[n]).join(' en ');
  const klas = les.splitsing.overflow > 0
    ? `${ctx.aantal} leerlingen in een ${ctx.ruimteDef?.kort ?? 'lokaal'} voor ${les.capaciteit.lokaal}, dus de les start al gesplitst`
    : `${ctx.aantal} leerlingen in een ${ctx.ruimteDef?.kort ?? 'lokaal'}`;
  const z1 = `Deze opzet past bij je lesdoel${doel ? ` ("${doel}")` : ''}, dat vraagt om ${niveau}, en bij je klas: ${klas}.`;

  const kracht = ctx.docent.kracht?.trim();
  const top = topStijlen(ctx)[0];
  const wie = kracht ? `Omdat jij sterk bent in ${kracht.replace(/^ik ben (goed|sterk) in /i, '').replace(/\.$/, '')}` : top ? `Omdat ${STIJL[top].replace(/^je /, 'jij ')}` : 'Omdat je vanuit je eigen les vertrekt';
  const element = les.differentiatie[0]?.naam?.toLowerCase();
  const wat = {
    1: `blijft je les herkenbaar en voegen we alleen één differentiatie-element toe${element ? `: ${element}` : ''}`,
    2: 'houden we een korte gezamenlijke instructie, met daarna een instructietafel voor wie meer uitleg nodig heeft en verdieping voor wie klaar is',
    3: 'werkt de les met meerdere routes en plekken, zodat elke leerling op zijn eigen niveau aan hetzelfde doel werkt'
  }[ctx.stand];
  const motto = ctx.profiel.motto?.tekst ? ` Zo heeft de les aandacht voor de leerling die dreigt af te haken én voor wie meer kan: ${ctx.profiel.motto.tekst.toLowerCase()}.` : '';
  return `${z1} ${wie}, ${wat}.${motto}`;
}
