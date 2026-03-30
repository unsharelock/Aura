# Music Folder

Put your album subfolders here. Each subfolder = one album.

```
music/
├── My Album/
│   ├── cover.jpg          ← optional album art
│   ├── 01 - First Song.mp3
│   ├── 02 - Second Song.flac
│   └── 03 - Third Song.wav
├── Another Album/
│   └── song.mp3
└── manifest.json          ← auto-generated, DO NOT edit manually
```

After adding music, run from the project root:
```
node generate-manifest.js
```

Then refresh the browser — your music will appear automatically.
