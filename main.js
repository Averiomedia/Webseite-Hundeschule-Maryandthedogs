/* ============================================================
   MARY AND THE DOGS — Premium JS
   ============================================================ */

/* ── Preloader ───────────────────────────────────────────── */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    gsap.to(preloader, {
      opacity: 0, duration: 0.8, ease: 'power2.inOut',
      onComplete: () => {
        preloader.style.display = 'none';
        initAnimations();
      }
    });
  }, 1800);
});

/* ── Lenis Smooth Scroll ─────────────────────────────────── */
const lenis = new Lenis({
  duration: 1.3,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ── Custom Cursor ───────────────────────────────────────── */
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursor-follower');
let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.1, ease: 'none' });
});

(function followLoop() {
  followerX += (mouseX - followerX) * 0.1;
  followerY += (mouseY - followerY) * 0.1;
  gsap.set(follower, { x: followerX, y: followerY });
  requestAnimationFrame(followLoop);
})();

document.querySelectorAll('a, button, .service-card, .pillar').forEach(el => {
  el.addEventListener('mouseenter', () => {
    gsap.to(cursor, { scale: 1.6, duration: 0.3 });
    gsap.to(follower, { scale: 1.5, opacity: 0.4, duration: 0.3 });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(cursor, { scale: 1, duration: 0.3 });
    gsap.to(follower, { scale: 1, opacity: 1, duration: 0.3 });
  });
});

/* ── Magnetic Buttons ────────────────────────────────────── */
document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  });
});

/* ── Navbar Scroll ───────────────────────────────────────── */
const nav = document.querySelector('nav');
lenis.on('scroll', ({ scroll }) => {
  nav.classList.toggle('scrolled', scroll > 60);
});

/* ── Hamburger ───────────────────────────────────────────── */
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  lenis[mobileMenu.classList.contains('open') ? 'stop' : 'start']();
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    lenis.start();
  });
});

/* ── Particle Canvas ─────────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.life = 0;
      this.maxLife = Math.random() * 200 + 100;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life++;
      if (this.life > this.maxLife || this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      const fade = this.life < 30 ? this.life / 30 : this.life > this.maxLife - 30 ? (this.maxLife - this.life) / 30 : 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 94, 60, ${this.opacity * fade})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  let mouse = { x: W / 2, y: H / 2 };
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(139, 94, 60, ${0.07 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(loop);
  }
  loop();
}

/* ── Counter Animation ───────────────────────────────────── */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target, duration: 2, ease: 'power2.out',
          onUpdate: function() { el.textContent = Math.round(this.targets()[0].val) + '+'; }
        });
      }
    });
  });
}

/* ── Text Split Reveal ───────────────────────────────────── */
function splitAndReveal(selector, stagger = 0.05) {
  document.querySelectorAll(selector).forEach(el => {
    const words = el.innerText.split(' ');
    el.innerHTML = words.map(w => `<span class="split-word"><span>${w}</span></span>`).join(' ');
    gsap.from(el.querySelectorAll('.split-word span'), {
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      y: '110%', opacity: 0, duration: 0.8, stagger, ease: 'power3.out'
    });
  });
}

