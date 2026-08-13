// script.js
import './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  const topbar = document.querySelector('.topbar');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    // Landing page navbar
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // Dashboard smart header
    if (topbar) {
      if (window.scrollY > 80 && window.scrollY > lastScrollY) {
        topbar.classList.add('topbar--hidden');
      } else {
        topbar.classList.remove('topbar--hidden');
      }
      lastScrollY = window.scrollY;
    }
  });

  // Dynamic Text Rotation (Typing Effect)
  const dynamicWord = document.getElementById('dynamic-word');
  if (dynamicWord) {
    const words = ["achieve", "succeed", "focus", "grow", "excel"];
    let currentWordIndex = 0;
    let isDeleting = false;
    let currentText = '';
    let typingSpeed = 150;

    function type() {
      const fullWord = words[currentWordIndex];

      if (isDeleting) {
        currentText = fullWord.substring(0, currentText.length - 1);
        typingSpeed = 50; // Erase faster
      } else {
        currentText = fullWord.substring(0, currentText.length + 1);
        typingSpeed = 150; // Type slower
      }

      dynamicWord.innerText = currentText;

      // Logic for changing state
      if (!isDeleting && currentText === fullWord) {
        // Pause at the end of the word
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentText === '') {
        isDeleting = false;
        currentWordIndex = (currentWordIndex + 1) % words.length;
        typingSpeed = 500; // Pause before typing next word
      }

      setTimeout(type, typingSpeed);
    }

    // Start the typing effect
    type();
  }

  // 1. Initialize Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Integrate Lenis with GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0, 0);


  // Magnetic Elements
  const magnetics = document.querySelectorAll('[data-magnetic]');
  magnetics.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const hx = rect.left + rect.width / 2;
      const hy = rect.top + rect.height / 2;
      const dx = e.clientX - hx;
      const dy = e.clientY - hy;

      gsap.to(el, {
        x: dx * 0.2,
        y: dy * 0.2,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.3)"
      });
    });
  });

  // Premium 3D Tilt Micro-Animation for Cards
  const tiltCards = document.querySelectorAll('.feature-card, .bento-item, .step-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5; // Max rotation 5deg
      const rotateY = ((x - centerX) / centerX) * 5;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 1000,
        ease: "power2.out",
        duration: 0.5
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        ease: "power3.out",
        duration: 0.8
      });
    });
  });

  // 3. Split Text Animation for Hero
  const splitElements = document.querySelectorAll('.split-text');
  splitElements.forEach(el => {
    const text = el.innerHTML;
    // Simple word splitter for demonstration (doesn't handle nested HTML well unless careful, but works for our hero)
    // Actually our hero has a <br> and a <span>. Let's animate it carefully.
    // We will just animate the entire h1 fading up, and the .serif-italic separately.
  });

  gsap.from(".overline", {
    y: 20, opacity: 0, duration: 1, delay: 0.2, ease: "power3.out"
  });

  gsap.from(".split-text", {
    y: 40, opacity: 0, duration: 1.2, delay: 0.4, ease: "power4.out"
  });

  gsap.from(".subheadline", {
    y: 20, opacity: 0, duration: 1, delay: 0.6, ease: "power3.out"
  });

  gsap.from(".hero-buttons", {
    y: 20, opacity: 0, duration: 1, delay: 0.8, ease: "power3.out"
  });

  // 4. Staggered Scroll Reveals (Replacing IntersectionObserver)
  const revealSections = document.querySelectorAll('.reveal');
  revealSections.forEach((section) => {
    gsap.from(section, {
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
        toggleActions: "play none none reverse"
      },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });
  });

  // 5. Parallax Scrolling Effects
  // Make the background grid move slightly slower than the page
  gsap.to("#interactive-grid", {
    yPercent: 30,
    ease: "none",
    scrollTrigger: {
      trigger: "#home",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });

  // Make the hero abstract sphere move faster than the page (floating up)
  gsap.to(".abstract-sphere", {
    yPercent: -40,
    ease: "none",
    scrollTrigger: {
      trigger: "#home",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });
  
  // Make the noise overlay shift slightly for texture depth
  gsap.to(".noise-overlay", {
    backgroundPosition: "0 100px",
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1
    }
  });

  // Render Visuals
  renderAbstractSphere();
  createInteractiveGrid();

  // Pricing Toggle Logic
  const billingToggle = document.getElementById('billing-toggle');
  const labelMonthly = document.getElementById('label-monthly');
  const labelAnnual = document.getElementById('label-annual');
  const amountElements = document.querySelectorAll('.amount');

  if (billingToggle) {
    billingToggle.addEventListener('change', function () {
      if (this.checked) {
        labelAnnual.classList.add('active');
        labelMonthly.classList.remove('active');
        amountElements.forEach(el => el.textContent = el.dataset.annual);
      } else {
        labelMonthly.classList.add('active');
        labelAnnual.classList.remove('active');
        amountElements.forEach(el => el.textContent = el.dataset.monthly);
      }
    });
  }
});

