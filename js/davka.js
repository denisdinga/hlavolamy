// Denná dávka: poradie úloh a ich seed.
import { vytvorRng } from './rng.js';
import priklady from './typy/priklady.js';
import postupnosti from './typy/postupnosti.js';
import bludisko from './typy/bludisko.js';

export const TYPY = { priklady, postupnosti, bludisko };

// 14 úloh, asi 15 minút: 8 príkladov, 4 postupnosti, 2 bludiská (v polovici a na konci).
export const DAVKA = [
  'priklady', 'priklady', 'postupnosti', 'priklady', 'postupnosti', 'priklady', 'bludisko',
  'priklady', 'postupnosti', 'priklady', 'priklady', 'postupnosti', 'priklady', 'bludisko',
];

// Prvé úrovne, kým backend nepošle iné. Stred stupnice; prispôsobovanie ich rýchlo doladí.
export const ZACIATOCNE_UROVNE = { priklady: 4, postupnosti: 5, bludisko: 5 };

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
