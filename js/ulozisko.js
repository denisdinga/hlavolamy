// Ukladanie v prehliadači + odosielanie výsledkov na backend.
// Odoslanie zlyhá ticho; neodoslané výsledky sa skúsia znova pri ďalšom otvorení.
import { BACKEND_URL, VERZIA } from './nastavenia.js';
import { ZACIATOCNE_UROVNE } from './davka.js';

const K = { hrac: 'hl.hrac', urovne: 'hl.urovne', den: 'hl.den', fronta: 'hl.fronta' };

const citaj = (k, predvolene) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? predvolene; } catch { return predvolene; }
};
const zapis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* plné/zakázané */ } };

export function dnes() {
  const p = new URLSearchParams(location.search).get('t'); // iba na testovanie
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Parametre z odkazu v e-maile: h=hráč, k=kľúč, o=oslovenie, u=úrovne (typ:číslo,…), d=dátum úrovní
export function nacitajZOdkazu() {
  const p = new URLSearchParams(location.search);
  const hrac = citaj(K.hrac, { h: 'h1', k: '', o: 'dedko' });
  if (p.get('h')) hrac.h = p.get('h').slice(0, 40);
  if (p.get('k')) hrac.k = p.get('k').slice(0, 80);
  if (p.get('o')) hrac.o = p.get('o').slice(0, 30);
  zapis(K.hrac, hrac);

  const ulozene = citaj(K.urovne, { ...ZACIATOCNE_UROVNE, _datum: '' });
  const u = p.get('u');
  const d = p.get('d') || '';
  if (u && d >= (ulozene._datum || '')) {
    const nove = { ...ulozene, _datum: d };
    for (const kus of u.split(',')) {
      const [typ, cislo] = kus.split(':');
      const n = parseInt(cislo, 10);
      if (typ in ZACIATOCNE_UROVNE && n >= 1 && n <= 10) nove[typ] = n;
    }
    zapis(K.urovne, nove);
  } else if (!localStorage.getItem(K.urovne)) {
    zapis(K.urovne, ulozene);
  }
  return { hrac, urovne: citaj(K.urovne, ulozene) };
}

export function stavDna(datum) {
  const s = citaj(K.den, null);
  return s && s.datum === datum ? s : { datum, hotove: [], extra: 0 };
}
export const ulozStavDna = (s) => zapis(K.den, s);

export function pridajDoFronty(zaznam) {
  const f = citaj(K.fronta, []);
  if (!f.some(z => z.id === zaznam.id)) f.push({ ...zaznam, verzia: VERZIA });
  zapis(K.fronta, f.slice(-500));
}

let odosiela = false;
export async function odosli(kluc) {
  if (!BACKEND_URL || odosiela) return;
  const f = citaj(K.fronta, []);
  if (!f.length) return;
  odosiela = true;
  try {
    await fetch(BACKEND_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script; odpoveď nečítame, duplicity rieši backend podľa id
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ k: kluc, zaznamy: f }),
    });
    const zostatok = citaj(K.fronta, []).filter(z => !f.some(o => o.id === z.id));
    zapis(K.fronta, zostatok);
  } catch { /* bez siete — skúsime nabudúce */ }
  finally { odosiela = false; }
}
