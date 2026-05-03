# Colason

Markdown memo app with Mermaid diagram support.

Two builds are shipped from this repo:

1. **Chrome / Edge extension** (`dist/`) — original popup + options page experience.
2. **Web Window (PWA)** (`web-dist/`) — installable as a standalone OS window, similar to LINE for PC.

The two builds share the same React component tree under `src/`. The PWA build adds an app shell (`web/`), a service worker, IndexedDB persistence, and a window-controls-overlay-friendly title bar.

## Setup

```bash
npm install
```

## Chrome extension build

```bash
npm run dev      # Vite dev server (extension popup HTML)
npm run build    # produces dist/ — load unpacked from Chrome
```

Output: `dist/manifest.json`, `dist/popup.html`, `dist/options.html`, `dist/assets/*`, `dist/images/*`.

## Web Window (PWA) build

```bash
npm run dev:web      # Vite dev server (http://localhost:5174)
npm run build:web    # produces web-dist/
npm run preview:web  # serve web-dist/ locally for install testing
```

Output: `web-dist/index.html`, `web-dist/manifest.webmanifest`, `web-dist/sw.js`, `web-dist/assets/*`, `web-dist/icons/*`.

### Install as a standalone window

1. `npm run build:web && npm run preview:web`
2. Open the printed URL in Chrome / Edge / Brave.
3. Address bar -> install icon ("Install Colason") or menu -> *Install Colason as app*.
4. The app launches in its own OS window. Closing the browser does not close it.
5. Memos persist locally in IndexedDB (per-device, not synced).

For a real deployment, host `web-dist/` on any HTTPS static origin (Cloudflare Pages, Netlify, GitHub Pages, etc.). Service workers require HTTPS or `localhost`.

### Keyboard shortcuts (PWA)

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl + N` | New memo |
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + K` | Link |

### Architecture notes

- `src/` — shared UI (memo list, rich editor, markdown renderer, theme, i18n).
- `src/hooks/use-chrome-storage.ts` — runtime-detects `chrome.storage.sync`; falls back to IndexedDB for the PWA build, then to `localStorage`.
- `src/lib/idb-store.ts` — minimal hand-written IndexedDB key-value store (no extra dep).
- `web/index.html`, `web/src/App.tsx`, `web/src/main.tsx` — PWA entry, app shell with `display_override: window-controls-overlay`.
- `web/public/manifest.webmanifest` — PWA manifest (standalone, WCO, icons, app shortcut).
- `web/public/sw.js` — service worker: precaches the app shell, network-first navigation, cache-first hashed assets.

The Chrome extension manifest (`manifest.json`) and entry pages (`popup.html`, `options.html`) are untouched.
