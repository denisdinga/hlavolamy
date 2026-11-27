// Typ úlohy: Tvary — priestorová predstavivosť so štvorčekovými tvarmi (ako dieliky skladačky).
//
// Dva druhy (náhodne, pol na pol):
//  otocenie  „Ktorý tvar je ten istý, len pootočený?“ — vzor a 3–4 pootočené možnosti.
//            Od úrovne 4 je medzi možnosťami aj zrkadlový (prevrátený) tvar — ten sa NEPOČÍTA.
//  doplnenie „Ktorý dielik zapadne do diery?“ — doska s dierou a 3–4 dieliky.
//            Dielik sa dá aj prevrátiť (ako skutočný), preto žiadna nesprávna možnosť nezapadne ani prevrátená.
//
// Úrovne (počet štvorčekov tvaru, počet možností, aké sú nesprávne možnosti):
//  otocenie:  1 4/3 iné tvary  2 4/3  3 5/4 podobné  4 5/4 + zrkadlo  5 6/4  6 6/4  7 7/4  8 7/4  9 8/4  10 9/4
//  doplnenie: 1 3/3 rovnako natočené  2 4/3  3 4/4 (úrovne 1–3: nesprávne aj o štvorček väčšie)  4 5/4 podobné  5 5/4  6 6/4  7 6/4  8 7/4  9 8/4  10 9/4
// „Podobné“ = vzniknú presunutím jedného štvorčeka, takže na prvý pohľad vyzerajú rovnako.
// Odpoveď sa vyberá ťuknutím. Po 1. chybe sa vyradí ešte jedna nesprávna možnosť (ak ostanú aspoň 2).

