// Typ úlohy: Postupnosti — „doplň ďalšie číslo“
//
// Úrovne (ukázaných členov: 5 pri úrovniach 1–5, 6 pri 6–10):
//  1  pripočítavanie / odpočítavanie po 3 až 15
//  2  pripočítavanie / odpočítavanie po 11 až 49, väčšie čísla
//  3  násobenie ×2, ×3 alebo ×4
//  4  rozdiel rastie o 1–3 (+4, +6, +8, …)
//  5  násobenie ×3, ×4 alebo delenie ÷2, ÷3
//  6  striedavo + a − (+7, −3, +7, −3, …)
//  7  dve postupnosti zapletené do seba (každé druhé číslo)
//  8  rozdiel sa zdvojnásobuje alebo strojnásobuje (+2, +4, +8, …)
//  9  každé číslo je súčet dvoch predchádzajúcich
// 10  dvojkrokové pravidlo: ×2 alebo ×3 a ešte ± niečo (3, 7, 15, 31, …)
//
// Pestrosť: každá úloha si vyberie pravidlo z aktuálnej úrovne (častejšie) alebo z 1–2 úrovní pod ňou,
// aby sa v dávke nestriedal stále ten istý druh radu.
//
// Každá postupnosť musí mať jediné rozumné pokračovanie — overuje test.

import { zobrazCiselnuUlohu, POLICKO } from '../klavesnica.js';
import { formatuj, naCislo } from '../rng.js';

const f = formatuj;
const znak = (d) => (d >= 0 ? `+${d}` : `−${-d}`);
const rozdiely = (cl) => cl.slice(1).map((x, i) => x - cl[i]);

