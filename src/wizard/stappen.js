// De schermen van de lesgenerator (stap 1 t/m 4 en de snelle modus).
import { html, raw } from '../util/html.js';
import { controleerLesdoel } from '../engine/tekst.js';
import { DOCENTSTIJL, DENKNIVEAU } from '../data/labels.js';
import { eindtermenVeld } from './eindtermen.js';
import { vakKeuzes } from '../data/overige-vakken.js';

/* ── Bouwstenen ─────────────────────────────────── */

export const info = (tekst) => html`<details class="info"><summary aria-label="Uitleg">i</summary><p>${tekst}</p></details>`;

const leerjaarOpties = (afd) => afd.leerjaren.map((j) => [j, `${afd.naam} ${j}${afd.label12 && j <= 2 ? ` (${afd.label12})` : ''}`]);
const veldId = (pad) => `v-${pad.replace(/\./g, '-')}`;

export function tekstveld(pad, label, waarde, o = {}) {
  return html`<div class="veld">
    <label for="${veldId(pad)}">${label} ${o.info ? info(o.info) : ''}</label>
    ${o.lang
      ? html`<textarea id="${veldId(pad)}" data-pad="${pad}" rows="${o.rijen ?? 4}" placeholder="${o.placeholder ?? ''}">${waarde ?? ''}</textarea>`
      : html`<input id="${veldId(pad)}" type="${o.type ?? 'text'}" data-pad="${pad}" ${o.type === 'number' ? html`data-type="getal" inputmode="numeric" min="${o.min ?? 0}" max="${o.max ?? 999}"` : ''} value="${waarde ?? ''}" placeholder="${o.placeholder ?? ''}" ${o.verplicht ? 'required' : ''}>`}
    ${o.hulp ? html`<span class="hulp">${o.hulp}</span>` : ''}
  </div>`;
}

/** Opties [waarde, label, groep?]; opties met een groep komen in een <optgroup>. */
export function optiesMetGroepen(opties, waarde) {
  const optie = ([k, v]) => html`<option value="${k}" ${String(waarde) === String(k) ? 'selected' : ''}>${v}</option>`;
  const groepen = [...new Set(opties.map((o) => o[2]).filter(Boolean))];
  return html`${opties.filter((o) => !o[2]).map(optie)}${groepen.map((g) => html`<optgroup label="${g}">${opties.filter((o) => o[2] === g).map(optie)}</optgroup>`)}`;
}

export function keuzeveld(pad, label, opties, waarde, o = {}) {
  return html`<div class="veld">
    <label for="${veldId(pad)}">${label} ${o.info ? info(o.info) : ''}</label>
    <select id="${veldId(pad)}" data-pad="${pad}" ${o.getal ? 'data-type="getal"' : ''} ${o.herteken ? 'data-herteken' : ''}>
      ${optiesMetGroepen(opties, waarde)}
    </select>
    ${o.hulp ? html`<span class="hulp">${o.hulp}</span>` : ''}
  </div>`;
}

/** Knoppenrij met radio's (groot klikvlak, ook op het digibord). */
export function knoppenveld(pad, label, opties, waarde, o = {}) {
  const naam = veldId(pad);
  return html`<fieldset class="veld knoppenrij">
    <legend>${label} ${o.info ? info(o.info) : ''}</legend>
    <div class="segment">
      ${opties.map(([k, v]) => html`<label class="${String(waarde) === String(k) ? 'aan' : ''}"><input type="radio" name="${naam}" data-pad="${pad}" ${o.getal ? 'data-type="getal"' : ''} ${o.bool ? 'data-type="bool"' : ''} value="${k}" ${String(waarde) === String(k) ? 'checked' : ''} ${o.herteken ? 'data-herteken' : ''}><span>${v}</span></label>`)}
    </div>
    ${o.hulp ? html`<span class="hulp">${o.hulp}</span>` : ''}
  </fieldset>`;
}

export function vinkveld(pad, label, opties, waarden = [], o = {}) {
  return html`<fieldset class="veld">
    <legend>${label} ${o.info ? info(o.info) : ''}</legend>
    <div class="vinkjes">${opties.map(([k, v]) => html`<label><input type="checkbox" data-pad="${pad}" data-type="lijst" value="${k}" ${waarden.includes(k) ? 'checked' : ''}> ${v}</label>`)}</div>
  </fieldset>`;
}

