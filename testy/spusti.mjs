// Testy generátorov úloh. Spúšťa sa: node app/testy/spusti.mjs
// Bez knižníc. Každá správna odpoveď sa overuje NEZÁVISLE od generátora.
import { vytvorRng, formatuj, naCislo } from '../js/rng.js';
import priklady from '../js/typy/priklady.js';
import postupnosti from '../js/typy/postupnosti.js';
import bludisko, { najdiCestu, susedia } from '../js/typy/bludisko.js';
import { DAVKA, TYPY, ulohaDna, ZACIATOCNE_UROVNE } from '../js/davka.js';
import pamat from '../js/typy/pamat.js';
import znamienka, { vsetkyKombinacie } from '../js/typy/znamienka.js';
import pyramida, { postavPyramidu } from '../js/typy/pyramida.js';
import kazdodenne, { naCenty, naMinuty } from '../js/typy/kazdodenne.js';

const SEEDOV = 300;
let chyb = 0, kontrol = 0;
const chyby = [];
function over(podmienka, popis) {
  kontrol++;
  if (!podmienka) { chyb++; if (chyby.length < 25) chyby.push(popis); }
}
const seedy = (typ, u) => Array.from({ length: SEEDOV }, (_, i) => `test|${typ}|${u}|${i}`);
const celeNezaporne = (x) => Number.isInteger(x) && x >= 0;

// ---------- Spoločné ----------
for (const [id, typ] of Object.entries(TYPY)) {
  over(typ.id === id, `${id}: id sedí s kľúčom`);
  over(typ.urovne === 10, `${id}: 10 úrovní`);
  for (let u = 1; u <= 10; u++) {
    const a = JSON.stringify(typ.vytvor(vytvorRng(`det|${u}`), u));
    const b = JSON.stringify(typ.vytvor(vytvorRng(`det|${u}`), u));
    over(a === b, `${id} u${u}: determinizmus`);
  }
}

// ---------- Príklady ----------
// Nezávislý výpočet: parsuje text zadania, nie dáta generátora.
function vypocitajZadanie(text) {
  const t = text.replace(/[ \s]/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!/^[\d+\-*/]+$/.test(t)) return NaN;
  const tokeny = t.match(/\d+|[+\-*/]/g);
  // najprv * a /, potom + a −
  const st = [Number(tokeny[0])]; const ops = [];
  for (let i = 1; i < tokeny.length; i += 2) {
    const op = tokeny[i], n = Number(tokeny[i + 1]);
    if (op === '*') st.push(st.pop() * n);
    else if (op === '/') st.push(st.pop() / n);
    else { ops.push(op); st.push(n); }
  }
  let v = st[0];
  ops.forEach((op, i) => { v = op === '+' ? v + st[i + 1] : v - st[i + 1]; });
  return v;
}
const ROZSAH = { 1: 999, 2: 81, 3: 999, 4: 873, 5: 333, 6: 540, 7: 931, 8: 3501, 9: 7031, 10: 1012 };
for (let u = 1; u <= 10; u++) {
  for (const s of seedy('pr', u)) {
    const ul = priklady.vytvor(vytvorRng(s), u);
    const nez = vypocitajZadanie(ul.zadanie);
    const p = `priklady u${u} ${s} „${ul.zadanie}“`;
    over(nez === ul.odpoved, `${p}: odpoveď ${ul.odpoved} ≠ nezávislý výpočet ${nez}`);
    over(celeNezaporne(ul.odpoved) && ul.odpoved > 0, `${p}: výsledok kladné celé číslo`);
    over(ul.odpoved <= ROZSAH[u], `${p}: výsledok ${ul.odpoved} v rozsahu úrovne (≤ ${ROZSAH[u]})`);
    over(priklady.over(ul, String(ul.odpoved)), `${p}: over(správna)`);
    over(priklady.over(ul, ' 0' + ul.odpoved + ' '), `${p}: over toleruje medzery a nulu`);
    over(!priklady.over(ul, String(ul.odpoved + 1)), `${p}: over(zlá) = false`);
    over(typeof ul.napoveda === 'string' && ul.napoveda.length > 10, `${p}: nápoveda`);
    over(!/NaN|undefined/.test(ul.zadanie + ul.napoveda + ul.vysvetlenie), `${p}: texty bez NaN/undefined`);
    const { op, a, b } = ul.data;
    if (op === '÷') over(a % b === 0, `${p}: delenie bez zvyšku`);
    if (u === 5) over(a >= 100 && a <= 999, `${p}: u5 delenec trojciferný`);
    if (u === 9) over(a >= 10 && b >= 10, `${p}: u9 dvojciferné × dvojciferné`);
  }
}

