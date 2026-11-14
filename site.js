document.documentElement.classList.add('js');
document.getElementById('year').textContent = new Date().getFullYear();

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Manifesto: each word lights up as it scrolls through the reading zone,
   like the wall catching the lamp's light. The only scroll effect on the site. */
const scrub = document.querySelector('[data-scrub]');
if (scrub && !reduced) {
  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.TEXT_NODE) { wrap(child); return; }
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const s = document.createElement('span');
        s.className = 'sw'; s.textContent = part; frag.append(s);
      });
      child.replaceWith(frag);
    });
  };
  wrap(scrub);
  const words = [...scrub.querySelectorAll('.sw')];
  let ticking = false;
  const update = () => {
    const r = scrub.getBoundingClientRect();
    const p = (innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.25);
    const lit = Math.round(Math.max(0, Math.min(1, p)) * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

/* Material names drift slowly, at a constant pace. */
const track = document.querySelector('.marquee-track');
if (track && !reduced) {
  track.innerHTML += track.innerHTML;
  let half = track.scrollWidth / 2;
  let x = 0;
  addEventListener('resize', () => { half = track.scrollWidth / 2; });
  document.fonts && document.fonts.ready.then(() => { half = track.scrollWidth / 2; });
  const step = () => {
    x -= 0.4;
    if (x <= -half) x += half;
    track.style.setProperty('--x', `${x.toFixed(2)}px`);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
