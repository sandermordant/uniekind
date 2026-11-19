// Schoolprofiel-wizard: een school stelt haar eigen visie, lokalen, lestijden, regels en huisstijl in.
// Het resultaat is een JSON-bestand (downloaden, delen, inladen). In de algemene versie kan de school het
// profiel ook meteen in deze browser gebruiken of als deellink versturen. Geen code nodig.
import { html, $ } from '../util/html.js';
import { laadStandaardProfiel, laadIndex } from '../data/laden.js';
import { zonderOverigeVakken } from '../data/overige-vakken.js';
import { uitAccentBestand, voegAccentenSamen } from '../data/sectie-accenten.js';
import { schoonProfiel, profielNaarCode, bewaarEigenProfiel, wisEigenProfiel, eigenProfielActief } from '../data/profiel.js';
import { VISIE_ACCENTEN } from '../engine/score.js';
import { lees, zet } from '../wizard/staat.js';
import { download, bestandsnaam } from '../export/delen.js';
import * as opslag from '../opslag/opslag.js';

const kloon = (x) => JSON.parse(JSON.stringify(x));
const slug = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';
const RUIMTE_UITLEG = {
  M: 'Een kleiner instructielokaal met een eigen plein of open werkplek ernaast.',
  plein: 'De open werkplek naast het instructielokaal (leerplein, studieplein).',
  L: 'Een gewoon lokaal zonder plein.',
  stilte: 'Een extra werkplek voor leerlingen die rust nodig hebben.'
};
const KLEURNAMEN = { hoofd: 'Hoofdkleur', paars: 'Accent 1', rood: 'Accent 2', oranje: 'Accent 3', geel: 'Accent 4', groen: 'Accent 5', grijs: 'Grijs' };

/* ── kleine veldbouwers; data-pad wijst naar de plek in het profiel ── */
const id = (pad) => `sp-${pad.replace(/[^a-z0-9]+/gi, '-')}`;
const tekst = (pad, label, w, o = {}) => html`<div class="veld"><label for="${id(pad)}">${label}</label>
  <input id="${id(pad)}" type="${o.type ?? 'text'}" data-pad="${pad}" ${o.type === 'number' ? 'data-type="getal"' : ''} value="${w ?? ''}" ${o.placeholder ? html`placeholder="${o.placeholder}"` : ''}>${o.hulp ? html`<span class="hulp">${o.hulp}</span>` : ''}</div>`;
const lang = (pad, label, w, hulp = '') => html`<div class="veld"><label for="${id(pad)}">${label}</label>
  <textarea id="${id(pad)}" data-pad="${pad}" rows="3">${w ?? ''}</textarea>${hulp ? html`<span class="hulp">${hulp}</span>` : ''}</div>`;
const lijst = (pad, label, w, hulp = '') => html`<div class="veld"><label for="${id(pad)}">${label}</label>
  <input id="${id(pad)}" type="text" data-pad="${pad}" data-type="lijst" value="${(w ?? []).join(', ')}">${hulp ? html`<span class="hulp">${hulp}</span>` : ''}</div>`;
const getallen = (pad, label, w, hulp = '') => html`<div class="veld"><label for="${id(pad)}">${label}</label>
  <input id="${id(pad)}" type="text" inputmode="numeric" data-pad="${pad}" data-type="getallen" value="${(w ?? []).join(', ')}">${hulp ? html`<span class="hulp">${hulp}</span>` : ''}</div>`;
const keuze = (pad, label, opties, w) => html`<div class="veld"><label for="${id(pad)}">${label}</label>
  <select id="${id(pad)}" data-pad="${pad}">${opties.map(([k, v]) => html`<option value="${k}" ${String(w ?? '') === String(k) ? 'selected' : ''}>${v}</option>`)}</select></div>`;
const vink = (pad, label, w) => html`<label class="schakel"><input type="checkbox" data-pad="${pad}" data-type="bool" ${w ? 'checked' : ''}> <span>${label}</span></label>`;

