# 🎵 Aura Music Player

A premium, modern music player that runs 100% in your browser — no backend needed. Deployable to **GitHub Pages** in minutes.

---

## 🚀 How It Works

The app reads a `music/manifest.json` file that lists all your albums and tracks. This manifest is generated automatically — either locally or by GitHub Actions when you push new music.

```
music/
├── Album One/
│   ├── cover.jpg          ← optional album art
│   ├── 01 - First.mp3
│   └── 02 - Second.flac
├── Album Two/
│   └── song.wav
└── manifest.json          ← auto-generated, don't edit manually
```

---

## 🌐 GitHub Pages Setup (One Time)

1. Push this project to a **new GitHub repository**
2. Go to your repo → **Settings → Pages**
3. Under **Source**, select **"GitHub Actions"**
4. Done — GitHub handles everything from here on

---

## ➕ Adding Music (Normal Workflow)

Just add your album folders and push:

```bash
# 1. Drop album folders into music/
# 2. Push to GitHub
git add music/
git commit -m "Add new albums"
git push
```

GitHub Actions will automatically:
- Run `generate-manifest.js` → update `music/manifest.json`
- Deploy the updated app to GitHub Pages

> Your app is live at: `https://yourusername.github.io/your-repo/`

---

## 💻 Running Locally

```bash
# Generate the manifest first
node generate-manifest.js

# Then serve with any static server, e.g.:
npx serve .
# Open http://localhost:3000 in Chrome or Edge
```

> ⚠️ Must be served over HTTP (`localhost`) — not opened as a `file://` URL.

---

## 🎵 Supported Formats

`mp3` · `wav` · `flac` · `ogg` · `aac` · `m4a` · `opus` · `aiff`

> Chrome/Edge support all formats including FLAC. Add a `cover.jpg` (or `folder.jpg`, `artwork.jpg`) inside each album folder for cover art.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` / `←` | Seek ±10 seconds |
| `Shift+→` / `Shift+←` | Next / Previous track |
| `M` | Toggle mute |
| `S` | Toggle shuffle |

---

## ✨ Features

- 🎨 Glassmorphism UI with aurora background
- 📀 Album library with auto-detected cover art
- 📻 **Radio mode** — infinite shuffle of all songs, reshuffles automatically
- 🔀 Shuffle & repeat (off / one / all)
- 🎵 EQ animation + spinning disc in Radio mode
- 🤖 Auto-manifest via GitHub Actions — just push music and it updates itself
