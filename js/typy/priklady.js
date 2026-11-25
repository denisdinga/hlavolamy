// Typ úlohy: Príklady (+ − × ÷)
//
// Úrovne:
//  1  sčítanie do 10
//  2  sčítanie a odčítanie do 20
//  3  do 100 bez prechodu cez desiatku
//  4  do 100 s prechodom cez desiatku
//  5  malá násobilka (2–9 × 2–9)
//  6  delenie bez zvyšku v rámci násobilky
//  7  trojciferné ± dvojciferné
//  8  dvojciferné × jednociferné
//  9  trojciferné ± trojciferné
// 10  dvojkrokové: a × b ± c

import { zobrazCiselnuUlohu, POLICKO } from '../klavesnica.js';
import { formatuj, naCislo } from '../rng.js';

const f = formatuj;
const jednotky = (n) => n % 10;
const bezJednotiek = (n) => n - (n % 10);

function scitanie(a, b) {
  return {
    op: '+', a, b, odpoved: a + b,
    napoveda: b >= 10 && b % 10 !== 0
      ? `Po častiach: ${f(a)} + ${f(bezJednotiek(b))} = ${f(a + bezJednotiek(b))}, potom ešte + ${jednotky(b)}.`
      : `Pripočítaj ${f(b)} k číslu ${f(a)}.`,
  };
}

function odcitanie(a, b) {
  return {
    op: '−', a, b, odpoved: a - b,
    napoveda: b >= 10 && b % 10 !== 0
      ? `Po častiach: ${f(a)} − ${f(bezJednotiek(b))} = ${f(a - bezJednotiek(b))}, potom ešte − ${jednotky(b)}.`
      : `Koľko zostane, keď od ${f(a)} uberieš ${f(b)}?`,
  };
}

function nasobenie(a, b) {
  return {
    op: '×', a, b, odpoved: a * b,
    napoveda: a >= 10
      ? `Po častiach: ${bezJednotiek(a)} × ${b} = ${f(bezJednotiek(a) * b)}, a ${jednotky(a)} × ${b} = ${jednotky(a) * b}. Potom to sčítaj.`
      : `${a} × ${b} je ${b}-krát ${a}. Napríklad ${a} × ${b - 1} = ${a * (b - 1)}, a ešte + ${a}.`,
  };
}

function delenie(delitel, podiel) {
  const a = delitel * podiel;
  return {
    op: '÷', a, b: delitel, odpoved: podiel,
    napoveda: `Koľkokrát sa ${delitel} zmestí do ${f(a)}? Hľadáme číslo, pre ktoré ${delitel} × ? = ${f(a)}.`,
  };
}

function vytvorPriklad(r, u) {
  switch (u) {
    case 1: { const a = r.cislo(1, 8); return scitanie(a, r.cislo(1, 10 - a)); }
    case 2: {
      if (r.dalsie() < 0.5) { const a = r.cislo(3, 15); return scitanie(a, r.cislo(2, 20 - a)); }
      const a = r.cislo(8, 20); return odcitanie(a, r.cislo(2, a - 1));
    }
    case 3: { // bez prechodu cez desiatku
      if (r.dalsie() < 0.5) {
        const a = r.cislo(11, 78); const ja = jednotky(a);
        const b = r.cislo(1, 8 - Math.floor(a / 10)) * 10 + r.cislo(0, 9 - ja);
        return scitanie(a, b < 2 ? 2 : b);
      }
      const a = r.cislo(25, 99); const ja = jednotky(a);
      const b = r.cislo(1, Math.floor(a / 10) - 1) * 10 + r.cislo(0, ja);
      return odcitanie(a, b);
    }
    case 4: { // s prechodom cez desiatku
      if (r.dalsie() < 0.5) {
        const a = r.cislo(12, 69); const ja = jednotky(a) || 5;
        const a2 = bezJednotiek(a) + ja;
        const jb = r.cislo(10 - ja, 9);
        const b = r.cislo(1, Math.max(1, 8 - Math.floor(a2 / 10))) * 10 + jb;
        return scitanie(a2, b);
      }
      const a = r.cislo(31, 99); const ja = jednotky(a);
      const a2 = ja === 9 ? a - 1 : a; const ja2 = jednotky(a2);
      const jb = r.cislo(ja2 + 1, 9);
      const b = r.cislo(1, Math.floor(a2 / 10) - 2) * 10 + jb;
      return odcitanie(a2, b);
    }
    case 5: return nasobenie(r.cislo(2, 9), r.cislo(2, 9));
    case 6: return delenie(r.cislo(2, 9), r.cislo(2, 9));
    case 7: {
      const a = r.cislo(120, 899); const b = r.cislo(12, 98);
      return r.dalsie() < 0.5 ? scitanie(a, b) : odcitanie(a, b);
    }
    case 8: return nasobenie(r.cislo(12, 49), r.cislo(3, 9));
    case 9: {
      if (r.dalsie() < 0.5) { const a = r.cislo(150, 799); return scitanie(a, r.cislo(120, 999 - a)); }
      const a = r.cislo(400, 999); return odcitanie(a, r.cislo(110, a - 100));
    }
    default: { // 10: a × b ± c
      const a = r.cislo(12, 29); const b = r.cislo(3, 9); const s = a * b;
      const plus = r.dalsie() < 0.5;
      const c = plus ? r.cislo(11, 89) : r.cislo(11, Math.min(89, s - 10));
      const odp = plus ? s + c : s - c;
      return {
        op: plus ? '×+' : '×−', a, b, c, odpoved: odp,
        zadanie: `${a} × ${b} ${plus ? '+' : '−'} ${c}`,
        napoveda: `Najprv násobenie: ${a} × ${b} = ?  Potom ${plus ? 'pripočítaj' : 'odčítaj'} ${c}.`,
        vysvetlenie: `${a} × ${b} = ${f(s)}, potom ${f(s)} ${plus ? '+' : '−'} ${c} = ${f(odp)}.`,
      };
    }
  }
}

export default {
  id: 'priklady',
  nazov: 'Príklad',
  urovne: 10,

  vytvor(rng, uroven) {
    const p = vytvorPriklad(rng, Math.min(10, Math.max(1, uroven)));
    const zadanie = p.zadanie ?? `${f(p.a)} ${p.op} ${f(p.b)}`;
    return {
      zadanie,
      odpoved: p.odpoved,
      napoveda: p.napoveda,
      vysvetlenie: p.vysvetlenie ?? `${zadanie} = ${f(p.odpoved)}.`,
      data: { op: p.op, a: p.a, b: p.b, c: p.c },
    };
  },

  over(uloha, vstup) { return naCislo(vstup) === uloha.odpoved; },

  zobraz(kontajner, uloha, priOdpovedi) {
    return zobrazCiselnuUlohu(kontajner, {
      popis: 'Vypočítaj',
      zadanieHtml: `<span class="vyraz">${uloha.zadanie} =</span> ${POLICKO}`,
    }, priOdpovedi);
  },
};