function vytvorPostupnost(r, u) {
  const n = u >= 6 ? 6 : 5; // počet ukázaných
  const cleny = [];
  let pravidlo, napoveda;
  const rozdielyText = (k) => rozdiely(cleny.slice(0, k)).map(znak).join(', ');

  switch (u) {
    case 1: case 2: {
      const d = u === 1 ? r.cislo(3, 15) : r.cislo(11, 49);
      const dole = r.dalsie() < 0.5;
      const start = dole ? r.cislo(d * (n + 1) + 5, d * (n + 1) + (u === 1 ? 100 : 400)) : r.cislo(1, u === 1 ? 100 : 400);
      for (let i = 0; i <= n; i++) cleny.push(start + i * (dole ? -d : d));
      pravidlo = `Každé ďalšie číslo je o ${d} ${dole ? 'menšie' : 'väčšie'}.`;
      napoveda = `Pozri sa, o koľko sa čísla menia: ${rozdielyText(3)}, …`;
      break;
    }
    case 3: case 5: {
      const k = u === 3 ? r.vyber([2, 3, 3, 4]) : r.vyber([3, 4, 'd2', 'd3']); // ×2 iba zriedka — bolo ho priveľa
      if (typeof k === 'string') {
        const q = k === 'd2' ? 2 : 3;
        let x = r.cislo(1, q === 2 ? 15 : 5) * q ** n;
        for (let i = 0; i <= n; i++) { cleny.push(x); x /= q; }
        pravidlo = q === 2 ? 'Každé ďalšie číslo je polovica predchádzajúceho.' : 'Každé ďalšie číslo je tretina predchádzajúceho.';
        napoveda = `Porovnaj ${f(cleny[0])} a ${f(cleny[1])}. Koľkokrát je menšie?`;
      } else {
        const [od, po] = { 2: [3, 15], 3: [2, 7], 4: [2, 3] }[k];
        let x = r.cislo(od, po);
        for (let i = 0; i <= n; i++) { cleny.push(x); x *= k; }
        pravidlo = `Každé ďalšie číslo je ${k}-krát väčšie.`;
        napoveda = `Čísla rastú stále rýchlejšie. Koľkokrát je ${f(cleny[2])} väčšie ako ${f(cleny[1])}?`;
      }
      break;
    }
    case 4: {
      const d = r.cislo(1, 9), k = r.cislo(1, 3);
      let x = r.cislo(1, 60);
      for (let i = 0; i <= n; i++) { cleny.push(x); x += d + i * k; }
      pravidlo = `Rozdiel sa zakaždým zväčší o ${k}: ${rozdiely(cleny).map(znak).join(', ')}.`;
      napoveda = `Pozri sa na rozdiely: ${rozdielyText(4)}, … Ako pokračujú?`;
      break;
    }
    case 6: {
      const a = r.cislo(5, 19); let b;
      do { b = r.cislo(2, a - 1); } while (a === 2 * b);
      let x = r.cislo(5, 60);
      for (let i = 0; i <= n; i++) { cleny.push(x); x += i % 2 === 0 ? a : -b; }
      pravidlo = `Striedavo ${znak(a)} a ${znak(-b)}.`;
      napoveda = `Pozri sa na rozdiely: ${rozdielyText(4)}, … Opakujú sa.`;
      break;
    }
    case 7: {
      const a = r.cislo(3, 12); let b;
      do { b = r.cislo(5, 25) * r.vyber([1, -1]); } while (b === a || b === -a);
      const p = r.cislo(1, 40); const q = b < 0 ? r.cislo(100, 160) : r.cislo(30, 90);
      for (let i = 0; i <= n; i++) cleny.push(i % 2 === 0 ? p + (i / 2) * a : q + ((i - 1) / 2) * b);
      pravidlo = `Sú to dve postupnosti striedavo: ${f(cleny[0])}, ${f(cleny[2])}, ${f(cleny[4])}, … (${znak(a)}) a ${f(cleny[1])}, ${f(cleny[3])}, ${f(cleny[5])}, … (${znak(b)}).`;
      napoveda = `Pozri sa iba na každé druhé číslo: ${f(cleny[0])}, ${f(cleny[2])}, ${f(cleny[4])}, …`;
      break;
    }
    case 8: {
      const m = r.vyber([2, 2, 3]); const d = r.cislo(1, m === 2 ? 5 : 2);
      let x = r.cislo(1, 30);
      for (let i = 0; i <= n; i++) { cleny.push(x); x += d * m ** i; }
      pravidlo = `Rozdiel sa zakaždým ${m === 2 ? 'zdvojnásobí' : 'strojnásobí'}: ${rozdiely(cleny).map(znak).join(', ')}.`;
      napoveda = `Pozri sa na rozdiely: ${rozdielyText(4)}, …`;
      break;
    }
    case 9: {
      const a = r.cislo(1, 9), b = r.cislo(a + 1, 15);
      cleny.push(a, b);
      while (cleny.length <= n) cleny.push(cleny.at(-1) + cleny.at(-2));
      pravidlo = 'Každé číslo je súčet dvoch predchádzajúcich.';
      napoveda = `Pozri sa, ako vzniklo ${f(cleny[2])} z čísel ${f(cleny[0])} a ${f(cleny[1])}.`;
      break;
    }
    default: { // 10: x → k·x + c
      const k = r.vyber([2, 2, 3]); const c = r.vyber([-3, -2, -1, 1, 2, 3]);
      let x = k === 2 ? r.cislo(4, 12) : r.cislo(2, 5); // pri ×2 a −3 musí začiatok byť > 3, inak klesá do záporných
      for (let i = 0; i <= n; i++) { cleny.push(x); x = k * x + c; }
      pravidlo = `Každé číslo je ${k === 2 ? 'dvojnásobok' : 'trojnásobok'} predchádzajúceho a ešte ${znak(c)}.`;
      napoveda = `Skús, koľkokrát je ${f(cleny[2])} väčšie ako ${f(cleny[1])} — a čo chýba alebo prebýva.`;
    }
  }
  return { ukazane: cleny.slice(0, n), odpoved: cleny[n], pravidlo, napoveda };
}

export default {
  id: 'postupnosti',
  nazov: 'Postupnosť',
  urovne: 10,

  vytvor(rng, uroven) {
    const uroven1 = Math.min(10, Math.max(1, uroven));
    const u = rng.vyber([uroven1, uroven1, uroven1 - 1, uroven1 - 2, uroven1 - 3].filter(x => x >= 1));
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
