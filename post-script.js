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

  // --- Post List Rendering (for /post/index.html) ---
  const postListEl = document.getElementById('post-list');
  if (postListEl) {
    fetch('/posts/posts.json')
      .then(res => res.json())
      .then(posts => {
        // Sort by date descending
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        posts.forEach(post => {
          const item = document.createElement('a');
          item.href = `/post/post.html?slug=${post.slug}`;
          item.className = 'post-item';

          const title = document.createElement('div');
          title.className = 'post-item-title';
          title.textContent = post.title;

          const meta = document.createElement('div');
          meta.className = 'post-meta';

          const date = document.createElement('span');
          date.className = 'post-date';
          date.textContent = formatDate(post.date);

          const tags = document.createElement('span');
          tags.className = 'post-tags';
          post.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'text-tag';
            tagEl.textContent = `#${tag}`;
            tags.appendChild(tagEl);
          });

          meta.appendChild(date);
          meta.appendChild(tags);
          item.appendChild(title);
          item.appendChild(meta);
          postListEl.appendChild(item);
        });
      })
      .catch(err => {
        console.error('Failed to load posts:', err);
        postListEl.innerHTML = '<div class="post-not-found">Failed to load posts.</div>';
      });
  }

  // --- Post Reader Rendering (for /post/post.html) ---
  const postContainer = document.getElementById('post-content');
  if (postContainer) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
      postContainer.innerHTML = '<div class="post-not-found">No post specified.</div>';
      return;
    }

    fetch('/posts/posts.json')
      .then(res => res.json())
      .then(posts => {
        const post = posts.find(p => p.slug === slug);
        if (!post) {
          postContainer.innerHTML = '<div class="post-not-found">Post not found.</div>';
          return;
        }

        // Set title and date
        const titleEl = document.getElementById('post-title');
        const dateEl = document.getElementById('post-date');
        const tagsEl = document.getElementById('post-tags');

        if (titleEl) titleEl.textContent = post.title;
        if (dateEl) dateEl.textContent = formatDate(post.date);

        // Set page title
        document.title = `${post.title} — Edo Putra`;

        // Render tags
        if (tagsEl) {
          post.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'text-tag';
            tagEl.textContent = `#${tag}`;
            tagsEl.appendChild(tagEl);
          });
        }

        // Fetch and render markdown
        return fetch(`/posts/${slug}.md`);
      })
      .then(res => {
        if (!res || !res.ok) throw new Error('Markdown not found');
        return res.text();
      })
      .then(md => {
        if (typeof marked !== 'undefined') {
          postContainer.innerHTML = marked.parse(md);
        } else {
          postContainer.textContent = md;
        }
      })
      .catch(err => {
        console.error('Failed to load post:', err);
        if (!postContainer.innerHTML) {
          postContainer.innerHTML = '<div class="post-not-found">Failed to load post content.</div>';
        }
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
      // slotC - constant 250ms
      const slotC = document.getElementById('slotC');
      if (slotC) {
        const img = document.createElement('img');
        img.alt = '';
        img.src = `/assets/svgs/${getRandomSVG()}`;
        slotC.appendChild(img);
        setInterval(() => { img.src = `/assets/svgs/${getRandomSVG()}`; }, 250);
      }

      // slotA - alternates between 70ms and 300ms every 3s
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

      // slotB - alternates between 400ms and 800ms every 2s
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
});
