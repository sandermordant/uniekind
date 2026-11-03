import { html } from '../util/html.js';
import { laadIndex, laadWerkvorm } from '../data/laden.js';
import { duurTekst, CATEGORIE, VOORBEREIDING } from '../data/labels.js';

export default {
  async render() {
    const index = await laadIndex();
    const ids = index.items.filter((i) => i.beginHier).sort((a, b) => a.beginHier - b.beginHier).map((i) => i.id);
    const items = await Promise.all(ids.map(laadWerkvorm));
    return {
      titel: 'Begin hier',
      html: html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Instapset</p>
          <h1>Begin hier: 10 werkvormen voor morgen</h1>
          <p class="lead">Je hoeft je les niet om te gooien. Kies er één, probeer hem een paar keer, en kijk wat het oplevert. Elke uitleg lees je in een minuut.</p>
        </div></section>
        <main class="wrap">
          <div class="instap">
            ${items.map((w) => html`
              <article>
                <h3>${w.naam}</h3>
                <p class="meta"><span>${CATEGORIE[w.categorie]}</span><span>${duurTekst(w.duur)}</span><span>${VOORBEREIDING[w.voorbereiding]}</span></p>
                <p class="uitleg-tekst">${w.beginHier.uitleg}</p>
                <p><a href="#werkvorm-${w.id}">Stappenplan en voorbeelden <span aria-hidden="true">→</span></a></p>
              </article>`)}
          </div>
        </main>`
    };
  }
};