const ja = (pad, label, waarde, o = {}) => html`<label class="schakel"><input type="checkbox" data-pad="${pad}" data-type="bool" ${waarde ? 'checked' : ''} ${o.herteken ? 'data-herteken' : ''}> <span>${label}</span></label>`;

/* ── Gedeelde opties ────────────────────────────── */

const LAPTOPS = [['alle', 'Voor de hele klas'], ['deel', 'Voor een deel'], ['geen', 'Geen']];
const REEKS = [['introductie', 'Introductie nieuw onderwerp'], ['uitleg', 'Uitleg en verwerking'], ['verdieping', 'Verdieping'], ['herhaling', 'Herhaling'], ['afsluiting', 'Afsluiting'], ['toets', 'Toetsvoorbereiding']];
const TIJDSTIP = [['eerste', 'Eerste uur'], ['midden', 'Midden van de dag'], ['pauze', 'Na een pauze'], ['laatste', 'Laatste uur']];
export const STAND = [
  [1, 'Klassikaal-plus', 'Je vertrouwde les met één differentiatie-element erin.'],
  [2, 'Een stap verder', 'Korte instructie, daarna een instructietafel voor wie meer uitleg nodig heeft, en verdieping voor wie klaar is.'],
  [3, 'Volledig Uniekind', 'Startcheck, meerdere routes, lokaal plus plein of stilteruimte.']
];

function afdelingOpties(profiel) {
  return profiel.afdelingen.map((a) => [a.id, a.naam]);
}
function vakOpties(profiel, afdelingId) {
  return vakKeuzes(profiel.vakken.filter((v) => v.afdelingen === 'alle' || v.afdelingen.includes(afdelingId)));
}
function lesduurOpties(afd) {
  return [...afd.lesduren.map((d) => [String(d), `${d} min`]), ['vrij', 'Anders']];
}

export function capaciteitMelding(profiel, c) {
  const r = profiel.ruimtes.find((x) => x.id === c.ruimte);
  const n = Number(c.aantal) || 0;
  if (!r?.capaciteit || n <= r.capaciteit) return '';
  const pl = profiel.ruimtes.find((x) => x.id === 'plein');
  return c.ruimte === 'M' && pl
    ? `Er passen ${r.capaciteit} leerlingen in een ${r.kort}. Je les start daarom al gesplitst: ${n - r.capaciteit} of meer leerlingen werken op het ${pl.kort}. In de volgende stappen kies je hoe.`
    : `Er passen ${r.capaciteit} leerlingen in een ${r.kort}. ${c.stilte ? 'Een kleine groep kan in de stilteruimte werken.' : 'Kies een groter lokaal of zet de stilteruimte aan.'}`;
}

/* ── Stap 1 · Mijn profiel ──────────────────────── */

export function stapProfiel({ profiel, concept }) {
  const d = concept.invoer.docent;
  const schaal = (k, tekst) => html`<div class="schaal">
    <label for="${veldId(`docent.stijl.${k}`)}">${tekst}</label>
    <div class="schaal-rij"><span>Past niet</span><input type="range" min="1" max="5" step="1" id="${veldId(`docent.stijl.${k}`)}" data-pad="docent.stijl.${k}" data-type="getal" value="${d.stijl?.[k] ?? 3}" aria-valuetext="${d.stijl?.[k] ?? 3} van 5"><span>Past helemaal</span></div>
  </div>`;
  return html`
    <p class="stapintro">Dit vul je één keer in; Uniekind onthoudt het in deze browser. Er is geen goed of fout antwoord. Uniekind begint bij hoe jij nu lesgeeft.</p>
    ${vinkveld('docent.vakken', 'Mijn vakken', profiel.vakken.map((v) => [v.id, v.naam]), d.vakken)}
    ${vinkveld('docent.afdelingen', 'Afdelingen waar ik lesgeef', afdelingOpties(profiel), d.afdelingen)}
    <fieldset class="veld"><legend>Hoe geef jij nu les? ${info('Uniekind zoekt werkvormen die bij jou passen. Bij "Klassikaal-plus" telt dit het zwaarst; bij "Volledig Uniekind" iets minder, zodat je kunt groeien zonder overvallen te worden.')}</legend>
      <div class="schalen">${Object.entries(DOCENTSTIJL).map(([k, t]) => schaal(k, t))}</div>
      ${(d.eigenStijl ?? []).map((e, i) => html`<div class="veldrij eigen"><input type="text" aria-label="Eigen uitspraak" data-pad="docent.eigenStijl.${i}.tekst" value="${e.tekst}"><button type="button" class="knop secundair klein" data-actie="eigen-weg" data-i="${i}">Weghalen</button></div>`)}
      <button type="button" class="knop secundair klein" data-actie="eigen-erbij">Eigen uitspraak toevoegen</button>
    </fieldset>
    ${tekstveld('docent.kracht', 'Mijn kracht in één zin', d.kracht, { placeholder: 'Bijvoorbeeld: uitleggen met voorbeelden uit het dagelijks leven', info: 'Uniekind gebruikt dit in de uitleg bij je les, zodat je ziet waarom een opzet bij jou past.' })}
    ${standKiezer('docent.stand', d.stand ?? 2, 'Hoe ver wil je standaard gaan?')}
    <div class="veldrij">
      ${keuzeveld('docent.lesmodel', 'Lesmodel', profiel.didactiek.lesmodelOpties.map((o) => [o.id, o.naam]), d.lesmodel, { info: 'Directe instructie is de standaard. Werkt je sectie met een ander model, kies dat dan hier.' })}
      ${keuzeveld('docent.taxonomie', 'Taxonomie', [['bloom', 'Bloom (herzien)'], ['rtti', 'RTTI']], d.taxonomie)}
    </div>`;
}

