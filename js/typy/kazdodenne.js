// Typ úlohy: Každodenné počty — nákup (eurá a centy) a čas (cestovné poriadky).
// Odpoveď sa píše s čiarkou (2,36) alebo dvojbodkou (14:25). Polovica úloh peniaze, polovica čas.
//
// Úrovne:
//  peniaze: 1–2 celé eurá, 1–2 položky · 3–5 ceny po 10 centoch, 2–3 položky · 6–8 ľubovoľné centy, 3 položky
//           a kusy („3 rožky po 0,15 €“) · 9–10 4 položky s kusmi
//  čas:     1–2 celé hodiny / polhodiny · 3–5 päťminútové kroky cez celú hodinu · 6–8 ľubovoľné minúty
//           · 9–10 aj dozadu („prišiel o…, cesta trvala…, kedy odišiel?“)

// názov v akuzatíve („kúpiš chlieb, kávu, šunku…“)
import { zobrazCiselnuUlohu } from '../klavesnica.js';

const TOVAR = [
  ['chlieb', 120, 260], ['mlieko', 59, 129], ['maslo', 149, 289], ['jogurt', 35, 89], ['syr', 189, 399],
  ['kávu', 349, 699], ['cukor', 79, 139], ['jablká', 99, 249], ['šunku', 199, 459], ['vajcia', 179, 329],
];
// [2–4 kusy, 5 a viac kusov, cena od, cena do]
const KUSY = [['rožky', 'rožkov', 9, 19], ['žemle', 'žemlí', 12, 25], ['banány', 'banánov', 20, 45], ['pomaranče', 'pomarančov', 30, 69]];
// Každá situácia má vlastnú vetu (dopredu aj dozadu) a najdlhšie realistické trvanie v minútach.
const UDALOSTI = [
  { max: 600, dopredu: (z, d) => `Vlak odchádza o ${z} a cesta trvá ${d}. O koľkej príde do cieľa?`,
    dozadu: (k, d) => `Vlak prišiel do cieľa o ${k}. Cesta trvala ${d}. O koľkej odchádzal?` },
  { max: 600, dopredu: (z, d) => `Autobus odchádza o ${z} a cesta trvá ${d}. O koľkej prídeš?`,
    dozadu: (k, d) => `Autobus prišiel do cieľa o ${k}. Cesta trvala ${d}. O koľkej odchádzal?` },
  { max: 600, dopredu: (z, d) => `Výlet sa začína o ${z} a potrvá ${d}. O koľkej sa skončí?`,
    dozadu: (k, d) => `Výlet sa skončil o ${k} a trval ${d}. O koľkej sa začal?` },
  { max: 200, dopredu: (z, d) => `Film v televízii sa začína o ${z} a trvá ${d}. O koľkej sa skončí?`,
    dozadu: (k, d) => `Film v televízii sa skončil o ${k} a trval ${d}. O koľkej sa začal?` },
  { max: 120, dopredu: (z, d) => `Návšteva u lekára sa začína o ${z} a potrvá ${d}. O koľkej sa skončí?`,
    dozadu: (k, d) => `Návšteva u lekára sa skončila o ${k} a trvala ${d}. O koľkej sa začala?` },
  { max: 90, dopredu: (z, d) => `Omša sa začína o ${z} a trvá ${d}. O koľkej sa skončí?`,
    dozadu: (k, d) => `Omša sa skončila o ${k} a trvala ${d}. O koľkej sa začala?` },
];

