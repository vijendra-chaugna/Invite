/**
 * =============================================================================
 * ROYAL WEDDING INVITATION — JAVASCRIPT ENGINE
 * Plain Vanilla JS • Fully Configurable • Zero External Dependencies
 * =============================================================================
 */

'use strict';

/* -----------------------------------------------------------------------------
   CONFIG OBJECT (All customizable parameters, text, dates & asset paths)
   ----------------------------------------------------------------------------- */
const CONFIG = {
  // Couple Information
  groom: {
    name: "Sunil",
    fullName: "Sunil Chaugna",
    parents: "Son of Mr. Ganpat and Mrs. Sushila Chaugna",
    tagline: "",
    bio: "A visionary designer drawn to royal arches and soulful journeys, ready for life's greatest collaboration.",
    photo: "Assets/Couple IMages/Couple_image.webp"
  },
  bride: {
    name: "Anamika",
    fullName: "Anamika Mehra",
    parents: "Daughter of Mr. Jetharam and Mrs. Munni Devi Mehra",
    tagline: "",
    bio: "A graceful soul who brings warmth, music, and vibrant colors to every heart she touches.",
    photo: "Assets/Couple IMages/Couple_image1.webp"
  },

  // Wedding Date & Time
  weddingDate: "2026-12-02T11:30:00", // ISO 8601 for live countdown
  weddingDateDisplay: "Wednesday, 02 December 2026",
  weddingCity: "Nagaur, Rajasthan",
  weddingVenue: "Chaugna Farm House, Nagaur",
  hashtag: "#SunilWedsAnamika",
  websiteUrl: "https://bow-bouquet.vs022480o.workers.dev/",

  // RSVP Contact & Form Endpoint
  whatsAppNumber: "919876543210", // International format without '+' or spaces
  rsvpDeadline: "15 January 2027",
  googleScriptUrl: "", // Optional Google Apps Script / Formspree URL for automated spreadsheet logging

  // Assets Mapping
  entranceVideo: "Assets/entrance_video.mp4",
  backgroundMusic: "Assets/ReelAudio-7073.mp3",

  // Section Backgrounds Mapping (Reuses background images gracefully)
  sectionBackgrounds: {
    hero: "Assets/bg_images/bg_hero_mobile.webp",
    message: "Assets/bg_images/bg_mobile.webp",
    countdown: "Assets/bg_images/bg2_mobile.webp",
    couple: "Assets/bg_images/bg3_mobile.webp",
    story: "Assets/bg_images/bg4_mobile.webp",
    events: "Assets/bg_images/bg1_mobile.webp",
    gallery: "Assets/bg_images/bg3_mobile.webp",
    rsvp: null,
    footer: "Assets/bg_images/bg1_mobile.webp"
  },

  // Events Itinerary
  events: [
    {
      title: "Ghee Paan and Haldi",
      dateStr: "30 Nov 2026 • 05:00 PM Onwards",
      startIso: "2026-11-30T17:00:00",
      endIso: "2026-11-30T22:00:00",
      venue: "Chaugna Farmhouse, Nagaur",
      dressCode: "Sunshine Yellow",
      desc: "Bathed in golden turmeric and auspicious blessings, adorned with folk melodies, floral showers, and joyous celebration.",
      mapUrl: "https://maps.google.com/?q=Chaugna+Farmhouse+Nagaur",
      image: "Assets/Events/Haldi-mehndi-event.webp"
    },
    {
      title: "Mehndi and Sangeet Sandhya(Ratijoga)",
      dateStr: "01 Dec 2026 • 05:00 PM Onwards",
      startIso: "2026-12-01T17:00:00",
      endIso: "2026-12-01T23:30:00",
      venue: "Chaugna Farmhouse, Nagaur",
      dressCode: "Festive Green",
      desc: "A sparkling evening of dance, celebration, laughter & musical rivalry.",
      mapUrl: "https://maps.google.com/?q=Chaugna+Farmhouse+Nagaur",
      image: "Assets/Events/Sangeet-event.webp"
    },
    {
      title: "Mayra",
      dateStr: "02 Dec 2026 • 12:00 PM Onwards",
      startIso: "2026-12-02T12:00:00",
      endIso: "2026-12-02T16:00:00",
      venue: "Chaugna Farmhouse, Nagaur",
      dressCode: "Traditional Marwari Dress",
      desc: "A sacred Marwari maternal celebration filled with heartfelt traditions, auspicious blessings, and joyful welcome.",
      mapUrl: "https://maps.google.com/?q=Chaugna+Farmhouse+Nagaur",
      image: "Assets/Events/mayra-event.webp"
    },
    {
      title: "Shubh Vivah",
      dateStr: "Wednesday, 02 Dec 2026 • Baraat 4:00 PM | Varmala 9:00 PM",
      startIso: "2026-12-02T16:00:00",
      endIso: "2026-12-03T02:00:00",
      venue: "Mehra House, Nagaur",
      dressCode: "Traditional Royal Ethnic",
      desc: "Sacred Baraat arrival at 4:00 PM followed by divine Varmala at 9:00 PM and traditional wedding rituals.",
      mapUrl: "https://maps.google.com/?q=Mehra+House+Nagaur",
      image: "Assets/Events/wedding-event.webp"
    }
  ],

  // Gallery Photos
  gallery: [
    { src: "Assets/Couple IMages/Couple_image.webp", caption: "Eternal Beginnings" },
    { src: "Assets/Couple IMages/Couple_image1.webp", caption: "Laughter & Grace" },
    { src: "Assets/Couple IMages/Couple_image2.webp", caption: "By The Palaces" },
    { src: "Assets/Couple IMages/Couple_image3.webp", caption: "Shared Glances" },
    { src: "Assets/Couple IMages/Couple_image4.webp", caption: "Golden Hour Glow" },
    { src: "Assets/Couple IMages/Couple_image5.webp", caption: "Forever in Love" }
  ]
};

/* -----------------------------------------------------------------------------
   GLOBAL STATE
   ----------------------------------------------------------------------------- */
const AppState = {
  entrancePassed: false,
  scratchDone: false,
  heroParticlesActive: true,
  currentGalleryIdx: 0,
  currentStoryIdx: 0,
  currentEventIdx: 0,
  isMusicPlaying: false
};

/* -----------------------------------------------------------------------------
   MODULE 1: STAGE & ASPECT RATIO SYSTEM
   Calculates exact natural aspect ratio of background images so ZERO cropping occurs.
   ----------------------------------------------------------------------------- */
