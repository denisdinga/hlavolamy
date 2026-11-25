// Typ úlohy: Bludisko — cesta zo štartu (vľavo hore) do cieľa (vpravo dole).
//
// Ovládanie (ako ceruzkou):
//  - ťahaj prstom alebo myšou — čiara ide za prstom, cez steny neprejde
//  - ťuk na políčko v rovnej chodbe od konca čiary — čiara sa tam natiahne
//  - ťuk na čiaru (alebo ťah späť) — čiara sa skráti
//  - na PC šípky
//
// Úrovne: veľkosť mriežky (nepárne úrovne pod 9 kratšia cesta, ostatné najdlhšia z 5)
//  1 6×6  2 7×7  3 8×8  4 8×8  5 9×9  6 10×10  7 10×10  8 11×11  9 12×12  10 12×12
//
// Bludisko je dokonalé (strom): medzi každými dvoma políčkami vedie práve jedna cesta.
// Výsledok: „prvy“ bez pomoci, „druhy“ po jednej pomoci, „ukazane“ keď sa ukázala celá cesta.

const VELKOST = [6, 7, 8, 8, 9, 10, 10, 11, 12, 12];
const SMERY = [[0, -1, 'h'], [1, 0, 'p'], [0, 1, 'd'], [-1, 0, 'l']]; // hore, vpravo, dole, vľavo
const OPACNY = { h: 'd', d: 'h', l: 'p', p: 'l' };

// Vytvorí bludisko n×n metódou „rekurzívneho návratu“ (iteratívne).
export function vytvorBludisko(rng, n) {
  const otvorene = Array.from({ length: n }, () => Array.from({ length: n }, () => new Set()));
  const navstivene = Array.from({ length: n }, () => Array(n).fill(false));
  const zasobnik = [[0, 0]];
  navstivene[0][0] = true;
  while (zasobnik.length) {
    const [x, y] = zasobnik[zasobnik.length - 1];
    const moznosti = SMERY.filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < n && ny < n && !navstivene[ny][nx];
    });
    if (!moznosti.length) { zasobnik.pop(); continue; }
    const [dx, dy, s] = rng.vyber(moznosti);
    const nx = x + dx, ny = y + dy;
    otvorene[y][x].add(s);
    otvorene[ny][nx].add(OPACNY[s]);
    navstivene[ny][nx] = true;
    zasobnik.push([nx, ny]);
  }
  return otvorene.map(riadok => riadok.map(s => [...s].sort().join('')));
}

export function susedia(bl, x, y) {
  const n = bl.length;
  return SMERY.filter(([, , s]) => bl[y][x].includes(s))
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n);
}

const suSusedia = (bl, [ax, ay], [bx, by]) => susedia(bl, ax, ay).some(([x, y]) => x === bx && y === by);

// Rovná chodba z bodu `od` do `ciel` (rovnaký riadok/stĺpec, bez steny) → zoznam políčok, inak null.
export function rovnaChodba(bl, od, ciel) {
  const [ox, oy] = od, [cx, cy] = ciel;
  if (ox !== cx && oy !== cy) return null;
  const dx = Math.sign(cx - ox), dy = Math.sign(cy - oy);
  const kroky = [];
  let p = od;
  while (p[0] !== cx || p[1] !== cy) {
    const q = [p[0] + dx, p[1] + dy];
    if (!suSusedia(bl, p, q)) return null;
    kroky.push(q); p = q;
  }
  return kroky;
}

export function najdiCestu(bl, od = [0, 0], ciel = [bl.length - 1, bl.length - 1]) {
  const n = bl.length;
  const kluc = ([x, y]) => y * n + x;
  const odkial = new Map([[kluc(od), null]]);
  const rad = [od];
  while (rad.length) {
    const p = rad.shift();
    if (p[0] === ciel[0] && p[1] === ciel[1]) break;
    for (const s of susedia(bl, p[0], p[1])) {
      if (!odkial.has(kluc(s))) { odkial.set(kluc(s), p); rad.push(s); }
    }
  }
  if (!odkial.has(kluc(ciel))) return null;
  const cesta = [];
  for (let p = ciel; p; p = odkial.get(kluc(p))) cesta.unshift(p);
  return cesta;
}

