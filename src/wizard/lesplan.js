// Weergave van een gegenereerde les: varianten, tijdlijn, wie is waar, lesplan met aanpassen.
import { html } from '../util/html.js';
import { CATEGORIE, DENKNIVEAU } from '../data/labels.js';

export const ROL = {
  opening: 'Aandachtrichter', doel: 'Lesdoel en relevantie', voorkennis: 'Voorkennis activeren', startcheck: 'Startcheck',
  instructie: 'Instructie', check: 'Check op begrip', basis: 'Verwerken', steun: 'Steun', verdieping: 'Verdieping',
  zelfstandig: 'Zelfstandig verwerken', zelfinstructie: 'Uitleg op papier', clip: 'Kennisclip', startopdracht: 'Startopdracht',
  voorbereiding: 'Voorbereiden', beweeg: 'Beweegmoment', 'beweeg-zelf': 'Korte pauze', zelfcheck: 'Zelfcheck', afsluiting: 'Afsluiting', stilte: 'Stilteroute'
};
const BEGELEIDING = { docent: 'bij jou', zelfstandig: 'zelfstandig', 'op afstand': 'zelfstandig, jij houdt toezicht', oa: 'met de onderwijsassistent' };

export const plekNaam = (les, plek) => (plek === 'lokaal' ? (les.ruimte === 'M' ? 'M-lokaal' : les.ruimte === 'L' ? 'L-lokaal' : 'Lokaal') : plek === 'plein' ? 'Deelplein' : 'Stilteruimte');
export const tijd = (f) => `${f.start}–${f.start + f.duur} min`;

/* ── Tijdlijn: één rij per groep, kleur per plek ── */
export function tijdlijn(les, o = {}) {
  const totaal = Math.max(les.lesduur, les.fases.reduce((t, f) => t + f.duur, 0));
  const ticks = [];
  for (let m = 0; m <= totaal; m += totaal > 60 ? 20 : 10) ticks.push(m);
  return html`
    <div class="tijdlijn ${o.klein ? 'klein' : ''}" role="img" aria-label="Tijdlijn: ${les.groepen.map((g) => g.naam).join(', ')}">
      ${les.groepen.map((g) => html`
        <div class="tl-rij">
          <span class="tl-groep">${g.naam.split(' · ')[0]}${o.klein ? '' : html` <small>${g.aantal} lln</small>`}</span>
          <div class="tl-balk">
            ${les.fases.map((f) => {
              const b = f.blokken.find((x) => x.groepen.includes(g.id));
              if (!b) return html`<span class="tl-seg leeg" style="width:${(f.duur / totaal) * 100}%"></span>`;
              return html`<span class="tl-seg" data-plek="${b.plek}" style="width:${(f.duur / totaal) * 100}%" title="${f.start}-${f.start + f.duur} min · ${plekNaam(les, b.plek)} · ${ROL[b.rol] ?? b.rol}${b.werkvorm ? ': ' + b.werkvorm.naam : ''}">${o.klein ? '' : html`<span>${ROL[b.rol] ?? b.rol}</span>`}</span>`;
            })}
          </div>
        </div>`)}
      <div class="tl-rij tl-as" aria-hidden="true"><span class="tl-groep"></span><div class="tl-balk">${ticks.map((m) => html`<span style="left:${(m / totaal) * 100}%">${m}</span>`)}</div></div>
      <div class="tl-legenda">${[...new Set(les.fases.flatMap((f) => f.blokken.map((b) => b.plek)))].map((p) => html`<span><i data-plek="${p}"></i>${plekNaam(les, p)}</span>`)}</div>
    </div>`;
}