// ---------- Postupnosti ----------
// Bežné pravidlá, ktoré by mohol človek „vidieť“. Ak niektoré sedí na všetkých ukázaných
// číslach, musí predpovedať rovnaké pokračovanie — inak je úloha dvojznačná.
const dif = (t) => t.slice(1).map((x, i) => x - t[i]);
const PRAVIDLA = {
  aritmeticke: (t) => { const d = dif(t); return d.every(x => x === d[0]) ? t.at(-1) + d[0] : null; },
  geometricke: (t) => {
    if (t.some(x => x === 0)) return null;
    const r = t[1] / t[0];
    if (!t.every((x, i) => i === 0 || x === t[i - 1] * r)) return null;
    const n = t.at(-1) * r; return Number.isInteger(n) ? n : null;
  },
  kvadraticke: (t) => { const d = dif(t), d2 = dif(d); return d2.every(x => x === d2[0]) ? t.at(-1) + d.at(-1) + d2[0] : null; },
  striedaveRozdiely: (t) => { const d = dif(t); return d.every((x, i) => i < 2 || x === d[i - 2]) ? t.at(-1) + d.at(-2) : null; },
  zapletene: (t) => {
    if (t.length < 5) return null;
    const ok = t.every((x, i) => i < 4 || x - t[i - 2] === t[i - 2] - t[i - 4]);
    return ok ? t.at(-2) + (t.at(-2) - t.at(-4)) : null;
  },
  geometrickeRozdiely: (t) => { const d = dif(t); if (d[0] === 0) return null; const q = d[1] / d[0]; return Number.isInteger(q) && d.every((x, i) => i === 0 || x === q * d[i - 1]) ? t.at(-1) + q * d.at(-1) : null; },
  fibonacci: (t) => t.every((x, i) => i < 2 || x === t[i - 1] + t[i - 2]) ? t.at(-1) + t.at(-2) : null,
};
for (let u = 1; u <= 10; u++) {
  for (const s of seedy('po', u)) {
    const ul = postupnosti.vytvor(vytvorRng(s), u);
    const t = ul.data.cleny;
    const p = `postupnosti u${u} ${s} [${t.join(', ')}] → ${ul.odpoved}`;
    over(t.length === 5 || t.length === 6, `${p}: počet ukázaných`);
    over(t.every(celeNezaporne) && celeNezaporne(ul.odpoved), `${p}: celé nezáporné čísla`);
    over(Math.max(...t, ul.odpoved) <= 6000, `${p}: rozumná veľkosť čísel`);
    over(new Set([...t, ul.odpoved]).size === t.length + 1, `${p}: bez opakujúcich sa čísel (vrátane odpovede)`);
    let sediace = 0;
    for (const [meno, f] of Object.entries(PRAVIDLA)) {
      const n = f(t);
      if (n === null) continue;
      sediace++;
      over(n === ul.odpoved, `${p}: DVOJZNAČNÉ — pravidlo „${meno}“ dáva ${n}`);
    }
    over(sediace >= 1, `${p}: aspoň jedno bežné pravidlo opisuje postupnosť`);
    over(postupnosti.over(ul, String(ul.odpoved)) && !postupnosti.over(ul, String(ul.odpoved + 1)), `${p}: over`);
    over(!/NaN|undefined/.test(ul.zadanie + ul.napoveda + ul.vysvetlenie), `${p}: texty`);
  }
}

// ---------- Bludisko ----------
const VELKOST = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
for (let u = 1; u <= 10; u++) {
  for (const s of seedy('bl', u).slice(0, 120)) {
    const ul = bludisko.vytvor(vytvorRng(s), u);
    const { n, bl, cesta } = ul.data;
    const p = `bludisko u${u} ${s}`;
    over(n === VELKOST[u - 1], `${p}: veľkosť`);
    // symetria stien a počet priechodov = n²−1 (strom)
    let hran = 0, sym = true;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      for (const [a, b] of susedia(bl, x, y)) {
        hran++;
        if (!susedia(bl, a, b).some(([c, d]) => c === x && d === y)) sym = false;
      }
    }
    over(sym, `${p}: steny symetrické`);
    over(hran / 2 === n * n - 1, `${p}: strom (práve jedna cesta medzi políčkami)`);
    // súvislosť: z (0,0) dosiahnem všetky políčka
    const videne = new Set(['0,0']); const rad = [[0, 0]];
    while (rad.length) { const [x, y] = rad.pop(); for (const [a, b] of susedia(bl, x, y)) { const k = `${a},${b}`; if (!videne.has(k)) { videne.add(k); rad.push([a, b]); } } }
    over(videne.size === n * n, `${p}: súvislé`);
    const nezavisla = najdiCestu(bl);
    over(JSON.stringify(nezavisla) === JSON.stringify(cesta), `${p}: uložená cesta je jediná cesta`);
    over(bludisko.over(ul, cesta), `${p}: over(správna cesta)`);
    over(!bludisko.over(ul, cesta.slice(0, -1)), `${p}: over(nedokončená) = false`);
    over(!bludisko.over(ul, [[0, 0], [n - 1, n - 1]]), `${p}: over(skok) = false`);
    over(cesta.length >= n, `${p}: cesta aspoň n políčok`);
  }
}
over(bludisko.vysledok({ pomoci: 0 }) === 'prvy' && bludisko.vysledok({ pomoci: 1 }) === 'druhy' && bludisko.vysledok({ pomoci: 2 }) === 'ukazane', 'bludisko: výsledok podľa pomocí');