export function standKiezer(pad, waarde, label) {
  return html`<fieldset class="veld"><legend>${label} ${info('Je kunt dit per les aanpassen. Begin gerust bij Klassikaal-plus.')}</legend>
    <div class="standen">
      ${STAND.map(([k, n, t]) => html`<label class="stand ${Number(waarde) === k ? 'aan' : ''}">
        <input type="radio" name="${veldId(pad)}" data-pad="${pad}" data-type="getal" value="${k}" ${Number(waarde) === k ? 'checked' : ''} data-herteken>
        <span class="stand-nr" aria-hidden="true">${'●'.repeat(k)}${'○'.repeat(3 - k)}</span>
        <b>${n}</b><span>${t}</span></label>`)}
    </div></fieldset>`;
}

/** Lesdoelen: een of meer, elk met een controle op waarneembaarheid en denkniveau. */
export function lesdoelenVeld(inh, tax, rtti) {
  return html`
    <fieldset class="veld"><legend>Lesdoelen ${info('Schrijf het doel zo dat je kunt zien of horen of het gelukt is: "Je kunt uitleggen…", niet "Je begrijpt…". Uniekind koppelt elk doel aan een denkniveau.')}</legend>
      <div class="doelen">
        ${(inh.lesdoelen?.length ? inh.lesdoelen : [{ tekst: '' }]).map((d, i) => html`
          <div class="doel">
            <input type="text" aria-label="Lesdoel ${i + 1}" data-pad="inhoud.lesdoelen.${i}.tekst" data-doel="${i}" value="${d.tekst}" placeholder="Je kunt …">
            <button type="button" class="knop secundair klein" data-actie="doel-weg" data-i="${i}" aria-label="Lesdoel ${i + 1} weghalen">×</button>
            <div id="doelcheck-${i}" class="doelcheck-vak">${raw(doelCheck(d.tekst, tax, rtti))}</div>
          </div>`)}
      </div>
      <button type="button" class="knop secundair klein" data-actie="doel-erbij">Lesdoel toevoegen</button>
    </fieldset>`;
}

/* ── Stap 2 · Lescontext ────────────────────────── */

