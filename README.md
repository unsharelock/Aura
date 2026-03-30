# 🎵 Aura Music Player

A premium, modern music player web app that runs 100% in your browser — no server needed. Perfect for hosting on **GitHub Pages**.

---

## 🚀 Quick Start

1. **Open `index.html`** in Chrome or Edge (required for File System Access API)
2. Click **"Open Music Folder"**
3. Select your `music` directory

That's it — your albums will appear automatically!

---

## 📁 Folder Structure

```
music/
├── Album One/
│   ├── cover.jpg      ← optional album art (cover, folder, artwork, front)
│   ├── 01 - Song.mp3
│   ├── 02 - Song.flac
│   └── ...
├── Album Two/
│   ├── cover.png
│   └── ...
└── ...
```

- Each **subfolder** inside `music/` is treated as an **album**
- Songs are sorted by filename (use numbered prefixes like `01 -`, `02 -`)
- Album art is detected automatically if named `cover`, `folder`, `artwork`, `album`, `front`, or `art`

---

## 🎵 Supported Formats

| Format | Extension |
|--------|-----------|
| MP3    | `.mp3`    |
| WAV    | `.wav`    |
| FLAC   | `.flac`   |
| OGG    | `.ogg`    |
| AAC    | `.aac`    |
| M4A    | `.m4a`    |
| OPUS   | `.opus`   |
| AIFF   | `.aiff`   |

> **Note:** FLAC and AIFF support depends on your browser. Chrome supports FLAC natively.

---

## ✨ Features

- 🎨 **Beautiful glassmorphism UI** with aurora background animations
- 📀 **Album library** with grid view and cover art
- 🎙️ **Radio mode** — infinite shuffle of ALL songs, reshuffles after each full cycle
- ⌨️ **Keyboard shortcuts**: `Space` (play/pause), `→` (next), `←` (prev), `M` (mute), `S` (shuffle)
- 🔀 **Shuffle & repeat** (off / one / all)
- 🔊 **Volume control** with mute toggle
- 🎵 **Equalizer animation** while playing
- 💿 **Spinning disc** in radio mode

---

## 🌐 Deploy to GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Your app is live at `https://yourusername.github.io/your-repo/`

> **Important:** The File System Access API works on HTTPS (GitHub Pages) and `localhost`. It does **not** work on plain `file://` URLs opened directly in the browser — use a local server for development.

---

## 💻 Local Development

Run a local server (required for the File System API):

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code: use the "Live Server" extension
```

Then open `http://localhost:8080` in Chrome or Edge.

---

## 🛠️ Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 86+ | ✅ Full support |
| Edge 86+   | ✅ Full support |
| Firefox    | ❌ File System API not supported |
| Safari     | ⚠️ Partial (no FLAC) |

---

## 📝 License

MIT — free to use, modify, and deploy.
