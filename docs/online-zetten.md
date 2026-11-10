# Uniekind online zetten met GitHub Pages

Uniekind is één website voor het Sophianum. GitHub Pages zet hem gratis online, op een adres als `https://<jouw-account>.github.io/uniekind/`. Er is geen server, database of wachtwoordbeheer nodig.

## Eenmalig (ongeveer 15 minuten)

1. **Maak een GitHub-account** op github.com, als je er nog geen hebt.
2. **Maak een lege repository** met de naam `uniekind`. Klik op *New repository*. Vink niets aan: geen README en geen licentie.
   - **Openbaar of privé?** Met een gratis account werkt Pages alleen met een **openbare** repository. Iedereen kan dan de broncode en de documenten in `docs/` lezen, zoals de pitch voor de schoolleiding. Er staan geen leerlinggegevens en geen wachtwoorden in.
   - Wil je de repository privé houden? Dan heb je GitHub Pro nodig. Docenten krijgen dat vaak gratis via GitHub Education.
3. **Zet de bestanden erin.** Kies één van twee manieren:
   - **Via Claude (makkelijkst).** Koppel GitHub op https://claude.ai/connect-github en geef de Claude GitHub App toegang tot de repository `uniekind`. Stuur daarna in dit gesprek de naam door, bijvoorbeeld `jouw-account/uniekind`. Claude zet alles erin.
   - **Zelf, met GitHub Desktop.** Pak `uniekind-eindversie.zip` uit en kies in GitHub Desktop *File → Add local repository* en daarna *Publish*. Het uploadvenster op de website zelf neemt maximaal 100 bestanden tegelijk, en Uniekind heeft er meer.
4. **Zet Pages aan.** Ga in de repository naar *Settings → Pages → Build and deployment → Source* en kies **GitHub Actions**.
5. **Wacht ongeveer 3 minuten.** Op het tabblad *Actions* zie je *Publiceren op GitHub Pages*. Die stap draait eerst alle tests en bouwt dan de site. Een groen vinkje betekent dat de site online staat; het adres staat bij *Settings → Pages*.

## Daarna

- **Elke wijziging** die naar `main` gaat, zet de site vanzelf opnieuw online. Bijvoorbeeld:
  - een nieuwe werkvorm;
  - een aangepast schoolprofiel;
  - gedeeld materiaal in `public/data/materiaal-sectie.json`.
- **Een fout in een werkvorm** stopt de publicatie. Dan blijft de oude versie gewoon online staan. Op het tabblad *Actions* lees je wat er mis is.
- **Een eigen adres**, zoals `uniekind.sophianum.nl`, stel je in bij *Settings → Pages → Custom domain*. De ICT-afdeling voegt daarvoor één DNS-regel toe.
- **Zoekmachines** slaan de site over, door een `noindex`-tag in de pagina.
- **Een toegangscode** (schoolwoord) stel je in op de pagina *Schoolprofiel*. Die is een drempel, geen beveiliging.
