import { html } from '../util/html.js';

export default {
  async render() {
    return {
      titel: 'Maak een les',
      html: html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Lesgenerator</p>
          <h1>Maak een les</h1>
          <p class="lead">De lesgenerator wordt gebouwd in fase 2. Je doorloopt dan zeven korte stappen, of de snelle modus met alleen onderwerp, lesdoel, afdeling, lesduur, lokaal en aantal leerlingen.</p>
        </div></section>
        <main class="wrap">
          <div class="sectie">
            <p class="lees">Tot die tijd kun je in de <a href="#bibliotheek">werkvormenbibliotheek</a> kijken, of beginnen met de <a href="#begin-hier">tien werkvormen voor morgen</a>.</p>
          </div>
        </main>`
    };
  }
};
