// Lesdoelen koppelen aan kerndoelen, eindtermen en de syllabus van SLO.
// De docent kiest een kader (voorgesteld op basis van vak, afdeling en leerjaar), zoekt en vinkt aan.
// Gekozen regels gaan mee in het lesplan, het materiaal, de AI-prompt, het lesbestand en Mijn lessen.
import { html } from '../util/html.js';
import { kadersVoor, vlak, SOORT_NAAM, isOnderbouw, isDoelzin, korteBegrippen } from '../data/kaders.js';

const kaderLabel = (k) => `${k.titel}${k.status !== 'geldend' ? ' (concept, nog niet geldend)' : ''}`;

/**
 * @param {object} p  { profiel, concept, kaders: { index, cache: Map(bestand → kader), laden: Set } }
 * Geeft HTML terug; als het gekozen kader nog niet geladen is, staat er "wordt geladen" en laadt les-maken het.
 */
export function eindtermenVeld({ profiel, concept, kaders }, { open = false } = {}) {
  const c = concept.invoer.context;
  const inh = concept.invoer.inhoud;
  const gekozen = inh.eindtermen ?? [];
  if (!kaders?.index) return html`<p class="hulp">De kerndoelen en eindtermen van SLO worden geladen…</p>`;
  const afdeling = profiel.afdelingen.find((a) => a.id === c.afdeling);
  const lijst = kadersVoor(kaders.index, { vak: c.vak, afdeling, leerjaar: c.leerjaar });
  const vakNaam = profiel.vakken.find((v) => v.id === c.vak)?.naam ?? c.vak;
  const staat = (concept.kader ??= {});
  const kader = lijst.find((k) => k.id === staat.id) ?? lijst[0];
  const data = kader ? kaders.cache.get(kader.id) : null;
  const zoek = String(staat.zoek ?? '').trim().toLowerCase();
  const regels = data ? vlak(data) : [];
  const isGekozen = (s) => gekozen.some((g) => g.sleutel === s);
  const treft = (r) => !zoek || r.tekst.toLowerCase().includes(zoek) || r.code.toLowerCase().includes(zoek);

  // Groepeer per bovenste niveau (domein of kerndoel), zodat een lange syllabus overzichtelijk blijft
  const groepen = [];
  for (const r of regels) {
    if (r.diepte === 0) groepen.push({ kop: r, rest: [] });
    else groepen.at(-1)?.rest.push(r);
  }
  // Toelichting en vakbegrippen staan buiten het label, zodat openklappen het vinkje niet omzet
  const vinkje = (r) => html`<div class="et-regel" style="--d:${r.diepte}">
    <label>
      <input type="checkbox" data-actie="et-vink" value="${r.sleutel}" ${isGekozen(r.sleutel) ? 'checked' : ''}>
      <span>${r.code ? html`<b>${r.code}</b> ` : ''}${r.kop ? html`<i>${r.kop}.</i> ` : ''}${r.tekst}${r.ce ? html` <span class="et-tag">CE</span>` : ''}${r.se && !r.ce ? html` <span class="et-tag">SE</span>` : ''}${r.d ? html` <span class="hulp">(${r.d})</span>` : ''}</span>
    </label>
    ${r.toel.length || r.begrippen.length ? html`<details class="et-extra"><summary>${[r.toel.length ? 'Toelichting' : '', r.begrippen.length ? 'vakbegrippen' : ''].filter(Boolean).join(' en ')}</summary>${r.toel.map((t) => html`<p>${t}</p>`)}${r.begrippen.length ? html`<p><b>Vakbegrippen:</b> ${r.begrippen.join(' · ')}</p>` : ''}</details>` : ''}
  </div>`;

  return html`
    <details class="eindtermen paneel" data-paneel="eindtermen" ${open || gekozen.length || staat.open ? 'open' : ''}>
      <summary>Kerndoelen en eindtermen (SLO) ${gekozen.length ? html`<span class="chip">${gekozen.length} gekoppeld</span>` : html`<span class="hulp">optioneel</span>`}</summary>
      <div class="paneel-inhoud">
        ${gekozen.length ? html`
          <ul class="et-gekozen">${gekozen.map((g) => html`<li>
            <span>${g.code ? html`<b>${g.code}</b> ` : ''}${g.tekst} <span class="hulp">${g.kaderTitel}</span></span>
            <span class="knoppen-klein">
              ${isDoelzin(g.tekst) ? html`<button type="button" class="knop secundair klein" data-actie="et-doel" data-sleutel="${g.sleutel}">Gebruik als lesdoel</button>` : ''}
              <button type="button" class="knop secundair klein" data-actie="et-weg" data-sleutel="${g.sleutel}" aria-label="Ontkoppel ${g.code}">×</button>
            </span></li>`)}</ul>` : html`<p class="hulp">Koppel je les aan de kerndoelen (onderbouw) of het examenprogramma en de syllabus (bovenbouw). Dan zie je later in Mijn profiel welke stof je al hebt behandeld.</p>`}
        ${lijst.length ? html`
          <div class="veldrij">
            <div class="veld"><label for="etKader">Kader voor ${vakNaam}</label>
              <select id="etKader" data-actie="et-kader">${['kerndoelen', 'leerdoelenkaart', 'examenprogramma', 'syllabus', 'keuzevakken', 'referentiekader'].map((soort) => {
                const ks = lijst.filter((k) => k.soort === soort);
                return ks.length ? html`<optgroup label="${SOORT_NAAM[soort]}">${ks.map((k) => html`<option value="${k.id}" ${k.id === kader?.id ? 'selected' : ''}>${kaderLabel(k)}</option>`)}</optgroup>` : '';
              })}</select>
              <span class="hulp">${isOnderbouw(afdeling, c.leerjaar) ? 'Onderbouw: de kerndoelen staan bovenaan.' : 'Bovenbouw: het examenprogramma en de syllabus staan bovenaan.'}</span>
            </div>
            <div class="veld"><label for="etZoek">Zoek in dit kader</label><input type="search" id="etZoek" data-actie="et-zoek" value="${staat.zoek ?? ''}" placeholder="Bijvoorbeeld: vraag, bron, grafiek"></div>
          </div>
          ${!data ? html`<p class="hulp" aria-live="polite">Het kader wordt geladen…</p>` : html`
          <div class="et-boom">
            ${groepen.filter((g) => treft(g.kop) || g.rest.some(treft)).map((g) => html`
              <details class="et-groep" ${zoek || g.rest.some((r) => isGekozen(r.sleutel)) || groepen.length === 1 ? 'open' : ''}>
                <summary>${g.kop.code && !g.kop.tekst.startsWith(g.kop.code) ? html`<b>${g.kop.code}</b> ` : ''}${g.kop.tekst}${g.rest.length ? html` <span class="hulp">(${g.rest.length})</span>` : ''}</summary>
                ${vinkje({ ...g.kop, diepte: 0 })}
                ${g.rest.filter((r) => !zoek || treft(r)).map(vinkje)}
              </details>`)}
            ${zoek && !regels.some(treft) ? html`<p class="hulp">Niets gevonden voor "${staat.zoek}".</p>` : ''}
          </div>
          <p class="hulp et-bron">Bron: ${kader.bron.naam}${kader.bron.examenjaar ? `, examenjaar ${kader.bron.examenjaar}` : ''}${kader.bron.ingang ? `, ${kader.bron.ingang}` : ''}. Open data van SLO (licentie MIT), versie ${kader.bron.versie ?? 'onbekend'}.${kader.bron.url ? html` <a href="${kader.bron.url}" target="_blank" rel="noopener noreferrer">Officiële tekst</a>` : ''}</p>`}` : html`<p class="hulp">Voor ${vakNaam} heeft SLO (nog) geen kerndoelen of examenprogramma in de open data. Je kunt de les gewoon maken zonder koppeling.</p>`}
      </div>
    </details>`;
}

/** Zoek een regel op aan de hand van de sleutel (kader-id:pad). */
export function regelBijSleutel(kaders, index, sleutel) {
  const [id] = sleutel.split(':');
  const k = index.kaders.find((x) => x.id === id);
  const data = k ? kaders.get(k.id) : null;
  if (!data) return null;
  const r = vlak(data).find((x) => x.sleutel === sleutel);
  return r ? { sleutel, kader: k.id, kaderTitel: k.titel, code: r.code, tekst: r.tekst, ...(r.begrippen.length ? { begrippen: korteBegrippen(r.begrippen).slice(0, 12) } : {}) } : null;
}
