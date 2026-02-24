# Blog System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a blog system with post index (`/post/`) and post reader (`/post/post.html?slug=...`) to the existing static portfolio site.

**Architecture:** Two separate HTML pages sharing `style.css` for base styling. A new `post-style.css` for post-specific styles. A new `post-script.js` for post-specific JavaScript (sidebar clock/typewriter, post fetching/rendering). Markdown content parsed client-side via marked.js CDN. Post metadata stored in `posts/posts.json`, content in individual `.md` files.

**Tech Stack:** Vanilla HTML/CSS/JS, marked.js (CDN), Lenis (CDN, index only), Google Fonts (Geist, Geist Mono)

**Design Doc:** `docs/plans/2026-02-24-blog-system-design.md`

**Testing:** No automated test framework. Each task includes manual browser verification via `python3 -m http.server 8000`. Verify both desktop (horizontal scroll on index) and mobile (responsive).

---

### Task 1: Create sample post data

Create the posts manifest and a sample markdown post so subsequent tasks have data to render.

**Files:**
- Create: `posts/posts.json`
- Create: `posts/hello-world.md`

**Step 1: Create posts directory and manifest**

Create `posts/posts.json`:
```json
[
  {
    "slug": "hello-world",
    "title": "Hello, World",
    "date": "2026-02-24",
    "tags": ["meta", "first-post"]
  }
]
```

**Step 2: Create sample markdown post**

Create `posts/hello-world.md`:
```markdown
This is my first blog post. Just testing things out.

## Why a Blog?

Sometimes I want to write longer thoughts that don't fit in a portfolio or a tweet. This is that space.

### What to Expect

I'll write about design, tools, process, and occasionally things that have nothing to do with work.

Here's a list of topics I might cover:

- Design systems and component thinking
- AI tools in the design workflow
- Remote work from Yogyakarta
- Helldivers 2 strategy guides (maybe)

## That's It

More posts coming soon. Or not. We'll see.
```

**Step 3: Commit**

```bash
git add posts/posts.json posts/hello-world.md
git commit -m "add post data: manifest and sample hello-world post"
```

---

### Task 2: Create post-specific CSS (`post-style.css`)

All post-specific styles in one file. Covers: back button, post list items with hover animation, post reader layout, markdown content typography, mobile overrides.

**Files:**
- Create: `post-style.css`

**Step 1: Create `post-style.css`**

Reference these existing patterns from `style.css`:
- `.text-body ul li::after` (lines 307-327) — the right-to-left blue line fill on hover
- `.nav-animated .nav-chevron` (lines 853-889) — chevron styling
- `.text-tag` (lines 353-371) — tag pills
- `.sidebar-fixed` (lines 134-162) — sidebar (already in style.css, just reused)
- `.content-wrapper` (lines 182-191) — column layout (already in style.css)
- Mobile breakpoint: `@media (max-width: 768px)` — same as style.css

Create `post-style.css` with these sections:

```css
/* ============================
   Post System Styles
   Loaded alongside style.css
   ============================ */

/* --- Back Button (shared between index and reader) --- */
.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  color: var(--color-blue);
  text-decoration: none;
  transition: background 0.2s ease;
  margin-bottom: 2rem;
}
.back-button:hover {
  background: rgba(255, 255, 255, 0.05);
}
.back-button svg {
  width: 2rem;
  height: 2rem;
  transform: scaleX(-1);
}

/* --- Post List (index page) --- */
.post-list {
  display: flex;
  flex-direction: column;
}

.post-item {
  display: block;
  position: relative;
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  text-decoration: none;
  color: var(--color-white);
  transition: background 0.2s ease;
}
.post-item:last-child {
  border-bottom: none;
}

/* Right-to-left blue line fill on hover (from .text-body ul li::after) */
.post-item::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background-color: var(--color-blue);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}
.post-item:hover::after,
.post-item:focus-within::after {
  transform: scaleX(1);
}

.post-item-title {
  font-size: 2rem;
  line-height: 1.3;
  margin-bottom: 0.5rem;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.post-date {
  font-family: var(--font-mono);
  font-size: 0.825rem;
  color: rgba(255, 255, 255, 0.5);
}

.post-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

/* --- Post Reader (post.html) --- */
body.post-reader {
  overflow-x: hidden;
  overflow-y: auto;
  height: auto;
  padding: 0;
}

body.post-reader .sidebar-fixed {
  display: none;
}

.back-button-float {
  position: fixed;
  top: 2rem;
  left: 2rem;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  color: var(--color-blue);
  text-decoration: none;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: background 0.2s ease;
}
.back-button-float:hover {
  background: rgba(255, 255, 255, 0.1);
}
.back-button-float svg {
  width: 1.5rem;
  height: 1.5rem;
  transform: scaleX(-1);
}

.post-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 10vh 2rem;
}

.post-reader-title {
  font-size: 3rem;
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.post-reader-date {
  font-family: var(--font-mono);
  font-size: 0.825rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2rem;
}

.post-reader-content {
  margin-bottom: 3rem;
}

/* Markdown rendered content */
.post-reader-content h1 {
  font-size: 2.5rem;
  font-weight: 400;
  line-height: 1.2;
  margin: 3rem 0 1.5rem;
  letter-spacing: -0.02em;
}

.post-reader-content h2 {
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.25;
  margin: 2.5rem 0 1.25rem;
  letter-spacing: -0.01em;
}

.post-reader-content h3 {
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1.3;
  margin: 2rem 0 1rem;
}

.post-reader-content p {
  font-size: 1.25rem;
  line-height: 1.75;
  margin-bottom: 1.5rem;
}

.post-reader-content ul,
.post-reader-content ol {
  font-size: 1.25rem;
  line-height: 1.75;
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.post-reader-content li {
  margin-bottom: 0.5rem;
}

.post-reader-content blockquote {
  border-left: 3px solid var(--color-blue);
  padding-left: 1.5rem;
  margin: 2rem 0;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.post-reader-content code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
}

.post-reader-content pre {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.post-reader-content pre code {
  background: none;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

.post-reader-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1.5rem 0;
  display: block;
}

.post-reader-content video {
  max-width: 100%;
  aspect-ratio: 16 / 9;
  margin: 1.5rem 0;
  display: block;
}

.post-reader-content a {
  color: var(--color-cyan);
  text-decoration: none;
  transition: color 0.25s ease;
}
.post-reader-content a:hover {
  color: var(--color-white);
}

.post-reader-content strong {
  font-weight: 400;
  color: var(--color-white);
}

.post-reader-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

/* --- Post Not Found --- */
.post-not-found {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.5);
}

/* --- Mobile overrides --- */
@media (max-width: 768px) {
  .post-item-title {
    font-size: 1.8rem;
  }

  body.post-reader {
    padding: 0;
  }

  .post-container {
    padding: 5vh 5vw;
  }

  .post-reader-title {
    font-size: 2.5rem;
  }

  .back-button-float {
    top: 1rem;
    left: 1rem;
  }
}
```

**Step 2: Commit**

```bash
git add post-style.css
git commit -m "add post-specific CSS for index and reader pages"
```

---

### Task 3: Create post-specific JavaScript (`post-script.js`)

Handles: sidebar clock + typewriter (extracted from `script.js` lines 62-134), fetching `posts.json`, rendering post list, fetching + parsing markdown, date formatting.

**Files:**
- Create: `post-script.js`

**Step 1: Create `post-script.js`**

Reference `script.js` lines 62-134 for clock and typewriter logic. The new script replicates that exactly (same timing, same words, same cursor).

```javascript
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
});
```

**Step 2: Commit**

```bash
git add post-script.js
git commit -m "add post-specific JS: sidebar, post list rendering, markdown reader"
```

---

### Task 4: Create post index page (`/post/index.html`)

The post listing page with horizontal scroll layout, sidebar, back button, and dynamically rendered post list.

**Files:**
- Create: `post/index.html`

**Step 1: Create `post/index.html`**

Follows the same `<head>` pattern as `index.html` (lines 1-48) but loads `post-style.css` and `post-script.js` instead of `script.js`. Does NOT load jQuery/modal (not needed). Does load Lenis (horizontal scroll).

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Posts — Edo Putra</title>

  <meta name="description" content="Thoughts on design, tools, process, and more by Edo Putra.">

  <link rel="icon" href="/assets/favicons/favicon.ico">
  <link rel="icon" type="image/png" sizes="96x96" href="/assets/favicons/favicon-96x96.png">
  <link rel="apple-touch-icon" href="/assets/favicons/apple-touch-icon.png">

  <meta property="og:title" content="Posts — Edo Putra">
  <meta property="og:description" content="Thoughts on design, tools, process, and more.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://edoputra.com/post/">
  <meta property="og:image" content="https://edoputra.com/assets/og/preview.jpg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Geist:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@200;400&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap">
  </noscript>

  <link rel="preload" href="/style.css" as="style">
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/post-style.css">

  <script src="https://unpkg.com/lenis@1.3.15/dist/lenis.min.js" defer></script>
</head>

<body>
  <aside class="sidebar-fixed" role="complementary">
    <div class="sidebar-clock" id="clock">— H00 M00 S00.0</div>
    <div class="sidebar-name" id="typewriter"></div>
  </aside>

  <main class="content-wrapper">
    <div class="section-break">
      <a href="/" class="back-button" aria-label="Back to home"></a>

      <h1 class="text-medium">I wrote something here.</h1>
    </div>

    <div class="section-break force-column">
      <div id="post-list" class="post-list"></div>
    </div>

    <div class="section-break force-column">
      <footer class="text-footer">2026<br>crafted by Edo Putra<br>Geist + Geist Mono</footer>
      <div class="divider"></div>
    </div>
  </main>

  <script src="/post-script.js" defer></script>
  <script>
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
    }
  </script>
