import { html } from '../util/html.js';
import { laadIndex } from '../data/laden.js';
import { CATEGORIE } from '../data/labels.js';

export default {
  async render({ profiel }) {
    const index = await laadIndex();
    const kleur = (c) => `var(--huis-${profiel.huisstijl.categoriekleur?.[c] ?? 'hoofd'})`;
    return {
      titel: '',
      html: html`
        <section class="band">
          <div class="wrap">
            <p class="eyebrow">${profiel.school.volledigeNaam}</p>
            <h1 class="motto-citaat">“${profiel.motto.tekst}”</h1>
            <p class="lead">${profiel.uniekind.kernbelofte}</p>
            <div class="knoppen">
              <a class="knop" href="#les-maken">Maak een les <span class="pijl" aria-hidden="true">→</span></a>
              <a class="knop secundair" href="#begin-hier">Begin hier: 10 werkvormen voor morgen</a>
            </div>
          </div>
        </section>
        <main class="wrap">
          <section class="sectie">
            <h2>Wat er al klaarligt</h2>
            <p class="lees">${index.items.length} werkvormen, elk met een stappenplan, wat je letterlijk zegt, valkuilen, voorbeelden uit verschillende vakken en een eerlijke onderbouwing.</p>
            <div class="tellers">
              ${index.categorieen.map((c) => html`
                <a class="teller" href="#bibliotheek" data-categorie="${c.categorie}">
                  <b style="color:${kleur(c.categorie)}">${c.aantal}</b><span>${CATEGORIE[c.categorie] ?? c.titel}</span>
                </a>`)}
            </div>
          </section>
          <section class="sectie">
            <h2>Hoe Uniekind werkt</h2>
            <div class="pijlers">
              <div class="pijler"><span class="nr">Jij</span><h3>Vertrekt vanuit je eigen kracht</h3><p>Leg je graag uit? Dan blijft de uitleg. Uniekind voegt er één stap aan toe, zoals een instructietafel of een pluskaart.</p></div>
              <div class="pijler"><span class="nr">De klas</span><h3>Krijgt wat ze nodig heeft</h3><p>Extra steun voor wie het nodig heeft, verdieping voor wie klaar is. Je vult alleen aantallen in, nooit namen.</p></div>
              <div class="pijler"><span class="nr">De school</span><h3>Zit er al in</h3><p>De M-lokalen, deelpleinen, lestijden en de visie van ${profiel.school.naam} zijn ingebouwd. Telefoons komen er niet aan te pas.</p></div>
            </div>
          </section>
          <section class="sectie">
            <p class="fase-melding"><b>Preview fase 5.</b> Lesgenerator, materiaal, digibord, export, foto-herkenning en AI-brug werken, met ${index.items.length} werkvormen, Hulp en Mijn profiel met reflectie na de les. In fase 6 volgen de laatste tests, de toegankelijkheidscontrole en de publicatie.</p>
          </section>
        </main>`,
      na(root) {
        for (const a of root.querySelectorAll('[data-categorie]')) {
          a.addEventListener('click', () => {
            try { sessionStorage.setItem('uniekind:bieb-categorie', a.dataset.categorie); } catch { /* geen opslag */ }
          });
        }
      }
    };
  }
};