function initStage() {
  const sections = document.querySelectorAll('.page-section');

  sections.forEach((section) => {
    const bgKey = section.getAttribute('data-bg');
    const stage = section.querySelector('.stage');
    const bgImg = stage ? stage.querySelector('.stage-bg') : null;

    if (!stage || !bgImg) return;

    // Apply mapped background from CONFIG if set
    if (bgKey && CONFIG.sectionBackgrounds[bgKey]) {
      bgImg.src = CONFIG.sectionBackgrounds[bgKey];
    }

    // Function to calculate and update --ar
    const updateAspectRatio = () => {
      if (bgImg.naturalWidth && bgImg.naturalHeight) {
        const ar = bgImg.naturalWidth / bgImg.naturalHeight;
        stage.style.setProperty('--ar', ar.toFixed(5));
      }
    };

    if (bgImg.complete && bgImg.naturalWidth > 0) {
      updateAspectRatio();
    } else {
      bgImg.addEventListener('load', updateAspectRatio, { once: true });
    }
  });

  window.addEventListener('resize', () => {
    sections.forEach((section) => {
      const stage = section.querySelector('.stage');
      const bgImg = stage ? stage.querySelector('.stage-bg') : null;
      if (stage && bgImg && bgImg.naturalWidth) {
        const ar = bgImg.naturalWidth / bgImg.naturalHeight;
        stage.style.setProperty('--ar', ar.toFixed(5));
      }
    });
  });
}

/* -----------------------------------------------------------------------------
   MODULE 1B: DYNAMIC DOM SYNC FROM CONFIG
   Ensures any modifications to the CONFIG object at the top instantly reflect across DOM
   ----------------------------------------------------------------------------- */
function applyConfigToDOM() {
  const groomEl = document.querySelector('.groom-name');
  const brideEl = document.querySelector('.bride-name');
  if (groomEl && CONFIG.groom.name) groomEl.textContent = CONFIG.groom.name;
  if (brideEl && CONFIG.bride.name) brideEl.textContent = CONFIG.bride.name;

  const metaDate = document.querySelector('.meta-date');
  const metaCity = document.querySelector('.meta-city');
  if (metaDate && CONFIG.weddingDateDisplay) metaDate.textContent = CONFIG.weddingDateDisplay.toUpperCase();
  if (metaCity && CONFIG.weddingCity) metaCity.textContent = CONFIG.weddingCity;

  const revealDateBig = document.querySelector('.reveal-date-big');
  if (revealDateBig && CONFIG.weddingDateDisplay) {
    revealDateBig.textContent = CONFIG.weddingDateDisplay.toUpperCase();
  }

  const groomName = document.querySelector('#groomCard .couple-name');
  const groomTagline = document.querySelector('#groomCard .couple-tagline');
  const groomParents = document.querySelector('#groomCard .couple-parents');
  const groomBio = document.querySelector('#groomCard .couple-bio');
  const groomPhoto = document.querySelector('#groomCard .couple-photo');

  if (groomName && CONFIG.groom.fullName) groomName.textContent = CONFIG.groom.fullName;
  if (groomTagline && CONFIG.groom.tagline) groomTagline.textContent = CONFIG.groom.tagline;
  if (groomParents && CONFIG.groom.parents) groomParents.textContent = CONFIG.groom.parents;
  if (groomBio && CONFIG.groom.bio) groomBio.textContent = `"${CONFIG.groom.bio}"`;
  if (groomPhoto && CONFIG.groom.photo) groomPhoto.src = CONFIG.groom.photo;

  const brideName = document.querySelector('#brideCard .couple-name');
  const brideTagline = document.querySelector('#brideCard .couple-tagline');
  const brideParents = document.querySelector('#brideCard .couple-parents');
  const brideBio = document.querySelector('#brideCard .couple-bio');
  const bridePhoto = document.querySelector('#brideCard .couple-photo');

  if (brideName && CONFIG.bride.fullName) brideName.textContent = CONFIG.bride.fullName;
  if (brideTagline && CONFIG.bride.tagline) brideTagline.textContent = CONFIG.bride.tagline;
  if (brideParents && CONFIG.bride.parents) brideParents.textContent = CONFIG.bride.parents;
  if (brideBio && CONFIG.bride.bio) brideBio.textContent = `"${CONFIG.bride.bio}"`;
  if (bridePhoto && CONFIG.bride.photo) bridePhoto.src = CONFIG.bride.photo;

  const hashtagText = document.querySelector('.hashtag-text');
  if (hashtagText && CONFIG.hashtag) hashtagText.textContent = CONFIG.hashtag;

  const footerNames = document.querySelector('.footer-names');
  if (footerNames && CONFIG.groom.name && CONFIG.bride.name) {
    footerNames.textContent = `${CONFIG.groom.name} & ${CONFIG.bride.name}`;
  }

  const msgNames = document.querySelectorAll('#message .message-person-name');
  const msgLineages = document.querySelectorAll('#message .message-person-lineage');
  if (msgNames.length >= 2) {
    if (CONFIG.groom.fullName) msgNames[0].textContent = CONFIG.groom.fullName;
    if (CONFIG.bride.fullName) msgNames[1].textContent = CONFIG.bride.fullName;
  }
  if (msgLineages.length >= 2) {
    if (CONFIG.groom.parents) msgLineages[0].textContent = CONFIG.groom.parents;
    if (CONFIG.bride.parents) msgLineages[1].textContent = CONFIG.bride.parents;
  }

  const revealVenue = document.querySelector('.reveal-venue');
  if (revealVenue && CONFIG.weddingVenue) {
    revealVenue.textContent = CONFIG.weddingVenue;
  }
}

/* -----------------------------------------------------------------------------
   MODULE 2: CINEMATIC ENTRANCE SCREEN
   Full-screen video curtain with "Tap to Open", unmuted playback, and 2s dissolve.
   ----------------------------------------------------------------------------- */
function initEntrance() {
  const overlay = document.getElementById('entranceOverlay');
  const video = document.getElementById('entranceVideo');
  const promptBtn = document.getElementById('entrancePrompt');
  const skipBtn = document.getElementById('entranceSkip');
  const bloom = document.getElementById('entranceBloom');

  if (!overlay || !video) return;

  // Set video source from CONFIG
  if (CONFIG.entranceVideo) {
    const source = video.querySelector('source');
    if (source) source.src = CONFIG.entranceVideo + '#t=0.001';
    video.load();
  }

  // Ensure first frame is displayed by seeking to start as soon as metadata is loaded
  video.addEventListener('loadedmetadata', () => {
    try {
      video.currentTime = 0.001;
    } catch (e) {
      // Ignore if not permitted
    }
  });

  // Smooth cinematic dissolve transition into hero
  const dissolveIntoHero = () => {
    if (AppState.entrancePassed) return;
    AppState.entrancePassed = true;

    // Trigger bloom flash
    if (bloom) bloom.classList.add('bloom-active');

    // Add dissolve CSS classes
    overlay.classList.add('dissolving');

    // Trigger Cinematic Dolly Zoom on Hero background & line-by-line reveal
    const heroSection = document.getElementById('hero');
    if (heroSection) heroSection.classList.add('hero-revealed');

    // Reveal hero content lines with staggered timings
    const heroReveals = document.querySelectorAll('#hero .hero-line, #hero .reveal');
    heroReveals.forEach((el) => el.classList.add('in-view'));

    // Automatically transition to background music as entrance ends
    playBackgroundMusic();

    // Unlock body scroll after transition completes
    setTimeout(() => {
      document.body.classList.remove('scroll-locked');
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      resetScrollToTop();
    }, 2200);
  };

  // Play video unmuted upon tap
  const handleOpenTap = (e) => {
    e.stopPropagation();
    promptBtn.classList.add('hidden');

    video.muted = false;
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Video playing smoothly
        })
        .catch((err) => {
          console.warn("Autoplay with audio restricted, trying muted playback:", err);
          video.muted = true;
          video.play().catch(() => dissolveIntoHero());
        });
    }
  };

  promptBtn.addEventListener('click', handleOpenTap);
  overlay.addEventListener('click', (e) => {
    // If prompt is still visible, clicking anywhere on overlay triggers opening
    if (!promptBtn.classList.contains('hidden')) {
      handleOpenTap(e);
    }
  });

  // Dissolve on video ended
  video.addEventListener('ended', dissolveIntoHero);

  // Skip / direct open fallback button
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.pause();
      dissolveIntoHero();
    });
  }

  // Video error handling fallback
  video.addEventListener('error', () => {
    console.warn("Video unable to load; displaying direct open fallback.");
    promptBtn.querySelector('.entrance-btn-label').textContent = "Open Invitation";
    promptBtn.addEventListener('click', dissolveIntoHero, { once: true });
  });
}

