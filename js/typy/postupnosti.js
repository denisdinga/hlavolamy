// Typ úlohy: Postupnosti — „doplň ďalšie číslo“
//
// Úrovne (ukázaných členov: 5 pri úrovniach 1–7, 6 pri 8–10):
//  1  pripočítavanie +1 až +3, malé čísla
//  2  pripočítavanie +2 až +10
//  3  odpočítavanie −2 až −10
//  4  pripočítavanie / odpočítavanie po 11 až 25
//  5  násobenie ×2 alebo ×3
//  6  rozdiel rastie o 1 (+2, +3, +4, …)
//  7  násobenie ×2, ×3, ×4 alebo delenie ÷2
//  8  striedavo + a − (+5, −2, +5, −2, …)
//  9  dve postupnosti zapletené do seba (každé druhé číslo)
// 10  rozdiel sa zdvojnásobuje (+1, +2, +4, +8, …)
//
// Každá postupnosť musí mať jediné rozumné pokračovanie — overuje test.

import { zobrazCiselnuUlohu, POLICKO } from '../klavesnica.js';
import { formatuj, naCislo } from '../rng.js';

const f = formatuj;
const znak = (d) => (d >= 0 ? `+${d}` : `−${-d}`);
const rozdiely = (cl) => cl.slice(1).map((x, i) => x - cl[i]);

function vytvorPostupnost(r, u) {
  const n = u >= 8 ? 6 : 5; // počet ukázaných
  const cleny = [];
  let pravidlo, napoveda;

  switch (u) {
    case 1: case 2: case 4: {
      const d = u === 1 ? r.cislo(1, 3) : u === 2 ? r.cislo(2, 10) : r.cislo(11, 25);
      const dole = u === 4 && r.dalsie() < 0.5;
      const start = dole ? r.cislo(d * (n + 1) + 5, d * (n + 1) + 150) : r.cislo(1, u === 1 ? 10 : 50);
      const krok = dole ? -d : d;
      for (let i = 0; i <= n; i++) cleny.push(start + i * krok);
      pravidlo = `Každé ďalšie číslo je o ${d} ${dole ? 'menšie' : 'väčšie'}.`;
      napoveda = `Pozri sa, o koľko sa čísla menia: ${rozdiely(cleny.slice(0, 3)).map(znak).join(', ')}, …`;
      break;
    }
    case 3: {
      const d = r.cislo(2, 10);
      const start = r.cislo(d * (n + 1) + 1, d * (n + 1) + 60);
      for (let i = 0; i <= n; i++) cleny.push(start - i * d);
      pravidlo = `Každé ďalšie číslo je o ${d} menšie.`;
      napoveda = `Pozri sa, o koľko sa čísla zmenšujú: ${rozdiely(cleny.slice(0, 3)).map(znak).join(', ')}, …`;
      break;
    }
    case 5: case 7: {
      const moznosti = u === 5 ? [2, 3] : [2, 3, 4, 'del'];
      const k = r.vyber(moznosti);
      if (k === 'del') {
        const koniec = r.cislo(1, 9);
        let x = koniec * 2 ** n;
        for (let i = 0; i <= n; i++) { cleny.push(x); x /= 2; }
        pravidlo = 'Každé ďalšie číslo je polovica predchádzajúceho.';
        napoveda = `Porovnaj ${f(cleny[0])} a ${f(cleny[1])}. Čo sa stalo s číslom?`;
      } else {
        const maxStart = Math.max(1, Math.floor(u === 5 ? (k === 2 ? 6 : 2) : (k === 4 ? 2 : k === 3 ? 3 : 9)));
        let x = r.cislo(1, maxStart);
        for (let i = 0; i <= n; i++) { cleny.push(x); x *= k; }
        pravidlo = `Každé ďalšie číslo je ${k}-krát väčšie.`;
        napoveda = `Čísla rastú stále rýchlejšie. Skús, koľkokrát je ${f(cleny[2])} väčšie ako ${f(cleny[1])}.`;
      }
      break;
    }
    case 6: {
      const d = r.cislo(1, 5);
      let x = r.cislo(1, 30);
      for (let i = 0; i <= n; i++) { cleny.push(x); x += d + i; }
      pravidlo = `Rozdiel sa zakaždým zväčší o 1: ${rozdiely(cleny).map(znak).join(', ')}.`;
      napoveda = `Pozri sa na rozdiely: ${rozdiely(cleny.slice(0, 4)).map(znak).join(', ')}, … Ako pokračujú?`;
      break;
    }
    case 8: {
      // a ≠ 2b, inak sa čísla opakujú (4, 8, 6, 10, 8 …) a to mätie
      const a = r.cislo(3, 9); let b;
      do { b = r.cislo(1, a - 1); } while (a === 2 * b);
      let x = r.cislo(1, 20);
      for (let i = 0; i <= n; i++) { cleny.push(x); x += i % 2 === 0 ? a : -b; }
      pravidlo = `Striedavo ${znak(a)} a ${znak(-b)}.`;
      napoveda = `Pozri sa na rozdiely: ${rozdiely(cleny.slice(0, 4)).map(znak).join(', ')}, … Opakujú sa.`;
      break;
    }
    case 9: {
      const a = r.cislo(2, 6); let b;
      do { b = r.cislo(5, 15) * r.vyber([1, -1]); } while (b === a || b === -a);
      const p = r.cislo(1, 15); const q = b < 0 ? r.cislo(60, 90) : r.cislo(20, 60);
      for (let i = 0; i <= n; i++) cleny.push(i % 2 === 0 ? p + (i / 2) * a : q + ((i - 1) / 2) * b);
      pravidlo = `Sú to dve postupnosti striedavo: ${f(cleny[0])}, ${f(cleny[2])}, ${f(cleny[4])}, … (${znak(a)}) a ${f(cleny[1])}, ${f(cleny[3])}, ${f(cleny[5])}, … (${znak(b)}).`;
      napoveda = `Pozri sa iba na každé druhé číslo: ${f(cleny[0])}, ${f(cleny[2])}, ${f(cleny[4])}, …`;
      break;
    }
    default: { // 10
      const d = r.cislo(1, 3);
      let x = r.cislo(1, 20);
      for (let i = 0; i <= n; i++) { cleny.push(x); x += d * 2 ** i; }
      pravidlo = `Rozdiel sa zakaždým zdvojnásobí: ${rozdiely(cleny).map(znak).join(', ')}.`;
      napoveda = `Pozri sa na rozdiely: ${rozdiely(cleny.slice(0, 4)).map(znak).join(', ')}, …`;
    }
  }
  return { ukazane: cleny.slice(0, n), odpoved: cleny[n], pravidlo, napoveda };
}

