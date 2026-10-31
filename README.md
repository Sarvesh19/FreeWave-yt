# FreeWave

A free, ad-free browser music player built with Next.js. Search and stream full-length tracks from **YouTube** (via `yt-dlp`) or **Audius**, build playlists, and keep everything stored locally in your browser.

## Features

- **Two sources:** YouTube (Music charts + search) and Audius (trending + search)
- Full-length streaming, no ads from the app
- Queue with next/previous controls
- Create playlists and add/remove songs
- Playlists persist in `localStorage` (survive refresh, per-browser)
- Full player bar: play/pause, seek, volume, mute
- Zero tracking

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Zustand + `persist` (localStorage)
- Lucide React icons
- **yt-dlp** for YouTube search/charts/audio (server-side)
- **Audius API** for keyless music streaming

> The app hosts no music. YouTube audio is resolved server-side by `yt-dlp` and proxied through `/api/yt/stream`. Audius streams directly from their CDN.

## Prerequisites

`yt-dlp` must be installed on the machine/server running Next.js:

```bash
# macOS
brew install yt-dlp

# Linux / any OS with Python
pip install -U yt-dlp

# or download a binary and point to it:
export YTDLP_PATH=/path/to/yt-dlp
```

Audius needs no key or install.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Production build

```bash
npm run build
npm start
```

## Deployment notes (important)

- **Vercel:** Audius works out of the box. **YouTube will NOT work on Vercel serverless** because `yt-dlp` isn't available (and serverless limits long-running processes). The UI will show a helpful error; users can still use the Audius tab.
- **To get YouTube in production**, deploy to a host that runs a persistent Node process and lets you install `yt-dlp` — e.g. **Railway, Render, Fly.io, a VPS, or Docker**. The stream proxy fetches audio server-side, so it works regardless of the visitor's IP.
- The `yt-dlp` audio URL is cached in memory for 20 minutes and re-resolved automatically.

## API routes

```
/api/search        Audius search          (GET ?q=)
/api/trending      Audius trending        (GET)
/api/yt/search     YouTube search         (GET ?q=)
/api/yt/charts     YouTube Music Top 100  (GET)
/api/yt/stream     YouTube audio proxy    (GET ?id=VIDEOID, supports Range)
```

## Project structure

```
app/
  page.tsx            # Home: source switch, search, charts/trending, playlists
  layout.tsx          # Root layout
  globals.css         # Tailwind + base styles
  api/
    search/route.ts       # Audius search
    trending/route.ts     # Audius trending
    yt/search/route.ts    # YouTube search via yt-dlp
    yt/charts/route.ts    # YouTube Music Top 100 via yt-dlp
    yt/stream/route.ts    # YouTube audio proxy (Range-aware)
components/
  SearchBar.tsx
  SongCard.tsx
  Player.tsx
  PlaylistPanel.tsx
lib/
  audius.ts           # Audius helpers
  ytdlp.ts            # yt-dlp spawn helpers + URL cache
store/
  playerStore.ts      # Current song, queue, volume
  playlistStore.ts    # Playlists (persisted)
types/
  song.ts
  playlist.ts
```

## Notes

- Playlists are stored in `localStorage` under `freewave-playlists`; the chosen source under `freewave-source`. Clearing site data removes them.
- YouTube playback depends on `yt-dlp` keeping up with YouTube changes — run `yt-dlp -U` (or `brew upgrade yt-dlp`) if playback stops working.
