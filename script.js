const isDesktop = window.matchMedia('(min-width: 768px)').matches;
let lenis;

if (isDesktop) {
  lenis = new Lenis({
    orientation: 'horizontal',
    gestureOrientation: 'both',
    smoothWheel: true,
    wheelMultiplier: 1.3,
    lerp: 0.08,
    autoRaf: true,
  });

  lenis.on('scroll', (e) => {
    console.log('Scroll position:', e.scroll);
  });
}

// Stacked columns: as you scroll, each column stops and the next one slides
// over it (1 under 2 under 3, and so on), darkening as it gets covered.
//
// Desktop (horizontal): each column stops at column 1's position. A pinned
// column is translated by however far it has scrolled past that position (so
// it appears fixed) and clipped at the column rule before the next column.
// Each top-level .section-break is one column; any that doesn't fit in a
// single column scrolls normally.
//
// Mobile (vertical): sections use CSS position: sticky so pinning stays smooth
// with native touch scrolling. A section sticks once its bottom reaches the
// bottom of the screen (or at the top, if it's shorter than the screen); the
// next section, which has a solid background, slides up over it. JS only
// handles the darkening.
const pinnedColumn = (() => {
  const mobileMq = window.matchMedia('(max-width: 768px)');
  let items = [];
  let mode = null; // 'desktop' | 'mobile' | null
  let pinLeft = 0;
  // How dark/blurry a column gets once fully covered
  const MAX_DIM = 0.5; // opacity drop over the black background
  const MAX_BLUR = 10; // px
  // Mobile: blur re-renders the whole section every scroll frame, which is
  // heavy on phones, so it's off by default. Dimming (opacity) is cheap.
  const MOBILE_MAX_DIM = 0.95;
  const MOBILE_MAX_BLUR = 0; // px

  function reset() {
    items.forEach(({ el }) => {
      el.classList.remove('is-pinned', 'is-stacked');
      el.style.transform = '';
      el.style.clipPath = '';
      el.style.visibility = '';
      el.style.opacity = '';
      el.style.filter = '';
      el.style.removeProperty('--stack-height');
      el.style.removeProperty('--stack-dim');
    });
    items = [];
    mode = null;
  }

  function setCovered(el, covered, maxDim, maxBlur) {
    el.style.opacity = covered ? 1 - maxDim * covered : '';
    el.style.filter = covered && maxBlur ? `blur(${(maxBlur * covered).toFixed(2)}px)` : '';
  }

  function updateDesktop() {
    const x = window.scrollX;
    items.forEach((item) => {
      const natural = item.left - x;
      const viewLeft = Math.max(pinLeft, natural);
      // Distance from the column's left edge to the next column rule, on screen
      const visible = item.edge - x - viewLeft;
      if (visible <= 0) {
        item.el.style.visibility = 'hidden';
        return;
      }
      item.el.style.visibility = '';
      item.el.style.transform = `translate3d(${viewLeft - natural}px, 0, 0)`;
      // Only clip on the right, at the column rule; the other sides (and the
      // right side, until the rule reaches it) stay open so things that hang
      // outside the column, like the CTA's diagonal pattern, aren't cropped
      item.el.style.clipPath = `inset(-100vh ${item.width - visible}px -100vh -100vw)`;
      // Darken and blur as the next column covers this one (0 = uncovered, 1 = covered)
      const covered = Math.min(1, Math.max(0, 1 - visible / item.width));
      setCovered(item.el, covered, MAX_DIM, MAX_BLUR);
    });
  }

  function updateMobile() {
    const vh = window.innerHeight;
    items.forEach(({ el, next }) => {
      if (!next) return;
      const rect = el.getBoundingClientRect();
      const nextTop = next.getBoundingClientRect().top;
      // How much of this section's on-screen part the next section now covers
      const shown = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      let covered;
      if (rect.top >= vh) covered = 0; // not on screen yet
      else if (shown <= 0) covered = 1; // scrolled past
      else covered = Math.min(1, Math.max(0, (rect.bottom - nextTop) / shown));
      // Dim with a black layer over the section (see .is-stacked::after), not
      // opacity: a translucent section would show the one stacked beneath it
      el.style.setProperty('--stack-dim', (MOBILE_MAX_DIM * covered).toFixed(3));
      el.style.filter = covered && MOBILE_MAX_BLUR ? `blur(${(MOBILE_MAX_BLUR * covered).toFixed(2)}px)` : '';
    });
  }

  function update() {
    if (!items.length || document.body.classList.contains('modal-open')) return;
    if (mode === 'desktop') updateDesktop();
    else if (mode === 'mobile') updateMobile();
  }

  function measureDesktop(wrapper, sections) {
    const x = window.scrollX;
    const gap = parseFloat(getComputedStyle(wrapper).columnGap) || 0;
    const columnHeight = wrapper.clientHeight;
    pinLeft = sections[0].getBoundingClientRect().left + x;

    sections.forEach((el, i) => {
      // Must sit in one column; if it overflows or splits, leave it alone
      const fits = el.getClientRects().length === 1 && el.offsetHeight <= columnHeight;
      if (!fits) return;
      const rect = el.getBoundingClientRect();
      const next = sections[i + 1];
      items.push({
        el,
        left: rect.left + x,
        width: rect.width,
        edge: next ? next.getBoundingClientRect().left + x - gap / 2 : Infinity,
      });
      el.classList.add('is-pinned');
    });
    mode = 'desktop';
  }

  function measureMobile(sections) {
    // Add the class first so the measured heights include its padding
    sections.forEach((el) => el.classList.add('is-stacked'));
    sections.forEach((el, i) => {
      // CSS uses this to stick tall sections by their bottom edge
      el.style.setProperty('--stack-height', `${el.offsetHeight}px`);
      items.push({ el, next: sections[i + 1] });
    });
    mode = 'mobile';
  }

  function measure() {
    reset();
    const wrapper = document.querySelector('.content-wrapper');
    if (!wrapper) return;
    const sections = [...wrapper.querySelectorAll(':scope > .section-break')];
    if (sections.length < 2) return;
    if (mobileMq.matches) measureMobile(sections);
    else measureDesktop(wrapper, sections);
    update();
  }

  return { measure, update };
})();