function sectieSchool(p) {
  return html`
    <div class="veldrij">${tekst('school.naam', 'Korte naam van de school', p.school.naam)}${tekst('school.volledigeNaam', 'Volledige naam', p.school.volledigeNaam)}</div>
    <div class="veldrij">${tekst('uniekind.titel', 'Naam van de site', p.uniekind.titel, { hulp: 'Meestal gewoon Uniekind.' })}${tekst('uniekind.ondertitel', 'Ondertitel', p.uniekind.ondertitel)}</div>
    <div class="veldrij">${tekst('motto.tekst', 'Motto', p.motto.tekst)}${tekst('motto.herkomst', 'Herkomst van het motto', p.motto.herkomst, { placeholder: 'Bijvoorbeeld: de stichter van de school' })}</div>
    ${lang('motto.inDeLes', 'Wat betekent het motto in een les?', p.motto.inDeLes, 'Uniekind gebruikt dit op de visiepagina en in de uitleg.')}`;
}

function sectieHuisstijl(p) {
  return html`
    <div class="logo-rij">
      ${p.huisstijl.logo ? html`<span class="logo-plaat"><img src="${p.huisstijl.logo}" alt="Huidig logo" height="40"></span>` : html`<span class="hulp">Geen logo: alleen de naam staat in de kop.</span>`}
      <label class="knop secundair klein bestandknop">Logo kiezen (png, jpg of svg, max 400 kB)<input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" data-actie="logo" class="visueel-verborgen"></label>
      ${p.huisstijl.logo ? html`<button type="button" class="knop secundair klein" data-actie="logo-weg">Logo weghalen</button>` : ''}
    </div>
    ${tekst('huisstijl.logoAlt', 'Omschrijving van het logo (voor schermlezers)', p.huisstijl.logoAlt)}
    <div class="kleuren">${Object.entries(KLEURNAMEN).map(([k, n]) => html`<div class="veld kleurveld"><label for="${id('huisstijl.kleuren.' + k)}">${n}</label><input type="color" id="${id('huisstijl.kleuren.' + k)}" data-pad="huisstijl.kleuren.${k}" value="${p.huisstijl.kleuren[k]}"></div>`)}</div>
    <p class="hulp">De hoofdkleur gebruikt Uniekind voor knoppen en koppen; kies een donkere kleur, zodat witte tekst erop goed leesbaar blijft. De accentkleuren markeren categorieën werkvormen.</p>
    ${vink('huisstijl.motiefAan', 'Subtiel motief op de achtergrond van de kop', p.huisstijl.motief != null || p.huisstijl.motiefAan)}`;
}

function sectieVisie(p) {
  const gekozen = new Set(p.generator.visieAccenten ?? []);
  return html`
    ${lang('visie.tekst', 'Onze visie in eigen woorden', p.visie?.tekst, 'Komt op de visiepagina. In de latere API-route kan AI deze tekst vertalen naar de keuzes hieronder.')}
    ${lijst('kernwaarden', 'Kernwaarden', p.kernwaarden, 'Gescheiden door komma’s.')}
    <fieldset class="veld"><legend class="label">Wat vinden wij belangrijk in elke les? Dit bepaalt de gewichten van de generator.</legend>
      <div class="vinkjes kolom">${Object.entries(VISIE_ACCENTEN).map(([k, a]) => html`<label><input type="checkbox" data-actie="accent" value="${k}" ${gekozen.has(k) ? 'checked' : ''}> <span>${a.naam}${a.toelichting ? html` <span class="hulp">(${a.toelichting})</span>` : ''}</span></label>`)}</div>
    </fieldset>
    <h3 class="klein-kop">Pijlers van de visie</h3>
    ${p.pijlers.map((pi, i) => html`<div class="lijstrij">
      ${tekst(`pijlers.${i}.naam`, `Pijler ${i + 1}`, pi.naam)}
      ${lang(`pijlers.${i}.omschrijving`, 'Omschrijving', pi.omschrijving)}
      <button type="button" class="knop secundair klein" data-actie="weg" data-lijst="pijlers" data-i="${i}" ${p.pijlers.length < 2 ? 'disabled' : ''}>Pijler weghalen</button></div>`)}
    <button type="button" class="knop secundair klein" data-actie="erbij" data-lijst="pijlers">Pijler toevoegen</button>`;
}

