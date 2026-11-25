// Deterministický generátor náhody: rovnaký seed = rovnaké úlohy.
// Nikde v aplikácii sa nepoužíva Math.random().

// Hash reťazca na 32-bitové číslo (cyrb53, orezané).
export function hash(text) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

// mulberry32 — vráti objekt s pomocnými funkciami.
export function vytvorRng(seed) {
  let a = typeof seed === 'string' ? hash(seed) : seed >>> 0;
  const dalsie = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    dalsie,
    // celé číslo od..do vrátane
    cislo(od, po) { return od + Math.floor(dalsie() * (po - od + 1)); },
    vyber(pole) { return pole[Math.floor(dalsie() * pole.length)]; },
    zamiesaj(pole) {
      const p = pole.slice();
      for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(dalsie() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
      return p;
    },
  };
}

// Slovenské formátovanie čísla: 1 250 (nezlomiteľná medzera).
export function formatuj(n) {
  const s = String(Math.abs(n));
  const sMedzerami = s.length >= 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
  return (n < 0 ? '−' : '') + sMedzerami;
}

// Vstup od používateľa → číslo (toleruje medzery a nuly na začiatku).
export function naCislo(vstup) {
  const t = String(vstup ?? '').replace(/[\s ]/g, '');
  if (!/^\d+$/.test(t)) return NaN;
  return parseInt(t, 10);
}