window.addEventListener('load', pinnedColumn.measure);
if (document.fonts) document.fonts.ready.then(pinnedColumn.measure);
let pinnedResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(pinnedResizeTimer);
  pinnedResizeTimer = setTimeout(pinnedColumn.measure, 150);
});
// Lenis drives scrolling on desktop; update in its frame to avoid jitter
if (lenis) {
  lenis.on('scroll', pinnedColumn.update);
} else {
  window.addEventListener('scroll', pinnedColumn.update, { passive: true });
}
// Mobile section heights can change after load (images, the rotating skill cards)
if ('ResizeObserver' in window) {
  let pinnedObserveTimer;
  new ResizeObserver(() => {
    clearTimeout(pinnedObserveTimer);
    pinnedObserveTimer = setTimeout(pinnedColumn.measure, 150);
  }).observe(document.querySelector('.content-wrapper') || document.body);
}

// --- Homepage feed: first 2 projects (work/works.json) and latest 2 journal
// entries (journals/journals.json). Both lists are always checked fresh. ---
document.addEventListener('DOMContentLoaded', () => {
  const workList = document.getElementById('home-work-list');
  const journalList = document.getElementById('home-journal-list');
  const HOME_WORKS = 2;
  const HOME_ENTRIES = 2;

  const works = workList
    ? fetch('/work/works.json', { cache: 'no-cache' })
      .then((res) => res.json())
      .then((items) => {
        items.filter((w) => !w.draft).slice(0, HOME_WORKS).forEach((work) => {
          const item = document.createElement('a');
          item.className = 'home-work-item';
          item.href = work.link || `/work/${work.slug}/`;
          if (work.link) {
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
          }
          // Cover preview that follows the cursor on hover (see setupWorkPreview)
          if (work.cover) item.dataset.cover = `/work/${work.slug}/${work.cover}?v=${work.v}`;

          const title = document.createElement('span');
          title.className = 'home-work-title';
          title.textContent = work.title;
          item.appendChild(title);

          if (work.description) {
            const summary = document.createElement('span');
            summary.className = 'home-work-summary';
            summary.textContent = work.description;
            item.appendChild(summary);
          }

          workList.appendChild(item);
          // Endless strip of the project's images (thumbnails from build-work.js)
          if (work.strip && work.strip.length) {
            const marquee = buildMarquee(work);
            item.appendChild(marquee);
            marquee.fill(); // needs to be on the page to know its size
          }
        });
      })
      .catch((err) => console.error('Failed to load work:', err))
    : Promise.resolve();

  const entries = journalList
    ? fetch('/journals/journals.json', { cache: 'no-cache' })
      .then((res) => res.json())
      .then((items) => {
        items
          .filter((p) => !p.draft)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, HOME_ENTRIES)
          .forEach((post) => {
            const item = document.createElement('a');
            item.className = 'home-journal-item';
            item.href = `/journal/#${post.slug}`;

            const date = document.createElement('span');
            date.className = 'home-journal-date';
            date.textContent = new Date(post.date + 'T00:00:00')
              .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            item.appendChild(date);

            const title = document.createElement('span');
            title.className = 'home-journal-title';
            title.textContent = post.title;
            item.appendChild(title);

            journalList.appendChild(item);
          });
      })
      .catch((err) => console.error('Failed to load journal:', err))
    : Promise.resolve();

  // The column just got taller, so re-check which columns can stack
  Promise.all([works, entries]).then(() => {
    pinnedColumn.measure();
    setupWorkPreview(workList);
  });
});