/* -----------------------------------------------------------------------------
   MODULE 3: REVEAL ON SCROLL & HERO PARTICLES OBSERVER
   ----------------------------------------------------------------------------- */
function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const sections = document.querySelectorAll('.page-section');

  // Reveal observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach((el) => revealObserver.observe(el));

  // Section observer for hero canvas particle pause/resume
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        if (id === 'hero') {
          AppState.heroParticlesActive = true;
        } else {
          AppState.heroParticlesActive = false;
        }
      }
    });
  }, { threshold: 0.5 });

  sections.forEach((sec) => sectionObserver.observe(sec));
}

/* -----------------------------------------------------------------------------
   MODULE 4: FLOATING PETALS & GOLD SPARKLES (Hero Canvas)
   Pauses automatically when off-screen to conserve GPU / battery.
   ----------------------------------------------------------------------------- */
function initHeroParticles() {
  const canvas = document.getElementById('petalCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };
  resize();
  window.addEventListener('resize', resize);

  // Particle models: rose petals and gold glimmer specs
  const particles = [];
  const COUNT = 22;

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 8 + 4,
      speedY: Math.random() * 0.9 + 0.4,
      speedX: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      type: Math.random() > 0.4 ? 'petal' : 'gold',
      opacity: Math.random() * 0.5 + 0.35,
      sway: Math.random() * 2
    });
  }

  function render() {
    if (AppState.heroParticlesActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.02 + p.sway) * 0.6 + p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 20) {
          p.y = -15;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;

        if (p.type === 'petal') {
          // Romantic rose petal curve
          ctx.fillStyle = '#D6457F';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-p.size, -p.size * 0.6, -p.size * 0.6, p.size, 0, p.size * 1.3);
          ctx.bezierCurveTo(p.size * 0.6, p.size, p.size, -p.size * 0.6, 0, 0);
          ctx.fill();
        } else {
          // Golden sparkle diamond
          ctx.fillStyle = '#D9B65A';
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.5);
          ctx.lineTo(p.size * 0.4, 0);
          ctx.lineTo(0, p.size * 0.5);
          ctx.lineTo(-p.size * 0.4, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });
    }

    animationFrameId = requestAnimationFrame(render);
  }

  render();
}

/* -----------------------------------------------------------------------------
   MODULE 5: PROGRAMMATIC GOLD-FOIL SCRATCH CARD
   Handles high-DPI scaling, scratch physics, auto-clear threshold & confetti.
   ----------------------------------------------------------------------------- */
function initScratchCard() {
  const canvas = document.getElementById('scratchCanvas');
  const wrapper = document.getElementById('scratchWrapper');
  const hint = document.getElementById('scratchHint');
  if (!canvas || !wrapper) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let isScratching = false;
  let scratchedPixels = 0;
  let totalPixels = 0;

  function setupFoil() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Opulent metallic gold gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#8C6A1F');
    grad.addColorStop(0.25, '#D9B65A');
    grad.addColorStop(0.5, '#FFF1CC');
    grad.addColorStop(0.75, '#D9B65A');
    grad.addColorStop(1, '#8C6A1F');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // (Decorative inner border removed)

    // Centered label & icon
    ctx.fillStyle = '#4A2E35';
    ctx.font = '600 13px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ SCRATCH WITH LOVE ✨', w / 2, h / 2 - 8);

    ctx.font = '500 10px "Montserrat", sans-serif';
    ctx.fillStyle = '#6E4E10';
    ctx.fillText('To Reveal Auspicious Date', w / 2, h / 2 + 14);

    totalPixels = (w * h) / 64; // sampled grid
  }

  // Check scratch percentage in real time
  let lastCheckTime = 0;
  function checkScratchPercentage(force = false) {
    if (AppState.scratchDone) return;

    const now = performance.now();
    if (!force && now - lastCheckTime < 75) return;
    lastCheckTime = now;

    const dpr = window.devicePixelRatio || 1;
    const sampleStep = Math.max(4, Math.floor(6 * dpr));
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let transparentCount = 0;
    let sampledCount = 0;

    for (let y = 0; y < canvas.height; y += sampleStep) {
      for (let x = 0; x < canvas.width; x += sampleStep) {
        const index = (y * canvas.width + x) * 4;
        if (data[index + 3] < 128) {
          transparentCount++;
        }
        sampledCount++;
      }
    }

    if (sampledCount === 0) return;
    const percent = (transparentCount / sampledCount) * 100;

    // Once 45–50% is cleared, smoothly fade out the remaining foil automatically
    if (percent >= 45) {
      autoRevealDate();
    }
  }

  // Clear foil with smooth fade & launch 5-burst celebratory confetti
  function autoRevealDate() {
    if (AppState.scratchDone) return;
    AppState.scratchDone = true;

    // Smoothly fade out remaining foil and hint
    canvas.style.transition = 'opacity 0.65s cubic-bezier(0.4, 0, 0.2, 1)';
    canvas.style.opacity = '0';
    canvas.style.pointerEvents = 'none';
    if (hint) {
      hint.style.transition = 'opacity 0.4s ease';
      hint.style.opacity = '0';
      hint.style.pointerEvents = 'none';
    }

    // Upon full reveal, launch festive celebration by firing 5 consecutive, staggered bursts
    setTimeout(() => {
      canvas.style.display = 'none';
      launchFestiveConfettiCelebration();
    }, 400);
  }

  // Scratch action
  function scratch(e) {
    if (AppState.scratchDone) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches ? e.touches[0].clientY : 0);

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    if (hint && hint.style.opacity !== '0') {
      hint.style.opacity = '0';
      hint.style.pointerEvents = 'none';
    }

    checkScratchPercentage(false);
  }

  // Pointer event listeners (touch-action: none prevents page scroll during scratch)
  canvas.addEventListener('pointerdown', (e) => {
    isScratching = true;
    canvas.setPointerCapture(e.pointerId);
    scratch(e);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (isScratching) scratch(e);
  });

  const stopScratching = () => {
    if (isScratching) {
      isScratching = false;
      checkScratchPercentage(true);
    }
  };
  canvas.addEventListener('pointerup', stopScratching);
  canvas.addEventListener('pointercancel', stopScratching);

  setupFoil();
  window.addEventListener('resize', () => {
    if (!AppState.scratchDone) setupFoil();
  });
}

