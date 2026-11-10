// Bewaard materiaal: alle links die je bij onderwerpen bewaarde, en die van je sectie.
// Delen gaat met een bestand: exporteren, doorsturen, en een collega importeert het (of de beheerder zet het
// in public/data/materiaal-sectie.json, dan ziet iedereen het). Er gaat niets via een server.
import { html } from '../util/html.js';
import { download, bestandsnaam } from '../export/delen.js';
import { mijnMateriaal, verwijderLink, materiaalBestand, importeerMateriaal, laadSectieMateriaal } from '../examen/materiaalpaneel.js';

const groepeer = (lijst) => {
  const m = new Map();
  for (const x of lijst) {
    const k = `${x.vak}|${x.sleutel}`;
    if (!m.has(k)) m.set(k, { vak: x.vak, code: x.code, onderwerp: x.onderwerp, sleutel: x.sleutel, links: [] });
    m.get(k).links.push(x);
  }
  return [...m.values()].sort((a, b) => a.vak.localeCompare(b.vak, 'nl') || a.onderwerp.localeCompare(b.onderwerp, 'nl'));
};

export default {
  async render() {
    const sectie = await laadSectieMateriaal();
    let melding = '';
    const pagina = () => {
      const eigen = mijnMateriaal();
      const lijstHtml = (groepen, wegKnop) => html`<ul class="bm-lijst">${groepen.map((g) => html`<li>
        <p><span class="chip">${g.vak || 'vak onbekend'}</span> ${g.code ? html`<b>${g.code}</b> ` : ''}${g.onderwerp}</p>
        <ul class="om-links">${g.links.map((l) => html`<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.titel}</a>${wegKnop ? html` <button type="button" class="knop secundair klein" data-actie="bm-weg" data-sleutel="${l.sleutel}" data-url="${l.url}" aria-label="Verwijder ${l.titel}">×</button>` : ''}</li>`)}</ul>
      </li>`)}</ul>`;
      return html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Stof en materiaal</p>
          <h1>Bewaard materiaal</h1>
          <p class="lead">Video's, sites en opgaven die jij en je sectie bij onderwerpen bewaarden. Je bewaart iets via de knop Materiaal bij een onderwerp, in je werkplek of bij Stof en materiaal.</p>
          <div class="inhoudsopgave"><a class="knop secundair klein" href="#examenstof">Zoeken en bekijken</a><a class="knop secundair klein" href="#examenopgave">Opgave op niveau</a><a class="knop klein" href="#materiaal" aria-current="page">Bewaard materiaal</a></div>
        </div></section>
        <main class="wrap">
          ${melding ? html`<p class="melding" role="status">${melding}</p>` : ''}
          <section class="sectie">
            <h2>Van jou (${eigen.length})</h2>
            ${eigen.length ? lijstHtml(groepeer(eigen), true) : html`<p class="lees">Nog niets bewaard. Open in je werkplek bij een onderwerp het materiaal en zet een goede link bij "Bewaard bij dit onderwerp".</p>`}
          </section>
          <section class="sectie">
            <h2>Delen met je sectie</h2>
            <p class="lees">Uniekind heeft geen server: delen gaat met een bestand. Zo bouw je samen een materiaalbank per onderwerp.</p>
            <ol class="lees">
              <li>Klik op <b>Exporteer</b>. Je krijgt een klein bestand met alleen titels en links, geen gegevens over leerlingen.</li>
              <li>Stuur het naar je sectiegenoten. Zij klikken op <b>Importeer</b>; dubbele links worden overgeslagen.</li>
              <li>Wil je dat iedereen het ziet? Vraag de beheerder van Uniekind het bestand in <code>public/data/materiaal-sectie.json</code> te zetten. Dan staat het bij elk onderwerp onder "Van je sectie".</li>
            </ol>
            <div class="knoppen">
              <button type="button" class="knop secundair klein" data-actie="bm-export" ${eigen.length ? '' : 'disabled'}>Exporteer (${eigen.length})</button>
              <label class="knop secundair klein bestandknop">Importeer<input type="file" accept=".json,application/json" data-actie="bm-import" class="visueel-verborgen"></label>
            </div>
          </section>
          <section class="sectie">
            <h2>Van je sectie (${sectie.length})</h2>
            ${sectie.length ? lijstHtml(groepeer(sectie), false) : html`<p class="lees">De school heeft nog geen gedeeld materiaal klaargezet.</p>`}
          </section>
        </main>`;
    };
    return {
      titel: 'Bewaard materiaal',
      html: pagina(),
      na(root) {
        const teken = () => { root.innerHTML = String(pagina()); };
        root.addEventListener('click', (e) => {
          const k = e.target.closest('[data-actie]');
          if (!k) return;
          if (k.dataset.actie === 'bm-weg') { verwijderLink(k.dataset.sleutel, k.dataset.url); melding = 'Verwijderd.'; teken(); }
          if (k.dataset.actie === 'bm-export') {
            download(new Blob([JSON.stringify(materiaalBestand(), null, 1)], { type: 'application/json' }), bestandsnaam('uniekind-materiaal', 'json'));
          }
        });
        root.addEventListener('change', async (e) => {
          const t = e.target;
          if (t.dataset.actie !== 'bm-import' || !t.files?.[0]) return;
          try {
            const n = importeerMateriaal(JSON.parse(await t.files[0].text()));
            melding = n ? `${n} ${n === 1 ? 'link' : 'links'} toegevoegd.` : 'Alles uit dit bestand had je al.';
          } catch (err) { melding = err instanceof SyntaxError ? 'Dit bestand kan Uniekind niet lezen.' : err.message; }
          teken();
        });
      }
    };
  }
};