/* ── Wie is waar, wanneer ── */
export function wieWaar(les) {
  const plekken = [...new Set(les.fases.flatMap((f) => f.blokken.map((b) => b.plek)))];
  const groepNaam = (id) => les.groepen.find((g) => g.id === id)?.naam.split(' · ')[0] ?? id;
  return html`<div class="tabelvak"><table class="wiewaar">
    <thead><tr><th scope="col">Tijd</th>${plekken.map((p) => html`<th scope="col">${plekNaam(les, p)}</th>`)}</tr></thead>
    <tbody>${les.fases.map((f) => html`<tr>
      <th scope="row" class="tabnum">${tijd(f)}</th>
      ${plekken.map((p) => {
        const bl = f.blokken.filter((b) => b.plek === p);
        return html`<td>${bl.map((b) => html`<div><b>${b.groepen.map(groepNaam).join(' + ')}</b> (${b.aantal}): ${ROL[b.rol] ?? b.rol}${b.werkvorm ? html` · ${b.werkvorm.naam}` : ''}</div>`)}</td>`;
      })}
    </tr>`)}</tbody></table></div>`;
}

/* ── Stap 5: drie varianten ── */
export function varianten(lessen) {
  return html`<div class="varianten">${lessen.map((les, i) => {
    const fout = les.controles.filter((c) => !c.ok).length;
    return html`<article class="variant ${i === 0 ? 'eerst' : ''}">
      <header>
        <p class="eyebrow">${i === 0 ? 'Jouw keuze · ' : ''}Stand ${les.stand}</p>
        <h3>${les.standNaam}</h3>
        <p class="opzet"><b>${les.opzetNaam}.</b> ${les.opzetKort}</p>
      </header>
      ${tijdlijn(les, { klein: true })}
      <ol class="variant-fasen">${les.fases.map((f) => html`<li><span class="tabnum">${f.duur}′</span> ${f.titel}${f.blokken.some((b) => b.werkvorm) ? html`: <i>${[...new Set(f.blokken.map((b) => b.werkvorm?.naam).filter(Boolean))].join(' / ')}</i>` : ''}</li>`)}</ol>
      <p class="waarom">${les.waarom}</p>
      <p class="controle-kort ${fout ? 'let' : 'ok'}">${fout ? `${fout} aandachtspunt${fout > 1 ? 'en' : ''}` : 'Voldoet aan alle eisen'}</p>
      <button type="button" class="knop ${i === 0 ? '' : 'secundair'}" data-actie="kies-variant" data-stand="${les.stand}">Kies deze en pas aan</button>
    </article>`;
  })}</div>`;
}

/* ── Stap 6: lesplan met aanpassen ── */
function blokWeergave(les, f, b, items, ctx) {
  const it = b.werkvorm ? items.get(b.werkvorm.id) : null;
  const groepNaam = (id) => les.groepen.find((g) => g.id === id)?.naam ?? id;
  const kleur = it ? `var(--huis-${ctx.profiel.huisstijl.categoriekleur?.[it.categorie] ?? 'hoofd'})` : 'var(--line)';
  return html`<div class="lesblok" data-plek="${b.plek}">
    <div class="wie">
      ${les.groepen.length > 1 ? b.groepen.map((g) => html`<span class="chip">${groepNaam(g)}</span>`) : ''}
      <span class="plek" data-plek="${b.plek}">${plekNaam(les, b.plek)}</span>
      <span class="begeleiding">${BEGELEIDING[b.begeleiding] ?? b.begeleiding} · ${b.aantal} lln</span>
    </div>
    ${b.rol === 'doel' ? doelWeergave(les) : ''}
    ${b.tekst ? html`<p>${b.tekst}</p>` : ''}
    ${it ? html`
      <div class="wat">
        <span class="chip" style="--c:${kleur}"><span class="stip"></span>${CATEGORIE[it.categorie]}</span>
        <h4>${it.naam}${b.vervolg ? html` <small>(loopt door)</small>` : ''}${b.vastgezet ? html` <small class="vast">vastgezet</small>` : ''}</h4>
        <p class="kort">${it.kort}</p>
        ${!b.vervolg ? html`<p class="startzin-klein"><b>Je zegt:</b> ${it.startzin}</p>` : ''}
        ${!b.vervolg && it.alsDan?.length && ['check', 'startcheck', 'tussencheck'].includes(f.type) ? html`
          <div class="tabelvak alsdan"><table><thead><tr><th scope="col">Als</th><th scope="col">Dan</th></tr></thead>
          <tbody>${it.alsDan.map((r) => html`<tr><td>${r.als}</td><td>${r.dan}</td></tr>`)}</tbody></table></div>` : ''}
      </div>
      ${!b.vervolg && b.sleutel ? html`
        <div class="blokacties niet-printen">
          ${b.alternatieven.length ? html`<button type="button" class="knop secundair klein" data-actie="andere" data-sleutel="${b.sleutel}">Andere suggestie</button>` : ''}
          ${b.alternatieven.length ? html`<label class="visueel-verborgen" for="alt-${b.sleutel}">Kies een alternatief</label>
          <select id="alt-${b.sleutel}" class="alt" data-actie="kies-alt" data-sleutel="${b.sleutel}">
            <option value="">Ook passend…</option>
            ${b.alternatieven.map((id) => html`<option value="${id}">${items.get(id)?.naam ?? id}</option>`)}
          </select>` : ''}
          <button type="button" class="knop secundair klein" data-actie="vastzetten" data-sleutel="${b.sleutel}" data-id="${it.id}" aria-pressed="${b.vastgezet}">${b.vastgezet ? 'Losmaken' : 'Zet vast'}</button>
          <a class="knop secundair klein" href="#werkvorm-${it.id}" target="_blank" rel="noopener">Stappenplan</a>
        </div>
        ${b.uitleg ? html`<details class="waaromdeze"><summary>Waarom deze?</summary>
          ${b.uitleg.koppeling ? html`<p>${b.uitleg.koppeling}</p>` : ''}
          <p>${b.uitleg.visie}</p>
          <p class="onderbouwing">${b.uitleg.onderbouwing} <b>${b.uitleg.bewijs}.</b></p>
        </details>` : ''}` : ''}` : ''}
  </div>`;
}

