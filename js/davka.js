// Denná dávka: poradie úloh a ich seed.
import { vytvorRng } from './rng.js';
import priklady from './typy/priklady.js';
import postupnosti from './typy/postupnosti.js';
import bludisko from './typy/bludisko.js';

export const TYPY = { priklady, postupnosti, bludisko };

// 7 úloh, asi 5–10 minút. Začína sa ľahko (príklad), bludisko je odmena na koniec.
export const DAVKA = ['priklady', 'priklady', 'postupnosti', 'priklady', 'priklady', 'postupnosti', 'bludisko'];

// Prvé úrovne, kým backend nepošle iné. Radšej ľahšie — úspech je dôležitejší.
export const ZACIATOCNE_UROVNE = { priklady: 3, postupnosti: 1, bludisko: 1 };

export function ulohaDna(datum, poradie, urovne) {
  const typId = DAVKA[poradie];
  return vytvorUlohu(typId, `${datum}|${typId}|${poradie}`, urovne[typId] ?? 1);
}

// „Ešte jedna úloha“ po dávke — typy sa striedajú.
export function extraUloha(datum, k, urovne) {
  const poradieTypov = ['priklady', 'postupnosti', 'bludisko'];
  const typId = poradieTypov[k % poradieTypov.length];
  return vytvorUlohu(typId, `${datum}|extra|${k}`, urovne[typId] ?? 1);
}

function vytvorUlohu(typId, seed, uroven) {
  const typ = TYPY[typId];
  return { typId, typ, uroven, uloha: typ.vytvor(vytvorRng(seed), uroven) };
}