function createInteractiveGrid() {
  const gridContainer = document.getElementById('interactive-grid');
  if (!gridContainer) return;

  const gridSize = 80;
  let cols, rows;

  function drawGrid() {
    gridContainer.innerHTML = '';
    cols = Math.ceil(window.innerWidth / gridSize);
    rows = Math.ceil(window.innerHeight / gridSize);

    gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const totalCells = cols * rows;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.index = i;
      fragment.appendChild(cell);
    }
    gridContainer.appendChild(fragment);
  }

  drawGrid();

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(drawGrid, 150);
  });

  window.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const col = Math.floor(x / gridSize);
    const row = Math.floor(y / gridSize);

    if (col < cols && row < rows) {
      const index = row * cols + col;
      const cell = gridContainer.children[index];

      if (cell && !cell.classList.contains('hovered')) {
        cell.classList.add('hovered');
        setTimeout(() => {
          cell.classList.remove('hovered');
        }, 50);
      }
    }
  });
}

function renderAbstractSphere() {
  const container = document.getElementById('sphere');
  if (!container) return;

  const numPoints = 600;
  const radius = 350;
  const center = { x: 400, y: 400 };

  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angleIncrement = Math.PI * 2 * goldenRatio;

  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    const inclination = Math.acos(1 - 2 * t);
    const azimuth = angleIncrement * i;

    const x = Math.sin(inclination) * Math.cos(azimuth);
    const y = Math.sin(inclination) * Math.sin(azimuth);
    const z = Math.cos(inclination);

    const x2d = center.x + x * radius;
    const y2d = center.y + y * radius;

    const scale = (z + 2) / 3;
    const opacity = (z + 1) / 2;

    const mark = document.createElement('div');
    mark.className = 'plus-mark';
    mark.style.left = `${x2d}px`;
    mark.style.top = `${y2d}px`;
    mark.style.transform = `scale(${scale})`;
    mark.style.opacity = Math.max(0.1, opacity * 0.5);

    // Save initial coordinates for parallax
    mark.dataset.ix = x2d;
    mark.dataset.iy = y2d;
    mark.dataset.iz = z;

    container.appendChild(mark);
  }

  // Mouse Parallax Effect for the sphere
  const marks = container.querySelectorAll('.plus-mark');
  window.addEventListener('mousemove', (e) => {
    const mouseX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
    const mouseY = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1

    marks.forEach(mark => {
      const ix = parseFloat(mark.dataset.ix);
      const iy = parseFloat(mark.dataset.iy);
      const iz = parseFloat(mark.dataset.iz);

      // Move points based on their Z-depth (points closer move more)
      const moveX = mouseX * 40 * iz;
      const moveY = mouseY * 40 * iz;

      gsap.to(mark, {
        x: moveX,
        y: moveY,
        duration: 1,
        ease: "power2.out"
      });
    });
  });
}