</body>

</html>
```

**Step 2: Verify in browser**

Run: `python3 -m http.server 8000` from project root, open `http://localhost:8000/post/`

Check:
- Sidebar visible with clock and typewriter
- Back chevron (mirrored, pointing left) links to `/`
- "I wrote something here." heading
- "Hello, World" post listed with date and tags
- Horizontal scroll works on desktop
- Post item hover shows blue line fill right-to-left
- Footer visible

**Step 3: Commit**

```bash
git add post/index.html
git commit -m "add post index page with horizontal layout and dynamic post list"
```

---

### Task 5: Create post reader page (`/post/post.html`)

The individual post view — vertical, centered, minimal.

**Files:**
- Create: `post/post.html`

**Step 1: Create `post/post.html`**

Does NOT load Lenis (vertical scroll). Loads marked.js CDN for markdown parsing.

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Post — Edo Putra</title>

  <meta name="description" content="A post by Edo Putra.">

  <link rel="icon" href="/assets/favicons/favicon.ico">
  <link rel="icon" type="image/png" sizes="96x96" href="/assets/favicons/favicon-96x96.png">
  <link rel="apple-touch-icon" href="/assets/favicons/apple-touch-icon.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Geist:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@200;400&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap">
  </noscript>

  <link rel="preload" href="/style.css" as="style">
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/post-style.css">

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" defer></script>
</head>

<body class="post-reader">
  <a href="/post/" class="back-button-float" aria-label="Back to posts"></a>

  <article class="post-container">
    <h1 class="post-reader-title" id="post-title"></h1>
    <div class="post-reader-date" id="post-date"></div>
    <div class="divider"></div>

    <div class="post-reader-content" id="post-content"></div>

    <div class="divider"></div>
    <div class="post-reader-tags" id="post-tags"></div>
  </article>

  <script src="/post-script.js" defer></script>
</body>

</html>
```

**Step 2: Verify in browser**

Open `http://localhost:8000/post/post.html?slug=hello-world`

Check:
- No horizontal scroll — vertical layout
- No sidebar
- Floating back chevron (fixed top-left) links to `/post/`
- Title "Hello, World" rendered
- Date "Feb 24, 2026" rendered
- Markdown content rendered with proper h2, h3, lists
- Tags "#meta #first-post" at bottom
- Page title in tab: "Hello, World — Edo Putra"

Also check `http://localhost:8000/post/post.html?slug=nonexistent`:
- Shows "Post not found." message

**Step 3: Commit**

```bash
git add post/post.html
git commit -m "add post reader page with markdown rendering and vertical layout"
```

---

### Task 6: Add "Posts" to home navigation

Add a "Posts" link to the existing nav in `index.html`, placed as the first item before Resume.

**Files:**
- Modify: `index.html:133-152` (the `.button-wrap` section)

**Step 1: Add nav item**

In `index.html`, inside `.button-wrap` (line 133), insert a new `.nav-item` as the first child:

```html
<div class="nav-item">
  <a href="/post/" class="nav-link nav-animated">Posts</a>
</div>
```

So the full `.button-wrap` becomes:
```html
<div class="button-wrap">
  <div class="nav-item">
    <a href="/post/" class="nav-link nav-animated">Posts</a>
  </div>
  <div class="nav-item">
    <a href="#" class="nav-link nav-animated" id="resume-trigger">Resume</a>
  </div>
  <!-- ...existing items... -->
</div>
```

**Step 2: Verify in browser**

Open `http://localhost:8000/`

Check:
- "Posts" appears as first nav item
- Has animated text (letters slide up/down on hover)
- Has chevron that slides on hover
- Clicking navigates to `/post/`

**Step 3: Commit**

```bash
git add index.html
git commit -m "add Posts link to home navigation"
```

---

### Task 7: Final polish and verification

Cross-check everything works end-to-end, both desktop and mobile.

**Step 1: Full flow test (desktop)**

1. Open `http://localhost:8000/` — click "Posts" nav link
2. Arrives at `/post/` — horizontal scroll, sidebar, back button, post list
3. Click back chevron — returns to home
4. Go back to `/post/` — click "Hello, World" post
5. Arrives at `/post/post.html?slug=hello-world` — vertical layout, content rendered
6. Click floating back chevron — returns to `/post/`

**Step 2: Mobile test**

Resize browser to < 768px width (or use DevTools responsive mode):

1. Home: "Posts" nav visible, tappable
2. `/post/`: single column, vertical scroll, no sidebar, back button visible
3. `/post/post.html?slug=hello-world`: content readable, back button visible

**Step 3: Fix any issues found**

Address anything broken during testing.

**Step 4: Final commit (if any fixes)**

```bash
git add -A
git commit -m "polish: fix any issues from end-to-end testing"
```
