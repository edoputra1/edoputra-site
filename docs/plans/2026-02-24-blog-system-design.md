# Blog System Design — edoputra.com

## Overview

Add a blog/post system to the existing static portfolio site. Two new pages:
- `/post/` — post index (listing)
- `/post/post.html?slug=<slug>` — individual post reader

## Architecture

**Approach:** Two separate HTML pages (Approach A). No SPA, no build step. Stays aligned with the existing vanilla static architecture served via GitHub Pages.

## File Structure

```
edoputra-site/
├── post/
│   ├── index.html          # Post listing page (horizontal layout)
│   └── post.html           # Individual post reader (vertical layout)
├── posts/
│   ├── posts.json          # Manifest: slug, title, date, tags
│   └── my-first-post.md    # Markdown content files (one per post)
├── post-style.css          # Additional CSS for post pages
└── post-script.js          # JS for post pages
```

### Shared vs. New Assets

- `style.css` — shared by all pages (sidebar, footer, typography, animations, layout)
- `post-style.css` — post-specific additions (back button, post list items, post reader layout)
- `post-script.js` — post-specific JS (fetch posts.json, render list, fetch/parse markdown, sidebar clock + typewriter)
- `script.js` — NOT loaded on post pages (it contains home-specific logic: showreel, skill cards, SVG grid, nav animation, CTA animation)

### External Dependencies

- **marked.js** via CDN (~8kb) — markdown-to-HTML parsing for individual post pages

## Page 1: Post Index (`/post/index.html`)

### Layout

Mirrors home page: horizontal CSS columns, Lenis smooth scroll, sidebar with clock + typewriter, footer.

### Structure

```
<aside class="sidebar-fixed">           ← reused from home
<main class="content-wrapper">
  <div class="section-break">
    ├── Back button (mirrored chevron → links to /)
    ├── Heading: "I wrote something here." (.text-medium)
  </div>
  <div class="section-break force-column">
    ├── Post list (dynamically rendered from posts.json)
    │   └── Each post: title (link), date, tags, bottom border with hover animation
  </div>
  <div class="section-break force-column">
    ├── Footer (.text-footer)
  </div>
</main>
```

### Back Button

- Reuses existing chevron SVG (`M9 18L15 12L9 6`), mirrored with `transform: scaleX(-1)`
- Navigates to `/` (home)
- Styled similarly to nav links but simpler — just the chevron icon, no text animation
- Class: `.back-button`

### Post List Items

Each post item:
```html
<a href="/post/post.html?slug=<slug>" class="post-item">
  <div class="post-title">Post Title Here</div>
  <div class="post-meta">
    <span class="post-date">Feb 24, 2026</span>
    <span class="post-tags">
      <span class="text-tag">#design</span>
      <span class="text-tag">#ai</span>
    </span>
  </div>
</a>
```

Styling:
- Bottom border: `1px solid rgba(255, 255, 255, 0.12)`
- Hover: blue line fills right-to-left (reuse `::after` pattern from `.text-body ul li`)
- Post title: ~2rem, white
- Date: Geist Mono, 0.825rem, muted
- Tags: reuse `.text-tag` styling

### Sidebar & Footer

- Sidebar: identical to home (clock + typewriter)
- Footer: simplified — just the text footer, no SVG grid

## Page 2: Individual Post (`/post/post.html?slug=<slug>`)

### Layout

Completely different from home — vertical scroll, centered, minimal.

### Key Differences from Home

- **No horizontal scroll** — `overflow-y: auto`, `overflow-x: hidden`
- **No sidebar** — hidden
- **No Lenis** — standard browser vertical scroll
- **No CSS columns** — single centered container

### Structure

```
<body class="post-reader">
  <a href="/post/" class="back-button-float">‹ chevron</a>
  <article class="post-container">
    ├── Title (.post-reader-title)
    ├── Date (.post-reader-date)
    ├── Divider
    ├── Content (.post-reader-content) — rendered markdown
    ├── Divider
    └── Tags (.post-reader-tags)
  </article>
</body>
```

### Container

- `max-width: 800px`
- `margin: 0 auto`
- `padding: 10vh 2rem`
- All content left-aligned

### Floating Back Button

- `position: fixed`, top-left corner (~2rem from edges)
- Mirrored chevron SVG
- Links to `/post/`
- Subtle background on hover (same as nav-link hover)
- Class: `.back-button-float`

### Typography in Post Content

- Title: ~3rem, Geist, font-weight 400
- Date: Geist Mono, 0.825rem, muted `rgba(255, 255, 255, 0.5)`
- h1: 2.5rem
- h2: 2rem
- h3: 1.5rem
- Body/p: 1.25rem, line-height 1.75
- Code blocks: Geist Mono, background `rgba(255, 255, 255, 0.05)`, padding
- Images: `max-width: 100%`, `border-radius: 4px`
- Videos: `max-width: 100%`, `aspect-ratio: 16/9`
- Tags at bottom: `.text-tag` pills, same as index page

### Tag Placement

Tags appear at the **bottom** of the post, after the content, separated by a divider.

## Data Format

### `posts/posts.json`

```json
[
  {
    "slug": "my-first-post",
    "title": "My First Post",
    "date": "2026-02-24",
    "tags": ["design", "ai"]
  }
]
```

Sorted by date descending. The index page reads this to render the list. The post page reads this to get metadata, then fetches `/posts/<slug>.md` for content.

### `posts/<slug>.md`

Pure markdown content. No frontmatter — metadata is in posts.json.

```markdown
This is the intro paragraph.

## A Section

Body text with **bold** and *italic*.

![Alt text](/assets/img/some-image.jpg)
```

## Menu Integration

Add "Posts" nav item to `index.html` alongside existing nav links:

```html
<div class="nav-item">
  <a href="/post/" class="nav-link nav-animated">Posts</a>
</div>
```

Same animated text + chevron treatment. Placed as the first nav item (before Resume).

## Mobile Considerations

### Post Index (mobile)
- Same as home mobile: single column, vertical scroll
- Sidebar hidden (existing behavior)
- Back button stays visible

### Post Reader (mobile)
- Already vertical, so minimal changes needed
- Reduce padding: `padding: 5vh 5vw`
- Floating back button stays fixed

## Technical Notes

- No build step required — stays GitHub Pages compatible
- marked.js loaded via CDN only on post.html (not needed on index)
- Post list renders client-side from posts.json fetch
- Date formatting: JavaScript `toLocaleDateString` with options for "Feb 24, 2026" style
- URL pattern: `/post/post.html?slug=my-first-post`
- 404 handling: if slug not found in posts.json, show "post not found" message
