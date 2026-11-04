// Tekstanalyse voor lesdoelen en kernbegrippen. Werkt zonder AI, met eenvoudige patronen.
// Wordt gebruikt bij geplakte tekst (fase 2) en bij OCR (fase 4).

// Herkenning van het denkniveau aan het werkwoord in het lesdoel (Bloom, herzien).
// Volgorde is belangrijk: hogere niveaus eerst, zodat "ontwerp een" niet als "maak" (toepassen) telt.
const PATRONEN = [
  ['creeren', /\b(ontwerp\w*|bedenk\w*|ontwikkel\w*|formuleer\w*|schrijf een|maak een (eigen|ontwerp|plan|product)|stel (een )?plan|plan(nen)? )/],
  ['evalueren', /\b(beoordeel\w*|beargumenteer\w*|onderbouw\w*|evalueer\w*|kritisch|kies(t)? en|geef je mening|waardeer\w*|bekritiseer\w*)/],
  ['analyseren', /\b(analyseer\w*|analyseren|verklaar\w*|verklaren|onderscheid\w*|leg\w* .{0,30}verband|verbanden leggen|vergelijk\w*|orden\w*|ontleed\w*|onderzoek\w*)/],
  ['toepassen', /\b(bereken\w*|gebruik\w*|los(sen)? .{0,20}op|oplossen|pas(sen)? .{0,20}toe|toepassen|voer\w* .{0,20}uit|uitvoeren|teken\w*|vervoeg\w*|vertaal\w*|meet|meten|lees .{0,20}af)/],
  ['begrijpen', /\b(leg\w* .{0,30}uit|uitleggen|uit te leggen|beschrijf\w*|beschrijven|samenvat\w*|vat .{0,20}samen|in eigen woorden|geef .{0,15}voorbeeld|herken\w* .{0,20}voorbeeld|interpreteer\w*)/],
  ['onthouden', /\b(noem\w*|opsom\w*|som .{0,20}op|benoem\w*|herken\w*|definieer\w*|geef de definitie|weet|ken\b|kent\b|onthoud\w*|leer\w* .{0,10}uit je hoofd)/]
];

const NIET_WAARNEEMBAAR = /\b(begrijp\w*|snap\w*|weet\b|weten\b|kent\b|kennen\b|ken\b|inzien|inzicht hebben|beseff\w*|besef\b|bewust\b|bekend (zijn )?met|leer\w* over)\b/;

export function herkenDenkniveau(doel) {
  const t = ` ${String(doel).toLowerCase()} `;
  for (const [niveau, re] of PATRONEN) if (re.test(t)) return niveau;
  return null;
}

export function controleerLesdoel(doel) {
  const t = String(doel ?? '').trim();
  const niveau = herkenDenkniveau(t);
  const nietWaarneembaar = NIET_WAARNEEMBAAR.test(t.toLowerCase());
  let tip = '';
  if (!t) tip = 'Vul een lesdoel in.';
  else if (nietWaarneembaar) tip = 'Dit doel kun je niet zien of horen. Probeer: "Je kunt uitleggen…", "Je kunt drie voorbeelden noemen…" of "Je kunt berekenen…".';
  else if (!niveau) tip = 'Begin met "Je kunt…" en een werkwoord dat je kunt waarnemen, zoals uitleggen, berekenen, vergelijken of ontwerpen.';
  return { tekst: t, niveau: nietWaarneembaar && niveau === 'onthouden' ? 'begrijpen' : niveau, waarneembaar: !!t && !nietWaarneembaar && !!niveau, tip };
}

