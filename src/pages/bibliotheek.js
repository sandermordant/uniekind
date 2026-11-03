import { html, $, $$ } from '../util/html.js';
import { laadIndex } from '../data/laden.js';
import { CATEGORIE, LESFASE, GROEPSVORM, RUIMTE, DIFFERENTIATIE, ONDERSTEUNING, INSTAP, duurTekst } from '../data/labels.js';

// Filterstand blijft bewaard zolang de pagina open is.
const staat = {
  zoek: '', categorie: new Set(), lesfase: new Set(), ruimte: new Set(), groepsvorm: new Set(),
  differentiatie: new Set(), ondersteuning: new Set(), instap: new Set(), maxDuur: '', beginHier: false
};

function past(i) {
  if (staat.zoek) {
    const t = `${i.naam} ${i.alias.join(' ')} ${i.kort}`.toLowerCase();
    if (!staat.zoek.toLowerCase().split(/\s+/).every((w) => t.includes(w))) return false;
  }
  if (staat.categorie.size && !staat.categorie.has(i.categorie)) return false;
  if (staat.lesfase.size && !i.lesfase.some((f) => staat.lesfase.has(f))) return false;
  if (staat.ruimte.size && ![...staat.ruimte].every((r) => i.ruimte[r])) return false;
  if (staat.groepsvorm.size && !i.groepsvorm.some((g) => staat.groepsvorm.has(g))) return false;
  if (staat.differentiatie.size && !i.differentiatie.some((d) => staat.differentiatie.has(d))) return false;
  if (staat.ondersteuning.size && ![...staat.ondersteuning].every((o) => i.ondersteuning[o] === 'goed')) return false;
  if (staat.instap.size && !staat.instap.has(String(i.instapniveau))) return false;
  if (staat.maxDuur && i.duur.min > Number(staat.maxDuur)) return false;
  if (staat.beginHier && !i.beginHier) return false;
  return true;
}

const vinkjes = (naam, opties) => html`
  <fieldset>
    <legend>${naam[1]}</legend>
    ${Object.entries(opties).map(([k, v]) => html`
      <label><input type="checkbox" name="${naam[0]}" value="${k}" ${staat[naam[0]].has(k) ? 'checked' : ''}> ${v}</label>`)}
  </fieldset>`;

function kaart(i, profiel) {
  const kleur = `var(--huis-${profiel.huisstijl.categoriekleur?.[i.categorie] ?? 'hoofd'})`;
  return html`
    <a class="kaart" href="#werkvorm-${i.id}">
      <div class="chips"><span class="chip" style="--c:${kleur}"><span class="stip"></span>${CATEGORIE[i.categorie]}</span>${i.beginHier ? html`<span class="chip">Begin hier</span>` : ''}</div>
      <h3>${i.naam}</h3>
      <p>${i.kort}</p>
      <div class="meta">
        <span><b>${duurTekst(i.duur)}</b></span>
        <span>${i.groepsvorm.map((g) => GROEPSVORM[g]).join(', ')}</span>
        <span>${INSTAP[i.instapniveau]}</span>
      </div>
    </a>`;
}

