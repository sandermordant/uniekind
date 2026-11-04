// Testcase 9: de AI-brug. De prompt bevat geen leerlinggegevens; een teruggeplakt antwoord vult de sjablonen.
import { describe, it, expect } from 'vitest';
import { genereerLes } from '../src/engine/opbouw.js';
import { maakMateriaal } from '../src/materiaal/maak.js';
import { tekstVan } from '../src/materiaal/model.js';
import { maakPrompt, bevatKlasgegevens } from '../src/ai/prompt.js';
import { promptVoor } from '../src/ai/adapter.js';
import { leesAntwoord, vragen, hintkaart, checkvraag, vaktaal } from '../src/ai/import.js';
import { PAKKETTEN, IDS } from '../src/ai/formaat.js';
import { maakLesbestand, leesLesbestand } from '../src/export/lesbestand.js';
import { laadData, invoer } from './helpers.js';

const data = laadData();
const les = genereerLes(invoer({
  stand: 2,
  context: { afdeling: 'vwo-a', leerjaar: 2, vak: 'biologie', lesduur: 50, ruimte: 'M', aantal: 24 },
  inhoud: {
    onderwerp: '4.3 Fotosynthese',
    begrippen: ['fotosynthese', 'bladgroen', 'glucose'],
    tekst: 'Planten maken hun eigen voedsel. Dat proces heet fotosynthese. In de bladeren zit bladgroen.',
    lesdoelen: [{ tekst: 'Je kunt uitleggen wat fotosynthese is.' }]
  },
  klas: { verdelingBekend: true, steun: 6, basis: 12, verdieping: 6, dyslexie: 4, nt2: 2, faalangst: 3, dynamiek: 'onrustig' }
}), data);

const ANTWOORD = `Natuurlijk! Hier is het lesmateriaal voor jouw les over fotosynthese.

### UITGEWERKT-VOORBEELD
1. Lees wat de plant nodig heeft: licht, water en koolstofdioxide. Zo weet je de beginstoffen.
2. Bedenk wat de plant maakt: glucose en zuurstof. Dat zijn de eindstoffen.
3. Zet het in een schema: water + koolstofdioxide → glucose + zuurstof (met licht). Zo zie je het hele proces.

**VRAGEN-BASIS**
1. Leg in je eigen woorden uit wat fotosynthese is. [Begrijpen]
2. Waarom is bladgroen nodig voor fotosynthese? [Begrijpen]
3. Een plant staat een week in een donkere kast. Wat gebeurt er met de fotosynthese? [Toepassen]
4. Je zet een plant in een afgesloten glazen pot. Wat gebeurt er met de hoeveelheid zuurstof in de pot? [Toepassen]
5. Vergelijk een plant in de schaduw met een plant in de zon. [Analyseren]

## Hintkaart 1
Opgave: vraag 4
Hint 1: Welke stof maakt een plant bij fotosynthese?
Hint 2: Schrijf op wat er de pot in gaat en wat eruit komt.
Uitwerking: De plant maakt zuurstof, dus de hoeveelheid zuurstof in de pot neemt toe zolang er licht is.

### CHECKVRAAG
Vraag: Wat heeft een plant NIET nodig voor fotosynthese?
A: Licht
B: Zuurstof
C: Water
D: Koolstofdioxide
Goed: B
Misvattingen: A, C en D zijn juist nodig; wie die kiest, verwart beginstoffen en eindstoffen.

### VAKTAAL
- fotosynthese | het proces waarbij een plant met licht zijn eigen voedsel maakt | Door fotosynthese groeit de plant.
- bladgroen | groene stof in het blad die licht opvangt | Bladgroen maakt het blad groen.

### Samenvatting voor de docent
Dit stuk hoort bij geen enkel onderdeel.

### ANTWOORDEN
Basis:
1. Een plant maakt met licht, water en koolstofdioxide glucose en zuurstof.

Wil je dat ik ook een uitdaging voor de verdiepingsgroep maak?`;