const POCET_A = [4, 4, 5, 5, 6, 6, 7, 7, 8, 9];
const POCET_B = [3, 4, 4, 5, 5, 6, 6, 7, 8, 9];
const PISMENA = ['A', 'B', 'C', 'D'];
const SUSEDIA = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---------- Geometria tvarov (tvar = zoznam políčok [x, y]) ----------
export function normalizuj(t) {
  const mx = Math.min(...t.map(p => p[0])), my = Math.min(...t.map(p => p[1]));
  return t.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
const kluc = (t) => normalizuj(t).map(p => p.join(',')).join(';');
export const otoc = (t) => normalizuj(t.map(([x, y]) => [-y, x]));      // o 90° v smere hodín
export const zrkadli = (t) => normalizuj(t.map(([x, y]) => [-x, y]));
export function otocO(t, krat) { let r = normalizuj(t); for (let i = 0; i < krat % 4; i++) r = otoc(r); return r; }
// Rovnaký tvar po pootočení (bez prevrátenia)
export const kanon = (t) => [0, 1, 2, 3].map(k => kluc(otocO(t, k))).sort()[0];
// Rovnaký tvar aj po prevrátení
export const kanonZ = (t) => [kanon(t), kanon(zrkadli(t))].sort()[0];

export function suvisly(t) {
  const m = new Set(t.map(p => p.join(',')));
  const videne = new Set([t[0].join(',')]);
  const rad = [t[0]];
  while (rad.length) {
    const [x, y] = rad.pop();
    for (const [dx, dy] of SUSEDIA) {
      const k = (x + dx) + ',' + (y + dy);
      if (m.has(k) && !videne.has(k)) { videne.add(k); rad.push([x + dx, y + dy]); }
    }
  }
  return videne.size === t.length;
}

function okolie(t) {
  const m = new Set(t.map(p => p.join(',')));
  const o = new Map();
  for (const [x, y] of t) for (const [dx, dy] of SUSEDIA) {
    const k = (x + dx) + ',' + (y + dy);
    if (!m.has(k)) o.set(k, [x + dx, y + dy]);
  }
  return [...o.values()];
}

// Náhodný súvislý tvar z k štvorčekov. Nie príliš dlhý pásik (aby sa zmestil a bol zaujímavý).
function nahodnyTvar(rng, k) {
  for (let pokus = 0; pokus < 200; pokus++) {
    let t = [[0, 0]];
    while (t.length < k) t.push(rng.vyber(okolie(t)));
    t = normalizuj(t);
    const w = Math.max(...t.map(p => p[0])) + 1, h = Math.max(...t.map(p => p[1])) + 1;
    if (Math.max(w, h) <= Math.max(3, Math.ceil(k * 0.75)) && Math.min(w, h) >= 2) return t;
  }
  throw new Error('tvar sa nepodarilo vytvoriť');
}

const chiralny = (t) => kanon(t) !== kanon(zrkadli(t));

// Podobný tvar: presun jedného štvorčeka. Súvislý, rovnaký počet štvorčekov.
function podobnyTvar(rng, t) {
  for (let pokus = 0; pokus < 100; pokus++) {
    const i = Math.floor(rng.dalsie() * t.length);
    const bez = t.filter((_, j) => j !== i);
    if (!suvisly(bez)) continue;
    const kam = rng.vyber(okolie(bez).filter(([x, y]) => !(x === t[i][0] && y === t[i][1])));
    if (!kam) continue;
    return normalizuj([...bez, kam]);
  }
  return null;
}

// Doplní nesprávne možnosti tak, aby sa navzájom ani so správnou nezhodovali (podľa `rovnaky`).
function doplnNespravne(rng, nespravne, pocet, pouzite, zdroj, rovnaky) {
  for (let pokus = 0; nespravne.length < pocet && pokus < 500; pokus++) {
    const t = zdroj();
    if (!t) continue;
    const k = rovnaky(t);
    if (pouzite.has(k)) continue;
    pouzite.add(k);
    nespravne.push(t);
  }
  if (nespravne.length < pocet) throw new Error('málo nesprávnych možností');
}

// Každú možnosť ukáž náhodne pootočenú
const nahodneOtoc = (rng, t) => otocO(t, rng.cislo(0, 3));

function vytvorOtocenie(rng, u) {
  const k = POCET_A[u - 1], pocet = u <= 2 ? 3 : 4;
  // vzor, ktorý po pootočení vyzerá inak (nie štvorec 2×2); od úrovne 4 aj iný v zrkadle
  let vzor, otocenia;
  do {
    vzor = nahodnyTvar(rng, k);
    otocenia = [1, 2, 3].filter(o => kluc(otocO(vzor, o)) !== kluc(vzor));
  } while (!otocenia.length || (u >= 4 && !chiralny(vzor)));
  const otocenie = rng.vyber(otocenia); // 90°, 180° alebo 270° — správna nikdy nevyzerá rovnako ako vzor
  const spravna = otocO(vzor, otocenie);
  const nespravne = [];
  // Úroveň 1–3: nesprávne sa líšia aj od zrkadla. Od 4: zrkadlo je zámerne jedna z nesprávnych možností.
  const rovnaky = u >= 4 ? kanon : kanonZ;
  const pouzite = new Set([rovnaky(vzor)]);
  if (u >= 4) { nespravne.push(nahodneOtoc(rng, zrkadli(vzor))); pouzite.add(kanon(zrkadli(vzor))); }
  const zdroj = u >= 3 ? () => podobnyTvar(rng, vzor) : () => nahodnyTvar(rng, k);
  doplnNespravne(rng, nespravne, pocet - 1, pouzite, () => { const t = zdroj(); return t && nahodneOtoc(rng, t); }, rovnaky);
  return { vzor, spravna, nespravne, otocenie, pocet };
}

function vytvorDoplnenie(rng, u) {
  const k = POCET_B[u - 1], pocet = u <= 2 ? 3 : 4;
  const dielik = nahodnyTvar(rng, k);
  const diera = nahodneOtoc(rng, dielik);
  const w = Math.max(...diera.map(p => p[0])) + 1, h = Math.max(...diera.map(p => p[1])) + 1;
  const okraj = () => rng.cislo(1, 2);
  const [ol, oh, op, od] = [okraj(), okraj(), okraj(), okraj()];
  const doska = { w: w + ol + op, h: h + oh + od, diera: diera.map(([x, y]) => [x + ol, y + oh]) };
  const spravna = u === 1 ? diera : otocO(diera, rng.cislo(1, 3));
  // „rovnaký“ tu = rovnaký aj po prevrátení (dielik sa dá obrátiť)
  const pouzite = new Set([kanonZ(dielik)]);
  const nespravne = [];
  // na nízkych úrovniach môžu mať nesprávne dieliky aj o štvorček viac (z 3 štvorčekov je málo tvarov)
  const zdroj = u >= 4 ? () => podobnyTvar(rng, dielik) : () => nahodnyTvar(rng, k + rng.cislo(0, 1));
  doplnNespravne(rng, nespravne, pocet - 1, pouzite, () => { const t = zdroj(); return t && nahodneOtoc(rng, t); }, kanonZ);
  return { doska, spravna, nespravne, pocet };
}

// ---------- Kreslenie ----------
const svgTvar = (t, mierka, trieda) => {
  const w = Math.max(...t.map(p => p[0])) + 1, h = Math.max(...t.map(p => p[1])) + 1;
  const ox = (mierka - w) / 2, oy = (mierka - h) / 2;
  return `<svg class="${trieda}" viewBox="-0.15 -0.15 ${mierka + 0.3} ${mierka + 0.3}" aria-hidden="true">` +
    t.map(([x, y]) => `<rect x="${x + ox}" y="${y + oy}" width="1" height="1"/>`).join('') + '</svg>';
};

function svgDoska({ w, h, diera }) {
  const d = new Set(diera.map(p => p.join(',')));
  let s = '';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    s += `<rect class="${d.has(x + ',' + y) ? 'diera' : 'plna'}" x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg class="tvar-doska" viewBox="-0.15 -0.15 ${w + 0.3} ${h + 0.3}" aria-hidden="true">${s}</svg>`;
}

export default {
  id: 'tvary',
  nazov: 'Tvary',
  urovne: 10,

  vytvor(rng, uroven) {
    const u = Math.min(10, Math.max(1, uroven));
    const druh = rng.dalsie() < 0.5 ? 'otocenie' : 'doplnenie';
    const g = druh === 'otocenie' ? vytvorOtocenie(rng, u) : vytvorDoplnenie(rng, u);
    const moznosti = rng.zamiesaj([g.spravna, ...g.nespravne]);
    const odpoved = moznosti.indexOf(g.spravna);
    return {
      zadanie: druh === 'otocenie' ? 'Ktorý tvar je ten istý, len pootočený?' : 'Ktorý dielik zapadne do diery?',
      odpoved,
      odpovedText: PISMENA[odpoved],
      napoveda: druh === 'otocenie'
        ? 'Všimni si, kde má vzor výbežok, a otáčaj ho v duchu po štvrťotáčkach.'
        : 'Spočítaj štvorčeky v diere a pozri sa, kde má diera výbežok.',
      vysvetlenie: druh === 'otocenie'
        ? `Je to ten istý tvar, pootočený o ${g.otocenie * 90}°.`
        : 'Tento dielik po pootočení presne vyplní dieru.',
      data: { druh, vzor: g.vzor || null, doska: g.doska || null, moznosti, zrkadlo: druh === 'otocenie' && u >= 4 },
    };
  },

  over(uloha, vstup) { return Number(vstup) === uloha.odpoved; },

  zobraz(kontajner, uloha, priOdpovedi) {
    const { druh, vzor, doska, moznosti, zrkadlo } = uloha.data;
    const mierka = Math.max(...[...moznosti, ...(vzor ? [vzor] : [])].flat(2)) + 1;
    const popis = druh === 'otocenie'
      ? `Ktorý tvar je <b>ten istý</b>, len pootočený?${zrkadlo ? ' Prevrátený (zrkadlový) sa nepočíta.' : ''}`
      : 'Ktorý dielik <b>zapadne do diery</b>? Dielik môžeš otočiť.';
    kontajner.innerHTML = `
      <div class="tvary">
        <div class="list list-tvary">
          <p class="popis">${popis}</p>
          <div class="tvar-vzor">${druh === 'otocenie' ? svgTvar(vzor, mierka, 'tvar tvar-vzorovy') : svgDoska(doska)}</div>
          <p class="spatna-vazba" role="status"></p>
        </div>
        <div class="tvary-moznosti" role="group" aria-label="Možnosti">
          ${moznosti.map((t, i) => `<button type="button" class="moznost" data-i="${i}" aria-label="Možnosť ${PISMENA[i]}">
            ${svgTvar(t, mierka, 'tvar')}<span class="pismeno">${PISMENA[i]}</span></button>`).join('')}
        </div>
      </div>`;
    const vazba = kontajner.querySelector('.spatna-vazba');
    const tlacidla = [...kontajner.querySelectorAll('.moznost')];
    let zamknute = false, posledna = -1;

    kontajner.querySelector('.tvary-moznosti').addEventListener('click', (e) => {
      const b = e.target.closest('.moznost');
      if (!b || b.disabled || zamknute) return;
      zamknute = true;
      posledna = Number(b.dataset.i);
      tlacidla.forEach(t => t.classList.toggle('zvolena', t === b));
      priOdpovedi(posledna);
    });

    return {
      napoveda(veta, text) {
        // zvolenú (nesprávnu) a ešte jednu nesprávnu vyraď, ak ostanú aspoň 2 možnosti
        const vyrad = (i) => { tlacidla[i].disabled = true; tlacidla[i].classList.remove('zvolena'); tlacidla[i].classList.add('vyradena'); };
        vyrad(posledna);
        const ine = tlacidla.map((_, i) => i).filter(i => i !== uloha.odpoved && !tlacidla[i].disabled);
        if (ine.length >= 2) vyrad(ine[0]);
        vazba.className = 'spatna-vazba napoveda';
        vazba.innerHTML = `<strong>${veta}</strong><br>${text}`;
        zamknute = false;
      },
      spravne(veta) {
        tlacidla[uloha.odpoved].classList.add('ok');
        tlacidla.forEach(t => { t.disabled = true; });
        vazba.className = 'spatna-vazba spravne';
        vazba.innerHTML = `<strong>${veta}</strong>`;
      },
      ukazOdpoved(spravna, vysvetlenie) {
        tlacidla.forEach(t => { t.disabled = true; t.classList.remove('zvolena'); });
        tlacidla[uloha.odpoved].classList.add('ukazana');
        vazba.className = 'spatna-vazba ukazana';
        vazba.innerHTML = `Správna je možnosť <strong>${spravna}</strong>.<br>${vysvetlenie}`;
      },
    };
  },
};
