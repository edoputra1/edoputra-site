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
const crypto = require('crypto');

// --- Config ---
const SHOTS_DIR = path.join(__dirname, 'playground', 'shots');
const JSON_PATH = path.join(__dirname, 'playground', 'shots.json');
const MAX_SIZE_KB = 800; // warn above this; screenshots are best as ~2000px-wide JPG/WebP
const MAX_VIDEO_SIZE_KB = 8000; // videos: short, muted loops; ideally a few MB at most
const FILE_PATTERN = /\.(png|jpe?g|webp|gif|mp4|m4v)$/i;
const VIDEO_PATTERN = /\.(mp4|m4v)$/i;

// --- Video dimensions (MP4), read from the video track header (tkhd box) ---
function videoSize(buf) {
  // Walk boxes inside [start, end); descend into the containers that lead to tkhd
  const CONTAINERS = new Set(['moov', 'trak']);
  function walk(start, end) {
    let offset = start;
    while (offset + 8 <= end) {
      let size = buf.readUInt32BE(offset);
      const type = buf.toString('ascii', offset + 4, offset + 8);
      let header = 8;
      if (size === 1) {
        size = Number(buf.readBigUInt64BE(offset + 8));
        header = 16;
      } else if (size === 0) {
        size = end - offset;
      }
      if (size < header) return null;
      if (CONTAINERS.has(type)) {
        const found = walk(offset + header, offset + size);
        if (found) return found;
      } else if (type === 'tkhd') {
        const box = offset + header;
        const version = buf[box];
        const matrix = box + 4 + (version === 1 ? 32 : 20) + 16;
        const width = buf.readUInt32BE(matrix + 36) / 65536;
        const height = buf.readUInt32BE(matrix + 40) / 65536;
        if (width && height) {
          // Phone videos are often stored sideways with a 90° rotation
          const rotated = buf.readInt32BE(matrix) === 0;
          return rotated
            ? { width: Math.round(height), height: Math.round(width) }
            : { width: Math.round(width), height: Math.round(height) };
        }
      }
      offset += size;
    }
    return null;
  }
  return walk(0, buf.length);
}

// --- EXIF orientation tag (0x0112) from a JPEG's TIFF header at `tiff` ---
function exifOrientation(buf, tiff) {
  const little = buf.toString('ascii', tiff, tiff + 2) === 'II';
  const u16 = (o) => (little ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o) => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const ifd = tiff + u32(tiff + 4);
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return null;
}

// --- Image/video dimensions (PNG, JPEG, WebP, GIF, MP4), read from the file ---
function imageSize(file) {
  const buf = fs.readFileSync(file);

  if (VIDEO_PATTERN.test(file)) return videoSize(buf);

  // PNG: width/height in the IHDR chunk
  if (buf.toString('ascii', 1, 4) === 'PNG') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // GIF: logical screen size
  if (buf.toString('ascii', 0, 3) === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  // WebP: VP8 (lossy), VP8L (lossless) or VP8X (extended)
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') {
      return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    }
  }

  // JPEG: find the start-of-frame marker. Phone photos are often stored
  // sideways with an EXIF "rotate" flag that browsers apply, so apply it too.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    let orientation = 1;
    while (offset < buf.length) {
      if (buf[offset] !== 0xff) { offset++; continue; }
      const marker = buf[offset + 1];
      if (marker === 0xe1 && buf.toString('ascii', offset + 4, offset + 8) === 'Exif') {
        orientation = exifOrientation(buf, offset + 10) || 1;
      }
      const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSOF) {
        const width = buf.readUInt16BE(offset + 7);
        const height = buf.readUInt16BE(offset + 5);
        // Orientations 5-8 are rotated 90°, so the displayed shape is swapped
        return orientation >= 5 ? { width: height, height: width } : { width, height };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }

  return null;
}

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
  const data = fs.readFileSync(path.join(SHOTS_DIR, shot.file));
  shot.v = crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
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
