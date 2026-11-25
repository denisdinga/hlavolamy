// Typ úlohy: Číselná pyramída — každá tehla je súčet dvoch tehál pod ňou.
// Niektoré tehly sú prázdne, dedko vypočíta tehlu s otáznikom (niekedy treba aj odčítať).
//
// Úrovne (počet tehál v základe, najväčšie číslo v základe, typ):
//  1 3/9 vrchol      2 3/20 vrchol    3 4/10 vrchol    4 4/20 vrchol
//  5 3/20 zmiešané   6 4/15 zmiešané  7 4/25 zmiešané  8 5/10 zmiešané  9 5/15 zmiešané  10 5/20 zmiešané
// „Vrchol“: celý základ je daný, hľadá sa vrchol. „Zmiešané“: dané sú rôzne tehly, hľadaná tehla
// môže byť kdekoľvek — treba počítať aj dozadu (odčítaním). Riešenie je vždy jednoznačné.

const UROVNE = [[3, 9, 0], [3, 20, 0], [4, 10, 0], [4, 20, 0], [3, 20, 1], [4, 15, 1], [4, 25, 1], [5, 10, 1], [5, 15, 1], [5, 20, 1]];

import { zobrazCiselnuUlohu, POLICKO } from '../klavesnica.js';
import { formatuj } from '../rng.js';

// riadky[0] = základ, riadky[n-1] = vrchol
export function postavPyramidu(zaklad) {
  const riadky = [zaklad.slice()];
  while (riadky.at(-1).length > 1) {
    const r = riadky.at(-1);
    riadky.push(r.slice(1).map((x, i) => r[i] + x));
  }
  return riadky;
}

// Koeficienty tehly (riadok, pozícia) vzhľadom na tehly základu (binomické).
function koeficienty(n, riadok, poz) {
  let v = Array(n).fill(0); v[poz] = 1;
  // tehla v riadku r na pozícii p = súčet tehál základu p..p+r s binomickými váhami
  v = Array(n).fill(0);
  const binom = [1];
  for (let i = 0; i < riadok; i++) { binom.push(0); for (let j = binom.length - 1; j > 0; j--) binom[j] += binom[j - 1]; }
  binom.forEach((b, j) => { v[poz + j] = b; });
  return v;
}

// Je cieľ jednoznačne určený danými tehlami? (cieľový vektor leží v lineárnom obale daných)
export function jeUrceny(n, dane, ciel) {
  const riadky = dane.map(([r, p]) => koeficienty(n, r, p));
  const t = koeficienty(n, ciel[0], ciel[1]);
  const hodnost = (m) => {
    const a = m.map(x => x.slice()); let h = 0;
    for (let c = 0; c < n && h < a.length; c++) {
      let piv = a.findIndex((x, i) => i >= h && Math.abs(x[c]) > 1e-9);
      if (piv < 0) continue;
      [a[h], a[piv]] = [a[piv], a[h]];
      for (let i = 0; i < a.length; i++) if (i !== h) { const f = a[i][c] / a[h][c]; for (let j = 0; j < n; j++) a[i][j] -= f * a[h][j]; }
      h++;
    }
    return h;
  };
  return hodnost(riadky) === hodnost([...riadky, t]);
}

export default {
  id: 'pyramida',
  nazov: 'Pyramída',
  urovne: 10,

  vytvor(rng, uroven) {
    const [n, max, zmiesane] = UROVNE[Math.min(10, Math.max(1, uroven)) - 1];
    const zaklad = Array.from({ length: n }, () => rng.cislo(1, max));
    const riadky = postavPyramidu(zaklad);
    const vsetky = riadky.flatMap((r, ri) => r.map((_, p) => [ri, p]));
    let dane, ciel;
    if (!zmiesane) {
      dane = zaklad.map((_, p) => [0, p]);
      ciel = [n - 1, 0];
    } else {
      for (let pokus = 0; pokus < 400; pokus++) {
        const zamiesane = rng.zamiesaj(vsetky);
        ciel = zamiesane[0];
        dane = zamiesane.slice(1, n + 1);
        // aspoň jedna daná tehla mimo základu → treba počítať aj odčítaním
        if (dane.every(([r]) => r === 0)) continue;
        if (ciel[0] === n - 1 && dane.filter(([r]) => r === 0).length === n) continue;
        if (jeUrceny(n, dane, ciel)) break;
        dane = null;
      }
      if (!dane) { dane = zaklad.map((_, p) => [0, p]); ciel = [n - 1, 0]; }
    }
    const odpoved = riadky[ciel[0]][ciel[1]];
    return {
      zadanie: `Pyramída so základom ${n}`,
      odpoved,
      napoveda: 'Každá tehla je súčet dvoch tehál priamo pod ňou. Ak poznáš tehlu hore a jednu dole, druhú dostaneš odčítaním.',
      vysvetlenie: 'Celá pyramída zdola: ' + riadky.map(r => r.map(formatuj).join(', ')).join(' | ') + '.',
      data: { n, riadky, dane, ciel },
    };
  },

  over(uloha, vstup) { return String(vstup ?? '').replace(/\s/g, '') === String(uloha.odpoved); },

  zobraz(kontajner, uloha, priOdpovedi) {
    const { n, riadky, dane, ciel } = uloha.data;
    const jeDana = (r, p) => dane.some(([a, b]) => a === r && b === p);
    let html = '<span class="pyramida">';
    for (let r = n - 1; r >= 0; r--) {
      html += '<span class="pyr-riadok">';
      for (let p = 0; p < riadky[r].length; p++) {
        if (r === ciel[0] && p === ciel[1]) html += `<span class="tehla ciel-tehla">${POLICKO}</span>`;
        else html += `<span class="tehla${jeDana(r, p) ? '' : ' prazdna-tehla'}">${jeDana(r, p) ? formatuj(riadky[r][p]) : ''}</span>`;
      }
      html += '</span>';
    }
    html += '</span>';
    return zobrazCiselnuUlohu(kontajner, {
      popis: 'Každá tehla je súčet dvoch pod ňou. Ktoré číslo patrí na otáznik?',
      zadanieHtml: html,
    }, priOdpovedi);
  },
};