export default {
  id: 'postupnosti',
  nazov: 'Postupnosť',
  urovne: 10,

  vytvor(rng, uroven) {
    const u = Math.min(10, Math.max(1, uroven));
    // Opakujúce sa číslo (napr. 27 dvakrát) mätie — vtedy skúsime inú postupnosť.
    let p = vytvorPostupnost(rng, u);
    for (let i = 0; i < 20 && new Set([...p.ukazane, p.odpoved]).size !== p.ukazane.length + 1; i++) {
      p = vytvorPostupnost(rng, u);
    }
    return {
      zadanie: p.ukazane.map(f).join(', ') + ', ?',
      odpoved: p.odpoved,
      napoveda: p.napoveda,
      vysvetlenie: p.pravidlo,
      data: { cleny: p.ukazane },
    };
  },

  over(uloha, vstup) { return naCislo(vstup) === uloha.odpoved; },

  zobraz(kontajner, uloha, priOdpovedi) {
    const cisla = uloha.data.cleny.map(c => `<span class="clen">${f(c)}<span class="ciarka">,</span></span>`).join('');
    return zobrazCiselnuUlohu(kontajner, {
      popis: 'Ktoré číslo príde ďalej?',
      zadanieHtml: `<span class="rad">${cisla}${POLICKO}</span>`,
    }, priOdpovedi);
  },
};