function sectieRuimtes(p, basis) {
  const r = (rid) => p.ruimtes.find((x) => x.id === rid);
  const i = (rid) => p.ruimtes.findIndex((x) => x.id === rid);
  return html`${['M', 'plein', 'L', 'stilte'].map((rid) => {
    const ruimte = r(rid);
    const vast = rid === 'L';
    return html`<fieldset class="groep"><legend>${ruimte?.naam ?? basis.ruimtes.find((x) => x.id === rid)?.naam ?? rid}</legend>
      <p class="hulp">${RUIMTE_UITLEG[rid]}</p>
      ${vast ? '' : html`<label class="schakel"><input type="checkbox" data-actie="ruimte" value="${rid}" ${ruimte ? 'checked' : ''} ${rid === 'plein' && !r('M') ? 'disabled' : ''}> <span>Dit hebben wij</span></label>`}
      ${ruimte ? html`
        <div class="veldrij">${tekst(`ruimtes.${i(rid)}.naam`, 'Naam', ruimte.naam)}${tekst(`ruimtes.${i(rid)}.kort`, 'Korte naam in zinnen', ruimte.kort, { hulp: 'Bijvoorbeeld: leerplein, studiezaal, open ruimte.' })}${tekst(`ruimtes.${i(rid)}.capaciteit`, 'Plaatsen', ruimte.capaciteit, { type: 'number' })}</div>
        ${rid === 'M' ? html`<div class="veldrij">${tekst(`ruimtes.${i(rid)}.maxInstructieAaneengesloten`, 'Maximaal aaneengesloten instructie (minuten)', ruimte.maxInstructieAaneengesloten, { type: 'number' })}${vink(`ruimtes.${i(rid)}.krukken`, 'Leerlingen zitten op krukken', ruimte.krukken)}</div>` : ''}
        ${tekst(`ruimtes.${i(rid)}.omschrijving`, 'Omschrijving', ruimte.omschrijving)}` : ''}
    </fieldset>`;
  })}`;
}

function sectieAfdelingen(p) {
  return html`
    <p class="hulp">Per afdeling: welke leerjaren en welke lesduren. De docent kan altijd ook een vrije lesduur kiezen.</p>
    ${p.afdelingen.map((a, i) => html`<div class="lijstrij">
      <div class="veldrij">${tekst(`afdelingen.${i}.naam`, 'Afdeling', a.naam)}${keuze(`afdelingen.${i}.niveau`, 'Niveau voor de varianten', [['vmbo', 'vmbo'], ['havo', 'havo'], ['vwo', 'vwo']], a.niveau)}</div>
      <div class="veldrij">${keuze(`afdelingen.${i}.slo`, 'Niveau voor kerndoelen en eindtermen (SLO)', [['', 'Automatisch'], ['vmbo-bb', 'vmbo basis'], ['vmbo-kb', 'vmbo kader'], ['vmbo-gltl', 'vmbo gl/tl (mavo)'], ['havo', 'havo'], ['vwo', 'vwo']], a.slo)}${tekst(`afdelingen.${i}.onderbouwTot`, 'Onderbouw tot en met leerjaar', a.onderbouwTot, { type: 'number', hulp: 'Tot dan toont Uniekind eerst de kerndoelen, daarna het examenprogramma.' })}</div>
      <div class="veldrij">${getallen(`afdelingen.${i}.leerjaren`, 'Leerjaren', a.leerjaren, 'Bijvoorbeeld: 1, 2, 3, 4')}${getallen(`afdelingen.${i}.lesduren`, 'Lesduren in minuten', a.lesduren, 'Bijvoorbeeld: 50, 100')}${tekst(`afdelingen.${i}.standaardLesduur`, 'Standaard', a.standaardLesduur, { type: 'number' })}</div>
      <button type="button" class="knop secundair klein" data-actie="weg" data-lijst="afdelingen" data-i="${i}" ${p.afdelingen.length < 2 ? 'disabled' : ''}>Afdeling weghalen</button></div>`)}
    <button type="button" class="knop secundair klein" data-actie="erbij" data-lijst="afdelingen">Afdeling toevoegen</button>`;
}

