// Work section: the /work/ grid, and the case study content on
// /work/<slug>/ pages. Projects are listed in /work/works.json, which
// `node build-work.js` keeps in sync with the project folders.
document.addEventListener('DOMContentLoaded', () => {
  // --- Back button chevron (same icon as the journal) ---
  document.querySelectorAll('.back-button-float').forEach((btn) => {
    if (!btn.querySelector('svg')) {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
  });

  // Case study cover: placeholder until loaded, then zoomable
  document.querySelectorAll('.work-page-cover img').forEach((img) => watchImage(img, img.parentElement));

  renderGrid(document.getElementById('works'));
  renderCaseStudy(document.getElementById('post-content'));
});

// The diagonal placeholder shows until the frame gets .loaded
function watchImage(img, frame) {
  const onLoad = () => {
    frame.classList.add('loaded');
    window.imageZoom?.enable(img);
  };
  if (img.complete && img.naturalWidth > 0) onLoad();
  else {
    img.addEventListener('load', onLoad);
    img.addEventListener('error', () => frame.classList.add('loaded'));
  }
}

// --- /work/: 2-column grid of project cards ---
function renderGrid(grid) {
  if (!grid) return;

  function buildCard(work) {
    const card = document.createElement('a');
    card.className = 'work-card';
    card.href = work.link || `/work/${work.slug}/`;
    if (work.link) {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }

    if (work.cover) {
      const frame = document.createElement('div');
      frame.className = 'work-card-cover';
      frame.style.aspectRatio = `${work.width} / ${work.height}`;
      const img = document.createElement('img');
      img.src = `/work/${work.slug}/${work.cover}?v=${work.v}`;
      img.alt = '';
      img.width = work.width;
      img.height = work.height;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('load', () => frame.classList.add('loaded'));
      img.addEventListener('error', () => frame.classList.add('loaded'));
      frame.appendChild(img);
      card.appendChild(frame);
    }

    const title = document.createElement('h2');
    title.className = 'work-card-title';
    title.textContent = work.title;
    card.appendChild(title);

    if (work.description) {
      const desc = document.createElement('p');
      desc.className = 'work-card-description';
      desc.textContent = work.description;
      card.appendChild(desc);
    }

    if (work.tags.length) {
      const tags = document.createElement('div');
      tags.className = 'work-card-tags';
      work.tags.forEach((tag) => {
        const el = document.createElement('span');
        el.className = 'text-tag';
        el.textContent = tag;
        tags.appendChild(el);
      });
      card.appendChild(tags);
    }
    return card;
  }

  // A plain 2-column grid (1 on phones, in CSS): cards read left to right,
  // row by row, in works.json order
  fetch('/work/works.json', { cache: 'no-cache' })
    .then((res) => res.json())
    .then((works) => {
      const visible = works.filter((w) => !w.draft);
      const meta = document.getElementById('works-meta');
      if (meta) {
        meta.textContent = visible.length
          ? `${visible.length} project${visible.length === 1 ? '' : 's'}`
          : 'Case studies coming soon.';
      }
      grid.replaceChildren(...visible.map(buildCard));
    })
    .catch((err) => console.error('Failed to load work:', err));
}

// --- /work/<slug>/: render the case study markdown ---
// - Images on consecutive lines (one markdown paragraph of only images) become a
//   wide staggered gallery; an image on its own stays in the text column.
// - Sizes come from the page's #work-images list (written by build-work.js), so
//   space is reserved before images load and file names get their ?v= fingerprint.
// - Every image (cover first) joins one zoom group, so ←/→ step through them all.
function renderCaseStudy(content) {
  if (!content || !content.dataset.src) return;

  let manifest = {};
  try {
    manifest = JSON.parse(document.getElementById('work-images')?.textContent || '{}');
  } catch {
    manifest = {};
  }
  const isLocal = (src) => src && !/^([a-z]+:)?\/\//i.test(src) && !src.startsWith('/');

  fetch(content.dataset.src, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error('Case study not found');
      return res.text();
    })
    .then((md) => {
      content.innerHTML = typeof marked !== 'undefined' ? marked.parse(md) : md;

      // Sizes, fingerprints and lazy loading for every image
      const images = [...content.querySelectorAll('img')];
      images.forEach((img) => {
        const src = img.getAttribute('src');
        const info = isLocal(src) && manifest[decodeURIComponent(src)];
        if (info) {
          img.width = info.width;
          img.height = info.height;
          img.src = `${src}?v=${info.v}`;
        }
        img.loading = 'lazy';
        img.decoding = 'async';
      });

      // One zoom group in reading order: cover, then the images as written
      const cover = document.querySelector('.work-page-cover img');
      [cover, ...images].filter(Boolean).forEach((img, i) => {
        img.dataset.zoomGroup = 'case-study';
        img.dataset.zoomOrder = i;
      });

      // Galleries: paragraphs that hold nothing but 2+ images
      content.querySelectorAll('p').forEach((p) => {
        const imgs = [...p.children].filter((el) => el.tagName === 'IMG');
        const onlyImages = [...p.childNodes].every((node) =>
          (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'IMG' || node.tagName === 'BR'))
          || (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()));
        if (imgs.length >= 2 && onlyImages) {
          const gallery = buildGallery(imgs);
          p.replaceWith(gallery);
          gallery.layout(); // needs to be on the page to know its width
        }
      });

      // Single images: diagonal placeholder until loaded (same as journal entries)
      content.querySelectorAll('img').forEach((img) => {
        if (img.closest('.case-gallery')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'img-placeholder';
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        watchImage(img, wrapper);
      });
    })
    .catch((err) => {
      console.error('Failed to load case study:', err);
      content.innerHTML = '<div class="post-not-found">Failed to load this case study.</div>';
    });
}

// A wide staggered gallery (2 columns, 1 on narrow screens), images placed in
// the currently shortest column so the order reads left to right
function buildGallery(imgs) {
  const gallery = document.createElement('div');
  gallery.className = 'case-gallery';

  const tiles = imgs.map((img) => {
    const tile = document.createElement('div');
    tile.className = 'case-gallery-tile';
    const known = img.width && img.height;
    if (known) tile.style.aspectRatio = `${img.width} / ${img.height}`;
    tile.appendChild(img);
    watchImage(img, tile);
    return { el: tile, ratio: known ? img.height / img.width : 0.75 };
  });

  let currentCols = 0;
  function layout() {
    const cols = gallery.clientWidth > 640 ? 2 : 1;
    if (cols === currentCols) return;
    currentCols = cols;
    const columns = Array.from({ length: cols }, () => {
      const col = document.createElement('div');
      col.className = 'case-gallery-col';
      return { el: col, height: 0 };
    });
    tiles.forEach(({ el, ratio }) => {
      const shortest = columns.reduce((a, b) => (b.height < a.height ? b : a));
      shortest.el.appendChild(el);
      shortest.height += ratio;
    });
    gallery.replaceChildren(...columns.map((c) => c.el));
  }

  // Laid out by the caller once it's on the page, and again on resize
  gallery.layout = layout;
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });
  return gallery;
}
