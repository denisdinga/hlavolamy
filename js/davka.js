// Denná dávka: poradie úloh a ich seed.
import { vytvorRng } from './rng.js';
import priklady from './typy/priklady.js';
import postupnosti from './typy/postupnosti.js';
import bludisko from './typy/bludisko.js';
import pamat from './typy/pamat.js';
import znamienka from './typy/znamienka.js';
import pyramida from './typy/pyramida.js';
import kazdodenne from './typy/kazdodenne.js';
import tvary from './typy/tvary.js';

export const TYPY = { priklady, postupnosti, bludisko, pamat, znamienka, pyramida, kazdodenne, tvary };

// 14 úloh, asi 10–15 minút, pestro zamiešané (vnuk: „same príklady je jednotvárne“, 2026-11-25):
// 2026-11-27: pribudli 2 geometrické úlohy (tvary) namiesto 1 príkladu a 1 znamienok (vnuk chcel geometriu).
// 3 príklady, 2 postupnosti, 2 pamäť, 1 znamienka, 2 každodenné počty, 2 tvary, 1 pyramída, 1 bludisko.
export const DAVKA = [
  'priklady', 'pamat', 'tvary', 'postupnosti', 'znamienka', 'kazdodenne', 'pyramida',
  'priklady', 'pamat', 'tvary', 'postupnosti', 'kazdodenne', 'priklady', 'bludisko',
];

// Prvé úrovne, kým backend nepošle iné. Stred stupnice; prispôsobovanie ich rýchlo doladí.
export const ZACIATOCNE_UROVNE = { priklady: 4, postupnosti: 5, bludisko: 5, pamat: 2, znamienka: 4, pyramida: 3, kazdodenne: 4, tvary: 4 };

export function ulohaDna(datum, poradie, urovne) {
  const typId = DAVKA[poradie];
  return vytvorUlohu(typId, `${datum}|${typId}|${poradie}`, urovne[typId] ?? 1);
}

// „Ešte jedna úloha“ po dávke — typy sa striedajú.
export function extraUloha(datum, k, urovne) {
  const poradieTypov = ['priklady', 'tvary', 'pamat', 'postupnosti', 'znamienka', 'kazdodenne', 'pyramida', 'bludisko'];
  const typId = poradieTypov[k % poradieTypov.length];
  return vytvorUlohu(typId, `${datum}|extra|${k}`, urovne[typId] ?? 1);
}

function vytvorUlohu(typId, seed, uroven) {
  const typ = TYPY[typId];
  return { typId, typ, uroven, uloha: typ.vytvor(vytvorRng(seed), uroven) };
}
