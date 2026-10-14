// Playground: staggered (masonry) grid of UI shots listed in /playground/shots.json.
// Add images to /playground/shots/ and run `node build-playground.js` to update
// the list; see the README section "Playground" for the full workflow.
document.addEventListener('DOMContentLoaded', () => {
  const SHOTS_DIR = '/playground/shots/';
  const grid = document.getElementById('shots');

  // --- Back button chevron (same icon as the journal) ---
  document.querySelectorAll('.back-button-float').forEach((btn) => {
    if (!btn.querySelector('svg')) {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
  });

  if (!grid) return;

  // 5 columns on desktop, 4 on smaller laptops, 3 on large tablets, 2 on tablets, 1 on phones
  function columnCount() {
    const width = grid.clientWidth;
    if (width > 1300) return 5;
    if (width > 1100) return 4;
    if (width > 800) return 3;
    if (width > 560) return 2;
    return 1;
  }

  const VIDEO_EXT = /\.(mp4|m4v)$/i;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The diagonal placeholder shows until the frame gets .loaded
  function buildImage(src, shot, frame) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'UI screenshot';
    img.width = shot.width;
    img.height = shot.height;
    img.loading = 'lazy';
    img.decoding = 'async';

    const onLoad = () => {
      frame.classList.add('loaded');
      window.imageZoom?.enable(img);
    };
    if (img.complete && img.naturalWidth > 0) onLoad();
    else {
      img.addEventListener('load', onLoad);
      img.addEventListener('error', () => frame.classList.add('loaded'));
    }
    return img;
  }

  // Videos play muted on loop, but only while on screen (and only start
  // downloading once they get near the screen). With reduced motion turned
  // on, they show the first frame with controls instead of autoplaying.
  const videoObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      });
    }, { rootMargin: '200px 0px' })
    : null;

  const pendingVideos = [];

  function buildVideo(src, frame) {
    const video = document.createElement('video');
    video.muted = true;
    video.setAttribute('muted', ''); // iOS needs the attribute to allow autoplay
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-label', 'UI recording');

    const onLoad = () => {
      frame.classList.add('loaded');
      window.imageZoom?.enable(video);
    };
    video.addEventListener('loadeddata', onLoad, { once: true });
    video.addEventListener('error', () => frame.classList.add('loaded'), { once: true });

    if (reduceMotion || !videoObserver) {
      video.preload = 'metadata';
      video.controls = true;
      video.addEventListener('loadedmetadata', onLoad, { once: true });
    } else {
      video.preload = 'none';
      pendingVideos.push(video); // observed once the grid is on the page
    }
    video.src = src;
    return video;
  }

  function buildShot(shot) {
    const frame = document.createElement('div');
    frame.className = 'shot-frame';
    frame.style.aspectRatio = `${shot.width} / ${shot.height}`;

    const src = SHOTS_DIR + encodeURIComponent(shot.file);
    const media = VIDEO_EXT.test(shot.file) ? buildVideo(src, frame) : buildImage(src, shot, frame);

    frame.appendChild(media);
    return frame;
  }

  let tiles = []; // [{ el, ratio }]
  let currentCols = 0;

  // Place each shot in the shortest column so far (by height relative to
  // width, known from shots.json), keeping the order roughly left to right
  function layout() {
    const cols = columnCount();
    if (cols === currentCols) return;
    currentCols = cols;

    const columns = Array.from({ length: cols }, () => {
      const col = document.createElement('div');
      col.className = 'shots-col';
      return { el: col, height: 0 };
    });
    tiles.forEach(({ el, ratio }) => {
      const shortest = columns.reduce((a, b) => (b.height < a.height ? b : a));
      shortest.el.appendChild(el);
      shortest.height += ratio;
    });
    grid.replaceChildren(...columns.map((c) => c.el));
  }

  fetch('/playground/shots.json')
    .then((res) => res.json())
    .then((shots) => {
      const visible = shots.filter((s) => !s.hidden && s.width && s.height);
      const meta = document.getElementById('shots-meta');
      if (meta) {
        meta.textContent = visible.length
          ? `${visible.length} shot${visible.length === 1 ? '' : 's'} and counting`
          : 'Nothing here yet. Check back soon.';
      }
      if (!visible.length) return;
      tiles = visible.map((shot) => ({ el: buildShot(shot), ratio: shot.height / shot.width }));
      layout();
      pendingVideos.forEach((video) => videoObserver.observe(video));

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layout, 150);
      });
    })
    .catch((err) => {
      console.error('Failed to load playground:', err);
      const meta = document.getElementById('shots-meta');
      if (meta) meta.textContent = 'Failed to load the playground.';
    });
});
