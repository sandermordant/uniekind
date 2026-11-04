// Lesbestand (.uniekind): een les bewaren als bestand en later weer openen.
// Intern JSON met een versienummer. Bevat alleen de invoer (aantallen, geen namen) en je aanpassingen;
// de les zelf wordt bij openen opnieuw opgebouwd, dus ook met een nieuwere kennisbank werkt het.

export const FORMAAT = 'uniekind-les';
export const VERSIE = 1;

const getal = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

/** Alleen wat nodig is; klasgegevens als getallen. */
function schoon(invoer) {
  const k = invoer.klas ?? {};
  return {
    stand: invoer.stand,
    docent: invoer.docent,
    context: invoer.context,
    inhoud: invoer.inhoud,
    klas: {
      verdelingBekend: !!k.verdelingBekend,
      steun: getal(k.steun), basis: getal(k.basis), verdieping: getal(k.verdieping),
      dyslexie: getal(k.dyslexie), dyscalculie: getal(k.dyscalculie), nt2: getal(k.nt2), faalangst: getal(k.faalangst), structuur: getal(k.structuur), hoogbegaafd: getal(k.hoogbegaafd),
      dynamiek: k.dynamiek, samenwerken: k.samenwerken
    },
    opties: { vastgezet: invoer.opties?.vastgezet ?? {}, overslaan: invoer.opties?.overslaan ?? {}, splitsing: invoer.opties?.splitsing ?? null }
  };
}

export function maakLesbestand(concept, les, profielId) {
  return JSON.stringify({
    formaat: FORMAAT,
    versie: VERSIE,
    gemaakt: new Date().toISOString(),
    profiel: profielId,
    titel: les?.doel?.onderwerp || concept.invoer?.inhoud?.onderwerp || 'Les',
    concept: { modus: concept.modus, invoer: schoon(concept.invoer), aanpassingen: concept.aanpassingen ?? {}, gekozenStand: concept.gekozenStand ?? null },
    samenvatting: les ? {
      lesduur: les.lesduur, stand: les.standNaam, opzet: les.opzetNaam,
      werkvormen: [...new Set(les.fases.flatMap((f) => f.blokken.map((b) => b.werkvorm?.id).filter(Boolean)))]
    } : null
  }, null, 2);
}

/** Leest en controleert een lesbestand. Gooit een fout met een begrijpelijke melding. */
export function leesLesbestand(tekst) {
  let d;
  try { d = JSON.parse(tekst); } catch { throw new Error('Dit bestand is geen Uniekind-lesbestand (het kan niet worden gelezen).'); }
  if (d?.formaat !== FORMAAT) throw new Error('Dit bestand is geen Uniekind-lesbestand.');
  if (!Number.isInteger(d.versie) || d.versie > VERSIE) throw new Error(`Dit lesbestand is gemaakt met een nieuwere versie van Uniekind (versie ${d.versie}).`);
  if (!d.concept?.invoer?.context) throw new Error('Dit lesbestand is onvolledig.');
  const inv = schoon(d.concept.invoer);
  return {
    titel: String(d.titel ?? 'Les').slice(0, 120),
    gemaakt: d.gemaakt,
    profiel: d.profiel,
    samenvatting: d.samenvatting ?? null,
    concept: {
      versie: 1, modus: d.concept.modus === 'uitgebreid' ? 'uitgebreid' : 'snel', stap: 'aanpassen',
      invoer: { ...inv, opties: { ...inv.opties, vorigeLes: [], duimen: {} } },
      aanpassingen: d.concept.aanpassingen ?? {}, gekozenStand: d.concept.gekozenStand ?? inv.stand
    }
  };
}
