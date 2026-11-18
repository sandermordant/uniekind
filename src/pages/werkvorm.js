import { html, inFrame } from '../util/html.js';
import { laadWerkvorm, laadBronnen, laadTaxonomie } from '../data/laden.js';
import { termen } from '../data/termen.js';
import {
  CATEGORIE, LESFASE, GROEPSVORM, DENKNIVEAU, DIFFERENTIATIE, RICHTING, ONDERSTEUNING, PAST, RUIMTE,
  VOORBEREIDING, ENERGIE, INSTAP, BEWIJS, DOELDOMEIN, BURGERSCHAP, DOCENTSTIJL, VARIANT, duurTekst
} from '../data/labels.js';

const LAPTOP = { nee: 'Niet nodig', optioneel: 'Kan, hoeft niet', vereist: 'Nodig (schoollaptop)' };

export default {
  async render({ profiel }, id) {
    const [w, bronnen, tax] = await Promise.all([laadWerkvorm(id), laadBronnen(), laadTaxonomie()]);
    if (!w) {
      return {
        titel: 'Niet gevonden',
        html: html`<main class="wrap"><p class="leeg">Deze werkvorm bestaat niet (meer). <a href="#bibliotheek">Terug naar alle werkvormen</a>.</p></main>`
      };
    }
    const kleur = `var(--huis-${profiel.huisstijl.categoriekleur?.[w.categorie] ?? 'hoofd'})`;
    const rtti = [...new Set(w.denkniveau.map((d) => tax.bloom.find((b) => b.id === d)?.rtti).filter(Boolean))];
    const ruimtes = Object.entries(RUIMTE).filter(([k]) => w.ruimte[k]).map(([, v]) => v);
    const labels = [
      ...w.doeldomein.map((d) => DOELDOMEIN[d]),
      ...w.burgerschap.map((b) => `Burgerschap: ${BURGERSCHAP[b]}`),
      w.perspectieven ? 'Meerdere perspectieven' : null,
      w.beweegmoment ? 'Beweegmoment' : null
    ].filter(Boolean);

    return {
      titel: w.naam,
      html: html`
        <section class="band band-klein"><div class="wrap">
          <a class="terug" href="#bibliotheek"><span aria-hidden="true">←</span> Alle werkvormen</a>
          <div class="chips"><span class="chip" style="--c:${kleur}"><span class="stip"></span>${CATEGORIE[w.categorie]}</span>${w.beginHier ? html`<span class="chip">Begin hier</span>` : ''}</div>
          <h1 style="margin-top:.5rem">${w.naam}</h1>
          ${w.alias.length ? html`<p class="eyebrow" style="margin-top:.35rem">Ook bekend als: ${w.alias.join(', ')}</p>` : ''}
          <p class="lead">${w.kort}</p>
        </div></section>
        <main class="wrap">
          <div class="detail">
            <div style="display:grid;gap:2rem;min-width:0">
              <section class="sectie">
                <h2>Zo doe je het</h2>
                <blockquote class="startzin">${w.startzin}</blockquote>
                <ol class="stappen">${w.stappen.map((s) => html`<li><span>${s}</span></li>`)}</ol>
              </section>

              ${w.alsDan?.length ? html`
              <section class="sectie">
                <h2>Als je dit ziet, doe dan dit</h2>
                <div class="tabelvak" tabindex="0" role="region" aria-label="Als je dit ziet, doe dan dit"><table>
                  <thead><tr><th scope="col">Als</th><th scope="col">Dan</th></tr></thead>
                  <tbody>${w.alsDan.map((r) => html`<tr><td>${r.als}</td><td>${r.dan}</td></tr>`)}</tbody>
                </table></div>
              </section>` : ''}

              ${w.opbouw?.length ? html`
              <section class="sectie">
                <h2>Opbouw van het model</h2>
                <ol class="stappen">${w.opbouw.map((o) => html`<li><span><b>${o.fase}.</b> ${o.wat}</span></li>`)}</ol>
              </section>` : ''}

              <section class="sectie">
                <h2>Valkuilen</h2>
                <div class="twee">${w.valkuilen.map((v) => html`<div class="blok"><h4>Valkuil</h4><p>${v.valkuil}</p><h4 style="margin-top:.4rem">Zo voorkom je het</h4><p>${v.oplossing}</p></div>`)}</div>
              </section>

              <section class="sectie">
                <h2>Per niveau en per groep</h2>
                <div class="twee">${Object.entries(VARIANT).map(([k, v]) => html`<div class="blok"><h4>${v}</h4><p>${w.varianten[k]}</p></div>`)}</div>
              </section>

              <section class="sectie">
                <h2>Voorbeelden uit verschillende vakken</h2>
                <div class="twee">${w.vakvoorbeelden.map((v) => html`<div class="blok"><h4>${v.vak}</h4><p>${v.voorbeeld}</p></div>`)}</div>
              </section>

              <section class="sectie">
                <h2>Voor leerlingen die iets extra nodig hebben</h2>
                <div class="tabelvak" tabindex="0" role="region" aria-label="Voor leerlingen die iets extra nodig hebben"><table>
                  <thead><tr><th scope="col">Behoefte</th><th scope="col">Geschikt</th><th scope="col">Tip</th></tr></thead>
                  <tbody>${Object.entries(ONDERSTEUNING).map(([k, v]) => html`<tr><th scope="row">${v}</th><td><span class="past" data-p="${w.ondersteuning[k].past}">${PAST[w.ondersteuning[k].past]}</span></td><td>${w.ondersteuning[k].tip}</td></tr>`)}</tbody>
                </table></div>
              </section>

              <section class="sectie">
                <h2>Waarom dit werkt</h2>
                <p class="lees">${w.waarom}</p>
                <p><span class="bewijs" data-b="${w.bewijs}">${BEWIJS[w.bewijs]}</span></p>
                ${w.bronnen.length ? html`
                  <ul class="bronnen">${w.bronnen.map((b) => {
                    const br = bronnen[b];
                    if (!br) return '';
                    const tekst = html`${br.auteur}${br.jaar ? ` (${br.jaar})` : ''}. <i>${br.titel}</i>${br.waar ? `. ${br.waar}` : ''}`;
                    return html`<li>${br.url ? html`<a href="${br.url}" target="_blank" rel="noopener noreferrer">${tekst}</a>` : tekst}${br.status !== 'gecontroleerd' ? html` <span class="status-controle">bron nog controleren</span>` : ''}</li>`;
                  })}</ul>` : ''}
              </section>
            </div>

            <aside aria-label="Kenmerken">
              <dl class="feiten">
                <div><dt>Duur</dt><dd>${duurTekst(w.duur)}</dd></div>
                <div><dt>Groepsvorm</dt><dd>${w.groepsvorm.map((g) => GROEPSVORM[g]).join(', ')}</dd></div>
                <div><dt>Lesfase</dt><dd>${w.lesfase.map((f) => LESFASE[f]).join(', ')}</dd></div>
                <div><dt>Werkt in</dt><dd>${ruimtes.join(', ')}${w.ruimte.beweging ? ' · ruimte om te bewegen nodig' : ''}</dd></div>
                <div><dt>Voorbereiding</dt><dd>${VOORBEREIDING[w.voorbereiding]}</dd></div>
                <div><dt>Middelen</dt><dd>${w.middelen.lijst.join(', ')}</dd></div>
                <div><dt>Laptop</dt><dd>${LAPTOP[w.middelen.laptop]}</dd></div>
                <div><dt>Telefoon</dt><dd>Nooit: ${profiel.regels.telefoon.motto?.toLowerCase() ?? 'niet toegestaan'}</dd></div>
                <div><dt>Denkniveau</dt><dd>${w.denkniveau.map((d) => DENKNIVEAU[d]).join(', ')}${rtti.length ? ` (RTTI: ${rtti.join(', ')})` : ''}</dd></div>
                <div><dt>Energie</dt><dd>${ENERGIE[w.energie]}</dd></div>
                <div><dt>Instap</dt><dd>${INSTAP[w.instapniveau]}</dd></div>
                ${w.vereist.plein ? html`<div><dt>Let op</dt><dd>Alleen in een ${termen.M} met ${termen.plein}, met toezicht daar.</dd></div>` : ''}
                ${w.vereist.onderwijsassistent ? html`<div><dt>Let op</dt><dd>Vraagt een onderwijsassistent.</dd></div>` : ''}
              </dl>
              ${w.differentiatie.length ? html`<div class="blok"><h4>Differentieert op</h4><p>${w.differentiatie.map((d) => DIFFERENTIATIE[d]).join(', ')}</p>${RICHTING[w.richting] ? html`<p style="color:var(--muted)">${RICHTING[w.richting]}</p>` : ''}</div>` : ''}
              ${w.docentstijl.length ? html`<div class="blok"><h4>Past bij jou als je zegt</h4>${w.docentstijl.map((d) => html`<p>“${DOCENTSTIJL[d]}”</p>`)}</div>` : ''}
              ${labels.length ? html`<div class="chips">${labels.map((l) => html`<span class="chip">${l}</span>`)}</div>` : ''}
              ${inFrame ? '' : html`<div class="knoppen niet-printen" style="margin-top:0"><button type="button" class="knop secundair klein" id="printKaart">Print als instructiekaart</button></div>`}
            </aside>
          </div>
        </main>`,
      na(root) {
        root.querySelector('#printKaart')?.addEventListener('click', () => window.print());
      }
    };
  }
};