// -----------------------------------------------------------------------------
// FESTIVE 5-BURST CELEBRATION CONFETTI
// Fires 5 consecutive, staggered bursts across the screen in signature accent colors
// -----------------------------------------------------------------------------
function launchFestiveConfettiCelebration() {
  const burstCanvas = document.createElement('canvas');
  burstCanvas.className = 'festive-confetti-canvas';
  burstCanvas.style.position = 'fixed';
  burstCanvas.style.inset = '0';
  burstCanvas.style.width = '100vw';
  burstCanvas.style.height = '100vh';
  burstCanvas.style.pointerEvents = 'none';
  burstCanvas.style.zIndex = '999999';
  document.body.appendChild(burstCanvas);

  const dpr = window.devicePixelRatio || 1;
  const updateSize = () => {
    burstCanvas.width = window.innerWidth * dpr;
    burstCanvas.height = window.innerHeight * dpr;
  };
  updateSize();

  const ctx = burstCanvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const bits = [];
  // Site's signature accent colors:
  // Royal gold, rose pink, coral, marigold, sage leaf, peach, sparkling champagne
  const signatureColors = [
    '#B8923A', '#D9B65A', '#F5E2A8', // Royal Gold tones
    '#D6457F',                        // Signature Rose Pink
    '#F08A74',                        // Festive Coral
    '#F2A93B',                        // Marigold Yellow
    '#6E9E73',                        // Sage Leaf Green
    '#F9D9C4',                        // Delicate Peach
    '#FFFFFF'                         // Sparkling White
  ];

  function addBurst(originX, originY, count, angleSpread, baseVelocity, upwardAngle) {
    for (let i = 0; i < count; i++) {
      const angle = (upwardAngle - angleSpread / 2) + Math.random() * angleSpread;
      const rad = (angle * Math.PI) / 180;
      const speed = baseVelocity * (0.6 + Math.random() * 0.8);
      const isCircle = Math.random() < 0.35;
      const isSparkle = !isCircle && Math.random() < 0.3;

      bits.push({
        x: originX,
        y: originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        gravity: 0.28 + Math.random() * 0.12,
        drag: 0.982,
        size: Math.random() * 6 + 4,
        color: signatureColors[Math.floor(Math.random() * signatureColors.length)],
        alpha: 1,
        fadeSpeed: 0.007 + Math.random() * 0.008,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 14,
        oscillationSpeed: Math.random() * 0.1 + 0.05,
        oscillation: Math.random() * Math.PI,
        shape: isSparkle ? 'sparkle' : (isCircle ? 'circle' : 'ribbon')
      });
    }
  }

  const w = window.innerWidth;
  const h = window.innerHeight;

  // 5 Consecutive, Staggered Bursts across the screen:
  const bursts = [
    // Burst 1 (t = 0ms): Center-left fountain firing up & towards center
    { delay: 0,   x: w * 0.28, y: h * 0.65, count: 55, spread: 65, speed: 18, angle: -65 },
    // Burst 2 (t = 220ms): Center-right fountain firing up & towards center
    { delay: 220, x: w * 0.72, y: h * 0.65, count: 55, spread: 65, speed: 18, angle: -115 },
    // Burst 3 (t = 440ms): Grand central aerial explosion right over the auspicious date
    { delay: 440, x: w * 0.50, y: h * 0.45, count: 75, spread: 360, speed: 16, angle: 0 },
    // Burst 4 (t = 660ms): Left flank celebratory shower
    { delay: 660, x: w * 0.15, y: h * 0.55, count: 50, spread: 75, speed: 17, angle: -55 },
    // Burst 5 (t = 880ms): Right flank grand finale shower
    { delay: 880, x: w * 0.85, y: h * 0.55, count: 50, spread: 75, speed: 17, angle: -125 }
  ];

  bursts.forEach((b) => {
    setTimeout(() => {
      addBurst(b.x, b.y, b.count, b.spread, b.speed, b.angle);
    }, b.delay);
  });

  const startTime = performance.now();
  let animId;

  function animate() {
    ctx.clearRect(0, 0, w, h);
    let activeBits = 0;

    for (let i = 0; i < bits.length; i++) {
      const p = bits[i];
      if (p.alpha <= 0) continue;

      activeBits++;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx + Math.sin(p.oscillation) * 0.8;
      p.y += p.vy;
      p.oscillation += p.oscillationSpeed;
      p.rotation += p.rotSpeed;
      p.alpha -= p.fadeSpeed;

      if (p.alpha > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'sparkle') {
          // 4-point golden star sparkle
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        } else {
          // Fluttering rectangular ribbon
          ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
        }
        ctx.restore();
      }
    }

    if (activeBits > 0 || performance.now() - startTime < 3500) {
      animId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animId);
      burstCanvas.remove();
    }
  }

  animId = requestAnimationFrame(animate);
}

/* -----------------------------------------------------------------------------
   MODULE 6: LIVE WEDDING COUNTDOWN TIMER
   ----------------------------------------------------------------------------- */
function initCountdown() {
  const daysEl = document.getElementById('cdDays');
  const hoursEl = document.getElementById('cdHours');
  const minsEl = document.getElementById('cdMinutes');
  const secsEl = document.getElementById('cdSeconds');
  const gridEl = document.getElementById('countdownGrid');
  const expiredMsg = document.getElementById('cdExpiredMsg');

  const targetDate = new Date(CONFIG.weddingDate).getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      if (gridEl) gridEl.style.display = 'none';
      if (expiredMsg) expiredMsg.style.display = 'block';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

/* -----------------------------------------------------------------------------
   MODULE 7: COUPLE INTRO TAB SWITCHER
   ----------------------------------------------------------------------------- */
function initCoupleSwitcher() {
  const groomBtn = document.getElementById('tabGroomBtn');
  const brideBtn = document.getElementById('tabBrideBtn');
  const groomCard = document.getElementById('groomCard');
  const brideCard = document.getElementById('brideCard');
  const slider = document.getElementById('coupleSlider');

  if (!groomBtn || !brideBtn || !groomCard || !brideCard) return;

  function switchTab(showGroom) {
    groomBtn.classList.toggle('active', showGroom);
    groomBtn.setAttribute('aria-selected', showGroom);
    brideBtn.classList.toggle('active', !showGroom);
    brideBtn.setAttribute('aria-selected', !showGroom);

    groomCard.classList.toggle('active', showGroom);
    brideCard.classList.toggle('active', !showGroom);
  }

  groomBtn.addEventListener('click', () => switchTab(true));
  brideBtn.addEventListener('click', () => switchTab(false));

  // Touch swipe support on couple cards
  let touchStartX = 0;
  if (slider) {
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      if (diff > 45) switchTab(true); // swiped right -> groom
      else if (diff < -45) switchTab(false); // swiped left -> bride
    }, { passive: true });
  }
}

