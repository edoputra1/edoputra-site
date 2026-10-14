document.addEventListener('DOMContentLoaded', () => {
  const isDesktop = () => window.innerWidth > 700;

  // --- Clock (from script.js) ---
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

  // --- Typewriter (from script.js) ---
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

  // --- Date Formatting ---
  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // --- Chevron SVG (reused from script.js nav animation) ---
  const chevronSVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  // --- Inject back button SVG ---
  document.querySelectorAll('.back-button, .back-button-float').forEach(btn => {
    if (!btn.querySelector('svg')) {
      btn.innerHTML = chevronSVG;
    }
  });

  // --- View Elements ---
  const viewList = document.getElementById('view-list');
  const viewReader = document.getElementById('view-reader');

  // --- View Switching ---
  function getSlug() {
    const hash = window.location.hash;
    return hash ? hash.slice(1) : null;
  }

  function showListView() {
    if (!viewList || !viewReader) return;

    document.body.classList.remove('post-reader');
    viewList.style.display = '';
    viewReader.style.display = 'none';
    document.title = 'Posts — Edo Putra';

    // Re-init Lenis for horizontal scroll
    if (typeof initLenis === 'function') initLenis();
  }

  function showReaderView(slug) {
    if (!viewList || !viewReader) return;

    // Destroy Lenis (no horizontal scroll in reader)
    if (typeof destroyLenis === 'function') destroyLenis();

    document.body.classList.add('post-reader');
    viewList.style.display = 'none';
    viewReader.style.display = '';

    // Scroll to top
    window.scrollTo(0, 0);

    // Clear previous content
    const titleEl = document.getElementById('post-title');
    const dateEl = document.getElementById('post-date');
    const contentEl = document.getElementById('post-content');
    const tagsEl = document.getElementById('post-tags');

    if (titleEl) titleEl.textContent = '';
    if (dateEl) dateEl.textContent = '';
    if (contentEl) contentEl.innerHTML = '';
    if (tagsEl) tagsEl.innerHTML = '';

    // Fetch and render post
    fetch('/posts/posts.json')
      .then(res => res.json())
      .then(posts => {
        const post = posts.find(p => p.slug === slug);
        if (!post) {
          if (contentEl) contentEl.innerHTML = '<div class="post-not-found">Post not found.</div>';
          return;
        }

        if (titleEl) titleEl.textContent = post.title;
        if (dateEl) dateEl.textContent = formatDate(post.date);
        document.title = `${post.title} — Edo Putra`;

        if (tagsEl) {
          tagsEl.innerHTML = '';
          post.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'text-tag';
            tagEl.textContent = `#${tag}`;
            tagsEl.appendChild(tagEl);
          });
        }

        return fetch(`/posts/${slug}/index.md`);
      })
      .then(res => {
        if (!res || !res.ok) throw new Error('Markdown not found');
        return res.text();
      })
      .then(md => {
        if (contentEl) {
          if (typeof marked !== 'undefined') {
            contentEl.innerHTML = marked.parse(md);
          } else {
            contentEl.textContent = md;
          }

          // Wrap images with diagonal-grid placeholder
          contentEl.querySelectorAll('img').forEach(img => {
            const wrapper = document.createElement('div');
            wrapper.className = 'img-placeholder';
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);

            if (img.complete && img.naturalWidth > 0) {
              wrapper.classList.add('loaded');
              zoom.enable(img);
            } else {
              img.addEventListener('load', () => {
                wrapper.classList.add('loaded');
                zoom.enable(img);
              });
              img.addEventListener('error', () => wrapper.classList.add('loaded'));
            }
          });
        }
      })
      .catch(err => {
        console.error('Failed to load post:', err);
        if (contentEl && !contentEl.innerHTML) {
          contentEl.innerHTML = '<div class="post-not-found">Failed to load post content.</div>';
        }
      });
  }

  function handleRoute() {
    const slug = getSlug();
    if (slug) {
      showReaderView(slug);
    } else {
      showListView();
    }
  }

  // --- Back button intercept (go to list without page reload) ---
  const backBtn = document.querySelector('.back-button-float');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState(null, '', '/post/');
      handleRoute();
    });
  }

  // --- Image zoom (Medium-style, desktop only) ---
  // Click a post image to grow it from its spot to the centre of the screen
  // over a dark backdrop. Click, Esc or resize closes it; page scrolling is
  // blocked while it's open so it always shrinks back to where it came from.
  // A clone is animated (so the article layout never moves); images never
  // shrink, so ones already as big as the screen allows just get the backdrop.
  const zoom = (() => {
    const desktopMq = window.matchMedia('(min-width: 769px) and (hover: hover)');
    const DURATION = 300; // ms, keep in sync with .img-zoom-* transitions
    const MARGIN = 40; // px around the zoomed image
    const SCROLL_KEYS = [' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'];
    const IMG_SELECTOR = '#post-content .img-placeholder.loaded img[role="button"]';

    let overlay = null;
    let current = null; // { img, clone }

    function getOverlay() {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'img-zoom-overlay';
        overlay.addEventListener('click', close);
        document.body.appendChild(overlay);
      }
      return overlay;
    }

    function targetTransform(rect, img) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Fit inside the screen, but never past the image's own resolution
      const maxW = Math.min(vw - MARGIN * 2, img.naturalWidth || Infinity);
      const maxH = Math.min(vh - MARGIN * 2, img.naturalHeight || Infinity);
      const scale = Math.max(1, Math.min(maxW / rect.width, maxH / rect.height));
      const dx = vw / 2 - (rect.left + rect.width / 2);
      const dy = vh / 2 - (rect.top + rect.height / 2);
      return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
    }

    function open(img) {
      if (current || !desktopMq.matches) return;
      const rect = img.getBoundingClientRect();
      const clone = img.cloneNode();
      ['tabindex', 'role', 'aria-label'].forEach((attr) => clone.removeAttribute(attr));
      clone.className = 'img-zoom-clone';
      Object.assign(clone.style, {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
      clone.addEventListener('click', close);
      document.body.appendChild(clone);
      img.style.visibility = 'hidden';
      current = { img, clone };

      const backdrop = getOverlay();
      // Force a layout so the starting position is committed before animating
      void clone.offsetWidth;
      document.body.classList.add('img-zoom-open');
      backdrop.classList.add('is-open');
      clone.style.transform = targetTransform(rect, img);
    }

    function close() {
      if (!current) return;
      const { img, clone } = current;
      current = null;
      document.body.classList.remove('img-zoom-open');
      overlay.classList.remove('is-open');
      clone.style.transform = '';
      setTimeout(() => {
        img.style.visibility = '';
        clone.remove();
      }, DURATION);
    }

    // Open on click (or Enter/Space when focused) of a zoomable post image
    document.addEventListener('click', (e) => {
      const img = e.target.closest(IMG_SELECTOR);
      if (img) open(img);
    });
    document.addEventListener('keydown', (e) => {
      if (current) {
        if (e.key === 'Escape') close();
        if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
        return;
      }
      const img = e.target.closest && e.target.closest(IMG_SELECTOR);
      if (img && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        open(img);
      }
    });
    // Block page scrolling while zoomed (no overflow: hidden, so the
    // scrollbar doesn't disappear and shift the layout)
    window.addEventListener('wheel', (e) => {
      if (current) e.preventDefault();
    }, { passive: false });
    window.addEventListener('resize', close);
    window.addEventListener('hashchange', close);
    window.addEventListener('popstate', close);

    // Make a loaded image zoomable (desktop only; images inside links stay links)
    function enable(img) {
      if (!desktopMq.matches || img.closest('a')) return;
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Enlarge image${img.alt ? `: ${img.alt}` : ''}`);
    }

    return { enable };
  })();

  // --- Listen for hash changes ---
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('popstate', handleRoute);

  // --- Post List Rendering ---
  const postListEl = document.getElementById('post-list');
  if (postListEl) {
    fetch('/posts/posts.json')
      .then(res => res.json())
      .then(posts => {
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        posts.filter(p => !p.draft).forEach(post => {
          const item = document.createElement('a');
          item.href = `/post/#${post.slug}`;
          item.className = 'post-item';

          const date = document.createElement('div');
          date.className = 'post-date';
          date.textContent = formatDate(post.date);

          const title = document.createElement('div');
          title.className = 'post-item-title';
          title.textContent = post.title;

          const tags = document.createElement('div');
          tags.className = 'post-tags';
          post.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'text-tag';
            tagEl.textContent = `#${tag}`;
            tags.appendChild(tagEl);
          });

          item.appendChild(date);
          item.appendChild(title);
          item.appendChild(tags);
          postListEl.appendChild(item);
        });
      })
      .catch(err => {
        console.error('Failed to load posts:', err);
        postListEl.innerHTML = '<div class="post-not-found">Failed to load posts.</div>';
      });
  }

  // --- SVG Grid Animation (from script.js) ---
  const allSVGs = [
    'ep01.svg','ep02.svg','ep03.svg','ep04.svg','ep05.svg',
    'ep06.svg','ep07.svg','ep08.svg','ep09.svg','ep10.svg',
    'ep11.svg','ep12.svg','ep13.svg','ep14.svg','ep15.svg',
    'ep16.svg','ep17.svg','ep18.svg'
  ];

  function getRandomSVG() {
    return allSVGs[Math.floor(Math.random() * allSVGs.length)];
  }

  const preloadPromises = allSVGs.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(src);
      img.src = `/assets/svgs/${src}`;
    });
  });

  Promise.all(preloadPromises)
    .then(() => {
      const slotC = document.getElementById('slotC');
      if (slotC) {
        const img = document.createElement('img');
        img.alt = '';
        img.src = `/assets/svgs/${getRandomSVG()}`;
        slotC.appendChild(img);
        setInterval(() => { img.src = `/assets/svgs/${getRandomSVG()}`; }, 250);
      }

      const slotA = document.getElementById('slotA');
      if (slotA) {
        const img = document.createElement('img');
        img.width = 80; img.height = 80; img.alt = '';
        img.src = `/assets/svgs/${getRandomSVG()}`;
        slotA.appendChild(img);

        let currentInterval = 70;
        let intervalId;
        const startInterval = (speed) => {
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(() => { img.src = `/assets/svgs/${getRandomSVG()}`; }, speed);
        };
        startInterval(70);
        setInterval(() => {
          currentInterval = currentInterval === 70 ? 300 : 70;
          startInterval(currentInterval);
        }, 3000);
      }

      const slotB = document.getElementById('slotB');
      if (slotB) {
        const img = document.createElement('img');
        img.width = 80; img.height = 80; img.alt = '';
        img.src = `/assets/svgs/${getRandomSVG()}`;
        slotB.appendChild(img);

        let currentInterval = 400;
        let intervalId;
        const startInterval = (speed) => {
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(() => { img.src = `/assets/svgs/${getRandomSVG()}`; }, speed);
        };
        startInterval(400);
        setInterval(() => {
          currentInterval = currentInterval === 400 ? 800 : 400;
          startInterval(currentInterval);
        }, 2000);
      }
    })
    .catch(err => {
      console.error('Failed to load some SVGs:', err);
    });

  // --- Initial route ---
  handleRoute();
});