// --- Project image marquee on the homepage ---
// Two identical halves slide left by exactly one half, so the loop is seamless.
// Each half repeats the project's images until it's at least as wide as the
// row, so there's never a gap however wide the column is. Spacing sits on each
// image (margin-right) rather than as a flex gap, so a half is exactly 50%.
const MARQUEE_SPEED = 55; // px per second

function buildMarquee(work) {
  const marquee = document.createElement('span');
  marquee.className = 'home-work-marquee';
  marquee.setAttribute('aria-hidden', 'true');
  const track = document.createElement('span');
  track.className = 'home-work-marquee-track';
  marquee.appendChild(track);

  function fill() {
    const height = marquee.clientHeight;
    const space = parseFloat(getComputedStyle(marquee).getPropertyValue('--marquee-gap')) || 12;
    const setWidth = work.strip.reduce((sum, s) => sum + height * (s.width / s.height) + space, 0);
    if (!height || !setWidth) return;
    const copies = Math.max(1, Math.ceil(marquee.clientWidth / setWidth));
    const half = [];
    for (let c = 0; c < copies; c++) half.push(...work.strip);

    track.replaceChildren(...[...half, ...half].map((s) => {
      const img = document.createElement('img');
      img.src = `/work/${work.slug}/${s.file}?v=${s.v}`;
      img.alt = '';
      img.width = s.width;
      img.height = s.height;
      img.decoding = 'async';
      return img;
    }));
    track.style.animationDuration = `${(setWidth * copies) / MARQUEE_SPEED}s`;
  }

  // Filled by the caller once it's on the page, and again when the size changes
  marquee.fill = fill;
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fill, 200);
  });
  return marquee;
}

