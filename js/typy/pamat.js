// Typ úlohy: Zapamätaj si čísla.
// Na chvíľu ukáže rad číslic, potom ich skryje a dedko ich napíše (na vyšších úrovniach pospiatky).
// Pri demencii je krátkodobá pamäť to najcennejšie, čo sa dá trénovať.
//
// Úrovne (počet číslic, smer):
//  1 4   2 5   3 6   4 4 pospiatky   5 7   6 5 pospiatky   7 8   8 6 pospiatky   9 9   10 7 pospiatky
// Čas na zapamätanie: 1 s na číslicu + 2 s. Po prvej chybe sa čísla ukážu ešte raz.

import { zobrazCiselnuUlohu, POLICKO } from '../klavesnica.js';

const UROVNE = [[4, 0], [5, 0], [6, 0], [4, 1], [7, 0], [5, 1], [8, 0], [6, 1], [9, 0], [7, 1]];
const casUkazania = (n) => (n + 2) * 1000;

export default {
  id: 'pamat',
  nazov: 'Zapamätaj si',
  urovne: 10,

  vytvor(rng, uroven) {
    const [n, pospiatky] = UROVNE[Math.min(10, Math.max(1, uroven)) - 1];
    // susedné číslice sa neopakujú (7 7 sa ťažko číta), prvá nie je 0
    const cisla = [];
    while (cisla.length < n) {
      const c = rng.cislo(cisla.length ? 0 : 1, 9);
      if (c !== cisla.at(-1)) cisla.push(c);
    }
    const odpoved = (pospiatky ? cisla.slice().reverse() : cisla).join('');
    return {
      zadanie: cisla.join(' '),
      odpoved,
      odpovedText: odpoved,
      napoveda: 'Ukážem ti čísla ešte raz. Skús si ich povedať nahlas.',
      vysvetlenie: `Čísla boli ${cisla.join(' ')}${pospiatky ? `, pospiatky ${odpoved.split('').join(' ')}` : ''}.`,
      data: { cisla, pospiatky: !!pospiatky },
    };
  },

  over(uloha, vstup) { return String(vstup ?? '').replace(/\s/g, '') === uloha.odpoved; },

  zobraz(kontajner, uloha, priOdpovedi) {
    const { cisla, pospiatky } = uloha.data;
    const ovl = zobrazCiselnuUlohu(kontajner, {
      popis: pospiatky ? 'Zapamätaj si čísla. Potom ich napíš <b>pospiatky</b> (od konca).' : 'Zapamätaj si čísla. Potom ich napíš.',
      zadanieHtml: `<span class="pamat-cisla"></span>${POLICKO}`,
      maxZnakov: cisla.length,
    }, priOdpovedi);
    const pole = kontajner.querySelector('.pamat-cisla');
    const odpoved = kontajner.querySelector('.odpoved');

    const ukaz = () => {
      ovl.zamkni(true);
      odpoved.hidden = true;
      pole.hidden = false;
      pole.textContent = cisla.join(' ');
      pole.classList.add('ukazane');
      setTimeout(() => {
        if (!kontajner.isConnected) return;
        pole.textContent = '';
        pole.hidden = true;
        odpoved.hidden = false;
        ovl.zamkni(false);
      }, casUkazania(cisla.length));
    };
    ukaz();

    return {
      ...ovl,
      napoveda(veta, text) { ovl.napoveda(veta, text); ukaz(); },
    };
  },
};
