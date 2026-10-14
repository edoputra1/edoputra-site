#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// --- Config ---
const POSTS_DIR = path.join(__dirname, 'posts');
const JSON_PATH = path.join(POSTS_DIR, 'posts.json');

// --- Helpers ---
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// --- Args ---
const title = process.argv[2];
const tagsArg = process.argv[3];

if (!title) {
  console.log('\n  Usage: node new-post.js "Post Title" tag1,tag2,tag3 [--draft]\n');
  console.log('  Example: node new-post.js "Why I Left Figma" design,tools');
  console.log('  Example: node new-post.js "WIP Post" ideas --draft\n');
  process.exit(1);
}

const isDraft = process.argv.includes('--draft');
const slug = slugify(title);
const date = today();
const tags = tagsArg ? tagsArg.split(',').map(t => t.trim()).filter(Boolean) : [];

// --- Read existing posts ---
let posts = [];
try {
  posts = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
} catch {
  console.error('  ✗ Could not read posts.json');
  process.exit(1);
}

// --- Check for duplicates ---
if (posts.find(p => p.slug === slug)) {
  console.error(`\n  ✗ Slug "${slug}" already exists in posts.json\n`);
  process.exit(1);
}

const folderPath = path.join(POSTS_DIR, slug);
if (fs.existsSync(folderPath)) {
  console.error(`\n  ✗ Folder already exists: posts/${slug}/\n`);
  process.exit(1);
}

// --- Create folder + scaffold markdown ---
fs.mkdirSync(folderPath, { recursive: true });
fs.writeFileSync(
  path.join(folderPath, 'index.md'),
  `Start writing here.\n`
);

// --- Add to posts.json (newest first) ---
const entry = { slug, title, date, tags, draft: isDraft };
posts.unshift(entry);
posts.sort((a, b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(JSON_PATH, JSON.stringify(posts, null, 2) + '\n');

// --- Done ---
console.log(`
  ✓ Post created

  Title:  ${title}
  Slug:   ${slug}
  Date:   ${date}
  Tags:   ${tags.length ? tags.map(t => '#' + t).join(' ') : '(none)'}
  Draft:  ${isDraft ? 'yes (hidden from site)' : 'no (live)'}

  Folder: posts/${slug}/
  File:   posts/${slug}/index.md
  URL:    /post/#${slug}

  Next: write your post in posts/${slug}/index.md, then git push.
`);
