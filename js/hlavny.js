// Priebeh dňa: úvod → 7 úloh → záver (+ voliteľne „Ešte jedna úloha“).
import { DAVKA, ulohaDna, extraUloha } from './davka.js';
import { dnes, nacitajZOdkazu, stavDna, ulozStavDna, pridajDoFronty, odosli } from './ulozisko.js';
import { formatuj } from './rng.js';

const obsah = document.getElementById('obsah');
const bodky = document.getElementById('bodky');
const datumEl = document.getElementById('datum');

const datum = dnes();
const { hrac, urovne } = nacitajZOdkazu();
let stav = stavDna(datum);

const velke = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// oslovenie prichádza z odkazu → nikdy ho nevkladať ako HTML
const bezpecne = (s) => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
hrac.o = bezpecne(hrac.o);

function nastavDatum() {
  const [r, m, d] = datum.split('-').map(Number);
  const text = new Date(r, m - 1, d).toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' });
  datumEl.textContent = velke(text);
}

function kresliBodky(aktualna) {
  bodky.innerHTML = DAVKA.map((_, i) => {
    const c = i < stav.hotove.length ? 'bodka hotova' : i === aktualna ? 'bodka aktualna' : 'bodka';
    return `<span class="${c}"></span>`;
  }).join('');
  bodky.setAttribute('aria-label', `Hotové ${Math.min(stav.hotove.length, DAVKA.length)} z ${DAVKA.length} úloh`);
}

function uvod() {
  kresliBodky(-1);
  const rozrobene = stav.hotove.length > 0;
  obsah.innerHTML = `
    <section class="obrazovka uvod">
      <h1>Ahoj, ${hrac.o}!</h1>
      <p class="veta">${rozrobene
        ? `Dnes už máš hotové ${stav.hotove.length} z ${DAVKA.length} úloh. Poďme dokončiť zvyšok.`
        : `Dnes ťa čaká ${DAVKA.length} úloh: príklady, číselné rady, pamäť, znamienka, nákup a čas, pyramída a bludisko. Je to asi na 10 minút.`}</p>
      <button type="button" class="tl tl-hlavne" id="zacat">${rozrobene ? 'Pokračovať' : 'Začať'}</button>
    </section>`;
  document.getElementById('zacat').addEventListener('click', () => dalsia());
}

function zaver() {
  kresliBodky(-1);
  const prve = stav.hotove.filter(h => !h.extra && h.vysledok === 'prvy').length;
  obsah.innerHTML = `
    <section class="obrazovka zaver">
      <h1>Hotovo na dnes.</h1>
      <p class="veta">${prve >= DAVKA.length * 0.7 ? 'Výborná práca' : 'Dobrá práca'}, ${hrac.o}. Zajtra ráno prídu nové úlohy.</p>
      <button type="button" class="tl tl-druhotne" id="extra">Ešte jedna úloha</button>
    </section>`;
  document.getElementById('extra').addEventListener('click', () => {
    const k = stav.extra;
    hrajUlohu(extraUloha(datum, k, urovne), { extra: true, poradie: DAVKA.length + k });
  });
}

function dalsia() {
  const i = stav.hotove.filter(h => !h.extra).length;
  if (i >= DAVKA.length) return zaver();
  kresliBodky(i);
  hrajUlohu(ulohaDna(datum, i, urovne), { extra: false, poradie: i });
}

function hrajUlohu({ typId, typ, uroven, uloha }, { extra, poradie }) {
  obsah.innerHTML = `
    <section class="obrazovka uloha">
      <div id="plocha"></div>
      <div class="dalej-obal"><button type="button" class="tl tl-hlavne" id="dalej" hidden>Ďalej</button></div>
    </section>`;
  const plocha = document.getElementById('plocha');
  const dalej = document.getElementById('dalej');
  const zaciatok = Date.now();
  let pokus = 1;

  const ukonci = (vysledok) => {
    const zaznam = {
      id: `${hrac.h}|${datum}|${poradie}`, hrac: hrac.h, datum, typ: typId, uroven,
      vysledok, sekundy: Math.min(1800, Math.round((Date.now() - zaciatok) / 1000)), poradie, extra,
    };
    stav.hotove.push({ poradie, vysledok, extra });
    if (extra) stav.extra++;
    ulozStavDna(stav);
    pridajDoFronty(zaznam);
    odosli(hrac.k);
    if (!extra) kresliBodky(-1);
    dalej.hidden = false;
    dalej.textContent = extra ? 'Späť' : (stav.hotove.filter(h => !h.extra).length >= DAVKA.length ? 'Dokončiť' : 'Ďalej');
    dalej.focus({ preventScroll: true });
    dalej.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  dalej.addEventListener('click', () => (extra ? zaver() : dalsia()));

  const ovladanie = typ.zobraz(plocha, uloha, (vstup) => {
    if (typ.vysledok) { // bludisko
      const v = typ.vysledok(vstup);
      if (v !== 'ukazane') ovladanie.spravne(v === 'prvy' ? 'Výborne!' : 'Správne.');
      return ukonci(v);
    }
    if (typ.over(uloha, vstup)) {
      ovladanie.spravne(pokus === 1 ? 'Správne.' : 'Správne, teraz to sedí.');
      return ukonci(pokus === 1 ? 'prvy' : 'druhy');
    }
    if (pokus === 1) {
      pokus = 2;
      ovladanie.napoveda('Skúsme ešte raz.', uloha.napoveda);
      return;
    }
    ovladanie.ukazOdpoved(uloha.odpovedText ?? formatuj(uloha.odpoved), uloha.vysvetlenie);
    ukonci('ukazane');
  });
}

nastavDatum();
odosli(hrac.k);
if (stav.hotove.filter(h => !h.extra).length >= DAVKA.length) zaver(); else uvod();
