// Mijn profiel: je docentprofiel, je lessen, de reflectie na de les en "Jouw werkvormen die werken".
// Alles staat alleen in deze browser. Nooit leerlinggegevens.
import { html, $ } from '../util/html.js';
import { DOCENTSTIJL } from '../data/labels.js';
import { STAND } from '../wizard/stappen.js';
import { laadDocent, laadConcept, bewaarConcept } from '../wizard/staat.js';
import { alleLessen, bewaarReflectie, verwijder, wisAlles, ervaringen, naarBestand, uitBestand } from '../opslag/logboek.js';
import { download, bestandsnaam } from '../export/delen.js';
import * as opslag from '../opslag/opslag.js';

const datumTekst = (d) => {
  try { return new Date(`${d}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' }); } catch { return d; }
};

function profielBlok(profiel, docent, heeftProfiel) {
  const naam = (lijst, id) => lijst.find((x) => x.id === id)?.naam ?? id;
  const stijlen = Object.entries(DOCENTSTIJL).map(([k, t]) => ({ k, t, w: docent.stijl?.[k] ?? 3 })).sort((a, b) => b.w - a.w);
  const stand = STAND.find(([k]) => k === Number(docent.stand ?? 2));
  return html`
    <section class="sectie" aria-labelledby="kop-profiel">
      <h2 id="kop-profiel">Jouw profiel</h2>
      ${heeftProfiel ? html`
      <div class="profielkaart">
        <dl class="kenmerken">
          <div><dt>Vakken</dt><dd>${docent.vakken?.length ? docent.vakken.map((v) => naam(profiel.vakken, v)).join(', ') : 'nog niet gekozen'}</dd></div>
          <div><dt>Afdelingen</dt><dd>${docent.afdelingen?.length ? docent.afdelingen.map((a) => naam(profiel.afdelingen, a)).join(', ') : 'nog niet gekozen'}</dd></div>
          <div><dt>Lesmodel</dt><dd>${naam(profiel.didactiek.lesmodelOpties, docent.lesmodel)}</dd></div>
          <div><dt>Standaard</dt><dd>${stand ? stand[1] : ''}</dd></div>
          ${docent.kracht ? html`<div><dt>Jouw kracht</dt><dd>${docent.kracht}</dd></div>` : ''}
        </dl>
        <div>
          <h3 class="klein-kop">Wat het meest bij je past</h3>
          <ul class="stijlbalken">${stijlen.map((s) => html`<li><span>${s.t}</span><span class="balk" aria-label="${s.w} van 5"><i style="width:${s.w * 20}%"></i></span></li>`)}</ul>
        </div>
      </div>` : html`<p class="lees">Je hebt nog geen profiel ingevuld. Dat duurt twee minuten en helpt Uniekind om bij jouw manier van lesgeven te beginnen.</p>`}
      <div class="knoppen klein-boven"><button type="button" class="knop secundair" data-actie="profiel-aanpassen">${heeftProfiel ? 'Profiel aanpassen' : 'Profiel invullen'}</button></div>
    </section>`;
}

function reflectieFormulier(les) {
  const r = les.reflectie ?? { oordeel: {}, werkte: '', anders: '' };
  return html`
    <form class="reflectie" data-les="${les.id}" novalidate>
      <p class="hulp">Hoe ging het? Je hoeft niet alles in te vullen. Schrijf hier geen namen van leerlingen.</p>
      <fieldset class="duimlijst"><legend>Per werkvorm</legend>
        ${les.werkvormen.map((w) => {
          const v = r.oordeel?.[w.id] ?? 0;
          const n = `${les.id}-${w.id}`;
          return html`<div class="duimrij" role="radiogroup" aria-label="${w.naam}">
            <a href="#werkvorm-${w.id}" class="duimnaam">${w.naam}</a>
            <span class="duimen">
              <label><input type="radio" name="${n}" value="1" ${v === 1 ? 'checked' : ''}><span>👍<span class="visueel-verborgen">Werkte goed</span></span></label>
              <label><input type="radio" name="${n}" value="0" ${v === 0 ? 'checked' : ''}><span>–<span class="visueel-verborgen">Geen oordeel</span></span></label>
              <label><input type="radio" name="${n}" value="-1" ${v === -1 ? 'checked' : ''}><span>👎<span class="visueel-verborgen">Werkte niet</span></span></label>
            </span>
          </div>`;
        })}
      </fieldset>
      <div class="veldrij">
        <div class="veld"><label for="werkte-${les.id}">Wat werkte?</label><textarea id="werkte-${les.id}" name="werkte" rows="2" maxlength="600">${r.werkte}</textarea></div>
        <div class="veld"><label for="anders-${les.id}">Wat doe je volgende keer anders?</label><textarea id="anders-${les.id}" name="anders" rows="2" maxlength="600">${r.anders}</textarea></div>
      </div>
      <div class="knoppen">
        <button type="submit" class="knop klein">Bewaar reflectie</button>
        <button type="button" class="knop secundair klein" data-actie="verwijder" data-les="${les.id}">Les uit de lijst halen</button>
      </div>
    </form>`;
}

function lessenBlok(profiel, lessen) {
  const vakNaam = (id) => profiel.vakken.find((v) => v.id === id)?.naam ?? id;
  const open = lessen.filter((l) => !l.reflectie).length;
  return html`
    <section class="sectie" aria-labelledby="kop-lessen">
      <h2 id="kop-lessen">Mijn lessen en reflectie</h2>
      <p class="lees">Elke les die je tot het materiaal hebt gemaakt, komt hier. Kijk na de les terug: welke werkvormen werkten in jouw klas? Uniekind kiest werkvormen met een duim omhoog daarna iets vaker, en die met een duim omlaag iets minder. ${open ? html`<b>${open === 1 ? 'Eén les wacht' : `${open} lessen wachten`} nog op een terugblik.</b>` : ''}</p>
      ${lessen.length ? html`<ul class="lessenlijst">${lessen.map((l) => html`
        <li>
          <details ${!l.reflectie && l === lessen.find((x) => !x.reflectie) ? 'open' : ''}>
            <summary>
              <span class="les-titel">${l.onderwerp || 'Les zonder onderwerp'}</span>
              <span class="les-meta">${datumTekst(l.datum)} · ${vakNaam(l.vak)}${l.lesduur ? ` · ${l.lesduur} min` : ''}</span>
              ${l.reflectie ? html`<span class="chip goed">Teruggekeken</span>` : html`<span class="chip">Nog terugkijken</span>`}
            </summary>
            ${reflectieFormulier(l)}
          </details>
        </li>`)}</ul>` : html`<p class="leeg">Nog geen lessen. <a href="#les-maken">Maak je eerste les</a>; zodra je bij het materiaal bent, staat hij hier.</p>`}
    </section>`;
}

function werktBlok(lessen) {
  const e = Object.values(ervaringen(lessen));
  const goed = e.filter((x) => x.omhoog > 0 && x.score > 0).sort((a, b) => b.score - a.score || b.omhoog - a.omhoog || b.gebruikt - a.gebruikt);
  const minder = e.filter((x) => x.omlaag > 0 && x.score < 0).sort((a, b) => a.score - b.score);
  const vaak = e.filter((x) => x.gebruikt > 1 && x.omhoog + x.omlaag === 0).sort((a, b) => b.gebruikt - a.gebruikt).slice(0, 6);
  const rij = (x) => html`<li><a href="#werkvorm-${x.id}">${x.naam}</a> <span class="hulp">${x.omhoog ? `${x.omhoog}× 👍` : ''}${x.omhoog && x.omlaag ? ' · ' : ''}${x.omlaag ? `${x.omlaag}× 👎` : ''}${!x.omhoog && !x.omlaag ? `${x.gebruikt}× gebruikt` : ''}</span></li>`;
  return html`
    <section class="sectie" aria-labelledby="kop-werkt">
      <h2 id="kop-werkt">Jouw werkvormen die werken</h2>
      ${goed.length || minder.length ? html`
      <div class="pijlers">
        <div class="pijler"><h3>Werkt bij jou</h3>${goed.length ? html`<ul class="werktlijst">${goed.map(rij)}</ul>` : html`<p class="hulp">Nog geen duim omhoog gegeven.</p>`}</div>
        <div class="pijler"><h3>Ging minder goed</h3>${minder.length ? html`<ul class="werktlijst">${minder.map(rij)}</ul><p class="hulp">Soms ligt het aan het moment of de klas. Probeer het nog eens met de tips bij de valkuilen.</p>` : html`<p class="hulp">Niets met een duim omlaag.</p>`}</div>
        ${vaak.length ? html`<div class="pijler"><h3>Vaak gebruikt, nog niet beoordeeld</h3><ul class="werktlijst">${vaak.map(rij)}</ul></div>` : ''}
      </div>` : html`<p class="lees">Zodra je na een les een duim omhoog of omlaag geeft, zie je hier welke werkvormen bij jou en je klassen werken.</p>`}
    </section>`;
}

function gegevensBlok(lessen) {
  return html`
    <section class="sectie" aria-labelledby="kop-gegevens">
      <h2 id="kop-gegevens">Wat Uniekind onthoudt</h2>
      <div class="lees">
        <p>Alles op deze pagina staat alleen in deze browser, op deze computer. Er gaat niets naar een server en er zijn geen accounts. Uniekind bewaart: je docentprofiel, je laatste lesconcept, en per les het onderwerp, vak, de lesduur, de werkvormen en je reflectie. Nooit namen, cijfers of andere gegevens van leerlingen.</p>
        <p>Werk je op een andere laptop? Neem je lessen mee als bestand.</p>
      </div>
      <div class="knoppen">
        <button type="button" class="knop secundair klein" data-actie="download" ${lessen.length ? '' : 'disabled'}>Mijn lessen downloaden</button>
        <label class="knop secundair klein bestandknop">Mijn lessen inlezen<input type="file" accept=".json,application/json" data-actie="inlezen" class="visueel-verborgen"></label>
        <button type="button" class="knop secundair klein" data-actie="wis-lessen" ${lessen.length ? '' : 'disabled'}>Lessen en reflecties wissen</button>
        <button type="button" class="knop secundair klein" data-actie="wis-alles">Alles wissen, ook mijn profiel</button>
      </div>
      <p id="gegevensMelding" class="melding" role="status" hidden></p>
    </section>`;
}

export default {
  async render({ profiel }) {
    const pagina = () => {
      const docent = laadDocent(profiel);
      const heeftProfiel = !!opslag.lees('docentprofiel');
      const lessen = alleLessen();
      return html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Mijn profiel</p>
          <h1>Jouw lessen, jouw ervaring</h1>
          <p class="lead">Hoe jij lesgeeft, welke lessen je maakte en wat werkte. Zo wordt Uniekind elke les een beetje meer van jou.</p>
        </div></section>
        <main class="wrap">
          ${profielBlok(profiel, docent, heeftProfiel)}
          ${lessenBlok(profiel, lessen)}
          ${werktBlok(lessen)}
          ${gegevensBlok(lessen)}
        </main>`;
    };
    return {
      titel: 'Mijn profiel',
      html: pagina(),
      na(root) {
        const teken = (melding) => {
          const y = window.scrollY;
          root.innerHTML = String(pagina());
          window.scrollTo(0, y);
          if (melding) { const m = $('#gegevensMelding', root); m.hidden = false; m.textContent = melding; }
        };
        root.addEventListener('submit', (e) => {
          const f = e.target.closest('form.reflectie');
          if (!f) return;
          e.preventDefault();
          const id = f.dataset.les;
          const les = alleLessen().find((l) => l.id === id);
          if (!les) return;
          const oordeel = {};
          for (const w of les.werkvormen) {
            const g = f.querySelector(`input[name="${CSS.escape(`${id}-${w.id}`)}"]:checked`);
            if (g) oordeel[w.id] = Number(g.value);
          }
          bewaarReflectie(id, { oordeel, werkte: f.werkte.value, anders: f.anders.value });
          teken();
          const kop = root.querySelector('#kop-werkt');
          kop?.setAttribute('tabindex', '-1');
          const m = document.createElement('p');
          m.className = 'melding ok'; m.setAttribute('role', 'status');
          m.textContent = 'Bewaard. Uniekind houdt hier rekening mee bij je volgende les.';
          root.querySelector(`[data-les="${CSS.escape(id)}"]`)?.closest('details')?.after(m);
        });
        root.addEventListener('click', (e) => {
          const k = e.target.closest('[data-actie]');
          if (!k || k.tagName === 'INPUT') return;
          const a = k.dataset.actie;
          if (a === 'profiel-aanpassen') {
            const concept = laadConcept(profiel, laadDocent(profiel));
            concept.modus = 'uitgebreid'; concept.stap = 'profiel';
            bewaarConcept(concept);
            location.hash = 'les-maken';
          } else if (a === 'verwijder') {
            if (window.confirm('Deze les uit de lijst halen? De reflectie verdwijnt ook.')) { verwijder(k.dataset.les); teken(); }
          } else if (a === 'download') {
            download(new Blob([naarBestand()], { type: 'application/json' }), bestandsnaam('mijn-lessen', 'json'));
          } else if (a === 'wis-lessen') {
            if (window.confirm('Al je lessen en reflecties wissen? Dit kan niet ongedaan worden gemaakt.')) { wisAlles(); teken('Je lessen en reflecties zijn gewist.'); }
          } else if (a === 'wis-alles') {
            if (window.confirm('Alles wissen: je profiel, je laatste les, je lessen en reflecties? Dit kan niet ongedaan worden gemaakt.')) {
              wisAlles();
              for (const s of ['docentprofiel', 'concept', 'digibord-geluid']) opslag.wis(s);
              teken('Alles is gewist. Uniekind begint weer blanco.');
            }
          }
        });
        root.addEventListener('change', async (e) => {
          const t = e.target;
          if (t.dataset?.actie !== 'inlezen' || !t.files?.[0]) return;
          try {
            const n = uitBestand(await t.files[0].text());
            teken(`${n === 1 ? 'Eén les' : `${n} lessen`} ingelezen.`);
          } catch (err) {
            teken(err instanceof SyntaxError ? 'Dit bestand kan Uniekind niet lezen.' : err.message);
          }
        });
      }
    };
  }
};
