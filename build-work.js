#!/usr/bin/env node

// Builds the work section from project folders.
//
//   node build-work.js
//
// Each project is a folder in work/ (the folder name is the URL):
//
//   work/air-selangor/
//     index.md      the case study, in markdown (images can be relative: ![](screen-1.jpg))
//     cover.jpg     cover image for the /work/ grid, the homepage hover and share previews
//                   (any of cover.jpg / cover.jpeg / cover.png / cover.webp)
//
// The script:
// - adds new project folders to the bottom of work/works.json (title from the folder name),
// - removes entries whose folder is gone,
// - keeps what you edited by hand: order, title, description, tags, link, draft,
// - reads the cover's size and fingerprint,
// - generates work/<slug>/index.html for every project (with its own title and share
//   preview), so the URL is edoputra.com/work/<slug>/,
// - records the size and fingerprint of every image in each project folder, so
//   case study images and galleries never jump while loading.
//
// In index.md, images on consecutive lines (no blank line between them) become a
// wide staggered gallery; an image on its own stays in the text column.
//
// Each project also gets a homepage marquee: small thumbnails (work/<slug>/thumbs/)
// of the first 5 images in index.md, stored as "strip" in works.json.
//
// Optional fields in works.json:
//   "marquee": ["a.webp", ...]  choose the marquee images yourself (any number)
//   "link": "https://..."  send visitors there instead of a case study page (e.g. a PDF)
//   "draft": true          keep the project off the site

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { imageSize, fingerprint } = require('./media-tools');

// --- Config ---
const SITE = 'https://edoputra.com';
const WORK_DIR = path.join(__dirname, 'work');
const JSON_PATH = path.join(WORK_DIR, 'works.json');
const COVER_NAMES = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp'];
const IMAGE_PATTERN = /\.(png|jpe?g|webp|gif)$/i;
const MARQUEE_COUNT = 5; // images in each project's homepage marquee
const THUMB_HEIGHT = 320; // px; marquee thumbnails (shown ~100-160px tall, sharp on retina)
const HAS_CWEBP = spawnSync('cwebp', ['-version']).status === 0;

// --- Helpers ---
const escapeHtml = (str = '') =>
  String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const titleFromSlug = (slug) =>
  slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

function findCover(slug) {
  return COVER_NAMES.find((name) => fs.existsSync(path.join(WORK_DIR, slug, name))) || null;
}

// Size + fingerprint of every image in a project folder, keyed by file name
function imageManifest(slug) {
  const manifest = {};
  fs.readdirSync(path.join(WORK_DIR, slug))
    .filter((file) => IMAGE_PATTERN.test(file))
    .sort()
    .forEach((file) => {
      const full = path.join(WORK_DIR, slug, file);
      const size = imageSize(full);
      if (size) manifest[file] = { ...size, v: fingerprint(full) };
      else warnings.push(`Couldn't read the size of ${slug}/${file}.`);
    });
  return manifest;
}

// --- Homepage marquee: small thumbnails of a project's images ---
// Uses the "marquee" list from works.json if you set one, otherwise the first
// MARQUEE_COUNT images referenced in the project's index.md. Thumbnails go in
// work/<slug>/thumbs/ and are only regenerated when the source image changes.
function markdownImages(slug) {
  const md = fs.readFileSync(path.join(WORK_DIR, slug, 'index.md'), 'utf-8');
  return [...md.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)]
    .map((m) => decodeURIComponent(m[1]))
    .filter((src) => !/^([a-z]+:)?\/\//i.test(src) && !src.startsWith('/'));
}

function marqueeStrip(slug, picks) {
  const dir = path.join(WORK_DIR, slug);
  const thumbsDir = path.join(dir, 'thumbs');
  const sources = (picks && picks.length ? picks : markdownImages(slug))
    .filter((file) => IMAGE_PATTERN.test(file) && fs.existsSync(path.join(dir, file)))
    .slice(0, picks && picks.length ? picks.length : MARQUEE_COUNT);

  if (!HAS_CWEBP && sources.length) {
    warnings.push(`cwebp not found, so ${slug}'s marquee uses full-size images (install with: brew install webp).`);
  }
  if (HAS_CWEBP && !fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir);

  const strip = sources.map((file) => {
    if (!HAS_CWEBP) return { file, ...imageSize(path.join(dir, file)) };
    const thumbName = `${file.replace(/\.[^.]+$/, '')}.webp`;
    const src = path.join(dir, file);
    const thumb = path.join(thumbsDir, thumbName);
    if (!fs.existsSync(thumb) || fs.statSync(thumb).mtimeMs < fs.statSync(src).mtimeMs) {
      execFileSync('cwebp', ['-quiet', '-resize', '0', String(THUMB_HEIGHT), '-q', '80', '-metadata', 'none', src, '-o', thumb]);
    }
    return { file: `thumbs/${thumbName}`, ...imageSize(thumb), v: fingerprint(thumb) };
  });

  // Remove thumbnails that are no longer used
  if (fs.existsSync(thumbsDir)) {
    const used = new Set(strip.map((s) => path.basename(s.file)));
    fs.readdirSync(thumbsDir).filter((f) => !used.has(f)).forEach((f) => fs.unlinkSync(path.join(thumbsDir, f)));
  }
  return strip;
}

// --- Read current list ---
let works = [];
if (fs.existsSync(JSON_PATH)) {
  try {
    works = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  } catch {
    console.error('\n  ✗ Could not read work/works.json (is it valid JSON?)\n');
    process.exit(1);
  }
}