export default {
  async render({ profiel }) {
    const index = await laadIndex();
    try {
      const c = sessionStorage.getItem('uniekind:bieb-categorie');
      if (c) { staat.categorie = new Set([c]); sessionStorage.removeItem('uniekind:bieb-categorie'); }
    } catch { /* geen opslag */ }

    const ruimte = { ...RUIMTE };
    for (const r of profiel.ruimtes) if (ruimte[r.id]) ruimte[r.id] = r.kort.charAt(0).toUpperCase() + r.kort.slice(1);

    return {
      titel: 'Werkvormen',
      html: html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Werkvormenbibliotheek</p>
          <h1>Alle werkvormen</h1>
          <p class="lead">Zoek op naam of filter op lesfase, ruimte, duur of wat je klas nodig heeft. Elke werkvorm heeft een stappenplan dat je morgen kunt gebruiken.</p>
        </div></section>
        <main class="wrap">
          <div class="bieb">
            <form class="filters" id="filters" aria-label="Filters">
              <div class="veld">
                <label for="zoek">Zoeken</label>
                <input type="search" id="zoek" name="zoek" placeholder="Bijv. wisbordjes, check, plein" value="${staat.zoek}">
              </div>
              <fieldset>
                <legend>Snel</legend>
                <label><input type="checkbox" id="beginHier" name="beginHier" ${staat.beginHier ? 'checked' : ''}> Alleen ‘Begin hier’</label>
              </fieldset>
              ${vinkjes(['categorie', 'Soort'], CATEGORIE)}
              ${vinkjes(['lesfase', 'Lesfase'], LESFASE)}
              <div class="veld">
                <label for="maxDuur">Past in (minuten)</label>
                <select id="maxDuur" name="maxDuur">
                  ${['', '3', '5', '10', '15', '20', '30', '50'].map((d) => html`<option value="${d}" ${staat.maxDuur === d ? 'selected' : ''}>${d ? `${d} minuten of minder` : 'Elke duur'}</option>`)}
                </select>
              </div>
              ${vinkjes(['ruimte', 'Werkt in'], ruimte)}
              ${vinkjes(['groepsvorm', 'Groepsvorm'], GROEPSVORM)}
              ${vinkjes(['instap', 'Instapniveau'], INSTAP)}
              ${vinkjes(['differentiatie', 'Differentiatievorm'], DIFFERENTIATIE)}
              ${vinkjes(['ondersteuning', 'Past goed bij'], ONDERSTEUNING)}
              <button type="button" class="knop secundair klein" id="wisFilters">Filters wissen</button>
            </form>
            <div>
              <div class="resultaatkop">
                <p id="aantal" aria-live="polite"></p>
                <button type="button" class="knop secundair klein filterknop" id="filterknop" aria-controls="filters" aria-expanded="false">Filters</button>
              </div>
              <div class="raster" id="resultaten"></div>
              <div class="sectie">
                <details class="uitleg">
                  <summary>Goed om te weten: convergent en divergent differentiëren</summary>
                  <p><b>Convergent</b> is de standaard in Uniekind: iedereen werkt aan hetzelfde lesdoel, met meer of minder steun. Zo blijft de hele klas bij elkaar en worden de verschillen niet groter.</p>
                  <p><b>Divergent</b> betekent dat leerlingen aan verschillende doelen werken. Uniekind gebruikt dat alleen voor verdieping: wie het lesdoel al beheerst, gaat verder dan het doel.</p>
                </details>
              </div>
            </div>
          </div>
        </main>`,
      na(root) {
        const form = $('#filters', root);
        form.addEventListener('submit', (e) => e.preventDefault());
        const toon = () => {
          const lijst = index.items.filter(past);
          $('#aantal', root).textContent = `${lijst.length} van ${index.items.length} werkvormen`;
          $('#resultaten', root).innerHTML = lijst.length
            ? lijst.map((i) => String(kaart(i, profiel))).join('')
            : '<p class="leeg">Geen werkvormen gevonden met deze filters. Haal een paar vinkjes weg.</p>';
        };
        form.addEventListener('input', (e) => {
          const t = e.target;
          if (t.name === 'zoek') staat.zoek = t.value.trim();
          else if (t.name === 'maxDuur') staat.maxDuur = t.value;
          else if (t.name === 'beginHier') staat.beginHier = t.checked;
          else if (staat[t.name] instanceof Set) t.checked ? staat[t.name].add(t.value) : staat[t.name].delete(t.value);
          toon();
        });
        $('#wisFilters', root).addEventListener('click', () => {
          for (const k of Object.keys(staat)) staat[k] = staat[k] instanceof Set ? new Set() : (typeof staat[k] === 'boolean' ? false : '');
          for (const el of $$('input', form)) el.type === 'checkbox' ? (el.checked = false) : (el.value = '');
          $('#maxDuur', form).value = '';
          toon();
        });
        const fk = $('#filterknop', root);
        fk.addEventListener('click', () => {
          const open = form.classList.toggle('open');
          fk.setAttribute('aria-expanded', String(open));
        });
        toon();
      }
    };
  }
};
