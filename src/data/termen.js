// Namen van de ruimtes, uit het schoolprofiel. De code gebruikt vaste sleutels (M, L, plein, stilte);
// wat de docent leest, komt uit het profiel. Zonder profiel gelden de standaardnamen.
const STANDAARD = { M: 'M-lokaal', L: 'L-lokaal', plein: 'deelplein', stilte: 'stilteruimte' };
export const termen = { ...STANDAARD };

export function zetTermen(profiel) {
  Object.assign(termen, STANDAARD);
  for (const r of profiel?.ruimtes ?? []) {
    if (!(r.id in STANDAARD)) continue;
    const naam = r.id === 'plein' ? profiel.terminologie?.plein || r.kort : r.kort;
    if (naam) termen[r.id] = naam;
  }
}

export const groot = (s) => s.charAt(0).toUpperCase() + s.slice(1);
