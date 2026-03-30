/* ═══════════════════════════════════════════════
   AURA MUSIC PLAYER — app.js  (manifest edition)
   ═══════════════════════════════════════════════ */

'use strict';

// ── STATE ──────────────────────────────────────────────────────────────────
const state = {
  albums: [],          // loaded from manifest.json
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 0,       // 0=off 1=one 2=all
  isRadioMode: false,
  radioQueue: [],
  radioQueueIndex: -1,
  volume: 0.8,
  isMuted: false,
  currentView: 'library',
  currentAlbumIndex: null,
};

// ── DOM ────────────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const audio          = $('audio-engine');
const loadingScreen  = $('loading-screen');
const errorScreen    = $('error-screen');
const appScreen      = $('app-screen');
const loadingLabel   = $('loading-label');
const retryBtn       = $('retry-btn');
const sidebarToggle  = $('sidebar-toggle');
const sidebar        = document.querySelector('.sidebar');
const albumListEl    = $('album-list');
const albumsGrid     = $('albums-grid');
const libraryStats   = $('library-stats');
const trackListEl    = $('track-list');
const albumHeroTitle = $('album-hero-title');
const albumHeroMeta  = $('album-hero-meta');
const albumHeroArt   = $('album-hero-art');
const backBtn        = $('back-btn');

// Player bar
const playerTitle     = $('player-title');
const playerAlbum     = $('player-album');
const playerArt       = $('player-art');
const playerPlayBtn   = $('player-play-btn');
const playerPrevBtn   = $('player-prev-btn');
const playerNextBtn   = $('player-next-btn');
const playerShuffleBtn = $('player-shuffle-btn');
const playerRepeatBtn  = $('player-repeat-btn');
const playerProgress  = $('player-progress');
const playerCur       = $('player-cur');
const playerDur       = $('player-dur');
const playerVolBtn    = $('player-volume-btn');
const playerVolume    = $('player-volume');
const playerEq        = $('player-eq');

// Radio
const radioPlayBtn   = $('radio-play-btn');
const radioPrevBtn   = $('radio-prev-btn');
const radioNextBtn   = $('radio-next-btn');
const radioTitle     = $('radio-now-title');
const radioAlbumName = $('radio-album-name');
const radioProgress  = $('radio-progress');
const radioTimeCur   = $('radio-time-cur');
const radioTimeDur   = $('radio-time-dur');
const radioDisc      = $('radio-disc');
const radioEq        = $('radio-eq');
const radioQueue     = $('radio-queue');

// Views / nav
const navLibrary  = $('nav-library');
const navRadio    = $('nav-radio');
const viewLibrary = $('view-library');
const viewAlbum   = $('view-album');
const viewRadio   = $('view-radio');
const toastEl     = $('toast');

// ── UTILS ──────────────────────────────────────────────────────────────────
function fmtTime(sec) {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toast(msg, duration = 2800) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), duration);
}

function setProgressBarFill(input, pct) {
  const v = Math.max(0, Math.min(100, pct));
  input.style.background =
    `linear-gradient(to right, #a78bfa ${v}%, rgba(255,255,255,0.1) ${v}%)`;
}

// Returns the best available art for a track: per-song > album cover > null
function getTrackArt(track) {
  return track.cover || track.albumCover || null;
}

// ── SCREEN MANAGEMENT ──────────────────────────────────────────────────────
function showScreen(name) {
  loadingScreen.classList.toggle('active', name === 'loading');
  errorScreen.classList.toggle('active',   name === 'error');
  appScreen.classList.toggle('active',     name === 'app');
}