/* -----------------------------------------------------------------------------
   MODULE 7.5: COUPLE SPARK BUTTON & BILATERAL PAPER CONFETTI CANNON
   Shoots celebratory paper ribbons and flower confetti from left & right sides
   ----------------------------------------------------------------------------- */
let activeSparkCanvas = null;
let activeSparkCtx = null;
let activeSparkBits = [];
let sparkAnimId = null;
let sparkStartTime = 0;

function launchBilateralPaperConfetti(btn) {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (!activeSparkCanvas) {
    activeSparkCanvas = document.createElement('canvas');
    activeSparkCanvas.className = 'couple-spark-canvas';
    activeSparkCanvas.style.position = 'fixed';
    activeSparkCanvas.style.inset = '0';
    activeSparkCanvas.style.width = '100vw';
    activeSparkCanvas.style.height = '100vh';
    activeSparkCanvas.style.pointerEvents = 'none';
    activeSparkCanvas.style.zIndex = '999999';
    document.body.appendChild(activeSparkCanvas);

    activeSparkCanvas.width = w * dpr;
    activeSparkCanvas.height = h * dpr;
    activeSparkCtx = activeSparkCanvas.getContext('2d');
    activeSparkCtx.scale(dpr, dpr);
  }

  // Get button coordinates to anchor central burst
  const rect = btn.getBoundingClientRect();
  const btnX = rect.left + rect.width / 2;
  const btnY = rect.top + rect.height / 2;

  // Signature festive colors: gold foil, rose pink, crimson, peach, coral, marigold, champagne
  const festiveColors = [
    '#B8923A', '#D9B65A', '#F4DC96', // Royal gold foil
    '#D6457F', '#B8284B',            // Romantic rose & crimson
    '#F08A74', '#F2A93B',            // Coral & marigold
    '#FFFDF8', '#F9D9C4'             // Champagne & soft peach
  ];

  function spawnCannon(originX, originY, count, angleSpread, baseVelocity, upwardAngle) {
    for (let i = 0; i < count; i++) {
      const angle = (upwardAngle - angleSpread / 2) + Math.random() * angleSpread;
      const rad = (angle * Math.PI) / 180;
      const speed = baseVelocity * (0.55 + Math.random() * 0.9);
      const isRibbon = Math.random() < 0.6;
      const isCircle = !isRibbon && Math.random() < 0.5;

      activeSparkBits.push({
        x: originX,
        y: originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        gravity: 0.20 + Math.random() * 0.10,
        drag: 0.984,
        size: Math.random() * 3 + 2.5, // Small, delicate confetti particles (2.5px - 5.5px)
        widthRatio: Math.random() * 1.2 + 1.1,
        color: festiveColors[Math.floor(Math.random() * festiveColors.length)],
        alpha: 1,
        fadeSpeed: 0.007 + Math.random() * 0.008,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 18,
        oscillationSpeed: Math.random() * 0.14 + 0.08,
        oscillation: Math.random() * Math.PI,
        shape: isRibbon ? 'ribbon' : (isCircle ? 'circle' : 'sparkle')
      });
    }
  }

  // 1. LEFT SIDE CANNON: Fires upward and rightward into the screen
  const cannonY = Math.min(Math.max(btnY, h * 0.35), h * 0.75);
  spawnCannon(0, cannonY, 75, 55, 22, -45);

  // 2. RIGHT SIDE CANNON: Fires upward and leftward into the screen
  spawnCannon(w, cannonY, 75, 55, 22, -135);

  // 3. CENTER FLOWER POP: Radiates 360 degrees outward from the rose
  spawnCannon(btnX, btnY, 45, 360, 13, 0);

  // Staggered follow-up burst for grand celebratory shower
  setTimeout(() => {
    spawnCannon(w * 0.08, cannonY - 40, 50, 60, 19, -50);
    spawnCannon(w * 0.92, cannonY - 40, 50, 60, 19, -130);
  }, 180);

  sparkStartTime = performance.now();

  if (!sparkAnimId) {
    function animateSpark() {
      activeSparkCtx.clearRect(0, 0, w, h);
      let activeBits = 0;

      for (let i = 0; i < activeSparkBits.length; i++) {
        const p = activeSparkBits[i];
        if (p.alpha <= 0) continue;

        activeBits++;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx + Math.sin(p.oscillation) * 0.9;
        p.y += p.vy;
        p.oscillation += p.oscillationSpeed;
        p.rotation += p.rotSpeed;
        p.alpha -= p.fadeSpeed;

        if (p.alpha > 0) {
          activeSparkCtx.save();
          activeSparkCtx.translate(p.x, p.y);
          activeSparkCtx.rotate((p.rotation * Math.PI) / 180);
          activeSparkCtx.globalAlpha = Math.max(0, p.alpha);
          activeSparkCtx.fillStyle = p.color;

          if (p.shape === 'circle') {
            // Delicate circular paper confetti
            activeSparkCtx.beginPath();
            activeSparkCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            activeSparkCtx.fill();
          } else if (p.shape === 'sparkle') {
            // Small golden star sparkle
            const s = p.size * 0.9;
            activeSparkCtx.beginPath();
            activeSparkCtx.moveTo(0, -s);
            activeSparkCtx.quadraticCurveTo(0, 0, s, 0);
            activeSparkCtx.quadraticCurveTo(0, 0, 0, s);
            activeSparkCtx.quadraticCurveTo(0, 0, -s, 0);
            activeSparkCtx.quadraticCurveTo(0, 0, 0, -s);
            activeSparkCtx.fill();
          } else {
            // Small fluttering rectangular paper confetti ribbon
            const flip = Math.sin(p.oscillation);
            activeSparkCtx.fillRect(-p.size / 2, (-p.size * p.widthRatio * flip) / 2, p.size, p.size * p.widthRatio * flip);
          }
          activeSparkCtx.restore();
        }
      }

      if (activeBits > 0 || performance.now() - sparkStartTime < 4000) {
        sparkAnimId = requestAnimationFrame(animateSpark);
      } else {
        cancelAnimationFrame(sparkAnimId);
        sparkAnimId = null;
        if (activeSparkCanvas) {
          activeSparkCanvas.remove();
          activeSparkCanvas = null;
          activeSparkCtx = null;
          activeSparkBits = [];
        }
      }
    }

    sparkAnimId = requestAnimationFrame(animateSpark);
  }
}

function initCoupleSparkButton() {
  const btn = document.getElementById('coupleSparkBtn');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger flower pop micro-bounce
    btn.classList.remove('spark-popped');
    void btn.offsetWidth;
    btn.classList.add('spark-popped');

    // Launch bilateral paper confetti burst from left and right side
    launchBilateralPaperConfetti(btn);
  });
}

/* -----------------------------------------------------------------------------
   MODULE 8: LOVE STORY CAROUSEL
   ----------------------------------------------------------------------------- */
