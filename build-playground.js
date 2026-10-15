#!/usr/bin/env node

// Syncs playground/shots.json with the images and videos in playground/shots/.
//
//   node build-playground.js            new shots go to the top
//   node build-playground.js --bottom   new shots go to the bottom
//
// - New images are added to the top of the list (newest file first), with
//   their width/height read from the file so the grid never jumps on load.
//   Supported: PNG, JPG, WebP, GIF, and MP4 (muted looping video).
// - Images you deleted are removed from the list.
// - Anything you edited by hand (order, "hidden": true) is kept.
// - Each entry gets a "v" fingerprint of the file's contents, so replacing a
//   file under the same name shows the new version without clearing caches.

const fs = require('fs');
const path = require('path');
const { imageSize, fingerprint, VIDEO_PATTERN } = require('./media-tools');

// --- Config ---
const SHOTS_DIR = path.join(__dirname, 'playground', 'shots');
const JSON_PATH = path.join(__dirname, 'playground', 'shots.json');
const MAX_SIZE_KB = 800; // warn above this; screenshots are best as ~2000px-wide JPG/WebP
const MAX_VIDEO_SIZE_KB = 8000; // videos: short, muted loops; ideally a few MB at most
const FILE_PATTERN = /\.(png|jpe?g|webp|gif|mp4|m4v)$/i;

// --- Read current list ---
let shots = [];
if (fs.existsSync(JSON_PATH)) {
  try {
    shots = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  } catch {
    console.error('\n  ✗ Could not read playground/shots.json (is it valid JSON?)\n');
    process.exit(1);
  }
}

if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });
const files = fs.readdirSync(SHOTS_DIR).filter((f) => FILE_PATTERN.test(f));
const fileSet = new Set(files);

// --- Keep only the fields the page uses (drops old title/caption fields) ---
shots = shots.map(({ file, width, height, hidden }) => (hidden ? { file, width, height, hidden } : { file, width, height }));
// (the "v" fingerprint is recalculated below for every shot)

// --- Drop entries whose image is gone ---
const removed = shots.filter((s) => !fileSet.has(s.file)).map((s) => s.file);
shots = shots.filter((s) => fileSet.has(s.file));

// --- Refresh sizes of existing entries (in case an image was re-exported) ---
const warnings = [];
shots.forEach((shot) => {
  const size = imageSize(path.join(SHOTS_DIR, shot.file));
  if (size) Object.assign(shot, size);
});

// --- Add new images (newest file first) at the top, or the bottom with --bottom ---
const atBottom = process.argv.includes('--bottom');
const known = new Set(shots.map((s) => s.file));
const added = files
  .filter((f) => !known.has(f))
  .map((f) => ({ file: f, mtime: fs.statSync(path.join(SHOTS_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)
  .map(({ file }) => {
    const size = imageSize(path.join(SHOTS_DIR, file));
    if (!size) {
      warnings.push(`Couldn't read the size of ${file}; it was skipped.`);
      return null;
    }
    return { file, ...size };
  })
  .filter(Boolean);
shots = atBottom ? [...shots, ...added] : [...added, ...shots];

// --- Fingerprint each file's contents ("v"), used in its URL so a replaced
// file (same name, new content) is never served from an old cache ---
shots.forEach((shot) => {
  shot.v = fingerprint(path.join(SHOTS_DIR, shot.file));
});

// --- Size warnings ---
shots.forEach((shot) => {
  const kb = fs.statSync(path.join(SHOTS_DIR, shot.file)).size / 1024;
  const limit = VIDEO_PATTERN.test(shot.file) ? MAX_VIDEO_SIZE_KB : MAX_SIZE_KB;
  if (kb > limit) warnings.push(`${shot.file} is ${Math.round(kb)} KB; consider exporting it smaller.`);
});

fs.writeFileSync(JSON_PATH, JSON.stringify(shots, null, 2) + '\n');

// --- Summary ---
console.log(`
  ✓ playground/shots.json updated (${shots.length} shot${shots.length === 1 ? '' : 's'})
`);
if (added.length) console.log(`  Added:   ${added.map((s) => s.file).join(', ')}`);
if (removed.length) console.log(`  Removed: ${removed.join(', ')}`);
if (!added.length && !removed.length) console.log('  No new or removed images.');
warnings.forEach((w) => console.log(`  ! ${w}`));
console.log(`
  Next: preview locally, then git push.
`);