// ── MANIFEST LOADING ───────────────────────────────────────────────────────
async function loadManifest() {
  showScreen('loading');
  loadingLabel.textContent = 'Loading your music…';

  try {
    const res = await fetch('music/manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = await res.json();

    if (!manifest.albums || manifest.albums.length === 0) {
      throw new Error('No albums in manifest');
    }

    state.albums = manifest.albums;
    buildUI();
    showScreen('app');
    showView('library');
  } catch (err) {
    console.error('Failed to load manifest:', err);
    showScreen('error');
  }
}

// ── BUILD UI ───────────────────────────────────────────────────────────────
function buildUI() {
  buildSidebarAlbumList();
  buildAlbumsGrid();

  const totalTracks = state.albums.reduce((s, a) => s + a.tracks.length, 0);
  libraryStats.textContent = `${state.albums.length} album${state.albums.length !== 1 ? 's' : ''} · ${totalTracks} track${totalTracks !== 1 ? 's' : ''}`;

  buildRadioQueue();
}

function buildSidebarAlbumList() {
  albumListEl.innerHTML = '';
  state.albums.forEach((album, i) => {
    const item = document.createElement('div');
    item.className = 'album-list-item';
    item.dataset.index = i;
    item.innerHTML = `<div class="album-list-dot"></div><span>${album.name}</span>`;
    item.addEventListener('click', () => openAlbum(i));
    albumListEl.appendChild(item);
  });
}

function buildAlbumsGrid() {
  albumsGrid.innerHTML = '';
  state.albums.forEach((album, i) => {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.style.animationDelay = `${i * 0.05}s`;

    const artHtml = album.cover
      ? `<img src="${album.cover}" alt="${album.name}" loading="lazy" />`
      : defaultArtSVG(i);

    card.innerHTML = `
      <div class="album-card-art">
        ${artHtml}
        <div class="album-card-art-overlay">
          <div class="album-card-play-icon">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      </div>
      <div class="album-card-info">
        <div class="album-card-name">${album.name}</div>
        <div class="album-card-count">${album.tracks.length} track${album.tracks.length !== 1 ? 's' : ''}</div>
      </div>`;
    card.addEventListener('click', () => openAlbum(i));
    albumsGrid.appendChild(card);
  });
}

function defaultArtSVG(seed) {
  const colors = [
    ['#a78bfa', '#38bdf8'],
    ['#f472b6', '#a78bfa'],
    ['#38bdf8', '#34d399'],
    ['#fb923c', '#f472b6'],
    ['#818cf8', '#38bdf8'],
  ];
  const [c1, c2] = colors[seed % colors.length];
  return `<svg class="default-art-icon" viewBox="0 0 80 80" fill="none">
    <circle cx="40" cy="40" r="32" fill="url(#dg${seed})" opacity="0.2"/>
    <circle cx="40" cy="40" r="10" fill="url(#dg${seed})"/>
    <path d="M40 8v32M40 40v32M8 40h32M40 40h32" stroke="url(#dg${seed})" stroke-width="1.5" opacity="0.3"/>
    <defs><linearGradient id="dg${seed}" x1="8" y1="8" x2="72" y2="72" gradientUnits="userSpaceOnUse">
      <stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
  </svg>`;
}

// ── RADIO QUEUE ─────────────────────────────────────────────────────────────
function buildRadioQueue() {
  const all = [];
  state.albums.forEach(album => {
    album.tracks.forEach(track => all.push({ ...track, albumName: album.name, albumCover: album.cover }));
  });
  state.radioQueue = shuffle(all);
  state.radioQueueIndex = 0;
  renderRadioQueuePreview();
}

function renderRadioQueuePreview() {
  radioQueue.innerHTML = '';
  const start   = state.radioQueueIndex + 1;
  const preview = state.radioQueue.slice(start, start + 5);

  if (preview.length === 0) {
    radioQueue.innerHTML =
      '<div style="color:var(--text-muted);font-size:0.8rem;padding:8px 0">Queue will reshuffle after all songs play.</div>';
    return;
  }
  preview.forEach(track => {
    const item = document.createElement('div');
    item.className = 'radio-queue-item';
    item.innerHTML = `<span class="rq-title">${track.name}</span><span class="rq-album">${track.albumName}</span>`;
    radioQueue.appendChild(item);
  });
}

// ── VIEW MANAGEMENT ─────────────────────────────────────────────────────────
function showView(name, albumIndex) {
  viewLibrary.classList.remove('active-view');
  viewAlbum.classList.remove('active-view');
  viewRadio.classList.remove('active-view');
  navLibrary.classList.remove('active');
  navRadio.classList.remove('active');

  state.currentView = name;

  if (name === 'library') {
    viewLibrary.classList.add('active-view');
    navLibrary.classList.add('active');
    // Clear sidebar active states
    document.querySelectorAll('.album-list-item').forEach(el => el.classList.remove('active'));
  } else if (name === 'album' && albumIndex !== undefined) {
    viewAlbum.classList.add('active-view');
    renderAlbumView(albumIndex);
  } else if (name === 'radio') {
    viewRadio.classList.add('active-view');
    navRadio.classList.add('active');
  }
}

function openAlbum(i) {
  state.currentAlbumIndex = i;
  document.querySelectorAll('.album-list-item').forEach((el, idx) =>
    el.classList.toggle('active', idx === i));
  showView('album', i);
}

// ── ALBUM VIEW ──────────────────────────────────────────────────────────────
function renderAlbumView(i) {
  const album = state.albums[i];
  albumHeroTitle.textContent = album.name;
  albumHeroMeta.textContent  = `${album.tracks.length} track${album.tracks.length !== 1 ? 's' : ''}`;

  // Cover art
  const oldImg = albumHeroArt.querySelector('img');
  if (oldImg) oldImg.remove();
  const defaultArt = albumHeroArt.querySelector('.default-album-art');

  if (album.cover) {
    const img = document.createElement('img');
    img.src = album.cover;
    img.alt = album.name;
    albumHeroArt.appendChild(img);
    if (defaultArt) defaultArt.style.display = 'none';
  } else {
    if (defaultArt) defaultArt.style.display = '';
  }

  $('play-album-btn').onclick    = () => playAlbum(i, false);
  $('shuffle-album-btn').onclick = () => playAlbum(i, true);

  // Track list
  trackListEl.innerHTML = '';
  album.tracks.forEach((track, ti) => {
    const isNowPlaying =
      !state.isRadioMode &&
      state.currentTrack &&
      state.currentTrack.file === track.file;

    const item = document.createElement('div');
    item.className = 'track-item' + (isNowPlaying ? ' playing' : '');
    item.style.animationDelay = `${ti * 0.04}s`;
    item.innerHTML = `
      <div class="track-num-wrap">
        <span class="track-num">${ti + 1}</span>
        <span class="track-play-icon">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </span>
      </div>
      <div class="track-info">
        <div class="track-name">${track.name}</div>
        <div class="track-artist">${album.name}</div>
      </div>
      <span class="track-duration" id="tdur-${i}-${ti}">—</span>`;
    item.addEventListener('click', () => {
      state.isRadioMode = false;
      playAlbum(i, false, ti);
    });
    trackListEl.appendChild(item);
    prefetchDuration(track.file, `tdur-${i}-${ti}`);
  });
}

// Pre-fetch duration for display (without loading full audio)
const _durCache = {};
function prefetchDuration(fileUrl, elId) {
  if (_durCache[fileUrl]) {
    const el = document.getElementById(elId);
    if (el) el.textContent = _durCache[fileUrl];
    return;
  }
  const tmp = new Audio();
  tmp.preload = 'metadata';
  tmp.src = fileUrl;
  tmp.addEventListener('loadedmetadata', () => {
    _durCache[fileUrl] = fmtTime(tmp.duration);
    const el = document.getElementById(elId);
    if (el) el.textContent = _durCache[fileUrl];
    tmp.src = '';
  }, { once: true });
}

// ── PLAYBACK ────────────────────────────────────────────────────────────────
function buildQueue(albumIndex, startIndex, doShuffle) {
  const album = state.albums[albumIndex];
  const fullQueue = album.tracks.map((t, i) => ({
    ...t,
    albumName:  album.name,
    albumCover: album.cover,
    albumIndex,
    trackIndex: i,
  }));

  if (doShuffle) {
    const current = fullQueue[startIndex];
    const rest    = fullQueue.filter((_, i) => i !== startIndex);
    state.queue      = [current, ...shuffle(rest)];
    state.queueIndex = 0;
  } else {
    state.queue      = fullQueue;
    state.queueIndex = startIndex;
  }
}

function playAlbum(albumIndex, doShuffle, startIndex = 0) {
  state.isRadioMode = false;
  buildQueue(albumIndex, doShuffle ? startIndex : startIndex, doShuffle);
  playFromQueue(state.queueIndex);
}

function playFromQueue(idx) {
  if (idx < 0 || idx >= state.queue.length) return;
  state.queueIndex  = idx;
  state.currentTrack = state.queue[idx];
  loadAndPlay(state.currentTrack);
}

function loadAndPlay(track) {
  audio.src = track.file;
  audio.volume = state.isMuted ? 0 : state.volume;
  audio.load();

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      onPlaybackStarted(track);
    }).catch(err => {
      console.error('Playback error:', err);
      toast('Could not play track — format may not be supported.');
    });
  }
}

