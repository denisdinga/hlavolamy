// Typ úlohy: Doplň znamienka — 12 ? 4 ? 3 = 51.
// Dedko ťuká na veľké tlačidlá + − × ÷. Riešenie je vždy jediné a vyjde rovnako, či počíta
// „najprv násobenie“, alebo zľava doprava — aby ho poradie operácií nezmiatlo.
//
// Úrovne (počet znamienok, najväčšie číslo):
//  1 1/20   2 1/50   3 1/100   4 2/10   5 2/20   6 2/30   7 2/50   8 3/10   9 3/20   10 3/30

const UROVNE = [[1, 20], [1, 50], [1, 100], [2, 10], [2, 20], [2, 30], [2, 50], [3, 10], [3, 20], [3, 30]];
const OPS = ['+', '−', '×', '÷'];

// Výpočet so štandardným poradím (× ÷ pred + −). Vráti null, ak delenie nevyjde celé.
export function vypocitaj(cisla, ops) {
  const st = [cisla[0]]; const plusMinus = [];
  for (let i = 0; i < ops.length; i++) {
    const n = cisla[i + 1], op = ops[i];
    if (op === '×') st.push(st.pop() * n);
    else if (op === '÷') { const a = st.pop(); if (n === 0 || a % n) return null; st.push(a / n); }
    else { plusMinus.push(op); st.push(n); }
  }
  let v = st[0];
  plusMinus.forEach((op, i) => { v = op === '+' ? v + st[i + 1] : v - st[i + 1]; });
  return v;
}
// Zľava doprava (ako na jednoduchej kalkulačke).
export function zlava(cisla, ops) {
  let v = cisla[0];
  for (let i = 0; i < ops.length; i++) {
    const n = cisla[i + 1], op = ops[i];
    if (op === '+') v += n; else if (op === '−') v -= n; else if (op === '×') v *= n;
    else { if (n === 0 || v % n) return null; v /= n; }
  }
  return v;
}
// Voľný výpočet aj so zlomkami (na kontrolu jednoznačnosti — človek by mohol prísť aj cez zlomok).
const volne = (cisla, ops, zlavaDoprava) => {
  const f = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };
  if (zlavaDoprava) return ops.reduce((v, op, i) => f[op](v, cisla[i + 1]), cisla[0]);
  const st = [cisla[0]], pm = [];
  ops.forEach((op, i) => { if (op === '×' || op === '÷') st.push(f[op](st.pop(), cisla[i + 1])); else { pm.push(op); st.push(cisla[i + 1]); } });
  return pm.reduce((v, op, i) => f[op](v, st[i + 1]), st[0]);
};
const rovne = (a, b) => Math.abs(a - b) < 1e-9;

export function vsetkyKombinacie(k) {
  let out = [[]];
  for (let i = 0; i < k; i++) out = out.flatMap(c => OPS.map(o => [...c, o]));
  return out;
}

