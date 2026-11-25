// Typ úlohy: Bludisko — cesta zo štartu (vľavo hore) do cieľa (vpravo dole).
//
// Ovládanie: ťuk na susedné políčko predĺži cestu; ťuk na políčko, ktoré už je v ceste,
// cestu skráti späť po neho. Žiadne ťahanie prstom.
//
// Úrovne: veľkosť mriežky a dĺžka cesty
//  1 4×4 krátka   2 4×4 dlhá   3 5×5 krátka   4 5×5 dlhá   5 6×6 krátka
//  6 6×6 dlhá     7 7×7 krátka  8 7×7 dlhá    9 8×8 dlhá   10 9×9 dlhá
//
// Bludisko je dokonalé (strom): medzi každými dvoma políčkami vedie práve jedna cesta.
//
// Výsledok: „prvy“ bez pomoci, „druhy“ po jednej pomoci (ukáže sa kus cesty),
// „ukazane“ keď sa ukázala celá cesta.

const VELKOST = [4, 4, 5, 5, 6, 6, 7, 7, 8, 9];
const SMERY = [[0, -1, 'h'], [1, 0, 'p'], [0, 1, 'd'], [-1, 0, 'l']]; // hore, vpravo, dole, vľavo
const OPACNY = { h: 'd', d: 'h', l: 'p', p: 'l' };

// Vytvorí bludisko n×n metódou „rekurzívneho návratu“ (iteratívne).
// steny[y][x] = množina otvorených smerov z políčka.
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
  return SMERY.filter(([dx, dy, s]) => bl[y][x].includes(s))
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n);
}

