// Shared Medium-style image/video zoom (used by /journal and /playground).
// Pages call window.imageZoom.enable(el) once an image or video has loaded.
// Click it to grow it from its spot to the centre of the screen over a dark
// backdrop. Click, Esc or resize closes it; page scrolling is blocked while
// it's open so it always shrinks back to where it came from. Things never
// shrink, so ones already as big as the screen allows just get the backdrop.
//
// Images: a clone is animated (so the article layout never moves).
// Videos: the video itself is lifted out and animated, so it keeps playing
// from the same frame instead of restarting (a clone would reload from the
// start). Its tile keeps its size via aspect-ratio, so nothing shifts. Videos
// stay muted.
window.imageZoom = (() => {
  const desktopMq = window.matchMedia('(min-width: 769px) and (hover: hover)');
  const DURATION = 300; // ms, keep in sync with .img-zoom-* transitions
  const MARGIN = 40; // px around the zoomed image
  const SCROLL_KEYS = [' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'];
  const ZOOM_SELECTOR = '[data-zoom]';

  let overlay = null;
  let current = null; // { source, zoomed, home } (home: where a lifted video goes back to)
  let settling = false; // true while the close animation finishes

  function getOverlay() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'img-zoom-overlay';
      overlay.addEventListener('click', close);
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function targetTransform(rect, el) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Fit inside the screen, but never past the image/video's own resolution
    const maxW = Math.min(vw - MARGIN * 2, el.naturalWidth || el.videoWidth || Infinity);
    const maxH = Math.min(vh - MARGIN * 2, el.naturalHeight || el.videoHeight || Infinity);
    const scale = Math.max(1, Math.min(maxW / rect.width, maxH / rect.height));
    const dx = vw / 2 - (rect.left + rect.width / 2);
    const dy = vh / 2 - (rect.top + rect.height / 2);
    return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  }

  function placeAt(el, rect) {
    Object.assign(el.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  }

  function open(source) {
    if (current || settling || !desktopMq.matches) return;
    const rect = source.getBoundingClientRect();
    const isVideo = source.tagName === 'VIDEO';
    let zoomed;
    let home = null;

    if (isVideo) {
      // Lift the playing video out of its tile; moving it pauses it, so resume
      home = { parent: source.parentNode, next: source.nextSibling };
      zoomed = source;
      zoomed.classList.add('img-zoom-clone');
      placeAt(zoomed, rect);
      document.body.appendChild(zoomed);
      zoomed.play().catch(() => {});
    } else {
      zoomed = source.cloneNode();
      ['tabindex', 'role', 'aria-label', 'data-zoom', 'loading'].forEach((attr) => zoomed.removeAttribute(attr));
      zoomed.className = 'img-zoom-clone';
      placeAt(zoomed, rect);
      document.body.appendChild(zoomed);
      source.style.visibility = 'hidden';
    }
    current = { source, zoomed, home };

    const backdrop = getOverlay();
    // Force a layout so the starting position is committed before animating
    void zoomed.offsetWidth;
    document.body.classList.add('img-zoom-open');
    backdrop.classList.add('is-open');
    zoomed.style.transform = targetTransform(rect, source);
  }

  function close() {
    if (!current) return;
    const { source, zoomed, home } = current;
    current = null;
    settling = true;
    document.body.classList.remove('img-zoom-open');
    overlay.classList.remove('is-open');
    zoomed.style.transform = '';
    setTimeout(() => {
      if (home) {
        // Put the video back in its tile and keep it playing
        home.parent.insertBefore(zoomed, home.next);
        zoomed.classList.remove('img-zoom-clone');
        ['top', 'left', 'width', 'height', 'transform'].forEach((prop) => { zoomed.style[prop] = ''; });
        zoomed.play().catch(() => {});
      } else {
        source.style.visibility = '';
        zoomed.remove();
      }
      settling = false;
    }, DURATION);
  }

  // Open on click (or Enter/Space when focused) of a zoomable image/video;
  // while zoomed, clicking it (or the backdrop) closes
  document.addEventListener('click', (e) => {
    if (current) {
      if (e.target === current.zoomed) close();
      return;
    }
    const el = e.target.closest(ZOOM_SELECTOR);
    if (el) open(el);
  });
  document.addEventListener('keydown', (e) => {
    if (current) {
      if (e.key === 'Escape') close();
      if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
      return;
    }
    const el = e.target.closest && e.target.closest(ZOOM_SELECTOR);
    if (el && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      open(el);
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

  // Make a loaded image/video zoomable (desktop only; things inside links
  // stay links, and videos showing their own controls are left alone)
  function enable(el) {
    if (!desktopMq.matches || el.closest('a') || el.controls) return;
    const isVideo = el.tagName === 'VIDEO';
    el.dataset.zoom = '';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', isVideo ? 'Enlarge video' : `Enlarge image${el.alt ? `: ${el.alt}` : ''}`);
  }

  return { enable };
})();
