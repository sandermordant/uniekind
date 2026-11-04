// VOORBEELD – nog niet in gebruik. Hernoem naar uniekind-ai.js en zet de omgevingsvariabelen in Netlify
// pas na akkoord van de school en LVO (zie docs/api-route.md).
//
// Wat deze functie doet:
//  - neemt alleen de prompt aan (lesinhoud, geen leerlinggegevens) en stuurt die naar het taalmodel;
//  - de API-sleutel staat in de omgevingsvariabele AI_API_SLEUTEL en komt nooit in de browser;
//  - een limiet per gebruiker per dag en een maandbudget;
//  - logging zonder persoonsgegevens (alleen datum, aantal tekens, duur).
//
// Het antwoord moet hetzelfde formaat hebben als bij de AI-brug ("### NAAM"-blokken), zodat de
// sjablonen in Uniekind ongewijzigd blijven.

const LIMIET_PER_DAG = Number(process.env.AI_LIMIET_PER_DAG ?? 20);
const MAX_TEKENS_PROMPT = 20000;

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('Alleen POST', { status: 405 });
  const { prompt } = await req.json().catch(() => ({}));
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_TEKENS_PROMPT) return new Response('Ongeldige prompt', { status: 400 });

  // Limiet per gebruiker: koppel aan het schoolaccount (bijvoorbeeld via Netlify Identity of SSO van de school).
  // Hier alleen een plaats-houder; bouw dit in voordat de functie live gaat.
  const gebruiker = context?.clientContext?.user?.sub ?? null;
  if (!gebruiker) return new Response('Niet ingelogd', { status: 401 });
  // if (await telVandaag(gebruiker) >= LIMIET_PER_DAG) return new Response('Daglimiet bereikt', { status: 429 });
  // if (await maandbudgetOp()) return new Response('Maandbudget op', { status: 429 });

  const begin = Date.now();
  // Roep hier het taalmodel aan van de aanbieder waarmee de school een verwerkersovereenkomst heeft,
  // met process.env.AI_API_SLEUTEL. Stuur ALLEEN `prompt` mee.
  const tekst = '### RELEVANTIE\n(voorbeeld: hier komt het antwoord van het taalmodel)';

  console.log(JSON.stringify({ datum: new Date().toISOString().slice(0, 10), tekensIn: prompt.length, tekensUit: tekst.length, ms: Date.now() - begin }));
  return Response.json({ tekst });
};
