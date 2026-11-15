document.documentElement.classList.add('js');
document.getElementById('year').textContent = new Date().getFullYear();

// Reveal on scroll
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
} else {
  items.forEach((el) => el.classList.add('is-in'));
}

// Sommaire : ouvert sur grand écran, replié sur mobile, refermé après un clic
const toc = document.querySelector('.toc-wrap');
const mq = window.matchMedia('(max-width: 900px)');
const syncToc = () => { toc.open = !mq.matches; };
syncToc();
mq.addEventListener('change', syncToc);
toc.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { if (mq.matches) toc.open = false; }));

// Section courante soulignée dans le sommaire
const links = new Map();
toc.querySelectorAll('li:not(.toc-part) a').forEach((a) => links.set(a.getAttribute('href').slice(1), a));
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-active'));
      const a = links.get(e.target.id);
      if (a) a.classList.add('is-active');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));
}

// Damier du contact : des cases entières, en largeur comme en hauteur
const contact = document.querySelector('.contact');
const card = contact && contact.querySelector('.contact-card');
const fitChecker = () => {
  card.style.minHeight = '';
  const w = contact.clientWidth;
  const cell = w / Math.max(8, Math.round(w / (w < 600 ? 28 : 44)));
  contact.style.setProperty('--cell', `${cell}px`);
  const inner = card.offsetHeight;
  const rows = Math.ceil(inner / cell);
  card.style.minHeight = `${rows * cell}px`;
};
if (card) {
  fitChecker();
  addEventListener('resize', fitChecker);
  document.fonts && document.fonts.ready.then(fitChecker);
}