function onPlaybackStarted(track) {
  state.isPlaying = true;
  updatePlayButtons(true);
  updatePlayerBar(track);
  if (state.currentView === 'album' && state.currentAlbumIndex !== null) {
    renderAlbumView(state.currentAlbumIndex);
  }
  document.title = `${track.name} — Aura`;
  setEqActive(true);
}

// ── RADIO ───────────────────────────────────────────────────────────────────
function startRadio() {
  state.isRadioMode = true;
  if (state.radioQueue.length === 0) { toast('No tracks in radio queue.'); return; }
  playRadioTrack(state.radioQueueIndex);
}

function playRadioTrack(idx) {
  state.radioQueueIndex = idx;
  const track = state.radioQueue[idx];
  state.currentTrack = track;
  loadAndPlay(track);
  updateRadioNowPlaying(track);
  renderRadioQueuePreview();
}

function radioNext() {
  let next = state.radioQueueIndex + 1;
  if (next >= state.radioQueue.length) {
    state.radioQueue = shuffle(state.radioQueue);
    next = 0;
    toast('🔀 Queue reshuffled — playing again!');
  }
  playRadioTrack(next);
}

function radioPrev() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  const prev = Math.max(0, state.radioQueueIndex - 1);
  playRadioTrack(prev);
}