function sectieVakken(p, werkvormen) {
  const lm = p.didactiek.lesmodelOpties ?? [];
  const sectie = p.terminologie?.sectie ?? 'sectie';
  return html`
    <p class="hulp">Ook vakoverstijgende vakken. Per vak kan de ${sectie} een eigen accent leggen; leeg betekent de schoolstandaard.</p>
    <p class="hulp">Kreeg je van een collega een bestand met sectie-accenten (uit Mijn profiel)? Lees het hier in; het komt bij de juiste vakken te staan.</p>
    <label class="knop secundair klein bestandknop">Sectie-accenten van een collega inlezen<input type="file" accept=".json,application/json" data-actie="accenten-inlezen" class="visueel-verborgen"></label>
    ${p.vakken.map((v, i) => {
      const acc = p.sectieAccenten?.perVak?.[v.id] ?? {};
      return html`<details class="lijstrij vakrij"><summary><b>${v.naam}</b> <span class="hulp">${v.afdelingen === 'alle' ? 'alle afdelingen' : v.afdelingen.map((x) => p.afdelingen.find((a) => a.id === x)?.naam ?? x).join(', ')}${Object.keys(acc).length ? ` · ${sectie}-accent` : ''}</span></summary>
        <div class="veldrij">${tekst(`vakken.${i}.naam`, 'Naam', v.naam)}${vink(`vakken.${i}.rekenen`, 'Rekenhulpkaart standaard bij dit vak', v.rekenen)}</div>
        <fieldset class="veld"><legend class="label">Afdelingen</legend><div class="vinkjes">
          <label><input type="checkbox" data-actie="vak-alle" data-i="${i}" ${v.afdelingen === 'alle' ? 'checked' : ''}> Alle</label>
          ${p.afdelingen.map((a) => html`<label><input type="checkbox" data-actie="vak-afd" data-i="${i}" value="${a.id}" ${v.afdelingen !== 'alle' && v.afdelingen.includes(a.id) ? 'checked' : ''} ${v.afdelingen === 'alle' ? 'disabled' : ''}> ${a.naam}</label>`)}
        </div></fieldset>
        <div class="veldrij">
          ${keuze(`sectieAccenten.perVak.${v.id}.lesmodel`, `Lesmodel van de ${sectie}`, [['', 'Schoolstandaard'], ...lm.map((o) => [o.id, o.naam])], acc.lesmodel)}
          ${keuze(`sectieAccenten.perVak.${v.id}.taxonomie`, 'Taxonomie', [['', 'Schoolstandaard'], ['bloom', 'Bloom (herzien)'], ['rtti', 'RTTI']], acc.taxonomie)}
        </div>
        <div class="veldrij">
          ${tekst(`sectieAccenten.perVak.${v.id}.methodesite`, 'Methodewebsite (adres)', acc.methodesite, { placeholder: 'https://…' })}
          ${keuze(`sectieAccenten.perVak.${v.id}.werkvormVanDeMaand`, 'Werkvorm van de maand (PLG)', [['', 'Geen'], ...werkvormen.map((w) => [w.id, w.naam])], acc.werkvormVanDeMaand)}
        </div>
        <button type="button" class="knop secundair klein" data-actie="weg" data-lijst="vakken" data-i="${i}">Vak weghalen</button>
      </details>`;
    })}
    <div class="veldrij"><div class="veld"><label for="nieuwVak">Nieuw vak</label><input id="nieuwVak" type="text" placeholder="Bijvoorbeeld: Technologie"></div>
    <button type="button" class="knop secundair klein" data-actie="vak-erbij" style="align-self:end">Vak toevoegen</button></div>`;
}

