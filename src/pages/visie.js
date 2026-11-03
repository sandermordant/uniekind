import { html } from '../util/html.js';
import { laadBronnen } from '../data/laden.js';

export default {
  async render({ profiel: p }) {
    const bronnen = await laadBronnen();
    return {
      titel: 'Visie',
      html: html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Visie</p>
          <h1>Van schoolplan naar les</h1>
          <p class="lead">Uniekind vertaalt de visie van ${p.school.naam} naar keuzes in elke les. Hieronder lees je hoe.</p>
        </div></section>
        <main class="wrap">
          <section class="sectie">
            <p class="citaat">“${p.motto.tekst}”</p>
            <div class="lees">
              <p>${p.motto.herkomst}. ${p.motto.toelichting}</p>
              <p><b>In elke les:</b> ${p.motto.inDeLes}</p>
            </div>
          </section>

          ${p.koers ? html`
          <section class="sectie">
            <h2>${p.koers.thema}</h2>
            <p class="citaat">${p.koers.citaat}</p>
            <p class="lees">${p.koers.toelichting} Kernwaarden: ${p.kernwaarden.join(', ')}.</p>
          </section>` : ''}

          <section class="sectie">
            <h2>Vier pijlers</h2>
            <div class="pijlers">
              ${p.pijlers.map((pi, n) => html`
                <div class="pijler">
                  <span class="nr">Pijler ${n + 1}</span>
                  <h3>${pi.naam}</h3>
                  <p>${pi.omschrijving}</p>
                  ${pi.inDeLes ? html`<p class="doet"><b>In Uniekind:</b> ${pi.inDeLes}</p>` : ''}
                </div>`)}
            </div>
          </section>

          <section class="sectie">
            <h2>Leidende principes en wat Uniekind ermee doet</h2>
            <div class="tabelvak"><table>
              <thead><tr><th scope="col">Schoolplan</th><th scope="col">Principe</th><th scope="col">Wat Uniekind ermee doet</th></tr></thead>
              <tbody>${p.principes.map((pr) => html`<tr><td style="white-space:nowrap">§ ${pr.paragraaf}</td><td><b>${pr.naam}</b>${pr.schoolplan ? html`<br><span style="color:var(--muted)">${pr.schoolplan}</span>` : ''}</td><td>${pr.uniekind}</td></tr>`)}</tbody>
            </table></div>
          </section>

          ${p.leerstijl ? html`
          <section class="sectie">
            <h2>Over ‘${p.leerstijl.schoolplanTerm}’: keuze in aanpak en verwerking</h2>
            <p class="lees">${p.leerstijl.uitleg}</p>
            <ul class="bronnen">${p.leerstijl.bronnen.map((b) => bronnen[b] ? html`<li>${bronnen[b].auteur} (${bronnen[b].jaar}). <i>${bronnen[b].titel}</i>.</li>` : '')}</ul>
          </section>` : ''}

          ${p.burgerschap ? html`
          <section class="sectie">
            <h2>Burgerschap</h2>
            <p class="lees">${p.burgerschap.toelichting}</p>
            <div class="pijlers">${p.burgerschap.kernwaarden.map((k) => html`<div class="pijler"><h3>${k.naam}</h3><p>${k.omschrijving}</p></div>`)}</div>
          </section>` : ''}

          ${p.speerpunten ? html`
          <section class="sectie">
            <h2>Speerpunten ${p.speerpunten.schooljaar}</h2>
            <ul class="lees">${p.speerpunten.items.map((s) => html`<li>${s}</li>`)}</ul>
            <p class="lees">${p.speerpunten.uniekind}</p>
          </section>` : ''}
        </main>`
    };
  }
};