// Najkratšia (v strome jediná) cesta BFS.
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
    // 5 kandidátov; nepárne úrovne berú najkratšiu cestu, párne (a 9, 10) najdlhšiu
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

  // vstup = cesta [[x,y], …]; správne, ak je súvislá a vedie zo štartu do cieľa
  over(uloha, vstup) {
    const { bl, n } = uloha.data;
    if (!Array.isArray(vstup) || !vstup.length) return false;
    const [sx, sy] = vstup[0];
    const [cx, cy] = vstup[vstup.length - 1];
    if (sx !== 0 || sy !== 0 || cx !== n - 1 || cy !== n - 1) return false;
    for (let i = 1; i < vstup.length; i++) {
      const [px, py] = vstup[i - 1];
      if (!susedia(bl, px, py).some(([a, b]) => a === vstup[i][0] && b === vstup[i][1])) return false;
    }
    return true;
  },

  zobraz(kontajner, uloha, priOdpovedi) {
    const { n, bl, cesta: spravnaCesta } = uloha.data;
    kontajner.innerHTML = `
      <div class="bludisko-obal">
        <div class="list list-bludisko">
          <p class="popis">Nájdi cestu zo štartu do cieľa. Ťukni na susedné políčko.</p>
          <div class="bludisko" style="--n:${n}" role="grid" aria-label="Bludisko"></div>
          <p class="spatna-vazba" role="status"></p>
        </div>
        <div class="bludisko-tlacidla">
          <button type="button" class="tl tl-druhotne" data-a="pomoc">Pomôž mi</button>
          <button type="button" class="tl tl-druhotne" data-a="znova">Začať odznova</button>
        </div>
      </div>`;
    const mriezka = kontajner.querySelector('.bludisko');
    const vazba = kontajner.querySelector('.spatna-vazba');
    const tlPomoc = kontajner.querySelector('[data-a="pomoc"]');
    const policka = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pole';
        const o = bl[y][x];
        if (!o.includes('h')) b.classList.add('s-h');
        if (!o.includes('p')) b.classList.add('s-p');
        if (!o.includes('d')) b.classList.add('s-d');
        if (!o.includes('l')) b.classList.add('s-l');
        if (x === 0 && y === 0) { b.classList.add('start'); b.innerHTML = '<span>Štart</span>'; }
        if (x === n - 1 && y === n - 1) { b.classList.add('ciel'); b.innerHTML = '<span>Cieľ</span>'; }
        b.dataset.x = x; b.dataset.y = y;
        b.setAttribute('aria-label', `Políčko ${x + 1}, ${y + 1}`);
        mriezka.appendChild(b);
        policka.push(b);
      }
    }
    const pole = (x, y) => policka[y * n + x];
    let cesta = [[0, 0]];
    let pomoci = 0;
    let hotovo = false;
    let nespravnychTukov = 0;

    const prekresli = () => {
      policka.forEach(p => p.classList.remove('v-ceste', 'koniec'));
      cesta.forEach(([x, y]) => pole(x, y).classList.add('v-ceste'));
      const [kx, ky] = cesta[cesta.length - 1];
      pole(kx, ky).classList.add('koniec');
    };

    const dokonci = () => {
      hotovo = true;
      tlPomoc.disabled = true;
      kontajner.querySelector('[data-a="znova"]').disabled = true;
      priOdpovedi({ cesta, pomoci, nespravnychTukov });
    };

    mriezka.addEventListener('click', (e) => {
      const b = e.target.closest('.pole');
      if (!b || hotovo) return;
      const x = +b.dataset.x, y = +b.dataset.y;
      const idx = cesta.findIndex(([a, c]) => a === x && c === y);
      if (idx >= 0) { cesta = cesta.slice(0, idx + 1); vazba.textContent = ''; prekresli(); return; }
      const [kx, ky] = cesta[cesta.length - 1];
      const moze = susedia(bl, kx, ky).some(([a, c]) => a === x && c === y);
      if (!moze) {
        nespravnychTukov++;
        vazba.className = 'spatna-vazba napoveda';
        vazba.textContent = 'Tadiaľ to nejde. Ťukni na políčko hneď vedľa konca cesty, kde nie je stena.';
        return;
      }
      vazba.textContent = '';
      cesta.push([x, y]);
      prekresli();
      if (x === n - 1 && y === n - 1) dokonci();
    });

    kontajner.querySelector('.bludisko-tlacidla').addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (!a || hotovo) return;
      if (a === 'znova') { cesta = [[0, 0]]; vazba.textContent = ''; prekresli(); return; }
      if (a === 'pomoc') {
        pomoci++;
        // vrátime cestu na správny kus a pridáme ďalšie kroky
        let zhoda = 0;
        while (zhoda < cesta.length && zhoda < spravnaCesta.length &&
               cesta[zhoda][0] === spravnaCesta[zhoda][0] && cesta[zhoda][1] === spravnaCesta[zhoda][1]) zhoda++;
        if (pomoci >= 2) {
          cesta = spravnaCesta.slice();
          vazba.className = 'spatna-vazba ukazana';
          vazba.textContent = 'Toto je celá cesta do cieľa.';
          prekresli();
          setTimeout(dokonci, 600);
          return;
        }
        const kroky = Math.max(3, Math.ceil(spravnaCesta.length / 3));
        cesta = spravnaCesta.slice(0, Math.min(spravnaCesta.length - 1, zhoda + kroky));
        vazba.className = 'spatna-vazba napoveda';
        vazba.textContent = 'Ukázal som kúsok cesty. Pokračuj odtiaľto.';
        tlPomoc.textContent = 'Ukáž celú cestu';
        prekresli();
      }
    });

    prekresli();

    return {
      napoveda() {}, ukazOdpoved() {},
      spravne(veta) {
        vazba.className = 'spatna-vazba spravne';
        vazba.innerHTML = `<strong>${veta}</strong> Si v cieli.`;
      },
    };
  },

  // Bludisko si výsledok určuje samo podľa počtu pomocí.
  vysledok(vstup) {
    if (vstup.pomoci === 0) return 'prvy';
    if (vstup.pomoci === 1) return 'druhy';
    return 'ukazane';
  },
};