function updateRadioNowPlaying(track) {
  radioTitle.textContent    = track.name;
  radioAlbumName.textContent = `${track.albumName} · Infinite shuffle`;

  const discArt = $('radio-disc-art');
  const oldImg  = discArt.querySelector('img');
  if (oldImg) oldImg.remove();
  const svg = discArt.querySelector('svg');

  const art = getTrackArt(track);
  if (art) {
    const img = document.createElement('img');
    img.src = art;
    img.alt = track.name;
    discArt.appendChild(img);
    if (svg) svg.style.display = 'none';
  } else {
    if (svg) svg.style.display = '';
  }
}

// ── PLAYER UI ────────────────────────────────────────────────────────────────
function updatePlayButtons(playing) {
  [playerPlayBtn, radioPlayBtn].forEach(btn => {
    btn.querySelector('.icon-play').classList.toggle('hidden', playing);
    btn.querySelector('.icon-pause').classList.toggle('hidden', !playing);
  });
  radioDisc.classList.toggle('spinning', playing && state.isRadioMode);
}

function updatePlayerBar(track) {
  playerTitle.textContent = track.name;
  playerAlbum.textContent = track.albumName || '—';

  const oldImg = playerArt.querySelector('img');
  if (oldImg) oldImg.remove();
  const svg = playerArt.querySelector('svg');

  const art = getTrackArt(track);
  if (art) {
    const img = document.createElement('img');
    img.src = art;
    img.alt = track.name;
    playerArt.appendChild(img);
    if (svg) svg.style.display = 'none';
  } else {
    if (svg) svg.style.display = '';
  }
}

function setEqActive(active) {
  playerEq.classList.toggle('active', active);
  radioEq.classList.toggle('active', active && state.isRadioMode);
}

