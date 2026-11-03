// Invulformulier voor een nieuwe werkvorm. Voor collega's zonder programmeerkennis:
// het formulier maakt een geldig JSON-item dat je kunt kopiëren en insturen.
import { html, $, inFrame } from '../util/html.js';
import { laadSchema, laadBronnen } from '../data/laden.js';
import {
  CATEGORIE, LESFASE, GROEPSVORM, DENKNIVEAU, DIFFERENTIATIE, ONDERSTEUNING, PAST, RUIMTE,
  VOORBEREIDING, ENERGIE, INSTAP, BEWIJS, DOELDOMEIN, BURGERSCHAP, DOCENTSTIJL, VARIANT
} from '../data/labels.js';
import * as opslag from '../opslag/opslag.js';

const RICHTING_OPT = { convergent: 'Convergent', divergent: 'Divergent', beide: 'Beide', nvt: 'Niet van toepassing' };
const LAPTOP_OPT = { nee: 'Niet nodig', optioneel: 'Kan, hoeft niet', vereist: 'Nodig' };

// Voorbeeld, zodat je ziet hoe het werkt. Duidelijk gemarkeerd als voorbeeld.
const VOORBEELD = {
  id: 'woordmuur', naam: 'Woordmuur (voorbeeld)', alias: 'vaktaalmuur\nbegrippenwand', categorie: 'routine',
  kort: 'Een vaste plek in het lokaal waar de kernbegrippen van het hoofdstuk hangen, met een korte omschrijving en een plaatje.',
  startzin: 'Kijk naar de woordmuur. Welk begrip van vandaag kun jij al uitleggen aan je buur?',
  stappen: 'Kies per hoofdstuk 6-10 kernbegrippen.\nZet elk begrip op een kaart met een omschrijving in eenvoudige taal en een plaatje.\nHang de kaarten op een vaste plek die iedereen kan zien.\nVerwijs er tijdens de les naar en laat leerlingen begrippen gebruiken in hun antwoorden.',
  duurMin: 1, duurMax: 5, groepsvorm: ['klas', 'individueel'],
  ruimte: ['M', 'L'], beweging: false, middelen: 'kaarten met begrippen\nplakband', laptop: 'nee', voorbereiding: 'kort',
  lesfase: ['instructie', 'verwerken'], denkniveau: ['onthouden', 'begrijpen'], differentiatie: ['ondersteuning'], richting: 'convergent',
  doeldomein: ['kwalificatie'], burgerschap: ['inclusie'],
  ondersteuning: {
    dyslexie: ['goed', 'Plaatjes en korte omschrijvingen helpen bij het lezen.'],
    dyscalculie: ['goed', 'Ook formules en eenheden kunnen op de muur.'],
    nt2: ['goed', 'Juist voor NT2-leerlingen: vaktaal altijd zichtbaar.'],
    faalangst: ['goed', 'Een hulpmiddel dat je kunt gebruiken zonder iets te vragen.'],
    structuur: ['goed', 'Vaste plek, elk hoofdstuk dezelfde opbouw.'],
    hoogbegaafd: ['aanpassen', 'Laat hen de kaarten voor een nieuw hoofdstuk maken.']
  },
  energie: 'rustig', docentstijl: ['uitleggen', 'structuur', 'houvast'], instapniveau: 1,
  vereistOa: false, vereistPlein: false, beweegmoment: false, perspectieven: false,
  valkuilen: 'De muur hangt er, maar niemand kijkt ernaar | Verwijs er elke les minstens één keer naar.',
  varianten: { vmbo: 'Met plaatje en één zin.', havo: 'Begrip, omschrijving, voorbeeld.', vwo: 'Ook verbanden tussen begrippen.', steun: 'Kopie van de muur op een kaart op tafel.', basis: 'Standaard.', verdieping: 'Zelf kaarten maken.' },
  vakvoorbeelden: 'Biologie | Begrippen van de cel met tekening.\nEconomie | Vraag, aanbod, prijs, markt.\nDuits | De naamvallen met een voorbeeldzin.',
  waarom: 'Kernbegrippen zichtbaar houden ondersteunt taalzwakke en NT2-leerlingen en helpt iedereen vaktaal te gebruiken. Het is een praktijkhulpmiddel; specifiek onderzoek naar woordmuren is beperkt.',
  bewijs: 'praktijk', bronnen: [], materiaal: 'vaktaal-steunkaart', alsDan: ''
};