// Project folders: any folder in work/ with an index.md (folders starting with
// "_" or "." are ignored, and aren't published by GitHub Pages either)
if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });
const folders = fs.readdirSync(WORK_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !/^[_.]/.test(d.name))
  .filter((d) => fs.existsSync(path.join(WORK_DIR, d.name, 'index.md')))
  .map((d) => d.name);
const folderSet = new Set(folders);

// --- Drop entries whose folder is gone; add new folders at the bottom ---
const removed = works.filter((w) => !folderSet.has(w.slug)).map((w) => w.slug);
works = works.filter((w) => folderSet.has(w.slug));
const known = new Set(works.map((w) => w.slug));
const added = folders.filter((slug) => !known.has(slug)).sort();
added.forEach((slug) => {
  works.push({ slug, title: titleFromSlug(slug), description: '', tags: [] });
});

// --- Cover size + fingerprint ---
const warnings = [];
works = works.map((work) => {
  const { cover: _oldCover, width: _w, height: _h, v: _v, strip: _strip, ...rest } = work;
  const entry = {
    slug: rest.slug,
    title: rest.title || titleFromSlug(rest.slug),
    description: rest.description || '',
    tags: Array.isArray(rest.tags) ? rest.tags : [],
    ...(rest.link ? { link: rest.link } : {}),
    ...(rest.draft ? { draft: true } : {}),
    ...(Array.isArray(rest.marquee) && rest.marquee.length ? { marquee: rest.marquee } : {}),
  };
  const cover = findCover(work.slug);
  if (cover) {
    const file = path.join(WORK_DIR, work.slug, cover);
    const size = imageSize(file);
    if (size) Object.assign(entry, { cover, ...size, v: fingerprint(file) });
    else warnings.push(`Couldn't read the size of ${work.slug}/${cover}.`);
  } else {
    warnings.push(`${work.slug} has no cover image (add cover.jpg to work/${work.slug}/).`);
  }
  if (!entry.description) warnings.push(`${work.slug} has no description yet (add it in work/works.json).`);
  entry.strip = marqueeStrip(work.slug, entry.marquee);
  return entry;
});

fs.writeFileSync(JSON_PATH, JSON.stringify(works, null, 2) + '\n');

// --- Generate a page per project ---
function projectPage(work) {
  const title = `${work.title} — Edo Putra`;
  const description = work.description || `${work.title}, a project by Edo Putra.`;
  const url = `${SITE}/work/${work.slug}/`;
  const image = work.cover
    ? `${SITE}/work/${work.slug}/${work.cover}?v=${work.v}`
    : `${SITE}/assets/og/preview.jpg`;
  const tags = work.tags.map((tag) => `<span class="text-tag">${escapeHtml(tag)}</span>`).join('\n        ');
  // Cover at the top of the case study; aspect-ratio reserves its space while it loads
  const cover = work.cover
    ? `<div class="work-page-cover" style="aspect-ratio: ${work.width} / ${work.height}">
      <img src="/work/${work.slug}/${work.cover}?v=${work.v}" alt="${escapeHtml(work.title)} cover" width="${work.width}" height="${work.height}">
    </div>`
    : '';

  return `<!DOCTYPE html>
<!-- Generated by build-work.js from work/works.json and work/${work.slug}/index.md. Don't edit by hand. -->
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>${escapeHtml(title)}</title>

  <meta name="description" content="${escapeHtml(description)}">

  <link rel="icon" href="/assets/favicons/favicon.ico">
  <link rel="icon" type="image/png" sizes="96x96" href="/assets/favicons/favicon-96x96.png">
  <link rel="apple-touch-icon" href="/assets/favicons/apple-touch-icon.png">

  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Geist:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@200;400&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap">
  </noscript>

  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/journal-style.css">
  <link rel="stylesheet" href="/work-style.css">
  <link rel="stylesheet" href="/image-zoom.css">

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" defer></script>
</head>

<body class="post-reader work-page">
  <a href="/work/" class="back-button-float" aria-label="Back to work"></a>

  <article class="post-container">
    <h1 class="post-reader-title">${escapeHtml(work.title)}</h1>
    ${work.description ? `<p class="work-page-description">${escapeHtml(work.description)}</p>` : ''}
    ${tags ? `<div class="work-page-tags">
        ${tags}
    </div>` : ''}
    ${cover}
    <div class="divider"></div>

    <div class="post-reader-content" id="post-content" data-src="/work/${work.slug}/index.md"></div>
  </article>

  <!-- Sizes of this project's images, so the layout is reserved before they load -->
  <script type="application/json" id="work-images">${JSON.stringify(imageManifest(work.slug)).replace(/</g, '\\u003c')}</script>

  <script src="/image-zoom.js" defer></script>
  <script src="/work-script.js" defer></script>
</body>

</html>
`;
}

const generated = [];
works.forEach((work) => {
  const file = path.join(WORK_DIR, work.slug, 'index.html');
  if (work.link || work.draft) {
    // No case study page: link elsewhere, or not published yet
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf-8').includes('Generated by build-work.js')) fs.unlinkSync(file);
    return;
  }
  fs.writeFileSync(file, projectPage(work));
  generated.push(work.slug);
});

// --- Summary ---
console.log(`
  ✓ work/works.json updated (${works.length} project${works.length === 1 ? '' : 's'})
`);
if (added.length) console.log(`  Added:   ${added.join(', ')}`);
if (removed.length) console.log(`  Removed: ${removed.join(', ')}`);
if (generated.length) console.log(`  Pages:   ${generated.map((slug) => `/work/${slug}/`).join(', ')}`);
warnings.forEach((w) => console.log(`  ! ${w}`));
console.log(`
  Next: preview locally, then git push.
`);