function sectieRegels(p) {
  const t = p.terminologie ?? {};
  return html`
    ${vink('regels.telefoon.toegestaan', 'Telefoons zijn in de les toegestaan', p.regels.telefoon.toegestaan)}
    <p class="hulp">Ook als telefoons zijn toegestaan, stelt Uniekind geen werkvormen voor die een telefoon vereisen: digitaal werken gaat via de laptop.</p>
    <div class="veldrij">${tekst('regels.telefoon.motto', 'Korte naam van de telefoonregel', p.regels.telefoon.motto)}</div>
    ${lang('regels.telefoon.uitleg', 'Uitleg van de telefoonregel', p.regels.telefoon.uitleg)}
    ${lang('regels.laptop', 'Laptopbeleid', p.regels.laptop, 'Bijvoorbeeld: elke leerling heeft een eigen laptop, of: er is een laptopkar per afdeling.')}
    ${lang('regels.plein', 'Regel voor het plein', p.regels.plein)}
    ${vink('regels.pleinToezichtDoorDocent', 'De docent mag vanuit het instructielokaal toezicht houden op het plein (anders alleen met een onderwijsassistent)', p.regels.pleinToezichtDoorDocent !== false)}
    <p class="hulp">Zicht op het plein vanuit het instructielokaal, per kolom. Bij "beperkt" en zonder onderwijsassistent geeft Uniekind in de les een tip over toezicht.</p>
    <div class="veldrij">${[...new Set(p.afdelingen.map((a) => a.kolom))].map((k) => keuze(`regels.pleinZichtPerKolom.${k}`, `Zicht op het plein: ${k}`, [['goed', 'Goed (plein grenst aan het lokaal)'], ['beperkt', 'Beperkt']], p.regels.pleinZichtPerKolom?.[k] ?? 'goed'))}</div>
    <div class="veldrij">
      ${keuze('didactiek.lesmodel', 'Standaard lesmodel', (p.didactiek.lesmodelOpties ?? []).map((o) => [o.id, o.naam]), p.didactiek.lesmodel)}
      ${keuze('didactiek.taxonomie', 'Standaard taxonomie', [['bloom', 'Bloom (herzien)'], ['rtti', 'RTTI']], p.didactiek.taxonomie)}
    </div>
    <h3 class="klein-kop">Woorden die jullie gebruiken</h3>
    <div class="veldrij">
      ${keuze('terminologie.sectie', 'Sectie of vakgroep', [['sectie', 'sectie'], ['vakgroep', 'vakgroep'], ['vaksectie', 'vaksectie']], t.sectie)}
      ${keuze('terminologie.mentor', 'Mentor of coach', [['mentor', 'mentor'], ['coach', 'coach'], ['tutor', 'tutor']], t.mentor)}
      ${tekst('terminologie.plein', 'Naam van het plein in zinnen', t.plein, { placeholder: 'leerplein' })}
    </div>
    <h3 class="klein-kop">AI-tool en toegang</h3>
    <div class="veldrij">${tekst('ai.tool', 'AI-tool die de school toestaat', p.ai?.tool)}${tekst('ai.toolAdres', 'Adres van die tool', p.ai?.toolAdres, { placeholder: 'https://…' })}</div>
    <div class="veldrij">${tekst('uniekind.toegangscode', 'Schoolwoord bij het eerste bezoek (optioneel)', p.uniekind.toegangscode, { hulp: 'Een drempel, geen beveiliging: iedereen kan het woord in het profiel lezen.' })}</div>
    ${vink('uniekind.noindex', 'Niet laten vinden door zoekmachines', p.uniekind.noindex)}`;
}

function sectieRegio(p) {
  const haken = p.regio?.haken ?? [];
  return html`
    ${tekst('regio.naam', 'Naam van de regio', p.regio?.naam, { placeholder: 'Bijvoorbeeld: de Achterhoek' })}
    <p class="hulp">Onderwerpen voor de relevantie-haak, met de vakken waarbij ze passen (vak-id's, gescheiden door komma's). Geen kant-en-klare feiten: de docent checkt de actuele details.</p>
    ${haken.map((h, i) => html`<div class="lijstrij"><div class="veldrij">${tekst(`regio.haken.${i}.thema`, 'Onderwerp', h.thema)}${lijst(`regio.haken.${i}.vakken`, 'Vakken', h.vakken)}</div>
      <button type="button" class="knop secundair klein" data-actie="weg" data-lijst="regio.haken" data-i="${i}">Weghalen</button></div>`)}
    <button type="button" class="knop secundair klein" data-actie="erbij" data-lijst="regio.haken">Onderwerp toevoegen</button>`;
}

