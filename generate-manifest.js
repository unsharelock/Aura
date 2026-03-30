/**
 * Aura Music Player — Manifest Generator
 * Run once after adding/changing music:
 *   node generate-manifest.js
 *
 * This scans the ./music folder, finds all albums (subfolders)
 * and audio tracks inside them, then writes music/manifest.json.
 */

const fs   = require('fs');
const path = require('path');

const MUSIC_DIR    = path.join(__dirname, 'music');
const MANIFEST_OUT = path.join(MUSIC_DIR, 'manifest.json');

const AUDIO_EXTS  = new Set(['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.opus', '.aiff', '.weba']);
const IMAGE_EXTS  = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const COVER_NAMES = new Set(['cover', 'folder', 'album', 'artwork', 'front', 'art']);

function cleanName(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/^\d+[\s.\-_]+/, '')
    .trim();
}

function findCover(files, albumFolderName) {
  // First look for explicitly named cover files
  for (const f of files) {
    const ext  = path.extname(f).toLowerCase();
    const base = path.basename(f, ext).toLowerCase();
    if (IMAGE_EXTS.has(ext) && COVER_NAMES.has(base)) return f;
  }
  // Fall back to any image
  for (const f of files) {
    if (IMAGE_EXTS.has(path.extname(f).toLowerCase())) return f;
  }
  return null;
}

if (!fs.existsSync(MUSIC_DIR)) {
  console.error('❌  ./music folder not found. Create it and add album subfolders inside.');
  process.exit(1);
}

const albums = [];
const entries = fs.readdirSync(MUSIC_DIR, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const albumName   = entry.name;
  const albumPath   = path.join(MUSIC_DIR, albumName);
  const albumFiles  = fs.readdirSync(albumPath);

  const audioFiles  = albumFiles
    .filter(f => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (audioFiles.length === 0) continue;

  const coverFile = findCover(albumFiles, albumName);

  albums.push({
    name:   albumName,
    cover:  coverFile ? `music/${albumName}/${coverFile}` : null,
    tracks: audioFiles.map(f => ({
      name: cleanName(f),
      file: `music/${albumName}/${f}`,
    })),
  });
}

albums.sort((a, b) => a.name.localeCompare(b.name));

const manifest = { generated: new Date().toISOString(), albums };
fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`✅  manifest.json written → ${albums.length} album(s), ${albums.reduce((s,a)=>s+a.tracks.length,0)} track(s)`);
albums.forEach(a => console.log(`   📀 ${a.name} (${a.tracks.length} tracks)${a.cover ? ' 🖼️' : ''}`));
