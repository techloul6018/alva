document.documentElement.classList.add('js');
document.getElementById('year').textContent = new Date().getFullYear();

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── Split headings into masked words ── */
document.querySelectorAll('.section h2').forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/ +/)
    .map((w, i) => `<span class="wm" aria-hidden="true"><span class="wi" style="--i:${i}">${esc(w)}</span></span>`)
    .join(' ');
  el.classList.add('reveal-split');
});

/* ── Manifesto: wrap each word so it can light up on scroll ── */
const scrub = document.querySelector('[data-scrub]');
let scrubWords = [];
if (scrub) {
  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const s = document.createElement('span');
          s.className = 'sw'; s.textContent = part; frag.append(s);
        });
        child.replaceWith(frag);
      } else {
        wrap(child);
      }
    });
  };
  wrap(scrub);
  scrubWords = [...scrub.querySelectorAll('.sw')];
}

/* ── Staggered reveal on scroll ── */
document.querySelectorAll('.principles, .materials, .steps, .commitments, .projects, .inspirations').forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty('--stagger', i));
});

const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/+';
function scramble(el) {
  const node = [...el.childNodes].reverse().find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (!node || reduced) return;
  const final = node.textContent;
  const start = performance.now();
  const duration = 700 + final.length * 18;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const shown = Math.floor(t * final.length);
    node.textContent = final.split('').map((c, i) => {
      if (i < shown || c === ' ') return c;
      return scrambleChars[(Math.random() * scrambleChars.length) | 0];
    }).join('');
    if (t < 1) requestAnimationFrame(tick); else node.textContent = final;
  };
  requestAnimationFrame(tick);
}

const revealTargets = document.querySelectorAll('.reveal, .reveal-split, .footer-mark, .section .eyebrow');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      if (e.target.classList.contains('eyebrow')) scramble(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-in'));
}

/* ── Rotating word in the hero title ── */
const rots = [...document.querySelectorAll('.rot')];
rots.forEach((r) => {
  r.innerHTML = [...r.textContent].map((c, i) => `<span class="ch" style="--i:${i}">${esc(c)}</span>`).join('');
});
if (rots.length && !reduced) {
  rots[0].classList.remove('is-on');
  rots[0].classList.add('is-first');
  requestAnimationFrame(() => requestAnimationFrame(() => rots[0].classList.add('is-on')));
  let current = 0;
  setInterval(() => {
    if (document.hidden) return;
    const out = rots[current];
    out.classList.remove('is-on', 'is-first');
    out.classList.add('is-out');
    setTimeout(() => {
      out.classList.add('is-reset');
      out.classList.remove('is-out');
      void out.offsetWidth;
      out.classList.remove('is-reset');
    }, 1100);
    current = (current + 1) % rots.length;
    rots[current].classList.add('is-on');
  }, 2600);
}

/* ── Scroll-driven effects: progress, nav, marquee, manifesto, parallax ── */
const nav = document.querySelector('.nav');
const progress = document.querySelector('.progress');
const photo = document.querySelector('.piece-photo');
const rows = [...document.querySelectorAll('.marquee-row')].map((row) => {
  const track = row.querySelector('.marquee-track');
  track.innerHTML += track.innerHTML;
  return { track, dir: Number(row.dataset.dir) || 1, x: 0, half: 0 };
});
const measure = () => rows.forEach((r) => { r.half = r.track.scrollWidth / 2; });
measure();
addEventListener('resize', measure);
document.fonts && document.fonts.ready.then(measure);

let lastY = scrollY;
let velocity = 0;

function onScroll() {
  const y = scrollY;
  const delta = y - lastY;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.setProperty('--p', max > 0 ? y / max : 0);
  if (Math.abs(delta) > 4) nav.classList.toggle('is-hidden', delta > 0 && y > 200);
  velocity += delta * 0.04;
  lastY = y;

  if (scrubWords.length) {
    const r = scrub.getBoundingClientRect();
    const p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3);
    const lit = Math.round(Math.max(0, Math.min(1, p)) * scrubWords.length);
    scrubWords.forEach((w, i) => w.classList.toggle('lit', i < lit));
  }
  if (photo && !reduced) {
    const r = photo.parentElement.getBoundingClientRect();
    const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    photo.style.setProperty('--py', `${(-p * 40).toFixed(1)}px`);
  }
}
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
onScroll();

if (!reduced) {
  const loop = () => {
    velocity *= 0.9;
    const v = Math.max(-30, Math.min(30, velocity));
    rows.forEach((r) => {
      if (!r.half) return;
      r.x -= (0.6 + Math.abs(v)) * r.dir * (v < -0.5 ? -1 : 1);
      if (r.x <= -r.half) r.x += r.half;
      if (r.x > 0) r.x -= r.half;
      r.track.style.setProperty('--x', `${r.x.toFixed(2)}px`);
      r.track.style.setProperty('--skew', `${(-v * 0.35).toFixed(2)}deg`);
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ── Pointer effects (desktop only) ── */
if (finePointer && !reduced) {
  const glow = document.querySelector('.cursor-glow');
  const hero = document.querySelector('.hero-visual');
  let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my;
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    glow.classList.add('is-on');
    hero.style.setProperty('--rx', ((mx / innerWidth - 0.5) * 16).toFixed(2));
    hero.style.setProperty('--ry', ((0.5 - my / innerHeight) * 10).toFixed(2));
  });
  document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
  const follow = () => {
    gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12;
    glow.style.setProperty('--cx', `${gx.toFixed(1)}px`);
    glow.style.setProperty('--cy', `${gy.toFixed(1)}px`);
    requestAnimationFrame(follow);
  };
  follow();

  document.querySelectorAll('.principle, .step, .material, .project, .commitment').forEach((card) => {
    card.classList.add('spot');
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  document.querySelectorAll('.magnetic, .nav-cta').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--tx', `${((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1)}px`);
      el.style.setProperty('--ty', `${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px`);
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--tx'); el.style.removeProperty('--ty'); });
  });
}