export const eura = (centy) => `${Math.floor(centy / 100)},${String(centy % 100).padStart(2, '0')} €`;
export const cas = (min) => { const m = ((min % 1440) + 1440) % 1440; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
const trvanie = (min) => [Math.floor(min / 60) ? `${Math.floor(min / 60)} h` : '', min % 60 ? `${min % 60} min` : ''].filter(Boolean).join(' ');

// vstup → centy / minúty (null ak sa nedá prečítať)
export function naCenty(t) {
  const s = String(t ?? '').replace(/[\s€]/g, '').replace('.', ',');
  if (!/^\d+(,\d{1,2})?$/.test(s)) return null;
  const [e, c = '0'] = s.split(',');
  return parseInt(e, 10) * 100 + parseInt(c.padEnd(2, '0'), 10);
}
export function naMinuty(t) {
  const s = String(t ?? '').replace(/\s/g, '').replace('.', ':');
  let h, m;
  if (/^\d{1,2}:\d{2}$/.test(s)) [h, m] = s.split(':').map(Number);
  else if (/^\d{3,4}$/.test(s)) { h = Math.floor(+s / 100); m = +s % 100; }
  else if (/^\d{1,2}$/.test(s)) { h = +s; m = 0; }
  else return null;
  return h < 24 && m < 60 ? h * 60 + m : null;
}

function peniaze(r, u) {
  const centyKrok = u <= 2 ? 100 : u <= 5 ? 10 : 1;
  const pocet = u <= 2 ? r.cislo(1, 2) : u <= 5 ? r.cislo(2, 3) : u <= 8 ? 3 : 4;
  const sKusmi = u >= 6;
  const polozky = [];
  const tovar = r.zamiesaj(TOVAR);
  for (let i = 0; i < pocet; i++) {
    if (sKusmi && i === pocet - 1) {
      const [mn24, mn5, od, po] = r.vyber(KUSY);
      const ks = r.cislo(3, 8), cena = r.cislo(od, po);
      polozky.push({ text: `${ks} ${ks <= 4 ? mn24 : mn5} po ${eura(cena)}`, spolu: ks * cena });
    } else {
      const [mn, od, po] = tovar[i];
      let cena = Math.round(r.cislo(od, po) / centyKrok) * centyKrok;
      if (cena === 0) cena = centyKrok;
      polozky.push({ text: `${mn} za ${eura(cena)}`, spolu: cena });
    }
  }
  const sucet = polozky.reduce((a, p) => a + p.spolu, 0);
  const bankovka = [500, 1000, 2000, 5000].find(b => b > sucet) ?? 10000;
  const vydavok = bankovka - sucet;
  const zoznam = polozky.map(p => p.text);
  const textZoznam = zoznam.length > 1 ? zoznam.slice(0, -1).join(', ') + ' a ' + zoznam.at(-1) : zoznam[0];
  return {
    zadanie: `V obchode kúpiš ${textZoznam}. Platíš ${eura(bankovka)}. Koľko ti vrátia?`,
    odpoved: vydavok,
    odpovedText: eura(vydavok).replace('\u00a0€', ''),
    napoveda: `Najprv sčítaj, koľko stojí celý nákup${sKusmi ? ' (kusy vynásob cenou)' : ''}. Potom to odčítaj od ${eura(bankovka)}.`,
    vysvetlenie: `Nákup stojí ${eura(sucet)}, ${eura(bankovka)} − ${eura(sucet)} = ${eura(vydavok)}.`,
    data: { druh: 'peniaze', polozky: polozky.map(p => p.spolu), bankovka },
    extra: ',',
  };
}

function casUloha(r, u) {
  const krok = u <= 2 ? 30 : u <= 5 ? 5 : 1;
  const zaciatok = Math.round(r.cislo(6 * 60, 18 * 60) / krok) * krok;
  let dlzka = u <= 2 ? r.cislo(1, 6) * 30 : u <= 5 ? r.cislo(7, 40) * 5 : r.cislo(25, 290);
  if (u >= 3 && u <= 5 && (zaciatok % 60) + (dlzka % 60) < 60) dlzka += 60 - (zaciatok % 60); // prechod cez celú hodinu
  const udalost = r.vyber(UDALOSTI.filter(x => x.max >= dlzka));
  const dozadu = u >= 9 && r.dalsie() < 0.5;
  if (dozadu) {
    const prichod = zaciatok + dlzka;
    return {
      zadanie: udalost.dozadu(cas(prichod), trvanie(dlzka)),
      odpoved: zaciatok, odpovedText: cas(zaciatok),
      napoveda: `Odpočítaj od ${cas(prichod)} najprv hodiny, potom minúty.`,
      vysvetlenie: `${cas(prichod)} − ${trvanie(dlzka)} = ${cas(zaciatok)}.`,
      data: { druh: 'cas', zaciatok: prichod, dlzka: -dlzka }, extra: ':',
    };
  }
  const koniec = zaciatok + dlzka;
  return {
    zadanie: udalost.dopredu(cas(zaciatok), trvanie(dlzka)),
    odpoved: koniec, odpovedText: cas(koniec),
    napoveda: `Pripočítaj k ${cas(zaciatok)} najprv hodiny, potom minúty. Hodina má 60 minút.`,
    vysvetlenie: `${cas(zaciatok)} + ${trvanie(dlzka)} = ${cas(koniec)}.`,
    data: { druh: 'cas', zaciatok, dlzka }, extra: ':',
  };
}

export default {
  id: 'kazdodenne',
  nazov: 'Každodenné počty',
  urovne: 10,

  vytvor(rng, uroven) {
    const u = Math.min(10, Math.max(1, uroven));
    return rng.dalsie() < 0.5 ? peniaze(rng, u) : casUloha(rng, u);
  },

  over(uloha, vstup) {
    if (uloha.data.druh === 'peniaze') return naCenty(vstup) === uloha.odpoved;
    return naMinuty(vstup) === ((uloha.odpoved % 1440) + 1440) % 1440;
  },

  zobraz(kontajner, uloha, priOdpovedi) {
    const jePeniaze = uloha.data.druh === 'peniaze';
    return zobrazCiselnuUlohu(kontajner, {
      popis: uloha.zadanie,
      zadanieHtml: `<span class="vyraz">${jePeniaze ? 'Vrátia:' : 'Čas:'}</span> ${'<span class="odpoved prazdna" aria-label="Tvoja odpoveď"> </span>'}${jePeniaze ? '<span class="vyraz">€</span>' : ''}`,
      extra: uloha.extra,
      maxZnakov: jePeniaze ? 6 : 5,
    }, priOdpovedi);
  },
};
