import { html } from '../util/html.js';
import { laadIndex } from '../data/laden.js';
import { CATEGORIE } from '../data/labels.js';

export default {
  async render({ profiel }) {
    const index = await laadIndex();
    // Examenjaren uit het profiel, zoals "vmbo 4, havo 5, vwo 6"
    const eindNamen = [...new Map(profiel.afdelingen.map((a) => [`${a.niveau}`, `${a.niveau} ${Math.max(...a.leerjaren)}`])).values()].join(', ');
    const kleur = (c) => `var(--huis-${profiel.huisstijl.categoriekleur?.[c] ?? 'hoofd'})`;
    return {
      titel: '',
      html: html`
        <section class="band">
          <div class="wrap">
            <p class="eyebrow">${profiel.school.volledigeNaam}</p>
            <h1 class="motto-citaat">“${profiel.motto.tekst}”</h1>
            <p class="lead">${profiel.uniekind.kernbelofte}</p>
            <h2 class="keuze-kop">Voor welke klas bereid je voor?</h2>
            <div class="modus-keuze">
              <a class="modus-kaart" href="#examenklas">
                <b>Eindexamenklas</b>
                <span>${eindNamen}. Alle examenstof met de syllabus, opgaven op niveau en materiaal per onderwerp.</span>
              </a>
              <a class="modus-kaart" href="#klas">
                <b>Andere klassen</b>
                <span>Onderbouw en de jaren voor het examen. Kerndoelen, onderwerpen en lessen op maat.</span>
              </a>
            </div>
            <p class="klein-boven"><a href="#begin-hier">Of begin met 10 werkvormen voor morgen</a></p>
          </div>
        </section>
        <main class="wrap">
          <section class="sectie">
            <h2>Wat er al klaarligt</h2>
            <p class="lees">${index.items.length} werkvormen, elk met een stappenplan, wat je letterlijk zegt, valkuilen, voorbeelden uit verschillende vakken en een eerlijke onderbouwing.</p>
            <div class="tellers">
              ${index.categorieen.map((c) => html`
                <a class="teller" href="#bibliotheek" data-categorie="${c.categorie}">
                  <b style="color:color-mix(in srgb, ${kleur(c.categorie)} 55%, var(--fg))">${c.aantal}</b><span>${CATEGORIE[c.categorie] ?? c.titel}</span>
                </a>`)}
            </div>
          </section>
          <section class="sectie">
            <h2>Hoe Uniekind werkt</h2>
            <div class="pijlers">
              <div class="pijler"><span class="nr">Jij</span><h3>Vertrekt vanuit je eigen kracht</h3><p>Leg je graag uit? Dan blijft de uitleg. Uniekind voegt er één stap aan toe, zoals een instructietafel of een pluskaart.</p></div>
              <div class="pijler"><span class="nr">De klas</span><h3>Krijgt wat ze nodig heeft</h3><p>Extra steun voor wie het nodig heeft, verdieping voor wie klaar is. Je vult alleen aantallen in, nooit namen.</p></div>
              <div class="pijler"><span class="nr">De school</span><h3>Zit er al in</h3><p>De lokalen, lestijden, regels en de visie van ${profiel.school.naam} zijn ingebouwd${profiel.regels?.telefoon?.toegestaan === false ? '. Telefoons komen er niet aan te pas' : ''}.</p></div>
            </div>
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
