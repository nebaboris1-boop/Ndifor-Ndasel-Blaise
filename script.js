/* =========================================================
   VOLTEDGE ELECTRICAL — SCRIPT
   Vanilla JS: nav, canvas circuit/sparks, counters, estimator,
   project filters/flip, testimonial slider, accordion, form,
   scroll reveal, custom cursor.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     0. Init icon library
  --------------------------------------------------------- */
  if (window.lucide) lucide.createIcons();

  /* ---------------------------------------------------------
     1. Sticky navbar + active link highlight
  --------------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);

    let current = '';
    sections.forEach((sec) => {
      const top = sec.offsetTop - 140;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     2. Mobile menu toggle
  --------------------------------------------------------- */
  const hamburger = document.getElementById('hamburger');
  const navLinksList = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinksList.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });
  navLinksList.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navLinksList.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    })
  );

  /* ---------------------------------------------------------
     3. Custom cursor (desktop / fine-pointer only)
  --------------------------------------------------------- */
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (isFinePointer) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let ringX = 0, ringY = 0;

    window.addEventListener('mousemove', (e) => {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      ringX = e.clientX;
      ringY = e.clientY;
    });
    (function animateRing() {
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      requestAnimationFrame(animateRing);
    })();

    document.querySelectorAll('a, button, .service-card, .project-card').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.style.transform = 'translate(-50%,-50%) scale(1.6)');
      el.addEventListener('mouseleave', () => ring.style.transform = 'translate(-50%,-50%) scale(1)');
    });

    // Spark click effect
    document.addEventListener('click', (e) => {
      for (let i = 0; i < 6; i++) {
        const spark = document.createElement('span');
        spark.className = 'click-spark';
        spark.style.cssText = `
          position:fixed; left:${e.clientX}px; top:${e.clientY}px;
          width:4px; height:4px; border-radius:50%;
          background:${i % 2 === 0 ? '#FFB800' : '#00D2FF'};
          pointer-events:none; z-index:9998;`;
        document.body.appendChild(spark);
        const angle = (Math.PI * 2 * i) / 6;
        const dist = 24 + Math.random() * 16;
        spark.animate(
          [
            { transform: 'translate(0,0)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`, opacity: 0 }
          ],
          { duration: 450, easing: 'ease-out' }
        ).onfinish = () => spark.remove();
      }
    });
  }

  /* ---------------------------------------------------------
     4. Hero canvas — circuit-board + spark particle effect
  --------------------------------------------------------- */
  const canvas = document.getElementById('circuitCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  function resizeCanvas() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }

  function initParticles() {
    const count = window.innerWidth < 760 ? 35 : 70;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.6,
    }));
  }

  function drawFrame() {
    ctx.clearRect(0, 0, w, h);

    // Move + draw nodes
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 210, 255, 0.7)';
      ctx.fill();
    });

    // Draw connecting "circuit traces" between nearby nodes
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          const opacity = 1 - dist / 140;
          ctx.strokeStyle = `rgba(255, 184, 0, ${opacity * 0.25})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawFrame);
  }

  resizeCanvas();
  initParticles();
  drawFrame();
  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });

  /* ---------------------------------------------------------
     5. Animated counters (Intersection Observer triggered)
  --------------------------------------------------------- */
  const counters = document.querySelectorAll('.stat-number');
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 1600;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
          el.textContent = Math.floor(eased * target);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target;
        }
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => counterObserver.observe(c));

  /* ---------------------------------------------------------
     6. Service Estimator
  --------------------------------------------------------- */
  const estTabs = document.querySelectorAll('.est-tab');
  const scopeRange = document.getElementById('scopeRange');
  const scopeVal = document.getElementById('scopeVal');
  const estimatorPrice = document.getElementById('estimatorPrice');

  function formatUSD(n) {
    return `$${Math.round(n).toLocaleString('en-US')}`;
  }

  function updateEstimate() {
    const activeTab = document.querySelector('.est-tab.active');
    const base = parseFloat(activeTab.dataset.base);
    const rate = parseFloat(activeTab.dataset.rate);
    const hours = parseInt(scopeRange.value, 10);

    const low = base + rate * hours * 0.85;
    const high = base + rate * hours * 1.15;
    estimatorPrice.textContent = `${formatUSD(low)} – ${formatUSD(high)}`;
  }

  estTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      estTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      updateEstimate();
    });
  });

  scopeRange.addEventListener('input', () => {
    scopeVal.textContent = scopeRange.value;
    updateEstimate();
  });

  updateEstimate();

  /* ---------------------------------------------------------
     7. Project filter + flip cards
  --------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      projectCards.forEach((card) => {
        const cats = card.dataset.category.split(' ');
        const show = filter === 'all' || cats.includes(filter);
        card.classList.toggle('hide', !show);
      });
    });
  });

  projectCards.forEach((card) => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });

  /* ---------------------------------------------------------
     8. Testimonial slider
  --------------------------------------------------------- */
  const track = document.getElementById('testimonialTrack');
  const slides = track.querySelectorAll('.testimonial-card');
  const dotsWrap = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  let activeSlide = 0;
  let autoTimer;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll('.dot');

  function goToSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    activeSlide = index;
    resetAutoplay();
  }

  function nextSlide() { goToSlide((activeSlide + 1) % slides.length); }
  function prevSlide() { goToSlide((activeSlide - 1 + slides.length) % slides.length); }

  function resetAutoplay() {
    clearInterval(autoTimer);
    autoTimer = setInterval(nextSlide, 6000);
  }

  nextBtn.addEventListener('click', nextSlide);
  prevBtn.addEventListener('click', prevSlide);
  goToSlide(0);
  resetAutoplay();

  /* ---------------------------------------------------------
     9. FAQ accordion
  --------------------------------------------------------- */
  document.querySelectorAll('.accordion-item').forEach((item) => {
    const header = item.querySelector('.accordion-header');
    const panel = item.querySelector('.accordion-panel');

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others (single-open accordion)
      item.parentElement.querySelectorAll('.accordion-item').forEach((other) => {
        other.classList.remove('open');
        other.querySelector('.accordion-panel').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

  /* ---------------------------------------------------------
     10. Contact form (front-end validation + simulated submit)
  --------------------------------------------------------- */
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const serviceType = form.serviceType.value;
    const message = form.message.value.trim();

    if (!name || !phone || !serviceType || !message) {
      formStatus.textContent = 'Please fill in all fields before submitting.';
      formStatus.className = 'form-status error';
      return;
    }

    const phonePattern = /^[+()\-.\s\d]{7,}$/;
    if (!phonePattern.test(phone)) {
      formStatus.textContent = 'Please enter a valid phone number.';
      formStatus.className = 'form-status error';
      return;
    }

    // NOTE: This demo has no backend. Replace with a real API/fetch call
    // to your server or a form service (e.g. Formspree) to go live.
    formStatus.textContent = `Thanks, ${name.split(' ')[0]}! Your request has been received — we'll be in touch shortly.`;
    formStatus.className = 'form-status success';
    form.reset();
  });

  /* ---------------------------------------------------------
     11. Scroll reveal animations (ScrollReveal lib, with
         a plain Intersection Observer fallback)
  --------------------------------------------------------- */
  if (window.ScrollReveal) {
    ScrollReveal().reveal('.reveal', {
      distance: '30px',
      duration: 700,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      origin: 'bottom',
      interval: 60,
      opacity: 0,
      reset: false,
    });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('reveal-init'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('reveal-init');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     12. Dynamic footer year
  --------------------------------------------------------- */
  document.getElementById('currentYear').textContent = new Date().getFullYear();

});