/** Herken lesdoelen in een geplakte of herkende tekst. */
export function vindLesdoelen(tekst) {
  const ruw = String(tekst ?? '').split(/\r?\n/).filter((r) => r.trim());
  const doelen = [];
  let inBlok = false;
  for (const regel of ruw) {
    // Opsommingstekens worden door OCR soms als «, », o, e of * gelezen
    const opsomming = /^\s*([•\-–*·«»‣◦○●▪]|\d+[.)]|[oeO]\s(?=[A-Z]))\s*/.test(regel);
    let r = regel.replace(/^[\s•\-–*·«»‣◦○●▪\d.)]+/, '').trim();
    const begin = r.search(/(je kunt|je kan|ik kan|je leert)\b/i);
    if (begin > 0 && begin <= 3) r = r.slice(begin);
    const l = r.toLowerCase();
    if (/^(leerdoelen|lesdoelen|doelen|wat ga je leren|dit ga je leren)\b/.test(l)) { inBlok = true; continue; }
    const isDoel = /^(je kunt|je kan|ik kan|je leert|na (deze|dit) (paragraaf|hoofdstuk|les)|aan het (eind|einde) van)/.test(l);
    if (isDoel || (inBlok && opsomming && r.length < 160)) {
      doelen.push(r.replace(/^(na (deze|dit) (paragraaf|hoofdstuk|les)|aan het (eind|einde) van (deze|dit) (paragraaf|hoofdstuk|les))[,:]?\s*/i, '').replace(/^\w/, (c) => c.toUpperCase()));
      continue;
    }
    if (inBlok && !opsomming) inBlok = false;
  }
  return [...new Set(doelen)].slice(0, 6);
}

const STOP = new Set(`de het een en of maar want dus dat die dit deze is zijn was waren wordt worden werd werden heeft hebben had hadden in op aan van voor met door bij uit naar over onder tussen tegen tot om als dan ook nog al niet geen wel er hier daar wat wie welke waar hoe waarom zo veel meer minder te je jij jouw jullie we wij ons onze hij zij ze hem haar hun zich men iets iemand alle elk elke ieder iedere andere ander kan kunnen kun moet moeten mag mogen zal zullen zou zouden wil willen gaat gaan komt komen maakt maken zie zien bijvoorbeeld zoals omdat terwijl wanneer toen sinds nadat voordat waardoor waarbij waarin daarom daardoor dus echter ook alleen zelfs vaak soms altijd nooit steeds heel erg zeer vooral eerst daarna later nu dan even één twee drie vier vijf eerste tweede laatste grote groot klein kleine nieuwe nieuw goed goede nodig maakt maken neemt komt ontstaat gebruikt gebruiken hoeveel deel delen manier mensen tijd jaar jaren dag dagen paragraaf hoofdstuk opdracht vraag vragen bron figuur tabel les leerdoelen je kunt uitleggen noemen`.split(/\s+/));

/** Stel kernbegrippen voor: vaak voorkomende woorden zonder stopwoorden, plus woorden bij "begrip" of "definitie". */
export function vindKernbegrippen(tekst, max = 10) {
  const t = String(tekst ?? '');
  const tel = new Map();
  for (const w of t.toLowerCase().match(/[a-zà-ÿ][a-zà-ÿ-]{3,}/g) ?? []) {
    if (STOP.has(w)) continue;
    tel.set(w, (tel.get(w) ?? 0) + 1);
  }
  const extra = new Set();
  const re = /(?:begrip|definitie|noem je|heet|noemen we|we spreken van)\s*[:"'“]?\s*([A-Za-zÀ-ÿ-]{4,})/gi;
  let m;
  while ((m = re.exec(t))) extra.add(m[1].toLowerCase());
  // Vetgedrukte of tussen sterretjes gezette woorden uit geplakte tekst
  for (const b of t.match(/\*\*([^*]{3,40})\*\*/g) ?? []) extra.add(b.replace(/\*/g, '').toLowerCase());
  const vaak = [...tel.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([w]) => w);
  const alle = [...new Set([...extra, ...vaak])];
  // Meervoud weglaten als het enkelvoud er al is (signaalwoorden → signaalwoord)
  const set = new Set(alle);
  return alle.filter((w) => !((w.endsWith('en') && set.has(w.slice(0, -2))) || (w.endsWith('s') && set.has(w.slice(0, -1))))).slice(0, max);
}