export default {
  id: 'znamienka',
  nazov: 'Doplň znamienka',
  urovne: 10,

  vytvor(rng, uroven) {
    const [k, max] = UROVNE[Math.min(10, Math.max(1, uroven)) - 1];
    const kombinacie = vsetkyKombinacie(k);
    for (let pokus = 0; pokus < 500; pokus++) {
      const cisla = Array.from({ length: k + 1 }, () => rng.cislo(2, max));
      const ops = Array.from({ length: k }, () => rng.vyber(OPS));
      const r = vypocitaj(cisla, ops);
      if (r === null || r < 0 || r !== zlava(cisla, ops)) continue;
      // jediná kombinácia, ktorá dá výsledok r (či už počítaná ktorýmkoľvek spôsobom)
      const sediace = kombinacie.filter(c => rovne(volne(cisla, c, false), r) || rovne(volne(cisla, c, true), r));
      if (sediace.length !== 1) continue;
      const odpoved = ops.join('');
      const vyraz = cisla.map((c, i) => (i ? `${ops[i - 1]} ${c}` : `${c}`)).join(' ');
      return {
        zadanie: cisla.join(' ? ') + ` = ${r}`,
        odpoved,
        odpovedText: vyraz,
        napoveda: `Prvé znamienko je ${ops[0]}.${k > 1 ? ' Doplň zvyšok.' : ''}`,
        vysvetlenie: `${vyraz} = ${r}.`,
        data: { cisla, vysledok: r, pocet: k },
      };
    }
    throw new Error('znamienka: nepodarilo sa vytvoriť jednoznačnú úlohu');
  },

  over(uloha, vstup) { return String(vstup ?? '') === uloha.odpoved; },

  zobraz(kontajner, uloha, priOdpovedi) {
    const { cisla, vysledok, pocet } = uloha.data;
    const sloty = cisla.map((c, i) => (i ? `<button type="button" class="slot prazdny" data-i="${i - 1}">?</button> ` : '') + `<span class="cislo">${c}</span>`).join(' ');
    kontajner.innerHTML = `
      <div class="ciselna">
        <div class="list">
          <p class="popis">Doplň znamienka, aby to platilo.</p>
          <p class="zadanie znamienka">${sloty} <span>=&nbsp;${vysledok}</span></p>
          <p class="spatna-vazba" role="status"></p>
        </div>
        <div class="klavesnica klavesnica-ops" role="group" aria-label="Znamienka">
          ${OPS.map(o => `<button type="button" class="kl kl-op" data-o="${o}">${o}</button>`).join('')}
          <button type="button" class="kl kl-zmaz" data-a="zmaz">Zmazať</button>
          <button type="button" class="kl kl-hotovo" data-a="hotovo" disabled>Hotovo</button>
        </div>
      </div>`;
    const slotyEl = [...kontajner.querySelectorAll('.slot')];
    const vazba = kontajner.querySelector('.spatna-vazba');
    const hotovo = kontajner.querySelector('[data-a="hotovo"]');
    let ops = Array(pocet).fill(null), aktivny = 0, zamknute = false;

    const prekresli = () => {
      slotyEl.forEach((s, i) => {
        s.textContent = ops[i] ?? '?';
        s.classList.toggle('prazdny', !ops[i]);
        s.classList.toggle('aktivny', i === aktivny && !zamknute);
      });
      hotovo.disabled = zamknute || ops.some(o => !o);
    };
    const vycistiVazbu = () => { vazba.textContent = ''; vazba.className = 'spatna-vazba'; };

    kontajner.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || zamknute || b.disabled) return;
      if (b.classList.contains('slot')) { aktivny = +b.dataset.i; }
      else if (b.dataset.o) {
        ops[aktivny] = b.dataset.o; vycistiVazbu();
        const dalsi = ops.findIndex(o => !o); aktivny = dalsi >= 0 ? dalsi : aktivny;
      } else if (b.dataset.a === 'zmaz') {
        if (ops[aktivny]) ops[aktivny] = null;
        else if (aktivny > 0) { aktivny--; ops[aktivny] = null; }
        vycistiVazbu();
      } else if (b.dataset.a === 'hotovo') { zamknute = true; prekresli(); priOdpovedi(ops.join('')); return; }
      prekresli();
    });
    prekresli();

    return {
      napoveda(veta, text) {
        vazba.className = 'spatna-vazba napoveda'; vazba.innerHTML = `<strong>${veta}</strong><br>${text}`;
        ops = Array(pocet).fill(null); ops[0] = uloha.odpoved[0]; aktivny = pocet > 1 ? 1 : 0; zamknute = false; prekresli();
      },
      spravne(veta) {
        slotyEl.forEach(s => s.classList.add('ok'));
        vazba.className = 'spatna-vazba spravne'; vazba.innerHTML = `<strong>${veta}</strong>`;
      },
      ukazOdpoved(spravna, vysvetlenie) {
        ops = uloha.odpoved.split(''); zamknute = true; prekresli();
        slotyEl.forEach(s => s.classList.add('ukazana'));
        vazba.className = 'spatna-vazba ukazana'; vazba.innerHTML = `Správne je <strong>${vysvetlenie}</strong>`;
      },
    };
  },
};