export function stapContext({ profiel, concept }) {
  const c = concept.invoer.context;
  const afd = profiel.afdelingen.find((a) => a.id === c.afdeling) ?? profiel.afdelingen[0];
  const vrij = !afd.lesduren.includes(Number(c.lesduur));
  const melding = capaciteitMelding(profiel, c);
  return html`
    <div class="veldrij">
      ${keuzeveld('context.afdeling', 'Afdeling', afdelingOpties(profiel), c.afdeling, { herteken: true })}
      ${keuzeveld('context.leerjaar', 'Leerjaar', leerjaarOpties(afd), c.leerjaar, { getal: true, herteken: true })}
      ${keuzeveld('context.vak', 'Vak', vakOpties(profiel, afd.id), c.vak)}
    </div>
    ${knoppenveld('lesduurKeuze', 'Lesduur', lesduurOpties(afd), vrij ? 'vrij' : String(c.lesduur), { herteken: true, info: profiel.afdelingToelichting })}
    ${vrij ? tekstveld('context.lesduur', 'Lesduur in minuten', c.lesduur, { type: 'number', min: 20, max: 240 }) : ''}
    ${knoppenveld('context.ruimte', 'Lokaal', profiel.ruimtes.filter((r) => ['M', 'L', 'anders'].includes(r.id)).map((r) => [r.id, r.naam]), c.ruimte, { herteken: true, info: profiel.ruimtes.filter((r) => ['M', 'L', 'plein'].includes(r.id)).map((r) => `${r.naam}: ${r.omschrijving}`).join(' ') })}
    ${c.ruimte === 'anders' ? tekstveld('context.ruimteOmschrijving', 'Beschrijf de ruimte', c.ruimteOmschrijving, { placeholder: 'Bijvoorbeeld: praktijklokaal met werkbanken' }) : ''}
    ${ja('context.stilte', 'Er is een stilteruimte beschikbaar', c.stilte, { herteken: true })}
    <div class="veldrij">
      ${tekstveld('context.aantal', 'Aantal leerlingen', c.aantal, { type: 'number', min: 1, max: 60 })}
      ${knoppenveld('context.oa', 'Onderwijsassistent', [['true', 'Ja'], ['false', 'Nee']], String(!!c.oa), { bool: true })}
    </div>
    <p class="melding let-op" id="capaciteit" ${melding ? '' : 'hidden'}>${melding}</p>
    ${knoppenveld('context.laptops', 'Laptops beschikbaar', LAPTOPS, c.laptops)}
    ${keuzeveld('context.reeks', 'Plek in de lessenreeks', REEKS, c.reeks)}
    ${knoppenveld('context.tijdstip', 'Tijdstip', TIJDSTIP, c.tijdstip, { info: 'Na een pauze of in het laatste uur voegt Uniekind sneller een beweegmoment toe.' })}`;
}

/* ── Stap 3 · Inhoud ────────────────────────────── */

export function doelCheck(doel, taxonomie, rtti) {
  const ch = controleerLesdoel(doel);
  if (!ch.tekst) return '';
  const niveau = ch.niveau ? (taxonomie === 'rtti' ? `${rtti[ch.niveau]}` : DENKNIVEAU[ch.niveau]) : null;
  return ch.waarneembaar
    ? `<span class="doelcheck ok">Waarneembaar · ${niveau}</span>`
    : `<span class="doelcheck let">${ch.tip}</span>`;
}