function initStoryCarousel() {
  const slides = document.querySelectorAll('.story-slide');
  const prevBtn = document.getElementById('storyPrevBtn');
  const nextBtn = document.getElementById('storyNextBtn');
  const dotsContainer = document.getElementById('storyDots');
  const carousel = document.getElementById('storyCarousel');

  if (!slides.length || !dotsContainer) return;

  // Render navigation dots
  dotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = `dot ${idx === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.addEventListener('click', () => goToSlide(idx));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll('.dot');

  function goToSlide(index) {
    AppState.currentStoryIdx = (index + slides.length) % slides.length;

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === AppState.currentStoryIdx);
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === AppState.currentStoryIdx);
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(AppState.currentStoryIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(AppState.currentStoryIdx + 1));

  // Touch swipe support
  let touchStartX = 0;
  if (carousel) {
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (diff > 40) goToSlide(AppState.currentStoryIdx - 1);
      else if (diff < -40) goToSlide(AppState.currentStoryIdx + 1);
    }, { passive: true });
  }
}

/* -----------------------------------------------------------------------------
   MODULE 9: WEDDING EVENTS TABS & ICAL GENERATOR
   ----------------------------------------------------------------------------- */
function initWeddingEvents() {
  const tabs = document.querySelectorAll('.event-tab-btn');
  const cards = document.querySelectorAll('.event-card-item');
  const calButtons = document.querySelectorAll('.btn-cal');
  const carousel = document.getElementById('eventsCarousel');

  function showEvent(idx) {
    AppState.currentEventIdx = (idx + cards.length) % cards.length;

    tabs.forEach((tab) => {
      tab.classList.toggle('active', parseInt(tab.getAttribute('data-event'), 10) === AppState.currentEventIdx);
    });

    cards.forEach((card, i) => {
      card.classList.toggle('active', i === AppState.currentEventIdx);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.getAttribute('data-event'), 10);
      showEvent(idx);
    });
  });

  // Swipe support for event cards
  let touchStartX = 0;
  if (carousel) {
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (diff > 45) showEvent(AppState.currentEventIdx - 1);
      else if (diff < -45) showEvent(AppState.currentEventIdx + 1);
    }, { passive: true });
  }

  // Pure Vanilla .ics Calendar File Download Generator
  calButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-event-idx'), 10);
      const ev = CONFIG.events[idx];
      if (!ev) return;

      const formatIcsTime = (iso) => {
        const d = new Date(iso);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const start = formatIcsTime(ev.startIso);
      const end = formatIcsTime(ev.endIso);
      const title = `${ev.title} — ${CONFIG.groom.name} & ${CONFIG.bride.name}'s Wedding`;
      const description = `${ev.desc} | Dress Code: ${ev.dressCode}`;

      const icsData = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Royal Wedding Invitation//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${ev.venue}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${ev.title.replace(/\s+/g, '_')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Added ${ev.title} to Calendar!`);
    });
  });
}

/* -----------------------------------------------------------------------------
   MODULE 10: PHOTO GALLERY & LIGHTBOX
   ----------------------------------------------------------------------------- */
function initGalleryLightbox() {
  const modal = document.getElementById('lightboxModal');
  const imgEl = document.getElementById('lightboxImg');
  const captionEl = document.getElementById('lightboxCaption');
  const counterEl = document.getElementById('lightboxCounter');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  function openLightbox(index) {
    if (!modal || !imgEl) return;
    AppState.currentGalleryIdx = (index + CONFIG.gallery.length) % CONFIG.gallery.length;
    const item = CONFIG.gallery[AppState.currentGalleryIdx];

    imgEl.src = item.src;
    if (captionEl) captionEl.textContent = item.caption;
    if (counterEl) counterEl.textContent = `${AppState.currentGalleryIdx + 1} / ${CONFIG.gallery.length}`;

    modal.style.display = 'flex';
    document.body.classList.add('scroll-locked');
  }

  function closeLightbox() {
    if (!modal) return;
    modal.style.display = 'none';
    if (!AppState.entrancePassed) return;
    document.body.classList.remove('scroll-locked');
  }

  function nextPhoto() {
    openLightbox(AppState.currentGalleryIdx + 1);
  }

  function prevPhoto() {
    openLightbox(AppState.currentGalleryIdx - 1);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', prevPhoto);
  if (nextBtn) nextBtn.addEventListener('click', nextPhoto);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });

    // Touch swipe support on modal
    let touchStartX = 0;
    modal.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (diff > 50) prevPhoto();
      else if (diff < -50) nextPhoto();
    }, { passive: true });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (modal && modal.style.display === 'flex') {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') nextPhoto();
      else if (e.key === 'ArrowLeft') prevPhoto();
    }
  });

  // Init Royal Stack / Swipeable Card Deck
  initGalleryDeck(openLightbox);
}

