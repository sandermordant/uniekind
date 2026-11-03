// Harde filters: een werkvorm valt af als hij niet kan in deze situatie.
// Geeft { ok, reden } terug, zodat de interface kan uitleggen waarom iets niet wordt voorgesteld.

/**
 * @param item   werkvorm uit de kennisbank
 * @param slot   { type, duur }
 * @param ctx    context uit maakContext
 * @param plek   'lokaal' | 'plein' | 'stilte'
 * @param o      { heleKlas: boolean } — of de hele klas tegelijk deze werkvorm doet
 */
export function hardeFilter(item, slot, ctx, plek = 'lokaal', o = {}) {
  if (item.middelen?.telefoon !== false) return { ok: false, reden: 'vraagt een telefoon (nooit toegestaan)' };
  if (item.duur.min > slot.duur) return { ok: false, reden: `duurt minimaal ${item.duur.min} minuten; er is ${slot.duur}` };
  if (item.instapniveau > ctx.stand) return { ok: false, reden: `instapniveau ${item.instapniveau} ligt boven de gekozen stand` };
  if (item.vereist.onderwijsassistent && !ctx.oa) return { ok: false, reden: 'vraagt een onderwijsassistent' };
  if (item.vereist.plein && !ctx.pleinMogelijk) return { ok: false, reden: 'vraagt een deelplein (niet beschikbaar of geen toezicht)' };
  if (item.middelen.laptop === 'vereist') {
    if (ctx.laptops === 'geen') return { ok: false, reden: 'vraagt laptops, die er niet zijn' };
    if (ctx.laptops === 'deel' && o.heleKlas) return { ok: false, reden: 'vraagt laptops voor de hele klas' };
  }
  if (plek === 'plein' && !item.ruimte.plein) return { ok: false, reden: 'werkt niet op het plein' };
  if (plek === 'stilte' && !item.ruimte.stilte) return { ok: false, reden: 'werkt niet in de stilteruimte' };
  if (plek === 'lokaal') {
    if (ctx.ruimte === 'M' && !item.ruimte.M) return { ok: false, reden: 'werkt niet in een M-lokaal' };
    if (ctx.ruimte === 'L' && !item.ruimte.L) return { ok: false, reden: 'werkt niet in een L-lokaal' };
    if (ctx.ruimte === 'anders' && !item.ruimte.M && !item.ruimte.L) return { ok: false, reden: 'werkt niet in een lokaal' };
  }
  if (plek === 'plein' && ctx.ruimte !== 'M') return { ok: false, reden: 'geen plein bij dit lokaal' };
  return { ok: true, reden: '' };
}