export function stapInhoud(ctx) {
  const { concept, taxonomie } = ctx;
  const inh = concept.invoer.inhoud;
  const tax = concept.invoer.docent.taxonomie;
  const rtti = Object.fromEntries(taxonomie.bloom.map((b) => [b.id, b.rtti]));
  const suggesties = concept.suggesties ?? {};
  const begrippen = [...new Set([...(suggesties.begrippen ?? []), ...(inh.begrippen ?? [])])];
  const bron = concept.bron ?? 'tekst';
  return html`
    ${tekstveld('inhoud.onderwerp', 'Onderwerp of paragraaftitel', inh.onderwerp, { placeholder: 'Bijvoorbeeld: 3.2 Inflatie' })}
    <fieldset class="veld"><legend>De stof</legend>
      <div class="tabs" role="tablist">
        ${[['tekst', 'Tekst plakken'], ['kernwoorden', 'Alleen kernwoorden'], ['foto', 'Foto van de paragraaf']].map(([k, v]) => html`<button type="button" role="tab" aria-selected="${bron === k}" data-actie="bron" data-bron="${k}">${v}</button>`)}
      </div>
      ${bron === 'tekst' ? html`
        <textarea id="v-inhoud-tekst" data-pad="inhoud.tekst" rows="7" aria-label="Tekst van de paragraaf" placeholder="Plak hier de tekst van de paragraaf, inclusief de leerdoelen als die erbij staan.">${inh.tekst ?? ''}</textarea>
        <div class="knoppen klein-boven"><button type="button" class="knop secundair klein" data-actie="analyseer">Haal lesdoelen en kernbegrippen uit de tekst</button></div>` : ''}
      ${bron === 'kernwoorden' ? html`<p class="hulp">Typ hieronder bij Kernbegrippen de woorden die centraal staan. Meer is niet nodig.</p>` : ''}
      ${bron === 'foto' ? html`
        <label class="dropvak" id="ocrVak" for="ocrBestand">
          <span><b>Kies of sleep een foto van de paragraaf</b><br>Een scherpe, rechte foto werkt het best.</span>
          <input type="file" id="ocrBestand" accept="image/*" capture="environment">
        </label>
        <p class="hulp">De foto blijft op je computer. Uniekind herkent de tekst in je browser, stuurt de foto nergens heen en bewaart hem niet.</p>
        <div id="ocrStatus" aria-live="polite"></div>` : ''}
      ${concept.ocrMelding ? html`<p class="melding">${concept.ocrMelding}</p>` : ''}
    </fieldset>
    ${lesdoelenVeld(inh, tax, rtti)}
    ${eindtermenVeld(ctx)}
    <fieldset class="veld"><legend>Kernbegrippen</legend>
      ${begrippen.length ? html`<div class="vinkjes">${begrippen.map((b) => html`<label><input type="checkbox" data-pad="inhoud.begrippen" data-type="lijst" value="${b}" ${(inh.begrippen ?? []).includes(b) ? 'checked' : ''}> ${b}</label>`)}</div>` : html`<p class="hulp">Nog geen begrippen. Plak een tekst en laat Uniekind voorstellen doen, of voeg ze zelf toe.</p>`}
      <div class="veldrij klein-boven"><input type="text" id="nieuwBegrip" aria-label="Nieuw kernbegrip" placeholder="Begrip toevoegen"><button type="button" class="knop secundair klein" data-actie="begrip-erbij">Toevoegen</button></div>
    </fieldset>
    ${tekstveld('inhoud.voorkennis', 'Voorkennis: wat hebben ze eerder gehad?', inh.voorkennis, { lang: true, rijen: 2 })}
    ${knoppenveld('inhoud.voorkennisZeker', 'Hoe zeker ben je dat die voorkennis er zit?', [['zeker', 'Zeker'], ['twijfel', 'Twijfel'], ['niet', 'Waarschijnlijk niet']], inh.voorkennisZeker, { hulp: inh.voorkennisZeker !== 'zeker' ? 'Uniekind voegt een activeringsopdracht toe aan het begin van de les.' : '' , herteken: true })}
    ${tekstveld('inhoud.misvattingen', 'Bekende misvattingen of struikelpunten (mag leeg)', inh.misvattingen, { lang: true, rijen: 2 })}
    ${ja('inhoud.actualiteit', 'Begin met een actualiteitsmoment: een nieuwsbericht uit de regio dat bij het onderwerp past', inh.actualiteit)}`;
}

/* ── Stap 4 · Klasbeeld ─────────────────────────── */

export function stapKlas({ concept }) {
  const k = concept.invoer.klas;
  const n = Number(concept.invoer.context.aantal) || 0;
  const som = (Number(k.steun) || 0) + (Number(k.basis) || 0) + (Number(k.verdieping) || 0);
  return html`
    <p class="stapintro">Alleen aantallen, nooit namen. Alles is optioneel.</p>
    ${knoppenveld('klas.verdelingBekend', 'Weet je ongeveer hoe de klas verdeeld is?', [['true', 'Ja, ongeveer'], ['false', 'Weet ik niet']], String(!!k.verdelingBekend), { bool: true, herteken: true, info: 'Weet je het niet, dan begint de les met een korte startcheck die de verdeling in de les zelf bepaalt.' })}
    ${k.verdelingBekend ? html`
      <div class="veldrij">
        ${tekstveld('klas.steun', 'Extra instructie nodig', k.steun, { type: 'number' })}
        ${tekstveld('klas.basis', 'Basis', k.basis, { type: 'number' })}
        ${tekstveld('klas.verdieping', 'Klaar voor verdieping', k.verdieping, { type: 'number' })}
      </div>
      <p class="hulp" id="verdelingsom">${som === n ? `Samen ${som}: klopt met de klasgrootte.` : `Samen ${som}, de klas telt ${n}. Uniekind rekent het naar verhouding om.`}</p>` : html`<p class="melding">Prima. De les begint met een startcheck van 3 tot 5 vragen; de uitslag bepaalt wie welke route volgt.</p>`}
    <fieldset class="veld"><legend>Hoeveel leerlingen met… ${info('Uniekind kiest werkvormen die goed werken voor deze leerlingen en past het materiaal aan, bijvoorbeeld dyslexievriendelijk. De aantallen worden niet opgeslagen bij de les.')}</legend>
      <div class="veldrij zes">
        ${[['dyslexie', 'Dyslexie'], ['dyscalculie', 'Dyscalculie'], ['nt2', 'NT2-achtergrond'], ['faalangst', 'Faalangst'], ['structuur', 'Behoefte aan structuur en rust'], ['hoogbegaafd', 'Meer- of hoogbegaafd']].map(([p, l]) => tekstveld(`klas.${p}`, l, k[p], { type: 'number' }))}
      </div>
    </fieldset>
    ${knoppenveld('klas.dynamiek', 'Groepsdynamiek', [['rustig', 'Rustig'], ['levendig', 'Levendig'], ['onrustig', 'Onrustig']], k.dynamiek)}
    ${knoppenveld('klas.samenwerken', 'Samenwerken gaat', [['goed', 'Goed'], ['wisselend', 'Wisselend'], ['moeizaam', 'Moeizaam']], k.samenwerken)}`;
}

