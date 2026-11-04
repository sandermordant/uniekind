// Les openen: een .uniekind-bestand inladen.
import { html, $ } from '../util/html.js';
import { leesLesbestand } from '../export/lesbestand.js';
import * as opslag from '../opslag/opslag.js';

export default {
  async render({ profiel }) {
    return {
      titel: 'Les openen',
      html: html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Les openen</p>
          <h1>Een bewaarde les openen</h1>
          <p class="lead">Kies een lesbestand (.uniekind) dat je eerder hebt bewaard. Het bestand blijft op je eigen computer; Uniekind leest het alleen.</p>
        </div></section>
        <main class="wrap">
          <div class="sectie">
            <label class="dropvak" id="dropvak" for="bestand">
              <span><b>Sleep je lesbestand hierheen</b> of klik om te kiezen</span>
              <input type="file" id="bestand" accept=".uniekind,application/json">
            </label>
            <div id="uitkomst" aria-live="polite"></div>
          </div>
          <div class="sectie lees">
            <h2>Hoe bewaar je een les?</h2>
            <p>Maak een les, ga naar <b>Materiaal</b> en kies <b>Lesbestand bewaren</b>. Je krijgt een klein bestand dat je in je eigen map of op OneDrive kunt zetten. Er staan geen namen van leerlingen in, alleen je lesinvoer en aantallen.</p>
          </div>
        </main>`,
      na(root) {
        const uitkomst = $('#uitkomst', root);
        let geladen = null;
        const toon = (tekst) => {
          try {
            geladen = leesLesbestand(tekst);
            const s = geladen.samenvatting;
            const datum = geladen.gemaakt ? new Date(geladen.gemaakt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            uitkomst.innerHTML = String(html`
              <div class="blok" style="margin-top:1rem">
                <h3>${geladen.titel}</h3>
                <p>${[datum && `Bewaard op ${datum}`, s?.lesduur && `${s.lesduur} minuten`, s?.stand, s?.opzet].filter(Boolean).join(' · ')}</p>
                ${geladen.profiel && geladen.profiel !== profiel.id ? html`<p class="melding">Deze les is gemaakt met een ander schoolprofiel (${geladen.profiel}). Lokalen en lestijden kunnen afwijken.</p>` : ''}
                <div class="knoppen">
                  <button type="button" class="knop" id="open">Open deze les</button>
                  ${s?.werkvormen?.length ? html`<button type="button" class="knop secundair" id="vorige">Maak een nieuwe les, met variatie op deze</button>` : ''}
                </div>
              </div>`);
            $('#open', root).addEventListener('click', () => { opslag.schrijf('concept', geladen.concept); location.hash = 'les-maken'; });
            $('#vorige', root)?.addEventListener('click', () => {
              const huidig = opslag.lees('concept');
              const c = huidig ?? geladen.concept;
              c.invoer.opties = { ...c.invoer.opties, vorigeLes: s.werkvormen, vastgezet: {}, overslaan: {}, gekozen: {} };
              c.stap = c.modus === 'uitgebreid' ? 'context' : 'snel';
              c.gekozenStand = null;
              opslag.schrijf('concept', c);
              location.hash = 'les-maken';
            });
          } catch (e) {
            uitkomst.innerHTML = String(html`<p class="melding fout" style="margin-top:1rem">${e.message}</p>`);
          }
        };
        const lees = (bestand) => { if (bestand) bestand.text().then(toon); };
        $('#bestand', root).addEventListener('change', (e) => lees(e.target.files?.[0]));
        const dv = $('#dropvak', root);
        dv.addEventListener('dragover', (e) => { e.preventDefault(); dv.classList.add('over'); });
        dv.addEventListener('dragleave', () => dv.classList.remove('over'));
        dv.addEventListener('drop', (e) => { e.preventDefault(); dv.classList.remove('over'); lees(e.dataTransfer.files?.[0]); });
      }
    };
  }
};