function initGalleryDeck(openLightboxFn) {
  const stage = document.getElementById('galleryDeckStage');
  const cards = Array.from(document.querySelectorAll('.gallery-deck-card'));
  const prevBtn = document.getElementById('galleryDeckPrevBtn');
  const nextBtn = document.getElementById('galleryDeckNextBtn');
  const dotBtns = Array.from(document.querySelectorAll('.deck-dot'));

  if (!stage || !cards.length) return;

  let currentIdx = 0;
  const totalSlides = cards.length;
  let isDragging = false;
  let isAnimating = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let autoDeckTimer = null;

  // Royal Stack Configurations for card layers
  const STACK_PRESETS = [
    // Offset 0: Top active card
    { x: 0, y: 0, scale: 1, rot: 0, opacity: 1, z: 10, shadow: '0 16px 40px rgba(74, 46, 53, 0.28), 0 0 0 3px rgba(255, 255, 255, 0.96), 0 0 20px rgba(184, 146, 58, 0.35)', filter: 'brightness(1)' },
    // Offset 1: Second card, tilted right and slightly down
    { x: 14, y: 10, scale: 0.94, rot: 3.8, opacity: 0.88, z: 8, shadow: '0 12px 28px rgba(74, 46, 53, 0.20)', filter: 'brightness(0.95)' },
    // Offset 2: Third card, tilted left and slightly down
    { x: -14, y: 18, scale: 0.89, rot: -3.5, opacity: 0.65, z: 6, shadow: '0 10px 22px rgba(74, 46, 53, 0.16)', filter: 'brightness(0.90)' },
    // Offset 3: Fourth card, subtle deeper base
    { x: 0, y: 25, scale: 0.84, rot: 1.2, opacity: 0.35, z: 4, shadow: '0 8px 16px rgba(74, 46, 53, 0.12)', filter: 'brightness(0.85)' }
  ];

  function updateDeck(index, animate = true) {
    currentIdx = (index + totalSlides) % totalSlides;
    AppState.currentGalleryIdx = currentIdx;

    cards.forEach((card, idx) => {
      const offset = (idx - currentIdx + totalSlides) % totalSlides;
      card.classList.remove('is-dragging', 'is-swiping-out');

      if (offset === 0) {
        card.classList.add('is-active');
      } else {
        card.classList.remove('is-active');
      }

      card.style.transition = animate ? 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s ease, filter 0.35s ease' : 'none';

      if (offset < STACK_PRESETS.length) {
        const p = STACK_PRESETS[offset];
        card.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(${p.scale}) rotate(${p.rot}deg)`;
        card.style.opacity = p.opacity;
        card.style.zIndex = p.z;
        card.style.filter = p.filter;
        card.style.pointerEvents = offset === 0 ? 'auto' : 'none';
      } else {
        card.style.transform = `translate(-50%, calc(-50% + 30px)) scale(0.8) rotate(0deg)`;
        card.style.opacity = 0;
        card.style.zIndex = 1;
        card.style.filter = 'brightness(0.8)';
        card.style.pointerEvents = 'none';
      }
    });

    // Update Dots
    dotBtns.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === currentIdx);
    });
  }

  function swipeCardOut(direction = 1) {
    if (isAnimating) return;
    isAnimating = true;
    stopAutoSlide();

    const activeCard = cards[currentIdx];
    if (activeCard) {
      activeCard.classList.add('is-swiping-out');
      const targetX = direction * 420;
      const targetRot = direction * 28;
      activeCard.style.transform = `translate(calc(-50% + ${targetX}px), calc(-50% + 20px)) scale(0.92) rotate(${targetRot}deg)`;
      activeCard.style.opacity = 0;

      // Animate next cards stepping up simultaneously
      const nextIdx = (currentIdx + 1) % totalSlides;
      cards.forEach((card, idx) => {
        if (idx === currentIdx) return;
        const newOffset = (idx - nextIdx + totalSlides) % totalSlides;
        if (newOffset < STACK_PRESETS.length) {
          const p = STACK_PRESETS[newOffset];
          card.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease';
          card.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(${p.scale}) rotate(${p.rot}deg)`;
          card.style.opacity = p.opacity;
          card.style.zIndex = p.z;
        }
      });

      setTimeout(() => {
        updateDeck(currentIdx + 1, false);
        isAnimating = false;
        startAutoSlide();
      }, 300);
    } else {
      updateDeck(currentIdx + 1);
      isAnimating = false;
      startAutoSlide();
    }
  }

  function prevCardIn() {
    if (isAnimating) return;
    isAnimating = true;
    stopAutoSlide();

    const prevIdx = (currentIdx - 1 + totalSlides) % totalSlides;
    const prevCard = cards[prevIdx];

    if (prevCard) {
      // Place prevCard off-screen at top/left without animation
      prevCard.style.transition = 'none';
      prevCard.style.transform = 'translate(calc(-50% - 360px), calc(-50% - 40px)) scale(0.9) rotate(-22deg)';
      prevCard.style.opacity = 0;
      prevCard.style.zIndex = 15;
      prevCard.offsetHeight; // trigger reflow

      // Push current stack down
      cards.forEach((card, idx) => {
        if (idx === prevIdx) return;
        const newOffset = (idx - prevIdx + totalSlides) % totalSlides;
        if (newOffset < STACK_PRESETS.length) {
          const p = STACK_PRESETS[newOffset];
          card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s ease';
          card.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(${p.scale}) rotate(${p.rot}deg)`;
          card.style.opacity = p.opacity;
          card.style.zIndex = p.z;
        }
      });

      // Fly prevCard into place
      prevCard.style.transition = 'transform 0.42s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s ease';
      prevCard.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
      prevCard.style.opacity = 1;

      setTimeout(() => {
        updateDeck(prevIdx, false);
        isAnimating = false;
        startAutoSlide();
      }, 380);
    } else {
      updateDeck(prevIdx);
      isAnimating = false;
      startAutoSlide();
    }
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoDeckTimer = setInterval(() => {
      swipeCardOut(1);
    }, 4500);
  }

  function stopAutoSlide() {
    if (autoDeckTimer) {
      clearInterval(autoDeckTimer);
      autoDeckTimer = null;
    }
  }

  // Pointer Drag & Swipe Handling
  function onPointerDown(e) {
    if (isAnimating) return;
    const activeCard = cards[currentIdx];
    if (!activeCard) return;

    const targetCard = e.target.closest('.gallery-deck-card');
    if (targetCard !== activeCard) return;

    isDragging = true;
    stopAutoSlide();
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    currentX = 0;
    currentY = 0;

    activeCard.classList.add('is-dragging');
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

    currentX = clientX - startX;
    currentY = clientY - startY;

    const activeCard = cards[currentIdx];
    if (activeCard) {
      const rot = currentX * 0.08;
      activeCard.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY * 0.3}px)) scale(${1 - Math.min(Math.abs(currentX) / 1000, 0.04)}) rotate(${rot}deg)`;
    }
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    const activeCard = cards[currentIdx];
    if (activeCard) activeCard.classList.remove('is-dragging');

    const dist = Math.abs(currentX);
    if (dist > 55) {
      swipeCardOut(currentX > 0 ? 1 : -1);
    } else if (dist < 8 && Math.abs(currentY) < 8) {
      // Tap on card -> open lightbox
      if (openLightboxFn) openLightboxFn(currentIdx);
      startAutoSlide();
    } else {
      // Spring back
      if (activeCard) {
        activeCard.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)';
        activeCard.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
      }
      startAutoSlide();
    }
  }

  // Mouse Listeners
  stage.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // Touch Listeners
  stage.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Navigation Buttons
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      swipeCardOut(1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevCardIn();
    });
  }

  // Dots
  dotBtns.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const dotIdx = parseInt(dot.getAttribute('data-dot-idx'), 10);
      updateDeck(dotIdx);
      startAutoSlide();
    });
  });

  // Resize Listener
  window.addEventListener('resize', () => {
    updateDeck(currentIdx, false);
  });

  // Multi-phase initialization
  updateDeck(0, false);
  setTimeout(() => updateDeck(0, false), 50);
  setTimeout(() => updateDeck(0, false), 300);
  window.addEventListener('load', () => updateDeck(0, false));

  startAutoSlide();
}

/* -----------------------------------------------------------------------------
   MODULE 11: RSVP FORM & WHATSAPP GENERATOR
   ----------------------------------------------------------------------------- */