// ── AUDIO EVENTS ─────────────────────────────────────────────────────────────
audio.addEventListener('timeupdate', () => {
  if (!audio.duration || !isFinite(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;

  playerCur.textContent = fmtTime(audio.currentTime);
  setProgressBarFill(playerProgress, pct);
  playerProgress.value = pct;

  if (state.isRadioMode) {
    radioTimeCur.textContent = fmtTime(audio.currentTime);
    setProgressBarFill(radioProgress, pct);
    radioProgress.value = pct;
  }
});

audio.addEventListener('loadedmetadata', () => {
  playerDur.textContent = fmtTime(audio.duration);
  if (state.isRadioMode) radioTimeDur.textContent = fmtTime(audio.duration);
});

audio.addEventListener('ended', onTrackEnded);

audio.addEventListener('play', () => {
  state.isPlaying = true;
  updatePlayButtons(true);
  setEqActive(true);
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  updatePlayButtons(false);
  setEqActive(false);
  radioDisc.classList.remove('spinning');
});

function onTrackEnded() {
  if (state.isRadioMode) { radioNext(); return; }

  if (state.repeatMode === 1) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  const next = state.queueIndex + 1;
  if (next < state.queue.length) {
    playFromQueue(next);
  } else if (state.repeatMode === 2) {
    playFromQueue(0);
  } else {
    state.isPlaying = false;
    updatePlayButtons(false);
    document.title = 'Aura — Music Player';
    setEqActive(false);
  }
}

// ── CONTROLS ─────────────────────────────────────────────────────────────────
function togglePlay() {
  if (!state.currentTrack) {
    if (state.isRadioMode || state.currentView === 'radio') { startRadio(); return; }
    toast('Select a track or use Radio mode.');
    return;
  }
  audio.paused ? audio.play() : audio.pause();
}

function playNext() {
  if (state.isRadioMode) { radioNext(); return; }
  const next = state.queueIndex + 1;
  if (next < state.queue.length) playFromQueue(next);
  else if (state.repeatMode === 2) playFromQueue(0);
  else toast('End of queue.');
}

function playPrev() {
  if (state.isRadioMode) { radioPrev(); return; }
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  const prev = state.queueIndex - 1;
  if (prev >= 0) playFromQueue(prev);
}

function toggleShuffle() {
  state.isShuffle = !state.isShuffle;
  playerShuffleBtn.classList.toggle('active', state.isShuffle);
  if (state.isShuffle && !state.isRadioMode && state.currentTrack) {
    const cur  = state.queue[state.queueIndex];
    const rest = state.queue.filter((_, i) => i !== state.queueIndex);
    state.queue      = [cur, ...shuffle(rest)];
    state.queueIndex = 0;
  }
  toast(state.isShuffle ? '🔀 Shuffle on' : 'Shuffle off');
}

const repeatIcons = [
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="14" font-size="6" fill="currentColor" stroke="none" text-anchor="middle" dominant-baseline="middle">1</text></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
];

function toggleRepeat() {
  state.repeatMode = (state.repeatMode + 1) % 3;
  const labels = ['Repeat off', '🔂 Repeat one', '🔁 Repeat all'];
  toast(labels[state.repeatMode]);
  playerRepeatBtn.innerHTML = repeatIcons[state.repeatMode];
  playerRepeatBtn.style.color = state.repeatMode > 0 ? 'var(--accent-purple)' : '';
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  audio.volume  = state.isMuted ? 0 : state.volume;
  playerVolBtn.querySelector('.icon-vol-up').classList.toggle('hidden', state.isMuted);
  playerVolBtn.querySelector('.icon-vol-mute').classList.toggle('hidden', !state.isMuted);
  setProgressBarFill(playerVolume, state.isMuted ? 0 : state.volume * 100);
}

// ── EVENT LISTENERS ───────────────────────────────────────────────────────────
retryBtn.addEventListener('click', loadManifest);

sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

navLibrary.addEventListener('click', () => { state.isRadioMode = false; showView('library'); });
navRadio.addEventListener('click', () => {
  state.isRadioMode = true;
  showView('radio');
});

backBtn.addEventListener('click', () => showView('library'));

playerPlayBtn.addEventListener('click', togglePlay);
playerPrevBtn.addEventListener('click', playPrev);
playerNextBtn.addEventListener('click', playNext);
playerShuffleBtn.addEventListener('click', toggleShuffle);
playerRepeatBtn.addEventListener('click', toggleRepeat);
playerVolBtn.addEventListener('click', toggleMute);

radioPlayBtn.addEventListener('click', () => {
  if (!state.isPlaying && !state.currentTrack) {
    startRadio();
  } else if (state.isRadioMode) {
    togglePlay();
  } else {
    // Switch to radio
    state.isRadioMode = true;
    buildRadioQueue();
    startRadio();
  }
});
radioPrevBtn.addEventListener('click', radioPrev);
radioNextBtn.addEventListener('click', radioNext);

// Scrubber
function onScrub(e) {
  if (!audio.duration) return;
  audio.currentTime = (e.target.value / 100) * audio.duration;
}
playerProgress.addEventListener('input', onScrub);
radioProgress.addEventListener('input', onScrub);

// Volume
playerVolume.addEventListener('input', e => {
  state.volume = e.target.value / 100;
  audio.volume = state.isMuted ? 0 : state.volume;
  setProgressBarFill(playerVolume, e.target.value);
  if (state.volume > 0 && state.isMuted) toggleMute();
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  switch (e.key) {
    case ' ':
      e.preventDefault(); togglePlay(); break;
    case 'ArrowRight':
      e.preventDefault();
      if (e.shiftKey) playNext(); else audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (e.shiftKey) playPrev(); else audio.currentTime = Math.max(0, audio.currentTime - 10);
      break;
    case 'm': case 'M': toggleMute();    break;
    case 's': case 'S': toggleShuffle(); break;
  }
});

// ── INIT ──────────────────────────────────────────────────────────────────────
(function init() {
  setProgressBarFill(playerVolume, 80);
  setProgressBarFill(playerProgress, 0);
  setProgressBarFill(radioProgress, 0);
  audio.volume = state.volume;
  loadManifest();
})();