/* ── Main Animations ─────────────────────────────────────── */
function initAnimations() {
  initParticles();

  /* Hero entrance */
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8 })
    .to('.hero-title .line span', { y: '0%', duration: 1, stagger: 0.12 }, '-=0.3')
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
    .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5');

  /* Scroll-reveal generics */
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out'
    });
  });
  gsap.utils.toArray('.reveal-left').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      opacity: 1, x: 0, duration: 0.9, ease: 'power3.out'
    });
  });
  gsap.utils.toArray('.reveal-right').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      opacity: 1, x: 0, duration: 0.9, ease: 'power3.out'
    });
  });

  /* Staggered card reveals */
  gsap.utils.toArray('.stagger-parent').forEach(parent => {
    gsap.from(parent.querySelectorAll('.stagger-child'), {
      scrollTrigger: { trigger: parent, start: 'top 80%', once: true },
      opacity: 0, y: 50, duration: 0.8, stagger: 0.12, ease: 'power3.out'
    });
  });

  /* Text split reveals */
  splitAndReveal('.big-quote', 0.03);

  /* Section titles line by line */
  document.querySelectorAll('.animate-title').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      opacity: 0, y: 40, duration: 1, ease: 'power3.out'
    });
  });

  /* Parallax hero elements */
  gsap.to('#particle-canvas', {
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
    y: 150, opacity: 0
  });
  gsap.to('.hero-content', {
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
    y: 100
  });

  /* Parallax about image */
  gsap.to('.about-image-frame img', {
    scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 },
    y: -60
  });

  /* Parallax gallery items */
  gsap.utils.toArray('.gallery-item').forEach((item, i) => {
    const dir = i % 2 === 0 ? -30 : 30;
    gsap.to(item, {
      scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: 1 },
      y: dir
    });
  });

  /* Process steps */
  gsap.utils.toArray('.process-step').forEach((step, i) => {
    gsap.from(step, {
      scrollTrigger: { trigger: step, start: 'top 95%', once: true },
      opacity: 0, x: -40, duration: 0.8, delay: i * 0.1, ease: 'power3.out'
    });
  });

  /* Glowing line on CTA */
  gsap.from('.cta-bg', {
    scrollTrigger: { trigger: '#cta', start: 'top 80%', once: true },
    scale: 0.5, opacity: 0, duration: 1.5, ease: 'power2.out'
  });

  /* Horizontal testimonial drag */
  initTestimonialDrag();

  /* ── Meet the Team Cards ── */
  const dogCards = document.querySelectorAll('.dog-card');
  dogCards.forEach((card, i) => {
    gsap.to(card, {
      scrollTrigger: { trigger: card, start: 'top 85%', once: true },
      opacity: 1,
      y: 0,
      duration: 0.9,
      delay: i * 0.18,
      ease: 'power3.out'
    });
    /* Floating wobble on hover via GSAP */
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -8, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });

  /* ── Seminar list — cascade in ── */
  gsap.utils.toArray('.seminar-list li').forEach((li, i) => {
    gsap.to(li, {
      scrollTrigger: { trigger: li, start: 'top 90%', once: true },
      opacity: 1,
      x: 0,
      duration: 0.5,
      delay: i * 0.04,
      ease: 'power2.out'
    });
  });

  /* ── Maulkorb split animation ── */
  const maulkorbTl = gsap.timeline({
    scrollTrigger: { trigger: '#maulkorb', start: 'top 80%', once: true }
  });
  maulkorbTl
    .from('.maulkorb-img-wrap', {
      x: -80, opacity: 0, duration: 1, ease: 'power3.out'
    })
    .from('.maulkorb-text', {
      x: 60, opacity: 0, duration: 0.9, ease: 'power3.out'
    }, '-=0.6')
    .from('.maulkorb-text .section-tag', {
      y: 16, opacity: 0, duration: 0.5, ease: 'power2.out'
    }, '-=0.4')
    .from('.maulkorb-text .section-title', {
      y: 20, opacity: 0, duration: 0.6, ease: 'power2.out'
    }, '-=0.35')
    .from('.maulkorb-text .section-lead', {
      y: 16, opacity: 0, duration: 0.5, ease: 'power2.out'
    }, '-=0.3')
    .from('.maulkorb-text .btn-primary', {
      y: 12, opacity: 0, duration: 0.5, ease: 'back.out(1.4)'
    }, '-=0.2');

  /* Counters */
  animateCounters();

  /* Gold line reveal */
  gsap.utils.toArray('.gold-line').forEach(line => {
    gsap.from(line, {
      scrollTrigger: { trigger: line, start: 'top 90%', once: true },
      scaleX: 0, transformOrigin: 'left', duration: 0.8, ease: 'power2.out'
    });
  });
}

/* ── Testimonial Drag Scroll ─────────────────────────────── */
function initTestimonialDrag() {
  const track = document.querySelector('.testimonials-track');
  if (!track) return;
  let isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', e => {
    isDown = true; track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  track.addEventListener('mouseleave', () => { isDown = false; track.style.cursor = 'grab'; });
  track.addEventListener('mouseup', () => { isDown = false; track.style.cursor = 'grab'; });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });
  track.style.cursor = 'grab';
}

/* ── Hover Trail ─────────────────────────────────────────── */
(function initTrail() {
  const dots = [];
  const NUM = 8;
  for (let i = 0; i < NUM; i++) {
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;width:${4 + i}px;height:${4 + i}px;border-radius:50%;background:rgba(200,150,62,${0.3 - i * 0.03});pointer-events:none;z-index:9997;transform:translate(-50%,-50%);transition:opacity .3s`;
    document.body.appendChild(d);
    dots.push({ el: d, x: 0, y: 0 });
  }
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function loop() {
    dots.forEach((d, i) => {
      const prev = dots[i - 1] || { x: mx, y: my };
      d.x += (prev.x - d.x) * 0.35;
      d.y += (prev.y - d.y) * 0.35;
      gsap.set(d.el, { x: d.x, y: d.y });
    });
    requestAnimationFrame(loop);
  })();
})();

/* ── Philosophy Cards Fan Animation ──────────────────────── */
const philCards = document.querySelectorAll('.phil-fan-stage .phil-card');
const fanPositions = [
  { x: -340, rot: -15 },
  { x: -115, rot:  -5 },
  { x:  115, rot:   5 },
  { x:  340, rot:  15 },
];

if (window.innerWidth > 900) {
  gsap.set(philCards, { x: 0, rotation: 0 });
  const fanTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#phil-slider',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
    }
  });
  philCards.forEach((card, i) => {
    fanTl.to(card, { x: fanPositions[i].x, rotation: fanPositions[i].rot, ease: 'power2.out', duration: 1 }, 0);
  });
}

/* ── Seminar List Entrance ───────────────────────────────── */
gsap.utils.toArray('.seminar-list li').forEach((li, i) => {
  gsap.from(li, {
    scrollTrigger: { trigger: '.seminar-list', start: 'top 85%', once: true },
    opacity: 0, x: 20, duration: 0.45,
    delay: i * 0.04,
    ease: 'power2.out'
  });
});

/* ── Active Nav Link ─────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
lenis.on('scroll', ({ scroll }) => {
  sections.forEach(s => {
    if (scroll >= s.offsetTop - 200) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${s.id}"]`);
      if (active) active.classList.add('active');
    }
  });
});

/* ── Mobile: ScrollTrigger refresh nach Fonts & Bildern ─── */
window.addEventListener('load', () => {
  setTimeout(() => ScrollTrigger.refresh(), 500);
});