function initRSVPForm() {
  const form = document.getElementById('rsvpForm');
  const nameInput = document.getElementById('rsvpName');
  const phoneInput = document.getElementById('rsvpPhone');
  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const guestsInput = document.getElementById('rsvpGuests');
  const guestsSec = document.getElementById('guestsSection');
  const eventsSec = document.getElementById('eventsSection');
  const successCard = document.getElementById('rsvpSuccessCard');
  const successName = document.getElementById('successName');
  const editBtn = document.getElementById('rsvpEditBtn');

  if (!form) return;

  // Toggle attending state
  const radioAttending = document.querySelectorAll('input[name="attending"]');
  const cardYes = document.getElementById('attendanceCardYes');
  const cardNo = document.getElementById('attendanceCardNo');
  radioAttending.forEach((radio) => {
    radio.addEventListener('change', () => {
      const isYes = radio.value === 'Yes';
      if (cardYes) cardYes.classList.toggle('is-selected', isYes);
      if (cardNo) cardNo.classList.toggle('is-selected', !isYes);
      if (guestsSec) guestsSec.style.display = isYes ? 'flex' : 'none';
      if (eventsSec) eventsSec.style.display = isYes ? 'flex' : 'none';
    });
  });

  // Live input validation
  nameInput.addEventListener('input', () => {
    if (nameInput.value.trim().length > 0) nameError.classList.remove('visible');
  });

  phoneInput.addEventListener('input', () => {
    if (phoneInput.value.trim().length >= 7) phoneError.classList.remove('visible');
  });

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name) {
      nameError.classList.add('visible');
      isValid = false;
    }
    if (!phone || phone.length < 7) {
      phoneError.classList.add('visible');
      isValid = false;
    }

    if (!isValid) return;

    const attendingRadio = document.querySelector('input[name="attending"]:checked');
    const isAttending = attendingRadio ? attendingRadio.value : 'Yes';

    const checkedEvents = [];
    document.querySelectorAll('input[name="rsvpEvents"]:checked').forEach((cb) => {
      checkedEvents.push(cb.value);
    });

    const note = document.getElementById('rsvpMessage').value.trim();

    const guestCount = guestsInput ? Math.max(1, parseInt(guestsInput.value, 10) || 1) : 1;

    // Prepare WhatsApp text
    let waText = `*Namaste! RSVP for ${CONFIG.groom.name} & ${CONFIG.bride.name}'s Wedding*\n\n`;
    waText += `*Guest Name:* ${name}\n`;
    waText += `*Phone:* ${phone}\n`;
    waText += `*Attending:* ${isAttending}\n`;

    if (isAttending === 'Yes') {
      waText += `*Guests:* ${guestCount}\n`;
      waText += `*Events Attending:* ${checkedEvents.join(', ') || 'All Events'}\n`;
    }

    if (note) {
      waText += `*Wishes/Note:* ${note}\n`;
    }

    const waUrl = `https://wa.me/${CONFIG.whatsAppNumber}?text=${encodeURIComponent(waText)}`;

    // Optional POST endpoint to Google Sheets
    if (CONFIG.googleScriptUrl) {
      fetch(CONFIG.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, isAttending, guestCount, events: checkedEvents, note, submittedAt: new Date().toISOString()
        })
      }).catch((err) => console.log('POST request logged:', err));
    }

    // Open WhatsApp in new tab
    window.open(waUrl, '_blank');

    // In-place success state
    form.style.display = 'none';
    if (successName) successName.textContent = name;
    if (successCard) successCard.style.display = 'flex';
  });

  // Edit Response button
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (successCard) successCard.style.display = 'none';
      form.style.display = 'flex';
    });
  }
}

/* -----------------------------------------------------------------------------
   MODULE 12: SOCIAL SHARING & CLIPBOARD COPY
   ----------------------------------------------------------------------------- */
function initShareAndHashtag() {
  const shareBtn = document.getElementById('shareBtn');
  const hashtagBtn = document.getElementById('hashtagPill');

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const shareUrl = CONFIG.websiteUrl || window.location.href;
      if (navigator.share) {
        navigator.share({
          title: `${CONFIG.groom.name} & ${CONFIG.bride.name} Wedding Invitation`,
          text: `We joyfully invite you to celebrate our wedding on ${CONFIG.weddingDateDisplay} in ${CONFIG.weddingCity}!`,
          url: shareUrl
        }).catch((err) => console.log('Share dismissed:', err));
      } else {
        copyToClipboard(shareUrl, "Invitation link copied to clipboard!");
      }
    });
  }

  if (hashtagBtn) {
    hashtagBtn.addEventListener('click', () => {
      copyToClipboard(CONFIG.hashtag, `Hashtag ${CONFIG.hashtag} copied!`);
    });
  }
}

function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  showToast(successMsg);
}

// Toast notification
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 2800);
}

/* -----------------------------------------------------------------------------
   SCROLL POSITION RESET ON RELOAD
   Ensures the website always opens from the very top on reload.
   ----------------------------------------------------------------------------- */
function resetScrollToTop() {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const container = document.querySelector('.page-container');
  if (container) {
    container.scrollTop = 0;
  }

  // Clear any existing hash so browser does not jump to target section
  if (window.location.hash) {
    try {
      history.replaceState(null, null, window.location.pathname + window.location.search);
    } catch (e) {
      // Ignore if restricted
    }
  }
}

// Reset immediately before unload and on load
window.addEventListener('beforeunload', resetScrollToTop);
window.addEventListener('load', resetScrollToTop);

/* -----------------------------------------------------------------------------
   MODULE 15: BACKGROUND MUSIC SYSTEM & FLOATING TOGGLE
   ----------------------------------------------------------------------------- */
function playBackgroundMusic() {
  const audio = document.getElementById('bgMusicAudio');
  const btn = document.getElementById('musicToggleBtn');
  if (!audio) return;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        AppState.isMusicPlaying = true;
        if (btn) {
          btn.classList.add('is-playing');
          btn.classList.remove('is-muted');
          btn.setAttribute('aria-pressed', 'true');
        }
      })
      .catch((err) => {
        console.log("Background music autoplay was deferred until user tap:", err);
      });
  }
}

function pauseBackgroundMusic() {
  const audio = document.getElementById('bgMusicAudio');
  const btn = document.getElementById('musicToggleBtn');
  if (!audio) return;

  audio.pause();
  AppState.isMusicPlaying = false;
  if (btn) {
    btn.classList.remove('is-playing');
    btn.classList.add('is-muted');
    btn.setAttribute('aria-pressed', 'false');
  }
}

function initMusicPlayer() {
  const audio = document.getElementById('bgMusicAudio');
  const btn = document.getElementById('musicToggleBtn');
  if (!audio || !btn) return;

  // Set audio source from config if specified
  if (CONFIG.backgroundMusic) {
    const source = audio.querySelector('source');
    if (source && source.src !== CONFIG.backgroundMusic) {
      source.src = CONFIG.backgroundMusic;
      audio.load();
    }
  }

  // Toggle button click listener
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (audio.paused) {
      playBackgroundMusic();
      showToast("Music Playing ♫");
    } else {
      pauseBackgroundMusic();
      showToast("Music Paused");
    }
  });

  // Track playback state in case audio ends or pauses externally
  audio.addEventListener('play', () => {
    AppState.isMusicPlaying = true;
    btn.classList.add('is-playing');
    btn.classList.remove('is-muted');
    btn.setAttribute('aria-pressed', 'true');
  });

  audio.addEventListener('pause', () => {
    AppState.isMusicPlaying = false;
    btn.classList.remove('is-playing');
    btn.classList.add('is-muted');
    btn.setAttribute('aria-pressed', 'false');
  });
}

/* -----------------------------------------------------------------------------
   INITIALIZATION LIFECYCLE
   ----------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  resetScrollToTop();
  initStage();
  applyConfigToDOM();
  initEntrance();
  initReveal();
  initHeroParticles();
  initScratchCard();
  initCountdown();
  initCoupleSwitcher();
  initCoupleSparkButton();
  initStoryCarousel();
  initWeddingEvents();
  initGalleryLightbox();
  initRSVPForm();
  initShareAndHashtag();
  initMusicPlayer();
});