export default {
  async render({ profiel }) {
    const [basis, index] = await Promise.all([laadStandaardProfiel(), laadIndex()]);
    const werkvormen = [...index.items].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
    const algemeen = !!basis.uniekind?.eigenProfiel;
    let werk = opslag.lees('profielconcept') ?? kloon(zonderOverigeVakken(profiel));
    delete werk.eigen;
    const bewaar = () => opslag.schrijf('profielconcept', werk);
    let open = new Set(['school']);

    const blok = (sleutel, titel, inhoud) => html`<details class="paneel" data-blok="${sleutel}" ${open.has(sleutel) ? 'open' : ''}><summary>${titel}</summary><div class="paneel-inhoud">${inhoud}</div></details>`;

    const pagina = () => html`
      <section class="band band-klein"><div class="wrap">
        <p class="eyebrow">Schoolprofiel</p>
        <h1>${algemeen ? 'Uniekind voor jouw school' : `Het schoolprofiel van ${basis.school.naam}`}</h1>
        <p class="lead">${algemeen
          ? 'Stel in hoe jullie school werkt: visie, lokalen, lestijden, regels en huisstijl. Uniekind gebruikt dezelfde code voor elke school; alleen dit profiel verschilt.'
          : 'Hier zie en wijzig je wat Uniekind over de school weet, bijvoorbeeld de accenten van je sectie. Download het resultaat en stuur het naar de beheerder van Uniekind.'}</p>
        ${algemeen && eigenProfielActief() ? html`<p class="melding">In deze browser gebruik je nu het profiel van <b>${profiel.school.naam}</b>.</p>` : ''}
      </div></section>
      <main class="wrap formulier-breed schoolprofiel">
        <form id="spForm" novalidate>
          ${blok('school', '1. School, naam en motto', sectieSchool(werk))}
          ${blok('huisstijl', '2. Logo en huisstijl', sectieHuisstijl(werk))}
          ${blok('visie', '3. Visie, kernwaarden en principes', sectieVisie(werk))}
          ${blok('ruimtes', '4. Lokalen en werkplekken', sectieRuimtes(werk, basis))}
          ${blok('afdelingen', '5. Afdelingen en lestijden', sectieAfdelingen(werk))}
          ${blok('vakken', `6. Vakken en ${werk.terminologie?.sectie ?? 'sectie'}-accenten`, sectieVakken(werk, werkvormen))}
          ${blok('regels', '7. Regels, didactiek en woorden', sectieRegels(werk))}
          ${blok('regio', '8. De regio', sectieRegio(werk))}
        </form>
        <section class="sectie uitvoer-sp">
          <h2>Klaar?</h2>
          <div class="knoppen">
            <button type="button" class="knop" data-actie="download">Profiel downloaden</button>
            ${algemeen ? html`
              <button type="button" class="knop secundair" data-actie="gebruik">Gebruik dit profiel in deze browser</button>
              <button type="button" class="knop secundair" data-actie="deellink">Maak een deellink</button>` : ''}
            <label class="knop secundair bestandknop">Profiel inlezen<input type="file" accept=".json,application/json" data-actie="inlezen" class="visueel-verborgen"></label>
            <button type="button" class="knop secundair" data-actie="opnieuw">Opnieuw beginnen</button>
            ${algemeen && eigenProfielActief() ? html`<button type="button" class="knop secundair" data-actie="standaard">Terug naar het voorbeeldprofiel</button>` : ''}
          </div>
          <p id="spMelding" class="melding" role="status" hidden></p>
          <div id="spLink" hidden><label for="spLinkVeld" class="label">Deellink: wie deze link opent, gebruikt jullie profiel</label><textarea id="spLinkVeld" rows="3" readonly></textarea></div>
          <p class="hulp">${algemeen
            ? 'Zet het profiel op de eigen website van Uniekind (map profiles/) om een vaste link te krijgen: …/?school=naam-van-het-bestand. De deellink werkt zonder dat er iets op een server staat.'
            : 'De beheerder zet het bestand in public/profiles/ en controleert het met npm run valideer.'}</p>
        </section>
      </main>`;

    return {
      titel: 'Schoolprofiel',
      html: pagina(),
      na(root) {
        const melding = (t, soort = '') => { const m = $('#spMelding', root); m.hidden = false; m.className = `melding ${soort}`; m.textContent = t; };
        const teken = () => {
          open = new Set([...root.querySelectorAll('details[data-blok][open]')].map((d) => d.dataset.blok));
          const y = window.scrollY;
          root.innerHTML = String(pagina());
          window.scrollTo(0, y);
        };
        const klaarProfiel = () => {
          const p = kloon(werk);
          p.id = slug(p.school.naam);
          p.huisstijl.motief = p.huisstijl.motiefAan === false ? null : (p.huisstijl.motief ?? basis.huisstijl.motief ?? null);
          delete p.huisstijl.motiefAan;
          // lege sectie-accenten opruimen
          for (const [v, a] of Object.entries(p.sectieAccenten?.perVak ?? {})) {
            for (const k of Object.keys(a)) if (!a[k]) delete a[k];
            if (!Object.keys(a).length) delete p.sectieAccenten.perVak[v];
          }
          return schoonProfiel(p, basis);
        };

        root.addEventListener('submit', (e) => e.preventDefault());
        root.addEventListener('input', (e) => {
          const t = e.target;
          if (!t.dataset.pad || t.type === 'checkbox' || t.tagName === 'SELECT') return;
          let w = t.value;
          if (t.dataset.type === 'getal') w = w === '' ? null : Number(w);
          if (t.dataset.type === 'lijst') w = w.split(',').map((x) => x.trim()).filter(Boolean);
          if (t.dataset.type === 'getallen') w = w.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);
          zet(werk, t.dataset.pad, w);
          if (t.dataset.pad === 'huisstijl.kleuren.hoofd') document.documentElement.style.setProperty('--huis-hoofd', w);
          bewaar();
        });
        root.addEventListener('change', async (e) => {
          const t = e.target;
          if (t.dataset.pad && (t.type === 'checkbox' || t.tagName === 'SELECT')) {
            zet(werk, t.dataset.pad, t.type === 'checkbox' ? t.checked : t.value);
            bewaar();
            if (t.dataset.pad.startsWith('sectieAccenten') || t.dataset.pad.startsWith('vakken')) teken();
            return;
          }
          const a = t.dataset.actie;
          if (a === 'accent') {
            const s = new Set(werk.generator.visieAccenten ?? []);
            t.checked ? s.add(t.value) : s.delete(t.value);
            werk.generator.visieAccenten = [...s]; bewaar();
          } else if (a === 'ruimte') {
            if (t.checked) { const std = basis.ruimtes.find((x) => x.id === t.value); if (std) werk.ruimtes.push(kloon(std)); }
            else werk.ruimtes = werk.ruimtes.filter((x) => x.id !== t.value && !(t.value === 'M' && x.id === 'plein'));
            bewaar(); teken();
          } else if (a === 'vak-alle') {
            werk.vakken[Number(t.dataset.i)].afdelingen = t.checked ? 'alle' : werk.afdelingen.map((x) => x.id);
            bewaar(); teken();
          } else if (a === 'vak-afd') {
            const v = werk.vakken[Number(t.dataset.i)];
            const s = new Set(v.afdelingen === 'alle' ? [] : v.afdelingen);
            t.checked ? s.add(t.value) : s.delete(t.value);
            v.afdelingen = [...s]; bewaar();
          } else if (a === 'logo' && t.files?.[0]) {
            const f = t.files[0];
            if (f.size > 400000) return melding('Dit logo is groter dan 400 kB. Kies een kleinere versie.', 'fout');
            werk.huisstijl.logo = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
            bewaar(); teken();
          } else if (a === 'inlezen' && t.files?.[0]) {
            try { werk = kloon(schoonProfiel(JSON.parse(await t.files[0].text()), basis)); delete werk.eigen; bewaar(); teken(); melding('Profiel ingelezen. Controleer de onderdelen en download of gebruik het.', 'ok'); }
            catch { melding('Dit bestand is geen geldig schoolprofiel.', 'fout'); }
          } else if (a === 'accenten-inlezen' && t.files?.[0]) {
            try {
              const nieuw = uitAccentBestand(await t.files[0].text(), werk.vakken.map((v) => v.id));
              werk.sectieAccenten = { ...(werk.sectieAccenten ?? {}), perVak: voegAccentenSamen(werk.sectieAccenten?.perVak, nieuw) };
              bewaar(); teken();
              const namen = Object.keys(nieuw).map((id) => werk.vakken.find((v) => v.id === id)?.naam ?? id);
              melding(`Sectie-accenten ingelezen voor ${namen.join(', ')}. Download het profiel en zet het op de website, dan geldt het voor iedereen.`, 'ok');
            } catch (err) { melding(err instanceof SyntaxError ? 'Dit bestand kan Uniekind niet lezen.' : err.message, 'fout'); }
          }
        });
        root.addEventListener('click', async (e) => {
          const k = e.target.closest('button[data-actie]');
          if (!k) return;
          const a = k.dataset.actie;
          if (a === 'erbij') {
            const l = lees(werk, k.dataset.lijst) ?? [];
            if (k.dataset.lijst === 'pijlers') l.push({ id: `pijler-${l.length + 1}`, naam: '', omschrijving: '' });
            if (k.dataset.lijst === 'afdelingen') l.push({ id: `afdeling-${Date.now().toString(36)}`, naam: 'Nieuwe afdeling', kort: '', niveau: 'havo', leerjaren: [1, 2, 3], lesduren: [50], standaardLesduur: 50 });
            if (k.dataset.lijst === 'regio.haken') l.push({ thema: '', vakken: [] });
            zet(werk, k.dataset.lijst, l); bewaar(); teken();
          } else if (a === 'weg') {
            lees(werk, k.dataset.lijst).splice(Number(k.dataset.i), 1); bewaar(); teken();
          } else if (a === 'vak-erbij') {
            const naam = $('#nieuwVak', root).value.trim();
            if (!naam) return;
            let vid = slug(naam);
            while (werk.vakken.some((v) => v.id === vid)) vid += '-2';
            werk.vakken.push({ id: vid, naam, afdelingen: 'alle', rekenen: false });
            open.add('vakken'); bewaar(); teken();
          } else if (a === 'logo-weg') {
            werk.huisstijl.logo = null; bewaar(); teken();
          } else if (a === 'download') {
            try { const p = klaarProfiel(); delete p.eigen; download(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }), bestandsnaam(`schoolprofiel-${p.id}`, 'json')); }
            catch (err) { melding(err.message, 'fout'); }
          } else if (a === 'gebruik') {
            const p = klaarProfiel();
            bewaarEigenProfiel(p);
            location.reload();
          } else if (a === 'standaard') {
            wisEigenProfiel(); opslag.wis('profielconcept'); location.reload();
          } else if (a === 'opnieuw') {
            if (window.confirm('Opnieuw beginnen met het profiel dat nu in gebruik is? Je wijzigingen gaan verloren.')) { opslag.wis('profielconcept'); werk = kloon(zonderOverigeVakken(profiel)); delete werk.eigen; teken(); }
          } else if (a === 'deellink') {
            try {
              const p = klaarProfiel(); delete p.eigen;
              const code = await profielNaarCode(p);
              const url = `${location.origin}${location.pathname}?profiel=${code}`;
              $('#spLink', root).hidden = false;
              $('#spLinkVeld', root).value = url;
              $('#spLinkVeld', root).select();
              melding(url.length > 30000 ? 'De link is erg lang, vooral door het logo. Deel liever het bestand, of zet het profiel op de website.' : 'Kopieer de link hieronder en deel hem met je collega’s.', url.length > 30000 ? '' : 'ok');
            } catch { melding('Deze browser kan geen deellink maken. Download het profiel en deel het bestand.', 'fout'); }
          }
        });
      }
    };
  }
};