/* ── Snelle modus ───────────────────────────────── */

export function stapSnel(ctx) {
  const { profiel, concept, taxonomie } = ctx;
  const c = concept.invoer.context;
  const inh = concept.invoer.inhoud;
  const tax = concept.invoer.docent.taxonomie;
  const rtti = Object.fromEntries((taxonomie?.bloom ?? []).map((b) => [b.id, b.rtti]));
  const afd = profiel.afdelingen.find((a) => a.id === c.afdeling) ?? profiel.afdelingen[0];
  const vrij = !afd.lesduren.includes(Number(c.lesduur));
  const melding = capaciteitMelding(profiel, c);
  return html`
    <p class="stapintro">Een paar vragen, de rest vult Uniekind in met verstandige standaardwaarden. Je kunt daarna alles aanpassen.</p>
    ${tekstveld('inhoud.onderwerp', 'Onderwerp', inh.onderwerp, { placeholder: 'Bijvoorbeeld: 3.2 Inflatie' })}
    ${lesdoelenVeld(inh, tax, rtti)}
    <div class="veldrij">
      ${keuzeveld('context.afdeling', 'Afdeling', afdelingOpties(profiel), c.afdeling, { herteken: true })}
      ${keuzeveld('context.leerjaar', 'Leerjaar', leerjaarOpties(afd), c.leerjaar, { getal: true, herteken: true })}
      ${keuzeveld('context.vak', 'Vak', vakOpties(profiel, afd.id), c.vak, { herteken: true })}
    </div>
    <p class="hulp">${afd.naam} ${c.leerjaar ?? ''}. Zie je een vak niet? De vakkenlijst hangt af van de afdeling${profiel.vakken.some((v) => !v.overig && Array.isArray(v.afdelingen) && v.afdelingen.length === 1) ? `; ${profiel.vakken.filter((v) => !v.overig && Array.isArray(v.afdelingen) && v.afdelingen.length === 1).map((v) => `${v.naam} staat bij ${profiel.afdelingen.find((a) => a.id === v.afdelingen[0])?.naam ?? v.afdelingen[0]}`).join(', ')}` : ''}.</p>
    ${eindtermenVeld(ctx)}
    ${knoppenveld('lesduurKeuze', 'Lesduur', lesduurOpties(afd), vrij ? 'vrij' : String(c.lesduur), { herteken: true })}
    ${vrij ? tekstveld('context.lesduur', 'Lesduur in minuten', c.lesduur, { type: 'number', min: 20, max: 240 }) : ''}
    ${knoppenveld('context.ruimte', 'Lokaal', profiel.ruimtes.filter((r) => ['M', 'L', 'anders'].includes(r.id)).map((r) => [r.id, r.kort.charAt(0).toUpperCase() + r.kort.slice(1)]), c.ruimte, { herteken: true })}
    ${tekstveld('context.aantal', 'Aantal leerlingen', c.aantal, { type: 'number', min: 1, max: 60 })}
    <p class="melding let-op" id="capaciteit" ${melding ? '' : 'hidden'}>${melding}</p>`;
}