// ---------- Zapamätaj si ----------
const PAMAT_DLZKA = [4, 5, 6, 4, 7, 5, 8, 6, 9, 7];
for (let u = 1; u <= 10; u++) for (const sd of seedy('pa', u)) {
  const ul = pamat.vytvor(vytvorRng(sd), u); const p = `pamat u${u} ${sd}`;
  const { cisla, pospiatky } = ul.data;
  over(cisla.length === PAMAT_DLZKA[u - 1], `${p}: počet číslic`);
  over(cisla[0] !== 0 && cisla.every((c, i) => i === 0 || c !== cisla[i - 1]), `${p}: prvá nie je 0, susedné sa neopakujú`);
  const nez = (pospiatky ? [...cisla].reverse() : cisla).join('');
  over(nez === ul.odpoved && pamat.over(ul, nez) && !pamat.over(ul, nez.slice(1)), `${p}: odpoveď a over`);
  over(pospiatky === [4, 6, 8, 10].includes(u), `${p}: pospiatky podľa úrovne`);
}

// ---------- Znamienka ----------
// nezávislý výpočet cez eval s × → *, ÷ → / (štandardné poradie)
const evalOps = (c, o) => { const e = c.map((x, i) => (i ? ({ '+': '+', '−': '-', '×': '*', '÷': '/' })[o[i - 1]] : '') + x).join(''); return Function(`return (${e})`)(); };
const ltrOps = (c, o) => o.reduce((v, op, i) => ({ '+': v + c[i + 1], '−': v - c[i + 1], '×': v * c[i + 1], '÷': v / c[i + 1] })[op], c[0]);
for (let u = 1; u <= 10; u++) for (const sd of seedy('zn', u).slice(0, 150)) {
  const ul = znamienka.vytvor(vytvorRng(sd), u); const p = `znamienka u${u} ${sd} ${ul.zadanie}`;
  const { cisla, vysledok, pocet } = ul.data; const ops = ul.odpoved.split('');
  over(ops.length === pocet && pocet === (u <= 3 ? 1 : u <= 7 ? 2 : 3), `${p}: počet znamienok`);
  over(evalOps(cisla, ops) === vysledok && ltrOps(cisla, ops) === vysledok, `${p}: sedí aj zľava doprava aj s poradím`);
  over(Number.isInteger(vysledok) && vysledok >= 0, `${p}: výsledok celý nezáporný`);
  const ine = vsetkyKombinacie(pocet).filter(c => c.join('') !== ul.odpoved && (Math.abs(evalOps(cisla, c) - vysledok) < 1e-9 || Math.abs(ltrOps(cisla, c) - vysledok) < 1e-9));
  over(ine.length === 0, `${p}: DVOJZNAČNÉ — aj ${ine.map(c => c.join('')).join(', ')}`);
  over(znamienka.over(ul, ul.odpoved) && !znamienka.over(ul, ops.map(o => o === '+' ? '−' : '+').join('')), `${p}: over`);
}