const regels = (t) => String(t ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
const paren = (t, a, b) => regels(t).map((r) => { const [x, ...y] = r.split('|'); return { [a]: (x ?? '').trim(), [b]: y.join('|').trim() }; });

const tekst = (id, label, waarde, hulp = '', type = 'text') => html`
  <div class="veld"><label for="f-${id}">${label}</label>
  <input type="${type}" id="f-${id}" name="${id}" value="${waarde ?? ''}">${hulp ? html`<span class="hulp">${hulp}</span>` : ''}</div>`;
const vak = (id, label, waarde, hulp = '') => html`
  <div class="veld"><label for="f-${id}">${label}</label>
  <textarea id="f-${id}" name="${id}">${waarde ?? ''}</textarea>${hulp ? html`<span class="hulp">${hulp}</span>` : ''}</div>`;
const kies = (id, label, opties, waarde) => html`
  <div class="veld"><label for="f-${id}">${label}</label>
  <select id="f-${id}" name="${id}">${Object.entries(opties).map(([k, v]) => html`<option value="${k}" ${String(waarde) === String(k) ? 'selected' : ''}>${v}</option>`)}</select></div>`;
const vinks = (id, label, opties, waarden = []) => html`
  <div class="veld"><span class="label">${label}</span><div class="vinkjes">
  ${Object.entries(opties).map(([k, v]) => html`<label><input type="checkbox" name="${id}" value="${k}" ${waarden.includes(k) ? 'checked' : ''}> ${v}</label>`)}
  </div></div>`;
const ja = (id, label, waarde) => html`<label style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" name="${id}" id="f-${id}" ${waarde ? 'checked' : ''} style="width:1.05rem;height:1.05rem;accent-color:var(--accent)"> ${label}</label>`;

function leesFormulier(form) {
  const fd = new FormData(form);
  const v = (k) => (fd.get(k) ?? '').toString().trim();
  const alle = (k) => fd.getAll(k).map(String);
  const item = {
    id: v('id'), naam: v('naam'), alias: regels(v('alias')), categorie: v('categorie'), kort: v('kort'),
    startzin: v('startzin'), stappen: regels(v('stappen')),
    duur: { min: Number(v('duurMin')), max: Number(v('duurMax')) },
    groepsvorm: alle('groepsvorm'),
    ruimte: { M: alle('ruimte').includes('M'), L: alle('ruimte').includes('L'), plein: alle('ruimte').includes('plein'), stilte: alle('ruimte').includes('stilte'), beweging: fd.has('beweging') },
    middelen: { lijst: regels(v('middelen')), laptop: v('laptop'), telefoon: false },
    voorbereiding: v('voorbereiding'), lesfase: alle('lesfase'), denkniveau: alle('denkniveau'),
    differentiatie: alle('differentiatie'), richting: v('richting'), doeldomein: alle('doeldomein'), burgerschap: alle('burgerschap'),
    ondersteuning: Object.fromEntries(Object.keys(ONDERSTEUNING).map((k) => [k, { past: v(`ond-${k}`), tip: v(`tip-${k}`) }])),
    energie: v('energie'), docentstijl: alle('docentstijl'), instapniveau: Number(v('instapniveau')),
    vereist: { onderwijsassistent: fd.has('vereistOa'), plein: fd.has('vereistPlein') },
    beweegmoment: fd.has('beweegmoment'), perspectieven: fd.has('perspectieven'),
    valkuilen: paren(v('valkuilen'), 'valkuil', 'oplossing'),
    varianten: Object.fromEntries(Object.keys(VARIANT).map((k) => [k, v(`var-${k}`)])),
    vakvoorbeelden: paren(v('vakvoorbeelden'), 'vak', 'voorbeeld'),
    waarom: v('waarom'), bewijs: v('bewijs'), bronnen: alle('bronnen'), materiaal: regels(v('materiaal'))
  };
  const ad = paren(v('alsDan'), 'als', 'dan');
  if (ad.length) item.alsDan = ad;
  return item;
}

const VERTAAL = [
  [/must have required property '(.+)'/, (m) => `het veld "${m[1]}" ontbreekt`],
  [/must NOT have fewer than (\d+) characters/, (m) => `is te kort (minimaal ${m[1]} tekens)`],
  [/must NOT have fewer than (\d+) items/, (m) => `vraagt minimaal ${m[1]}`],
  [/must be equal to one of the allowed values/, () => 'heeft een waarde die niet in de lijst staat'],
  [/must match pattern/, () => 'mag alleen kleine letters, cijfers en streepjes bevatten'],
  [/must be >= (\d+)/, (m) => `moet minimaal ${m[1]} zijn`],
  [/must be <= (\d+)/, (m) => `mag maximaal ${m[1]} zijn`]
];
const vertaal = (e) => {
  for (const [re, f] of VERTAAL) { const m = e.message.match(re); if (m) return `${e.instancePath.replace(/^\//, '').replaceAll('/', ' › ') || 'Werkvorm'}: ${f(m)}`; }
  return `${e.instancePath || 'Werkvorm'}: ${e.message}`;
};

export default {
  async render() {
    const [schema, bronnen] = await Promise.all([laadSchema(), laadBronnen()]);
    const b = opslag.lees('invulformulier-concept') ?? VOORBEELD;
    const bronOpties = Object.fromEntries(Object.entries(bronnen).map(([k, x]) => [k, `${x.auteur.split(',')[0]} (${x.jaar ?? 'online'})`]));
    return {
      titel: 'Werkvorm toevoegen',
      html: html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Kennisbank aanvullen</p>
          <h1>Werkvorm toevoegen</h1>
          <p class="lead">Vul het formulier in. Onderaan zie je direct of alles klopt en krijg je het item om in te sturen. Het formulier staat ingevuld met een voorbeeld, zodat je ziet hoe het werkt.</p>
        </div></section>
        <main class="wrap">
          <form class="formulier" id="wvForm" novalidate>
            <fieldset class="groep"><legend>De basis</legend>
              <div class="veldrij">${tekst('naam', 'Naam', b.naam)}${tekst('id', 'Korte sleutel', b.id, 'Kleine letters en streepjes, bijv. woordmuur')}</div>
              ${kies('categorie', 'Soort werkvorm', CATEGORIE, b.categorie)}
              ${vak('alias', 'Andere namen (één per regel)', b.alias)}
              ${tekst('kort', 'Wat is het, in één zin?', b.kort)}
              ${tekst('startzin', 'Wat zeg je letterlijk bij de start?', b.startzin)}
              ${vak('stappen', 'Stappenplan (één stap per regel)', b.stappen, 'Minimaal 3 stappen')}
            </fieldset>
            <fieldset class="groep"><legend>Tijd, ruimte en middelen</legend>
              <div class="veldrij">${tekst('duurMin', 'Duur minimaal (min)', b.duurMin, '', 'number')}${tekst('duurMax', 'Duur maximaal (min)', b.duurMax, '', 'number')}${kies('voorbereiding', 'Voorbereiding', VOORBEREIDING, b.voorbereiding)}</div>
              ${vinks('groepsvorm', 'Groepsvorm', GROEPSVORM, b.groepsvorm)}
              ${vinks('ruimte', 'Werkt in', RUIMTE, b.ruimte)}
              ${ja('beweging', 'Leerlingen moeten kunnen bewegen', b.beweging)}
              ${vak('middelen', 'Benodigde middelen (één per regel; nooit een telefoon)', b.middelen)}
              ${kies('laptop', 'Schoollaptop', LAPTOP_OPT, b.laptop)}
              ${ja('vereistPlein', 'Kan alleen met een deelplein', b.vereistPlein)}
              ${ja('vereistOa', 'Vraagt een onderwijsassistent', b.vereistOa)}
            </fieldset>
            <fieldset class="groep"><legend>Didactiek</legend>
              ${vinks('lesfase', 'Lesfase', LESFASE, b.lesfase)}
              ${vinks('denkniveau', 'Denkniveau (Bloom)', DENKNIVEAU, b.denkniveau)}
              ${vinks('differentiatie', 'Differentieert op', DIFFERENTIATIE, b.differentiatie)}
              <div class="veldrij">${kies('richting', 'Richting', RICHTING_OPT, b.richting)}${kies('energie', 'Energie', ENERGIE, b.energie)}${kies('instapniveau', 'Instapniveau', INSTAP, b.instapniveau)}</div>
              ${vinks('doeldomein', 'Doeldomein', DOELDOMEIN, b.doeldomein)}
              ${vinks('burgerschap', 'Raakt aan burgerschap', BURGERSCHAP, b.burgerschap)}
              ${vinks('docentstijl', 'Past bij docenten die zeggen…', DOCENTSTIJL, b.docentstijl)}
              ${ja('beweegmoment', 'Telt als beweegmoment', b.beweegmoment)}
              ${ja('perspectieven', 'Brengt meerdere perspectieven in beeld', b.perspectieven)}
              ${vak('alsDan', 'Als-dan-regels (alleen bij een check). Per regel: als | dan', b.alsDan)}
            </fieldset>
            <fieldset class="groep"><legend>Ondersteuning</legend>
              ${Object.entries(ONDERSTEUNING).map(([k, l]) => html`<div class="veldrij">${kies(`ond-${k}`, l, PAST, b.ondersteuning?.[k]?.[0] ?? 'goed')}${tekst(`tip-${k}`, `Tip bij ${l.toLowerCase()}`, b.ondersteuning?.[k]?.[1] ?? '')}</div>`)}
            </fieldset>
            <fieldset class="groep"><legend>Varianten en voorbeelden</legend>
              <div class="veldrij">${Object.entries(VARIANT).map(([k, l]) => tekst(`var-${k}`, l, b.varianten?.[k]))}</div>
              ${vak('valkuilen', 'Valkuilen. Per regel: valkuil | oplossing', b.valkuilen)}
              ${vak('vakvoorbeelden', 'Vakvoorbeelden (minimaal 3 vakken). Per regel: vak | voorbeeld', b.vakvoorbeelden)}
            </fieldset>
            <fieldset class="groep"><legend>Onderbouwing</legend>
              ${vak('waarom', 'Waarom werkt dit? (2-3 zinnen, eerlijk over het bewijs)', b.waarom)}
              ${kies('bewijs', 'Sterkte van het bewijs', BEWIJS, b.bewijs)}
              ${vinks('bronnen', 'Bronnen (alleen echte, gecontroleerde bronnen)', bronOpties, b.bronnen)}
              ${tekst('materiaal', 'Materiaal (sjablonen, gescheiden door een nieuwe regel)', b.materiaal)}
            </fieldset>
            <div class="uitvoer" aria-live="polite">
              <div id="status"></div>
              <div class="knoppen" style="margin-top:0">
                <button type="button" class="knop klein" id="kopieer">Kopieer JSON</button>
                ${inFrame ? '' : html`<button type="button" class="knop secundair klein" id="download">Download als bestand</button>`}
                <button type="button" class="knop secundair klein" id="leeg">Begin met een leeg formulier</button>
              </div>
              <details><summary>Bekijk het JSON-item</summary><pre id="json"></pre></details>
            </div>
          </form>
        </main>`,
      async na(root) {
        const { default: Ajv2020 } = await import('ajv/dist/2020.js');
        const valideer = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
        const form = $('#wvForm', root);
        let laatste = null;
        const werkBij = () => {
          const item = leesFormulier(form);
          laatste = JSON.stringify(item, null, 2);
          $('#json', root).textContent = laatste;
          const ok = valideer(item) && new Set(item.vakvoorbeelden.map((x) => x.vak.toLowerCase())).size >= 3;
          const fouten = (valideer.errors ?? []).map(vertaal);
          if (ok) $('#status', root).innerHTML = '<p class="melding ok">Alles klopt. Kopieer het item en stuur het naar de beheerder van de kennisbank.</p>';
          else {
            if (!fouten.length) fouten.push('vakvoorbeelden: minimaal drie verschillende vakken');
            $('#status', root).innerHTML = `<div class="melding fout">Nog niet compleet:<ul>${fouten.slice(0, 6).map((f) => `<li>${f.replace(/[<>&]/g, '')}</li>`).join('')}</ul></div>`;
          }
        };
        form.addEventListener('submit', (e) => e.preventDefault());
        form.addEventListener('input', werkBij);
        form.addEventListener('change', werkBij);
        $('#kopieer', root).addEventListener('click', async (e) => {
          try { await navigator.clipboard.writeText(laatste); e.target.textContent = 'Gekopieerd'; }
          catch {
            const pre = $('#json', root); pre.closest('details').open = true;
            const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
            e.target.textContent = 'Geselecteerd: kopieer met Ctrl+C';
          }
          setTimeout(() => { e.target.textContent = 'Kopieer JSON'; }, 2500);
        });
        $('#download', root)?.addEventListener('click', () => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([laatste], { type: 'application/json' }));
          a.download = `${JSON.parse(laatste).id || 'werkvorm'}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        });
        $('#leeg', root).addEventListener('click', () => {
          form.reset();
          for (const el of form.querySelectorAll('input[type=text], input[type=number], textarea')) el.value = '';
          for (const el of form.querySelectorAll('input[type=checkbox]')) el.checked = false;
          werkBij();
        });
        werkBij();
      }
    };
  }
};
