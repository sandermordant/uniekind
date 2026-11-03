// Veilige toegang tot browseropslag. Uniekind werkt ook als opslag geblokkeerd is
// (privévenster, strenge instellingen): dan wordt er gewoon niets onthouden.
// Hier komen nooit leerlinggegevens in: alleen docentprofiel, voorkeuren en concepten.

const VOORVOEGSEL = 'uniekind:';

export function lees(sleutel, standaard = null) {
  try {
    const w = window.localStorage.getItem(VOORVOEGSEL + sleutel);
    return w == null ? standaard : JSON.parse(w);
  } catch {
    return standaard;
  }
}

export function schrijf(sleutel, waarde) {
  try {
    window.localStorage.setItem(VOORVOEGSEL + sleutel, JSON.stringify(waarde));
    return true;
  } catch {
    return false;
  }
}

export function wis(sleutel) {
  try {
    window.localStorage.removeItem(VOORVOEGSEL + sleutel);
  } catch { /* niets te doen */ }
}
