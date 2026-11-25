// Typ úlohy: Príklady (+ − × ÷)
//
// Úrovne (dedko počíta dobre a násobí rôzne — stupnica začína na dospelej úrovni):
//  1  trojciferné ± dvojciferné            (845 − 67)
//  2  malá násobilka a delenie v nej        (7 × 8, 56 ÷ 7)
//  3  trojciferné ± trojciferné            (761 − 253)
//  4  dvojciferné × jednociferné           (47 × 8)
//  5  trojciferné ÷ jednociferné bez zvyšku (434 ÷ 7)
//  6  dvojkrokové a × b ± c                (27 × 6 − 48)
//  7  dvojciferné × 11 až 19               (34 × 13)
//  8  trojciferné × jednociferné           (238 × 7)
//  9  dvojciferné × dvojciferné            (47 × 36)
// 10  dva súčiny                           (34 × 12 − 17 × 6)

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
  if (b >= 10) {
    const bd = bezJednotiek(b), bj = jednotky(b);
    return {
      op: '×', a, b, odpoved: a * b,
      napoveda: `Po častiach: ${a} × ${bd} = ${f(a * bd)}${bj ? `, a ${a} × ${bj} = ${f(a * bj)}. Potom to sčítaj.` : '.'}`,
    };
  }
  return {
    op: '×', a, b, odpoved: a * b,
    napoveda: a >= 100
      ? `Po častiach: ${bezJednotiek(a) - (a % 100 - jednotky(a))} × ${b}, potom ${a % 100 - jednotky(a)} × ${b}, potom ${jednotky(a)} × ${b} — a všetko sčítaj.`
      : a >= 10
      ? `Po častiach: ${bezJednotiek(a)} × ${b} = ${f(bezJednotiek(a) * b)}, a ${jednotky(a)} × ${b} = ${jednotky(a) * b}. Potom to sčítaj.`
      : `${a} × ${b} je ${b}-krát ${a}. Napríklad ${a} × ${b - 1} = ${a * (b - 1)}, a ešte + ${a}.`,
  };
}

function delenie(delitel, podiel) {
  const a = delitel * podiel;
  return {
    op: '÷', a, b: delitel, odpoved: podiel,
    napoveda: podiel >= 10
      ? `Skús odhad: ${delitel} × ${bezJednotiek(podiel)} = ${f(delitel * bezJednotiek(podiel))}. Koľko ešte zostáva do ${f(a)}?`
      : `Koľkokrát sa ${delitel} zmestí do ${f(a)}? Hľadáme číslo, pre ktoré ${delitel} × ? = ${f(a)}.`,
  };
}

function dvaKroky(r, a, b, c, plus) {
  const s = a * b; const odp = plus ? s + c : s - c;
  return {
    op: plus ? '×+' : '×−', a, b, c, odpoved: odp,
    zadanie: `${a} × ${b} ${plus ? '+' : '−'} ${f(c)}`,
    napoveda: `Najprv násobenie: ${a} × ${b} = ?  Potom ${plus ? 'pripočítaj' : 'odčítaj'} ${f(c)}.`,
    vysvetlenie: `${a} × ${b} = ${f(s)}, potom ${f(s)} ${plus ? '+' : '−'} ${f(c)} = ${f(odp)}.`,
  };
}

function vytvorPriklad(r, u) {
  switch (u) {
    case 1: {
      const a = r.cislo(120, 899); const b = r.cislo(23, 98);
      return r.dalsie() < 0.5 ? scitanie(a, b) : odcitanie(a, b);
    }
    case 2: return r.dalsie() < 0.5 ? nasobenie(r.cislo(3, 9), r.cislo(3, 9)) : delenie(r.cislo(3, 9), r.cislo(3, 9));
    case 3: {
      if (r.dalsie() < 0.5) { const a = r.cislo(150, 799); return scitanie(a, r.cislo(120, 999 - a)); }
      const a = r.cislo(400, 999); return odcitanie(a, r.cislo(110, a - 100));
    }
    case 4: return nasobenie(r.cislo(13, 97), r.cislo(3, 9));
    case 5: { const d = r.cislo(3, 9); return delenie(d, r.cislo(Math.ceil(100 / d), Math.floor(999 / d))); }
    case 6: {
      const a = r.cislo(12, 49), b = r.cislo(3, 9), plus = r.dalsie() < 0.5;
      return dvaKroky(r, a, b, plus ? r.cislo(11, 99) : r.cislo(11, Math.min(99, a * b - 10)), plus);
    }
    case 7: return nasobenie(r.cislo(12, 49), r.cislo(11, 19));
    case 8: return nasobenie(r.cislo(112, 389), r.cislo(3, 9));
    case 9: return nasobenie(r.cislo(23, 89), r.cislo(21, 79));
    default: { // 10: a × b ± c × d
      const a = r.cislo(12, 39), b = r.cislo(11, 19), c = r.cislo(12, 29), d = r.cislo(3, 9);
      const s1 = a * b, s2 = c * d, plus = r.dalsie() < 0.5 || s1 <= s2;
      const odp = plus ? s1 + s2 : s1 - s2;
      return {
        op: 'dva', a, b, c, d, odpoved: odp,
        zadanie: `${a} × ${b} ${plus ? '+' : '−'} ${c} × ${d}`,
        napoveda: `Najprv obe násobenia: ${a} × ${b} = ?  a  ${c} × ${d} = ?  Potom ich ${plus ? 'sčítaj' : 'odčítaj'}.`,
        vysvetlenie: `${a} × ${b} = ${f(s1)}, ${c} × ${d} = ${f(s2)}, a ${f(s1)} ${plus ? '+' : '−'} ${f(s2)} = ${f(odp)}.`,
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
      data: { op: p.op, a: p.a, b: p.b, c: p.c, d: p.d },
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