export default {
  id: 'bludisko',
  nazov: 'Bludisko',
  urovne: 10,

  vytvor(rng, uroven) {
    const u = Math.min(10, Math.max(1, uroven));
    const n = VELKOST[u - 1];
    const kandidati = Array.from({ length: 5 }, () => {
      const bl = vytvorBludisko(rng, n);
      return { bl, cesta: najdiCestu(bl) };
    }).sort((a, b) => a.cesta.length - b.cesta.length);
    const vybrany = (u % 2 === 1 && u < 9) ? kandidati[0] : kandidati[kandidati.length - 1];
    return {
      zadanie: `Bludisko ${n}×${n}`,
      odpoved: vybrany.cesta.length,
      napoveda: 'Ukázal som kúsok cesty.',
      vysvetlenie: 'Takto vedie cesta do cieľa.',
      data: { n, bl: vybrany.bl, cesta: vybrany.cesta },
    };
  },

  over(uloha, vstup) {
    const { bl, n } = uloha.data;
    const cesta = Array.isArray(vstup) ? vstup : vstup?.cesta;
    if (!Array.isArray(cesta) || !cesta.length) return false;
    const [sx, sy] = cesta[0];
    const [cx, cy] = cesta[cesta.length - 1];
    if (sx !== 0 || sy !== 0 || cx !== n - 1 || cy !== n - 1) return false;
    for (let i = 1; i < cesta.length; i++) if (!suSusedia(bl, cesta[i - 1], cesta[i])) return false;
    return true;
  },

  zobraz(kontajner, uloha, priOdpovedi) {
    const { n, bl, cesta: spravnaCesta } = uloha.data;
    kontajner.innerHTML = `
      <div class="bludisko-obal">
        <div class="list list-bludisko">
          <p class="popis">Veď čiaru zo štartu do cieľa — ťahaj prstom alebo myšou.</p>
          <div class="bludisko" style="--n:${n}" tabindex="0" aria-label="Bludisko ${n} krát ${n}. Šípkami sa hýbeš.">
            <svg class="ciara" aria-hidden="true"><polyline points=""/><circle r="0"/></svg>
          </div>
          <p class="spatna-vazba" role="status"></p>
        </div>
        <div class="bludisko-tlacidla">
          <button type="button" class="tl tl-druhotne" data-a="pomoc">Pomôž mi</button>
          <button type="button" class="tl tl-druhotne" data-a="znova">Začať odznova</button>
        </div>
      </div>`;
    const mriezka = kontajner.querySelector('.bludisko');
    const svg = mriezka.querySelector('svg');
    const ciara = svg.querySelector('polyline');
    const bodka = svg.querySelector('circle');
    const vazba = kontajner.querySelector('.spatna-vazba');
    const tlPomoc = kontajner.querySelector('[data-a="pomoc"]');

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const d = document.createElement('div');
        d.className = 'pole';
        const o = bl[y][x];
        for (const s of 'hpdl') if (!o.includes(s)) d.classList.add('s-' + s);
        if (x === 0 && y === 0) { d.classList.add('start'); d.innerHTML = '<span>Štart</span>'; }
        if (x === n - 1 && y === n - 1) { d.classList.add('ciel'); d.innerHTML = '<span>Cieľ</span>'; }
        mriezka.appendChild(d);
      }
    }

    let cesta = [[0, 0]];
    let pomoci = 0, hotovo = false, kreslim = false;

    const prekresli = () => {
      const r = mriezka.getBoundingClientRect();
      const s = r.width / n;
      svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      ciara.setAttribute('points', cesta.map(([x, y]) => `${(x + .5) * s},${(y + .5) * s}`).join(' '));
      ciara.style.strokeWidth = Math.max(8, s * 0.3) + 'px';
      const [kx, ky] = cesta[cesta.length - 1];
      bodka.setAttribute('cx', (kx + .5) * s); bodka.setAttribute('cy', (ky + .5) * s);
      bodka.setAttribute('r', Math.max(9, s * 0.3));
    };
    const koniec = () => cesta[cesta.length - 1];
    const jeV = ([x, y]) => cesta.findIndex(([a, b]) => a === x && b === y);
    const hlaska = (t, trieda = 'napoveda') => { vazba.className = 'spatna-vazba ' + trieda; vazba.textContent = t; };

    const dokonci = () => {
      hotovo = true; kreslim = false;
      tlPomoc.disabled = true;
      kontajner.querySelector('[data-a="znova"]').disabled = true;
      priOdpovedi({ cesta, pomoci });
    };
    const skontrolujCiel = () => { const [x, y] = koniec(); if (x === n - 1 && y === n - 1) dokonci(); };

    // Posun na políčko p: späť po čiare, susedné, alebo celá rovná chodba.
    const chodNa = (p, tuk) => {
      if (hotovo) return;
      const i = jeV(p);
      if (i >= 0) { cesta = cesta.slice(0, i + 1); vazba.textContent = ''; prekresli(); return; }
      const chodba = rovnaChodba(bl, koniec(), p);
      if (chodba) {
        for (const q of chodba) { const j = jeV(q); cesta = j >= 0 ? cesta.slice(0, j + 1) : [...cesta, q]; }
        vazba.textContent = ''; prekresli(); skontrolujCiel(); return;
      }
      if (tuk) hlaska('Tadiaľ to nejde — je tam stena. Pokračuj od konca čiary.');
    };

    const polickoZBodu = (e) => {
      const r = mriezka.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / (r.width / n));
      const y = Math.floor((e.clientY - r.top) / (r.height / n));
      return x >= 0 && y >= 0 && x < n && y < n ? [x, y] : null;
    };

    mriezka.addEventListener('pointerdown', (e) => {
      if (hotovo) return;
      const p = polickoZBodu(e); if (!p) return;
      e.preventDefault();
      mriezka.setPointerCapture(e.pointerId);
      kreslim = true;
      chodNa(p, true);
    });
    mriezka.addEventListener('pointermove', (e) => {
      if (!kreslim || hotovo) return;
      const p = polickoZBodu(e); if (!p) return;
      const [kx, ky] = koniec();
      if (p[0] === kx && p[1] === ky) return;
      chodNa(p, false);
    });
    const pusti = () => { kreslim = false; };
    mriezka.addEventListener('pointerup', pusti);
    mriezka.addEventListener('pointercancel', pusti);

    mriezka.addEventListener('keydown', (e) => {
      const smer = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (!smer || hotovo) return;
      e.preventDefault();
      const [kx, ky] = koniec();
      const p = [kx + smer[0], ky + smer[1]];
      if (suSusedia(bl, [kx, ky], p)) chodNa(p, false); else hlaska('Tadiaľ je stena.');
    });

    kontajner.querySelector('.bludisko-tlacidla').addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (!a || hotovo) return;
      if (a === 'znova') { cesta = [[0, 0]]; vazba.textContent = ''; prekresli(); return; }
      pomoci++;
      if (pomoci >= 2) {
        cesta = spravnaCesta.slice();
        hlaska('Toto je celá cesta do cieľa.', 'ukazana');
        prekresli();
        setTimeout(dokonci, 700);
        return;
      }
      let zhoda = 0;
      while (zhoda < cesta.length && zhoda < spravnaCesta.length &&
             cesta[zhoda][0] === spravnaCesta[zhoda][0] && cesta[zhoda][1] === spravnaCesta[zhoda][1]) zhoda++;
      const kroky = Math.max(3, Math.ceil(spravnaCesta.length / 3));
      cesta = spravnaCesta.slice(0, Math.min(spravnaCesta.length - 1, zhoda + kroky));
      hlaska('Ukázal som kúsok cesty. Pokračuj odtiaľto.');
      tlPomoc.textContent = 'Ukáž celú cestu';
      prekresli();
    });

    new ResizeObserver(prekresli).observe(mriezka);
    requestAnimationFrame(prekresli);

    return {
      napoveda() {}, ukazOdpoved() {},
      spravne(veta) { vazba.className = 'spatna-vazba spravne'; vazba.innerHTML = `<strong>${veta}</strong> Si v cieli.`; },
    };
  },

  vysledok(vstup) {
    if (vstup.pomoci === 0) return 'prvy';
    if (vstup.pomoci === 1) return 'druhy';
    return 'ukazane';
  },
};