describe('Testcase 9 · AI-brug', () => {
  const prompt = maakPrompt(les, data.profiel, 'alles');

  it('de prompt bevat de lesinhoud', () => {
    expect(prompt).toMatch(/Je kunt uitleggen wat fotosynthese is/);
    expect(prompt).toMatch(/fotosynthese, bladgroen, glucose/);
    expect(prompt).toMatch(/In de bladeren zit bladgroen/);
    expect(prompt).toMatch(/vwo atheneum, leerjaar 2/);
    for (const id of IDS) expect(prompt).toContain(`### ${id}`);
  });

  it('de prompt bevat geen leerling- of klasgegevens', () => {
    expect(bevatKlasgegevens(prompt, les)).toBe(false);
    expect(prompt).not.toMatch(/dyslexie|dyscalculie|faalangst|NT2|onrustig|24 leerlingen/i);
    expect(() => promptVoor(les, data.profiel, 'alles')).not.toThrow();
  });

  it('kleine prompts vragen alleen hun eigen onderdelen', () => {
    for (const p of PAKKETTEN) {
      const kp = maakPrompt(les, data.profiel, p.id);
      for (const id of IDS) expect(kp.includes(`### ${id}`), `${p.id} / ${id}`).toBe(p.ids.includes(id));
    }
  });

  const v = leesAntwoord(ANTWOORD);
  it('herkent de blokken in een Copilot-achtig antwoord (### , **vet**, ## Hintkaart 1)', () => {
    expect(v.herkend.sort()).toEqual(['ANTWOORDEN', 'CHECKVRAAG', 'HINTKAART-1', 'UITGEWERKT-VOORBEELD', 'VAKTAAL', 'VRAGEN-BASIS'].sort());
    expect(vragen(v.blokken['VRAGEN-BASIS'])).toHaveLength(5);
    expect(vragen(v.blokken['VRAGEN-BASIS'])[2].label).toBe('Toepassen');
    expect(hintkaart(v.blokken['HINTKAART-1']).hint2).toMatch(/pot in gaat/);
    expect(checkvraag(v.blokken.CHECKVRAAG)).toMatchObject({ goed: 'B', b: 'Zuurstof' });
    expect(vaktaal(v.blokken.VAKTAAL)).toHaveLength(2);
  });

  it('toont wat het niet herkent apart (inleiding, eigen kopje, afsluitende vraag)', () => {
    const los = v.onbekend.join('\n');
    expect(los).toMatch(/Natuurlijk!/);
    expect(los).toMatch(/hoort bij geen enkel onderdeel/);
    expect(los).toMatch(/Wil je dat ik/);
    expect(v.blokken.ANTWOORDEN).not.toMatch(/Wil je/);
  });

  it('vult de sjablonen met het teruggeplakte antwoord', () => {
    const zonder = maakMateriaal(les, data);
    const met = maakMateriaal(les, data, v.blokken);
    const doc = (m, id) => tekstVan(m.alle.find((d) => d.id === id));
    expect(doc(met, 'werkblad-basis')).toMatch(/donkere kast/);
    expect(doc(met, 'werkblad-steun')).toMatch(/Zet het in een schema/);
    expect(doc(met, 'hintkaarten')).toMatch(/Welke stof maakt een plant/);
    expect(doc(met, 'vaktaalkaart')).toMatch(/groene stof in het blad/);
    expect(doc(met, 'lesplan')).toMatch(/Wat heeft een plant NIET nodig/);
    expect(doc(met, 'lesplan')).toMatch(/Lees het altijd na op juistheid en niveau/);
    expect(met.alle.map((d) => d.id)).toContain('antwoordkaart');
    const invul = (m) => m.alle.reduce((t, d) => t + (tekstVan(d).match(/⟦/g) ?? []).length, 0);
    expect(invul(met)).toBeLessThan(invul(zonder));
  });

  it('leest ook JSON terug', () => {
    const j = leesAntwoord('```json\n{"VRAGEN_STEUN": ["Wat is bladgroen? [Onthouden]", "Wat maakt een plant? [Onthouden]"], "relevantie": "Fruittelers in het Heuvelland letten op zonlicht."}\n```');
    expect(j.herkend.sort()).toEqual(['RELEVANTIE', 'VRAGEN-STEUN']);
    expect(vragen(j.blokken['VRAGEN-STEUN'])).toHaveLength(2);
  });

  it('AI-inhoud en gekozen bronnen gaan mee in het lesbestand', () => {
    const concept = { modus: 'snel', invoer: les.invoer, aanpassingen: {}, gekozenStand: 2, ai: { ...v.blokken, ONZIN: 'x' }, links: [{ titel: 'Schooltv', url: 'https://schooltv.nl' }, { titel: 'kwaad', url: 'javascript:alert(1)' }] };
    const terug = leesLesbestand(maakLesbestand(concept, les, 'sophianum'));
    expect(Object.keys(terug.concept.ai).sort()).toEqual(v.herkend.sort());
    expect(terug.concept.links).toEqual([{ titel: 'Schooltv', url: 'https://schooltv.nl' }]);
  });
});
