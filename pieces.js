document.documentElement.classList.add('js');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fiches = [...document.querySelectorAll('.fiche')];
const counterNow = document.querySelector('.counter-now');
document.querySelector('.counter-total').textContent = String(fiches.length).padStart(2, '0');

// Slideshows: 1.2 s per photo, only while their fiche is on screen.
const shows = new Map();
document.querySelectorAll('[data-slides]').forEach((frame) => {
  const slides = [...frame.querySelectorAll('.slide')];
  const btn = frame.querySelector('.play');
  const show = { i: 0, timer: null, paused: reduced, visible: false };
  const step = () => {
    slides[show.i].classList.remove('is-on');
    show.i = (show.i + 1) % slides.length;
    slides[show.i].classList.add('is-on');
  };
  const sync = () => {
    const run = show.visible && !show.paused && !document.hidden;
    if (run && !show.timer) show.timer = setInterval(step, 1200);
    if (!run && show.timer) { clearInterval(show.timer); show.timer = null; }
    btn.setAttribute('aria-pressed', String(show.paused));
    btn.setAttribute('aria-label', show.paused ? 'Lancer le diaporama' : 'Mettre le diaporama en pause');
  };
  btn.addEventListener('click', () => {
    show.paused = !show.paused;
    sync();
    // hide the icon right after a click; it comes back once the pointer leaves
    btn.classList.add('is-quiet');
  });
  frame.addEventListener('pointerleave', () => btn.classList.remove('is-quiet'));
  show.sync = sync;
  shows.set(frame.closest('.fiche'), show);
  sync();
});
document.addEventListener('visibilitychange', () => shows.forEach((s) => s.sync()));

// Active fiche: drives the enter transition, the counter and the slideshow.
const setActive = (fiche) => {
  fiches.forEach((f) => f.classList.toggle('is-active', f === fiche));
  counterNow.textContent = String(fiches.indexOf(fiche) + 1).padStart(2, '0');
  shows.forEach((s, f) => { s.visible = f === fiche; s.sync(); });
};
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target); });
  }, { threshold: 0.6 });
  fiches.forEach((f) => io.observe(f));
} else {
  setActive(fiches[0]);
}

// Arrow keys / Page keys move one fiche at a time.
addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  const dir = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key];
  if (!dir) return;
  const cur = fiches.findIndex((f) => f.classList.contains('is-active'));
  const next = fiches[Math.max(0, Math.min(fiches.length - 1, cur + dir))];
  if (next) { e.preventDefault(); next.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
});