// ---------- Pyramída ----------
const PYR_ZAKLAD = [3, 3, 4, 4, 3, 4, 4, 5, 5, 5];
for (let u = 1; u <= 10; u++) for (const sd of seedy('py', u).slice(0, 150)) {
  const ul = pyramida.vytvor(vytvorRng(sd), u); const p = `pyramida u${u} ${sd}`;
  const { n, riadky, dane, ciel } = ul.data;
  over(n === PYR_ZAKLAD[u - 1], `${p}: veľkosť základu`);
  const nez = postavPyramidu(riadky[0]);
  over(JSON.stringify(nez) === JSON.stringify(riadky), `${p}: pyramída sedí (súčty)`);
  over(ul.odpoved === riadky[ciel[0]][ciel[1]], `${p}: odpoveď je hodnota cieľovej tehly`);
  over(!dane.some(([r, q]) => r === ciel[0] && q === ciel[1]), `${p}: cieľ nie je medzi danými`);
  // jednoznačnosť hrubou silou: iný základ (±1..3 v každej tehle) so zhodnými danými tehlami nesmie zmeniť cieľ
  if (n <= 4) {
    let ok = true; const zaklad = riadky[0];
    const posuny = [-3, -2, -1, 0, 1, 2, 3];
    const rek = (i, z) => {
      if (!ok) return;
      if (i === n) {
        const r2 = postavPyramidu(z);
        if (dane.every(([r, q]) => r2[r][q] === riadky[r][q]) && r2[ciel[0]][ciel[1]] !== ul.odpoved) ok = false;
        return;
      }
      for (const d of posuny) rek(i + 1, [...z, zaklad[i] + d]);
    };
    rek(0, []);
    over(ok, `${p}: jednoznačné (hrubá sila)`);
  }
  over(pyramida.over(ul, String(ul.odpoved)) && !pyramida.over(ul, String(ul.odpoved + 1)), `${p}: over`);
}

// ---------- Každodenné počty ----------
for (let u = 1; u <= 10; u++) for (const sd of seedy('kd', u)) {
  const ul = kazdodenne.vytvor(vytvorRng(sd), u); const p = `kazdodenne u${u} ${sd} „${ul.zadanie}“`;
  over(!/NaN|undefined/.test(ul.zadanie + ul.napoveda + ul.vysvetlenie + ul.odpovedText), `${p}: texty`);
  if (ul.data.druh === 'peniaze') {
    const sucet = ul.data.polozky.reduce((a, b) => a + b, 0);
    over(ul.odpoved === ul.data.bankovka - sucet && ul.odpoved > 0, `${p}: výdavok = bankovka − nákup`);
    // nezávisle aj z textu: všetky sumy „x,yy €“ v zadaní
    over(kazdodenne.over(ul, ul.odpovedText) && kazdodenne.over(ul, ul.odpovedText.replace(',', '.')), `${p}: over(správna)`);
    over(!kazdodenne.over(ul, String((ul.odpoved + 1) / 100).replace('.', ',')), `${p}: over(zlá)`);
    if (u <= 2) over(ul.odpoved % 100 === 0, `${p}: celé eurá`);
  } else {
    const ciel = ((ul.data.zaciatok + ul.data.dlzka) % 1440 + 1440) % 1440;
    over(naMinuty(ul.odpovedText) === ciel, `${p}: čas sedí`);
    over(kazdodenne.over(ul, ul.odpovedText) && !kazdodenne.over(ul, '0:01'), `${p}: over`);
    if (u <= 2) over(ul.data.dlzka % 30 === 0, `${p}: polhodiny`);
  }
}
over(naCenty('2,36') === 236 && naCenty('3') === 300 && naCenty('2,5') === 250 && naCenty('x') === null, 'naCenty');
over(naMinuty('14:05') === 845 && naMinuty('1405') === 845 && naMinuty('9') === 540 && naMinuty('25:00') === null, 'naMinuty');

// ---------- Dávka a pomocné ----------
over(DAVKA.length === 14, 'dávka má 14 úloh');
over(DAVKA.every(t => t in TYPY), 'dávka obsahuje iba známe typy');
for (let i = 0; i < 60; i++) {
  const d = `2026-12-${String((i % 28) + 1).padStart(2, '0')}`;
  const a = JSON.stringify(DAVKA.map((_, j) => ulohaDna(d, j, ZACIATOCNE_UROVNE).uloha));
  const b = JSON.stringify(DAVKA.map((_, j) => ulohaDna(d, j, ZACIATOCNE_UROVNE).uloha));
  over(a === b, `dávka ${d}: rovnaký deň = rovnaké úlohy`);
}
over(JSON.stringify(ulohaDna('2026-12-01', 0, ZACIATOCNE_UROVNE).uloha) !== JSON.stringify(ulohaDna('2026-12-02', 0, ZACIATOCNE_UROVNE).uloha), 'rôzne dni = rôzne úlohy');
over(formatuj(1250) === '1 250' && formatuj(999) === '999', 'formátovanie tisícok');
over(naCislo(' 012 ') === 12 && Number.isNaN(naCislo('1a')) && Number.isNaN(naCislo('')), 'naCislo');

console.log(`\nKontrol: ${kontrol}, chýb: ${chyb}`);
if (chyb) {
  console.log('\nPrvé chyby:');
  chyby.forEach(c => console.log(' ✗ ' + c));
  process.exit(1);
}
console.log('✓ Všetky testy prešli.');
