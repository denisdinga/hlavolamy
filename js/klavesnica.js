// Spoločné zobrazenie pre číselné úlohy: zadanie + políčko odpovede + veľká klávesnica.
// Používajú ho typy „priklady“ a „postupnosti“.

const MAX_CIFIER = 6;

// Znamienko nikdy na konci riadku bez čísla („+ ⏎ 8“): spojí „+ 8“ a „= 83“ nezlomiteľnou medzerou.
const nezalamuj = (t) => String(t).replace(/([+−×÷=?]) (?=[\d?−])/g, '$1 ').replace(/(\d) (?=[+−×÷=])/g, '$1 ');

export function zobrazCiselnuUlohu(kontajner, { zadanieHtml, popis }, priOdpovedi) {
  kontajner.innerHTML = `
    <div class="ciselna">
      <div class="list">
        ${popis ? `<p class="popis">${popis}</p>` : ''}
        <p class="zadanie" aria-live="polite">${zadanieHtml}</p>
        <p class="spatna-vazba" role="status"></p>
      </div>
      <div class="klavesnica" role="group" aria-label="Klávesnica">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => `<button type="button" class="kl" data-c="${c}">${c}</button>`).join('')}
        <button type="button" class="kl kl-zmaz" data-a="zmaz">Zmazať</button>
        <button type="button" class="kl" data-c="0">0</button>
        <button type="button" class="kl kl-hotovo" data-a="hotovo" disabled>Hotovo</button>
      </div>
    </div>`;

  const odpoved = kontajner.querySelector('.odpoved');
  const hotovo = kontajner.querySelector('[data-a="hotovo"]');
  const vazba = kontajner.querySelector('.spatna-vazba');
  let text = '';
  let zamknute = false;

  const prekresli = () => {
    odpoved.textContent = text || ' ';
    odpoved.classList.toggle('prazdna', !text);
    hotovo.disabled = !text || zamknute;
  };

  const stlac = (c) => {
    if (zamknute) return;
    if (c === 'zmaz') text = text.slice(0, -1);
    else if (c === 'hotovo') { if (text) { zamknute = true; prekresli(); priOdpovedi(text); } return; }
    else if (text.length < MAX_CIFIER) text = (text === '0' ? '' : text) + c;
    vazba.textContent = '';
    vazba.className = 'spatna-vazba';
    prekresli();
  };

  kontajner.querySelector('.klavesnica').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    stlac(b.dataset.c ?? b.dataset.a);
  });

  // Fyzická klávesnica na PC
  const naKlaves = (e) => {
    if (!kontajner.isConnected) { document.removeEventListener('keydown', naKlaves); return; }
    if (/^\d$/.test(e.key)) stlac(e.key);
    else if (e.key === 'Backspace') stlac('zmaz');
    else if (e.key === 'Enter') stlac('hotovo');
  };
  document.addEventListener('keydown', naKlaves);

  prekresli();

  return {
    // po 1. chybe: nápoveda, políčko sa vyprázdni, dá sa písať znova
    napoveda(veta, napoveda) {
      vazba.className = 'spatna-vazba napoveda';
      vazba.innerHTML = `<strong>${veta}</strong><br>${nezalamuj(napoveda)}`;
      text = ''; zamknute = false; prekresli();
    },
    spravne(veta) {
      odpoved.classList.add('ok');
      vazba.className = 'spatna-vazba spravne';
      vazba.innerHTML = `<strong>${veta}</strong>`;
    },
    // po 2. chybe: pokojne ukáže správnu odpoveď
    ukazOdpoved(spravna, vysvetlenie) {
      text = String(spravna).replace(/\D/g, '');
      zamknute = true; prekresli();
      odpoved.textContent = spravna;
      odpoved.classList.add('ukazana');
      vazba.className = 'spatna-vazba ukazana';
      vazba.innerHTML = `Správna odpoveď je <strong>${spravna}</strong>.<br>${nezalamuj(vysvetlenie)}`;
    },
  };
}

// Políčko odpovede vložené do zadania (napr. „7 + 5 = [ ]“)
export const POLICKO = '<span class="odpoved prazdna" aria-label="Tvoja odpoveď"> </span>';