function doelWeergave(les) {
  const d = les.doel;
  return html`<div class="doelblok">
    ${d.lesdoelen.length ? html`<ul class="lesdoelen">${d.lesdoelen.map((x) => html`<li>${x.tekst} <span class="doelcheck ok">${DENKNIVEAU[x.niveau] ?? x.niveau}</span></li>`)}</ul>` : html`<p class="invulveld">Vul hier je lesdoel in.</p>`}
    <p><b>Relevantie-haak:</b> ${d.relevantie.vraag}</p>
    ${d.relevantie.regionaal ? html`<p><b>Idee uit de regio:</b> ${d.relevantie.regionaal}</p>` : ''}
    <p class="invulveld">${d.relevantie.invulveld}</p>
  </div>`;
}

export function lesplan(les, items, ctx, alleLessen = []) {
  const totaal = les.fases.reduce((t, f) => t + f.duur, 0);
  const verschil = totaal - les.lesduur;
  const fouten = les.controles.filter((c) => !c.ok);
  const sp = les.splitsing;
  const opties = sp.opties.filter((o) => o.id !== 'routes' || sp.overflow === 0);
  return html`
    <div class="totaalbalk ${verschil ? 'let' : 'ok'}" role="status">
      <span><b class="tabnum">${totaal}</b> van ${les.lesduur} minuten${verschil ? ` · ${Math.abs(verschil)} minuten te ${verschil > 0 ? 'veel' : 'weinig'}` : ''}</span>
      <span>${fouten.length ? `${fouten.length} aandachtspunt${fouten.length > 1 ? 'en' : ''}` : 'Voldoet aan alle eisen'}</span>
    </div>

    <section class="sectie">
      <h2>${les.doel.onderwerp || 'Je les'} <small class="sub">${les.standNaam} · ${les.opzetNaam}</small></h2>
      <p class="lees">${les.waarom}</p>
      ${les.tips.map((t) => html`<p class="melding">${t}</p>`)}
    </section>

    ${sp.nodig && opties.length ? html`
    <section class="sectie splitsplanner">
      <h3>Splitsplanner</h3>
      ${sp.reden ? html`<p class="lees">${sp.reden}</p>` : ''}
      <div class="splitopties" role="radiogroup" aria-label="Kies hoe je de klas verdeelt">
        ${opties.map((o) => html`<label class="splitoptie ${les.opzet === o.id ? 'aan' : ''} ${o.haalbaar ? '' : 'nee'}">
          <input type="radio" name="splitsing" data-actie="splitsing" value="${o.id}" ${les.opzet === o.id ? 'checked' : ''} ${o.haalbaar ? '' : 'disabled'}>
          <b>${o.naam}</b><span>${o.kort}</span>${o.haalbaar ? '' : html`<em>${o.waaromNiet}</em>`}
        </label>`)}
      </div>
    </section>` : ''}

    <section class="sectie">
      <h3>Wie is waar, wanneer</h3>
      ${tijdlijn(les)}
      <details class="uitleg"><summary>Als tabel</summary>${wieWaar(les)}</details>
    </section>

    <section class="sectie">
      <h3>Lesverloop <small class="sub">Versleep of gebruik de pijltjes; pas de minuten aan.</small></h3>
      <ol class="fasen" id="fasen">
        ${les.fases.map((f, i) => html`<li class="fase" data-fase="${f.id}" draggable="true">
          <div class="fase-kop">
            <span class="greep niet-printen" aria-hidden="true">⋮⋮</span>
            <span class="tijd tabnum">${tijd(f)}</span>
            <h4>${f.titel}</h4>
            <label class="duur niet-printen"><span class="visueel-verborgen">Minuten voor ${f.titel}</span><input type="number" min="1" max="100" value="${f.duur}" data-actie="duur" data-fase="${f.id}"> min</label>
            <span class="pijlen niet-printen">
              <button type="button" class="knop secundair klein" data-actie="omhoog" data-fase="${f.id}" ${i === 0 ? 'disabled' : ''} aria-label="${f.titel} omhoog">↑</button>
              <button type="button" class="knop secundair klein" data-actie="omlaag" data-fase="${f.id}" ${i === les.fases.length - 1 ? 'disabled' : ''} aria-label="${f.titel} omlaag">↓</button>
            </span>
          </div>
          ${f.organisatie ? html`<p class="organisatie">Organisatie: <a href="#werkvorm-${f.organisatie.id}" target="_blank" rel="noopener">${f.organisatie.naam}</a></p>` : ''}
          ${f.extra?.length ? f.extra.map((e) => html`<div class="lesblok extra"><p><b>Differentiatie-element:</b> <a href="#werkvorm-${e.id}" target="_blank" rel="noopener">${e.naam}</a>. ${e.uitleg?.koppeling ?? ''}</p></div>`) : ''}
          <div class="blokken">${f.blokken.map((b) => blokWeergave(les, f, b, items, ctx))}</div>
        </li>`)}
      </ol>
      <p class="hulp">${les.vooruitblik}</p>
    </section>

    <section class="sectie twee-kol">
      <div>
        <h3>Controle</h3>
        <ul class="controles">${les.controles.map((c) => html`<li class="${c.ok ? 'ok' : 'let'}"><span aria-hidden="true">${c.ok ? '✓' : '!'}</span> ${c.eis}${c.toelichting && !c.ok ? html`<small>${c.toelichting}</small>` : ''}</li>`)}</ul>
      </div>
      <div>
        <h3>Differentiatie in deze les</h3>
        <ul>${les.differentiatie.map((d) => html`<li><a href="#werkvorm-${d.id}" target="_blank" rel="noopener">${d.naam}</a></li>`)}</ul>
        ${les.groepen.length > 1 ? html`<p>${les.groepen.map((g) => `${g.naam}: ${g.aantal}`).join(' · ')}${les.verdelingGeschat ? ' (geschat; de startcheck bepaalt de echte verdeling)' : ''}</p>` : ''}
        ${les.oa ? html`<p><b>Onderwijsassistent:</b> ${les.oa.rol}</p>` : ''}
        ${les.routines.length ? html`<h3 style="margin-top:1rem">Routines die helpen</h3><ul>${les.routines.map((r) => html`<li><a href="#werkvorm-${r}" target="_blank" rel="noopener">${items.get(r)?.naam ?? r}</a></li>`)}</ul>` : ''}
      </div>
    </section>`;
}
