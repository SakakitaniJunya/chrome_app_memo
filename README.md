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

## Cloud sync (PWA only)

The PWA build supports optional Google Sign-in + Firestore sync. Memos stay device-local until you sign in; after sign-in they sync to Firestore under `colason_users/{uid}/memos/{memoId}`. Existing local memos are migrated once on first sign-in.

The Chrome extension build is unaffected — it continues to use `chrome.storage.sync` only.

### Setup

1. Firebase Console → `yomi-note-app` project → **Project settings → Your apps → Add app → Web** → register an app named `colason`. Copy the config.
2. `cp web/.env.example web/.env` and fill in `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, etc.
3. Firebase Console → **Authentication → Sign-in method** → enable **Google**. Add `localhost` and your prod domain to the authorized domains.
4. Append the contents of `firestore.rules.colason` to the project's existing Firestore rules (yomi-note repo's `firestore.rules`) and re-deploy them. The block is additive and namespaced under `colason_users/`, so it does not affect yomi-note's existing collections.
5. Rebuild the PWA: `npm run build:web`.

If `VITE_FIREBASE_*` is not configured, the app silently runs in local-only mode (current behavior).

### Tenancy / data isolation

Colason data is fully namespaced — it never collides with yomi-note's own collections (`users`, `papers`, `terms`, `questions`, `reflections`, `feedbacks`, `drafts`). All reads/writes are gated by `request.auth.uid == uid` so other Google users cannot see your memos.

### Architecture notes

- `src/` — shared UI (memo list, rich editor, markdown renderer, theme, i18n).
- `src/hooks/use-chrome-storage.ts` — Chrome extension build: `chrome.storage.sync` only.
- `web/src/hooks/use-chrome-storage.ts` — PWA build override (selected via Vite alias): IndexedDB locally; Firestore + Google Sign-in when configured and signed-in.
- `web/src/lib/firebase.ts` — lazy Firebase init (auth + Firestore with persistent local cache). Returns `null` when env is unset.
- `web/src/lib/firestore-memos.ts` — CRUD + `onSnapshot` subscription against `colason_users/{uid}/memos`.
- `web/src/lib/migration.ts` — one-time IndexedDB → Firestore migration on first sign-in (idempotent via `migrationCompletedAt` flag).
- `src/lib/idb-store.ts` — minimal hand-written IndexedDB key-value store (no extra dep).
- `web/index.html`, `web/src/App.tsx`, `web/src/main.tsx` — PWA entry, app shell with `display_override: window-controls-overlay`.
- `web/public/manifest.webmanifest` — PWA manifest (standalone, WCO, icons, app shortcut).
- `web/public/sw.js` — service worker: precaches the app shell, network-first navigation, cache-first hashed assets.

The Chrome extension manifest (`manifest.json`) and entry pages (`popup.html`, `options.html`) are untouched.