// --- Cover preview that trails the cursor over homepage project rows ---
// Desktop with a mouse only. One preview element follows the pointer with a
// little easing and swaps to the hovered project's cover; it sits to the
// bottom-right of the cursor and flips sides near the screen edges.
function setupWorkPreview(list) {
  if (!list || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const items = [...list.querySelectorAll('.home-work-item[data-cover]')];
  if (!items.length) return;

  const OFFSET = 24; // px between cursor and preview
  const EASE = 0.18; // how quickly the preview catches up (0-1)
  const preview = document.createElement('div');
  preview.className = 'work-preview';
  preview.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.alt = '';
  preview.appendChild(img);
  document.body.appendChild(preview); // outside the pinned columns, so position: fixed works

  // Warm the cache so covers appear instantly on hover
  items.forEach((item) => { new Image().src = item.dataset.cover; });

  let target = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 };
  let active = false;
  let frame = null;

  function aim(e) {
    const w = preview.offsetWidth;
    const h = preview.offsetHeight;
    let x = e.clientX + OFFSET;
    let y = e.clientY + OFFSET;
    if (x + w > window.innerWidth - 16) x = e.clientX - w - OFFSET;
    if (y + h > window.innerHeight - 16) y = Math.max(16, window.innerHeight - h - 16);
    target = { x, y };
  }

  function tick() {
    pos.x += (target.x - pos.x) * EASE;
    pos.y += (target.y - pos.y) * EASE;
    preview.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    const settled = Math.abs(target.x - pos.x) < 0.5 && Math.abs(target.y - pos.y) < 0.5;
    frame = active || !settled ? requestAnimationFrame(tick) : null;
  }

  function show(item, e) {
    if (img.getAttribute('src') !== item.dataset.cover) img.src = item.dataset.cover;
    aim(e);
    if (!active) pos = { ...target }; // appear at the cursor, don't fly in
    active = true;
    preview.classList.add('is-visible');
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function hide() {
    active = false;
    preview.classList.remove('is-visible');
  }

  items.forEach((item) => {
    item.addEventListener('mouseenter', (e) => show(item, e));
    item.addEventListener('mousemove', (e) => (active ? aim(e) : show(item, e)));
    item.addEventListener('mouseleave', hide);
  });
  // Scrolling moves the rows away from the cursor, so hide until the next hover
  if (typeof lenis !== 'undefined' && lenis) lenis.on('scroll', hide);
  window.addEventListener('scroll', hide, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {

  // Force video autoplay on mobile
  const showreelVideo = document.querySelector('.showreel-bg');
  if (showreelVideo) {
    const attemptPlay = () => {
      showreelVideo.play().catch(() => {
        // If autoplay fails, try again on first user interaction
        const playOnInteraction = () => {
          showreelVideo.play().catch(() => {});
        };
        document.addEventListener('touchstart', playOnInteraction, { once: true });
        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('scroll', playOnInteraction, { once: true });
      });
    };

    // Wait for video to be ready
    if (showreelVideo.readyState >= 3) {
      // Video is already loaded enough to play
      attemptPlay();
    } else {
      // Wait for video to load
      showreelVideo.addEventListener('canplay', attemptPlay, { once: true });
      // Also try on loadeddata as backup
      showreelVideo.addEventListener('loadeddata', attemptPlay, { once: true });
    }

    // Fallback: try after a short delay regardless
    setTimeout(attemptPlay, 500);
  }

  document.querySelectorAll('.marquee-track').forEach(track => {
  const children = Array.from(track.children);

  children.forEach(child => {
    const clone = child.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
    });
  });
  
  
  const isDesktop = () => window.innerWidth > 700;

  // Debug
  console.log('CTA animated elements found:', document.querySelectorAll('.cta-animated').length);
  console.log('Nav animated elements found:', document.querySelectorAll('.nav-animated').length);

  //clock
  if (isDesktop()) {
    function updateClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(Math.floor(now.getMilliseconds() / 100));

      const clockElement = document.getElementById('clock');
      if (clockElement) {
        requestAnimationFrame(() => {
          clockElement.textContent = `— H${hours} M${minutes} S${seconds}.${milliseconds}`;
        });
      }
    }
    updateClock();
    setInterval(updateClock, 100);
  }

  //sidebar-title
  const words = [
    'EDO SEPTIYAN PUTRA ',
    'PRODUCT DESIGNER ',
    'AI-FIRST ',
    '(SEASONED) HELLDIVER '
  ];

  const typeTarget = document.getElementById('typewriter');
  const cursor = '—';

  if (typeTarget && isDesktop()) {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typingSpeed = 90;
    const deletingSpeed = 20;
    const holdAfterType = 3000;

    function typeLoop() {
      const currentWord = words[wordIndex];

      if (!isDeleting) charIndex++;
      else charIndex--;

      requestAnimationFrame(() => {
        typeTarget.textContent = currentWord.slice(0, charIndex) + cursor;
      });

      if (!isDeleting && charIndex === currentWord.length) {
        setTimeout(() => (isDeleting = true), holdAfterType);
      }

      if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }

      setTimeout(
        typeLoop,
        isDeleting ? deletingSpeed : typingSpeed
      );
    }

    typeLoop();
  }

  //animated button - works on all devices
  document.querySelectorAll('.cta-animated').forEach(cta => {
    const textEl = cta.querySelector('.cta-text');
    if (!textEl) return;

    const text = textEl.textContent.trim();

    const letters = [...text]
      .map((char, i) =>
        `<span style="--i:${i}">${char === ' ' ? '&nbsp;' : char}</span>`
      )
      .join('');

    const arrowSVG = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 17L17 7M17 7H7M17 7V17"
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
    textEl.innerHTML = `
      <span class="frame">
        <span class="sizer">${text}</span>
        <span class="text original">${letters}</span>
        <span class="text hover">${letters}</span>
      </span>
    `;

    const arrow = document.createElement('span');
    arrow.className = 'cta-arrow';
    arrow.innerHTML = arrowSVG;
    cta.appendChild(arrow);
  });

  //animated link - works on all devices
  document.querySelectorAll('.nav-animated').forEach(link => {
    const text = link.textContent.trim();

    const letters = [...text].map((char, i) =>
      `<span style="--i:${i}">${char === ' ' ? '&nbsp;' : char}</span>`
    ).join('');

    const chevronSVG = `
      <svg viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;

    link.innerHTML = `
      <span class="frame">
        <span class="sizer">${text}</span>
        <span class="text original">${letters}</span>
        <span class="text hover">${letters}</span>
      </span>

      <span class="nav-chevron">
        <span class="chevron-original">${chevronSVG}</span>
        <span class="chevron-hover">${chevronSVG}</span>
      </span>
    `;
  });

  // footer element animation
  const allSVGs = [
  'ep01.svg','ep02.svg','ep03.svg','ep04.svg','ep05.svg',
  'ep06.svg','ep07.svg','ep08.svg','ep09.svg','ep10.svg',
  'ep11.svg','ep12.svg','ep13.svg','ep14.svg','ep15.svg',
  'ep16.svg','ep17.svg','ep18.svg'
  ];

  const preloadPromises = allSVGs.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(src);
      img.src = `assets/svgs/${src}`;
    });
  });

  const normalSlots = {
    slotC: 250
  };

  function getRandomSVG() {
    const index = Math.floor(Math.random() * allSVGs.length);
    return allSVGs[index];
  }

  // Start cycling after preload
  Promise.all(preloadPromises)
    .then(() => {
    Object.entries(normalSlots).forEach(([slotId, interval]) => {
      const container = document.getElementById(slotId);
      if (!container) return;

      const img = document.createElement('img');
      img.alt = '';
      img.src = `assets/svgs/${getRandomSVG()}`;
      container.appendChild(img);

      setInterval(() => {
        img.src = `assets/svgs/${getRandomSVG()}`;
      }, interval);
    });
    
    // Handle slotA
    const slotA = document.getElementById('slotA');
    if (slotA) {
      const img = document.createElement('img');
      img.width = 80;
      img.height = 80;
      img.alt = '';
      img.src = `assets/svgs/${getRandomSVG()}`;
      slotA.appendChild(img);

      let currentInterval = 70;
      let intervalId;

      const startInterval = (speed) => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          img.src = `assets/svgs/${getRandomSVG()}`;
        }, speed);
      };
      startInterval(70);

      let speedChangeInterval = setInterval(() => {
        currentInterval = currentInterval === 70 ? 300 : 70;
        startInterval(currentInterval);
      }, 3000);
    }

    // Handle slotB
    const slotB = document.getElementById('slotB');
    if (slotB) {
      const img = document.createElement('img');
      img.width = 80;
      img.height = 80;
      img.alt = '';
      img.src = `assets/svgs/${getRandomSVG()}`;
      slotB.appendChild(img);

      let currentInterval = 400;
      let intervalId;

      const startInterval = (speed) => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          img.src = `assets/svgs/${getRandomSVG()}`;
        }, speed);
      };
      startInterval(400);

      let speedChangeInterval = setInterval(() => {
        currentInterval = currentInterval === 400 ? 800 : 400;
        startInterval(currentInterval);
      }, 2000);
    }
  })

  .catch(err => {
    console.error('Failed to load some SVGs:', err);
  });

  
  setTimeout(() => {
    const originalTitle = document.title;
    const messages = [
      "Wait, don't go!",
      "I'll be here — waiting",
      "Browsing, eh?",
      "Big Brother is watching"
    ];
    let msgIndex = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.title = messages[msgIndex % messages.length];
        msgIndex++;
      } else {
        document.title = originalTitle;
      }
    });
  }, 0);

  // Skill card rotator
  const skillCards = document.querySelectorAll('.skill-card');
  let currentSkill = 0;

  const skillFillDuration = 4000; // progress line fill (ms)
  const skillHoldDuration = 1000; // hold fully filled (ms)
  const skillFadeDuration = 1000; // card fade in/out (ms)

  function showSkillCard(index) {
    const card = skillCards[index];
    if (!card) return;

    const progressLine = card.querySelector('.progress-line');

    // Reset all cards and progress lines
    skillCards.forEach((c) => {
      c.classList.remove('active');
      c.style.opacity = 0;
      const line = c.querySelector('.progress-line');
      if (line) {
        line.style.transition = 'none';
        line.style.width = '0';
      }
    });

    // Activate current card
    card.classList.add('active');
    card.style.transition = `opacity ${skillFadeDuration}ms ease-in-out`;
    card.style.opacity = 0;

    // Force reflow
    void card.offsetWidth;

    // Fade-in
    card.style.opacity = 1;

    // Animate progress line
    if (progressLine) {
      progressLine.style.transition = `width ${skillFillDuration}ms linear`;
      progressLine.style.width = '100%';
    }

    // Wait for fill + hold
    setTimeout(() => {
      // Fade-out current card
      card.style.opacity = 0;

      setTimeout(() => {
        // Cleanup
        card.classList.remove('active');
        if (progressLine) progressLine.style.width = '0';

        // Next card
        currentSkill = (currentSkill + 1) % skillCards.length;
        showSkillCard(currentSkill);
      }, skillFadeDuration);
    }, skillFillDuration + skillHoldDuration);
  }

  // Start skill card rotation
  if (skillCards.length > 0) {
    showSkillCard(currentSkill);
  }


  let scrollPos = 0;
  $('#resume-trigger').on('click', function (e) {
    e.preventDefault();
    
    scrollPos = window.pageXOffset;
    $('body').addClass('modal-open');
    $('body').css('left', -scrollPos + 'px');
    
    $('#resume-modal').modal({
      fadeDuration: 150
    });
  });
  
  $(document).on($.modal.CLOSE, function() {
    $('body').removeClass('modal-open');
    $('body').css('left', '');
    window.scrollTo(scrollPos, 0);
  });
});